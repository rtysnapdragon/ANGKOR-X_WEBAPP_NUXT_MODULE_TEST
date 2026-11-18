<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { createEngine } from '../Editor/Canvaas/RCanvasEngine'
import { FONTS, LINES, SHAPES, TEXT_ALIGNS, TEXT_PRESETS } from '../Editor/Canvaas/RCanvasData'
import '../Editor/Canvaas/RCanvas.css'

let i18n = null
try {
  i18n = useI18n()
}
catch {
  i18n = null
}
const t = (key, fallback) => {
  try {
    if (i18n && typeof i18n.te === 'function' && i18n.te(key)) return i18n.t(key)
    if (i18n && typeof i18n.t === 'function') {
      const v = i18n.t(key)
      if (v && v !== key) return v
    }
  }
  catch { /* not translated */ }
  return fallback
}
const tKey = label => `rve_${String(label).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')}`
const tl = label => t(tKey(label), label)

const props = defineProps({
  document: { type: [Object, String], default: null },
  title: { type: String, default: 'Design builder' },
  saveLabel: { type: String, default: 'Apply' },
  mediaItems: { type: Array, default: () => [] },
  mediaLoading: { type: Boolean, default: false },
  uploadHandler: { type: Function, default: null },
})

const emit = defineEmits(['change', 'ready', 'save', 'cancel'])

const FX = [
  { key: 'brightness', label: 'Brightness', min: -1, max: 1, step: 0.05 },
  { key: 'contrast', label: 'Contrast', min: -1, max: 1, step: 0.05 },
  { key: 'saturation', label: 'Saturation', min: -1, max: 1, step: 0.05 },
  { key: 'blur', label: 'Blur', min: 0, max: 1, step: 0.05 },
]

const ALIGN = [
  ['left', 'align-start-vertical'],
  ['center', 'align-center-vertical'],
  ['right', 'align-end-vertical'],
  ['top', 'align-start-horizontal'],
  ['middle', 'align-center-horizontal'],
  ['bottom', 'align-end-horizontal'],
]

const state = reactive({
  ready: false,
  busy: false,
  error: '',
  zoom: 1,
  autoFit: true,
  canUndo: false,
  canRedo: false,
  tool: 'select',
  width: 1080,
  height: 1080,
  pages: [],
  pageIndex: 0,
  layers: [],
  selectedIds: [],
  sel: null,
  bg: '#ffffff',
  snap: true,
  defaultFont: FONTS[0] ?? 'Inter',
  pen: { color: '#1f2937', width: 8 },
})

const engine = shallowRef(null)
const stageRef = ref(null)
const canvasEl = ref(null)
const addFileInput = ref(null)
const replaceFileInput = ref(null)
const saving = ref(false)
const uploading = ref(0)
const activeLeft = ref('layers')
const imageUrl = ref('')
const dragId = ref(null)
const renaming = ref(null)
const canvasW = ref(state.width)
const canvasH = ref(state.height)

let unmounted = false

const api = new Proxy({}, {
  get(_, key) {
    if (typeof key !== 'string' || key === 'then' || key.startsWith('__v')) return undefined
    const value = engine.value?.[key]
    if (typeof value !== 'function') return value
    return (...args) => value.apply(engine.value, args)
  },
})

const selLabel = computed(() => {
  const value = state.sel
  if (!value) return ''
  if (value.kind === 'multi') return `${value.count} ${t('rve_elements', 'elements')}`
  return tl(value.kind.charAt(0).toUpperCase() + value.kind.slice(1))
})

const applyLabel = computed(() => {
  if (saving.value) return t('rve_saving', 'Saving...')
  if (uploading.value > 0) return `${t('rve_uploading', 'Uploading')}...`
  return props.saveLabel
})

const isLine = computed(() => state.sel?.kind === 'line')
const showFill = computed(() => !!state.sel && !['image', 'line'].includes(state.sel.kind))
const showBorder = computed(() => !!state.sel)
const showRadius = computed(() => !!state.sel && (state.sel.isRect || state.sel.kind === 'image'))
const radiusMax = computed(() => {
  const value = state.sel
  if (!value) return 100
  if (value.hasImage && !value.isRect) return 100
  return Math.max(1, Math.round(Math.min(value.rect?.w ?? 100, value.rect?.h ?? 100) / 2))
})

watch(() => [state.width, state.height], ([width, height]) => {
  canvasW.value = width
  canvasH.value = height
})

function fail(error) {
  state.error = error?.message || String(error || t('rve_something_wrong', 'Something went wrong'))
}

function parseDocument(value) {
  if (typeof value !== 'string') return value
  const text = value.trim()
  if (!text) return null
  try {
    return JSON.parse(text)
  }
  catch {
    return null
  }
}

function onEngineChange() {
  const design = engine.value?.getDocument()
  if (design) emit('change', design)
}

function hexColor(value, fallback = '#8c52ff') {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback
}

