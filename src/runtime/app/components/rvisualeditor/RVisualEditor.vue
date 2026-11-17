<script setup>
import { createVNode,computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch,render,resolveComponent,getCurrentInstance } from 'vue'

const appContext = getCurrentInstance()?.appContext
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { Extension, Node } from '@tiptap/core'
import { Plugin, PluginKey, NodeSelection } from '@tiptap/pm/state'
import { StarterKit } from '@tiptap/starter-kit'
import { TextStyle, Color } from '@tiptap/extension-text-style'
import { TextAlign } from '@tiptap/extension-text-align'
import { Highlight } from '@tiptap/extension-highlight'
import { Subscript } from '@tiptap/extension-subscript'
import { Superscript } from '@tiptap/extension-superscript'
import { TaskList, TaskItem } from '@tiptap/extension-list'
import { TableKit } from '@tiptap/extension-table'
import { Placeholder, CharacterCount } from '@tiptap/extensions'
import { Typography } from '@tiptap/extension-typography'
import { Suggestion } from '@tiptap/suggestion'
import { onClickOutside, useElementSize } from '@vueuse/core'
import createDOMPurify from 'dompurify'
import RVToolbar from './RVToolbar.vue'
import { z } from 'zod'
import { useI18n } from 'vue-i18n'
import RIcon from '../RIcon.vue'
import RModal from '../RModal.vue'
import RTooltip from '../RTooltip.vue'

defineOptions({ name: 'RVisualEditor' })

// =====================================================================================================
// Public API
// =====================================================================================================
const props = defineProps({
  modelValue: { type: [Object, String], default: null },
  api: { type: Object, default: null }, // reserved: document persistence arrives in M6 (inert today)
  uploadApi: { type: Object, default: null }, // { url, method, headers, fieldName, body, mapResponse, withCredentials }
  uploader: { type: Function, default: null }, // async (file, { onProgress(0..1), signal }) => ({ url })
  options: { type: Object, default: () => ({}) },
  extensions: { type: Array, default: () => [] },
  editable: { type: Boolean, default: undefined },
  placeholder: { type: String, default: "Type '/' for commands…" },
  theme: { type: String, default: undefined, validator: (v) => ['light', 'dark', 'system'].includes(v) },
  output: { type: String, default: 'json', validator: (v) => ['json', 'html', 'both'].includes(v) },
  allowedMedia: { type: Array, default: () => [] }, // subset of ['image','video','audio','file']; [] = all enabled kinds
  maxFileSize: { type: [Number, Object], default: null }, // bytes, or { image, video, audio, file }
  minHeight: { type: [Number, String], default: 480 },
  maxWidth: { type: [Number, String], default: 860 },
  autofocus: { type: [Boolean, String, Number], default: false },
  canvasOptions: { type: Object, default: () => ({}) }, // { width, height, background } — default design page
  designs: { type: Object, default: () => ({}) }, // { [imageUrl]: design } — reopen saved designs
})

const emit = defineEmits([
  'update:modelValue', 'update', 'change', 'save', 'error', 'focus', 'blur',
  'upload', 'media-select', 'object-select', 'object-transform', 'ready', 'design-saved',
])

// =====================================================================================================
// i18n: use vue-i18n when the host app provides it, otherwise fall back to the English literal.
// `t(key, fallback)` is always safe to call; `tKey(label)` derives a stable `rve_*` key from a label.
// =====================================================================================================
let i18n = null
try { i18n = useI18n() } catch { i18n = null }
const t = (key, fallback) => {
  try {
    if (i18n && typeof i18n.te === 'function' && i18n.te(key)) return i18n.t(key)
    if (i18n && typeof i18n.t === 'function') { const v = i18n.t(key); if (v && v !== key) return v }
  } catch { /* not translated */ }
  return fallback
}
const tKey = (label) => `rve_${String(label).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')}`
const tl = (label) => t(tKey(label), label)

// =====================================================================================================
// Constants and pure helpers
// =====================================================================================================
const SCHEMA_ID = 'rvisual.document'
const SCHEMA_VERSION = 1
const MB = 1024 * 1024
const DEFAULT_MAX = { image: 10 * MB, video: 100 * MB, audio: 25 * MB, file: 25 * MB }
const KINDS = ['image', 'video', 'audio', 'file']
const ALIGNS = ['left', 'center', 'right']
const MEDIA_MIME = {
  image: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif'],
  video: ['video/mp4', 'video/webm'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/ogg'],
  file: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
  ],
}
const EXT_MIME = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml', avif: 'image/avif',
  mp4: 'video/mp4', webm: 'video/webm', mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
  pdf: 'application/pdf', doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain', csv: 'text/csv',
}
const KIND_LABEL = { image: 'Image', video: 'Video', audio: 'Audio', file: 'File' }
const kindLabel = (k) => t(`rve_kind_${k}`, KIND_LABEL[k] ?? '')

// Font storage contract: the document stores the canonical family KEY only (e.g. "Georgia").
const DEFAULT_FONTS = [
  { key: 'System UI', group: 'Latin', stack: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' },
  { key: 'Inter', group: 'Latin', stack: 'Inter, system-ui, -apple-system, sans-serif' },
  { key: 'Roboto', group: 'Latin', stack: 'Roboto, Arial, Helvetica, sans-serif' },
  { key: 'Arial', group: 'Latin', stack: 'Arial, Helvetica, sans-serif' },
  { key: 'Verdana', group: 'Latin', stack: 'Verdana, Geneva, sans-serif' },
  { key: 'Georgia', group: 'Latin', stack: 'Georgia, "Times New Roman", serif' },
  { key: 'Times New Roman', group: 'Latin', stack: '"Times New Roman", Times, serif' },
  { key: 'Courier New', group: 'Latin', stack: '"Courier New", Courier, monospace' },
  { key: 'Noto Sans Khmer', group: 'Khmer', stack: '"Noto Sans Khmer", "Khmer OS", sans-serif' },
  { key: 'Kantumruy Pro', group: 'Khmer', stack: '"Kantumruy Pro", "Noto Sans Khmer", sans-serif' },
  { key: 'Battambang', group: 'Khmer', stack: 'Battambang, "Noto Sans Khmer", sans-serif' },
  { key: 'Hanuman', group: 'Khmer', stack: 'Hanuman, "Noto Sans Khmer", sans-serif' },
  { key: 'Nokora', group: 'Khmer', stack: 'Nokora, "Noto Sans Khmer", sans-serif' },
  { key: 'Siemreap', group: 'Khmer', stack: 'Siemreap, "Noto Sans Khmer", sans-serif' },
  { key: 'Suwannaphum', group: 'Khmer', stack: 'Suwannaphum, "Noto Sans Khmer", sans-serif' },
  { key: 'Koh Santepheap', group: 'Khmer', stack: '"Koh Santepheap", "Noto Sans Khmer", sans-serif' },
  { key: 'Kdam Thmor Pro', group: 'Khmer', stack: '"Kdam Thmor Pro", "Noto Sans Khmer", sans-serif' },
  { key: 'Bayon', group: 'Khmer', stack: 'Bayon, "Noto Sans Khmer", serif' },
  { key: 'Moul', group: 'Khmer', stack: 'Moul, "Noto Sans Khmer", serif' },
  { key: 'Khmer OS', group: 'Khmer', stack: '"Khmer OS", "Noto Sans Khmer", sans-serif' },
  { key: 'Khmer OS Battambang', group: 'Khmer', stack: '"Khmer OS Battambang", Battambang, "Noto Sans Khmer", sans-serif' },
  { key: 'Khmer OS Siemreap', group: 'Khmer', stack: '"Khmer OS Siemreap", Siemreap, "Noto Sans Khmer", sans-serif' },
  { key: 'Khmer OS Content', group: 'Khmer', stack: '"Khmer OS Content", "Noto Sans Khmer", sans-serif' },
]
const FAMILY_RE = /^[\w .\-]{1,64}$/
const SIZE_RE = /^\d{1,3}(\.\d{1,2})?(px|pt|em|rem)$/
const SPACING_RE = /^-?(\d{1,2}|\d{0,2}\.\d{1,3})(em|px)$/
const LINE_HEIGHT_RE = /^\d(\.\d{1,2})?$/
const COLOR_RE = /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%/]+\)|hsla?\([\d\s.,%/deg]+\))$/i

// Literal values taken from _color.scss (documents store literals, never CSS variables).
const TEXT_COLORS = [
  { name: 'Gray', value: '#858585' }, { name: 'Red', value: '#d11717' }, { name: 'Orange', value: '#ff8c42' },
  { name: 'Amber', value: '#e8a83e' }, { name: 'Green', value: '#28a745' }, { name: 'Cyan', value: '#06b6d4' },
  { name: 'Blue', value: '#0ea5e9' }, { name: 'Purple', value: '#692ace' }, { name: 'Pink', value: '#ec4899' },
]
const HIGHLIGHTS = [
  { name: 'Gray', value: '#9ca3af66' }, { name: 'Red', value: '#f8717166' }, { name: 'Orange', value: '#ff8c4266' },
  { name: 'Yellow', value: '#ffb34777' }, { name: 'Green', value: '#4ade8066' }, { name: 'Cyan', value: '#06b6d466' },
  { name: 'Blue', value: '#60a5fa66' }, { name: 'Purple', value: '#a855f766' }, { name: 'Pink', value: '#ec489966' },
]

const uid = () => (globalThis.crypto?.randomUUID?.() ?? `u${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`)
const clampWidth = (w) => Math.min(100, Math.max(10, Math.round(Number(w)) || 100))
const stripExt = (name) => String(name).replace(/\.[^.]+$/, '')
const fmtBytes = (n) => { const v = Number(n); return !Number.isFinite(v) || v <= 0 ? '' : v < 1024 ? `${Math.round(v)} B` : v < MB ? `${(v / 1024).toFixed(0)} KB` : `${(v / MB).toFixed(1)} MB` }
// ---- defensive input helpers: every external value is normalized before use -----------------------
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
const asArray = (v) => (Array.isArray(v) ? v : [])
const asStr = (v, fallback = '') => (typeof v === 'string' ? v : fallback)
const isFile = (f) => !!f && typeof f === 'object' && typeof f.name === 'string' && typeof f.size === 'number'
/** number (px) or a CSS length string; anything else falls back. */
const cssSize = (v, fallback) => {
  if (typeof v === 'number' && Number.isFinite(v) && v > 0) return `${v}px`
  if (typeof v === 'string' && /^\d+(\.\d+)?(px|rem|em|vh|vw|%)$/.test(v.trim())) return v.trim()
  return fallback
}
// chainable no-op so command chains are always safe when the editor is not ready
const noop = new Proxy(function noopFn() {}, { get: () => noop, apply: () => noop })

/** Only http(s)/relative URLs; blob: only when the host opted in (demos). Never data:/javascript:. */
function safeUrl(value, allowTemp = false) {
  if (typeof value !== 'string' || !value) return null
  try {
    const u = new URL(value, 'https://placeholder.invalid')
    if (u.protocol === 'http:' || u.protocol === 'https:') return value
    if (allowTemp && u.protocol === 'blob:') return value
  } catch { /* invalid */ }
  return null
}

let purify = null
function getPurify() {
  if (!import.meta.client) return null
  if (!purify) {
    purify = createDOMPurify(window)
    purify.addHook('afterSanitizeAttributes', (node) => {
      if (node.tagName === 'A' && node.getAttribute('target')) node.setAttribute('rel', 'noopener noreferrer')
    })
  }
  return purify
}
const sanitizeHTML = (html) => getPurify()?.sanitize(String(html), { ADD_ATTR: ['target', 'download', 'controls', 'preload'] }) ?? ''

async function sanitizeSvgFile(file) {
  const clean = getPurify()?.sanitize(await file.text(), { USE_PROFILES: { svg: true, svgFilters: true } })
  if (!clean) throw new Error(t('rve_svg_sanitize_error', 'This SVG could not be sanitized.'))
  return new File([clean], file.name, { type: 'image/svg+xml' })
}

function kindOfFile(file) {
  if (!isFile(file)) return null
  const type = file.type || EXT_MIME[String(file.name).split('.').pop()?.toLowerCase()] || ''
  for (const kind of KINDS) if (MEDIA_MIME[kind].includes(type)) return { kind, type }
  return null
}

/** XHR (not fetch) because fetch cannot report upload progress. */
async function xhrUpload1(file, cfg, { onProgress, signal }) {
  const headers = typeof cfg.headers === 'function' ? await cfg.headers() : (cfg.headers ?? {})
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const apiUrl = getUrl(cfg.url)
    xhr.open(cfg.method ?? 'POST', apiUrl)
    // xhr.open(cfg.method ?? 'POST', cfg.url)
    xhr.withCredentials = !!cfg.withCredentials
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v)
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(e.loaded / e.total) }
    xhr.onerror = () => reject(new Error(t('rve_network_error', 'Network error while uploading.')))
    xhr.onabort = () => reject(new DOMException('Aborted', 'AbortError'))
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) return reject(new Error(`${t('rve_upload_failed', 'Upload failed')} (HTTP ${xhr.status}).`))
      try {
        const json = JSON.parse(xhr.responseText)
        const mapped = cfg.mapResponse ? cfg.mapResponse(json) : json
        resolve({ url: mapped?.url ?? mapped?.data?.url ?? mapped?.location, ...mapped })
      } catch { reject(new Error(t('rve_upload_invalid_response', 'The upload endpoint returned an invalid response.'))) }
    }
    signal?.addEventListener('abort', () => xhr.abort())
    const form = new FormData()
    form.append(cfg.fieldName ?? 'file', file, file.name)
    for (const [k, v] of Object.entries(cfg.body ?? {})) form.append(k, v)
    xhr.send(form)
  })
}

// =====================================================================================================
// Options: per-key validation, 4-state feature flags (true | 'hidden' | 'disabled' | false)
// =====================================================================================================
const flag = z.union([z.boolean(), z.enum(['hidden', 'disabled'])])
const FEATURE_KEYS = [
  'toolbar', 'footer', 'history', 'wordCount', 'zoom', 'textFormatting', 'fonts', 'colors', 'headings', 'alignment', 'lists', 'blockquote',
  'indent', 'spacing', 'links', 'tables', 'codeBlock', 'divider', 'callout', 'typography',
  'slashMenu', 'bubbleMenu', 'blockHandle', 'dropFiles', 'media', 'images', 'videos', 'audio', 'files',
  'floatingMedia', 'shapes', 'drawing', 'canvas',
]
const PRESETS = {
  full: {},
  standard: { canvas: false, drawing: false, shapes: false, floatingMedia: false, typography: false },
  document: { canvas: false, drawing: false, shapes: false, floatingMedia: false, zoom: true, wordCount: true },
  comment: {
    footer: true, wordCount: false, zoom: false, fonts: false, colors: false, headings: false, alignment: false, lists: false,
    blockquote: false, indent: false, spacing: false, tables: false, codeBlock: false, divider: false, callout: false,
    typography: false, slashMenu: false, blockHandle: false, dropFiles: false, media: false, images: false, videos: false,
    audio: false, files: false, floatingMedia: false, shapes: false, drawing: false, canvas: false,
    appearance: 'notion', toolbarMode: 'compact',
  },
  minimal: {
    history: true, textFormatting: true, links: false, lists: false, headings: false, alignment: false, colors: false,
    fonts: false, spacing: false, indent: false, blockquote: false, tables: false, codeBlock: false, divider: false,
    callout: false, typography: false, bubbleMenu: false, blockHandle: false, slashMenu: false, footer: false, wordCount: false,
    zoom: false, dropFiles: false, media: false, images: false, videos: false, audio: false, files: false,
    appearance: 'notion', toolbarMode: 'compact',
  },
}
const PRESET_NAMES = Object.keys(PRESETS)
const optShape = {
  // Generic feature flags first, so the explicit config keys below can override the flag schema.
  ...Object.fromEntries(FEATURE_KEYS.map((k) => [k, flag])),
  preset: z.enum(PRESET_NAMES),
  theme: z.enum(['light', 'dark', 'system']),
  appearance: z.enum(['notion', 'paper']),
  toolbarMode: z.enum(['ribbon', 'compact']), // ribbon = Word-style tabs; compact = single-row (UEditor-style)
  editable: z.boolean(),
  emitDebounce: z.number().int().min(0).max(10000),
  allowBlobUrls: z.boolean(), // demos only: accept blob: URLs returned by an uploader
  // `fonts` is both a feature flag (true | 'hidden' | 'disabled' | false) and the font-list config.
  fonts: z.union([flag, z.array(z.object({ key: z.string().regex(FAMILY_RE), group: z.string().optional(), stack: z.string().optional() })).min(1)]),
  fontSizes: z.array(z.number().int().min(6).max(200)).min(1),
}
const OPT_DEFAULTS = {
  ...Object.fromEntries(FEATURE_KEYS.map((k) => [k, true])),
  preset: 'full', theme: 'system', appearance: 'paper', toolbarMode: 'ribbon', editable: true, emitDebounce: 300, allowBlobUrls: false,
  fonts: DEFAULT_FONTS, fontSizes: [10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48, 56, 64, 72, 96],
  wordCount: true,
  zoom: false,
}
const DEPENDS_ON = { images: 'media', videos: 'media', audio: 'media', files: 'media', dropFiles: 'media' }
const inherit = (parent, child) => {
  if (parent === false || child === false) return false
  if (parent === 'disabled' || child === 'disabled') return 'disabled'
  if (parent === 'hidden' || child === 'hidden') return 'hidden'
  return true
}
const toState = (v) => (v === true ? { register: true, visible: true, enabled: true }
  : v === 'hidden' ? { register: true, visible: false, enabled: true }
    : v === 'disabled' ? { register: false, visible: true, enabled: false }
      : { register: false, visible: false, enabled: false })
const warn = (...a) => { if (import.meta.dev) console.warn('[RVisualEditor]', ...a) }

function resolveOptions(raw, overrides) {
  const input = { ...(isObj(raw) ? raw : {}) }
  const preset = typeof input.preset === 'string' && input.preset in PRESETS ? input.preset : OPT_DEFAULTS.preset
  const merged = { ...OPT_DEFAULTS, ...PRESETS[preset] }
  if (overrides.editable !== undefined) input.editable = overrides.editable
  if (overrides.theme !== undefined) input.theme = overrides.theme
  for (const [key, value] of Object.entries(input)) {
    if (!(key in optShape)) { warn(`Unknown option "${key}" ignored.`); continue }
    const r = optShape[key].safeParse(value)
    if (r.success) merged[key] = r.data
    else warn(`Invalid option "${key}" (${r.error.issues[0]?.message}); using default.`)
  }
  // `fonts` is both a feature flag and the font-list config: keep `merged.fonts` as an array (so
  // `opts.fonts.find` is always safe) and remember an explicit flag value for the feature state.
  const fontFlag = Array.isArray(merged.fonts) ? undefined : merged.fonts
  if (fontFlag !== undefined) merged.fonts = OPT_DEFAULTS.fonts
  for (const [child, parent] of Object.entries(DEPENDS_ON)) merged[child] = inherit(merged[parent], merged[child])
  const stateOf = (key) => (key === 'fonts'
    ? (fontFlag !== undefined ? toState(fontFlag) : { register: true, visible: true, enabled: true })
    : toState(merged[key]))
  return Object.freeze({
    ...merged,
    features: Object.freeze(Object.fromEntries(FEATURE_KEYS.map((k) => [k, stateOf(k)]))),
  })
}
const opts = computed(() => resolveOptions(props.options, { editable: props.editable, theme: props.theme }))
const features = opts.value.features // extension-affecting flags are creation-time
const feat = computed(() => opts.value.features) // toolbar/menu visibility stays reactive
const on = (key) => features[key]?.register === true

// =====================================================================================================
// State
// =====================================================================================================
const root = ref(null)
const fileInput = ref(null)
const { width: rootWidth } = useElementSize(root)
const compact = computed(() => rootWidth.value > 0 && rootWidth.value < 720)
const tick = ref(0) // explicit re-render trigger for toolbar/menu state derived from the editor
// SSR-consistent initial value: derived from the model so server and client render the same first markup
const looksEmpty = (v) => {
  try {
    const c = isObj(v) && v.schema === SCHEMA_ID ? v.doc : (isObj(v) && 'json' in v ? v.json : v)
    if (typeof c === 'string') return !c.trim()
    if (Array.isArray(c)) return c.length === 0
    return !isObj(c) || !Array.isArray(c.content) || c.content.length === 0
  } catch { return true }
}
const docEmpty = ref(looksEmpty(props.modelValue))
const runtimeEditable = ref(null)
const isEditable = computed(() => runtimeEditable.value ?? opts.value.editable)
const dropping = ref(false)
const zoom = ref(100)
const uploading = ref(0) // uploads currently in flight
const toolbarRef = ref(null)
const mounted = ref(false) // client-only values are computed after mount so SSR and hydration markup match
const hostHasMode = ref(false)
// The host may toggle dark/light by adding a class to <html> or <body> after mount; track it live so the
// editor never gets stuck in the wrong mode. Falls back gracefully when there is no DOM (SSR).
const readHostMode = () => {
  if (!import.meta.client) return false
  const roots = [document.documentElement, document.body].filter(Boolean)
  return roots.some((el) => el.classList.contains('dark') || el.classList.contains('light'))
}
let hostModeObserver = null
function watchHostMode() {
  hostHasMode.value = readHostMode()
  if (typeof MutationObserver === 'undefined') return
  hostModeObserver = new MutationObserver(() => { hostHasMode.value = readHostMode() })
  const watch = { attributes: true, attributeFilter: ['class'] }
  if (document.documentElement) hostModeObserver.observe(document.documentElement, watch)
  if (document.body) hostModeObserver.observe(document.body, watch)
}
const notice = ref('')
let noticeTimer = null
let bumpRaf = 0
let readyEmitted = false
const bump = () => {
  if (bumpRaf) return
  bumpRaf = requestAnimationFrame(() => {
    bumpRaf = 0
    tick.value++
    const e = any()
    if (e) { try { docEmpty.value = e.isEmpty } catch { /* state not ready */ } }
    if (!readyEmitted && live()) { readyEmitted = true; emit('ready', { editor: live() }) }
  })
}
function showNotice(message) {
  notice.value = message
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => { notice.value = '' }, 5000)
}
// Tiptap 3 only exposes `editor.view` after EditorContent has mounted it (never on the server): reading it earlier throws.
// live() = editor with a mounted view (safe for commands/DOM work); any() = editor whose state exists (safe for reads).
const any = () => {
  const e = editor.value
  return e && !e.isDestroyed ? e : null
}
const live = () => {
  const e = any()
  if (!e) return null
  try { return e.view?.dom ? e : null } catch { return null }
}
const act = (...a) => { try { return any()?.isActive(...a) ?? false } catch { return false } }
const attrs = (name) => { try { return any()?.getAttributes(name) ?? {} } catch { return {} } }

