<script setup>
// RCanvas — Canva-style design editor on top of fabric.
//
//   <RCanvas v-model="doc" :upload-handler="upload" @save="onSave" @cancel="close" />
//
// v-model   : document { version, width, height, current, pages: [{ id, name, json }] }
//             (a JSON string or a bare fabric JSON is also accepted)
// Events    : update:modelValue, change, ready, save({ blob, file, design, width, height }),
//             cancel, error, upload-error, request-media({ search })
// Exposed   : api, state, getEngine(), getDocument(), loadDocument(), exportBlob(), addImage(),
//             save(), undo(), redo(), fit()
//
// SSR-safe: fabric is loaded in onMounted() (dynamic import) — no <ClientOnly> needed.

import { onBeforeUnmount, onMounted, reactive, ref, shallowRef, toRaw, watch } from 'vue'
import { createEngine } from './RCanvasEngine'
import { FONTS } from './RCanvasData'
import RCanvasToolbar from './RCanvasToolbar.vue'
import RCanvasSidebar from './RCanvasSidebar.vue'
import RCanvasPages from './RCanvasPages.vue'
import RCanvasPop from './RCanvasPop.vue'
import './RCanvas.css'

const props = defineProps({
  modelValue: { type: [Object, String], default: null },
  width: { type: Number, default: 1080 },
  height: { type: Number, default: 1080 },
  initialImage: { type: String, default: '' },        // start from an image (size = image size)
  title: { type: String, default: '' },
  mediaItems: { type: Array, default: () => [] },     // [{ id, url, thumbnailUrl?, name? }]
  mediaLoading: { type: Boolean, default: false },
  uploadHandler: { type: Function, default: null },   // (file) => Promise<string | { url }>; default = data URL
  fonts: { type: Array, default: () => FONTS },
  showSave: { type: Boolean, default: true },
  saveLabel: { type: String, default: 'Done' },
  cancelable: { type: Boolean, default: true },
  exportFormat: { type: String, default: 'png' },     // format used by `save`
  exportScale: { type: Number, default: 1 },
})

const emit = defineEmits([
  'update:modelValue', 'change', 'ready', 'save', 'cancel', 'error', 'upload-error', 'request-media',
])

const canvasRef = ref(null)
const stageRef = ref(null)
const replaceInput = ref(null)
const engine = shallowRef(null)
const saving = ref(false)
const scale = ref(props.exportScale)
let unmounted = false
let lastEmitted = null

const state = reactive({
  ready: false,
  busy: false,
  error: '',
  zoom: 1,
  autoFit: true,
  canUndo: false,
  canRedo: false,
  tool: 'select',
  width: props.width,
  height: props.height,
  pages: [],
  pageIndex: 0,
  layers: [],
  selectedIds: [],
  sel: null,
  bg: '#ffffff',
  snap: true,
  defaultFont: props.fonts[0] ?? 'Inter',
  pen: { color: '#1f2937', width: 8 },
})

// Stable facade: safe to call before the engine is ready (becomes a no-op).
const api = new Proxy({}, {
  get(_, key) {
    if (typeof key !== 'string' || key.startsWith('__v')) return undefined
    return (...args) => engine.value?.[key]?.(...args)
  },
})

function fail(e) {
  state.error = e?.message || String(e)
  emit('error', e)
}

function emitChange() {
  const doc = engine.value?.getDocument()
  if (!doc) return
  lastEmitted = doc
  emit('update:modelValue', doc)
  emit('change', doc)
}

onMounted(async () => {
  try {
    const eng = await createEngine({
      el: canvasRef.value,
      stage: stageRef.value,
      state,
      width: props.width,
      height: props.height,
      onChange: emitChange,
    })
    if (unmounted) { eng.dispose(); return }
    engine.value = eng
    if (props.modelValue) await eng.loadDocument(props.modelValue)
    else if (props.initialImage) await eng.loadImageDocument(props.initialImage)
    state.ready = true
    stageRef.value?.focus({ preventScroll: true })
    emit('ready', api)
  }
  catch (e) { fail(e) }
})

onBeforeUnmount(() => {
  unmounted = true
  engine.value?.dispose()
  engine.value = null
})

// External v-model changes (ignore the echo of our own emit).
watch(() => props.modelValue, (v) => {
  if (!engine.value || !v || toRaw(v) === lastEmitted) return
  engine.value.loadDocument(v).catch(fail)
})