function normalizeHex(value) {
  const next = String(value || '').trim()
  if (/^#?[0-9a-f]{6}$/i.test(next)) return next.startsWith('#') ? next : `#${next}`
  return ''
}

function applyHex(event, setter, current) {
  const next = normalizeHex(event.target.value)
  if (next) setter(next)
  else event.target.value = typeof current === 'string' ? current : ''
}

function onFillHex(event) {
  applyHex(event, api.setFill, state.sel?.fill)
}

function onStrokeHex(event) {
  applyHex(event, api.setStroke, state.sel?.stroke)
}

function onBgHex(event) {
  applyHex(event, api.setBackground, state.bg)
}

function applyCanvasSize() {
  const width = Math.round(Number(canvasW.value))
  const height = Math.round(Number(canvasH.value))
  if (!(width >= 50 && height >= 50)) return
  api.setSize(width, height)
}

function setSelectionSize(width, height, currentWidth, currentHeight) {
  const eng = engine.value
  const object = eng?.canvas?.getActiveObject()
  if (!object) return
  const fromWidth = currentWidth || object.getScaledWidth() || 1
  const fromHeight = currentHeight || object.getScaledHeight() || 1
  const nextWidth = Math.max(1, Number(width) || fromWidth)
  const nextHeight = Math.max(1, Number(height) || fromHeight)
  object.set({
    scaleX: (object.scaleX || 1) * (nextWidth / fromWidth),
    scaleY: (object.scaleY || 1) * (nextHeight / fromHeight),
  })
  object.setCoords()
  eng.normalizeScale?.(object, 'br')
  eng.commit(true)
  eng.refresh?.()
}

function applyPosition(axis, value) {
  const rect = state.sel?.rect
  const next = Number(value)
  if (!rect || !Number.isFinite(next)) return
  api.setPosition({
    x: axis === 'x' ? next : rect.x,
    y: axis === 'y' ? next : rect.y,
  })
}

function applySize(axis, value) {
  const rect = state.sel?.rect
  const next = Number(value)
  if (!rect || !Number.isFinite(next) || next <= 0) return
  setSelectionSize(
    axis === 'w' ? next : rect.w,
    axis === 'h' ? next : rect.h,
    rect.w,
    rect.h,
  )
}

function applyAngle(value) {
  const next = Number(value)
  if (!Number.isFinite(next)) return
  api.setAngle(next)
}

function layerIcon(kind) {
  return {
    text: 'i-lucide-type',
    image: 'i-lucide-image',
    line: 'i-lucide-minus',
    group: 'i-lucide-group',
    multi: 'i-lucide-layers',
  }[kind] || 'i-lucide-shapes'
}

function selectLayer(id, event) {
  api.selectById(id, event.shiftKey || event.ctrlKey || event.metaKey)
}

function onLayerDragStart(id, event) {
  dragId.value = id
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', id)
  }
}

function onLayerDrop(targetId) {
  if (dragId.value && dragId.value !== targetId) api.moveLayerTo(dragId.value, targetId)
  dragId.value = null
}

function startRename(id, event) {
  const row = event.currentTarget?.closest('.rc-layer')
  renaming.value = id
  nextTick(() => {
    const input = row?.querySelector('.rc-layer__rename')
    input?.focus()
    input?.select()
  })
}

function finishRename(id, event) {
  if (renaming.value !== id) return
  const name = event.target.value.trim()
  if (name) api.renameLayer(id, name)
  renaming.value = null
}