// =====================================================================================================
// Extensions: typography (inline + block), callout, media (with vanilla-DOM NodeView), slash menu
// =====================================================================================================
const RVTextStyle = Extension.create({
  name: 'rvTextStyle',
  addGlobalAttributes() {
    const stacks = Array.isArray(opts.value.fonts) ? opts.value.fonts : []
    const attributes = {}
    if (on('fonts')) {
      attributes.fontFamily = {
        default: null,
        parseHTML: (el) => { const f = (el.style.fontFamily || '').split(',')[0].trim().replace(/^["']|["']$/g, ''); return f && FAMILY_RE.test(f) ? f : null },
        renderHTML: (a) => {
          if (!a.fontFamily || !FAMILY_RE.test(a.fontFamily)) return {}
          const stack = stacks.find((f) => f.key === a.fontFamily)?.stack ?? `"${a.fontFamily}", sans-serif`
          return { style: `font-family: ${stack}` }
        },
      }
      attributes.fontSize = {
        default: null,
        parseHTML: (el) => (SIZE_RE.test(el.style.fontSize) ? el.style.fontSize : null),
        renderHTML: (a) => (SIZE_RE.test(a.fontSize ?? '') ? { style: `font-size: ${a.fontSize}` } : {}),
      }
    }
    if (on('spacing')) {
      attributes.letterSpacing = {
        default: null,
        parseHTML: (el) => (SPACING_RE.test(el.style.letterSpacing) ? el.style.letterSpacing : null),
        renderHTML: (a) => (SPACING_RE.test(a.letterSpacing ?? '') ? { style: `letter-spacing: ${a.letterSpacing}` } : {}),
      }
    }
    return [{ types: ['textStyle'], attributes }]
  },
  addCommands() {
    const set = (attr, test) => (value) => ({ chain }) => (value && test(String(value)) ? chain().setMark('textStyle', { [attr]: String(value) }).run() : false)
    const unset = (attr) => () => ({ chain }) => chain().setMark('textStyle', { [attr]: null }).removeEmptyTextStyle().run()
    const c = {}
    if (on('fonts')) Object.assign(c, { setFontFamily: set('fontFamily', (v) => FAMILY_RE.test(v)), unsetFontFamily: unset('fontFamily'), setFontSize: set('fontSize', (v) => SIZE_RE.test(v)), unsetFontSize: unset('fontSize') })
    if (on('spacing')) Object.assign(c, { setLetterSpacing: set('letterSpacing', (v) => SPACING_RE.test(v)), unsetLetterSpacing: unset('letterSpacing') })
    return c
  },
})

const RVBlockStyle = Extension.create({
  name: 'rvBlockStyle',
  addGlobalAttributes() {
    const attributes = {}
    if (on('spacing')) {
      attributes.lineHeight = {
        default: null,
        parseHTML: (el) => (LINE_HEIGHT_RE.test(el.style.lineHeight) ? el.style.lineHeight : null),
        renderHTML: (a) => (LINE_HEIGHT_RE.test(a.lineHeight ?? '') ? { style: `line-height: ${a.lineHeight}` } : {}),
      }
    }
    if (on('indent')) {
      attributes.indent = {
        default: 0,
        parseHTML: (el) => { const n = parseInt(el.getAttribute('data-indent') ?? '0', 10); return Number.isInteger(n) && n >= 0 && n <= 8 ? n : 0 },
        renderHTML: (a) => { const n = Number.isInteger(a.indent) ? Math.min(Math.max(a.indent, 0), 8) : 0; return n > 0 ? { 'data-indent': n, style: `margin-left: ${n * 2}em` } : {} },
      }
    }
    return [{ types: ['paragraph', 'heading'], attributes }]
  },
  addCommands() {
    const types = ['paragraph', 'heading']
    const c = {}
    if (on('spacing')) {
      c.setLineHeight = (v) => ({ state, commands }) => (LINE_HEIGHT_RE.test(String(v)) ? types.filter((t) => state.schema.nodes[t]).map((t) => commands.updateAttributes(t, { lineHeight: String(v) })).some(Boolean) : false)
      c.unsetLineHeight = () => ({ state, commands }) => types.filter((t) => state.schema.nodes[t]).map((t) => commands.resetAttributes(t, 'lineHeight')).some(Boolean)
    }
    if (on('indent')) {
      const shift = (delta) => ({ state, tr, dispatch }) => {
        let changed = false
        state.doc.nodesBetween(state.selection.from, state.selection.to, (node, pos) => {
          if (!types.includes(node.type.name)) return true
          const cur = Number.isInteger(node.attrs.indent) ? node.attrs.indent : 0
          const next = Math.min(8, Math.max(0, cur + delta))
          if (next !== cur) { changed = true; if (dispatch) tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: next }) }
          return false
        })
        return changed
      }
      c.indent = () => shift(1)
      c.outdent = () => shift(-1)
    }
    return c
  },
  addKeyboardShortcuts() {
    if (!on('indent')) return {}
    return { 'Mod-]': () => (this.editor.commands.indent(), true), 'Mod-[': () => (this.editor.commands.outdent(), true) }
  },
})

const TONES = ['info', 'warning', 'success']
const RVCallout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,
  addAttributes() { return { tone: { default: 'info' } } },
  parseHTML() {
    return [{ tag: 'div[data-rv-callout]', getAttrs: (el) => ({ tone: TONES.includes(el.getAttribute('data-rv-callout')) ? el.getAttribute('data-rv-callout') : 'info' }) }]
  },
  renderHTML({ node }) {
    return ['div', { 'data-rv-callout': TONES.includes(node.attrs.tone) ? node.attrs.tone : 'info', class: 'rv-callout' }, 0]
  },
})

// ---- media block: image | video | audio | file (one atom node, vanilla-DOM NodeView) -----------------
const pending = new Map() // uploadId -> { file, kind, controller }
const mediaCtx = {
  views: new Map(), // uploadId -> { setProgress }
  onFiles: (files) => insertFiles(files),
  onRetry: (id) => retryUpload(id),
  canRetry: (id) => pending.has(id),
  onRemoved: (a) => { if (a.uploadId) { pending.get(a.uploadId)?.controller?.abort(); pending.delete(a.uploadId) } },
  onSelect: (a) => emit('media-select', { kind: a.kind, src: a.src, alt: a.alt, caption: a.caption }),
}

