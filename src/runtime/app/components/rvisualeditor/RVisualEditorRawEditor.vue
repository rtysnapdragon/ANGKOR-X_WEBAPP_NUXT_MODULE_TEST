<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRVisualEditorEngine } from '../../composables/useRVisualEditorEngine'
import { FONTS, LINES, PAGE_PRESET_GROUPS, SHAPES, TEXT_ALIGNS, TEXT_PRESETS } from '../Editor/Canvaas/RCanvasData'
import RIcon from '../RIcon.vue'
import RTooltip from '../RTooltip.vue'
import RBtnExCol from '../btn/RBtnExCol.vue'
import RCanvasPresetPicker from './RCanvasPresetPicker.vue'

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
  initialImage: { type: String, default: '' },
  title: { type: String, default: 'Design builder' },
  saveLabel: { type: String, default: 'Apply' },
  mediaItems: { type: Array, default: () => [] },
  mediaLoading: { type: Boolean, default: false },
  uploadHandler: { type: Function, default: null },
  toolsVisible: { type: Boolean, default: true },
  toolsPosition: {
    type: String,
    default: 'bottom',
    validator: value => ['top', 'bottom', 'left', 'right'].includes(value),
  },
  toolsOrientation: {
    type: String,
    default: 'auto',
    validator: value => ['auto', 'horizontal', 'vertical'].includes(value),
  },
  toolsOffset: { type: [Number, String], default: 16 },
})

const emit = defineEmits(['change', 'ready', 'save', 'cancel'])

const FX = [
  { key: 'brightness', label: 'Brightness', min: -1, max: 1, step: 0.05 },
  { key: 'contrast', label: 'Contrast', min: -1, max: 1, step: 0.05 },
  { key: 'saturation', label: 'Saturation', min: -1, max: 1, step: 0.05 },
  { key: 'blur', label: 'Blur', min: 0, max: 1, step: 0.05 },
]

const CROP_RATIOS = [
  { id: 'free', label: 'Free', key: 'rve_free', ratio: null },
  { id: '1:1', label: '1:1', ratio: 1 },
  { id: '4:3', label: '4:3', ratio: 4 / 3 },
  { id: '3:2', label: '3:2', ratio: 3 / 2 },
  { id: '16:9', label: '16:9', ratio: 16 / 9 },
  { id: '9:16', label: '9:16', ratio: 9 / 16 },
  { id: '3:4', label: '3:4', ratio: 3 / 4 },
  { id: '2:3', label: '2:3', ratio: 2 / 3 },
  { id: '4:5', label: '4:5', ratio: 4 / 5 },
]

const IMAGE_PRESETS = [
  {
    id: 'original',
    label: 'Original',
    key: 'rve_preset_original',
    swatch: 'linear-gradient(135deg, #e5e7eb, #9ca3af)',
    fx: { brightness: 0, contrast: 0, saturation: 0, blur: 0 },
  },
  {
    id: 'vivid',
    label: 'Vivid',
    key: 'rve_preset_vivid',
    swatch: 'linear-gradient(135deg, #f59e0b, #ef4444, #8b5cf6)',
    fx: { brightness: 0.02, contrast: 0.12, saturation: 0.25, blur: 0 },
  },
  {
    id: 'warm',
    label: 'Warm',
    key: 'rve_preset_warm',
    swatch: 'linear-gradient(135deg, #fbbf24, #f97316)',
    fx: { brightness: 0.04, contrast: 0.05, saturation: 0.12, blur: 0 },
  },
  {
    id: 'cool',
    label: 'Cool',
    key: 'rve_preset_cool',
    swatch: 'linear-gradient(135deg, #38bdf8, #6366f1)',
    fx: { brightness: 0.02, contrast: 0.05, saturation: -0.1, blur: 0 },
  },
  {
    id: 'mono',
    label: 'Mono',
    key: 'rve_preset_mono',
    swatch: 'linear-gradient(135deg, #111827, #e5e7eb)',
    fx: { brightness: 0, contrast: 0.12, saturation: -1, blur: 0 },
  },
  {
    id: 'fade',
    label: 'Fade',
    key: 'rve_preset_fade',
    swatch: 'linear-gradient(135deg, #fde68a, #c4b5fd, #bfdbfe)',
    fx: { brightness: 0.08, contrast: -0.12, saturation: -0.15, blur: 0 },
  },
]

const ALIGN = [
  ['left', 'align-start-vertical'],
  ['center', 'align-center-vertical'],
  ['right', 'align-end-vertical'],
  ['top', 'align-start-horizontal'],
  ['middle', 'align-center-horizontal'],
  ['bottom', 'align-end-horizontal'],
]

const TOOLS = [
  { id: 'move', key: 'v', icon: 'i-lucide-mouse-pointer-2', label: 'Move' },
  { id: 'hand', key: 'h', icon: 'i-lucide-hand', label: 'Hand' },
  { id: 'frame', key: 'f', icon: 'i-lucide-frame', label: 'Frame' },
  { id: 'text', key: 't', icon: 'i-lucide-type', label: 'Text' },
  { id: 'rect', key: 'r', icon: 'i-lucide-square', label: 'Rectangle' },
  { id: 'ellipse', key: 'o', icon: 'i-lucide-circle', label: 'Ellipse' },
  { id: 'line', key: 'l', icon: 'i-lucide-minus', label: 'Line' },
  { id: 'pen', key: 'p', icon: 'i-lucide-pen-tool', label: 'Pen' },
  { id: 'image', key: 'i', icon: 'i-lucide-image-plus', label: 'Image' },
]

const TOOL_KEYS = { v: 'move', h: 'hand', f: 'frame', t: 'text', r: 'rect', o: 'ellipse', l: 'line', p: 'pen', i: 'image' }

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
  frames: [],
  selectedIds: [],
  sel: null,
  bg: '#ffffff',
  snap: true,
  defaultFont: FONTS[0] ?? 'Inter',
  pen: { color: '#1f2937', width: 8 },
})