function isTyping(target) {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

function onKeydown(event) {
  if (!state.ready || saving.value || isTyping(event.target)) return
  const eng = engine.value
  if (!eng) return
  if (event.code === 'Space') {
    if (event.target instanceof HTMLElement && event.target.closest('button, a')) return
    if (!event.repeat) eng.setSpace(true)
    event.preventDefault()
    return
  }
  eng.handleKey(event)
}

function onKeyup(event) {
  if (event.code === 'Space') engine.value?.setSpace(false)
}

function onBlur() {
  engine.value?.setSpace(false)
}

function onPaste(event) {
  if (!state.ready || saving.value || isTyping(event.target)) return
  event.preventDefault()
  const files = Array.from(event.clipboardData?.files ?? []).filter(file => file.type.startsWith('image/'))
  if (files.length) {
    addImageFiles(files)
    return
  }
  engine.value?.paste()
}

function onDrop(event) {
  if (!state.ready || saving.value) return
  const files = Array.from(event.dataTransfer?.files ?? []).filter(file => file.type.startsWith('image/'))
  if (files.length) {
    event.preventDefault()
    addImageFiles(files)
  }
}

function fileToUrl(file) {
  if (props.uploadHandler) {
    return Promise.resolve(props.uploadHandler(file)).then(result => (
      typeof result === 'string' ? result : result?.url || result?.data?.url
    ))
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

async function addImageFiles(files) {
  const eng = engine.value
  if (!state.ready || saving.value || !eng || !files?.length) return
  state.error = ''
  uploading.value += 1
  try {
    for (const file of files) {
      if (unmounted || saving.value) return
      try {
        const url = await fileToUrl(file)
        if (unmounted || saving.value) return
        if (url) await eng.addImage(url)
      }
      catch (error) {
        if (!unmounted) fail(error)
      }
    }
  }
  finally {
    uploading.value -= 1
  }
}

async function addMediaImage(item) {
  const url = item?.url || item?.src
  if (!state.ready || saving.value || !url) return
  state.error = ''
  uploading.value += 1
  try {
    await engine.value?.addImage(url)
  }
  catch (error) {
    if (!unmounted) fail(error)
  }
  finally {
    uploading.value -= 1
  }
}

function onAddFiles(event) {
  const files = Array.from(event.target.files ?? [])
  event.target.value = ''
  if (saving.value) return
  addImageFiles(files)
}

async function onReplaceFile(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!state.ready || saving.value || !file) return
  state.error = ''
  uploading.value += 1
  try {
    const url = await fileToUrl(file)
    if (unmounted || saving.value) return
    if (url) await engine.value?.replaceImage(url)
  }
  catch (error) {
    if (!unmounted) fail(error)
  }
  finally {
    uploading.value -= 1
  }
}

async function addUrl() {
  const url = imageUrl.value.trim()
  if (!state.ready || saving.value || !url) return
  state.error = ''
  uploading.value += 1
  try {
    if (unmounted || saving.value) return
    await engine.value?.addImage(url)
    if (!unmounted) imageUrl.value = ''
  }
  catch (error) {
    if (!unmounted) fail(error)
  }
  finally {
    uploading.value -= 1
  }
}

function baseName() {
  const value = (props.title || t('rve_design', 'Design')).trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/\.(?:png|jpe?g|webp|gif|avif)$/i, '')
    .replace(/^-+|-+$/g, '')
  return value || 'design'
}

async function save() {
  const eng = engine.value
  if (!eng || saving.value || state.busy || uploading.value > 0) return
  state.error = ''
  saving.value = true
  try {
    const blob = await eng.exportBlob({ format: 'png', scale: 1 })
    if (unmounted) return
    if (!blob) throw new Error(t('rve_could_not_export_the_design', 'Could not export the design.'))
    const design = eng.getDocument()
    if (unmounted) return
    if (!design) throw new Error(t('rve_could_not_read_the_design', 'Could not read the design.'))
    const file = new File([blob], `${baseName()}.png`, {
      type: blob.type || 'image/png',
      lastModified: Date.now(),
    })
    emit('save', { blob, file, design, width: state.width, height: state.height })
  }
  catch (error) {
    if (!unmounted) fail(error)
  }
  finally {
    saving.value = false
  }
}

onMounted(async () => {
  const documentValue = parseDocument(props.document)
  const width = Math.max(50, Math.round(Number(documentValue?.width) || 1080))
  const height = Math.max(50, Math.round(Number(documentValue?.height) || 1080))
  state.width = width
  state.height = height
  canvasW.value = width
  canvasH.value = height
  window.addEventListener('blur', onBlur)
  window.addEventListener('keyup', onKeyup)
  try {
    const eng = await createEngine({
      el: canvasEl.value,
      stage: stageRef.value,
      state,
      width,
      height,
      onChange: onEngineChange,
    })
    if (unmounted) {
      eng.dispose()
      return
    }
    engine.value = eng
    await eng.loadDocument(documentValue)
    if (unmounted) {
      if (engine.value === eng) {
        eng.dispose()
        engine.value = null
      }
      return
    }
    state.ready = true
    emit('ready', api)
    await nextTick()
    stageRef.value?.focus()
  }
  catch (error) {
    if (!unmounted) fail(error)
  }
})

onBeforeUnmount(() => {
  unmounted = true
  window.removeEventListener('blur', onBlur)
  window.removeEventListener('keyup', onKeyup)
  engine.value?.dispose()
  engine.value = null
})

defineExpose({
  getDocument: () => engine.value?.getDocument() ?? null,
  getEngine: () => engine.value,
  state,
  api,
})
</script>

<template>
  <div
    class="rc rv-raw"
    :class="{ 'is-busy': state.busy }"
    @keydown="onKeydown"
    @paste="onPaste"
    @dragover.prevent
    @drop.prevent
  >
    <header class="rc-top rv-raw__top">
      <div class="rc-top__group">
        <button
          type="button"
          class="rc-btn rc-btn--sm"
          :title="t('rve_undo_shortcut', 'Undo (Ctrl+Z)')"
          :disabled="!state.canUndo || saving"
          @click="api.undo()"
        >
          <UIcon
            name="i-lucide-undo-2"
            class="rc-ico"
          />
        </button>
        <button
          type="button"
          class="rc-btn rc-btn--sm"
          :title="t('rve_redo_shortcut', 'Redo (Ctrl+Shift+Z)')"
          :disabled="!state.canRedo || saving"
          @click="api.redo()"
        >
          <UIcon
            name="i-lucide-redo-2"
            class="rc-ico"
          />
        </button>
        <span class="rc-sep" />
        <span class="rc-top__title">{{ title || t('rve_untitled_design', 'Untitled design') }}</span>
        <span class="rc-top__dim">{{ state.width }} x {{ state.height }}</span>
      </div>

      <div class="rc-top__group">
        <button
          type="button"
          class="rc-btn rc-btn--sm"
          :title="t('rve_zoom_out', 'Zoom out')"
          :disabled="!state.ready || saving"
          @click="api.zoomBy(1 / 1.2)"
        >
          <UIcon
            name="i-lucide-zoom-out"
            class="rc-ico"
          />
        </button>
        <span class="rv-raw__zoom">{{ Math.round(state.zoom * 100) }}%</span>
        <button
          type="button"
          class="rc-btn rc-btn--sm"
          :title="t('rve_zoom_in', 'Zoom in')"
          :disabled="!state.ready || saving"
          @click="api.zoomBy(1.2)"
        >
          <UIcon
            name="i-lucide-zoom-in"
            class="rc-ico"
          />
        </button>
        <button
          type="button"
          class="rc-btn rc-btn--sm"
          :title="t('rve_fit', 'Fit')"
          :disabled="!state.ready || saving"
          @click="api.fit()"
        >
          <UIcon
            name="i-lucide-maximize"
            class="rc-ico"
          />
        </button>
        <span class="rc-sep" />
        <button
          type="button"
          class="rc-btn"
          :disabled="saving"
          @click="emit('cancel')"
        >
          {{ t('rve_cancel', 'Cancel') }}
        </button>
        <button
          type="button"
          class="rc-btn rc-btn--primary"
          :disabled="!state.ready || state.busy || saving || uploading > 0"
          @click="save"
        >
          {{ applyLabel }}
        </button>
      </div>
    </header>

    <div class="rv-raw__body">
      <aside
        class="rv-raw__left"
        :class="{ 'is-disabled': !state.ready || saving }"
        :inert="!state.ready || saving"
      >
        <div class="rv-raw__tabs">
          <button
            type="button"
            class="rv-raw__tab"
            :class="{ 'is-on': activeLeft === 'layers' }"
            @click="activeLeft = 'layers'"
          >
            {{ t('rve_layers', 'Layers') }}
          </button>
          <button
            type="button"
            class="rv-raw__tab"
            :class="{ 'is-on': activeLeft === 'insert' }"
            @click="activeLeft = 'insert'"
          >
            {{ t('rve_insert', 'Insert') }}
          </button>
        </div>

        <div
          v-if="activeLeft === 'layers'"
          class="rv-raw__panel"
        >
          <div class="rv-raw__title">
            {{ t('rve_layers', 'Layers') }} ({{ state.layers.length }})
          </div>
          <p
            v-if="!state.layers.length"
            class="rc-hint"
          >
            {{ t('rve_nothing_on_this_canvas_yet', 'Nothing on this canvas yet.') }}
          </p>
          <ul
            v-else
            class="rc-layers"
          >
            <li
              v-for="layer in state.layers"
              :key="layer.id"
              class="rc-layer"
              :class="{ 'is-on': state.selectedIds.includes(layer.id), 'is-hidden': !layer.visible }"
              draggable="true"
              @dragstart="onLayerDragStart(layer.id, $event)"
              @dragend="dragId = null"
              @dragover.prevent
              @drop.prevent="onLayerDrop(layer.id)"
              @click="selectLayer(layer.id, $event)"
            >
              <UIcon
                :name="layerIcon(layer.kind)"
                class="rc-ico"
              />
              <input
                v-if="renaming === layer.id"
                class="rc-input rc-layer__rename"
                draggable="false"
                :value="layer.name"
                @click.stop
                @keydown.enter.prevent="finishRename(layer.id, $event)"
                @keydown.esc.prevent="renaming = null"
                @blur="finishRename(layer.id, $event)"
              >
              <span
                v-else
                class="rc-layer__name"
                :title="layer.name"
                @dblclick.stop="startRename(layer.id, $event)"
              >{{ layer.name }}</span>
              <span class="rv-raw__layer-tools">
                <button
                  type="button"
                  class="rc-btn rc-btn--sm"
                  :title="layer.visible ? t('rve_hide', 'Hide') : t('rve_show', 'Show')"
                  @click.stop="api.toggleVisible(layer.id)"
                >
                  <UIcon
                    :name="layer.visible ? 'i-lucide-eye' : 'i-lucide-eye-off'"
                    class="rc-ico"
                  />
                </button>
                <button
                  type="button"
                  class="rc-btn rc-btn--sm"
                  :title="layer.locked ? t('rve_unlock', 'Unlock') : t('rve_lock', 'Lock')"
                  @click.stop="api.toggleLock(layer.id)"
                >
                  <UIcon
                    :name="layer.locked ? 'i-lucide-lock' : 'i-lucide-lock-open'"
                    class="rc-ico"
                  />
                </button>
              </span>
            </li>
          </ul>
        </div>

        <div
          v-else
          class="rv-raw__panel"
        >
          <div class="rv-raw__title">
            {{ t('rve_text', 'Text') }}
          </div>
          <button
            v-for="preset in TEXT_PRESETS"
            :key="preset.id"
            type="button"
            class="rc-text-preset"
            @click="api.addText(preset.id)"
          >
            {{ tl(preset.label) }}
          </button>

          <div class="rv-raw__title">
            {{ t('rve_shapes', 'Shapes') }}
          </div>
          <div class="rc-shapes">
            <button
              v-for="shape in SHAPES"
              :key="shape.id"
              type="button"
              class="rc-shapes__item"
              :title="tl(shape.label)"
              @click="api.addShape(shape.id)"
            >
              <svg
                viewBox="0 0 100 100"
                aria-hidden="true"
              >
                <path
                  :d="shape.d"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>

          <div class="rv-raw__title">
            {{ t('rve_lines', 'Lines') }}
          </div>
          <div class="rv-raw__actions">
            <button
              v-for="line in LINES"
              :key="line.id"
              type="button"
              class="rc-btn rc-btn--solid"
              @click="api.addLine(line.id)"
            >
              {{ tl(line.label) }}
            </button>
          </div>

          <div class="rv-raw__title">
            {{ t('rve_images', 'Images') }}
          </div>
          <button
            type="button"
            class="rc-drop rv-raw__drop"
            @click="addFileInput?.click()"
          >
            <UIcon
              name="i-lucide-upload"
              class="rc-ico rc-ico--lg"
            />
            <span>{{ t('rve_upload_image', 'Upload image') }}</span>
            <small>{{ t('rve_or_drop_a_file_on_the_canvas', 'or drop a file on the canvas') }}</small>
          </button>
          <div class="rc-row rc-row--gap">
            <input
              v-model="imageUrl"
              class="rc-input"
              type="url"
              placeholder="https://..."
              @keydown.enter.prevent="addUrl"
            >
            <button
              type="button"
              class="rc-btn rc-btn--solid"
              :disabled="!imageUrl.trim()"
              @click="addUrl"
            >
              {{ t('rve_add', 'Add') }}
            </button>
          </div>
          <p
            v-if="mediaLoading"
            class="rc-hint"
          >
            {{ t('rve_loading_media', 'Loading media...') }}
          </p>
          <div
            v-else-if="mediaItems.length"
            class="rc-media"
          >
            <button
              v-for="item in mediaItems"
              :key="item.id || item.url || item.src"
              type="button"
              class="rc-media__item"
              :title="item.name || t('rve_add_image', 'Add image')"
              @click="addMediaImage(item)"
            >
              <img
                :src="item.url || item.src"
                :alt="item.name || ''"
              >
            </button>
          </div>
        </div>
      </aside>

      <div
        ref="stageRef"
        class="rc-stage rv-raw__stage"
        :class="{ 'is-disabled': saving }"
        tabindex="0"
        @dragover.prevent
        @drop.prevent="onDrop"
      >
        <div class="rc-stage__page">
          <canvas ref="canvasEl" />
        </div>
        <div
          v-if="!state.ready && !state.error"
          class="rc-overlay"
          role="status"
        >
          <span class="rc-spinner" />
          <span>{{ t('rve_loading_design', 'Loading design...') }}</span>
        </div>
        <div
          v-if="state.error"
          class="rc-error"
          role="alert"
        >
          <UIcon
            name="i-lucide-alert-triangle"
            class="rc-ico"
          />
          <span>{{ state.error }}</span>
          <button
            type="button"
            :aria-label="t('rve_dismiss', 'Dismiss')"
            @click="state.error = ''"
          >
            x
          </button>
        </div>
      </div>

      <aside
        class="rv-raw__right"
        :class="{ 'is-disabled': !state.ready || saving }"
        :inert="!state.ready || saving"
      >
        <div v-if="state.sel">
          <div class="rv-raw__inspector-head">
            <span class="rv-raw__title">{{ selLabel }}</span>
            <button
              type="button"
              class="rc-btn rc-btn--sm"
              :class="{ 'is-on': state.sel.locked }"
              :title="state.sel.locked ? t('rve_unlock', 'Unlock') : t('rve_lock', 'Lock')"
              @click="api.setLocked(!state.sel.locked)"
            >
              <UIcon
                :name="state.sel.locked ? 'i-lucide-lock' : 'i-lucide-lock-open'"
                class="rc-ico"
              />
            </button>
          </div>

          <section class="rv-raw__section">
            <div class="rv-raw__title">
              {{ t('rve_transform', 'Transform') }}
            </div>
            <div class="rv-raw__grid">
              <label class="rv-raw__field">X
                <input
                  class="rc-input"
                  type="number"
                  :value="state.sel.rect?.x ?? 0"
                  @change="applyPosition('x', $event.target.value)"
                >
              </label>
              <label class="rv-raw__field">Y
                <input
                  class="rc-input"
                  type="number"
                  :value="state.sel.rect?.y ?? 0"
                  @change="applyPosition('y', $event.target.value)"
                >
              </label>
              <label class="rv-raw__field">W
                <input
                  class="rc-input"
                  type="number"
                  min="1"
                  :value="state.sel.rect?.w ?? 0"
                  @change="applySize('w', $event.target.value)"
                >
              </label>
              <label class="rv-raw__field">H
                <input
                  class="rc-input"
                  type="number"
                  min="1"
                  :value="state.sel.rect?.h ?? 0"
                  @change="applySize('h', $event.target.value)"
                >
              </label>
              <label class="rv-raw__field">{{ t('rve_rotate', 'Rotate') }}
                <input
                  class="rc-input"
                  type="number"
                  :value="state.sel.angle ?? 0"
                  @change="applyAngle($event.target.value)"
                >
              </label>
              <label class="rv-raw__field">{{ t('rve_opacity', 'Opacity') }}
                <input
                  type="range"
                  min="0"
                  max="100"
                  :value="Math.round((state.sel.opacity ?? 1) * 100)"
                  @input="api.setOpacity(Number($event.target.value) / 100)"
                >
              </label>
            </div>
          </section>

          <section class="rv-raw__section">
            <div class="rv-raw__title">
              {{ t('rve_appearance', 'Appearance') }}
            </div>
            <label
              v-if="showFill"
              class="rv-raw__field"
            >{{ t('rve_fill', 'Fill') }}
              <div class="rv-raw__color">
                <input
                  type="color"
                  :value="hexColor(state.sel.fill)"
                  @input="api.setFill($event.target.value)"
                >
                <input
                  class="rc-input"
                  type="text"
                  :value="typeof state.sel.fill === 'string' ? state.sel.fill : ''"
                  spellcheck="false"
                  @change="onFillHex"
                >
              </div>
            </label>
            <label
              v-if="showBorder"
              class="rv-raw__field"
            >{{ isLine ? t('rve_line_color', 'Line color') : t('rve_border', 'Border') }}
              <div class="rv-raw__color">
                <input
                  type="color"
                  :value="hexColor(state.sel.stroke)"
                  @input="api.setStroke($event.target.value)"
                >
                <input
                  class="rc-input"
                  type="text"
                  :value="typeof state.sel.stroke === 'string' ? state.sel.stroke : ''"
                  spellcheck="false"
                  @change="onStrokeHex"
                >
              </div>
            </label>
            <label
              v-if="showBorder"
              class="rv-raw__field"
            >{{ isLine ? t('rve_line_weight', 'Line weight') : t('rve_border_width', 'Border width') }}
              <input
                type="range"
                :min="isLine ? 1 : 0"
                max="40"
                step="1"
                :value="state.sel.strokeWidth ?? 0"
                @input="api.setStrokeWidth(Number($event.target.value))"
              >
            </label>
            <label
              v-if="showRadius"
              class="rv-raw__field"
            >{{ t('rve_corner_radius', 'Corner radius') }}
              <input
                type="range"
                min="0"
                :max="radiusMax"
                step="1"
                :value="state.sel.radius ?? 0"
                @input="api.setRadius(Number($event.target.value))"
              >
            </label>
            <div class="rv-raw__actions">
              <button
                type="button"
                class="rc-btn rc-btn--solid"
                :class="{ 'is-on': state.sel.shadow }"
                :title="t('rve_toggle_shadow', 'Toggle shadow')"
                @click="api.setShadow(!state.sel.shadow)"
              >
                <UIcon
                  name="i-lucide-sun-dim"
                  class="rc-ico"
                />
              </button>
              <button
                type="button"
                class="rc-btn rc-btn--solid"
                :title="t('rve_flip_horizontal', 'Flip horizontal')"
                @click="api.flip('x')"
              >
                <UIcon
                  name="i-lucide-flip-horizontal"
                  class="rc-ico"
                />
              </button>
              <button
                type="button"
                class="rc-btn rc-btn--solid"
                :title="t('rve_flip_vertical', 'Flip vertical')"
                @click="api.flip('y')"
              >
                <UIcon
                  name="i-lucide-flip-vertical"
                  class="rc-ico"
                />
              </button>
            </div>
          </section>

          <section
            v-if="state.sel.hasText"
            class="rv-raw__section"
          >
            <div class="rv-raw__title">
              {{ t('rve_text', 'Text') }}
            </div>
            <label class="rv-raw__field">{{ t('rve_font', 'Font') }}
              <select
                class="rc-select"
                :value="state.sel.fontFamily"
                @change="api.setFont($event.target.value)"
              >
                <option
                  v-for="font in FONTS"
                  :key="font"
                  :value="font"
                >{{ font }}</option>
              </select>
            </label>
            <div class="rv-raw__grid">
              <label class="rv-raw__field">{{ t('rve_size', 'Size') }}
                <input
                  class="rc-input"
                  type="number"
                  min="6"
                  max="800"
                  :value="state.sel.fontSize ?? 32"
                  @change="api.setFontSize(Number($event.target.value))"
                >
              </label>
              <label class="rv-raw__field">{{ t('rve_line_height', 'Line height') }}
                <input
                  type="range"
                  min="0.8"
                  max="2.5"
                  step="0.05"
                  :value="state.sel.lineHeight ?? 1.16"
                  @input="api.setLineHeight(Number($event.target.value))"
                >
              </label>
            </div>
            <div class="rv-raw__actions">
              <button
                type="button"
                class="rc-btn rc-btn--solid"
                :class="{ 'is-on': state.sel.bold }"
                :title="t('rve_bold', 'Bold')"
                @click="api.toggleBold()"
              >
                <UIcon
                  name="i-lucide-bold"
                  class="rc-ico"
                />
              </button>
              <button
                type="button"
                class="rc-btn rc-btn--solid"
                :class="{ 'is-on': state.sel.italic }"
                :title="t('rve_italic', 'Italic')"
                @click="api.toggleItalic()"
              >
                <UIcon
                  name="i-lucide-italic"
                  class="rc-ico"
                />
              </button>
              <button
                type="button"
                class="rc-btn rc-btn--solid"
                :class="{ 'is-on': state.sel.underline }"
                :title="t('rve_underline', 'Underline')"
                @click="api.toggleUnderline()"
              >
                <UIcon
                  name="i-lucide-underline"
                  class="rc-ico"
                />
              </button>
              <button
                type="button"
                class="rc-btn rc-btn--solid"
                :class="{ 'is-on': state.sel.linethrough }"
                :title="t('rve_strikethrough', 'Strikethrough')"
                @click="api.toggleStrike()"
              >
                <UIcon
                  name="i-lucide-strikethrough"
                  class="rc-ico"
                />
              </button>
            </div>
            <div class="rv-raw__actions">
              <button
                v-for="align in TEXT_ALIGNS"
                :key="align"
                type="button"
                class="rc-btn rc-btn--solid"
                :class="{ 'is-on': state.sel.textAlign === align }"
                :title="`${t('rve_align', 'Align')} ${t('rve_align_' + align, align)}`"
                @click="api.setAlign(align)"
              >
                <UIcon
                  :name="`i-lucide-align-${align}`"
                  class="rc-ico"
                />
              </button>
            </div>
            <label class="rv-raw__field">{{ t('rve_letter_spacing', 'Letter spacing') }}
              <input
                type="range"
                min="-100"
                max="600"
                step="10"
                :value="state.sel.charSpacing ?? 0"
                @input="api.setCharSpacing(Number($event.target.value))"
              >
            </label>
          </section>

          <section
            v-if="state.sel.kind === 'image'"
            class="rv-raw__section"
          >
            <div class="rv-raw__title">
              {{ t('rve_image', 'Image') }}
            </div>
            <button
              type="button"
              class="rc-btn rc-btn--solid rv-raw__wide"
              @click="replaceFileInput?.click()"
            >
              <UIcon
                name="i-lucide-refresh-cw"
                class="rc-ico"
              />
              {{ t('rve_replace_image', 'Replace image') }}
            </button>
            <label
              v-for="fx in FX"
              :key="fx.key"
              class="rv-raw__field"
            >{{ tl(fx.label) }}
              <input
                type="range"
                :min="fx.min"
                :max="fx.max"
                :step="fx.step"
                :value="state.sel.fx?.[fx.key] ?? 0"
                @input="api.setImageFx(fx.key, Number($event.target.value))"
              >
            </label>
          </section>

          <section class="rv-raw__section">
            <div class="rv-raw__title">
              {{ t('rve_arrange', 'Arrange') }}
            </div>
            <div class="rv-raw__actions">
              <button
                type="button"
                class="rc-btn rc-btn--solid"
                :title="t('rve_bring_to_front', 'Bring to front')"
                @click="api.order('front')"
              >
                <UIcon
                  name="i-lucide-chevrons-up"
                  class="rc-ico"
                />
              </button>
              <button
                type="button"
                class="rc-btn rc-btn--solid"
                :title="t('rve_bring_forward', 'Bring forward')"
                @click="api.order('forward')"
              >
                <UIcon
                  name="i-lucide-arrow-up"
                  class="rc-ico"
                />
              </button>
              <button
                type="button"
                class="rc-btn rc-btn--solid"
                :title="t('rve_send_backward', 'Send backward')"
                @click="api.order('backward')"
              >
                <UIcon
                  name="i-lucide-arrow-down"
                  class="rc-ico"
                />
              </button>
              <button
                type="button"
                class="rc-btn rc-btn--solid"
                :title="t('rve_send_to_back', 'Send to back')"
                @click="api.order('back')"
              >
                <UIcon
                  name="i-lucide-chevrons-down"
                  class="rc-ico"
                />
              </button>
            </div>
            <div class="rv-raw__actions">
              <button
                v-for="item in ALIGN"
                :key="item[0]"
                type="button"
                class="rc-btn rc-btn--solid"
                :title="`${t('rve_align', 'Align')} ${t('rve_align_' + item[0], item[0])}`"
                @click="api.align(item[0])"
              >
                <UIcon
                  :name="`i-lucide-${item[1]}`"
                  class="rc-ico"
                />
              </button>
            </div>
            <div class="rv-raw__actions">
              <button
                v-if="state.sel.kind === 'multi'"
                type="button"
                class="rc-btn rc-btn--solid"
                @click="api.group()"
              >
                <UIcon
                  name="i-lucide-group"
                  class="rc-ico"
                />
                {{ t('rve_group', 'Group') }}
              </button>
              <button
                v-if="state.sel.kind === 'group'"
                type="button"
                class="rc-btn rc-btn--solid"
                @click="api.ungroup()"
              >
                <UIcon
                  name="i-lucide-ungroup"
                  class="rc-ico"
                />
                {{ t('rve_ungroup', 'Ungroup') }}
              </button>
              <button
                type="button"
                class="rc-btn rc-btn--solid"
                :title="t('rve_duplicate', 'Duplicate')"
                @click="api.duplicate()"
              >
                <UIcon
                  name="i-lucide-copy"
                  class="rc-ico"
                />
              </button>
              <button
                type="button"
                class="rc-btn rc-btn--solid rc-btn--danger"
                :title="t('rve_delete', 'Delete')"
                @click="api.remove()"
              >
                <UIcon
                  name="i-lucide-trash-2"
                  class="rc-ico"
                />
              </button>
            </div>
          </section>
        </div>

        <div v-else>
          <div class="rv-raw__title">
            {{ t('rve_canvas', 'Canvas') }}
          </div>
          <section class="rv-raw__section">
            <div class="rv-raw__grid">
              <label class="rv-raw__field">{{ t('rve_width', 'Width') }}
                <input
                  v-model.number="canvasW"
                  class="rc-input"
                  type="number"
                  min="50"
                  max="8000"
                >
              </label>
              <label class="rv-raw__field">{{ t('rve_height', 'Height') }}
                <input
                  v-model.number="canvasH"
                  class="rc-input"
                  type="number"
                  min="50"
                  max="8000"
                >
              </label>
            </div>
            <button
              type="button"
              class="rc-btn rc-btn--solid rv-raw__wide"
              @click="applyCanvasSize"
            >
              {{ t('rve_resize_canvas', 'Resize canvas') }}
            </button>
          </section>
          <section class="rv-raw__section">
            <div class="rv-raw__title">
              {{ t('rve_background', 'Background') }}
            </div>
            <div class="rv-raw__color">
              <input
                type="color"
                :value="hexColor(state.bg, '#ffffff')"
                @input="api.setBackground($event.target.value)"
              >
              <input
                class="rc-input"
                type="text"
                :value="typeof state.bg === 'string' ? state.bg : ''"
                spellcheck="false"
                @change="onBgHex"
              >
            </div>
          </section>
          <section class="rv-raw__section">
            <label class="rc-check">
              <input
                v-model="state.snap"
                type="checkbox"
              >
              {{ t('rve_smart_guides_and_snapping', 'Smart guides and snapping') }}
            </label>
            <p class="rc-hint">
              {{ t('rve_canvas_hint', 'Select an element to edit its properties. Drag layers to reorder them.') }}
            </p>
          </section>
        </div>
      </aside>
    </div>

    <input
      ref="addFileInput"
      type="file"
      accept="image/*"
      multiple
      hidden
      @change="onAddFiles"
    >
    <input
      ref="replaceFileInput"
      type="file"
      accept="image/*"
      hidden
      @change="onReplaceFile"
    >
  </div>
</template>

<style lang="scss" scoped>
.rv-raw {
  &__body {
    display: flex;
    flex: 1;
    min-height: 0;
  }

  &__left {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    width: 252px;
    min-height: 0;
    background: var(--rc-bg);
    border-right: 1px solid var(--rc-border);
  }

  &__tabs {
    display: flex;
    flex-shrink: 0;
    gap: 4px;
    padding: 8px;
    border-bottom: 1px solid var(--rc-border);
  }

  &__tab {
    flex: 1;
    height: 30px;
    font: inherit;
    font-size: 12px;
    font-weight: 600;
    color: var(--rc-muted);
    background: transparent;
    border: 1px solid transparent;
    border-radius: 8px;
    cursor: pointer;

    &:hover {
      color: var(--rc-text);
      background: var(--rc-bg-soft);
    }

    &.is-on {
      color: var(--rc-accent);
      background: color-mix(in srgb, var(--rc-accent) 14%, transparent);
    }
  }

  &__panel {
    flex: 1;
    min-height: 0;
    padding: 12px;
    overflow-y: auto;
  }

  &__right {
    flex-shrink: 0;
    width: 272px;
    min-height: 0;
    padding: 12px;
    overflow-y: auto;
    background: var(--rc-bg);
    border-left: 1px solid var(--rc-border);
  }

  &__stage {
    flex: 1;
    min-width: 0;

    &.is-disabled {
      pointer-events: none;
    }
  }

  &__left.is-disabled,
  &__right.is-disabled {
    pointer-events: none;
    opacity: 0.6;
  }

  &__title {
    margin: 0 0 8px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: var(--rc-muted);
    text-transform: uppercase;
  }

  &__inspector-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding-bottom: 2px;

    .rv-raw__title {
      margin: 0;
    }
  }

  &__section {
    padding: 12px 0;
    border-bottom: 1px solid var(--rc-border);

    &:last-child {
      border-bottom: 0;
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    font-size: 11px;
    color: var(--rc-muted);

    & + & {
      margin-top: 10px;
    }

    input[type='range'] {
      width: 100%;
      accent-color: var(--rc-accent);
    }

    > .rc-input,
    > .rc-select {
      flex: none;
      width: 100%;
      max-width: none;
    }
  }

  &__grid &__field + &__field {
    margin-top: 0;
  }

  &__color {
    display: flex;
    align-items: center;
    gap: 6px;

    input[type='color'] {
      flex-shrink: 0;
      width: 34px;
      height: 32px;
      padding: 0;
      background: var(--rc-bg);
      border: 1px solid var(--rc-border);
      border-radius: 8px;
      cursor: pointer;
    }
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 8px;

    .rc-btn {
      border-color: var(--rc-border);
    }
  }

  &__wide {
    width: 100%;
    margin-top: 10px;
  }

  &__zoom {
    min-width: 42px;
    font-variant-numeric: tabular-nums;
    color: var(--rc-muted);
    text-align: right;
  }

  &__layer-tools {
    display: flex;
    flex-shrink: 0;
    gap: 2px;

    .rc-btn {
      min-width: 24px;
      height: 24px;
      padding: 0 3px;
    }

    .rc-ico {
      width: 14px;
      height: 14px;
    }
  }

  &__drop {
    width: 100%;
    margin-bottom: 8px;
    font: inherit;
    color: var(--rc-muted);
    background: transparent;
    cursor: pointer;

    small {
      font-size: 11px;
    }
  }

  @media (max-width: 1100px) {
    &__left {
      width: 216px;
    }

    &__right {
      width: 244px;
    }
  }

  @media (max-width: 820px) {
    &__left {
      display: none;
    }

    &__right {
      width: 224px;
    }
  }

  @media (max-width: 640px) {
    &__right {
      display: none;
    }

    .rc-top__dim {
      display: none;
    }
  }
}
</style>