const svg = (inner) => `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`
const ICONS = {
  left: svg('<line x1="21" x2="3" y1="6" y2="6"/><line x1="15" x2="3" y1="12" y2="12"/><line x1="17" x2="3" y1="18" y2="18"/>'),
  center: svg('<line x1="21" x2="3" y1="6" y2="6"/><line x1="17" x2="7" y1="12" y2="12"/><line x1="19" x2="5" y1="18" y2="18"/>'),
  right: svg('<line x1="21" x2="3" y1="6" y2="6"/><line x1="21" x2="9" y1="12" y2="12"/><line x1="21" x2="7" y1="18" y2="18"/>'),
  trash: svg('<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'),
  file: svg('<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>'),
  download: svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>'),
  preview: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>'),
  copy: svg('<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>'),
  rename: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>'),
  alert: svg('<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>'),
  retry: svg('<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>'),
  design: svg('<circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.7 0-.4-.2-.8-.4-1.1-.3-.3-.4-.7-.4-1.1a1.6 1.6 0 0 1 1.7-1.7h2C18.6 16.4 21 14 21 11c0-5-4.5-9-9-9Z"/>'),
  floatLeft: svg('<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/>'),
  floatRight: svg('<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M15 3v18"/>'),
  size: svg('<path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M14 15H9v-5"/><path d="M16 3h5v5"/><path d="M21 3l-7 7"/>'),
}
// Media editing constants (shared by the media NodeView).
const MEDIA_LAYOUTS = ['float-left', 'float-right']
const RESIZE_DIRS = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']
const RESIZE_HANDLES = { image: RESIZE_DIRS, video: ['nw', 'ne', 'se', 'sw', 'w', 'e'] }
const LAYOUT_CSS = { 'float-left': 'float:left;margin:0 1rem .5rem 0;max-width:60%', 'float-right': 'float:right;margin:0 0 .5rem 1rem;max-width:60%' }
// Reads a pixel number from an inline style string, e.g. pxValue('height:120px', 'height') -> 120.
const pxValue = (style, prop) => {
  const m = typeof style === 'string' ? style.match(new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*(-?\\d+(?:\\.\\d+)?)px`)) : null
  return m ? Math.round(Number(m[1])) : null
}
// A single floating menu shared by every media bar (only one open at a time).
let barMenuEl = null
function closeBarMenu() {
  if (!barMenuEl) return
  barMenuEl.remove()
  barMenuEl = null
  document.removeEventListener('pointerdown', onBarMenuOutside, true)
  window.removeEventListener('scroll', closeBarMenu, true)
}
function onBarMenuOutside(e) { if (barMenuEl && !barMenuEl.contains(e.target)) closeBarMenu() }
function openBarMenu(anchor, items) {
  closeBarMenu()
  const menu = h('div', 'rv-media__menu', { role: 'menu' })
  for (const it of items) {
    const btn = h('button', 'rv-media__menu-item', { type: 'button', role: 'menuitem' })
    btn.textContent = it.label
    if (it.active) btn.classList.add('is-active')
    btn.addEventListener('click', () => { closeBarMenu(); it.onClick() })
    menu.append(btn)
  }
  document.body.append(menu)
  const r = anchor.getBoundingClientRect()
  menu.style.top = `${r.bottom + 4}px`
  menu.style.left = `${Math.max(8, Math.min(r.left, window.innerWidth - menu.offsetWidth - 8))}px`
  barMenuEl = menu
  setTimeout(() => document.addEventListener('pointerdown', onBarMenuOutside, true), 0)
  window.addEventListener('scroll', closeBarMenu, true)
}

const h = (tag, cls, attrsObj = {}) => {
  const n = document.createElement(tag)
  if (cls) n.className = cls
  for (const [k, v] of Object.entries(attrsObj || {})) n.setAttribute(k, v)
  return n
}

function createMediaView({ node: initial, getPos, editor: ed }) {
  let node = initial
  const dom = h('div', 'rv-media')
  const figure = h('figure', 'rv-media__figure')
  const body = h('div', 'rv-media__body')
  const bar = h('div', 'rv-media__bar', { 'data-rv-interactive': '', role: 'toolbar', 'aria-label': t('rve_media_options', 'Media options') })
  const caption = h('input', 'rv-media__caption', { type: 'text', placeholder: t('rve_write_caption', 'Write a caption…'), 'aria-label': t('rve_caption', 'Caption'), 'data-rv-interactive': '' })
  const badge = h('div', 'rv-media__badge', { 'aria-hidden': 'true' })
  const handles = {}
  for (const dir of RESIZE_DIRS) handles[dir] = h('div', `rv-media__resize rv-media__resize--${dir}`, { 'data-rv-interactive': '', 'aria-hidden': 'true', 'data-dir': dir })
  figure.append(body, bar, badge, ...RESIZE_DIRS.map((d) => handles[d]), caption)
  dom.append(figure)
  let progressEl = null
  let progressLabel = null

  const patch = (a) => {
    const pos = getPos()
    if (typeof pos !== 'number') return
    ed.view.dispatch(ed.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...a }))
  }
  const remove = () => {
    const pos = getPos()
    if (typeof pos === 'number') ed.view.dispatch(ed.state.tr.delete(pos, pos + node.nodeSize))
  }
  const button = (icon, label, onClick, text) => {
    const b = h('button', 'rv-media__btn', { type: 'button', title: label, 'aria-label': label })
    if (text) b.textContent = text
    else b.innerHTML = icon
    b.addEventListener('mousedown', (e) => e.preventDefault())
    b.addEventListener('click', (e) => { e.stopPropagation(); onClick() })
    return b
  }
  
  const setProgress = (p) => {
    if (progressEl) progressEl.style.width = `${Math.round(p * 100)}%`
    if (progressLabel) progressLabel.textContent = `${Math.round(p * 100)}%`
  }
  const register = () => { if (node.attrs.uploadId) mediaCtx.views.set(node.attrs.uploadId, { setProgress }) }

  const columnWidth = () => dom.parentElement?.clientWidth || dom.getBoundingClientRect().width || 1
  const downloadMedia = () => {
    const src = safeUrl(node.attrs.src, opts.value.allowBlobUrls)
    if (!src) return
    const link = document.createElement('a')
    link.href = src
    link.download = node.attrs.filename || node.attrs.alt || ''
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    link.click()
  }
  const previewMedia = () => {
    const src = safeUrl(node.attrs.src, opts.value.allowBlobUrls)
    if (src) window.open(src, '_blank', 'noopener,noreferrer')
  }
  const copyMediaLink = async () => {
    const src = safeUrl(node.attrs.src, opts.value.allowBlobUrls)
    if (!src) return
    try {
      await navigator.clipboard.writeText(src)
      showNotice(t('rve_link_copied', 'Link copied to clipboard.'))
    } catch {
      showNotice(t('rve_copy_link_failed', 'Could not copy the link.'))
    }
  }
  const renameMedia = () => {
    const current = node.attrs.filename || node.attrs.alt || ''
    const value = window.prompt(t('rve_file_name_prompt', 'File name'), current)
    if (value === null) return
    const name = value.trim().slice(0, 200)
    if (name && name !== current) patch({ filename: name })
  }
  // Swap the file behind this node, keeping its size / layout / caption.
  const replaceMedia = () => {
    const kind = node.attrs.kind
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = (MEDIA_MIME[kind] ?? []).join(',')
    input.addEventListener('change', () => {
      const file = input.files?.[0]
      if (!file) return
      const v = validateFile(file)
      if (v.error) { showNotice(v.error); emit('error', { source: 'media', code: v.code, file, error: new Error(v.error) }); return }
      const pos = getPos()
      if (typeof pos !== 'number') return
      const uploadId = uid()
      ed.view.dispatch(ed.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, kind: v.kind, status: 'uploading', uploadId, filename: file.name, size: file.size, mime: v.type, error: '' }))
      startUpload({ file, kind: v.kind, uploadId })
    })
    input.click()
  }
  const sizeItems = () => {
    const col = columnWidth()
    const items = [25, 50, 75, 100].map((p) => ({ label: `${p}% ${t('rve_of_column', 'of column')}`, active: clampWidth(node.attrs.width) === p, onClick: () => patch({ width: p, height: null }) }))
    items.push({ label: t('rve_size_original', 'Original size'), onClick: () => {
      const el = body.querySelector('img,video')
      const natural = el?.naturalWidth || el?.videoWidth
      if (natural) patch({ width: clampWidth((Math.min(natural, col) / col) * 100), height: null })
    } })
    items.push({ label: t('rve_size_reset', 'Reset size'), onClick: () => patch({ width: 100, height: null }) })
    return items
  }

  function renderBody() {
    const a = node.attrs
    body.replaceChildren()
    progressEl = progressLabel = null
    if (a.status === 'uploading') {
      const box = h('div', 'rv-media__state')
      const label = h('div', 'rv-media__label')
      label.textContent = `${t('rve_uploading', 'Uploading')} ${a.filename || kindLabel(a.kind).toLowerCase() || t('rve_file_singular', 'file')}…`
      progressLabel = h('span', 'rv-media__pct')
      progressLabel.textContent = '0%'
      label.append(progressLabel)
      const track = h('div', 'rv-media__progress', { role: 'progressbar', 'aria-label': t('rve_upload_progress', 'Upload progress') })
      progressEl = h('span')
      progressEl.style.width = '0%'
      track.append(progressEl)
      box.append(label, track)
      body.append(box)
      return
    }
    const src = a.draft ? (a.src || null) : safeUrl(a.src, opts.value.allowBlobUrls)
    if (a.status === 'error' || !src) {
      const box = h('div', 'rv-media__state rv-media__state--error')
      const msg = h('div', 'rv-media__label')
      msg.innerHTML = ICONS.alert
      const text = h('span')
      text.textContent = a.error || t('rve_this_file_not_available', 'This file is not available.')
      msg.append(text)
      const row = h('div', 'rv-media__actions', { 'data-rv-interactive': '' })
      if (a.uploadId && mediaCtx.canRetry(a.uploadId)) row.append(button(ICONS.retry, t('rve_retry_upload', 'Retry upload'), () => { patch({ status: 'uploading', error: '' }); mediaCtx.onRetry(a.uploadId) }, t('rve_retry', 'Retry')))
      row.append(button(ICONS.trash, t('rve_remove', 'Remove'), remove, t('rve_remove', 'Remove')))
      box.append(msg, row)
      body.append(box)
      return
    }
    if (a.kind === 'image') {
      const img = h('img', 'rv-media__img', { loading: 'lazy', decoding: 'async', draggable: 'false' })
      img.alt = a.alt || ''
      img.src = src
      if (a.height) { img.style.height = `${Math.round(a.height)}px`; img.style.objectFit = 'fill' }
      img.addEventListener('error', () => { img.replaceWith(Object.assign(h('div', 'rv-media__state rv-media__state--error'), { textContent: t('rve_image_load_error', 'The image could not be loaded.') })) })
      body.append(img)
    } else if (a.kind === 'video') {
      const v = h('video', 'rv-media__video', { controls: '', preload: 'metadata', playsinline: '' })
      v.src = src
      body.append(v)
    } else if (a.kind === 'audio') {
      const au = h('audio', 'rv-media__audio', { controls: '', preload: 'metadata' })
      au.src = src
      body.append(au)
    } else {
      const link = h('a', 'rv-file', { target: '_blank', rel: 'noopener noreferrer', 'data-rv-interactive': '' })
      link.href = src
      if (a.filename) link.setAttribute('download', a.filename)
      const icon = h('span', 'rv-file__icon')
      icon.innerHTML = ICONS.file
      const meta = h('span', 'rv-file__meta')
      const name = h('strong')
      name.textContent = a.filename || t('rve_attachment', 'Attachment')
      const sub = h('small')
      const ext = /\.([^.]+)$/.test(a.filename || '') ? a.filename.split('.').pop().toUpperCase() : ''
      sub.textContent = [ext, fmtBytes(a.size)].filter(Boolean).join(' · ')
      meta.append(name, sub)
      const dl = h('span', 'rv-file__dl')
      dl.innerHTML = ICONS.download
      link.append(icon, meta, dl)
      body.append(link)
    }
  }

  function renderBar() {
    const a = node.attrs
    bar.replaceChildren()
    if (a.status !== 'ready') return
    const floated = MEDIA_LAYOUTS.includes(a.layout)
    if (a.kind !== 'audio' && !floated) {
      for (const al of ALIGNS) {
        const b = button(ICONS[al], `${t('rve_align', 'Align')} ${t(`rve_align_${al}`, al)}`, () => patch({ align: al }))
        if (a.align === al) b.classList.add('is-active')
        bar.append(b)
      }
    }
    if (a.kind === 'image' || a.kind === 'video') {
      for (const [val, icon] of [['float-left', ICONS.floatLeft], ['float-right', ICONS.floatRight]]) {
        const b = button(icon, t(`rve_${val.replace('-', '_')}`, val === 'float-left' ? 'Float left' : 'Float right'), () => patch({ layout: a.layout === val ? null : val }))
        if (a.layout === val) b.classList.add('is-active')
        bar.append(b)
      }
      const sb = button(ICONS.size, t('rve_size', 'Size'), () => {})
      sb.addEventListener('click', () => openBarMenu(sb, sizeItems()))
      bar.append(sb)
    }
    if (a.kind === 'image' && on('canvas')) bar.append(button(ICONS.design, t('rve_edit_design', 'Edit design'), () => { const p = getPos(); if (typeof p === 'number') openDesign({ pos: p }) }))
    if (a.kind === 'image') bar.append(button('', t('rve_alt_text', 'Alternative text'), () => { const v = window.prompt(t('rve_alt_text_prompt', 'Alternative text (describe the image)'), a.alt || ''); if (v !== null) patch({ alt: v.slice(0, 300) }) }, t('rve_alt', 'Alt')))
    if (a.linked || a.kind === 'file') bar.append(button(ICONS.preview, t('rve_preview', 'Preview'), previewMedia))
    if (a.linked || a.kind === 'file') bar.append(button(ICONS.download, t('rve_download', 'Download'), downloadMedia))
    if (a.linked || a.kind === 'file') bar.append(button(ICONS.copy, t('rve_copy_link', 'Copy link'), copyMediaLink))
    if (a.kind === 'file') bar.append(button(ICONS.rename, t('rve_rename', 'Rename'), renameMedia))
    bar.append(button(ICONS.retry, t('rve_replace', 'Replace'), replaceMedia))
    bar.append(button(ICONS.trash, t('rve_delete', 'Delete'), remove))
  }

  function render() {
    const a = node.attrs
    const floated = MEDIA_LAYOUTS.includes(a.layout)
    const pct = clampWidth(a.width)
    dom.dataset.kind = a.kind
    dom.dataset.align = ALIGNS.includes(a.align) ? a.align : 'center'
    dom.dataset.layout = floated ? a.layout : ''
    dom.dataset.status = a.status
    if (a.kind === 'image' || a.kind === 'video') {
      dom.style.width = floated ? `${pct}%` : ''
      figure.style.width = floated ? '100%' : `${pct}%`
    } else {
      dom.style.width = ''
      figure.style.width = ''
    }
    renderBody()
    renderBar()
    if (document.activeElement !== caption) caption.value = a.caption || ''
    caption.disabled = !ed.isEditable
    const dirs = a.status === 'ready' && ed.isEditable ? RESIZE_HANDLES[a.kind] : null
    for (const d of RESIZE_DIRS) handles[d].hidden = !dirs || !dirs.includes(d)
    register()
  }

  function startResize(dir, e) {
    e.preventDefault()
    e.stopPropagation()
    const col = columnWidth()
    const floated = MEDIA_LAYOUTS.includes(node.attrs.layout)
    const startW = figure.getBoundingClientRect().width
    const startH = body.getBoundingClientRect().height || 1
    const ratio = startW / startH
    const startX = e.clientX
    const startY = e.clientY
    const horizontal = dir.includes('w') || dir.includes('e')
    const vertical = dir.includes('n') || dir.includes('s')
    const sideX = dir.includes('w') ? -1 : 1
    const sideY = dir.includes('n') ? -1 : 1
    const corner = horizontal && vertical
    const minW = node.attrs.kind === 'video' ? 160 : 40
    let w = startW
    let h = startH
    let pct = clampWidth(node.attrs.width)
    const snap = (val, ev) => (!ev.altKey && Math.abs(val - col) <= 10 ? col : val)
    const move = (ev) => {
      if (corner) {
        w = Math.min(snap(Math.max(minW, startW + sideX * (ev.clientX - startX)), ev), col)
        h = w / ratio
      } else if (horizontal) {
        w = Math.min(col, snap(Math.max(minW, startW + sideX * (ev.clientX - startX)), ev))
        h = startH
      } else {
        h = Math.max(24, startH + sideY * (ev.clientY - startY))
        w = startW
      }
      pct = clampWidth((w / col) * 100)
      if (floated) dom.style.width = `${pct}%`
      figure.style.width = floated ? '100%' : `${pct}%`
      const media = body.querySelector('img,video')
      if (media) {
        media.style.height = corner ? '' : `${Math.round(h)}px`
        media.style.objectFit = corner ? '' : 'fill'
      }
      badge.textContent = `${Math.round(w)} × ${Math.round(h)}`
      badge.hidden = false
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      badge.hidden = true
      const attrs = { width: pct }
      attrs.height = corner ? null : Math.round(h)
      patch(attrs)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }
  for (const dir of RESIZE_DIRS) {
    handles[dir].addEventListener('mousedown', (e) => e.preventDefault())
    handles[dir].addEventListener('pointerdown', (e) => startResize(dir, e))
  }
  const commitCaption = () => { if (caption.value !== node.attrs.caption) patch({ caption: caption.value.slice(0, 500) }) }
  caption.addEventListener('change', commitCaption)
  caption.addEventListener('blur', commitCaption)
  caption.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); commitCaption(); ed.commands.focus() } })

  render()
  return {
    dom,
    update(updated) {
      if (updated.type.name !== 'media') return false
      const prev = node.attrs.uploadId
      node = updated
      if (prev && prev !== node.attrs.uploadId) mediaCtx.views.delete(prev)
      render()
      return true
    },
    selectNode() { dom.classList.add('is-selected'); mediaCtx.onSelect(node.attrs) },
    deselectNode() { dom.classList.remove('is-selected') },
    stopEvent: (event) => !!event.target?.closest?.('[data-rv-interactive]'),
    ignoreMutation: () => true,
    destroy() {
      closeBarMenu()
      if (node.attrs.uploadId) mediaCtx.views.delete(node.attrs.uploadId)
      mediaCtx.onRemoved(node.attrs)
    },
  }
}

const RVMedia = Node.create({
  name: 'media',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,
  addAttributes() {
    return {
      kind: { default: 'image' }, src: { default: null }, alt: { default: '' }, caption: { default: '' },
      width: { default: 100 }, height: { default: null }, align: { default: 'center' }, layout: { default: null },
      filename: { default: '' }, size: { default: 0 }, mime: { default: '' },
      status: { default: 'ready' }, uploadId: { default: null }, error: { default: '' },
      fileId: { default: null }, draft: { default: false }, design: { default: null }, linked: { default: false },
    }
  },
  parseHTML() {
    return [
      {
        tag: 'figure[data-rv-media]',
        getAttrs: (el) => {
          const kind = el.getAttribute('data-rv-media')
          if (!KINDS.includes(kind)) return false
          const m = el.querySelector('img,video,audio')
          const a = el.querySelector('a[href]')
          const src = safeUrl(m?.getAttribute('src') ?? a?.getAttribute('href'), opts.value.allowBlobUrls)
          const al = el.getAttribute('data-align')
          const lay = el.getAttribute('data-layout')
          const media = el.querySelector('img,video,audio')
          return {
            kind, src, alt: m?.getAttribute('alt') ?? '', caption: el.querySelector('figcaption')?.textContent ?? '',
            width: clampWidth(el.getAttribute('data-width')), align: ALIGNS.includes(al) ? al : 'center',
            layout: MEDIA_LAYOUTS.includes(lay) ? lay : null,
            height: pxValue(media?.getAttribute('style'), 'height'),
            linked: el.getAttribute('data-linked') === 'true',
            filename: a?.getAttribute('download') ?? '', status: src ? 'ready' : 'error', error: src ? '' : t('rve_this_file_not_available', 'This file is not available.'),
          }
        },
      },
      { tag: 'img[src]', getAttrs: (el) => { const src = safeUrl(el.getAttribute('src'), opts.value.allowBlobUrls); return src ? { kind: 'image', src, alt: el.getAttribute('alt') ?? '' } : false } },
    ]
  },
  renderHTML({ node }) {
    const a = node.attrs
    const src = a.draft ? null : safeUrl(a.src, opts.value.allowBlobUrls)
    const pct = clampWidth(a.width)
    const layout = MEDIA_LAYOUTS.includes(a.layout) ? a.layout : null
    const style = layout ? `width:${pct}%;${LAYOUT_CSS[layout]}` : `width:${pct}%`
    const wrap = { 'data-rv-media': KINDS.includes(a.kind) ? a.kind : 'image', 'data-align': ALIGNS.includes(a.align) ? a.align : 'center', 'data-width': pct, style }
    if (layout) wrap['data-layout'] = layout
    if (a.linked) wrap['data-linked'] = 'true'
    const out = ['figure', wrap]
    if (src) {
      if (a.kind === 'video') out.push(['video', { src, controls: '', preload: 'metadata' }])
      else if (a.kind === 'audio') out.push(['audio', { src, controls: '', preload: 'metadata' }])
      else if (a.kind === 'file') out.push(['a', { href: src, download: a.filename || '', target: '_blank', rel: 'noopener noreferrer' }, a.filename || t('rve_download', 'Download')])
      else {
        const img = { src, alt: a.alt || '', loading: 'lazy' }
        if (a.height) img.style = `height:${Math.round(a.height)}px;object-fit:fill`
        out.push(['img', img])
      }
    }
    if (a.caption) out.push(['figcaption', a.caption])
    return out
  },
  addNodeView() { return (p) => createMediaView(p) },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('rvMediaPaste'),
        props: {
          handlePaste: (view, event) => {
            const files = Array.from(event.clipboardData?.files ?? [])
            if (!files.length || event.clipboardData.getData('text/plain')) return false // prefer text (e.g. spreadsheets)
            mediaCtx.onFiles(files)
            return true
          },
        },
      }),
    ]
  },
})

// ---- slash menu -------------------------------------------------------------------------------------
const slash = reactive({ open: false, items: [], index: 0, rect: null, command: null })
const slashGroups = computed(() => {
  const groups = []
  slash.items.forEach((item, i) => {
    let g = groups.find((x) => x.key === item.groupKey)
    if (!g) groups.push((g = { key: item.groupKey, name: t(item.groupKey, item.group), items: [] }))
    g.items.push({ item, i })
  })
  return groups
})
const slashStyle = computed(() => {
  const r = slash.rect
  if (!r || !import.meta.client) return { visibility: 'hidden' }
  const left = `${Math.max(8, Math.min(r.left, window.innerWidth - 340))}px`
  const below = window.innerHeight - r.bottom
  return below < 340 && r.top > below ? { left, bottom: `${window.innerHeight - r.top + 8}px`, maxHeight: `${Math.min(420, r.top - 16)}px` } : { left, top: `${r.bottom + 8}px`, maxHeight: `${Math.min(420, below - 16)}px` }
})
const slashEl = ref(null)
watch(() => slash.index, async () => { await nextTick(); slashEl.value?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' }) })

// Each item carries a stable `id` (used for lookups), a `groupKey`/`group`, and `titleKey`/`title` + `hintKey`/`hint`
// pairs so the UI can be translated while code keeps matching on ids (never on translated text).
function buildSlashItems() {
  const list = []
  const add = (id, group, groupKey, title, titleKey, hint, hintKey, icon, keywords, run) =>
    list.push({ id, group, groupKey, title, titleKey, hint, hintKey, icon, keywords, run })
  const B = 'Basic blocks'
  const BK = 'rve_basic_blocks'
  add('text', B, BK, 'Text', 'rve_text', 'Just start writing with plain text.', 'rve_just_start_writing', 'i-lucide-pilcrow', ['paragraph', 'p'], (e) => e.chain().focus().setParagraph().run())
  if (on('headings')) {
    add('heading-1', B, BK, 'Heading 1', 'rve_heading_1', 'Big section heading.', 'rve_heading_1_hint', 'i-lucide-heading-1', ['title', 'h1'], (e) => e.chain().focus().setHeading({ level: 1 }).run())
    add('heading-2', B, BK, 'Heading 2', 'rve_heading_2', 'Medium section heading.', 'rve_heading_2_hint', 'i-lucide-heading-2', ['subtitle', 'h2'], (e) => e.chain().focus().setHeading({ level: 2 }).run())
    add('heading-3', B, BK, 'Heading 3', 'rve_heading_3', 'Small section heading.', 'rve_heading_3_hint', 'i-lucide-heading-3', ['h3'], (e) => e.chain().focus().setHeading({ level: 3 }).run())
  }
  if (on('lists')) {
    add('bullet-list', B, BK, 'Bulleted list', 'rve_bulleted_list', 'Create a simple bulleted list.', 'rve_bulleted_list_hint', 'i-lucide-list', ['ul', 'bullet'], (e) => e.chain().focus().toggleBulletList().run())
    add('numbered-list', B, BK, 'Numbered list', 'rve_numbered_list', 'Create a list with numbering.', 'rve_numbered_list_hint', 'i-lucide-list-ordered', ['ol', 'ordered'], (e) => e.chain().focus().toggleOrderedList().run())
    add('todo-list', B, BK, 'To-do list', 'rve_todo_list', 'Track tasks with a to-do list.', 'rve_todo_list_hint', 'i-lucide-list-checks', ['task', 'checkbox', 'todo'], (e) => e.chain().focus().toggleTaskList().run())
  }
  if (on('blockquote')) add('quote', B, BK, 'Quote', 'rve_quote', 'Capture a quote.', 'rve_quote_hint', 'i-lucide-text-quote', ['blockquote', 'cite'], (e) => e.chain().focus().toggleBlockquote().run())
  if (on('callout')) {
    add('callout', B, BK, 'Callout', 'rve_callout', 'Make writing stand out.', 'rve_callout_hint', 'i-lucide-lightbulb', ['info', 'note', 'tip'], (e) => e.chain().focus().toggleWrap('callout', { tone: 'info' }).run())
    add('warning-callout', B, BK, 'Warning callout', 'rve_warning_callout', 'Highlight something risky.', 'rve_warning_callout_hint', 'i-lucide-triangle-alert', ['warning', 'caution'], (e) => e.chain().focus().toggleWrap('callout', { tone: 'warning' }).run())
  }
  if (on('divider')) add('divider', B, BK, 'Divider', 'rve_divider', 'Visually divide blocks.', 'rve_divider_hint', 'i-lucide-minus', ['hr', 'rule', 'line'], (e) => e.chain().focus().setHorizontalRule().run())
  const M = 'Media'
  const MK = 'rve_media'
  if (kindAllowed('image')) add('image', M, MK, 'Image', 'rve_image', 'Upload or drop an image (PNG, JPG, WEBP, GIF, SVG, AVIF).', 'rve_image_hint', 'i-lucide-image', ['photo', 'picture', 'png', 'jpg'], () => pickFiles('image'))
  if (kindAllowed('video')) add('video', M, MK, 'Video', 'rve_video', 'Upload a video (MP4, WEBM).', 'rve_video_hint', 'i-lucide-video', ['movie', 'mp4', 'webm'], () => pickFiles('video'))
  if (kindAllowed('audio')) add('audio', M, MK, 'Audio', 'rve_audio', 'Upload audio (MP3, WAV, OGG).', 'rve_audio_hint', 'i-lucide-music', ['sound', 'mp3', 'wav', 'ogg'], () => pickFiles('audio'))
  if (kindAllowed('file')) add('file', M, MK, 'File', 'rve_file', 'Attach a PDF, Word, Excel or PowerPoint document.', 'rve_file_hint', 'i-lucide-paperclip', ['pdf', 'word', 'excel', 'powerpoint', 'attachment', 'document'], () => pickFiles('file'))
  if (KINDS.some(k => kindAllowed(k))) add('media-url', M, MK, 'From URL', 'rve_media_from_url', 'Embed media or a document from a link.', 'rve_media_from_url_hint', 'i-lucide-link-2', ['url', 'link', 'embed', 'web'], () => openMediaUrl())
  if (on('canvas')) add('design', M, MK, 'Design', 'rve_design', 'Create an image with the design canvas.', 'rve_design_hint', 'i-lucide-palette', ['canva', 'design', 'draw', 'poster', 'canvas', 'shape'], () => openDesign())
  const X = 'Advanced'
  const XK = 'rve_advanced'
  if (on('tables')) add('table', X, XK, 'Table', 'rve_table', 'Add a 3 × 3 table with a header row.', 'rve_table_hint', 'i-lucide-table', ['grid', 'spreadsheet'], (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run())
  if (on('codeBlock')) add('code', X, XK, 'Code', 'rve_code', 'Capture a code snippet.', 'rve_code_hint', 'i-lucide-square-code', ['pre', 'snippet', 'code'], (e) => e.chain().focus().toggleCodeBlock().run())
  add('date', X, XK, 'Date', 'rve_date', 'Insert today’s date.', 'rve_date_hint', 'i-lucide-calendar', ['today', 'time'], (e) => e.chain().focus().insertContent(new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })).run())
  return list.map((it) => {
    const run = it.run
    return { ...it, run: (e) => { const ed = e ?? live(); if (!ed) return; try { run(ed) } catch (err) { warn(`Block "${it.id}" failed:`, err) } } }
  })
}
let slashItems = []
const filterSlash = (query) => {
  const q = query.trim().toLowerCase()
  return slashItems.filter((i) => {
    if (!q) return true
    const title = t(i.titleKey, i.title).toLowerCase()
    const hint = t(i.hintKey, i.hint).toLowerCase()
    const group = t(i.groupKey, i.group).toLowerCase()
    return title.includes(q) || hint.includes(q) || group.includes(q) || i.keywords.some((k) => k.includes(q))
  })
}
function setSlash(p, reset) {
  slash.open = true
  slash.items = p.items
  slash.rect = p.clientRect?.() ?? null
  slash.command = p.command
  if (reset || slash.index >= p.items.length) slash.index = 0
}
function slashKey(event) {
  const n = slash.items.length
  if (!slash.open || !n) return false
  if (event.key === 'ArrowDown') { slash.index = (slash.index + 1) % n; return true }
  if (event.key === 'ArrowUp') { slash.index = (slash.index - 1 + n) % n; return true }
  if (event.key === 'Enter' || event.key === 'Tab') { slash.command(slash.items[slash.index]); return true }
  return false
}
const RVSlash = Extension.create({
  name: 'rvSlash',
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        pluginKey: new PluginKey('rvSlash'),
        char: '/',
        allowSpaces: false,
        allow: ({ state, range }) => !state.doc.resolve(range.from).parent.type.spec.code,
        items: ({ query }) => filterSlash(query),
        command: ({ editor: e, range, props: item }) => { e.chain().focus().deleteRange(range).run(); item.run(e) },
        render: () => ({
          onStart: (p) => setSlash(p, true),
          onUpdate: (p) => setSlash(p, false),
          onKeyDown: (p) => slashKey(p.event),
          onExit: () => { slash.open = false },
        }),
      }),
    ]
  },
})

// =====================================================================================================
// Media: validation, insertion, uploads
// =====================================================================================================
function kindAllowed(kind) {
  const flagKey = { image: 'images', video: 'videos', audio: 'audio', file: 'files' }[kind]
  const allowed = asArray(props.allowedMedia).filter((k) => KINDS.includes(k))
  return on(flagKey) && (!allowed.length || allowed.includes(kind))
}
const maxSizeFor = (kind) => {
  const raw = typeof props.maxFileSize === 'number' ? props.maxFileSize : (isObj(props.maxFileSize) ? props.maxFileSize[kind] : undefined)
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_MAX[kind]
}
const allAccept = () => KINDS.filter(kindAllowed).flatMap((k) => MEDIA_MIME[k]).join(',')

function validateFile(file) {
  const k = kindOfFile(file)
  if (!k) return { error: `“${asStr(file?.name, t('rve_this_file', 'This file'))}” ${t('rve_unsupported_file_type', 'is not a supported file type.')}`, code: 'unsupported-type' }
  if (!kindAllowed(k.kind)) return { error: `${kindLabel(k.kind)} ${t('rve_kind_disabled', 'uploads are disabled here.')}`, code: 'kind-disabled' }
  if (file.size > maxSizeFor(k.kind)) return { error: `“${file.name}” ${t('rve_file_too_large', 'is larger than')} ${fmtBytes(maxSizeFor(k.kind))}.`, code: 'too-large' }
  return k
}

function topRange($from) {
  const emptyPara = $from.depth === 1 && $from.parent.type.name === 'paragraph' && $from.parent.content.size === 0
  if (emptyPara) return { from: $from.before(), to: $from.after() }
  const at = $from.depth ? $from.after(1) : $from.pos
  return { from: at, to: at }
}
function insertBlocks(nodes, at) {
  const ed = live()
  if (!ed) return
  const range = typeof at === 'number' ? { from: at, to: at } : topRange(ed.state.selection.$from)
  ed.chain().focus().insertContentAt(range, nodes).run()
}

async function insertFiles(fileList, at) {
  if (!live() || !isEditable.value) return []
  const list = isFile(fileList) ? [fileList] : Array.from(fileList ?? []).filter(Boolean)
  const items = []
  for (const file of list) {
    const v = validateFile(file)
    if (v.error) {
      showNotice(v.error)
      emit('error', { source: 'media', code: v.code, file, error: new Error(v.error) })
      continue
    }
    items.push({ file, kind: v.kind, mime: v.type, uploadId: uid() })
  }
  if (!items.length) return []
  insertBlocks(items.map((i) => ({
    type: 'media',
    attrs: { kind: i.kind, status: 'uploading', uploadId: i.uploadId, filename: i.file.name, size: i.file.size, mime: i.mime, alt: i.kind === 'image' ? stripExt(i.file.name) : '' },
  })), at)
  items.forEach(startUpload)
  return items.map((i) => i.uploadId)
}

function patchMedia(uploadId, attrsPatch) {
  const ed = live()
  if (!ed) return false
  let found = null
  ed.state.doc.descendants((node, pos) => {
    if (found) return false
    if (node.type.name === 'media' && node.attrs.uploadId === uploadId) { found = { node, pos }; return false }
    return true
  })
  if (!found) return false
  ed.view.dispatch(ed.state.tr.setNodeMarkup(found.pos, undefined, { ...found.node.attrs, ...attrsPatch }).setMeta('addToHistory', false))
  return true
}

async function runUploader(file, ctx) {
  if (typeof props.uploader === 'function') return props.uploader(file, ctx)
  if (isObj(props.uploadApi) && asStr(props.uploadApi.url).trim()) return xhrUpload(file, props.uploadApi, ctx)
  throw new Error(t('rve_no_upload_endpoint', 'No upload endpoint configured (set the upload-api or uploader prop).'))
}

async function startUpload({ file, kind, uploadId }) {
  const controller = new AbortController()
  pending.set(uploadId, { file, kind, controller })
  uploading.value++
  emit('upload', { phase: 'start', file, uploadId })
  try {
    const toSend = kind === 'image' && file.type === 'image/svg+xml' ? await sanitizeSvgFile(file) : file
    const result = await runUploader(toSend, {
      signal: controller.signal,
      onProgress: (p) => { mediaCtx.views.get(uploadId)?.setProgress(p); emit('upload', { phase: 'progress', file, uploadId, progress: p }) },
    })
    const url = safeUrl(result?.url, opts.value.allowBlobUrls)
    if (!url) throw new Error(t('rve_upload_no_url', 'The uploader did not return a persistent http(s) URL.'))
    pending.delete(uploadId)
    patchMedia(uploadId, { src: url, status: 'ready', uploadId: null, error: '' })
    emit('upload', { phase: 'success', file, uploadId, url })
  } catch (err) {
    if (controller.signal.aborted) return // the block was removed
    pending.set(uploadId, { file, kind, controller: null }) // keep the file so Retry works
    patchMedia(uploadId, { status: 'error', error: err?.message || t('rve_upload_failed', 'Upload failed.') })
    emit('upload', { phase: 'error', file, uploadId, error: err })
    emit('error', { source: 'upload', file, error: err })
  } finally {
    uploading.value = Math.max(0, uploading.value - 1)
  }
}
function retryUpload(uploadId) {
  const p = pending.get(uploadId)
  if (p) startUpload({ file: p.file, kind: p.kind, uploadId })
}

function pickFiles(kind) {
  const input = fileInput.value
  if (!input) return
  input.accept = kind ? MEDIA_MIME[kind].join(',') : allAccept()
  input.click()
}
function onPicked(e) {
  const input = e?.target
  if (input?.files?.length) insertFiles(input.files)
  if (input) input.value = ''
}
function urlFilename(url) {
  try {
    const path = new URL(url, 'https://placeholder.invalid').pathname
    return decodeURIComponent(path.split('/').filter(Boolean).pop() ?? '')
  }
  catch {
    return ''
  }
}
function insertMediaUrl(kind, url) {
  const src = safeUrl(asStr(url).trim(), opts.value.allowBlobUrls)
  if (!src || !kindAllowed(kind) || !live()) {
    emit('error', { source: 'media', code: 'invalid-url', error: new Error(t('rve_invalid_media_url', 'Invalid or disallowed media URL.')) })
    return false
  }
  const filename = urlFilename(src)
  const ext = filename.includes('.') ? filename.split('.').pop().toLowerCase() : ''
  const mime = EXT_MIME[ext] ?? ''
  insertBlocks([{ type: 'media', attrs: { kind, src, status: 'ready', filename, mime, alt: kind === 'image' ? stripExt(filename) : '', linked: true } }])
  return true
}

const mediaUrl = reactive({ open: false, kind: 'file', url: '', error: '' })
const mediaUrlInput = ref(null)
const mediaUrlKinds = computed(() => KINDS.filter(k => kindAllowed(k)).map(k => ({ value: k, label: kindLabel(k) })))
function openMediaUrl(kind) {
  const available = mediaUrlKinds.value
  if (!available.length) return
  mediaUrl.kind = available.some(k => k.value === kind) ? kind : available[0].value
  mediaUrl.url = ''
  mediaUrl.error = ''
  mediaUrl.open = true
  nextTick(() => nextTick(() => mediaUrlInput.value?.focus()))
}
function submitMediaUrl() {
  const ok = insertMediaUrl(mediaUrl.kind, mediaUrl.url)
  if (ok) {
    mediaUrl.open = false
    mediaUrl.url = ''
    mediaUrl.error = ''
  }
  else mediaUrl.error = t('rve_enter_valid_media_url', 'Enter a valid http(s) media or file URL.')
}

// ---- file drag & drop over the whole editor (Canva-style drop zone) ----------------------------------
let dragDepth = 0
const hasFiles = (e) => Array.from(e?.dataTransfer?.types ?? []).includes('Files')
function onDragEnter(e) { if (hasFiles(e) && isEditable.value) { dragDepth++; dropping.value = true } }
function onDragOver(e) { if (hasFiles(e)) e.preventDefault() }
function onDragLeave(e) {
  if (!hasFiles(e)) return
  dragDepth = Math.max(0, dragDepth - 1)
  if (!dragDepth) dropping.value = false
}
function dropBlockPos(x, y) {
  const ed = live()
  const doc = ed.state.doc
  const r = ed.view.posAtCoords({ left: x, top: y })
  if (!r) return doc.content.size
  const inside = r.inside >= 0 ? r.inside : r.pos
  const $i = doc.resolve(inside)
  const topPos = $i.depth ? $i.before(1) : inside
  const node = doc.nodeAt(topPos)
  if (!node) return doc.content.size
  const rect = ed.view.nodeDOM(topPos)?.getBoundingClientRect?.()
  return rect && y < rect.top + rect.height / 2 ? topPos : topPos + node.nodeSize
}
function onDrop(e) {
  if (!hasFiles(e)) return
  e.preventDefault() // never let the browser navigate to a dropped file
  e.stopPropagation()
  dragDepth = 0
  dropping.value = false
  if (!isEditable.value || !on('dropFiles') || !live()) return
  insertFiles(e.dataTransfer?.files, dropBlockPos(e.clientX, e.clientY))
}

// =====================================================================================================
// Design canvas — fabric, built into the editor (no separate component).
// Flow: add files (any type) → move / resize / align / distribute → Insert as an image.
// Non-image files appear as cards and can also be attached to the article.
// fabric is imported on first open, so it never touches SSR or the initial bundle.
// =====================================================================================================
const DESIGN_PRESETS = [
  { id: 'article', label: 'Article 16:9', w: 1200, h: 675 },
  { id: 'square', label: 'Square', w: 1080, h: 1080 },
  { id: 'portrait', label: 'Portrait 4:5', w: 1080, h: 1350 },
  { id: 'story', label: 'Story 9:16', w: 1080, h: 1920 },
  { id: 'a4', label: 'A4', w: 794, h: 1123 },
]
const ALIGN_BUTTONS = [
  ['left', 'i-lucide-align-start-vertical', 'Align left'],
  ['hcenter', 'i-lucide-align-center-vertical', 'Center horizontally'],
  ['right', 'i-lucide-align-end-vertical', 'Align right'],
  ['top', 'i-lucide-align-start-horizontal', 'Align top'],
  ['vcenter', 'i-lucide-align-center-horizontal', 'Center vertically'],
  ['bottom', 'i-lucide-align-end-horizontal', 'Align bottom'],
]
const ORDER_BUTTONS = [
  ['front', 'i-lucide-bring-to-front', 'Bring to front'],
  ['forward', 'i-lucide-arrow-up', 'Forward'],
  ['backward', 'i-lucide-arrow-down', 'Backward'],
  ['back', 'i-lucide-send-to-back', 'Send to back'],
]
const DESIGN_EXTRA = ['rcId', 'rcFileId', 'rcMeta']
const ORIGIN = { originX: 'left', originY: 'top' } // explicit: fabric 6 and 7 differ on the default origin
const DESIGN_FONT = 'Inter, "Noto Sans Khmer", system-ui, sans-serif'
const EXT_COLORS = {
  PDF: '#ef4444', DOC: '#2563eb', DOCX: '#2563eb', XLS: '#16a34a', XLSX: '#16a34a', CSV: '#16a34a',
  PPT: '#f97316', PPTX: '#f97316', ZIP: '#a16207', RAR: '#a16207', MP4: '#7c3aed', MOV: '#7c3aed',
  WEBM: '#7c3aed', MP3: '#db2777', WAV: '#db2777', TXT: '#64748b',
}

const canvasEnabled = computed(() => on('canvas') && isEditable.value)

const designOpen = ref(false)
const designDoc = ref(null) // saved design to reopen
const designImage = ref('') // or: an existing image to start from
const designTarget = ref(null) // { pos, src, fileId } when editing an image already in the article
const designStage = ref(null)
const designCanvasEl = ref(null)
const designRoot = ref(null)
const designFileInput = ref(null)
const designPage = reactive({ w: 1200, h: 675, bg: '#ffffff', preset: 'article' })
const designUi = reactive({
  ready: false, busy: false, zoom: 1, canUndo: false, canRedo: false,
  alignTo: 'page', snap: true, attach: true, msg: '', expanded: false,
})
// Screen rectangle of the image being edited (the canvas is drawn exactly over it).
const designRect = reactive({ left: 0, top: 0, width: 0, height: 0 })
const designPlaceholder = ref(null) // marker of the blank image inserted for a brand-new design
let rafId = 0
const designSel = reactive({ n: 0, kind: '', x: 0, y: 0, w: 0, h: 0, fill: '#8c52ff', opacity: 100, lock: true, hasFill: false })

// Not reactive on purpose — fabric objects must stay out of Vue's proxies.
let fabricMod = null
let fc = null
let designHistory = []
let historyAt = -1
let restoring = false
let commitTimer = null
const designFiles = new Map() // rcFileId → File (documents / videos placed on the canvas)

const clampNum = (n, min, max) => Math.min(max, Math.max(min, n))
const designObjects = () => (fc ? fc.getObjects().filter((o) => !o.rcGuide) : [])

// Scene-space bounding box (rotation-aware). getCoords() is absolute, also for objects inside a selection.
function designBox(o) {
  const pts = o.getCoords()
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  const l = Math.min(...xs); const r = Math.max(...xs); const t = Math.min(...ys); const b = Math.max(...ys)
  return { l, r, t, b, cx: (l + r) / 2, cy: (t + b) / 2, w: r - l, h: b - t }
}
function designShift(o, dx, dy) {
  if (!dx && !dy) return
  o.set({ left: o.left + dx, top: o.top + dy })
  o.setCoords()
}
function designSelected() {
  const a = fc?.getActiveObject()
  if (!a) return []
  return a instanceof fabricMod.ActiveSelection ? [...a.getObjects()] : [a]
}
function designReselect(list) {
  if (!list.length) return
  fc.setActiveObject(list.length > 1 ? new fabricMod.ActiveSelection(list, { canvas: fc }) : list[0])
  fc.requestRenderAll()
}

// ── Media node helpers ────────────────────────────────────────────────────
function findPosByFileId(fileId) {
  let found = null
  any()?.state.doc.descendants((n, p) => {
    if (found != null) return false
    if (n.type.name === 'media' && n.attrs.fileId === fileId) { found = p; return false }
    return true
  })
  return found
}
// Current document position of the image being edited (it can move while editing).
function resolveTargetPos() {
  const ed = live()
  const tgt = designTarget.value
  if (!ed || !tgt) return null
  const hit = (n) => n?.type.name === 'media' && (tgt.fileId ? n.attrs.fileId === tgt.fileId : n.attrs.src === tgt.src)
  if (hit(ed.state.doc.nodeAt(tgt.pos))) return tgt.pos
  let found = null
  ed.state.doc.descendants((n, p) => {
    if (found != null) return false
    if (hit(n)) { found = p; return false }
    return true
  })
  if (found != null) tgt.pos = found
  return found
}
function patchAt(pos, attrsPatch) {
  const ed = live()
  if (!ed || pos == null) return false
  const node = ed.state.doc.nodeAt(pos)
  if (!node || node.type.name !== 'media') return false
  ed.view.dispatch(ed.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...attrsPatch }).setMeta('addToHistory', false))
  return true
}
function deleteMediaAt(pos) {
  const ed = live()
  if (!ed || pos == null) return
  const node = ed.state.doc.nodeAt(pos)
  if (!node) return
  ed.view.dispatch(ed.state.tr.delete(pos, pos + node.nodeSize))
}
function blankPlaceholderDataUrl(w, h, bg) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const x = c.getContext('2d')
  x.fillStyle = bg
  x.fillRect(0, 0, w, h)
  return c.toDataURL('image/png')
}
function insertDesignPlaceholder(w, h, bg) {
  const ed = live()
  if (!ed) return null
  const fileId = uid()
  const src = blankPlaceholderDataUrl(w, h, bg)
  const range = topRange(ed.state.selection.$from)
  ed.chain().focus().insertContentAt(range, {
    type: 'media',
    attrs: { kind: 'image', src, draft: true, status: 'ready', fileId, width: 100, align: 'center', alt: '' },
  }).run()
  const pos = findPosByFileId(fileId)
  return pos != null ? { pos, fileId } : null
}
const designFor = (node) => node?.attrs?.design ?? props.designs?.[node?.attrs?.src] ?? null

// ── Open / close ─────────────────────────────────────────────────────────
// The canvas opens IN PLACE: it is drawn exactly over the image in the article
// (follows scroll / resize). "Expand" switches to a full-screen workspace.
//   openDesign()          → new blank design: a placeholder image is inserted at the cursor
//   openDesign({ pos })   → edit the image at `pos` (its saved design, else the image itself)
async function openDesign({ pos = null } = {}) {
  if (!canvasEnabled.value || designOpen.value) return
  const ed = live()
  if (!ed) return
  designTarget.value = null
  designDoc.value = null
  designImage.value = ''
  designPlaceholder.value = null
  Object.assign(designUi, { msg: '', ready: false, expanded: false })
  designFiles.clear()

  const o = props.canvasOptions || {}
  designPage.w = o.width ?? 1200
  designPage.h = o.height ?? 675
  designPage.bg = o.background ?? '#ffffff'

  let node = pos != null ? ed.state.doc.nodeAt(pos) : null
  if (node?.type.name !== 'media' || node.attrs.kind !== 'image') {
    // New design → insert a blank image first, then edit that image in place.
    const ph = insertDesignPlaceholder(designPage.w, designPage.h, designPage.bg)
    if (!ph) return
    designPlaceholder.value = { fileId: ph.fileId }
    pos = ph.pos
    node = ed.state.doc.nodeAt(pos)
    if (!node) return
  } else {
    designDoc.value = designFor(node)
    if (!designDoc.value) designImage.value = node.attrs.src
    // A stretched image would not match the page's aspect ratio.
    if (node.attrs.width && node.attrs.width !== 100) patchAt(pos, { width: 100 })
  }
  designTarget.value = { pos, src: node.attrs.src, fileId: node.attrs.fileId }
  designPage.preset = DESIGN_PRESETS.find((p) => p.w === designPage.w && p.h === designPage.h)?.id ?? 'custom'
  designOpen.value = true
  await nextTick()
  ed.view.nodeDOM(pos)?.scrollIntoView?.({ block: 'center', behavior: 'smooth' })
  trackRect()
  await initDesign()
}

// Keep the canvas glued to the image: follows scrolling, resizing and layout shifts.
function trackRect() {
  cancelAnimationFrame(rafId)
  const step = () => {
    if (!designOpen.value) return
    if (!designUi.expanded) {
      const pos = resolveTargetPos()
      const host = pos != null ? live()?.view.nodeDOM(pos) : null
      const target = host?.querySelector?.('.rv-media__img') ?? host?.querySelector?.('.rv-media__figure') ?? host
      if (target) {
        const r = target.getBoundingClientRect()
        if (r.left !== designRect.left || r.top !== designRect.top || r.width !== designRect.width || r.height !== designRect.height) {
          Object.assign(designRect, { left: r.left, top: r.top, width: r.width, height: r.height })
        }
      }
      if (fc && designRect.width && Math.abs(designUi.zoom - designRect.width / designPage.w) > 0.001) setDesignZoom(designRect.width / designPage.w)
    }
    rafId = requestAnimationFrame(step)
  }
  rafId = requestAnimationFrame(step)
}

// Dock (header + tools): above the image, or below it when there is no room.
const designDockStyle = computed(() => {
  if (designUi.expanded) return {}
  const below = designRect.top < 170
  const left = Math.max(8, Math.min(designRect.left, (typeof window === 'undefined' ? 1200 : window.innerWidth) - 760))
  return below
    ? { left: `${left}px`, top: `min(${Math.round(designRect.top + designRect.height + 8)}px, calc(100vh - 190px))` }
    : { left: `${left}px`, bottom: `${(typeof window === 'undefined' ? 0 : window.innerHeight) - Math.round(designRect.top) + 8}px` }
})
const designFrameStyle = computed(() => (designUi.expanded ? {} : {
  left: `${designRect.left}px`, top: `${designRect.top}px`, width: `${designRect.width}px`, height: `${designRect.height}px`,
}))

function closeDesign({ cancelled = false } = {}) {
  clearTimeout(commitTimer)
  cancelAnimationFrame(rafId)
  // Cancelled a brand-new design → remove the placeholder image again.
  if (cancelled && designPlaceholder.value) {
    const pos = resolveTargetPos()
    if (pos != null) deleteMediaAt(pos)
  }
  designOpen.value = false
  designTarget.value = null
  designDoc.value = null
  designImage.value = ''
  designPlaceholder.value = null
  designUi.expanded = false
  disposeCanvas()
}

function disposeCanvas() {
  const c = fc
  fc = null
  designHistory = []
  historyAt = -1
  if (c) Promise.resolve(c.dispose?.()).catch(() => {})
}

async function initDesign() {
  try {
    fabricMod ??= await import('fabric')
    if (!designOpen.value || !designCanvasEl.value) return
    const { Canvas } = fabricMod
    fc = new Canvas(designCanvasEl.value, {
      width: designPage.w, height: designPage.h, backgroundColor: designPage.bg,
      preserveObjectStacking: true, uniformScaling: true, selectionColor: 'rgba(140,82,255,.12)',
      selectionBorderColor: '#8c52ff', targetFindTolerance: 6,
    })
    fc.on('object:added', (e) => styleObject(e.target))
    fc.on('selection:created', syncSelection)
    fc.on('selection:updated', syncSelection)
    fc.on('selection:cleared', syncSelection)
    fc.on('object:moving', (e) => { snapMoving(e.target); syncSelection() })
    fc.on('object:scaling', syncSelection)
    fc.on('object:rotating', syncSelection)
    fc.on('object:modified', () => { syncSelection(); designCommit() })
    fc.on('text:changed', () => designCommitSoon())
    fc.on('mouse:up', clearGuides)

    const doc = designDoc.value
    if (doc?.json) {
      restoring = true
      Object.assign(designPage, { w: doc.w, h: doc.h, bg: doc.bg, preset: 'custom' })
      await fc.loadFromJSON(doc.json)
      restoring = false
    } else if (designImage.value) {
      try {
        const img = await fabricMod.FabricImage.fromURL(designImage.value, { crossOrigin: 'anonymous' })
        const k = Math.min(1, 2400 / Math.max(img.width, img.height))
        Object.assign(designPage, { w: Math.round(img.width * k), h: Math.round(img.height * k), preset: 'custom' })
        img.set({ ...ORIGIN, left: 0, top: 0, scaleX: k, scaleY: k })
        fc.add(img)
      } catch {
        designUi.msg = 'Could not load the image (it may block cross-origin access). Starting with a blank page.'
      }
    }
    applyDesignSize()
    fit()
    designHistory = []
    historyAt = -1
    designCommit(true)
    designUi.ready = true
    designRoot.value?.focus({ preventScroll: true })
  } catch (e) {
    designUi.msg = e?.message || 'Could not start the canvas'
    emit('error', { source: 'design', error: e })
  }
}

function styleObject(o) {
  if (!o || o.rcGuide) return
  o.set({
    cornerStyle: 'circle', cornerSize: 11, transparentCorners: false, cornerColor: '#ffffff',
    cornerStrokeColor: '#8c52ff', borderColor: '#8c52ff', borderScaleFactor: 1.5,
  })
  // Images and file cards keep their ratio: corners only (like Canva).
  if (o instanceof fabricMod.FabricImage || o.rcMeta) o.setControlsVisibility?.({ mt: false, mb: false, ml: false, mr: false })
  o.rcId ??= uid()
}

// ── Page size / zoom ─────────────────────────────────────────────────────
function applyDesignSize() {
  if (!fc) return
  const z = designUi.zoom
  fc.setZoom(z)
  fc.setDimensions({ width: designPage.w * z, height: designPage.h * z })
  fc.set({ backgroundColor: designPage.bg })
  fc.requestRenderAll()
}
function setDesignZoom(z) {
  designUi.zoom = clampNum(z, 0.05, 4)
  applyDesignSize()
}
function fit() {
  if (!designUi.expanded) {
    if (designRect.width) setDesignZoom(designRect.width / designPage.w)
    return
  }
  const el = designStage.value
  if (!el) return
  setDesignZoom(Math.min((el.clientWidth - 80) / designPage.w, (el.clientHeight - 80) / designPage.h, 1.5))
}
function setPageSize(w, h) {
  designPage.w = clampNum(Math.round(w) || designPage.w, 100, 4000)
  designPage.h = clampNum(Math.round(h) || designPage.h, 100, 4000)
  designPage.preset = DESIGN_PRESETS.find((p) => p.w === designPage.w && p.h === designPage.h)?.id ?? 'custom'
  applyDesignSize()
  fit()
  designCommit()
}
function onPreset(id) {
  const p = DESIGN_PRESETS.find((x) => x.id === id)
  if (p) setPageSize(p.w, p.h)
}
function setBackground(color) {
  designPage.bg = color
  applyDesignSize()
  designCommitSoon()
}
// Run `fn` with the viewport at 1:1, so exports are page-sized whatever the zoom.
function designUnzoomed(fn) {
  fc.setZoom(1)
  fc.setDimensions({ width: designPage.w, height: designPage.h })
  try { return fn() } finally { applyDesignSize() }
}

// ── History ──────────────────────────────────────────────────────────────
const designSnapshot = () => JSON.stringify({ w: designPage.w, h: designPage.h, bg: designPage.bg, c: fc.toObject(DESIGN_EXTRA) })
function designCommit(force = false) {
  clearTimeout(commitTimer)
  if (!fc || restoring) return
  const s = designSnapshot()
  if (!force && designHistory[historyAt] === s) return
  designHistory = designHistory.slice(0, historyAt + 1)
  designHistory.push(s)
  if (designHistory.length > 60) designHistory.shift()
  historyAt = designHistory.length - 1
  syncHistory()
}
function designCommitSoon() {
  clearTimeout(commitTimer)
  commitTimer = setTimeout(designCommit, 400)
}
const syncHistory = () => {
  designUi.canUndo = historyAt > 0
  designUi.canRedo = historyAt < designHistory.length - 1
}
async function designRestore(index) {
  if (!fc || index < 0 || index >= designHistory.length) return
  restoring = true
  try {
    const s = JSON.parse(designHistory[index])
    Object.assign(designPage, { w: s.w, h: s.h, bg: s.bg })
    designPage.preset = DESIGN_PRESETS.find((p) => p.w === s.w && p.h === s.h)?.id ?? 'custom'
    await fc.loadFromJSON(s.c)
    historyAt = index
    applyDesignSize()
  } finally { restoring = false; syncHistory(); syncSelection() }
}
const undo = () => { clearTimeout(commitTimer); designCommit(); return designRestore(historyAt - 1) }
const redo = () => designRestore(historyAt + 1)

// ── Selection → side panel ───────────────────────────────────────────────
function kindOf(o) {
  const F = fabricMod
  if (o.rcMeta?.card) return 'file'
  if (o instanceof F.FabricImage) return 'image'
  if (o instanceof F.Textbox) return 'text'
  if (o instanceof F.Line) return 'line'
  if (o instanceof F.Rect) return 'shape'
  return 'object'
}
function syncSelection() {
  const list = designSelected()
  designSel.n = list.length
  if (!list.length) { designSel.kind = ''; return }
  const a = fc.getActiveObject()
  const b = designBox(a)
  designSel.kind = list.length > 1 ? 'multi' : kindOf(list[0])
  designSel.x = Math.round(b.l)
  designSel.y = Math.round(b.t)
  designSel.w = Math.round(b.w)
  designSel.h = Math.round(b.h)
  designSel.opacity = Math.round((a.opacity ?? 1) * 100)
  const first = list[0]
  const color = first instanceof fabricMod.Line ? first.stroke : first.fill
  designSel.hasFill = typeof color === 'string' && !(first instanceof fabricMod.FabricImage) && !first.rcMeta
  if (designSel.hasFill) designSel.fill = /^#[0-9a-f]{6}$/i.test(color) ? color : designSel.fill
}

// ── Snap guides (page edges / centre / other objects) ────────────────────
let guides = []
function clearGuides() {
  if (!fc || !guides.length) return
  guides.forEach((g) => fc.remove(g))
  guides = []
  fc.requestRenderAll()
}
function snapMoving(o) {
  clearGuides()
  if (!designUi.snap || !o) return
  const th = 6 / fc.getZoom()
  const skip = new Set([o, ...(o.getObjects?.() ?? [])])
  const xs = [0, designPage.w / 2, designPage.w]
  const ys = [0, designPage.h / 2, designPage.h]
  for (const other of designObjects()) {
    if (skip.has(other) || other.visible === false) continue
    const q = designBox(other)
    xs.push(q.l, q.cx, q.r)
    ys.push(q.t, q.cy, q.b)
  }
  const b = designBox(o)
  const nearest = (mine, targets) => {
    let best = null
    for (const m of mine) for (const tg of targets) {
      const d = tg - m
      if (Math.abs(d) <= th && (!best || Math.abs(d) < Math.abs(best.d))) best = { d, at: tg }
    }
    return best
  }
  const sx = nearest([b.l, b.cx, b.r], xs)
  const sy = nearest([b.t, b.cy, b.b], ys)
  if (sx || sy) designShift(o, sx?.d ?? 0, sy?.d ?? 0)
  const z = fc.getZoom()
  const line = (pts) => {
    const g = new fabricMod.Line(pts, {
      stroke: '#ff3b7f', strokeWidth: 1 / z, selectable: false, evented: false,
      excludeFromExport: true, rcGuide: true,
    })
    guides.push(g)
    fc.add(g)
  }
  if (sx) line([sx.at, 0, sx.at, designPage.h])
  if (sy) line([0, sy.at, designPage.w, sy.at])
}

// ── Align / distribute / size / position ─────────────────────────────────
function align(mode) {
  const list = designSelected()
  if (!list.length) return
  fc.discardActiveObject() // work on absolute coordinates, then re-select
  const boxes = list.map(designBox)
  const U = {
    l: Math.min(...boxes.map((b) => b.l)), r: Math.max(...boxes.map((b) => b.r)),
    t: Math.min(...boxes.map((b) => b.t)), b: Math.max(...boxes.map((b) => b.b)),
  }
  U.cx = (U.l + U.r) / 2
  U.cy = (U.t + U.b) / 2
  const toObjects = list.length > 1 && designUi.alignTo === 'objects'
  const ref = toObjects ? U : { l: 0, r: designPage.w, t: 0, b: designPage.h, cx: designPage.w / 2, cy: designPage.h / 2 }
  list.forEach((o, i) => {
    const m = toObjects ? boxes[i] : U // page mode moves the selection as one unit
    const dx = { left: ref.l - m.l, hcenter: ref.cx - m.cx, right: ref.r - m.r }[mode] ?? 0
    const dy = { top: ref.t - m.t, vcenter: ref.cy - m.cy, bottom: ref.b - m.b }[mode] ?? 0
    designShift(o, dx, dy)
  })
  designReselect(list)
  syncSelection()
  designCommit()
}
function distribute(axis) {
  const list = designSelected()
  if (list.length < 3) return
  fc.discardActiveObject()
  const x = axis === 'x'
  const items = list.map((o) => ({ o, b: designBox(o) })).sort((a, b) => (x ? a.b.l - b.b.l : a.b.t - b.b.t))
  const start = x ? items[0].b.l : items[0].b.t
  const end = x ? items.at(-1).b.r : items.at(-1).b.b
  const total = items.reduce((s, i) => s + (x ? i.b.w : i.b.h), 0)
  const gap = (end - start - total) / (items.length - 1)
  let cursor = start
  for (const { o, b } of items) {
    designShift(o, x ? cursor - b.l : 0, x ? 0 : cursor - b.t)
    cursor += (x ? b.w : b.h) + gap
  }
  designReselect(list)
  syncSelection()
  designCommit()
}
function setDimension(axis, value) {
  const o = fc?.getActiveObject()
  const v = Number(value)
  if (!o || !(v > 0)) return
  if (designSel.lock) {
    if (axis === 'w') o.scaleToWidth(v)
    else o.scaleToHeight(v)
  } else {
    o.set(axis === 'w' ? 'scaleX' : 'scaleY', v / (axis === 'w' ? o.width : o.height))
  }
  o.setCoords()
  fc.requestRenderAll()
  syncSelection()
  designCommit()
}
function setPosition(axis, value) {
  const o = fc?.getActiveObject()
  const v = Number(value)
  if (!o || Number.isNaN(v)) return
  const b = designBox(o)
  designShift(o, axis === 'x' ? v - b.l : 0, axis === 'y' ? v - b.t : 0)
  fc.requestRenderAll()
  syncSelection()
  designCommit()
}
function designNudge(dx, dy) {
  const o = fc?.getActiveObject()
  if (!o) return
  designShift(o, dx, dy)
  fc.requestRenderAll()
  syncSelection()
  designCommitSoon()
}

// ── Style / arrange ──────────────────────────────────────────────────────
function setFill(color) {
  designSel.fill = color
  for (const o of designSelected()) {
    if (o instanceof fabricMod.FabricImage || o.rcMeta) continue
    o.set(o instanceof fabricMod.Line ? 'stroke' : 'fill', color)
  }
  fc.requestRenderAll()
  designCommitSoon()
}
function setOpacity(percent) {
  designSel.opacity = percent
  fc.getActiveObject()?.set('opacity', percent / 100)
  fc.requestRenderAll()
  designCommitSoon()
}
function flip() {
  for (const o of designSelected()) o.set('flipX', !o.flipX)
  fc.requestRenderAll()
  designCommit()
}
function arrange(op) {
  const list = designSelected()
  if (!list.length) return
  fc.discardActiveObject()
  const fn = { front: 'bringObjectToFront', back: 'sendObjectToBack', forward: 'bringObjectForward', backward: 'sendObjectBackwards' }[op]
  const ordered = [...list].sort((a, b) => fc.getObjects().indexOf(a) - fc.getObjects().indexOf(b))
  for (const o of (op === 'front' || op === 'forward' ? ordered : ordered.reverse())) fc[fn](o)
  designReselect(list)
  designCommit()
}
async function duplicate() {
  const list = designSelected()
  if (!list.length) return
  fc.discardActiveObject()
  const copies = []
  for (const o of list) {
    const c = await o.clone(DESIGN_EXTRA)
    c.rcId = undefined
    designShift(c, 24, 24)
    fc.add(c)
    copies.push(c)
  }
  designReselect(copies)
  designCommit()
}
function removeSelected() {
  const list = designSelected()
  if (!list.length) return
  fc.discardActiveObject()
  list.forEach((o) => fc.remove(o))
  fc.requestRenderAll()
  designCommit()
}
function designSelectAll() {
  fc.discardActiveObject()
  designReselect(designObjects().filter((o) => o.selectable !== false))
}

// ── Add content ──────────────────────────────────────────────────────────
// `fit`: fraction of the page an object may fill when first placed (0 = keep size).
function designPlace(o, { fit: k = 0 } = {}) {
  const empty = designObjects().length === 0
  o.set({ ...ORIGIN })
  if (k) {
    const s = Math.min((designPage.w * (empty ? 1 : k)) / o.width, (designPage.h * (empty ? 1 : k)) / o.height, 1)
    o.set({ scaleX: s, scaleY: s })
  }
  o.setCoords()
  const b = designBox(o)
  const stagger = empty ? 0 : (designObjects().length % 6) * 18
  designShift(o, designPage.w / 2 - b.cx + stagger, designPage.h / 2 - b.cy + stagger)
  fc.add(o)
  fc.setActiveObject(o)
  fc.requestRenderAll()
  syncSelection()
  designCommit()
}

const readAsDataURL = (file) => new Promise((resolve, reject) => {
  const r = new FileReader()
  r.onload = () => resolve(r.result)
  r.onerror = () => reject(r.error)
  r.readAsDataURL(file)
})

function videoFrame(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const v = document.createElement('video')
    const finish = (fn, value) => { URL.revokeObjectURL(url); fn(value) }
    v.muted = true
    v.preload = 'metadata'
    v.onloadeddata = () => { v.currentTime = Math.min(0.1, (v.duration || 1) / 2) }
    v.onseeked = () => {
      try {
        const s = Math.min(1, 1280 / v.videoWidth)
        const c = document.createElement('canvas')
        c.width = Math.round(v.videoWidth * s)
        c.height = Math.round(v.videoHeight * s)
        c.getContext('2d').drawImage(v, 0, 0, c.width, c.height)
        finish(resolve, c.toDataURL('image/jpeg', 0.82))
      } catch (e) { finish(reject, e) }
    }
    v.onerror = () => finish(reject, new Error('Cannot read video'))
    setTimeout(() => finish(reject, new Error('Video timed out')), 8000)
    v.src = url
  })
}

// Light client-side image compression (skips GIF/SVG, never returns a bigger file).
async function compressImageLocal(file, { quality = 0.86, maxPx = 2000 } = {}) {
  if (!file.type.startsWith('image/') || /gif|svg/.test(file.type)) return file
  const bitmap = await createImageBitmap(file)
  const ratio = Math.min(1, maxPx / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * ratio)
  const h = Math.round(bitmap.height * ratio)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h)
  bitmap.close?.()
  const type = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/webp'
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, quality))
  if (!blob || (ratio === 1 && blob.size >= file.size)) return file
  const ext = { 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/png': 'png' }[blob.type] ?? 'jpg'
  return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.${ext}`, { type: blob.type, lastModified: Date.now() })
}