// ── Images: upload handler or data URL ──────────────────────────────────────
const readAsDataURL = file => new Promise((resolve, reject) => {
  const r = new FileReader()
  r.onload = () => resolve(r.result)
  r.onerror = () => reject(r.error)
  r.readAsDataURL(file)
})
async function fileToUrl(file) {
  if (props.uploadHandler) {
    const res = await props.uploadHandler(file)
    return typeof res === 'string' ? res : res?.url
  }
  return readAsDataURL(file)
}
async function addImageFiles(files) {
  for (const f of files) {
    try {
      const url = await fileToUrl(f)
      if (url) await engine.value?.addImage(url)
    }
    catch (e) { emit('upload-error', e); fail(e) }
  }
}
async function addImageUrl(url) {
  try { await engine.value?.addImage(url) }
  catch (e) { fail(new Error(`Could not load image: ${url}`)) }
}
async function onReplaceFile(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  try {
    const url = await fileToUrl(file)
    if (url) await engine.value?.replaceImage(url)
  }
  catch (err) { emit('upload-error', err); fail(err) }
}
function onStageDrop(e) {
  const files = Array.from(e.dataTransfer?.files ?? []).filter(f => f.type.startsWith('image/'))
  if (files.length) addImageFiles(files)
}

// ── Keyboard / clipboard ────────────────────────────────────────────────────
const TYPING = new Set(['text', 'number', 'search', 'url', 'email', 'password', 'tel'])
function isTyping(e) {
  const t = e.target
  if (!(t instanceof HTMLElement)) return false
  if (t.isContentEditable || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT') return true
  return t.tagName === 'INPUT' && TYPING.has(t.type)
}
function onKeydown(e) {
  if (isTyping(e) || !engine.value) return
  if (e.code === 'Space') {
    if (e.target instanceof HTMLElement && e.target.closest('button, a')) return
    if (!e.repeat) engine.value.setSpace(true)
    e.preventDefault()
    return
  }
  engine.value.handleKey(e)
}
const onKeyup = (e) => { if (e.code === 'Space') engine.value?.setSpace(false) }
async function onPaste(e) {
  if (isTyping(e) || !engine.value) return
  const files = Array.from(e.clipboardData?.files ?? []).filter(f => f.type.startsWith('image/'))
  e.preventDefault()
  if (files.length) await addImageFiles(files)
  else await engine.value.paste()
}
const onBlur = () => engine.value?.setSpace(false)
onMounted(() => window.addEventListener('blur', onBlur))
onBeforeUnmount(() => window.removeEventListener('blur', onBlur))

// ── Export / save ───────────────────────────────────────────────────────────
const baseName = () => (props.title || 'design').trim().replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '') || 'design'
function download(blob, name) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}
async function doExport(kind) {
  const eng = engine.value
  if (!eng) return
  state.busy = true
  try {
    const base = baseName()
    if (kind === 'svg') download(new Blob([eng.exportSVG()], { type: 'image/svg+xml' }), `${base}.svg`)
    else if (kind === 'json') download(new Blob([eng.exportJSON()], { type: 'application/json' }), `${base}.json`)
    else if (kind === 'all') {
      const pages = await eng.exportPages({ format: 'png', scale: scale.value })
      pages.forEach((p, i) => download(p.blob, `${base}-${i + 1}.png`))
    }
    else download(await eng.exportBlob({ format: kind, scale: scale.value }), `${base}.${kind === 'jpeg' ? 'jpg' : kind}`)
  }
  catch (e) { fail(e) }
  finally { state.busy = false }
}

async function save() {
  const eng = engine.value
  if (!eng || saving.value) return
  saving.value = true
  try {
    const blob = await eng.exportBlob({ format: props.exportFormat, scale: props.exportScale })
    const design = eng.getDocument()
    const ext = props.exportFormat === 'jpeg' ? 'jpg' : props.exportFormat
    const file = new File([blob], `${baseName()}.${ext}`, { type: blob.type, lastModified: Date.now() })
    emit('save', { blob, file, design, width: state.width, height: state.height })
  }
  catch (e) { fail(e) }
  finally { saving.value = false }
}

const EXPORTS = [
  ['png', 'PNG', 'image'], ['jpeg', 'JPG', 'image'], ['webp', 'WebP', 'image'],
  ['svg', 'SVG (vector)', 'file-code'], ['json', 'Design file (JSON)', 'braces'],
]

defineExpose({
  api,
  state,
  getEngine: () => engine.value,
  getDocument: () => engine.value?.getDocument(),
  loadDocument: doc => engine.value?.loadDocument(doc),
  exportBlob: options => engine.value?.exportBlob(options),
  addImage: url => engine.value?.addImage(url),
  save,
  undo: () => engine.value?.undo(),
  redo: () => engine.value?.redo(),
  fit: () => engine.value?.fit(),
})
</script>