const { engine, createEngine, pointFromClient, dispose: disposeEngine } = useRVisualEditorEngine()
const stageRef = ref(null)
const canvasEl = ref(null)
const addFileInput = ref(null)
const replaceFileInput = ref(null)
const saving = ref(false)
const uploading = ref(0)
const activeLeft = ref('layers')
const activeTool = ref('move')
const leftCollapsed = ref(false)
const rightCollapsed = ref(false)
const toolDrag = reactive({ active: false, left: 0, top: 0, width: 0, height: 0, startX: 0, startY: 0 })
const pendingImagePoint = ref(null)
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

const presetGroups = computed(() => PAGE_PRESET_GROUPS.map(group => ({
  ...group,
  label: t(group.key, group.label),
  presets: group.presets.map(preset => ({
    ...preset,
    label: t(tKey(preset.label), preset.label),
    sizeLabel: `${preset.w} × ${preset.h} px`,
  })),
})))
const presetFlat = computed(() => presetGroups.value.flatMap(group => group.presets))
const presetId = ref('')
watch(() => [state.width, state.height], ([width, height]) => {
  const current = presetFlat.value.find(preset => preset.id === presetId.value)
  if (current?.w === width && current?.h === height) return
  presetId.value = presetFlat.value.find(preset => preset.w === width && preset.h === height)?.id ?? ''
}, { immediate: true })

function applyCanvasPreset(preset) {
  if (!preset) return
  presetId.value = preset.id
  const width = Math.round(Number(preset.w))
  const height = Math.round(Number(preset.h))
  if (!(width >= 50 && height >= 50)) return
  canvasW.value = width
  canvasH.value = height
  api.setSize(width, height)
}

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

const isCreateTool = computed(() => ['text', 'frame', 'rect', 'ellipse', 'line', 'image'].includes(activeTool.value))
const marqueeStyle = computed(() => ({
  left: `${toolDrag.left}px`,
  top: `${toolDrag.top}px`,
  width: `${toolDrag.width}px`,
  height: `${toolDrag.height}px`,
}))
const stageClass = computed(() => ({
  'is-tool-hand': activeTool.value === 'hand',
  'is-tool-draw': activeTool.value === 'pen',
  'is-tool-create': isCreateTool.value,
  'is-disabled': saving.value,
}))
const toolHint = computed(() => {
  if (activeTool.value === 'text') return t('rve_click_to_add_text', 'Click to add text')
  if (activeTool.value === 'image') return t('rve_click_to_place_image', 'Click to place an image')
  return t('rve_drag_to_draw', 'Drag to draw')
})
const leftToggleLabel = computed(() => leftCollapsed.value
  ? t('rve_expand_left_sidebar', 'Expand left sidebar')
  : t('rve_collapse_left_sidebar', 'Collapse left sidebar'))
const rightToggleLabel = computed(() => rightCollapsed.value
  ? t('rve_expand_right_sidebar', 'Expand right sidebar')
  : t('rve_collapse_right_sidebar', 'Collapse right sidebar'))
const resolvedToolsOrientation = computed(() => {
  if (props.toolsOrientation !== 'auto') return props.toolsOrientation
  return ['top', 'bottom'].includes(props.toolsPosition) ? 'horizontal' : 'vertical'
})
const toolsClass = computed(() => [
  `rv-raw__tools--${props.toolsPosition}`,
  `rv-raw__tools--${resolvedToolsOrientation.value}`,
])
const toolsStyle = computed(() => {
  const raw = props.toolsOffset
  const offset = typeof raw === 'number' ? `${raw}px` : String(raw || '').trim() || '16px'
  return { '--rv-tools-offset': offset }
})
const toolsTooltipSide = computed(() => ({
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
}[props.toolsPosition] || 'top'))

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

function rotateBy(degrees) {
  applyAngle((Number(state.sel?.angle) || 0) + degrees)
}

function applyCrop(ratio) {
  api.cropImage(ratio)
}

function cropRatioActive(item) {
  if (!state.sel?.hasImage) return false
  if (item.ratio == null) return !state.sel.imageCropped
  return !!state.sel.imageCropped && Math.abs((Number(state.sel.cropRatio) || 0) - item.ratio) < 0.02
}

function applyImagePreset(preset) {
  api.setImageFx(preset.fx)
}

function presetActive(preset) {
  const fx = state.sel?.fx || {}
  return ['brightness', 'contrast', 'saturation', 'blur'].every(
    key => Math.abs((Number(fx[key]) || 0) - (Number(preset.fx[key]) || 0)) < 0.001,
  )
}