// Card for any non-image file: coloured type badge + name + size.
function fileCard(file) {
  const F = fabricMod
  const ext = (file.name.split('.').pop() || 'file').slice(0, 4).toUpperCase()
  const color = EXT_COLORS[ext] ?? '#6366f1'
  const name = file.name.length > 28 ? `${file.name.slice(0, 25)}…` : file.name
  const card = new F.Rect({ ...ORIGIN, left: 0, top: 0, width: 300, height: 92, rx: 14, ry: 14, fill: '#ffffff', stroke: '#e5e7eb', strokeWidth: 1 })
  const badge = new F.Rect({ ...ORIGIN, left: 14, top: 14, width: 52, height: 64, rx: 8, ry: 8, fill: color })
  const glyph = new F.Path('M0 0h14l6 6v18H0z M14 0v6h6', {
    ...ORIGIN, left: 30, top: 20, fill: 'rgba(255,255,255,.92)', stroke: color, strokeWidth: 1,
  })
  const tag = new F.Textbox(ext, { ...ORIGIN, left: 14, top: 54, width: 52, fontSize: 13, fontWeight: 700, fill: '#ffffff', textAlign: 'center', fontFamily: DESIGN_FONT })
  const title = new F.Textbox(name, { ...ORIGIN, left: 82, top: 22, width: 200, fontSize: 16, fontWeight: 600, fill: '#111827', fontFamily: DESIGN_FONT })
  const sub = new F.Textbox(`${ext} · ${fmtBytes(file.size)}`, { ...ORIGIN, left: 82, top: 52, width: 200, fontSize: 13, fill: '#6b7280', fontFamily: DESIGN_FONT })
  return new F.Group([card, badge, glyph, tag, title, sub], {
    ...ORIGIN, subTargetCheck: false, rcMeta: { card: true, name: file.name, size: file.size, type: file.type },
  })
}