<template>
  <div
    class="rc" :class="{ 'is-busy': state.busy }" tabindex="-1"
    @keydown="onKeydown" @keyup="onKeyup" @paste="onPaste"
  >
    <!-- ── App bar ──────────────────────────────────────────────────────── -->
    <header class="rc-top">
      <div class="rc-top__group">
        <button type="button" class="rc-btn" title="Undo (Ctrl+Z)" :disabled="!state.canUndo" @click="api.undo()"><UIcon name="i-lucide-undo-2" class="rc-ico" /></button>
        <button type="button" class="rc-btn" title="Redo (Ctrl+Shift+Z)" :disabled="!state.canRedo" @click="api.redo()"><UIcon name="i-lucide-redo-2" class="rc-ico" /></button>
        <span class="rc-top__title">{{ title || 'Untitled design' }}</span>
        <span class="rc-top__dim">{{ state.width }} × {{ state.height }}</span>
      </div>
      <div class="rc-top__group">
        <RCanvasPop title="Export" align="right">
          <template #trigger><UIcon name="i-lucide-download" class="rc-ico" /><span class="rc-btn__text">Export</span></template>
          <template #default="{ close }">
            <div class="rc-list">
              <label class="rc-field rc-field--inline">Scale
                <select v-model.number="scale" class="rc-select">
                  <option :value="1">1×</option><option :value="2">2×</option><option :value="3">3×</option>
                </select>
              </label>
              <button v-for="[k, label, icon] in EXPORTS" :key="k" type="button" class="rc-list__item" @click="doExport(k); close()">
                <UIcon :name="`i-lucide-${icon}`" class="rc-ico" /> {{ label }}
              </button>
              <button v-if="state.pages.length > 1" type="button" class="rc-list__item" @click="doExport('all'); close()">
                <UIcon name="i-lucide-images" class="rc-ico" /> All pages (PNG)
              </button>
            </div>
          </template>
        </RCanvasPop>
        <button v-if="cancelable" type="button" class="rc-btn" @click="emit('cancel')">Cancel</button>
        <button v-if="showSave" type="button" class="rc-btn rc-btn--primary" :disabled="!state.ready || saving" @click="save">
          {{ saving ? 'Saving…' : saveLabel }}
        </button>
      </div>
    </header>

    <RCanvasToolbar :state="state" :api="api" :fonts="fonts" @replace-image="replaceInput?.click()" />

    <div class="rc-body">
      <RCanvasSidebar
        :state="state" :api="api" :fonts="fonts" :media-items="mediaItems" :media-loading="mediaLoading"
        @upload-files="addImageFiles" @add-url="addImageUrl" @insert-media="m => addImageUrl(m.url)"
        @request-media="e => emit('request-media', e)"
      />

      <main class="rc-main">
        <div ref="stageRef" class="rc-stage" tabindex="0" @dragover.prevent @drop.prevent="onStageDrop">
          <div class="rc-stage__page"><canvas ref="canvasRef" /></div>

          <div v-if="!state.ready && !state.error" class="rc-overlay" role="status">
            <span class="rc-spinner" /> Loading editor…
          </div>
          <div v-if="state.error" class="rc-error" role="alert">
            <span>{{ state.error }}</span>
            <button type="button" aria-label="Dismiss" @click="state.error = ''">×</button>
          </div>
        </div>

        <footer class="rc-bottom">
          <RCanvasPages :state="state" :api="api" />
          <div class="rc-zoom">
            <button type="button" class="rc-btn rc-btn--sm" title="Zoom out" @click="api.zoomBy(1 / 1.2)"><UIcon name="i-lucide-zoom-out" class="rc-ico" /></button>
            <input
              type="range" min="5" max="400" :value="Math.round(state.zoom * 100)" aria-label="Zoom"
              @input="api.zoomTo(Number($event.target.value) / 100)"
            >
            <button type="button" class="rc-btn rc-btn--sm" title="Zoom in" @click="api.zoomBy(1.2)"><UIcon name="i-lucide-zoom-in" class="rc-ico" /></button>
            <span class="rc-zoom__pct">{{ Math.round(state.zoom * 100) }}%</span>
            <button type="button" class="rc-btn rc-btn--sm" :class="{ 'is-on': state.autoFit }" title="Fit (Ctrl+0)" @click="api.fit()"><UIcon name="i-lucide-maximize" class="rc-ico" /></button>
          </div>
        </footer>
      </main>
    </div>

    <input ref="replaceInput" type="file" accept="image/*" hidden @change="onReplaceFile">
  </div>
</template>
