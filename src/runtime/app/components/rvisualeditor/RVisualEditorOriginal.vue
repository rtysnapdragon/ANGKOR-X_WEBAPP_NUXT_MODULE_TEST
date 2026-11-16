<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
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
})

const emit = defineEmits([
  'update:modelValue', 'update', 'change', 'save', 'error', 'focus', 'blur',
  'upload', 'media-select', 'object-select', 'object-transform', 'ready',
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
  file: ['application/pdf'],
}
const EXT_MIME = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', svg: 'image/svg+xml', avif: 'image/avif',
  mp4: 'video/mp4', webm: 'video/webm', mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', pdf: 'application/pdf',
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
async function xhrUpload(file, cfg, { onProgress, signal }) {
  const headers = typeof cfg.headers === 'function' ? await cfg.headers() : (cfg.headers ?? {})
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(cfg.method ?? 'POST', cfg.url)
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
  'floatingMedia', 'shapes', 'drawing',
]
const optShape = {
  // Generic feature flags first, so the explicit config keys below can override the flag schema.
  ...Object.fromEntries(FEATURE_KEYS.map((k) => [k, flag])),
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
  theme: 'system', appearance: 'paper', toolbarMode: 'ribbon', editable: true, emitDebounce: 300, allowBlobUrls: false,
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
  const merged = { ...OPT_DEFAULTS }
  const input = { ...(isObj(raw) ? raw : {}) }
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
  alert: svg('<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>'),
  retry: svg('<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>'),
}
const h = (tag, cls, attrsObj = {}) => {
  const n = document.createElement(tag)
  if (cls) n.className = cls
  for (const [k, v] of Object.entries(attrsObj)) n.setAttribute(k, v)
  return n
}

function createMediaView({ node: initial, getPos, editor: ed }) {
  let node = initial
  const dom = h('div', 'rv-media')
  const figure = h('figure', 'rv-media__figure')
  const body = h('div', 'rv-media__body')
  const bar = h('div', 'rv-media__bar', { 'data-rv-interactive': '', role: 'toolbar', 'aria-label': t('rve_media_options', 'Media options') })
  const caption = h('input', 'rv-media__caption', { type: 'text', placeholder: t('rve_write_caption', 'Write a caption…'), 'aria-label': t('rve_caption', 'Caption'), 'data-rv-interactive': '' })
  const handleL = h('div', 'rv-media__resize rv-media__resize--l', { 'data-rv-interactive': '', 'aria-hidden': 'true' })
  const handleR = h('div', 'rv-media__resize rv-media__resize--r', { 'data-rv-interactive': '', 'aria-hidden': 'true' })
  figure.append(body, bar, handleL, handleR, caption)
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
    const src = safeUrl(a.src, opts.value.allowBlobUrls)
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
      sub.textContent = [a.mime === 'application/pdf' ? 'PDF' : '', fmtBytes(a.size)].filter(Boolean).join(' · ')
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
    if (a.kind !== 'audio') {
      for (const al of ALIGNS) {
        const b = button(ICONS[al], `${t('rve_align', 'Align')} ${t(`rve_align_${al}`, al)}`, () => patch({ align: al }))
        if (a.align === al) b.classList.add('is-active')
        bar.append(b)
      }
    }
    if (a.kind === 'image') bar.append(button('', t('rve_alt_text', 'Alternative text'), () => { const v = window.prompt(t('rve_alt_text_prompt', 'Alternative text (describe the image)'), a.alt || ''); if (v !== null) patch({ alt: v.slice(0, 300) }) }, t('rve_alt', 'Alt')))
    bar.append(button(ICONS.trash, t('rve_delete', 'Delete'), remove))
  }

  function render() {
    const a = node.attrs
    dom.dataset.kind = a.kind
    dom.dataset.align = ALIGNS.includes(a.align) ? a.align : 'center'
    dom.dataset.status = a.status
    figure.style.width = a.kind === 'image' || a.kind === 'video' ? `${clampWidth(a.width)}%` : ''
    renderBody()
    renderBar()
    if (document.activeElement !== caption) caption.value = a.caption || ''
    caption.disabled = !ed.isEditable
    handleL.hidden = handleR.hidden = !(a.status === 'ready' && (a.kind === 'image' || a.kind === 'video')) || !ed.isEditable
    register()
  }

  function startResize(side, e) {
    e.preventDefault()
    e.stopPropagation()
    const container = dom.getBoundingClientRect().width || 1
    const startW = figure.getBoundingClientRect().width
    const startX = e.clientX
    const factor = node.attrs.align === 'center' ? 2 : 1
    const dir = side === 'l' ? -1 : 1
    let pct = clampWidth(node.attrs.width)
    const move = (ev) => { pct = clampWidth(((startW + dir * (ev.clientX - startX) * factor) / container) * 100); figure.style.width = `${pct}%` }
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); patch({ width: pct }) }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }
  for (const [side, el] of [['l', handleL], ['r', handleR]]) {
    el.addEventListener('mousedown', (e) => e.preventDefault())
    el.addEventListener('pointerdown', (e) => startResize(side, e))
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
      width: { default: 100 }, align: { default: 'center' }, filename: { default: '' }, size: { default: 0 }, mime: { default: '' },
      status: { default: 'ready' }, uploadId: { default: null }, error: { default: '' },
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
          return {
            kind, src, alt: m?.getAttribute('alt') ?? '', caption: el.querySelector('figcaption')?.textContent ?? '',
            width: clampWidth(el.getAttribute('data-width')), align: ALIGNS.includes(al) ? al : 'center',
            filename: a?.getAttribute('download') ?? '', status: src ? 'ready' : 'error', error: src ? '' : t('rve_this_file_not_available', 'This file is not available.'),
          }
        },
      },
      { tag: 'img[src]', getAttrs: (el) => { const src = safeUrl(el.getAttribute('src'), opts.value.allowBlobUrls); return src ? { kind: 'image', src, alt: el.getAttribute('alt') ?? '' } : false } },
    ]
  },
  renderHTML({ node }) {
    const a = node.attrs
    const src = safeUrl(a.src, opts.value.allowBlobUrls)
    const wrap = { 'data-rv-media': KINDS.includes(a.kind) ? a.kind : 'image', 'data-align': ALIGNS.includes(a.align) ? a.align : 'center', 'data-width': clampWidth(a.width), style: `width: ${clampWidth(a.width)}%` }
    const out = ['figure', wrap]
    if (src) {
      if (a.kind === 'video') out.push(['video', { src, controls: '', preload: 'metadata' }])
      else if (a.kind === 'audio') out.push(['audio', { src, controls: '', preload: 'metadata' }])
      else if (a.kind === 'file') out.push(['a', { href: src, download: a.filename || '', target: '_blank', rel: 'noopener noreferrer' }, a.filename || t('rve_download', 'Download')])
      else out.push(['img', { src, alt: a.alt || '', loading: 'lazy' }])
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
  if (kindAllowed('file')) add('file', M, MK, 'File', 'rve_file', 'Attach a PDF document.', 'rve_file_hint', 'i-lucide-paperclip', ['pdf', 'attachment', 'document'], () => pickFiles('file'))
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
function insertMediaUrl(kind, url) {
  const src = safeUrl(asStr(url).trim(), opts.value.allowBlobUrls)
  if (!src || !kindAllowed(kind) || !live()) { emit('error', { source: 'media', code: 'invalid-url', error: new Error(t('rve_invalid_media_url', 'Invalid or disallowed media URL.')) }); return false }
  insertBlocks([{ type: 'media', attrs: { kind, src, status: 'ready', filename: src.split('/').pop() ?? '' } }])
  return true
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
            <button v-for="item in startItems" :key="item.id" type="button" class="rv-chip" @mousedown.prevent @click="runStart(item)"><UIcon :name="item.icon" />{{ t(item.titleKey, item.title) }}</button>
          </div>
          <p v-if="feat.dropFiles.register" class="rv-start__drop"><UIcon name="i-lucide-cloud-upload" /> {{ t('rve_drag_drop_hint', 'Drag & drop images, video, audio or PDFs anywhere on the page') }}</p>
        </div>
      </div>
    </div>

    <!-- ================= Block handle + menu (Notion style) ================= -->
    <div v-if="handleShown" class="rv-handle" :style="{ top: `${handle.top}px`, left: `${handle.left}px` }">
      <button type="button" class="rv-handle__btn" :aria-label="t('rve_add_block_below', 'Add a block below')" :title="t('rve_add_block_below_title', 'Click to add a block below')" @mousedown.prevent @click="insertBelow"><UIcon name="i-lucide-plus" /></button>
      <button type="button" class="rv-handle__btn rv-handle__grip" draggable="true" :aria-label="t('rve_drag_move_options', 'Drag to move, click for options')" :title="t('rve_drag_move_options_title', 'Drag to move · click for options')" @dragstart="onHandleDragStart" @dragend="onHandleDragEnd" @click="toggleBlockMenu"><UIcon name="i-lucide-grip-vertical" /></button>
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
        <UTooltip v-for="m in MARKS" :key="m.id" :text="tl(m.label)" :kbds="m.kbd">
          <button type="button" class="rv-btn" :class="{ 'is-active': act(m.id) }" :aria-label="tl(m.label)" :aria-pressed="act(m.id)" @mousedown.prevent @click="m.run()"><UIcon :name="m.icon" /></button>
        </UTooltip>
        <UTooltip v-if="vis('links') && usable('links')" :text="t('rve_link', 'Link')" :kbds="['meta', 'K']">
          <button type="button" class="rv-btn" :class="{ 'is-active': act('link') }" :aria-label="t('rve_link', 'Link')" @mousedown.prevent @click="openBubbleMode('link')"><UIcon name="i-lucide-link" /></button>
        </UTooltip>
        <UTooltip v-if="vis('colors') && usable('colors')" :text="t('rve_text_color', 'Text color')">
          <button type="button" class="rv-btn" :class="{ 'is-active': bubble.mode === 'color' }" :aria-label="t('rve_text_color', 'Text color')" aria-haspopup="true" @mousedown.prevent @click="openBubbleMode('color')"><UIcon name="i-lucide-baseline" /></button>
        </UTooltip>
        <UTooltip v-if="vis('colors') && usable('colors')" :text="t('rve_highlight', 'Highlight')">
          <button type="button" class="rv-btn" :class="{ 'is-active': bubble.mode === 'highlight' }" :aria-label="t('rve_highlight', 'Highlight')" aria-haspopup="true" @mousedown.prevent @click="openBubbleMode('highlight')"><UIcon name="i-lucide-highlighter" /></button>
        </UTooltip>
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
            <span class="rv-slash__icon"><UIcon :name="e.item.icon" /></span>
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
        <span>{{ t('rve_drop_hint', 'Images, video, audio and PDFs') }}</span>
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
            <strong class="r-design__title">{{ designPlaceholder ? 'New design' : 'Edit design' }}</strong>
            <button type="button" class="r-design__btn" title="Undo (Ctrl+Z)" :disabled="!designUi.canUndo" @click="undo"><i class="i-lucide-undo-2" /></button>
            <button type="button" class="r-design__btn" title="Redo (Ctrl+Shift+Z)" :disabled="!designUi.canRedo" @click="redo"><i class="i-lucide-redo-2" /></button>
            <select class="r-design__field" :value="designPage.preset" aria-label="Page size" @change="onPreset($event.target.value)">
              <option v-for="p in DESIGN_PRESETS" :key="p.id" :value="p.id">{{ p.label }}</option>
              <option value="custom" disabled>Custom</option>
            </select>
            <input class="r-design__field r-design__num" type="number" min="100" max="4000" :value="designPage.w" aria-label="Page width" @change="setPageSize($event.target.value, designPage.h)">
            <span>×</span>
            <input class="r-design__field r-design__num" type="number" min="100" max="4000" :value="designPage.h" aria-label="Page height" @change="setPageSize(designPage.w, $event.target.value)">
            <input class="r-design__color" type="color" :value="designPage.bg" title="Page background" aria-label="Page background" @input="setBackground($event.target.value)">
            <span class="r-design__grow" />
            <label class="r-design__check" title="Also insert the documents / videos you added as file blocks under the image">
              <input v-model="designUi.attach" type="checkbox"> Attach files
            </label>
            <button type="button" class="r-design__btn" :title="designUi.expanded ? 'Back to in-place' : 'Expand to full screen'" @click="designUi.expanded = !designUi.expanded">
              <i :class="designUi.expanded ? 'i-lucide-minimize-2' : 'i-lucide-maximize-2'" />
            </button>
            <button type="button" class="r-design__btn r-design__btn--text" @click="closeDesign({ cancelled: true })">Cancel</button>
            <button type="button" class="r-design__btn r-design__btn--text r-design__btn--primary" :disabled="!designUi.ready || designUi.busy" @click="insertDesign">
              {{ designUi.busy ? 'Working…' : 'Done' }}
            </button>
          </div>

          <!-- Tools: add / align / arrange -->
          <div class="r-design__tools">
            <input ref="designFileInput" type="file" multiple hidden @change="onDesignPick">
            <button type="button" class="r-design__btn r-design__btn--text" @click="designFileInput?.click()"><i class="i-lucide-paperclip" /> Add files</button>
            <button type="button" class="r-design__btn" title="Text" @click="addText"><i class="i-lucide-type" /></button>
            <button type="button" class="r-design__btn" title="Rectangle" @click="addRect"><i class="i-lucide-square" /></button>
            <button type="button" class="r-design__btn" title="Line" @click="addLine"><i class="i-lucide-minus" /></button>
            <span class="r-design__sep" />
            <select v-model="designUi.alignTo" class="r-design__field" aria-label="Align relative to" title="Align relative to">
              <option value="page">To page</option>
              <option value="objects">To each other</option>
            </select>
            <button v-for="[mode, icon, label] in ALIGN_BUTTONS" :key="mode" type="button" class="r-design__btn" :title="label" :disabled="!designSel.n" @click="align(mode)"><i :class="icon" /></button>
            <button type="button" class="r-design__btn" title="Distribute horizontally" :disabled="designSel.n < 3" @click="distribute('x')"><i class="i-lucide-align-horizontal-distribute-center" /></button>
            <button type="button" class="r-design__btn" title="Distribute vertically" :disabled="designSel.n < 3" @click="distribute('y')"><i class="i-lucide-align-vertical-distribute-center" /></button>
            <span class="r-design__sep" />
            <button v-for="[op, icon, label] in ORDER_BUTTONS" :key="op" type="button" class="r-design__btn" :title="label" :disabled="!designSel.n" @click="arrange(op)"><i :class="icon" /></button>
            <button type="button" class="r-design__btn" title="Flip horizontally" :disabled="!designSel.n" @click="flip"><i class="i-lucide-flip-horizontal-2" /></button>
            <button type="button" class="r-design__btn" title="Duplicate (Ctrl+D)" :disabled="!designSel.n" @click="duplicate"><i class="i-lucide-copy" /></button>
            <button type="button" class="r-design__btn r-design__btn--danger" title="Delete" :disabled="!designSel.n" @click="removeSelected"><i class="i-lucide-trash-2" /></button>
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
              <input type="range" min="5" max="100" :value="designSel.opacity" @input="setOpacity(Number($event.target.value))" @change="commit()">
            </label>
          </div>
          <p v-else class="r-design__hint">Drop or paste any file onto the canvas · drag corners to resize · Shift-click to select several, then align / distribute</p>
          <p v-if="designUi.msg" class="r-design__error" role="alert">{{ designUi.msg }}</p>
        </div>

        <div class="r-design__body">
          <div ref="designStage" class="r-design__stage" @dragover.prevent @drop.prevent="onDesignDrop">
            <div class="r-design__page"><canvas ref="designCanvasEl" /></div>
            <div v-if="!designUi.ready" class="r-design__loading" role="status">Loading canvas…</div>
          </div>
        </div>
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
  background: var(--c-bg);
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

// ---- popovers / menus --------------------------------------------------------------------------------
.rv-pop, .rv-menu, .rv-bubble__panel {
  background: var(--bg-content);
  border: 1px solid var(--border-card);
  border-radius: 8px;
  box-shadow: var(--glass-shadow);
}
.rv-pop { position: absolute; z-index: 40; top: calc(100% + 6px); left: 0; display: grid; gap: 8px; min-width: 14rem; padding: 12px; }
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
.rv-body { flex: 1 1 auto; }
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
  top: 50%;
  z-index: 3;
  width: 8px;
  height: 44px;
  margin-top: -22px;
  background: color-mix(in srgb, var(--color-w-b-1) 70%, transparent);
  border: 1px solid var(--bg-content);
  border-radius: 6px;
  cursor: ew-resize;
  opacity: 0;
  transition: opacity 120ms cubic-bezier(0.2, 0.7, 0.2, 1);
  &[hidden] { display: none; }
}
.rv-media__resize--l { left: 6px; }
.rv-media__resize--r { right: 6px; }
.rv-media__figure:hover .rv-media__resize, .rv-media.is-selected .rv-media__resize { opacity: 1; }
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

@media (prefers-reduced-motion: reduce) { .rv-editor * { transition: none !important; } }
</style>