async function addDesignFile(file) {
  if (!fc) return
  const kind = kindOfFile(file)?.kind ?? 'file'
  try {
    if (kind === 'image') {
      const small = await compressImageLocal(file).catch(() => file)
      const img = await fabricMod.FabricImage.fromURL(await readAsDataURL(small))
      img.set({ rcMeta: { name: file.name, size: file.size, type: file.type } })
      designPlace(img, { fit: 0.6 })
      return
    }
    const id = uid()
    designFiles.set(id, file)
    let obj = null
    if (kind === 'video') {
      try {
        obj = await fabricMod.FabricImage.fromURL(await videoFrame(file))
        obj.set({ rcMeta: { name: file.name, size: file.size, type: file.type, video: true } })
        designPlace(obj, { fit: 0.6 })
      } catch { obj = null }
    }
    if (!obj) { obj = fileCard(file); designPlace(obj) }
    obj.set({ rcFileId: id })
    syncSelection()
  } catch (e) {
    designUi.msg = `${file.name}: ${e?.message || 'could not be added'}`
  }
}
async function addDesignFiles(list) {
  for (const f of Array.from(list)) await addDesignFile(f)
}
function onDesignPick(e) {
  addDesignFiles(e.target.files ?? [])
  e.target.value = ''
}
const onDesignDrop = (e) => addDesignFiles(e.dataTransfer?.files ?? [])
function onDesignPaste(e) {
  const list = Array.from(e.clipboardData?.files ?? [])
  if (!list.length) return
  e.preventDefault()
  addDesignFiles(list)
}

function addText() {
  const box = new fabricMod.Textbox('Double-click to edit', {
    ...ORIGIN, width: designPage.w * 0.5, fontSize: Math.round(designPage.w / 22), fill: '#111827', fontFamily: DESIGN_FONT, fontWeight: 600,
  })
  designPlace(box)
}
function addRect() {
  designPlace(new fabricMod.Rect({ ...ORIGIN, width: Math.round(designPage.w / 4), height: Math.round(designPage.h / 4), fill: '#8c52ff', rx: 12, ry: 12 }))
}
function addLine() {
  const w = Math.round(designPage.w / 3)
  designPlace(new fabricMod.Line([0, 0, w, 0], { ...ORIGIN, stroke: '#111827', strokeWidth: 6, strokeLineCap: 'round' }))
}

// ── Keyboard ─────────────────────────────────────────────────────────────
function onDesignKey(e) {
  if (!fc) return
  const tgt = e.target
  if (tgt instanceof HTMLElement && (tgt.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(tgt.tagName))) return
  if (fc.getActiveObject()?.isEditing) return
  const mod = e.ctrlKey || e.metaKey
  const k = e.key.toLowerCase()
  if (mod && k === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo() }
  else if (mod && k === 'y') { e.preventDefault(); redo() }
  else if (mod && k === 'd') { e.preventDefault(); duplicate() }
  else if (mod && k === 'a') { e.preventDefault(); designSelectAll() }
  else if (k === 'delete' || k === 'backspace') { e.preventDefault(); removeSelected() }
  else if (k === 'escape') { fc.discardActiveObject(); fc.requestRenderAll() }
  else if (k.startsWith('arrow')) {
    e.preventDefault()
    const s = e.shiftKey ? 10 : 1
    designNudge({ arrowleft: -s, arrowright: s }[k] ?? 0, { arrowup: -s, arrowdown: s }[k] ?? 0)
  }
}

// ── Insert into the article ──────────────────────────────────────────────
async function insertDesign() {
  if (!fc || designUi.busy) return
  designUi.busy = true
  designUi.msg = ''
  try {
    clearGuides()
    fc.discardActiveObject()
    const canvas = designUnzoomed(() => fc.toCanvasElement(1))
    const blob = await new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Export failed'))), 'image/png'))
    const file = new File([blob], `design-${Date.now()}.png`, { type: 'image/png', lastModified: Date.now() })
    const problem = validateFile(file)
    if (problem.error) { designUi.msg = problem.error; return }

    const design = { version: 1, w: designPage.w, h: designPage.h, bg: designPage.bg, json: fc.toObject(DESIGN_EXTRA) }
    const onCanvas = new Set(designObjects().map((o) => o.rcFileId).filter(Boolean))
    const attach = designUi.attach ? [...designFiles].filter(([id]) => onCanvas.has(id)).map(([, f]) => f) : []

    const pos = resolveTargetPos()
    const uploadId = uid()
    patchAt(pos, {
      draft: false, status: 'uploading', uploadId, design, kind: 'image',
      filename: file.name, size: file.size, mime: 'image/png', error: '',
    })
    startUpload({ file, kind: 'image', uploadId })
    if (attach.length) insertFiles(attach, pos != null ? pos + 1 : undefined)
    emit('design-saved', { design, pos })
    closeDesign()
  } catch (e) {
    designUi.msg = e?.name === 'SecurityError'
      ? 'An image on the canvas blocks cross-origin export (CORS). Re-add it from your computer or allow CORS on its server.'
      : (e?.message || 'Export failed')
  } finally { designUi.busy = false }
}

// Paste / resize listeners only while open (page scroll stays free: the canvas follows the image).
const onWindowResize = () => fit()
watch(() => designUi.expanded, async (full) => {
  if (typeof document === 'undefined') return
  document.documentElement.style.overflow = full ? 'hidden' : ''
  await nextTick()
  fit()
})
watch(designOpen, (open) => {
  if (typeof document === 'undefined') return
  if (!open) document.documentElement.style.overflow = ''
  const method = open ? 'addEventListener' : 'removeEventListener'
  window[method]('paste', onDesignPaste)
  window[method]('resize', onWindowResize)
})
onBeforeUnmount(() => {
  if (typeof document === 'undefined') return
  document.documentElement.style.overflow = ''
  window.removeEventListener('paste', onDesignPaste)
  window.removeEventListener('resize', onWindowResize)
  clearTimeout(commitTimer)
  cancelAnimationFrame(rafId)
  disposeCanvas()
})

// =====================================================================================================
// Content in/out (envelope, sanitization, v-model sync)
// =====================================================================================================
function scrubDoc(doc) {
  let clone
  try { clone = JSON.parse(JSON.stringify(doc)) } catch { warn('Document could not be cloned (circular or non-serializable); using an empty document.'); return '' }
  const allowTemp = opts.value.allowBlobUrls
  const walk = (node) => {
    if (!isObj(node)) return
    asArray(node.marks).forEach((m) => { if (isObj(m) && isObj(m.attrs) && m.attrs.color != null && !COLOR_RE.test(String(m.attrs.color))) delete m.attrs.color })
    if (node.type === 'media') {
      const a = (node.attrs = isObj(node.attrs) ? node.attrs : {})
      a.kind = KINDS.includes(a.kind) ? a.kind : 'image'
      a.align = ALIGNS.includes(a.align) ? a.align : 'center'
      a.width = clampWidth(a.width)
      a.layout = MEDIA_LAYOUTS.includes(a.layout) ? a.layout : null
      a.height = Number.isFinite(Number(a.height)) && Number(a.height) > 0 ? Math.round(Number(a.height)) : null
      a.linked = a.linked === true
      a.src = safeUrl(a.src, allowTemp)
      if (a.status === 'uploading' && !pending.has(a.uploadId)) { a.status = 'error'; a.error = t('rve_upload_interrupted', 'Upload was interrupted.'); a.uploadId = null }
      else if (!a.src && a.status !== 'uploading') { a.status = 'error'; a.error = asStr(a.error) || t('rve_this_file_not_available', 'This file is not available.') }
    }
    asArray(node.content).forEach(walk)
  }
  if (isObj(clone) && Array.isArray(clone.content)) clone.content = clone.content.filter(isObj)
  walk(clone)
  return clone
}
/** Accepts envelope | Tiptap doc | node[] | {json, html} | HTML string | null | undefined | ''. Never throws. */
function toEditorContent(value) {
  try {
    if (value == null) return ''
    if (typeof value === 'string') return value.trim() ? sanitizeHTML(value) : ''
    if (Array.isArray(value)) return value.length && value.every(isObj) ? scrubDoc({ type: 'doc', content: value }) : ''
    if (!isObj(value)) return ''
    if (value.schema === SCHEMA_ID) return isObj(value.doc) ? scrubDoc(value.doc) : ''
    if (value.type === 'doc') return scrubDoc(value)
    if ('json' in value || 'html' in value) return toEditorContent(value.json ?? value.html)
    if (Object.keys(value).length) warn('Unrecognized modelValue shape; using an empty document.')
    return ''
  } catch (err) {
    warn('modelValue could not be processed:', err)
    return ''
  }
}
function buildEnvelope(ed) {
  const doc = ed.getJSON()
  const fonts = new Set()
  let pendingUploads = 0
  const walk = (n) => {
    n.marks?.forEach((m) => { if (m.type === 'textStyle' && m.attrs?.fontFamily) fonts.add(m.attrs.fontFamily) })
    if (n.type === 'media' && n.attrs?.status === 'uploading') pendingUploads++
    n.content?.forEach(walk)
  }
  walk(doc)
  return {
    schema: SCHEMA_ID, version: SCHEMA_VERSION, doc,
    fonts: [...fonts].sort().map((family) => ({ family, stack: (Array.isArray(opts.value.fonts) ? opts.value.fonts : []).find((f) => f.key === family)?.stack ?? null })),
    meta: { pendingUploads },
  }
}
let timer = null
let dirty = false
let lastEmitted = props.modelValue
function serialize(ed) {
  if (props.output === 'html') return sanitizeHTML(ed.getHTML())
  const json = buildEnvelope(ed)
  return props.output === 'both' ? { json, html: sanitizeHTML(ed.getHTML()) } : json
}
function commit() {
  clearTimeout(timer)
  timer = null
  const ed = any()
  if (!ed || !dirty) return
  dirty = false
  let value
  try { value = serialize(ed) } catch (err) { emit('error', { source: 'editor', code: 'serialize', error: err }); return }
  lastEmitted = value
  emit('update:modelValue', value)
  emit('change', value)
}
const schedule = () => { dirty = true; clearTimeout(timer); timer = setTimeout(commit, opts.value.emitDebounce) }

// Registered BEFORE useEditor so it runs before the editor is destroyed on unmount.
onBeforeUnmount(() => {
  commit()
  clearTimeout(timer)
  clearTimeout(noticeTimer)
  cancelAnimationFrame(bumpRaf)
  pending.forEach((p) => p.controller?.abort())
})

// =====================================================================================================
// Editor
// =====================================================================================================
slashItems = buildSlashItems()
const insertItems = slashItems.slice() // read-only snapshot passed to the toolbar