function layerIcon(kind) {
  return {
    text: 'i-lucide-type',
    image: 'i-lucide-image',
    line: 'i-lucide-minus',
    group: 'i-lucide-group',
    multi: 'i-lucide-layers',
    frame: 'i-lucide-frame',
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

function setTool(tool) {
  if (!state.ready || saving.value) return
  activeTool.value = tool
  if (tool !== 'image') pendingImagePoint.value = null
  if (tool === 'pen') {
    api.setSpace(false)
    api.setTool('draw')
    return
  }
  if (tool === 'hand') {
    api.setTool('select')
    api.setSpace(true)
    return
  }
  api.setSpace(false)
  api.setTool('select')
}

function canvasPoint(clientX, clientY) {
  return pointFromClient(clientX, clientY, state.width, state.height)
}

function onToolDown(event) {
  if (!state.ready || saving.value) return
  const stage = stageRef.value
  if (!stage) return
  const rect = stage.getBoundingClientRect()
  if (activeTool.value === 'image') {
    openImagePicker(canvasPoint(event.clientX, event.clientY))
    return
  }
  if (activeTool.value === 'text') {
    const p = canvasPoint(event.clientX, event.clientY)
    api.addTextAt('body', { left: p.x, top: p.y })
    setTool('move')
    return
  }
  toolDrag.active = true
  toolDrag.left = event.clientX - rect.left
  toolDrag.top = event.clientY - rect.top
  toolDrag.width = 0
  toolDrag.height = 0
  toolDrag.startX = event.clientX
  toolDrag.startY = event.clientY
}

function onToolMove(event) {
  if (!toolDrag.active) return
  const stage = stageRef.value
  if (!stage) return
  const rect = stage.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  toolDrag.left = Math.min(x, toolDrag.startX - rect.left)
  toolDrag.top = Math.min(y, toolDrag.startY - rect.top)
  toolDrag.width = Math.abs(x - (toolDrag.startX - rect.left))
  toolDrag.height = Math.abs(y - (toolDrag.startY - rect.top))
}

function onToolUp(event) {
  if (!toolDrag.active) return
  const start = canvasPoint(toolDrag.startX, toolDrag.startY)
  const end = canvasPoint(event.clientX, event.clientY)
  toolDrag.active = false
  const dx = end.x - start.x
  const dy = end.y - start.y
  if (activeTool.value === 'line') {
    if (Math.abs(dx) + Math.abs(dy) >= 4) {
      api.addLineAt({ left: start.x, top: start.y, width: dx, height: dy })
    }
  }
  else if (activeTool.value === 'frame' || activeTool.value === 'rect' || activeTool.value === 'ellipse') {
    const isFrame = activeTool.value === 'frame'
    const width = Math.max(4, Math.abs(dx))
    const height = Math.max(4, Math.abs(dy))
    const left = Math.min(start.x, end.x)
    const top = Math.min(start.y, end.y)
    if (isFrame) {
      api.addFrame({
        left,
        top,
        width: width < 5 ? 320 : width,
        height: height < 5 ? 240 : height,
        fill: '#ffffff',
      })
    }
    else {
      api.addShapeAt(activeTool.value === 'rect' ? 'square' : 'circle', {
        left,
        top,
        width: width < 5 ? 160 : width,
        height: height < 5 ? 160 : height,
        fill: '#8c52ff',
      })
    }
  }
  setTool('move')
}

function onToolCancel() {
  toolDrag.active = false
}

function onKeydown(event) {
  if (!state.ready || saving.value || isTyping(event.target)) return
  const eng = engine.value
  if (!eng) return
  if (!event.ctrlKey && !event.metaKey && !event.altKey) {
    const next = TOOL_KEYS[event.key.toLowerCase()]
    if (next) {
      event.preventDefault()
      setTool(next)
      return
    }
    if (event.key === 'Escape') {
      setTool('move')
      return
    }
  }
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

async function addImageFiles(files, at = null) {
  const eng = engine.value
  if (!state.ready || saving.value || !eng || !files?.length) return
  state.error = ''
  uploading.value += 1
  try {
    for (const [index, file] of files.entries()) {
      if (unmounted || saving.value) return
      try {
        const url = await fileToUrl(file)
        if (unmounted || saving.value) return
        if (!url) continue
        if (at && typeof eng.addImageAt === 'function') {
          await eng.addImageAt(url, { left: at.x + index * 24, top: at.y + index * 24 })
        }
        else {
          await eng.addImage(url)
        }
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

function openImagePicker(at = null) {
  pendingImagePoint.value = at
  addFileInput.value?.click()
}

function onAddFiles(event) {
  const files = Array.from(event.target.files ?? [])
  event.target.value = ''
  if (saving.value) return
  const at = pendingImagePoint.value
  pendingImagePoint.value = null
  if (at) setTool('move')
  addImageFiles(files, at)
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
      wheelZoom: true,
    })
    if (unmounted) {
      eng.dispose()
      return
    }
    engine.value = eng
    if (documentValue) await eng.loadDocument(documentValue)
    else if (props.initialImage) await eng.loadImageDocument(props.initialImage)
    else await eng.loadDocument(null)
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
  disposeEngine()
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
        <RTooltip
          :text="t('rve_undo_shortcut', 'Undo (Ctrl+Z)')"
          side="bottom"
        >
          <button
            type="button"
            class="rc-btn rc-btn--sm"
            :disabled="!state.canUndo || saving"
            @click="api.undo()"
          >
            <RIcon
              name="i-lucide-undo-2"
              class="rc-ico"
            />
          </button>
        </RTooltip>
        <RTooltip
          :text="t('rve_redo_shortcut', 'Redo (Ctrl+Shift+Z)')"
          side="bottom"
        >
          <button
            type="button"
            class="rc-btn rc-btn--sm"
            :disabled="!state.canRedo || saving"
            @click="api.redo()"
          >
            <RIcon
              name="i-lucide-redo-2"
              class="rc-ico"
            />
          </button>
        </RTooltip>
        <span class="rc-sep" />
        <span class="rc-top__title">{{ title || t('rve_untitled_design', 'Untitled design') }}</span>
        <span class="rc-top__dim">{{ state.width }} x {{ state.height }}</span>
      </div>

      <div class="rc-top__group">
        <span class="rv-raw__top-hint">{{ t('rve_free_style_hint', 'Free-style canvas - drag, draw and arrange anything') }}</span>
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
        id="rv-raw-left"
        class="rv-raw__left"
        :class="{ 'is-disabled': !state.ready || saving, 'is-collapsed': leftCollapsed }"
        :inert="leftCollapsed || !state.ready || saving"
      >
        <div class="rv-raw__side-head rv-raw__side-head--left">
          <RBtnExCol
            :collapsed="leftCollapsed"
            :label="leftToggleLabel"
            controls="rv-raw-left"
            @click="leftCollapsed = !leftCollapsed"
          />
        </div>
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
              <RIcon
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
              <RTooltip
                v-else
                :text="layer.name"
                side="top"
                class="rv-raw__tip rv-raw__tip--grow"
              >
                <span
                  class="rc-layer__name"
                  @dblclick.stop="startRename(layer.id, $event)"
                >{{ layer.name }}</span>
              </RTooltip>
              <span class="rv-raw__layer-tools">
                <RTooltip
                  :text="layer.visible ? t('rve_hide', 'Hide') : t('rve_show', 'Show')"
                  side="top"
                  class="rv-raw__tip"
                >
                  <button
                    type="button"
                    class="rc-btn rc-btn--sm"
                    @click.stop="api.toggleVisible(layer.id)"
                  >
                    <RIcon
                      :name="layer.visible ? 'i-lucide-eye' : 'i-lucide-eye-off'"
                      class="rc-ico"
                    />
                  </button>
                </RTooltip>
                <RTooltip
                  :text="layer.locked ? t('rve_unlock', 'Unlock') : t('rve_lock', 'Lock')"
                  side="top"
                  class="rv-raw__tip"
                >
                  <button
                    type="button"
                    class="rc-btn rc-btn--sm"
                    @click.stop="api.toggleLock(layer.id)"
                  >
                    <RIcon
                      :name="layer.locked ? 'i-lucide-lock' : 'i-lucide-lock-open'"
                      class="rc-ico"
                    />
                  </button>
                </RTooltip>
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
            <RTooltip
              v-for="shape in SHAPES"
              :key="shape.id"
              :text="tl(shape.label)"
              side="top"
              class="rv-raw__tip rv-raw__tip--contents"
            >
              <button
                type="button"
                class="rc-shapes__item"
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
            </RTooltip>
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
            @click="openImagePicker()"
          >
            <RIcon
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
            <RTooltip
              v-for="item in mediaItems"
              :key="item.id || item.url || item.src"
              :text="item.name || t('rve_add_image', 'Add image')"
              side="top"
              class="rv-raw__tip rv-raw__tip--contents"
            >
              <button
                type="button"
                class="rc-media__item"
                @click="addMediaImage(item)"
              >
                <img
                  :src="item.url || item.src"
                  :alt="item.name || ''"
                >
              </button>
            </RTooltip>
          </div>
        </div>
      </aside>

      <div
        v-if="leftCollapsed"
        class="rv-raw__edge-toggle rv-raw__edge-toggle--left"
      >
        <RBtnExCol
          :collapsed="leftCollapsed"
          :label="leftToggleLabel"
          controls="rv-raw-left"
          @click="leftCollapsed = !leftCollapsed"
        />
      </div>

      <div
        ref="stageRef"
        class="rc-stage rv-raw__stage"
        :class="stageClass"
        tabindex="0"
        @dragover.prevent
        @drop.prevent="onDrop"
      >
        <aside
          v-if="toolsVisible"
          class="rv-raw__tools"
          :class="toolsClass"
          :style="toolsStyle"
          :aria-label="t('rve_tools', 'Tools')"
        >
          <RTooltip
            v-for="tool in TOOLS"
            :key="tool.id"
            :text="`${tl(tool.label)} (${tool.key.toUpperCase()})`"
            :side="toolsTooltipSide"
            class="rv-raw__tip"
          >
            <button
              type="button"
              class="rv-raw__tool"
              :class="{ 'is-on': activeTool === tool.id }"
              :disabled="!state.ready || saving"
              @click="setTool(tool.id)"
            >
              <RIcon
                :name="tool.icon"
                class="rc-ico"
              />
            </button>
          </RTooltip>
        </aside>

        <div class="rc-stage__page">
          <canvas ref="canvasEl" />
          <div class="rv-raw__frame-labels">
            <button
              v-for="frame in state.frames"
              :key="frame.id"
              type="button"
              class="rv-raw__frame-tag"
              :class="{ 'is-on': frame.selected }"
              :style="{ left: `${frame.left}px`, top: `${frame.top}px` }"
              @pointerdown.stop
              @click.stop="api.selectById(frame.id)"
            >
              {{ frame.name }}
            </button>
          </div>
        </div>

        <div
          v-if="isCreateTool"
          class="rv-raw__tool-layer"
          @pointerdown.prevent="onToolDown"
          @pointermove.prevent="onToolMove"
          @pointerup.prevent="onToolUp"
          @pointercancel="onToolCancel"
        >
          <span
            v-if="!toolDrag.active"
            class="rv-raw__tool-hint"
          >{{ toolHint }}</span>
          <div
            v-if="toolDrag.active"
            class="rv-raw__marquee"
            :style="marqueeStyle"
          />
        </div>

        <div class="rv-raw__stage-info">
          <span class="rv-raw__frame-label">{{ t('rve_page', 'Page') }} {{ state.pageIndex + 1 }}</span>
          <span>{{ state.width }} x {{ state.height }}</span>
        </div>

        <div class="rv-raw__zoom-dock">
          <RTooltip
            :text="t('rve_zoom_out', 'Zoom out')"
            side="top"
            class="rv-raw__tip"
          >
            <button
              type="button"
              :disabled="!state.ready || saving"
              @click="api.zoomBy(1 / 1.2)"
            >
              <RIcon
                name="i-lucide-minus"
                class="rc-ico"
              />
            </button>
          </RTooltip>
          <RTooltip
            :text="t('rve_fit', 'Fit')"
            side="top"
            class="rv-raw__tip"
          >
            <button
              type="button"
              class="rv-raw__zoom-value"
              :disabled="!state.ready || saving"
              @click="api.fit()"
            >
              {{ Math.round(state.zoom * 100) }}%
            </button>
          </RTooltip>
          <RTooltip
            :text="t('rve_zoom_in', 'Zoom in')"
            side="top"
            class="rv-raw__tip"
          >
            <button
              type="button"
              :disabled="!state.ready || saving"
              @click="api.zoomBy(1.2)"
            >
              <RIcon
                name="i-lucide-plus"
                class="rc-ico"
              />
            </button>
          </RTooltip>
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
          <RIcon
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

      <div
        v-if="rightCollapsed"
        class="rv-raw__edge-toggle rv-raw__edge-toggle--right"
      >
        <RBtnExCol
          :collapsed="rightCollapsed"
          :label="rightToggleLabel"
          controls="rv-raw-right"
          side="left"
          mirror
          @click="rightCollapsed = !rightCollapsed"
        />
      </div>

      <aside
        id="rv-raw-right"
        class="rv-raw__right"
        :class="{ 'is-disabled': !state.ready || saving, 'is-collapsed': rightCollapsed }"
        :inert="rightCollapsed || !state.ready || saving"
      >
        <div class="rv-raw__side-head rv-raw__side-head--right">
          <RBtnExCol
            :collapsed="rightCollapsed"
            :label="rightToggleLabel"
            controls="rv-raw-right"
            side="left"
            mirror
            @click="rightCollapsed = !rightCollapsed"
          />
        </div>
        <section class="rv-raw__section rv-raw__section--presets">
          <div class="rv-raw__title rv-raw__title--row">
            <span>{{ t('rve_presets', 'Presets') }}</span>
            <RTooltip
              :text="t('rve_presets_info', 'Choose a canvas size for Facebook, Instagram, TikTok, LinkedIn and more.')"
              side="left"
              :is-popper="true"
              class="rv-raw__tip"
            >
              <span class="rv-raw__info">
                <RIcon
                  name="i-lucide-info"
                  class="rc-ico"
                />
              </span>
            </RTooltip>
          </div>
          <RCanvasPresetPicker
            v-model="presetId"
            :groups="presetGroups"
            :label="t('rve_choose_preset', 'Choose a preset')"
            :placeholder="t('rve_choose_preset', 'Choose a preset')"
            :title="t('rve_presets', 'Presets')"
            :empty-label="t('rve_no_presets', 'No presets available')"
            :disabled="!state.ready || saving"
            side="bottom"
            align="end"
            @select="applyCanvasPreset"
          />
          <p class="rc-hint">
            {{ t('rve_presets_hint', 'Presets resize the canvas. Existing elements keep their positions.') }}
          </p>
        </section>
        <div v-if="state.sel">
          <div class="rv-raw__inspector-head">
            <span class="rv-raw__title">{{ selLabel }}</span>
            <RTooltip
              :text="state.sel.locked ? t('rve_unlock', 'Unlock') : t('rve_lock', 'Lock')"
              side="left"
              class="rv-raw__tip"
            >
              <button
                type="button"
                class="rc-btn rc-btn--sm"
                :class="{ 'is-on': state.sel.locked }"
                @click="api.setLocked(!state.sel.locked)"
              >
                <RIcon
                  :name="state.sel.locked ? 'i-lucide-lock' : 'i-lucide-lock-open'"
                  class="rc-ico"
                />
              </button>
            </RTooltip>
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
            <div class="rv-raw__actions">
              <RTooltip
                :text="t('rve_rotate_left', 'Rotate left 90°')"
                side="top"
                class="rv-raw__tip"
              >
                <button
                  type="button"
                  class="rc-btn rc-btn--solid"
                  @click="rotateBy(-90)"
                >
                  <RIcon
                    name="i-lucide-rotate-ccw"
                    class="rc-ico"
                  />
                </button>
              </RTooltip>
              <RTooltip
                :text="t('rve_rotate_right', 'Rotate right 90°')"
                side="top"
                class="rv-raw__tip"
              >
                <button
                  type="button"
                  class="rc-btn rc-btn--solid"
                  @click="rotateBy(90)"
                >
                  <RIcon
                    name="i-lucide-rotate-cw"
                    class="rc-ico"
                  />
                </button>
              </RTooltip>
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
              <RTooltip
                :text="t('rve_toggle_shadow', 'Toggle shadow')"
                side="top"
                class="rv-raw__tip"
              >
                <button
                  type="button"
                  class="rc-btn rc-btn--solid"
                  :class="{ 'is-on': state.sel.shadow }"
                  @click="api.setShadow(!state.sel.shadow)"
                >
                  <RIcon
                    name="i-lucide-sun-dim"
                    class="rc-ico"
                  />
                </button>
              </RTooltip>
              <RTooltip
                :text="t('rve_flip_horizontal', 'Flip horizontal')"
                side="top"
                class="rv-raw__tip"
              >
                <button
                  type="button"
                  class="rc-btn rc-btn--solid"
                  @click="api.flip('x')"
                >
                  <RIcon
                    name="i-lucide-flip-horizontal"
                    class="rc-ico"
                  />
                </button>
              </RTooltip>
              <RTooltip
                :text="t('rve_flip_vertical', 'Flip vertical')"
                side="top"
                class="rv-raw__tip"
              >
                <button
                  type="button"
                  class="rc-btn rc-btn--solid"
                  @click="api.flip('y')"
                >
                  <RIcon
                    name="i-lucide-flip-vertical"
                    class="rc-ico"
                  />
                </button>
              </RTooltip>
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
              <RTooltip
                :text="t('rve_bold', 'Bold')"
                side="top"
                class="rv-raw__tip"
              >
                <button
                  type="button"
                  class="rc-btn rc-btn--solid"
                  :class="{ 'is-on': state.sel.bold }"
                  @click="api.toggleBold()"
                >
                  <RIcon
                    name="i-lucide-bold"
                    class="rc-ico"
                  />
                </button>
              </RTooltip>
              <RTooltip
                :text="t('rve_italic', 'Italic')"
                side="top"
                class="rv-raw__tip"
              >
                <button
                  type="button"
                  class="rc-btn rc-btn--solid"
                  :class="{ 'is-on': state.sel.italic }"
                  @click="api.toggleItalic()"
                >
                  <RIcon
                    name="i-lucide-italic"
                    class="rc-ico"
                  />
                </button>
              </RTooltip>
              <RTooltip
                :text="t('rve_underline', 'Underline')"
                side="top"
                class="rv-raw__tip"
              >
                <button
                  type="button"
                  class="rc-btn rc-btn--solid"
                  :class="{ 'is-on': state.sel.underline }"
                  @click="api.toggleUnderline()"
                >
                  <RIcon
                    name="i-lucide-underline"
                    class="rc-ico"
                  />
                </button>
              </RTooltip>
              <RTooltip
                :text="t('rve_strikethrough', 'Strikethrough')"
                side="top"
                class="rv-raw__tip"
              >
                <button
                  type="button"
                  class="rc-btn rc-btn--solid"
                  :class="{ 'is-on': state.sel.linethrough }"
                  @click="api.toggleStrike()"
                >
                  <RIcon
                    name="i-lucide-strikethrough"
                    class="rc-ico"
                  />
                </button>
              </RTooltip>
            </div>
            <div class="rv-raw__actions">
              <RTooltip
                v-for="align in TEXT_ALIGNS"
                :key="align"
                :text="`${t('rve_align', 'Align')} ${t('rve_align_' + align, align)}`"
                side="top"
                class="rv-raw__tip"
              >
                <button
                  type="button"
                  class="rc-btn rc-btn--solid"
                  :class="{ 'is-on': state.sel.textAlign === align }"
                  @click="api.setAlign(align)"
                >
                  <RIcon
                    :name="`i-lucide-align-${align}`"
                    class="rc-ico"
                  />
                </button>
              </RTooltip>
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
              <RIcon
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

          <section
            v-if="state.sel.kind === 'image'"
            class="rv-raw__section"
          >
            <div class="rv-raw__title">
              {{ t('rve_crop', 'Crop') }}
            </div>
            <div class="rv-raw__chips">
              <button
                v-for="item in CROP_RATIOS"
                :key="item.id"
                type="button"
                class="rv-raw__chip"
                :class="{ 'is-on': cropRatioActive(item) }"
                @click="applyCrop(item.ratio)"
              >
                {{ item.key ? t(item.key, item.label) : item.label }}
              </button>
            </div>
            <dl class="rv-raw__meta">
              <div class="rv-raw__meta-row">
                <dt>{{ t('rve_aspect_ratio', 'Aspect ratio') }}</dt>
                <dd>{{ state.sel.cropRatio ? `${Math.round(state.sel.cropRatio * 100) / 100}:1` : '—' }}</dd>
              </div>
              <div class="rv-raw__meta-row">
                <dt>{{ t('rve_crop_size', 'Crop size') }}</dt>
                <dd>{{ state.sel.imageCropWidth }} × {{ state.sel.imageCropHeight }} px</dd>
              </div>
            </dl>
          </section>

          <section
            v-if="state.sel.kind === 'image'"
            class="rv-raw__section"
          >
            <div class="rv-raw__title rv-raw__title--row">
              <span>{{ t('rve_filters', 'Filters') }}</span>
              <RTooltip
                :text="t('rve_filters_info', 'Filters apply a quick look to the selected image. Fine-tune the result with the sliders above.')"
                side="left"
                :is-popper="true"
                class="rv-raw__tip"
              >
                <span class="rv-raw__info">
                  <RIcon
                    name="i-lucide-info"
                    class="rc-ico"
                  />
                </span>
              </RTooltip>
            </div>
            <div class="rv-raw__presets">
              <button
                v-for="preset in IMAGE_PRESETS"
                :key="preset.id"
                type="button"
                class="rv-raw__preset"
                :class="{ 'is-on': presetActive(preset) }"
                @click="applyImagePreset(preset)"
              >
                <span
                  class="rv-raw__preset-dot"
                  :style="{ background: preset.swatch }"
                />
                <span>{{ t(preset.key, preset.label) }}</span>
              </button>
            </div>
          </section>

          <section class="rv-raw__section">
            <div class="rv-raw__title">
              {{ t('rve_arrange', 'Arrange') }}
            </div>
            <div class="rv-raw__actions">
              <RTooltip
                :text="t('rve_bring_to_front', 'Bring to front')"
                side="top"
                class="rv-raw__tip"
              >
                <button
                  type="button"
                  class="rc-btn rc-btn--solid"
                  @click="api.order('front')"
                >
                  <RIcon
                    name="i-lucide-chevrons-up"
                    class="rc-ico"
                  />
                </button>
              </RTooltip>
              <RTooltip
                :text="t('rve_bring_forward', 'Bring forward')"
                side="top"
                class="rv-raw__tip"
              >
                <button
                  type="button"
                  class="rc-btn rc-btn--solid"
                  @click="api.order('forward')"
                >
                  <RIcon
                    name="i-lucide-arrow-up"
                    class="rc-ico"
                  />
                </button>
              </RTooltip>
              <RTooltip
                :text="t('rve_send_backward', 'Send backward')"
                side="top"
                class="rv-raw__tip"
              >
                <button
                  type="button"
                  class="rc-btn rc-btn--solid"
                  @click="api.order('backward')"
                >
                  <RIcon
                    name="i-lucide-arrow-down"
                    class="rc-ico"
                  />
                </button>
              </RTooltip>
              <RTooltip
                :text="t('rve_send_to_back', 'Send to back')"
                side="top"
                class="rv-raw__tip"
              >
                <button
                  type="button"
                  class="rc-btn rc-btn--solid"
                  @click="api.order('back')"
                >
                  <RIcon
                    name="i-lucide-chevrons-down"
                    class="rc-ico"
                  />
                </button>
              </RTooltip>
            </div>
            <div class="rv-raw__actions">
              <RTooltip
                v-for="item in ALIGN"
                :key="item[0]"
                :text="`${t('rve_align', 'Align')} ${t('rve_align_' + item[0], item[0])}`"
                side="top"
                class="rv-raw__tip"
              >
                <button
                  type="button"
                  class="rc-btn rc-btn--solid"
                  @click="api.align(item[0])"
                >
                  <RIcon
                    :name="`i-lucide-${item[1]}`"
                    class="rc-ico"
                  />
                </button>
              </RTooltip>
            </div>
            <div class="rv-raw__actions">
              <button
                v-if="state.sel.kind === 'multi'"
                type="button"
                class="rc-btn rc-btn--solid"
                @click="api.group()"
              >
                <RIcon
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
                <RIcon
                  name="i-lucide-ungroup"
                  class="rc-ico"
                />
                {{ t('rve_ungroup', 'Ungroup') }}
              </button>
              <RTooltip
                :text="t('rve_duplicate', 'Duplicate')"
                side="top"
                class="rv-raw__tip"
              >
                <button
                  type="button"
                  class="rc-btn rc-btn--solid"
                  @click="api.duplicate()"
                >
                  <RIcon
                    name="i-lucide-copy"
                    class="rc-ico"
                  />
                </button>
              </RTooltip>
              <RTooltip
                :text="t('rve_delete', 'Delete')"
                side="top"
                class="rv-raw__tip"
              >
                <button
                  type="button"
                  class="rc-btn rc-btn--solid rc-btn--danger"
                  @click="api.remove()"
                >
                  <RIcon
                    name="i-lucide-trash-2"
                    class="rc-ico"
                  />
                </button>
              </RTooltip>
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
          <section class="rv-raw__section rv-raw__section--file">
            <div class="rv-raw__title">
              {{ t('rve_file_info', 'File info') }}
            </div>
            <dl class="rv-raw__meta">
              <div class="rv-raw__meta-row">
                <dt>{{ t('rve_name', 'Name') }}</dt>
                <dd>{{ title || t('rve_untitled_design', 'Untitled design') }}</dd>
              </div>
              <div class="rv-raw__meta-row">
                <dt>{{ t('rve_canvas', 'Canvas') }}</dt>
                <dd>{{ state.width }} × {{ state.height }} px</dd>
              </div>
              <div class="rv-raw__meta-row">
                <dt>{{ t('rve_page', 'Page') }}</dt>
                <dd>{{ state.pageIndex + 1 }} / {{ state.pages.length || 1 }}</dd>
              </div>
              <div class="rv-raw__meta-row">
                <dt>{{ t('rve_elements', 'Elements') }}</dt>
                <dd>{{ state.layers.length }}</dd>
              </div>
              <div class="rv-raw__meta-row">
                <dt>{{ t('rve_zoom', 'Zoom') }}</dt>
                <dd>{{ Math.round((state.zoom || 1) * 100) }}%</dd>
              </div>
              <template v-if="state.sel?.hasImage">
                <div class="rv-raw__meta-row">
                  <dt>{{ t('rve_name', 'Name') }}</dt>
                  <dd>{{ state.sel.imageName }}</dd>
                </div>
                <div class="rv-raw__meta-row">
                  <dt>{{ t('rve_type', 'Type') }}</dt>
                  <dd>{{ state.sel.imageType }}</dd>
                </div>
                <div class="rv-raw__meta-row">
                  <dt>{{ t('rve_image_size', 'Image size') }}</dt>
                  <dd>{{ state.sel.imageNaturalWidth }} × {{ state.sel.imageNaturalHeight }} px</dd>
                </div>
                <div class="rv-raw__meta-row">
                  <dt>{{ t('rve_crop_size', 'Crop size') }}</dt>
                  <dd>{{ state.sel.imageCropWidth }} × {{ state.sel.imageCropHeight }} px</dd>
                </div>
              </template>
            </dl>
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
    position: relative;
    display: flex;
    flex: 1;
    min-height: 0;
  }

  &__side-head {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  &__side-head--left {
    justify-content: flex-end;
    padding: 6px 8px 0;
  }

  &__side-head--right {
    justify-content: flex-start;
    padding: 0 0 8px;
  }

  &__edge-toggle {
    position: absolute;
    top: 8px;
    z-index: 31;
    display: flex;
  }

  &__edge-toggle--left {
    left: 8px;
  }

  &__edge-toggle--right {
    right: 8px;
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

  &__left.is-collapsed,
  &__right.is-collapsed {
    width: 0;
    min-width: 0;
    padding: 0;
    overflow: hidden;
    border: 0;
    opacity: 0;
    pointer-events: none;
  }

  &__tip {
    width: auto !important;
  }

  &__tip--contents {
    display: contents;
  }

  &__tip--grow {
    flex: 1;
    min-width: 0;
    width: auto !important;
  }

  &__tip--grow .rc-layer__name {
    display: block;
    width: 100%;
  }

  &__stage {
    flex: 1;
    min-width: 0;
    background: color-mix(in srgb, #000 78%, var(--rc-bg));

    &.is-disabled {
      pointer-events: none;
    }

    &.is-tool-hand {
      cursor: grab;
    }

    &.is-tool-draw {
      cursor: crosshair;
    }

    .rc-stage__page {
      position: relative;
      padding: 72px;
    }
  }

  &__frame-labels {
    position: absolute;
    inset: 0;
    z-index: 12;
    overflow: hidden;
    pointer-events: none;
  }

  &__frame-tag {
    position: absolute;
    max-width: 180px;
    padding: 2px 6px;
    overflow: hidden;
    font-size: 11px;
    line-height: 16px;
    color: rgba(255, 255, 255, 0.72);
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
    pointer-events: auto;
    cursor: pointer;
    background: transparent;
    border: 0;
    border-radius: 4px;

    &:hover,
    &.is-on {
      color: #fff;
      background: rgba(140, 82, 255, 0.92);
    }
  }

  &__tools {
    position: absolute;
    z-index: 26;
    display: flex;
    gap: 3px;
    padding: 5px;
    background: color-mix(in srgb, var(--rc-bg) 94%, transparent);
    border: 1px solid color-mix(in srgb, var(--rc-text) 12%, transparent);
    border-radius: 12px;
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.24);
    backdrop-filter: blur(12px);

    &--horizontal {
      flex-direction: row;
    }

    &--vertical {
      flex-direction: column;
    }

    &--top {
      top: var(--rv-tools-offset, 16px);
      left: 50%;
      transform: translateX(-50%);
    }

    &--bottom {
      bottom: var(--rv-tools-offset, 16px);
      left: 50%;
      transform: translateX(-50%);
    }

    &--left {
      top: 50%;
      left: var(--rv-tools-offset, 16px);
      transform: translateY(-50%);
    }

    &--right {
      top: 50%;
      right: var(--rv-tools-offset, 16px);
      transform: translateY(-50%);
    }
  }

  &__tool {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    padding: 0;
    color: var(--rc-muted);
    background: transparent;
    border: 0;
    border-radius: 8px;
    cursor: pointer;

    &:hover:not(:disabled) {
      color: var(--rc-text);
      background: var(--rc-bg-soft);
    }

    &.is-on {
      color: var(--rc-accent);
      background: color-mix(in srgb, var(--rc-accent) 16%, transparent);
    }

    &:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
  }

  &__tool-layer {
    position: absolute;
    inset: 0;
    z-index: 14;
    cursor: crosshair;
  }

  &__tool-hint {
    position: absolute;
    top: 16px;
    left: 50%;
    padding: 6px 10px;
    font-size: 11px;
    font-weight: 600;
    color: var(--rc-text);
    white-space: nowrap;
    background: color-mix(in srgb, var(--rc-bg) 94%, transparent);
    border: 1px solid var(--rc-border);
    border-radius: 999px;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
    transform: translateX(-50%);
    pointer-events: none;
  }

  &__marquee {
    position: absolute;
    border: 1.5px solid var(--rc-accent);
    background: color-mix(in srgb, var(--rc-accent) 14%, transparent);
    border-radius: 2px;
    pointer-events: none;
  }

  &__stage-info {
    position: absolute;
    bottom: 16px;
    left: 16px;
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.72);
    background: rgba(18, 18, 20, 0.72);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    pointer-events: none;
    backdrop-filter: blur(10px);
  }

  &__frame-label {
    font-weight: 700;
    color: #fff;
  }

  &__zoom-dock {
    position: absolute;
    right: 16px;
    bottom: 16px;
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 3px;
    background: color-mix(in srgb, var(--rc-bg) 94%, transparent);
    border: 1px solid var(--rc-border);
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(12px);

    button {
      display: grid;
      place-items: center;
      min-width: 30px;
      height: 30px;
      padding: 0 6px;
      color: var(--rc-muted);
      font: inherit;
      background: transparent;
      border: 0;
      border-radius: 7px;
      cursor: pointer;

      &:hover:not(:disabled) {
        color: var(--rc-text);
        background: var(--rc-bg-soft);
      }

      &:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
    }
  }

  &__zoom-value {
    min-width: 52px !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    font-variant-numeric: tabular-nums;
  }

  &__top-hint {
    max-width: 320px;
    overflow: hidden;
    font-size: 11px;
    color: var(--rc-muted);
    text-overflow: ellipsis;
    white-space: nowrap;
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

  &__title--row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  &__info {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    color: var(--rc-muted);
    cursor: help;
    border-radius: 50%;

    &:hover {
      color: var(--rc-text);
      background: var(--rc-bg-soft);
    }

    .rc-ico {
      width: 14px;
      height: 14px;
    }
  }

  &__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__chip {
    padding: 6px 9px;
    font: inherit;
    font-size: 11px;
    font-weight: 600;
    color: var(--rc-muted);
    background: var(--rc-bg-soft);
    border: 1px solid var(--rc-border);
    border-radius: 999px;
    cursor: pointer;

    &:hover {
      color: var(--rc-text);
      border-color: var(--rc-accent);
    }

    &.is-on {
      color: #fff;
      background: var(--rc-accent);
      border-color: var(--rc-accent);
    }
  }

  &__presets {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
  }

  &__preset {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 32px;
    padding: 6px 8px;
    overflow: hidden;
    font: inherit;
    font-size: 11px;
    font-weight: 600;
    color: var(--rc-text);
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
    background: var(--rc-bg-soft);
    border: 1px solid var(--rc-border);
    border-radius: 8px;
    cursor: pointer;

    &:hover {
      border-color: var(--rc-accent);
    }

    &.is-on {
      border-color: var(--rc-accent);
      box-shadow: inset 0 0 0 1px var(--rc-accent);
    }
  }

  &__preset-dot {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    border: 1px solid rgba(0, 0, 0, 0.12);
    border-radius: 50%;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2);
  }

  &__meta {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 0;
  }

  &__meta-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    font-size: 11px;

    dt {
      color: var(--rc-muted);
    }

    dd {
      max-width: 62%;
      margin: 0;
      overflow: hidden;
      color: var(--rc-text);
      font-weight: 600;
      text-align: right;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &__section--file {
    padding-top: 16px;
    border-top: 1px solid var(--rc-border);
    border-bottom: 0;
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