function buildExtensions() {
  const cfg = (key, value = {}) => (on(key) ? value : false)
  const list = [
    StarterKit.configure({
      heading: cfg('headings', { levels: [1, 2, 3, 4, 5, 6] }),
      bold: cfg('textFormatting'), italic: cfg('textFormatting'), strike: cfg('textFormatting'), underline: cfg('textFormatting'), code: cfg('textFormatting'),
      blockquote: cfg('blockquote'),
      bulletList: cfg('lists'), orderedList: cfg('lists'), listItem: cfg('lists'), listKeymap: cfg('lists'),
      codeBlock: cfg('codeBlock'), horizontalRule: cfg('divider'),
      undoRedo: cfg('history', { depth: 100, newGroupDelay: 500 }),
      dropcursor: { color: 'var(--color-primary)', width: 2 },
      link: cfg('links', { openOnClick: false, autolink: true, linkOnPaste: true, defaultProtocol: 'https', protocols: ['mailto', 'tel'], HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' } }),
    }),
  ]
  if (on('fonts') || on('colors') || on('spacing')) list.push(TextStyle)
  if (on('colors')) list.push(Color, Highlight.configure({ multicolor: true }))
  if (on('fonts') || on('spacing')) list.push(RVTextStyle)
  if (on('textFormatting')) list.push(Subscript, Superscript)
  if (on('alignment')) list.push(TextAlign.configure({ types: ['heading', 'paragraph'] }))
  if (on('lists')) list.push(TaskList, TaskItem.configure({ nested: true }))
  if (on('tables')) list.push(TableKit.configure({ table: { resizable: true } }))
  if (on('spacing') || on('indent')) list.push(RVBlockStyle)
  if (on('callout')) list.push(RVCallout)
  if (on('media')) list.push(RVMedia)
  if (on('typography')) list.push(Typography)
  if (on('slashMenu')) list.push(RVSlash)
  if (on('wordCount')) list.push(CharacterCount)
  list.push(Placeholder.configure({
    placeholder: ({ node, editor: e }) => (node.type.name === 'heading' ? t(`rve_heading_${node.attrs.level}`, `Heading ${node.attrs.level}`) : e.isEmpty ? props.placeholder : t('rve_type_slash', "Type '/' for commands…")),
    showOnlyCurrent: true,
    includeChildren: true,
  }))
  const extra = asArray(props.extensions).filter((x) => {
    const ok = !!x && typeof x === 'object' && ['extension', 'node', 'mark'].includes(x.type) && typeof x.name === 'string'
    if (!ok) warn('Ignoring invalid entry in `extensions` prop:', x)
    return ok
  })
  return [...list, ...extra]
}

const editor = useEditor({
  content: import.meta.client ? toEditorContent(props.modelValue) : '',
  extensions: buildExtensions(),
  editable: isEditable.value,
  autofocus: props.autofocus,
  immediatelyRender: false,
  editorProps: {
    attributes: { class: 'rv-prose', role: 'textbox', 'aria-multiline': 'true', 'aria-label': t('rve_document_body', 'Document body') },
    handleDOMEvents: { pointerdown: () => { selecting = true; return false } },
  },
  onCreate: ({ editor: e }) => { try { docEmpty.value = e.isEmpty } catch { /* not ready */ } bump() },
  onTransaction: bump,
  onUpdate: () => { emit('update'); schedule() },
  onSelectionUpdate: () => scheduleBubble(),
  onFocus: ({ event }) => { emit('focus', event); scheduleBubble() },
  onBlur: ({ event }) => { commit(); emit('blur', event); scheduleBubble() },
})

watch(() => props.modelValue, (value) => {
  const ed = live()
  if (!ed || value === lastEmitted) return
  const content = toEditorContent(value)
  if (isObj(content) && JSON.stringify(content) === JSON.stringify(ed.getJSON())) { lastEmitted = value; return }
  clearTimeout(timer)
  dirty = false
  ed.commands.setContent(content, { emitUpdate: false })
  lastEmitted = value
})
watch(isEditable, (v) => any()?.setEditable(v, false))
// once the editor exists, refresh after the view mounts (toolbar/footer/ready) even if no transaction occurs
watch(editor, (e) => { if (e) { bump(); setTimeout(bump, 60) } })

// =====================================================================================================
// Block handle (+ / drag grip) and block menu — Notion style
// =====================================================================================================
const handle = reactive({ visible: false, pos: -1, top: 0, left: 0 })
const blockMenu = reactive({ open: false })
const blockMenuEl = ref(null)
const handleShown = computed(() => on('blockHandle') && isEditable.value && !compact.value && handle.visible)
let hoverRaf = 0

function placeHandle(topPos) {
  const ed = live()
  const rootEl = root.value
  if (!ed || !rootEl) return false
  const node = ed.state.doc.nodeAt(topPos)
  const dom = node ? ed.view.nodeDOM(topPos) : null
  if (!dom?.getBoundingClientRect) return false
  const r = dom.getBoundingClientRect()
  const base = rootEl.getBoundingClientRect()
  const content = ed.view.dom.getBoundingClientRect()
  const lh = parseFloat(getComputedStyle(dom).lineHeight) || 26
  handle.pos = topPos
  handle.top = r.top - base.top + Math.max(0, (lh - 24) / 2)
  handle.left = content.left - base.left - 54
  return true
}
function updateHandle(x, y) {
  const ed = live()
  if (!ed || blockMenu.open) return
  const view = ed.view
  const box = view.dom.getBoundingClientRect()
  if (y < box.top || y > box.bottom) { handle.visible = false; return }
  const res = view.posAtCoords({ left: Math.min(Math.max(x, box.left + 4), box.right - 4), top: y })
  if (!res) { handle.visible = false; return }
  const doc = ed.state.doc
  const inside = Math.min(res.inside >= 0 ? res.inside : res.pos, doc.content.size)
  const $i = doc.resolve(inside)
  const topPos = $i.depth ? $i.before(1) : inside
  handle.visible = placeHandle(topPos)
}
function onBodyMouseMove(e) {
  if (!on('blockHandle') || !isEditable.value || compact.value) return
  cancelAnimationFrame(hoverRaf)
  hoverRaf = requestAnimationFrame(() => updateHandle(e.clientX, e.clientY))
}
function onRootLeave() { if (!blockMenu.open) handle.visible = false }
function refreshHandle() { if (handle.visible && handle.pos >= 0 && !placeHandle(handle.pos)) handle.visible = false }

function insertBelow() {
  const ed = live()
  const node = ed?.state.doc.nodeAt(handle.pos)
  if (!node) return
  if (node.type.name === 'paragraph' && node.content.size === 0) {
    ed.chain().focus().setTextSelection(handle.pos + 1).insertContent('/').run()
    return
  }
  const after = handle.pos + node.nodeSize
  ed.chain().focus().insertContentAt(after, { type: 'paragraph', content: [{ type: 'text', text: '/' }] }).setTextSelection(after + 2).run()
}
function onHandleDragStart(e) {
  const ed = live()
  if (!ed || handle.pos < 0) return
  const view = ed.view
  const sel = NodeSelection.create(view.state.doc, handle.pos)
  view.dispatch(view.state.tr.setSelection(sel))
  view.dragging = { slice: sel.content(), move: true }
  const dom = view.nodeDOM(handle.pos)
  e.dataTransfer.effectAllowed = 'copyMove'
  e.dataTransfer.setData('text/plain', sel.content().content.textBetween(0, sel.content().content.size, '\n') || ' ')
  if (dom) e.dataTransfer.setDragImage(dom, 0, 0)
  blockMenu.open = false
}
function onHandleDragEnd() { const ed = live(); if (ed) ed.view.dragging = null }

const blockNode = () => live()?.state.doc.nodeAt(handle.pos) ?? null
const canTurn = () => ['paragraph', 'heading'].includes(blockNode()?.type.name)
const turnInto = (fn) => { const ed = live(); if (!ed) return; ed.chain().focus().setTextSelection(handle.pos + 1).run(); fn(ed); blockMenu.open = false }
function duplicateBlock() {
  const ed = live(); const node = blockNode()
  if (!ed || !node) return
  const copy = node.type.name === 'media' ? node.type.create({ ...node.attrs, uploadId: null, status: node.attrs.status === 'ready' ? 'ready' : 'error', error: node.attrs.status === 'ready' ? '' : t('rve_duplicate_unfinished', 'Duplicate of an unfinished upload.') }, node.content, node.marks) : node
  ed.view.dispatch(ed.state.tr.insert(handle.pos + node.nodeSize, copy))
  blockMenu.open = false
}
function deleteBlock() {
  const ed = live(); const node = blockNode()
  if (!ed || !node) return
  ed.view.dispatch(ed.state.tr.delete(handle.pos, handle.pos + node.nodeSize))
  blockMenu.open = false
  handle.visible = false
}
function moveBlock(dir) {
  const ed = live(); const node = blockNode()
  if (!ed || !node) return
  const doc = ed.state.doc
  const index = doc.resolve(handle.pos).index(0)
  const sibling = doc.maybeChild(index + dir)
  if (!sibling) return
  const tr = ed.state.tr.delete(handle.pos, handle.pos + node.nodeSize)
  const target = dir < 0 ? handle.pos - sibling.nodeSize : handle.pos + sibling.nodeSize
  tr.insert(target, node)
  ed.view.dispatch(tr.scrollIntoView())
  blockMenu.open = false
  nextTick(refreshHandle)
}
const blockActions = computed(() => {
  void tick.value
  const turn = []
  if (canTurn()) {
    turn.push([tl('Text'), 'i-lucide-pilcrow', (e) => e.chain().focus().setParagraph().run()])
    if (on('headings')) for (const n of [1, 2, 3]) turn.push([t(`rve_heading_${n}`, `Heading ${n}`), `i-lucide-heading-${n}`, (e) => e.chain().focus().setHeading({ level: n }).run()])
    if (on('lists')) turn.push([tl('Bulleted list'), 'i-lucide-list', (e) => e.chain().focus().toggleBulletList().run()], [tl('Numbered list'), 'i-lucide-list-ordered', (e) => e.chain().focus().toggleOrderedList().run()], [tl('To-do list'), 'i-lucide-list-checks', (e) => e.chain().focus().toggleTaskList().run()])
    if (on('blockquote')) turn.push([tl('Quote'), 'i-lucide-text-quote', (e) => e.chain().focus().toggleBlockquote().run()])
  }
  return turn
})
function toggleBlockMenu() {
  blockMenu.open = !blockMenu.open
}
onClickOutside(blockMenuEl, () => { blockMenu.open = false }, { ignore: ['.rv-handle'] })

// =====================================================================================================
// Selection bubble menu (turn into · B I U S code · link · colors)
// =====================================================================================================
const bubble = reactive({ visible: false, x: 0, y: 0, mode: 'main', url: '', error: '', hover: false })
const bubbleEl = ref(null)
const bubbleInput = ref(null)
let selecting = false
let bubbleRaf = 0
const bubbleOn = () => on('bubbleMenu') && on('textFormatting') && isEditable.value

function updateBubble() {
  const ed = live()
  if (!ed) return
  const sel = ed.state.selection
  const lock = bubble.mode !== 'main' || bubble.hover
  const show = bubbleOn() && !sel.empty && !sel.node && !selecting && (ed.isFocused || lock) && !act('codeBlock')
  bubble.visible = show
  if (!show) { if (!lock) bubble.mode = 'main'; return }
  nextTick(placeBubble)
}
function placeBubble() {
  const ed = live()
  const el = bubbleEl.value
  if (!ed || !el) return
  const { from, to } = ed.state.selection
  const a = ed.view.coordsAtPos(from)
  const b = ed.view.coordsAtPos(to)
  const w = el.offsetWidth
  const hgt = el.offsetHeight
  const cx = (Math.min(a.left, b.left) + Math.max(a.right, b.right)) / 2
  let y = Math.min(a.top, b.top) - hgt - 10
  if (y < 8) y = Math.max(a.bottom, b.bottom) + 10
  y = Math.max(8, Math.min(y, window.innerHeight - hgt - 8))
  bubble.x = Math.round(Math.max(8, Math.min(cx - w / 2, window.innerWidth - w - 8)))
  bubble.y = Math.round(y)
}
function scheduleBubble() {
  if (bubbleRaf) return
  bubbleRaf = requestAnimationFrame(() => { bubbleRaf = 0; updateBubble() })
}
const onWindowPointerUp = () => { if (selecting) { selecting = false; scheduleBubble() } }
const onWindowScroll = () => { scheduleBubble(); refreshHandle(); if (slash.open) slash.rect = slash.rect && { ...slash.rect } }

const bubbleBlockLabel = () => (act('heading') ? t(`rve_heading_${attrs('heading').level}`, `Heading ${attrs('heading').level}`) : act('bulletList') ? tl('Bulleted list') : act('orderedList') ? tl('Numbered list') : act('taskList') ? tl('To-do list') : act('blockquote') ? tl('Quote') : tl('Text'))
const bubbleTurn = computed(() => {
  void tick.value
  const list = [[tl('Text'), 'i-lucide-pilcrow', () => chain().setParagraph().run()]]
  if (on('headings')) for (const n of [1, 2, 3]) list.push([t(`rve_heading_${n}`, `Heading ${n}`), `i-lucide-heading-${n}`, () => chain().setHeading({ level: n }).run()])
  if (on('lists')) list.push([tl('Bulleted list'), 'i-lucide-list', () => chain().toggleBulletList().run()], [tl('Numbered list'), 'i-lucide-list-ordered', () => chain().toggleOrderedList().run()], [tl('To-do list'), 'i-lucide-list-checks', () => chain().toggleTaskList().run()])
  if (on('blockquote')) list.push([tl('Quote'), 'i-lucide-text-quote', () => chain().toggleBlockquote().run()])
  return list
})
function openBubbleMode(mode) {
  bubble.mode = bubble.mode === mode ? 'main' : mode
  if (bubble.mode === 'link') {
    bubble.url = attrs('link').href ?? ''
    bubble.error = ''
    nextTick(() => { placeBubble(); bubbleInput.value?.focus() })
  } else nextTick(placeBubble)
}
function closeBubble(refocus = true) {
  bubble.mode = 'main'
  if (refocus) live()?.commands.focus()
  scheduleBubble()
}

// ---- links (shared by the bubble and the toolbar popover) ------------------------------------------
const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:'])
function normalizeUrl(raw) {
  const v = String(raw ?? '').trim()
  if (!v) return null
  let candidate = v
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) candidate = `mailto:${v}`
  else if (!/^[a-z][a-z0-9+.-]*:/i.test(v) && !v.startsWith('/') && !v.startsWith('#')) candidate = `https://${v}`
  try { return ALLOWED_PROTOCOLS.has(new URL(candidate, 'https://placeholder.invalid').protocol) ? candidate : null } catch { return null }
}
function applyLink(raw) {
  const href = normalizeUrl(raw)
  if (!href) return false
  const ed = live()
  if (!ed) return false
  if (ed.state.selection.empty && !ed.isActive('link')) ed.chain().focus().insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] }).run()
  else ed.chain().focus().extendMarkRange('link').setLink({ href }).run()
  return true
}
function submitBubbleLink() {
  if (!applyLink(bubble.url)) { bubble.error = t('rve_enter_valid_link', 'Enter a valid http(s), mailto or tel link.'); return }
  closeBubble(true)
}
function removeBubbleLink() { chain().extendMarkRange('link').unsetLink().run(); closeBubble(true) }

// =====================================================================================================
// Shared helpers for the bubble + page (the ribbon lives in RVToolbar.vue)
// =====================================================================================================
const chain = () => live()?.chain().focus() ?? noop
const usable = (key) => isEditable.value && features[key]?.enabled === true
const vis = (key) => feat.value[key]?.visible === true
const MARKS = [
  { id: 'bold', icon: 'i-lucide-bold', label: 'Bold', kbd: ['meta', 'B'], run: () => chain().toggleBold().run() },
  { id: 'italic', icon: 'i-lucide-italic', label: 'Italic', kbd: ['meta', 'I'], run: () => chain().toggleItalic().run() },
  { id: 'underline', icon: 'i-lucide-underline', label: 'Underline', kbd: ['meta', 'U'], run: () => chain().toggleUnderline().run() },
  { id: 'strike', icon: 'i-lucide-strikethrough', label: 'Strikethrough', kbd: ['meta', 'shift', 'S'], run: () => chain().toggleStrike().run() },
  { id: 'code', icon: 'i-lucide-code', label: 'Inline code', kbd: ['meta', 'E'], run: () => chain().toggleCode().run() },
]
const setTextColor = (v) => { (typeof v === 'string' && COLOR_RE.test(v) ? chain().setColor(v) : chain().unsetColor()).run(); closeBubble(true) }
const setHighlightColor = (v) => { (typeof v === 'string' && COLOR_RE.test(v) ? chain().setHighlight({ color: v }) : chain().unsetHighlight()).run(); closeBubble(true) }
function openLink() {
  const ed = live()
  if (!ed || !usable('links')) return
  if (bubbleOn() && !ed.state.selection.empty) { bubble.visible = true; openBubbleMode('link') }
  else toolbarRef.value?.openLink?.()
}

// ---- page-level interactions -----------------------------------------------------------------------
function onBodyMouseDown(event) {
  if (!isEditable.value || event.button !== 0) return
  if (event.target.closest?.('.ProseMirror, .rv-start')) return
  event.preventDefault()
  live()?.commands.focus('end')
}
function onRootKeydown(e) {
  if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'k') { e.preventDefault(); openLink() }
  if (e.key === 'Escape') blockMenu.open = false
}

const showStart = computed(() => docEmpty.value && isEditable.value && on('slashMenu') && !slash.open)
const START_IDS = ['heading-1', 'bullet-list', 'todo-list', 'table', 'image', 'video', 'audio', 'file', 'callout']
const startItems = computed(() => START_IDS.map((id) => slashItems.find((i) => i.id === id)).filter(Boolean))
function runStart(item) { const e = live(); if (!e) return; e.commands.focus('start'); item.run(e) }

const counts = computed(() => {
  void tick.value
  const s = any()?.storage?.characterCount
  return s ? { words: s.words(), characters: s.characters() } : null
})
const pageStyle = computed(() => ({ minHeight: cssSize(props.minHeight, '480px'), maxWidth: cssSize(props.maxWidth, '860px'), ...(zoom.value === 100 ? {} : { zoom: zoom.value / 100 }) }))
const setZoom = (v) => { const n = Number(v); zoom.value = Number.isFinite(n) ? Math.min(200, Math.max(50, Math.round(n / 10) * 10)) : 100 }

onMounted(() => {
  mounted.value = true
  watchHostMode()
  window.addEventListener('pointerup', onWindowPointerUp)
  window.addEventListener('scroll', onWindowScroll, true)
  window.addEventListener('resize', onWindowScroll)
})
onBeforeUnmount(() => {
  hostModeObserver?.disconnect()
  hostModeObserver = null
  window.removeEventListener('pointerup', onWindowPointerUp)
  window.removeEventListener('scroll', onWindowScroll, true)
  window.removeEventListener('resize', onWindowScroll)
  cancelAnimationFrame(hoverRaf)
  cancelAnimationFrame(bubbleRaf)
})

// =====================================================================================================
// Exposed methods (all safe on a destroyed / uninitialized editor)
// =====================================================================================================
defineExpose({
  getEditor: () => any(),
  getHTML: () => { const e = any(); return e ? sanitizeHTML(e.getHTML()) : '' },
  getJSON: () => { const e = any(); return e ? buildEnvelope(e) : null },
  getText: () => any()?.getText() ?? '',
  setContent: (content) => { live()?.commands.setContent(toEditorContent(content), { emitUpdate: true }) },
  clearContent: () => { live()?.commands.setContent('', { emitUpdate: true }) },
  focus: (position) => { live()?.commands.focus(position) },
  blur: () => { live()?.commands.blur() },
  undo: () => live()?.commands.undo() ?? false,
  redo: () => live()?.commands.redo() ?? false,
  setEditable: (v) => { runtimeEditable.value = !!v },
  destroy: () => { any()?.destroy() },
  insertFiles: (files) => insertFiles(files),
  insertImage: (fileOrUrl) => (typeof fileOrUrl === 'string' ? insertMediaUrl('image', fileOrUrl) : insertFiles([fileOrUrl])),
  insertVideo: (url) => insertMediaUrl('video', url),
  insertAudio: (url) => insertMediaUrl('audio', url),
  insertFile: (url) => insertMediaUrl('file', url),
  insertMediaUrl,
  openMediaUrl,
  pickFiles,
  isUploading: () => Array.from(pending.values()).some((p) => p.controller),
})
</script>

<template>
  <!-- :class="{ dark: forceDark }" -->
  <div
    ref="root"
    class="rv-editor"
    :data-rv-theme="opts.theme"
    :data-rv-appearance="opts.appearance"
    :data-rv-compact="compact"
    :data-rv-editable="String(isEditable)"
    :data-tick="tick"
    @keydown="onRootKeydown"
    @dragenter.capture="onDragEnter"
    @dragover.capture="onDragOver"
    @dragleave.capture="onDragLeave"
    @drop.capture="onDrop"
    @mouseleave="onRootLeave"
  >
    <!-- ================= Toolbar (separate component: Word-style ribbon / compact row) ================= -->
    <RVToolbar
      v-if="editor && feat.toolbar.visible"
      ref="toolbarRef"
      :editor="editor"
      :features="feat"
      :fonts="opts.fonts"
      :font-sizes="opts.fontSizes"
      :editable="isEditable"
      :mode="opts.toolbarMode"
      :compact="compact"
      :insert-items="insertItems"
      :text-colors="TEXT_COLORS"
      :highlights="HIGHLIGHTS"
      :apply-link="applyLink"
      :tick="tick"
      :t="t"
    />

    <!-- ================= Document ================= -->
    <div class="rv-body" @mousedown="onBodyMouseDown" @mousemove="onBodyMouseMove">
      <div class="rv-page" :style="pageStyle">
        <EditorContent :editor="editor" class="rv-content" />
        <div v-if="showStart" class="rv-start">
          <p class="rv-start__hint">{{ t('rve_press_slash', 'Press') }} <kbd>/</kbd> {{ t('rve_press_slash_suffix', 'for commands, or start with') }}</p>
          <div class="rv-start__chips">
            <button v-for="item in startItems" :key="item.id" type="button" class="rv-chip" @mousedown.prevent @click="runStart(item)"><RIcon :name="item.icon" />{{ t(item.titleKey, item.title) }}</button>
          </div>
          <p v-if="feat.dropFiles.register" class="rv-start__drop"><UIcon name="i-lucide-cloud-upload" /> {{ t('rve_drag_drop_hint', 'Drag & drop images, video, audio or documents anywhere on the page') }}</p>
        </div>
      </div>
    </div>

    <!-- ================= Block handle + menu (Notion style) ================= -->
    <div v-if="handleShown" class="rv-handle" :style="{ top: `${handle.top}px`, left: `${handle.left}px` }">
      <RTooltip :text="t('rve_add_block_below_title', 'Click to add a block below')" side="top"  >
        <button type="button" class="rv-handle__btn" :aria-label="t('rve_add_block_below', 'Add a block below')" @mousedown.prevent @click="insertBelow"><UIcon name="i-lucide-plus" /></button>
      </RTooltip>
      <RTooltip :text="t('rve_drag_move_options_title', 'Drag to move · click for options')" side="top" >
        <button type="button" class="rv-handle__btn rv-handle__grip" draggable="true" :aria-label="t('rve_drag_move_options', 'Drag to move, click for options')" @dragstart="onHandleDragStart" @dragend="onHandleDragEnd" @click="toggleBlockMenu"><UIcon name="i-lucide-grip-vertical" /></button>
      </RTooltip>
    </div>
    <div v-if="blockMenu.open && handleShown" ref="blockMenuEl" class="rv-menu" role="menu" :style="{ top: `${handle.top + 28}px`, left: `${handle.left}px` }">
      <template v-if="blockActions.length">
        <div class="rv-menu__label">{{ t('rve_turn_into', 'Turn into') }}</div>
        <button v-for="a in blockActions" :key="a[0]" type="button" class="rv-menu__item" role="menuitem" @click="turnInto(a[2])"><UIcon :name="a[1]" />{{ a[0] }}</button>
        <div class="rv-menu__sep" />
      </template>
      <button type="button" class="rv-menu__item" role="menuitem" @click="duplicateBlock"><UIcon name="i-lucide-copy" />{{ t('rve_duplicate', 'Duplicate') }}</button>
      <button type="button" class="rv-menu__item" role="menuitem" @click="moveBlock(-1)"><UIcon name="i-lucide-arrow-up" />{{ t('rve_move_up', 'Move up') }}</button>
      <button type="button" class="rv-menu__item" role="menuitem" @click="moveBlock(1)"><UIcon name="i-lucide-arrow-down" />{{ t('rve_move_down', 'Move down') }}</button>
      <div class="rv-menu__sep" />
      <button type="button" class="rv-menu__item rv-menu__item--danger" role="menuitem" @click="deleteBlock"><UIcon name="i-lucide-trash-2" />{{ t('rve_delete', 'Delete') }}</button>
    </div>

    <!-- ================= Selection bubble ================= -->
    <div v-show="bubble.visible" ref="bubbleEl" class="rv-bubble" :style="{ left: `${bubble.x}px`, top: `${bubble.y}px` }" @mouseenter="bubble.hover = true" @mouseleave="bubble.hover = false">
      <div v-if="bubble.mode !== 'link'" class="rv-bubble__bar" role="toolbar" :aria-label="t('rve_selection_formatting', 'Selection formatting')">
        <button v-if="bubbleTurn.length > 1" type="button" class="rv-bubble__turn" aria-haspopup="true" :aria-expanded="bubble.mode === 'turn'" @mousedown.prevent @click="openBubbleMode('turn')">{{ bubbleBlockLabel() }} <UIcon name="i-lucide-chevron-down" /></button>
        <RTooltip v-for="m in MARKS" :key="m.id" :text="tl(m.label)">
          <button type="button" class="rv-btn" :class="{ 'is-active': act(m.id) }" :aria-label="tl(m.label)" :aria-pressed="act(m.id)" @mousedown.prevent @click="m.run()"><UIcon :name="m.icon" /></button>
        </RTooltip>
        <RTooltip v-if="vis('links') && usable('links')" :text="t('rve_link', 'Link')">
          <button type="button" class="rv-btn" :class="{ 'is-active': act('link') }" :aria-label="t('rve_link', 'Link')" @mousedown.prevent @click="openBubbleMode('link')"><UIcon name="i-lucide-link" /></button>
        </RTooltip>
        <RTooltip v-if="vis('colors') && usable('colors')" :text="t('rve_text_color', 'Text color')">
          <button type="button" class="rv-btn" :class="{ 'is-active': bubble.mode === 'color' }" :aria-label="t('rve_text_color', 'Text color')" aria-haspopup="true" @mousedown.prevent @click="openBubbleMode('color')"><UIcon name="i-lucide-baseline" /></button>
        </RTooltip>
        <RTooltip v-if="vis('colors') && usable('colors')" :text="t('rve_highlight', 'Highlight')">
          <button type="button" class="rv-btn" :class="{ 'is-active': bubble.mode === 'highlight' }" :aria-label="t('rve_highlight', 'Highlight')" aria-haspopup="true" @mousedown.prevent @click="openBubbleMode('highlight')"><UIcon name="i-lucide-highlighter" /></button>
        </RTooltip>
      </div>
      <div v-else class="rv-bubble__link">
        <input ref="bubbleInput" v-model="bubble.url" class="rv-input" type="text" :placeholder="t('rve_paste_link', 'Paste a link…')" :aria-label="t('rve_link_url', 'Link URL')" @keydown.enter.prevent="submitBubbleLink" @keydown.esc.prevent="closeBubble(true)">
        <button type="button" class="rv-pill rv-pill--primary" @click="submitBubbleLink">{{ t('rve_apply', 'Apply') }}</button>
        <button v-if="act('link')" type="button" class="rv-pill" @click="removeBubbleLink">{{ t('rve_remove', 'Remove') }}</button>
        <p v-if="bubble.error" class="rv-pop__error" role="alert">{{ bubble.error }}</p>
      </div>
      <div v-if="bubble.mode === 'turn'" class="rv-bubble__panel" role="menu">
        <button v-for="t2 in bubbleTurn" :key="t2[0]" type="button" class="rv-menu__item" role="menuitem" @mousedown.prevent @click="t2[2](); closeBubble(true)"><UIcon :name="t2[1]" />{{ t2[0] }}</button>
      </div>
      <div v-if="bubble.mode === 'color'" class="rv-bubble__panel rv-bubble__panel--colors">
        <div class="rv-pop__label">{{ t('rve_text_color', 'Text color') }}</div>
        <div class="rv-swatches">
          <button type="button" class="rv-swatch rv-swatch--none" :aria-label="t('rve_default_text_color', 'Default text color')" @mousedown.prevent @click="setTextColor(null)">A</button>
          <button v-for="c in TEXT_COLORS" :key="c.value" type="button" class="rv-swatch" :style="{ color: c.value }" :aria-label="`${tl(c.name)} ${t('rve_text_color', 'Text color')}`" @mousedown.prevent @click="setTextColor(c.value)">A</button>
        </div>
      </div>
      <div v-if="bubble.mode === 'highlight'" class="rv-bubble__panel rv-bubble__panel--colors">
        <div class="rv-pop__label">{{ t('rve_highlight', 'Highlight') }}</div>
        <div class="rv-swatches">
          <button type="button" class="rv-swatch rv-swatch--none" :aria-label="t('rve_no_highlight', 'No highlight')" @mousedown.prevent @click="setHighlightColor(null)"><UIcon name="i-lucide-ban" /></button>
          <button v-for="c in HIGHLIGHTS" :key="c.value" type="button" class="rv-swatch rv-swatch--bg" :style="{ background: c.value }" :aria-label="`${tl(c.name)} ${t('rve_highlight', 'Highlight')}`" @mousedown.prevent @click="setHighlightColor(c.value)" />
        </div>
      </div>
    </div>

    <!-- ================= Slash menu: shows every tool the moment "/" is typed ================= -->
    <div v-if="slash.open" ref="slashEl" class="rv-slash" role="listbox" :aria-label="t('rve_insert_a_block', 'Insert a block')" :style="slashStyle">
      <template v-if="slashGroups.length">
        <div v-for="g in slashGroups" :key="g.key" class="rv-slash__section">
          <div class="rv-slash__group">{{ g.name }}</div>
          <button v-for="e in g.items" :key="e.item.id" type="button" class="rv-slash__item" role="option" :aria-selected="e.i === slash.index" @mousedown.prevent="slash.command(e.item)" @mousemove="slash.index = e.i">
            <span class="rv-slash__icon"><RIcon :name="e.item.icon" /></span>
            <span class="rv-slash__text"><strong>{{ t(e.item.titleKey, e.item.title) }}</strong><small>{{ t(e.item.hintKey, e.item.hint) }}</small></span>
          </button>
        </div>
      </template>
      <div v-else class="rv-slash__empty">{{ t('rve_no_results', 'No results') }}</div>
    </div>

    <!-- ================= Drop zone, notices, status ================= -->
    <div v-if="dropping" class="rv-drop" aria-hidden="true">
      <div class="rv-drop__card">
        <UIcon name="i-lucide-cloud-upload" class="rv-drop__icon" />
        <strong>{{ t('rve_drop_to_upload', 'Drop to upload') }}</strong>
        <span>{{ t('rve_drop_hint', 'Images, video, audio and documents') }}</span>
      </div>
    </div>

    <!-- ── Design canvas (fabric) — edits IN PLACE ──────────────────────────
         The canvas is drawn exactly over the image in the article (it follows
         scroll / resize). "Expand" switches to a full-screen workspace.
         Built into REditor; fabric loads on first use. -->
    <Teleport v-if="canvasEnabled" to="body">
      <div
        v-if="designOpen" ref="designRoot" class="r-design" :class="designUi.expanded ? 'is-full' : 'is-inplace'"
        :style="designFrameStyle" role="dialog" aria-label="Design canvas" tabindex="-1" @keydown="onDesignKey"
      >
        <div class="r-design__dock" :style="designDockStyle">
          <!-- Header -->
          <div class="r-design__bar">
            <strong class="r-design__title">{{ designPlaceholder ? $t('new_design') : $t('edit_design') }}</strong>
            <RTooltip text="Undo (Ctrl+Z)" side="bottom">
              <button type="button" class="r-design__btn" :disabled="!designUi.canUndo" @click="undo"><i class="i-lucide-undo-2" /></button>
            </RTooltip>
            <RTooltip text="Redo (Ctrl+Shift+Z)" side="bottom">
              <button type="button" class="r-design__btn" :disabled="!designUi.canRedo" @click="redo"><i class="i-lucide-redo-2" /></button>
            </RTooltip>
            <select class="r-design__field" :value="designPage.preset" aria-label="Page size" @change="onPreset($event.target.value)">
              <option v-for="p in DESIGN_PRESETS" :key="p.id" :value="p.id">{{ $t(p.label) }}</option>
              <option value="custom" disabled>Custom</option>
            </select>
            <input class="r-design__field r-design__num" type="number" min="100" max="4000" :value="designPage.w" aria-label="Page width" @change="setPageSize($event.target.value, designPage.h)">
            <span>×</span>
            <input class="r-design__field r-design__num" type="number" min="100" max="4000" :value="designPage.h" aria-label="Page height" @change="setPageSize(designPage.w, $event.target.value)">
            <RTooltip text="Page background" side="bottom">
              <input class="r-design__color" type="color" :value="designPage.bg" aria-label="Page background" @input="setBackground($event.target.value)">
            </RTooltip>
            <span class="r-design__grow" />
            <RTooltip text="Also insert the documents / videos you added as file blocks under the image" side="bottom">
              <label class="r-design__check">
                <input v-model="designUi.attach" type="checkbox"> {{ $t('attach_files') }}
              </label>
            </RTooltip>
            <RTooltip :text="designUi.expanded ? 'Back to in-place' : 'Expand to full screen'" side="bottom">
              <button type="button" class="r-design__btn" @click="designUi.expanded = !designUi.expanded">
                <i :class="designUi.expanded ? 'i-lucide-minimize-2' : 'i-lucide-maximize-2'" />
              </button>
            </RTooltip>
            <button type="button" class="r-design__btn r-design__btn--text" @click="closeDesign({ cancelled: true })">Cancel</button>
            <button type="button" class="r-design__btn r-design__btn--text r-design__btn--primary" :disabled="!designUi.ready || designUi.busy" @click="insertDesign">
              {{ designUi.busy ? 'Working…' : 'Done' }}
            </button>
          </div>

          <!-- Tools: add / align / arrange -->
          <div class="r-design__tools">
            <input ref="designFileInput" type="file" multiple hidden @change="onDesignPick">
            <RTooltip text="Add files" side="bottom">
              <button type="button" class="r-design__btn r-design__btn--text" @click="designFileInput?.click()"><i class="i-lucide-paperclip" /> Add files</button>
            </RTooltip>
            <RTooltip text="Text" side="bottom">
              <button type="button" class="r-design__btn" @click="addText"><i class="i-lucide-type" /></button>
            </RTooltip>
            <RTooltip text="Rectangle" side="bottom">
              <button type="button" class="r-design__btn" @click="addRect"><i class="i-lucide-square" /></button>
            </RTooltip>
            <RTooltip text="Line" side="bottom">
              <button type="button" class="r-design__btn" @click="addLine"><i class="i-lucide-minus" /></button>
            </RTooltip>
            <span class="r-design__sep" />
            <RTooltip text="Align relative to" side="bottom">
              <select v-model="designUi.alignTo" class="r-design__field" aria-label="Align relative to">
                <option value="page">To page</option>
                <option value="objects">To each other</option>
              </select>
            </RTooltip>
            <RTooltip v-for="[mode, icon, label] in ALIGN_BUTTONS" :key="mode" :text="label" side="bottom">
              <button type="button" class="r-design__btn" :disabled="!designSel.n" @click="align(mode)"><i :class="icon" /></button>
            </RTooltip>
            <RTooltip text="Distribute horizontally" side="bottom">
              <button type="button" class="r-design__btn" :disabled="designSel.n < 3" @click="distribute('x')"><i class="i-lucide-align-horizontal-distribute-center" /></button>
            </RTooltip>
            <RTooltip text="Distribute vertically" side="bottom">
              <button type="button" class="r-design__btn" :disabled="designSel.n < 3" @click="distribute('y')"><i class="i-lucide-align-vertical-distribute-center" /></button>
            </RTooltip>
            <span class="r-design__sep" />
            <RTooltip v-for="[op, icon, label] in ORDER_BUTTONS" :key="op" :text="label" side="bottom">
              <button type="button" class="r-design__btn" :disabled="!designSel.n" @click="arrange(op)"><i :class="icon" /></button>
            </RTooltip>
            <RTooltip text="Flip horizontally" side="bottom">
              <button type="button" class="r-design__btn" :disabled="!designSel.n" @click="flip"><i class="i-lucide-flip-horizontal-2" /></button>
            </RTooltip>
            <RTooltip text="Duplicate (Ctrl+D)" side="bottom">
              <button type="button" class="r-design__btn" :disabled="!designSel.n" @click="duplicate"><i class="i-lucide-copy" /></button>
            </RTooltip>
            <RTooltip text="Delete" side="bottom">
              <button type="button" class="r-design__btn r-design__btn--danger" :disabled="!designSel.n" @click="removeSelected"><i class="i-lucide-trash-2" /></button>
            </RTooltip>
            <span class="r-design__sep" />
            <label class="r-design__check"><input v-model="designUi.snap" type="checkbox"> Snap</label>
          </div>

          <!-- Properties of the selection -->
          <div v-if="designSel.n" class="r-design__props">
            <span class="r-design__kind">{{ designSel.n > 1 ? `${designSel.n} objects` : designSel.kind }}</span>
            <label>X <input class="r-design__field r-design__num" type="number" :value="designSel.x" @change="setPosition('x', $event.target.value)"></label>
            <label>Y <input class="r-design__field r-design__num" type="number" :value="designSel.y" @change="setPosition('y', $event.target.value)"></label>
            <label>W <input class="r-design__field r-design__num" type="number" min="1" :value="designSel.w" @change="setDimension('w', $event.target.value)"></label>
            <label>H <input class="r-design__field r-design__num" type="number" min="1" :value="designSel.h" @change="setDimension('h', $event.target.value)"></label>
            <label class="r-design__check"><input v-model="designSel.lock" type="checkbox"> Ratio</label>
            <label v-if="designSel.hasFill" class="r-design__check">Colour <input class="r-design__color" type="color" :value="designSel.fill" @input="setFill($event.target.value)"></label>
            <label class="r-design__check">Opacity
              <input type="range" min="5" max="100" :value="designSel.opacity" @input="setOpacity(Number($event.target.value))" @change="designCommit()">
            </label>
          </div>
          <p v-else class="r-design__hint">{{ tBy({en:'Drop or paste any file onto the canvas · drag corners to resize · Shift-click to select several, then align / distribute',
          km:'អូស ឬបិទភ្ជាប់ឯកសារណាមួយទៅលើផ្ទៃការងារ · អូសជ្រុងដើម្បីប្ដូរទំហំ · ចុចដោយសង្កត់គ្រាប់ចុច Shift ដើម្បីជ្រើសរើសធាតុច្រើន រួចតម្រឹម ឬចែកគម្លាតឱ្យស្មើគ្នា។'}) }}</p>
          <p v-if="designUi.msg" class="r-design__error" role="alert">{{ designUi.msg }}</p>
        </div>

        <div class="r-design__body">
          <div ref="designStage" class="r-design__stage" @dragover.prevent @drop.prevent="onDesignDrop">
            <div class="r-design__page"><canvas ref="designCanvasEl" /></div>
            <div v-if="!designUi.ready" class="r-design__loading" role="status">Loading canvas…</div>
          </div>
        </div>

        <footer v-if="designUi.expanded" class="r-design__foot">
          <span class="r-design__grow" />
          <RTooltip text="Zoom out" side="top">
            <button type="button" class="r-design__btn" @click="setDesignZoom(designUi.zoom / 1.2)"><i class="i-lucide-zoom-out" /></button>
          </RTooltip>
          <input type="range" min="5" max="300" :value="Math.round(designUi.zoom * 100)" aria-label="Zoom" @input="setDesignZoom(Number($event.target.value) / 100)">
          <RTooltip text="Zoom in" side="top">
            <button type="button" class="r-design__btn" @click="setDesignZoom(designUi.zoom * 1.2)"><i class="i-lucide-zoom-in" /></button>
          </RTooltip>
          <span class="r-design__pct">{{ Math.round(designUi.zoom * 100) }}%</span>
          <RTooltip text="Fit to screen" side="top">
            <button type="button" class="r-design__btn" @click="fit"><i class="i-lucide-maximize" /></button>
          </RTooltip>
        </footer>
      </div>
    </Teleport>

    <div v-if="notice" class="rv-notice" role="status"><UIcon name="i-lucide-info" />{{ notice }}</div>
    <!-- ================= Footer (optional: options.footer) ================= -->
    <footer v-if="editor && feat.footer.visible" class="rv-footer" role="contentinfo">
      <div class="rv-footer__group">
        <span v-if="!isEditable" class="rv-badge">{{ t('rve_read_only', 'Read-only') }}</span>
        <span v-if="uploading > 0" class="rv-footer__busy" role="status"><UIcon name="i-lucide-loader-circle" class="rv-spin" /> {{ t('rve_uploading', 'Uploading') }} {{ uploading }} {{ uploading === 1 ? t('rve_file_singular', 'file') : t('rve_file_plural', 'files') }}…</span>
      </div>
      <div class="rv-footer__group">
        <template v-if="feat.wordCount.visible && counts">
          <span>{{ counts.words }} {{ counts.words === 1 ? t('rve_word', 'word') : t('rve_words', 'words') }}</span>
          <span>{{ counts.characters }} {{ counts.characters === 1 ? t('rve_character', 'character') : t('rve_characters', 'characters') }}</span>
        </template>
        <div v-if="feat.zoom.visible" class="rv-zoom" role="group" :aria-label="t('rve_zoom', 'Zoom')">
          <button type="button" class="rv-btn rv-btn--sm" :aria-label="t('rve_zoom_out', 'Zoom out')" :disabled="zoom <= 50" @click="setZoom(zoom - 10)"><UIcon name="i-lucide-minus" /></button>
          <input class="rv-zoom__range" type="range" min="50" max="200" step="10" :value="zoom" :aria-label="t('rve_zoom_level', 'Zoom level')" @input="setZoom($event.target.value)">
          <button type="button" class="rv-btn rv-btn--sm" :aria-label="t('rve_zoom_in', 'Zoom in')" :disabled="zoom >= 200" @click="setZoom(zoom + 10)"><UIcon name="i-lucide-plus" /></button>
          <button type="button" class="rv-zoom__value" :aria-label="t('rve_reset_zoom', 'Reset zoom')" @click="setZoom(100)">{{ zoom }}%</button>
        </div>
      </div>
    </footer>

    <RModal
      v-model="mediaUrl.open"
      :title="t('rve_media_from_url', 'Media from URL')"
      :description="t('rve_media_from_url_desc', 'Paste a public image, video, audio or document link.')"
      icon="ri-link"
      modal-width="520px"
      @on-close="mediaUrl.error = ''"
    >
      <div class="rv-url">
        <label class="rv-url__field">
          <span>{{ t('rve_type', 'Type') }}</span>
          <select v-model="mediaUrl.kind" class="rv-input" :aria-label="t('rve_type', 'Type')" @change="mediaUrl.error = ''">
            <option v-for="k in mediaUrlKinds" :key="k.value" :value="k.value">{{ k.label }}</option>
          </select>
        </label>
        <label class="rv-url__field">
          <span>{{ t('rve_url', 'URL') }}</span>
          <input ref="mediaUrlInput" v-model="mediaUrl.url" class="rv-input" type="url" inputmode="url" spellcheck="false" :placeholder="t('rve_media_url_placeholder', 'https://example.com/file.pdf')" :aria-label="t('rve_url', 'URL')" @input="mediaUrl.error = ''" @keydown.enter.prevent="submitMediaUrl">
        </label>
        <p v-if="mediaUrl.error" class="rv-pop__error" role="alert">
          {{ mediaUrl.error }}
        </p>
        <p class="rv-url__hint">
          {{ t('rve_media_url_hint', 'The link is embedded directly. Download, preview and rename controls appear on the file block.') }}
        </p>
      </div>
      <template #footer>
        <button type="button" class="rv-pill" @click="mediaUrl.open = false">
          {{ t('rve_cancel', 'Cancel') }}
        </button>
        <button type="button" class="rv-pill rv-pill--primary" :disabled="!mediaUrl.url.trim()" @click="submitMediaUrl">
          {{ t('rve_insert', 'Insert') }}
        </button>
      </template>
    </RModal>

    <input ref="fileInput" type="file" multiple hidden @change="onPicked">
  </div>
</template>

<style lang="scss">
// Colors come ONLY from the host design tokens in _color.scss (:root = light, .dark = dark). This file declares no
// custom properties of its own; spacing/radius/fonts are plain values. Dynamic colors (swatches) are set inline.
.rv-editor {
  position: relative;
  display: flex;
  flex-direction: column;
  font-family: var(--font-400 , ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif) ;
  color: var(--color-w-b-1);
}
// // theme="light" inside a dark host: re-state the light values of the _color.scss tokens used here (mirrors its :root).
// .dark .rv-editor[data-rv-theme='light']:not(.dark) {
//   --bg-tertiary: #f1f3f6;
//   --bg-content: #ffffff;
//   --bg-wrapper: #ffffff;
//   --bg-hover: #f2f2f2;
//   --border-card: #f0f0f0;
//   --color-w-b-1: #111827;
//   --color-w-b-4: #d0d2d6;
//   --color-w-b-5: #f8f5f0;
//   --c-muted: #8a7f72;
//   --color-primary: #d11717;
//   --c-accent: #ff8c42;
//   --color-shadow: rgba(26, 26, 26, 0.2);
//   --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.08), 0 1px 0 rgba(255, 255, 255, 0.8) inset;
// }

// ---- appearances: paper (Word/Canva sheet on a canvas) and notion (seamless page) ----------------------
.rv-editor[data-rv-appearance='paper'] {
  background: var(--bg-wrapper);
  border: 1px solid var(--border-card);
  border-radius: 12px;
  .rv-body { padding: 28px 16px 40px; cursor: text; }
  .rv-page { padding: 56px 62px; background: var(--bg-content); border-radius: 8px; box-shadow: var(--glass-shadow); }
  .rv-start { left: 72px; right: 72px; }
}
.rv-editor[data-rv-appearance='notion'] {
  background: var(--bg-content);
  border: 1px solid var(--border-card);
  border-radius: 12px;
  .rv-body { padding: 16px 12px 24px; cursor: text; }
  .rv-page { padding: 56px 96px; background: transparent; box-shadow: none; }
  .rv-start { left: 96px; right: 96px; }
}
.rv-editor[data-rv-compact='true'] {
  .rv-body { padding-left: 0; padding-right: 0; }
  .rv-page { padding: 28px 20px; }
  .rv-start { left: 20px; right: 20px; top: calc(28px + 2.6rem); }
}

// ---- shared controls (also used by RVToolbar) ------------------------------------------------------
.rv-btn {
  display: inline-grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  color: var(--c-muted);
  font-size: 1rem;
  position: relative;
  transition: background 140ms cubic-bezier(0.2, 0.7, 0.2, 1), color 140ms cubic-bezier(0.2, 0.7, 0.2, 1);
  &:hover:not(:disabled) { background: color-mix(in srgb, var(--color-w-b-1) 8%, transparent); color: var(--color-w-b-1); }
  &.is-active { background: color-mix(in srgb, var(--color-primary) 11%, transparent); color: var(--color-primary); }
  &:disabled { opacity: 0.38; cursor: not-allowed; }
  &:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 1px; }
  .rv-btn__bar { position: absolute; left: 7px; right: 7px; bottom: 3px; height: 3px; border-radius: 2px; }
}
.rv-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 12px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-w-b-1);
  background: var(--bg-hover);
  border: 1px solid var(--border-card);
  border-radius: 6px;
  cursor: pointer;
  transition: background 120ms cubic-bezier(0.2, 0.7, 0.2, 1);
  &:hover:not(:disabled) { background: color-mix(in srgb, var(--color-w-b-1) 8%, transparent); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
  &.is-active { background: color-mix(in srgb, var(--color-primary) 11%, transparent); color: var(--color-primary); }
}
.rv-pill--primary {
  color: var(--color-w-b-5);
  background: var(--color-primary);
  border-color: transparent;
  &:hover:not(:disabled) { background: color-mix(in srgb, var(--color-primary) 88%, black); }
}
.rv-input {
  flex: 1 1 auto;
  min-width: 0;
  height: 30px;
  padding: 0 8px;
  font: inherit;
  font-size: 0.8125rem;
  color: var(--color-w-b-1);
  background: var(--bg-content);
  border: 1px solid var(--color-w-b-4);
  border-radius: 6px;
  &:focus { outline: 2px solid var(--color-primary); outline-offset: -1px; }
}
.rv-url { display: grid; gap: 14px; }
.rv-url .rv-input { width: 100%; }
.rv-url__field {
  display: grid;
  gap: 6px;
  span { font-size: 0.75rem; font-weight: 600; color: var(--c-muted); }
}
.rv-url__hint { margin: 0; font-size: 0.75rem; line-height: 1.5; color: color-mix(in srgb, var(--c-muted) 75%, transparent); }

// ---- popovers / menus --------------------------------------------------------------------------------
.rv-pop, .rv-menu, .rv-bubble__panel {
  background: var(--bg-content);
  border: 1px solid var(--border-card);
  border-radius: 8px;
  box-shadow: var(--glass-shadow);
}
.rv-pop { position: absolute; z-index: 40; top: calc(100% + 6px); left: 0; display: grid; gap: 8px; min-width: 14rem; max-width: calc(100vw - 16px); max-height: calc(100vh - 16px); overflow-y: auto; padding: 12px; }
.rv-pop--up { top: auto; bottom: calc(100% + 6px); }
.rv-pop--end { left: auto; right: 0; }
.rv-pop--link { min-width: 18rem; }
.rv-pop--insert { min-width: 14rem; max-height: 22rem; overflow-y: auto; gap: 2px; padding: 8px; }
.rv-pop__label { font-size: 0.75rem; font-weight: 600; color: color-mix(in srgb, var(--c-muted) 65%, transparent); text-transform: uppercase; letter-spacing: 0.04em; padding: 4px 4px 0; }
.rv-pop__error { margin: 0; font-size: 0.75rem; color: var(--r-c-danger); }
.rv-pop__actions { display: flex; gap: 8px; }
.rv-pop__item, .rv-menu__item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 8px;
  font-size: 0.875rem;
  text-align: left;
  color: var(--color-w-b-1);
  border-radius: 6px;
  cursor: pointer;
  &:hover { background: color-mix(in srgb, var(--color-w-b-1) 8%, transparent); }
  .iconify { color: var(--c-muted); }
}
.rv-menu { position: absolute; z-index: 45; min-width: 13rem; padding: 6px; }
.rv-menu__label { padding: 4px 8px; font-size: 0.75rem; font-weight: 600; color: color-mix(in srgb, var(--c-muted) 65%, transparent); text-transform: uppercase; letter-spacing: 0.04em; }
.rv-menu__sep { height: 1px; margin: 4px 0; background: var(--border-card); }
.rv-menu__item--danger { color: var(--r-c-danger); }
.rv-swatches { display: grid; grid-template-columns: repeat(5, 1.75rem); gap: 6px; }
.rv-swatch {
  display: grid;
  place-items: center;
  width: 1.75rem;
  height: 1.75rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-w-b-1);
  background: var(--bg-content);
  border: 1px solid var(--color-w-b-4);
  border-radius: 6px;
  cursor: pointer;
  &:hover { transform: scale(1.08); }
  &:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
}
.rv-swatch--bg { color: transparent; }

// ---- selection bubble ------------------------------------------------------------------------------
.rv-bubble { position: fixed; z-index: 60; }
.rv-bubble__bar, .rv-bubble__link {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
  padding: 4px;
  background: var(--bg-content);
  border: 1px solid var(--border-card);
  border-radius: 8px;
  box-shadow: var(--glass-shadow);
}
.rv-bubble__link { width: 21rem; gap: 8px; padding: 8px; }
.rv-bubble__turn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 30px;
  padding: 0 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-w-b-1);
  border-radius: 6px;
  border-right: 1px solid var(--border-card);
  margin-right: 2px;
  &:hover { background: color-mix(in srgb, var(--color-w-b-1) 8%, transparent); }
}
.rv-bubble__panel { position: absolute; top: calc(100% + 6px); left: 0; min-width: 13rem; padding: 6px; display: grid; gap: 4px; }
.rv-bubble__panel--colors { padding: 12px; width: max-content; }

// ---- block handle ---------------------------------------------------------------------------------
.rv-handle { position: absolute; z-index: 25; display: flex; gap: 2px; }
.rv-handle__btn {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  color: color-mix(in srgb, var(--c-muted) 65%, transparent);
  border-radius: 6px;
  cursor: pointer;
  &:hover { background: color-mix(in srgb, var(--color-w-b-1) 8%, transparent); color: var(--c-muted); }
}
.rv-handle__grip { cursor: grab; &:active { cursor: grabbing; } }

// ---- slash menu ---------------------------------------------------------------------------------------
.rv-slash {
  position: fixed;
  z-index: 70;
  width: 20.5rem;
  overflow-y: auto;
  padding: 6px;
  background: var(--bg-content);
  border: 1px solid var(--border-card);
  border-radius: 10px;
  box-shadow: var(--glass-shadow);
  overscroll-behavior: contain;
}
.rv-slash__group { padding: 8px 8px 4px; font-size: 0.75rem; font-weight: 600; color: color-mix(in srgb, var(--c-muted) 65%, transparent); }
.rv-slash__item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 5px 8px;
  text-align: left;
  color: var(--color-w-b-1);
  border-radius: 6px;
  cursor: pointer;
  &[aria-selected='true'] { background: color-mix(in srgb, var(--color-w-b-1) 8%, transparent); }
}
.rv-slash__icon {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 2.75rem;
  height: 2.75rem;
  font-size: 1.35rem;
  color: var(--color-w-b-1);
  background: var(--bg-content);
  border: 1px solid var(--border-card);
  border-radius: 6px;
}
.rv-slash__text { display: grid; line-height: 1.3; strong { font-size: 0.875rem; font-weight: 500; } small { font-size: 0.75rem; color: var(--c-muted); } }
.rv-slash__empty { padding: 12px; font-size: 0.875rem; color: var(--c-muted); }

// ---- page ------------------------------------------------------------------------------------------------
.rv-body { flex: 1 1 auto; background: var(--bg-wrapper);}
.rv-page {
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: 100%;
  margin: 0 auto;
}
.rv-content { flex: 1 1 auto; display: flex; flex-direction: column; min-width: 0; }
.rv-start { position: absolute; left: 96px; right: 96px; top: calc(56px + 2.6rem); display: grid; gap: 12px; }
.rv-start__hint, .rv-start__drop { margin: 0; font-size: 0.875rem; color: var(--c-muted); }
.rv-start__drop { display: flex; align-items: center; gap: 6px; color: color-mix(in srgb, var(--c-muted) 65%, transparent); }
.rv-start__chips { display: flex; flex-wrap: wrap; gap: 8px; }
.rv-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 0.8125rem;
  color: var(--color-w-b-1);
  background: var(--bg-hover);
  border: 1px solid var(--border-card);
  border-radius: 999px;
  cursor: pointer;
  transition: background 120ms cubic-bezier(0.2, 0.7, 0.2, 1), border-color 120ms cubic-bezier(0.2, 0.7, 0.2, 1);
  &:hover { background: color-mix(in srgb, var(--color-w-b-1) 8%, transparent); border-color: var(--color-w-b-4); }
}
.rv-editor kbd { padding: 0 5px; font-family: var(--font-400, ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace); font-size: 0.85em; border: 1px solid var(--color-w-b-4); border-radius: 4px; background: var(--bg-hover); }

// ---- drop zone, notice, status -----------------------------------------------------------------------
.rv-drop {
  position: absolute;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--bg-content) 78%, transparent);
  backdrop-filter: blur(3px);
  border: 2px dashed var(--color-primary);
  border-radius: inherit;
  pointer-events: none;
}
.rv-drop__card { display: grid; justify-items: center; gap: 4px; padding: 24px 40px; text-align: center; background: var(--bg-content); border-radius: 12px; box-shadow: var(--glass-shadow); strong { font-size: 1.1rem; } span { font-size: 0.8125rem; color: var(--c-muted); } }
.rv-drop__icon { font-size: 2.5rem; color: var(--color-primary); }
.rv-notice {
  position: absolute;
  left: 50%;
  bottom: 16px;
  z-index: 85;
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: calc(100% - 32px);
  padding: 8px 14px;
  font-size: 0.8125rem;
  color: var(--color-w-b-1);
  background: var(--bg-content);
  border: 1px solid var(--color-w-b-4);
  border-radius: 999px;
  box-shadow: var(--glass-shadow);
  transform: translateX(-50%);
}

// ---- prose -------------------------------------------------------------------------------------------------
.rv-prose {
  flex: 1 1 auto;
  outline: none;
  font-family: var(--font-400, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif);
  font-size: 1rem;
  line-height: 1.65;
  color: var(--color-w-b-1);
  caret-color: var(--color-w-b-1);
  overflow-wrap: anywhere;
  ::selection { background: color-mix(in srgb, var(--c-accent) 30%, transparent); }
  > :first-child { margin-top: 0; }

  p { margin: 0 0 0.35em; }
  h1, h2, h3, h4, h5, h6 { margin: 1.4em 0 0.3em; line-height: 1.25; font-weight: 650; }
  h1 { font-size: 2.1em; } h2 { font-size: 1.6em; } h3 { font-size: 1.3em; } h4 { font-size: 1.1em; } h5, h6 { font-size: 1em; }
  ul, ol { margin: 0 0 0.4em; padding-left: 1.6em; }
  li > p { margin-bottom: 0.15em; }
  ul[data-type='taskList'] {
    list-style: none;
    padding-left: 0.2em;
    li { display: flex; gap: 0.5em; align-items: flex-start; }
    li > label { flex: 0 0 auto; margin-top: 0.38em; user-select: none; }
    li > div { flex: 1 1 auto; }
    li[data-checked='true'] > div { color: var(--c-muted); text-decoration: line-through; }
    input[type='checkbox'] { width: 1em; height: 1em; accent-color: var(--color-primary); cursor: pointer; }
  }
  blockquote { margin: 0.6em 0; padding: 0.1em 1em; border-left: 3px solid var(--color-w-b-1); }
  a { color: inherit; text-decoration: underline; text-decoration-color: color-mix(in srgb, var(--c-muted) 65%, transparent); text-underline-offset: 3px; cursor: pointer; &:hover { text-decoration-color: currentColor; } }
  mark { border-radius: 3px; padding: 0 0.12em; }
  hr { border: 0; border-top: 1px solid var(--color-w-b-4); margin: 1.4em 0; }
  pre { margin: 0.8em 0; padding: 0.9em 1.1em; overflow-x: auto; font-family: var(--fong-400,ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace); font-size: 0.88em; background: var(--bg-hover); border-radius: 8px; code { background: none; padding: 0; } }
  :not(pre) > code { font-family: var(--font-500,ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace); font-size: 0.88em; padding: 0.12em 0.4em; color: var(--r-c-danger); background: var(--bg-hover); border-radius: 4px; }
  p.is-empty::before, h1.is-empty::before, h2.is-empty::before, h3.is-empty::before, h4.is-empty::before, h5.is-empty::before, h6.is-empty::before {
    content: attr(data-placeholder);
    float: left;
    height: 0;
    color: color-mix(in srgb, var(--c-muted) 65%, transparent);
    pointer-events: none;
  }

  .tableWrapper { overflow-x: auto; margin: 0.8em 0; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; overflow: hidden; }
  td, th { position: relative; min-width: 1em; padding: 6px 10px; vertical-align: top; border: 1px solid var(--color-w-b-4); > p { margin: 0; } }
  th { background: var(--bg-hover); font-weight: 600; text-align: left; }
  .selectedCell::after { content: ''; position: absolute; inset: 0; background: color-mix(in srgb, var(--color-primary) 11%, transparent); pointer-events: none; }
  .column-resize-handle { position: absolute; top: 0; right: -2px; bottom: -2px; width: 4px; background: var(--color-primary); pointer-events: none; }
  &.resize-cursor { cursor: col-resize; }

  .rv-callout {
    display: flex;
    gap: 12px;
    margin: 0.6em 0;
    padding: 14px 16px;
    background: var(--r-c-info-bg);
    border-radius: 8px;
    &::before { content: '💡'; flex: 0 0 auto; line-height: 1.65; }
    &[data-rv-callout='warning'] { background: var(--r-c-warning-bg); &::before { content: '⚠️'; } }
    &[data-rv-callout='success'] { background: var(--r-c-success-bg); &::before { content: '✅'; } }
    > div { flex: 1 1 auto; min-width: 0; > :last-child { margin-bottom: 0; } }
  }
  .ProseMirror-dropcursor { border-radius: 2px; }
  .ProseMirror-gapcursor::after { border-top-color: var(--color-w-b-1); }
}
.rv-editor[data-rv-editable='false'] .rv-body { cursor: default; }

// ---- media blocks (NodeView) ------------------------------------------------------------------------------
.rv-media {
  display: flex;
  margin: 0.6em 0;
  &[data-align='left'] { justify-content: flex-start; }
  &[data-align='center'] { justify-content: center; }
  &[data-align='right'] { justify-content: flex-end; }
  &[data-layout='float-left'] { float: left; margin: 0.25em 1rem 0.5em 0; }
  &[data-layout='float-right'] { float: right; margin: 0.25em 0 0.5em 1rem; }
}
.rv-media__figure { position: relative; width: 100%; max-width: 100%; margin: 0; border-radius: 8px; transition: outline-color 120ms cubic-bezier(0.2, 0.7, 0.2, 1); outline: 2px solid transparent; outline-offset: 3px; }
.rv-media[data-kind='audio'] .rv-media__figure, .rv-media[data-kind='file'] .rv-media__figure { max-width: 640px; }
.rv-media.is-selected .rv-media__figure { outline-color: var(--color-primary); }
.rv-media__img, .rv-media__video { display: block; width: 100%; height: auto; border-radius: 8px; background: var(--bg-hover); }
.rv-media__audio { display: block; width: 100%; }
.rv-media__state { display: grid; gap: 8px; padding: 18px 16px; font-size: 0.875rem; color: var(--c-muted); background: var(--bg-hover); border: 1px dashed var(--color-w-b-4); border-radius: 8px; }
.rv-media__state--error { color: var(--r-c-danger); border-color: var(--r-c-danger); }
.rv-media__label { display: flex; align-items: center; gap: 8px; }
.rv-media__pct { margin-left: auto; font-variant-numeric: tabular-nums; }
.rv-media__progress { height: 6px; overflow: hidden; background: var(--border-card); border-radius: 999px; span { display: block; height: 100%; background: var(--color-primary); transition: width 160ms linear; } }
.rv-media__actions { display: flex; gap: 8px; }
.rv-media__bar {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 3;
  display: flex;
  gap: 2px;
  padding: 3px;
  background: color-mix(in srgb, var(--color-w-b-1) 85%, transparent);
  border-radius: 6px;
  opacity: 0;
  transition: opacity 120ms cubic-bezier(0.2, 0.7, 0.2, 1);
  &:empty { display: none; }
}
.rv-media__figure:hover .rv-media__bar, .rv-media.is-selected .rv-media__bar { opacity: 1; }
.rv-media__btn {
  display: inline-grid;
  place-items: center;
  min-width: 26px;
  height: 26px;
  padding: 0 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--bg-content);
  border-radius: 4px;
  cursor: pointer;
  &:hover, &.is-active { background: color-mix(in srgb, var(--bg-content) 22%, transparent); }
}
.rv-media__state .rv-media__btn { color: var(--color-w-b-1); background: var(--bg-content); border: 1px solid var(--color-w-b-4); padding: 0 12px; }
.rv-media__resize {
  position: absolute;
  z-index: 3;
  width: 10px;
  height: 10px;
  background: var(--bg-content);
  border: 1px solid var(--color-primary);
  border-radius: 2px;
  opacity: 0;
  transition: opacity 120ms cubic-bezier(0.2, 0.7, 0.2, 1);
  &[hidden] { display: none; }
}
.rv-media__resize--nw { top: -5px; left: -5px; cursor: nwse-resize; }
.rv-media__resize--n { top: -5px; left: 50%; margin-left: -5px; cursor: ns-resize; }
.rv-media__resize--ne { top: -5px; right: -5px; cursor: nesw-resize; }
.rv-media__resize--e { top: 50%; right: -5px; margin-top: -5px; cursor: ew-resize; }
.rv-media__resize--se { bottom: -5px; right: -5px; cursor: nwse-resize; }
.rv-media__resize--s { bottom: -5px; left: 50%; margin-left: -5px; cursor: ns-resize; }
.rv-media__resize--sw { bottom: -5px; left: -5px; cursor: nesw-resize; }
.rv-media__resize--w { top: 50%; left: -5px; margin-top: -5px; cursor: ew-resize; }
.rv-media__figure:hover .rv-media__resize, .rv-media.is-selected .rv-media__resize { opacity: 1; }
.rv-media__badge {
  position: absolute;
  bottom: 8px;
  left: 8px;
  z-index: 4;
  padding: 2px 7px;
  font-size: 0.6875rem;
  font-variant-numeric: tabular-nums;
  color: var(--bg-content);
  background: color-mix(in srgb, var(--color-w-b-1) 85%, transparent);
  border-radius: 4px;
  pointer-events: none;
  &[hidden] { display: none; }
}
.rv-media__menu {
  position: fixed;
  z-index: 60;
  min-width: 150px;
  padding: 4px;
  background: var(--c-surface);
  border: 1px solid var(--border-card);
  border-radius: 8px;
  box-shadow: 0 8px 24px color-mix(in srgb, #000 18%, transparent);
}
.rv-media__menu-item {
  display: block;
  width: 100%;
  padding: 6px 10px;
  font-size: 0.8125rem;
  color: var(--color-w-b-1);
  text-align: left;
  background: transparent;
  border: 0;
  border-radius: 5px;
  cursor: pointer;
  &:hover { background: var(--bg-hover); }
  &.is-active { color: var(--color-primary); font-weight: 600; }
}
.rv-media__caption {
  display: block;
  width: 100%;
  margin-top: 6px;
  padding: 2px 4px;
  font: inherit;
  font-size: 0.8125rem;
  color: var(--c-muted);
  text-align: center;
  background: transparent;
  border: 0;
  outline: none;
  &:placeholder-shown { height: 0; padding: 0; margin: 0; overflow: hidden; opacity: 0; }
  &:focus { color: var(--color-w-b-1); }
}
.rv-media__figure:hover .rv-media__caption:placeholder-shown, .rv-media.is-selected .rv-media__caption:placeholder-shown { height: auto; padding: 2px 4px; margin-top: 6px; opacity: 1; }
.rv-file {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  color: var(--color-w-b-1);
  text-decoration: none !important;
  background: var(--bg-hover);
  border: 1px solid var(--border-card);
  border-radius: 8px;
  &:hover { background: color-mix(in srgb, var(--color-w-b-1) 8%, transparent); }
}
.rv-file__icon { display: grid; place-items: center; width: 40px; height: 40px; color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 11%, transparent); border-radius: 6px; }
.rv-file__meta { display: grid; min-width: 0; flex: 1 1 auto; strong { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } small { color: var(--c-muted); } }
.rv-file__dl { color: var(--c-muted); }

// ---- footer (optional) ---------------------------------------------------------------------------------
.rv-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 30px;
  padding: 2px 12px;
  font-size: 0.75rem;
  color: var(--c-muted);
  background: var(--bg-hover);
  border-top: 1px solid var(--border-card);
  border-radius: 0 0 12px 12px;
}
.rv-footer__group { display: flex; align-items: center; gap: 12px; min-width: 0; }
.rv-footer__busy { display: inline-flex; align-items: center; gap: 6px; color: var(--color-primary); }
.rv-badge { padding: 1px 8px; font-weight: 600; color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 11%, transparent); border-radius: 999px; }
.rv-spin { animation: rv-spin 0.9s linear infinite; }
@keyframes rv-spin { to { transform: rotate(360deg); } }
.rv-zoom { display: inline-flex; align-items: center; gap: 4px; }
.rv-zoom__range { width: 96px; accent-color: var(--color-primary); cursor: pointer; }
.rv-zoom__value { min-width: 3.2rem; padding: 2px 6px; font-size: 0.75rem; font-variant-numeric: tabular-nums; color: var(--color-w-b-1); border-radius: 6px; cursor: pointer; &:hover { background: color-mix(in srgb, var(--color-w-b-1) 8%, transparent); } }
.rv-btn--sm { width: 22px; height: 22px; font-size: 0.8rem; }

// ---- design canvas (fabric) — teleported to <body>, so these are global ---------------------------------
.r-design {
  --d-accent: var(--color-primary, #8c52ff);
  --d-bg: var(--bg-content, #ffffff);
  --d-soft: var(--bg-hover, #f3f4f6);
  --d-border: var(--border-card, #e5e7eb);
  --d-text: var(--color-w-b-1, #1f2937);
  --d-muted: var(--c-muted, #6b7280);
  color: var(--d-text);
  font-family: var(--font-400, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif);
  font-size: 13px;
  outline: none;
}
.r-design *, .r-design *::before, .r-design *::after { box-sizing: border-box; }
.r-design.is-inplace { position: fixed; z-index: 1500; }
.r-design.is-full { position: fixed; inset: 0; z-index: 2000; display: flex; flex-direction: column; background: var(--d-bg); }

.r-design__dock {
  display: flex; flex-direction: column; gap: 4px; padding: 6px 8px; background: var(--d-bg);
  border: 1px solid var(--d-border); border-radius: 12px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
}
.is-inplace .r-design__dock { position: fixed; z-index: 1600; width: min(752px, calc(100vw - 16px)); }
.is-full .r-design__dock { border: 0; border-bottom: 1px solid var(--d-border); border-radius: 0; box-shadow: none; }
.r-design__bar, .r-design__tools, .r-design__props, .r-design__foot { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
.r-design__foot { padding: 6px 12px; border-top: 1px solid var(--d-border); }
.r-design__title { margin-right: 6px; }
.r-design__grow { flex: 1; }
.r-design__sep { width: 1px; height: 22px; background: var(--d-border); margin: 0 2px; }
.r-design__btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-width: 30px; height: 30px;
  padding: 0 7px; border: 1px solid transparent; border-radius: 8px; background: transparent; color: inherit;
  font: inherit; cursor: pointer; white-space: nowrap;
}
.r-design__btn i { width: 17px; height: 17px; }
.r-design__btn:hover:not(:disabled) { background: var(--d-soft); }
.r-design__btn:disabled { opacity: 0.35; cursor: not-allowed; }
.r-design__btn--text { padding: 0 12px; border-color: var(--d-border); }
.r-design__btn--primary { background: var(--d-accent); border-color: var(--d-accent); color: #fff; font-weight: 600; }
.r-design__btn--primary:hover:not(:disabled) { background: var(--d-accent); filter: brightness(1.08); }
.r-design__btn--danger:hover:not(:disabled) { color: #dc2626; }
.r-design__btn:focus-visible { outline: 2px solid var(--d-accent); outline-offset: 1px; }
.r-design__field {
  height: 30px; min-width: 0; padding: 0 6px; border: 1px solid var(--d-border); border-radius: 8px;
  background: var(--d-bg); color: inherit; font: inherit;
}
.r-design__field:focus { outline: 2px solid var(--d-accent); outline-offset: -1px; }
.r-design__num { width: 68px; }
.r-design__color { width: 30px; height: 28px; padding: 0; border: none; background: none; cursor: pointer; }
.r-design__check { display: inline-flex; align-items: center; gap: 6px; color: var(--d-muted); cursor: pointer; }
.r-design__props label { display: inline-flex; align-items: center; gap: 4px; color: var(--d-muted); }
.r-design__kind { min-width: 60px; text-transform: capitalize; font-weight: 600; }
.r-design__hint { margin: 0; color: var(--d-muted); font-size: 12px; }
.r-design__error { margin: 0; padding: 6px 10px; border-radius: 8px; background: #dc2626; color: #fff; }
.r-design input[type='range'] { accent-color: var(--d-accent); }

.is-inplace .r-design__body { position: absolute; inset: 0; }
.is-full .r-design__body { flex: 1; min-height: 0; display: flex; }
.r-design__stage { position: relative; flex: 1; min-width: 0; }
.is-inplace .r-design__stage { width: 100%; height: 100%; }
.is-inplace .r-design__page { box-shadow: 0 0 0 2px var(--d-accent); }
.is-full .r-design__stage { overflow: auto; display: flex; background: color-mix(in srgb, var(--d-text) 7%, var(--d-bg)); }
.is-full .r-design__page { margin: auto; padding: 40px; }
.r-design__page .canvas-container { box-shadow: 0 6px 28px rgba(0, 0, 0, 0.22); }
.r-design__loading {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  background: color-mix(in srgb, var(--d-bg) 70%, transparent); color: var(--d-muted);
}
.r-design__pct { width: 40px; text-align: right; color: var(--d-muted); font-variant-numeric: tabular-nums; }

@media (prefers-reduced-motion: reduce) { .rv-editor * { transition: none !important; } }
</style>
