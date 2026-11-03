<!--
  RGridLayout — reusable wrapper around `vue-grid-layout-v3` (Nuxt 4 + Nuxt UI 4).

  PROPS  (every vue-grid-layout-v3 prop is supported; each can also be set through `option`)
  ────────────────────────────────────────────────────────────────────────────────────────
  layout            Array    v-model:layout. Default: 5 same-size items (testLayout, 4×4 on 12 cols)
  responsiveLayouts Object   v-model:responsiveLayouts  { lg: [...], md: [...], ... }
  option            Object   v-model:option — single object for all behaviour options:
                             isDraggable, isResizable, isMirrored, isBounded, isResponsive,
                             isPreventCollision, isVerticalCompact, isRestoreOnDrag,
                             isUseCssTransforms, isAutoSize, isUseStyleCursor, showGridLines,
                             colNum, rowHeight, maxRows, margin, containerPadding, transformScale,
                             breakpoints, cols, dragAllowFrom, dragIgnoreFrom, resizeIgnoreFrom
                             (library-native names such as `draggable`, `preventCollision`,
                             `responsive` are accepted as aliases)
  isDraggable · isResizable · isMirrored · isBounded · autoSize · verticalCompact · restoreOnDrag ·
  preventCollision · useCssTransforms · responsive · useStyleCursor · colNum · rowHeight · maxRows ·
  margin · transformScale · breakpoints · cols
                    …the vue-grid-layout-v3 props. When set they override the same key in `option`.
  containerPadding · showGridLines · dragAllowFrom · dragIgnoreFrom · resizeIgnoreFrom   (extras)
  showControlPanel  Boolean  built-in control panel      controls  Array   which groups to show
  toggles           Array    which toggles to show       variant   'card' | 'bare'
  labels            Object   i18n overrides              controlPanelOpen / showLayoutJson  Boolean
  flush             Boolean  cancel the library's built-in outer gutter, so items start flush with the component's
                             edges (lines the grid up with sibling blocks such as cards / hero sections)

  LAYOUT ITEM FIELDS (GridItem props)
  ────────────────────────────────────────────────────────────────────────────────────────
  i, x, y, w, h, static, minW, maxW, minH, maxH, minX, maxX, minY, maxY, preserveAspectRatio,
  isDraggable|draggable, isResizable|resizable, isBounded|bounded, dragIgnoreFrom, dragAllowFrom,
  resizeIgnoreFrom, dragOption, resizeOption  (+ any custom field, e.g. title / component)

  EVENTS
  ────────────────────────────────────────────────────────────────────────────────────────
  GridLayout : layout-created · layout-before-mount · layout-mounted · layout-ready ·
               layout-updated · breakpoint-changed (breakpoint, layout)
  GridItem   : move · moved · resize · resized · container-resized
  v-model    : update:layout · update:responsiveLayouts · update:option
  extras     : layout-change (layout, { type, i, breakpoint }) · item-add · item-remove · reset

  SLOTS
  ────────────────────────────────────────────────────────────────────────────────────────
  #item="{ item, index, remove, breakpoint, cols }"   content of every item
  #item-<i>                                           content of one item (wins over #item)
  #panel="{ state, layout }"                          extra controls inside the control panel
  #empty                                              shown when there are no items

  EXPOSED  layoutRef (the library instance) · state · items · currentBreakpoint · currentCols ·
           addItem · addItemRandom · removeItem · resetLayout · getLayout · setLayout · setScale ·
           stepWidth · resetWidth · changeDirection · copyLayoutJson
-->
<script setup>
import {
  computed,
  markRaw,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  shallowRef,
  watch,
} from 'vue'
import { getDocumentDir, setDocumentDir } from '~/utils/dom'
import {
  CONTROL_GROUPS,
  DEFAULT_ITEM_SIZE,
  DEFAULT_LABELS,
  DEFAULT_OPTION,
  PROP_TO_OPTION,
  TOGGLE_OPTIONS,
  cloneLayout,
  cloneLayoutMap,
  createTestLayout,
  finalizeOption,
  layoutSignature,
  normalizeOption,
} from '~/utils/gridLayout.config'

defineOptions({ name: 'RGridLayout', inheritAttrs: false })

// ═════════════════════════════════════════════════════════════════════════════
// Props / emits
// ═════════════════════════════════════════════════════════════════════════════
const props = defineProps({
  /** v-model:layout — defaults to the 5-item test layout. */
  layout: { type: Array, default: () => createTestLayout() },
  /** v-model:responsiveLayouts — per-breakpoint layouts. */
  responsiveLayouts: { type: Object, default: () => ({}) },
  /** v-model:option — all behaviour options in one object. */
  option: { type: Object, default: () => ({}) },

  // vue-grid-layout-v3 props (undefined = "not set" → falls back to `option`, then defaults)
  isDraggable: { type: Boolean, default: undefined },
  isResizable: { type: Boolean, default: undefined },
  isMirrored: { type: Boolean, default: undefined },
  isBounded: { type: Boolean, default: undefined },
  autoSize: { type: Boolean, default: undefined },
  verticalCompact: { type: Boolean, default: undefined },
  restoreOnDrag: { type: Boolean, default: undefined },
  preventCollision: { type: Boolean, default: undefined },
  useCssTransforms: { type: Boolean, default: undefined },
  responsive: { type: Boolean, default: undefined },
  useStyleCursor: { type: Boolean, default: undefined },
  colNum: { type: Number, default: undefined },
  rowHeight: { type: Number, default: undefined },
  maxRows: { type: Number, default: undefined },
  margin: { type: Array, default: undefined },
  transformScale: { type: Number, default: undefined },
  breakpoints: { type: Object, default: undefined },
  cols: { type: Object, default: undefined },

  // extras
  containerPadding: { type: Array, default: undefined },
  showGridLines: { type: Boolean, default: undefined },
  dragAllowFrom: { type: String, default: undefined },
  dragIgnoreFrom: { type: String, default: undefined },
  resizeIgnoreFrom: { type: String, default: undefined },

  // UI
  showControlPanel: { type: Boolean, default: false },
  controlPanelOpen: { type: Boolean, default: true },
  showLayoutJson: { type: Boolean, default: false },
  /** Cancel the library's built-in outer gutter (it always pads the grid by `margin`). */
  flush: { type: Boolean, default: false },
  controls: { type: Array, default: () => [...CONTROL_GROUPS] },
  toggles: { type: Array, default: undefined },
  variant: {
    type: String,
    default: 'card',
    validator: (value) => ['card', 'bare'].includes(value),
  },
  labels: { type: Object, default: () => ({}) },
})

const emit = defineEmits([
  // v-model
  'update:layout',
  'update:responsiveLayouts',
  'update:option',
  // GridLayout (vue-grid-layout-v3)
  'layout-created',
  'layout-before-mount',
  'layout-mounted',
  'layout-ready',
  'layout-updated',
  'breakpoint-changed',
  // GridItem (vue-grid-layout-v3)
  'move',
  'moved',
  'resize',
  'resized',
  'container-resized',
  // extras
  'layout-change',
  'item-add',
  'item-remove',
  'reset',
])

const L = computed(() => ({ ...DEFAULT_LABELS, ...props.labels }))

// ═════════════════════════════════════════════════════════════════════════════
// Library (client-only, lazy). Rendering a skeleton until it is ready keeps SSR safe.
// ═════════════════════════════════════════════════════════════════════════════
const lib = shallowRef(null)
const loadError = ref(null)

async function loadLibrary() {
  try {
    const mod = await import('vue-grid-layout-v3')
    lib.value = { GridLayout: markRaw(mod.GridLayout), GridItem: markRaw(mod.GridItem) }
  } catch (error) {
    loadError.value = error
    console.error('[RGridLayout] Could not load "vue-grid-layout-v3". Run: npm i vue-grid-layout-v3', error)
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// Options  (option object ⇄ native props ⇄ control panel)
// ═════════════════════════════════════════════════════════════════════════════
function resolveOption() {
  const merged = { ...DEFAULT_OPTION, ...normalizeOption(props.option) }
  for (const [prop, key] of Object.entries(PROP_TO_OPTION)) {
    if (props[prop] !== undefined) merged[key] = props[prop]
  }
  return finalizeOption(merged)
}

const optionSignature = (value) => JSON.stringify(value) // Infinity → null on both sides
const cloneOption = (o) => ({
  ...o,
  margin: [...o.margin],
  containerPadding: [...o.containerPadding],
  breakpoints: { ...o.breakpoints },
  cols: { ...o.cols },
})

const state = reactive(resolveOption())
let lastOptionSignature = optionSignature(state)

// Props / option changed from outside → sync the internal state
watch(
  () => [props.option, ...Object.keys(PROP_TO_OPTION).map((prop) => props[prop])],
  () => {
    const next = resolveOption()
    if (optionSignature(next) !== optionSignature(state)) Object.assign(state, next)
  },
  { deep: true },
)

// Changed from the control panel (or programmatically) → tell the parent (v-model:option)
watch(
  state,
  () => {
    const signature = optionSignature(state)
    if (signature === lastOptionSignature) return
    lastOptionSignature = signature
    emit('update:option', cloneOption(state))
  },
  { deep: true },
)

// ═════════════════════════════════════════════════════════════════════════════
// Layout state
// ═════════════════════════════════════════════════════════════════════════════
// A null / id-less entry would blow up the render (`item.i`) and surface as a vnode error: drop them.
const isValidItem = (item) => item !== null && typeof item === 'object' && item.i !== undefined && item.i !== null
const sanitize = (layout) => (Array.isArray(layout) ? layout.filter(isValidItem) : [])

const innerLayout = ref(sanitize(cloneLayout(props.layout)))
const renderItems = computed(() => sanitize(innerLayout.value))
const initialLayout = cloneLayout(props.layout)

watch(
  () => props.layout,
  (next) => {
    if (layoutSignature(next) === layoutSignature(innerLayout.value)) return
    innerLayout.value = sanitize(cloneLayout(next))
  },
  { deep: true },
)

const layoutRef = ref(null)
const gridKey = ref(0)
const currentBreakpoint = ref('')

const currentCols = computed(() => {
  if (state.isResponsive && currentBreakpoint.value) {
    const cols = Number(state.cols?.[currentBreakpoint.value])
    if (Number.isFinite(cols) && cols > 0) return cols
  }
  return state.colNum
})

// Per-breakpoint layouts (kept outside the library so add / remove can keep them in sync)
let breakpointLayouts = cloneLayoutMap(props.responsiveLayouts)
const libResponsiveLayouts = shallowRef(cloneLayoutMap(breakpointLayouts))

watch(
  () => props.responsiveLayouts,
  (next) => {
    const incoming = cloneLayoutMap(next)
    if (JSON.stringify(incoming, (k, v) => (k === 'moved' ? undefined : v)) ===
        JSON.stringify(breakpointLayouts, (k, v) => (k === 'moved' ? undefined : v))) return
    breakpointLayouts = incoming
    libResponsiveLayouts.value = cloneLayoutMap(incoming)
    gridKey.value++
  },
  { deep: true },
)

// breakpoints / cols are not reactive inside the library → remount it (layout is preserved)
watch(
  () => JSON.stringify([state.breakpoints, state.cols]),
  () => {
    libResponsiveLayouts.value = cloneLayoutMap(breakpointLayouts)
    gridKey.value++
  },
)

// ── Emit helpers ─────────────────────────────────────────────────────────────
function emitLayoutChange(type, i) {
  if (state.isResponsive && currentBreakpoint.value) {
    breakpointLayouts[currentBreakpoint.value] = cloneLayout(innerLayout.value)
    emit('update:responsiveLayouts', cloneLayoutMap(breakpointLayouts))
  }
  emit('update:layout', cloneLayout(innerLayout.value))
  emit('layout-change', cloneLayout(innerLayout.value), {
    type,
    i,
    breakpoint: currentBreakpoint.value || null,
  })
}

// ── Library → component ──────────────────────────────────────────────────────
function onLayoutModel(next) {
  innerLayout.value = sanitize(next)
  emit('update:layout', cloneLayout(innerLayout.value))
}

const layoutHandlers = {
  layoutCreated: (...args) => emit('layout-created', ...args),
  layoutBeforeMount: (...args) => emit('layout-before-mount', ...args),
  layoutMounted: (...args) => emit('layout-mounted', ...args),
  layoutReady: (...args) => emit('layout-ready', ...args),
  layoutUpdated: (...args) => emit('layout-updated', ...args),
  breakpointChanged: (breakpoint, layout) => {
    currentBreakpoint.value = breakpoint
    breakpointLayouts[breakpoint] = cloneLayout(layout)
    emit('breakpoint-changed', breakpoint, layout)
    emit('update:responsiveLayouts', cloneLayoutMap(breakpointLayouts))
  },
}

const itemHandlers = {
  move: (...args) => emit('move', ...args),
  resize: (...args) => emit('resize', ...args),
  containerResized: (...args) => emit('container-resized', ...args),
  moved: (i, x, y) => {
    emit('moved', i, x, y)
    emitLayoutChange('moved', i)
  },
  resized: (i, h, w, hPx, wPx) => {
    emit('resized', i, h, w, hPx, wPx)
    emitLayoutChange('resized', i)
  },
}

// ── GridItem bindings (only defined fields are forwarded, so library defaults stay intact)
const ITEM_PASS_THROUGH = [
  'minW', 'maxW', 'minH', 'maxH', 'minX', 'maxX', 'minY', 'maxY',
  'preserveAspectRatio', 'dragOption', 'resizeOption',
  'dragIgnoreFrom', 'dragAllowFrom', 'resizeIgnoreFrom',
]

function itemBindings(item) {
  const bindings = { i: item.i, x: item.x, y: item.y, w: item.w, h: item.h, static: Boolean(item.static) }

  for (const key of ITEM_PASS_THROUGH) {
    if (item[key] !== undefined && item[key] !== null) bindings[key] = item[key]
  }
  // Global handle options act as fallback for every item
  for (const key of ['dragAllowFrom', 'dragIgnoreFrom', 'resizeIgnoreFrom']) {
    if (bindings[key] === undefined && state[key]) bindings[key] = state[key]
  }
  // Per-item overrides (accept both `draggable` and `isDraggable`)
  const flags = [
    ['isDraggable', item.isDraggable ?? item.draggable],
    ['isResizable', item.isResizable ?? item.resizable],
    ['isBounded', item.isBounded ?? item.bounded],
  ]
  for (const [key, value] of flags) if (typeof value === 'boolean') bindings[key] = value

  return bindings
}

const slotProps = (item, index) => ({
  item,
  index,
  remove: () => removeItem(item.i),
  breakpoint: currentBreakpoint.value,
  cols: currentCols.value,
})

// ═════════════════════════════════════════════════════════════════════════════
// Item operations
// ═════════════════════════════════════════════════════════════════════════════
const bottomOf = (layout) => layout.reduce((max, item) => Math.max(max, item.y + item.h), 0)

function nextId() {
  const used = new Set(innerLayout.value.map((item) => String(item.i)))
  const numeric = innerLayout.value.map((item) => Number(item.i)).filter(Number.isFinite)
  let n = numeric.length ? Math.max(...numeric) + 1 : innerLayout.value.length
  while (used.has(String(n))) n++
  return String(n)
}

// Best effort: keep the other breakpoints' layouts (ours + the library's) in sync
function syncBreakpointLayouts({ add, removeId }) {
  const library = layoutRef.value
  const maps = [breakpointLayouts, library?.layouts]
  for (const map of maps) {
    if (!map || typeof map !== 'object') continue
    for (const bp of Object.keys(map)) {
      if (!Array.isArray(map[bp])) continue
      if (removeId !== undefined) {
        map[bp] = map[bp].filter((item) => String(item.i) !== String(removeId))
      } else if (add && !map[bp].some((item) => String(item.i) === String(add.i))) {
        const cols = Number(state.cols?.[bp]) || state.colNum
        map[bp] = [...map[bp], { ...add, x: 0, y: bottomOf(map[bp]), w: Math.min(add.w, cols) }]
      }
    }
  }
}

function addItem(partial = {}) {
  const w = Math.min(partial.w ?? DEFAULT_ITEM_SIZE.w, currentCols.value)
  const item = {
    x: 0,
    y: bottomOf(innerLayout.value),
    h: DEFAULT_ITEM_SIZE.h,
    ...partial,
    w,
    i: partial.i !== undefined && partial.i !== null ? String(partial.i) : nextId(),
  }
  innerLayout.value = [...innerLayout.value, item]
  syncBreakpointLayouts({ add: item })
  emit('item-add', item)
  emitLayoutChange('add', item.i)
  return item
}

/** Adds an item at a random position (handy to test collisions / prevent-collision). */
function addItemRandom() {
  const w = Math.min(DEFAULT_ITEM_SIZE.w, currentCols.value)
  const x = Math.floor(Math.random() * Math.max(1, currentCols.value - w + 1))
  const y = Math.floor(Math.random() * (bottomOf(innerLayout.value) + 4))
  return addItem({ x, y, w })
}

function removeItem(i) {
  const index = innerLayout.value.findIndex((item) => String(item.i) === String(i))
  if (index === -1) return
  const [removed] = innerLayout.value.splice(index, 1)
  syncBreakpointLayouts({ removeId: i })
  emit('item-remove', removed)
  emitLayoutChange('remove', i)
}

function getLayout() {
  return cloneLayout(innerLayout.value)
}

function setLayout(next) {
  innerLayout.value = sanitize(cloneLayout(next))
  emitLayoutChange('set')
}

// ═════════════════════════════════════════════════════════════════════════════
// View helpers: width, scale, direction, JSON
// ═════════════════════════════════════════════════════════════════════════════
const canvasRef = ref(null)
const forcedWidth = ref(null)
const canvasWidth = ref(0)

function stepWidth(delta) {
  const base = forcedWidth.value ?? canvasRef.value?.offsetWidth ?? 0
  if (!base) return
  forcedWidth.value = Math.max(240, base + delta)
}

function resetWidth() {
  forcedWidth.value = null
}

function setScale(value) {
  state.transformScale = Number(value) || 1
}

let initialDirAttr = null
function changeDirection() {
  if (typeof document === 'undefined') return
  if (initialDirAttr === null) initialDirAttr = document.documentElement.getAttribute('dir') ?? ''
  const next = getDocumentDir() === 'rtl' ? 'ltr' : 'rtl'
  setDocumentDir(next)
  state.isMirrored = next === 'rtl'
}

const layoutJson = computed(() => layoutSignature(innerLayout.value) && JSON.stringify(
  innerLayout.value,
  (key, value) => (key === 'moved' ? undefined : value),
  2,
))

const jsonOpen = ref(props.showLayoutJson)
const copied = ref(false)
let copiedTimer = null

async function copyLayoutJson() {
  try {
    await navigator.clipboard.writeText(layoutJson.value)
    copied.value = true
    clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => (copied.value = false), 1600)
  } catch {
    /* clipboard unavailable (insecure context) */
  }
}

function resetLayout() {
  Object.assign(state, resolveOption())
  forcedWidth.value = null
  breakpointLayouts = cloneLayoutMap(props.responsiveLayouts)
  libResponsiveLayouts.value = cloneLayoutMap(breakpointLayouts)
  innerLayout.value = cloneLayout(initialLayout)
  gridKey.value++
  emit('reset')
  emitLayoutChange('reset')
}

// ═════════════════════════════════════════════════════════════════════════════
// Control panel
// ═════════════════════════════════════════════════════════════════════════════
const panelOpen = ref(props.controlPanelOpen)
const has = (group) => props.controls.includes(group)
const visibleToggles = computed(() =>
  TOGGLE_OPTIONS.filter((toggle) => !props.toggles || props.toggles.includes(toggle.key)),
)
const SCALES = [0.5, 0.75, 1]

function setNumber(key, event, min, max) {
  const raw = event.target.value
  if (raw === '') return
  const n = Number(raw)
  if (!Number.isFinite(n)) return
  state[key] = Math.min(max, Math.max(min, Math.round(n)))
}

function setMargin(index, event) {
  const n = Number(event.target.value)
  if (!Number.isFinite(n)) return
  const next = [...state.margin]
  next[index] = Math.min(64, Math.max(0, Math.round(n)))
  state.margin = next
}

function setMaxRows(event) {
  const n = Number(event.target.value)
  state.maxRows = event.target.value === '' || !Number.isFinite(n) || n <= 0 ? Infinity : Math.floor(n)
}

// ═════════════════════════════════════════════════════════════════════════════
// Canvas styles + grid lines overlay
// ═════════════════════════════════════════════════════════════════════════════
const stageStyle = computed(() => ({
  padding: `${state.containerPadding[1]}px ${state.containerPadding[0]}px`,
}))

const canvasStyle = computed(() => {
  const style = {}
  const [mx, my] = state.margin
  // vue-grid-layout always insets the grid by `margin`; pull the canvas out by the same amount
  if (props.flush) style.margin = `${-my}px ${-mx}px`
  if (forcedWidth.value !== null) style.width = `${forcedWidth.value + (props.flush ? mx * 2 : 0)}px`
  if (state.transformScale !== 1) {
    style.transform = `scale(${state.transformScale})`
    style.transformOrigin = 'top left'
  }
  return style
})

const gridLinesStyle = computed(() => {
  const width = canvasWidth.value
  const cols = currentCols.value
  const [mx, my] = state.margin
  if (!width || !cols) return null

  const cellWidth = (width - mx * (cols + 1)) / cols
  if (cellWidth <= 0) return null

  const pitchX = cellWidth + mx
  const pitchY = state.rowHeight + my
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${pitchX}' height='${pitchY}'>` +
    `<rect width='${cellWidth}' height='${state.rowHeight}' rx='6' fill='#000'/></svg>`
  const mask = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`

  return {
    WebkitMaskImage: mask,
    maskImage: mask,
    WebkitMaskSize: `${pitchX}px ${pitchY}px`,
    maskSize: `${pitchX}px ${pitchY}px`,
    WebkitMaskPosition: `${mx}px ${my}px`,
    maskPosition: `${mx}px ${my}px`,
  }
})

// Skeleton placement (shown before the library is ready / during SSR)
const skeletonStyle = (item) => ({
  '--col-start': Math.min(item.x, Math.max(0, state.colNum - 1)) + 1,
  '--col-span': Math.min(item.w, state.colNum),
  '--row-start': item.y + 1,
  '--row-span': item.h,
})

// ═════════════════════════════════════════════════════════════════════════════
// Lifecycle
// ═════════════════════════════════════════════════════════════════════════════
let resizeObserver = null

onMounted(() => {
  loadLibrary()

  if (typeof ResizeObserver !== 'undefined' && canvasRef.value) {
    resizeObserver = new ResizeObserver(([entry]) => {
      canvasWidth.value = Math.round(entry.contentRect.width)
    })
    resizeObserver.observe(canvasRef.value)
  }
  nextTick(() => {
    canvasWidth.value = canvasRef.value?.offsetWidth ?? 0
  })
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  clearTimeout(copiedTimer)
  // give the document its original direction back if the demo "change direction" button was used
  if (initialDirAttr !== null) setDocumentDir(initialDirAttr || null)
})

defineExpose({
  layoutRef,
  state,
  items: innerLayout,
  currentBreakpoint,
  currentCols,
  addItem,
  addItemRandom,
  removeItem,
  resetLayout,
  getLayout,
  setLayout,
  setScale,
  stepWidth,
  resetWidth,
  changeDirection,
  copyLayoutJson,
})
</script>

<template>
  <section
    v-bind="$attrs"
    class="r-layout-grid"
    :class="[`r-layout-grid--${variant}`, { 'is-scaled': state.transformScale !== 1, 'has-drag-handle': Boolean(state.dragAllowFrom) }]"
    :data-breakpoint="currentBreakpoint || undefined"
  >
    <!-- ══ Control panel ═══════════════════════════════════════════════════ -->
    <aside v-if="showControlPanel" class="r-layout-grid__panel" :aria-label="L.controlPanel">
      <div class="r-layout-grid__panel-head">
        <button
          type="button"
          class="r-layout-grid__panel-toggle"
          :aria-expanded="panelOpen"
          @click="panelOpen = !panelOpen"
        >
          <UIcon name="i-lucide-sliders-horizontal" class="r-layout-grid__icon" />
          <span>{{ L.controlPanel }}</span>
          <UIcon name="i-lucide-chevron-down" class="r-layout-grid__chevron" />
        </button>

        <div class="r-layout-grid__chips">
          <span class="r-layout-grid__chip">{{ renderItems.length }} {{ L.items }}</span>
          <span class="r-layout-grid__chip" :class="{ 'is-accent': state.isResponsive }">
            <template v-if="state.isResponsive && currentBreakpoint">{{ currentBreakpoint }} · </template>
            {{ currentCols }} {{ L.columns }}
          </span>
        </div>
      </div>

      <div class="r-layout-grid__collapse" :class="{ 'is-open': panelOpen }" :inert="!panelOpen">
        <div class="r-layout-grid__collapse-inner">
          <div class="r-layout-grid__panel-body">
            <!-- Toggles -->
            <div v-if="has('toggles') && visibleToggles.length" class="r-layout-grid__toggles">
              <label v-for="toggle in visibleToggles" :key="toggle.key" class="r-layout-grid__switch">
                <input v-model="state[toggle.key]" type="checkbox" role="switch" />
                <span class="r-layout-grid__switch-track" aria-hidden="true" />
                <span class="r-layout-grid__switch-label">{{ L[toggle.label] }}</span>
              </label>
            </div>

            <!-- Numbers -->
            <div v-if="has('numbers')" class="r-layout-grid__numbers">
              <label class="r-layout-grid__field">
                <span>{{ L.rowHeight }}</span>
                <input type="number" min="10" max="1000" step="5" :value="state.rowHeight" @input="setNumber('rowHeight', $event, 10, 1000)" />
              </label>
              <label class="r-layout-grid__field" :class="{ 'is-disabled': state.isResponsive }">
                <span>{{ L.colNum }}</span>
                <input type="number" min="1" max="48" :value="state.colNum" :disabled="state.isResponsive" @input="setNumber('colNum', $event, 1, 48)" />
              </label>
              <label class="r-layout-grid__field">
                <span>{{ L.marginX }}</span>
                <input type="number" min="0" max="64" :value="state.margin[0]" @input="setMargin(0, $event)" />
              </label>
              <label class="r-layout-grid__field">
                <span>{{ L.marginY }}</span>
                <input type="number" min="0" max="64" :value="state.margin[1]" @input="setMargin(1, $event)" />
              </label>
              <label class="r-layout-grid__field">
                <span>{{ L.maxRows }}</span>
                <input type="number" min="1" placeholder="∞" :title="L.maxRowsHint" :value="Number.isFinite(state.maxRows) ? state.maxRows : ''" @input="setMaxRows($event)" />
              </label>
            </div>

            <!-- Actions -->
            <div class="r-layout-grid__actions">
              <div v-if="has('size')" class="r-layout-grid__btn-group">
                <button type="button" class="r-layout-grid__btn" @click="stepWidth(-20)">
                  <UIcon name="i-lucide-minus" /> {{ L.decreaseWidth }}
                </button>
                <button type="button" class="r-layout-grid__btn" @click="stepWidth(20)">
                  <UIcon name="i-lucide-plus" /> {{ L.increaseWidth }}
                </button>
                <button v-if="forcedWidth !== null" type="button" class="r-layout-grid__btn" @click="resetWidth">
                  <UIcon name="i-lucide-move-horizontal" /> {{ L.resetWidth }}
                </button>
              </div>

              <div v-if="has('scale')" class="r-layout-grid__btn-group" role="group" :aria-label="L.scale">
                <span class="r-layout-grid__group-label">{{ L.scale }}</span>
                <button
                  v-for="scale in SCALES"
                  :key="scale"
                  type="button"
                  class="r-layout-grid__btn"
                  :class="{ 'is-active': state.transformScale === scale }"
                  :aria-pressed="state.transformScale === scale"
                  @click="setScale(scale)"
                >
                  ×{{ scale }}
                </button>
              </div>

              <div v-if="has('items')" class="r-layout-grid__btn-group">
                <button type="button" class="r-layout-grid__btn r-layout-grid__btn--primary" @click="addItem()">
                  <UIcon name="i-lucide-plus" /> {{ L.addItem }}
                </button>
                <button type="button" class="r-layout-grid__btn" @click="addItemRandom">
                  <UIcon name="i-lucide-shuffle" /> {{ L.addItemRandom }}
                </button>
              </div>

              <div class="r-layout-grid__btn-group">
                <button v-if="has('direction')" type="button" class="r-layout-grid__btn" @click="changeDirection">
                  <UIcon name="i-lucide-arrow-left-right" /> {{ L.changeDirection }}
                </button>
                <button v-if="has('json')" type="button" class="r-layout-grid__btn" :aria-pressed="jsonOpen" @click="jsonOpen = !jsonOpen">
                  <UIcon name="i-lucide-braces" /> {{ jsonOpen ? L.hideJson : L.showJson }}
                </button>
                <button v-if="has('reset')" type="button" class="r-layout-grid__btn" @click="resetLayout">
                  <UIcon name="i-lucide-undo-2" /> {{ L.reset }}
                </button>
              </div>
            </div>

            <slot name="panel" :state="state" :layout="innerLayout" />

            <!-- Layout JSON -->
            <div v-if="has('json') && jsonOpen" class="r-layout-grid__json">
              <button type="button" class="r-layout-grid__btn r-layout-grid__json-copy" @click="copyLayoutJson">
                <UIcon :name="copied ? 'i-lucide-check' : 'i-lucide-copy'" />
                {{ copied ? L.copied : L.copyJson }}
              </button>
              <pre tabindex="0">{{ layoutJson }}</pre>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- ══ Grid ════════════════════════════════════════════════════════════ -->
    <div class="r-layout-grid__stage" :class="{ 'is-forced-width': forcedWidth !== null, 'is-flush': flush }" :style="stageStyle">
      <div ref="canvasRef" class="r-layout-grid__canvas" :style="canvasStyle">
        <div v-if="state.showGridLines && gridLinesStyle" class="r-layout-grid__lines" :style="gridLinesStyle" aria-hidden="true" />
        <component
          :is="lib.GridLayout"
          v-if="lib"
          ref="layoutRef"
          :key="gridKey"
          :layout="innerLayout"
          :responsive-layouts="libResponsiveLayouts"
          :col-num="state.colNum"
          :row-height="state.rowHeight"
          :max-rows="state.maxRows"
          :margin="state.margin"
          :is-draggable="state.isDraggable"
          :is-resizable="state.isResizable"
          :is-mirrored="state.isMirrored"
          :is-bounded="state.isBounded"
          :auto-size="state.isAutoSize"
          :vertical-compact="state.isVerticalCompact"
          :restore-on-drag="state.isRestoreOnDrag"
          :prevent-collision="state.isPreventCollision"
          :use-css-transforms="state.isUseCssTransforms"
          :use-style-cursor="state.isUseStyleCursor"
          :responsive="state.isResponsive"
          :breakpoints="state.breakpoints"
          :cols="state.cols"
          :transform-scale="state.transformScale"
          v-on="layoutHandlers"
          @update:layout="onLayoutModel"
        >
          <component
            :is="lib.GridItem"
            v-for="(item, index) in renderItems"
            :key="item.i"
            v-bind="itemBindings(item)"
            v-on="itemHandlers"
          >
            <div class="r-layout-grid__item" :data-item-id="item.i">
              <slot :name="`item-${item.i}`" v-bind="slotProps(item, index)">
                <slot name="item" v-bind="slotProps(item, index)">
                  <!-- default item content -->
                  <div class="r-layout-grid__default" :class="{ 'is-static': item.static }">
                    <span class="r-layout-grid__default-index">{{ item.i }}</span>
                    <span class="r-layout-grid__default-size">{{ item.w }} × {{ item.h }}</span>
                    <span v-if="item.static" class="r-layout-grid__badge">{{ L.static }}</span>
                    <button
                      v-if="!item.static"
                      type="button"
                      class="r-layout-grid__remove"
                      :aria-label="L.remove"
                      :title="L.remove"
                      @click.stop="removeItem(item.i)"
                    >
                      <UIcon name="i-lucide-x" />
                    </button>
                  </div>
                </slot>
              </slot>
            </div>
          </component>
        </component>

        <!-- Skeleton: SSR + while the library is loading -->
        <div v-else-if="!loadError" class="r-layout-grid__skeleton" aria-busy="true" :aria-label="L.loading" :style="{ '--rgl-cols': state.colNum, '--rgl-row': `${state.rowHeight}px`, '--rgl-gap': `${state.margin[1]}px` }">
          <div v-for="item in renderItems" :key="item.i" class="r-layout-grid__skeleton-cell" :style="skeletonStyle(item)" />
        </div>

        <p v-else class="r-layout-grid__error" role="alert">
          vue-grid-layout-v3 could not be loaded. Run <code>npm i vue-grid-layout-v3</code>.
        </p>
      </div>

      <!-- Empty state -->
      <div v-if="lib && !renderItems.length" class="r-layout-grid__empty">
        <slot name="empty">
          <UIcon name="i-lucide-layout-grid" class="r-layout-grid__empty-icon" />
          <p class="r-layout-grid__empty-title">{{ L.empty }}</p>
          <p class="r-layout-grid__empty-hint">{{ L.emptyHint }}</p>
          <button type="button" class="r-layout-grid__btn r-layout-grid__btn--primary" @click="addItem()">
            <UIcon name="i-lucide-plus" /> {{ L.addItem }}
          </button>
        </slot>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
// ═════════════════════════════════════════════════════════════════════════════
// Theme tokens — override from outside, e.g.
//   <RGridLayout style="--rgl-item-radius: 1rem; --rgl-accent: var(--c-secondary)" />
// ═════════════════════════════════════════════════════════════════════════════
.r-layout-grid {
  --rgl-accent: var(--c-primary, var(--c-accent, #6366f1));
  --rgl-danger: var(--c-danger, var(--c-error, #dc2626));
  --rgl-surface: var(--c-surface, #fff);
  --rgl-bg: var(--c-bg, #f8fafc);
  --rgl-border: var(--c-border, #e2e8f0);
  --rgl-text: var(--c-text, #0f172a);
  --rgl-muted: var(--c-muted, #64748b);
  --rgl-radius: 0.75rem;

  --rgl-item-bg: var(--rgl-surface);
  --rgl-item-border: var(--rgl-border);
  --rgl-item-border-width: 1px;
  --rgl-item-radius: var(--rgl-radius);
  --rgl-item-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
  --rgl-item-shadow-hover: 0 10px 28px -10px rgb(0 0 0 / 0.2);
  --rgl-item-shadow-drag: 0 20px 44px -12px rgb(0 0 0 / 0.38);
  --rgl-static-bg: color-mix(in srgb, var(--rgl-muted) 8%, var(--rgl-surface));
  --rgl-placeholder-bg: color-mix(in srgb, var(--rgl-accent) 14%, transparent);
  --rgl-placeholder-border: color-mix(in srgb, var(--rgl-accent) 55%, transparent);
  --rgl-placeholder-radius: var(--rgl-item-radius);
  --rgl-handle: color-mix(in srgb, var(--rgl-muted) 75%, transparent);
  --rgl-handle-hover: var(--rgl-accent);
  --rgl-grid-line: color-mix(in srgb, var(--rgl-muted) 16%, transparent);
  --rgl-canvas-bg: transparent;
  --rgl-transition: 200ms ease;
  --rgl-min-height: 6rem;

  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
  color: var(--rgl-text);

  // "bare": the slot content draws its own card (e.g. dashboard widgets)
  &--bare {
    --rgl-item-bg: transparent;
    --rgl-item-border: transparent;
    --rgl-item-border-width: 0; // a transparent 1px border would still inset the widget card
    --rgl-item-radius: 0;
    --rgl-item-shadow: none;
    --rgl-item-shadow-hover: none;
    --rgl-item-shadow-drag: none;
    --rgl-static-bg: transparent;
    --rgl-placeholder-radius: var(--rgl-radius);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// Stage / canvas / overlays
// ═════════════════════════════════════════════════════════════════════════════
.r-layout-grid__stage {
  position: relative;
  min-width: 0;

  // `flush` pulls the canvas outside the stage by `margin`; clip that (empty) gutter so it can never
  // produce a horizontal page scrollbar, but leave room for item shadows
  &.is-flush {
    overflow-x: clip;
    overflow-clip-margin: 1.5rem;
  }

  &.is-forced-width {
    overflow-x: auto;
  }
}

.r-layout-grid__canvas {
  position: relative;
  max-width: none;
}

.r-layout-grid__lines {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-color: var(--rgl-grid-line);
  -webkit-mask-repeat: repeat;
  mask-repeat: repeat;
}

.r-layout-grid__empty {
  display: grid;
  justify-items: center;
  gap: 0.5rem;
  padding: 2.5rem 1rem;
  text-align: center;
  color: var(--rgl-muted);
  border: 2px dashed var(--rgl-border);
  border-radius: var(--rgl-radius);
  background: color-mix(in srgb, var(--rgl-bg) 80%, var(--rgl-surface));
}

.r-layout-grid__empty-icon {
  width: 2.5rem;
  height: 2.5rem;
  opacity: 0.5;
}

.r-layout-grid__empty-title {
  margin: 0;
  font-weight: 600;
  color: var(--rgl-text);
}

.r-layout-grid__empty-hint {
  margin: 0 0 0.5rem;
  font-size: 0.8125rem;
}

.r-layout-grid__error {
  margin: 0;
  padding: 1rem;
  font-size: 0.875rem;
  border-radius: var(--rgl-radius);
  color: var(--rgl-danger);
  background: color-mix(in srgb, var(--rgl-danger) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--rgl-danger) 25%, transparent);
}

// ── Skeleton (SSR / loading) ─────────────────────────────────────────────────
.r-layout-grid__skeleton {
  display: grid;
  grid-template-columns: repeat(var(--rgl-cols, 12), minmax(0, 1fr));
  grid-auto-rows: var(--rgl-row, 60px);
  gap: var(--rgl-gap, 10px);
  padding: var(--rgl-gap, 10px);
}

.r-layout-grid__skeleton-cell {
  grid-column: var(--col-start) / span var(--col-span);
  grid-row: var(--row-start) / span var(--row-span);
  border-radius: var(--rgl-radius);
  background: linear-gradient(
    100deg,
    color-mix(in srgb, var(--rgl-muted) 10%, transparent) 30%,
    color-mix(in srgb, var(--rgl-muted) 20%, transparent) 50%,
    color-mix(in srgb, var(--rgl-muted) 10%, transparent) 70%
  );
  background-size: 200% 100%;
  animation: rgl-shimmer 1.4s ease-in-out infinite;

  @media (max-width: 640px) {
    grid-column: 1 / -1;
  }
}

@keyframes rgl-shimmer {
  to {
    background-position: -200% 0;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// vue-grid-layout-v3 — every class the library renders
//   .vue-grid-layout  .vue-grid-item  .vue-grid-placeholder  .vue-resizable-handle
//   .vue-rtl-resizable-handle  .static  .resizing  .vue-draggable-dragging
//   .cssTransforms  .render-rtl  .disable-userselect  .no-touch
// ═════════════════════════════════════════════════════════════════════════════
.r-layout-grid {
  :deep(.vue-grid-layout) {
    position: relative;
    z-index: 1;
    min-height: var(--rgl-min-height);
    background: var(--rgl-canvas-bg);
    transition: height var(--rgl-transition);
  }

  :deep(.vue-grid-item) {
    box-sizing: border-box;
    transition: all var(--rgl-transition);
    transition-property: left, top, right;

    &.no-touch {
      touch-action: none;
    }

    &.cssTransforms {
      left: 0;
      right: auto;
      transition-property: transform;

      &.render-rtl {
        left: auto;
        right: 0;
      }
    }

    &.disable-userselect {
      user-select: none;
    }

    &.resizing {
      z-index: 3;
      opacity: 0.75;
    }

    &.vue-draggable-dragging {
      z-index: 3;
      transition: none;
      cursor: grabbing;
    }

    // Item surface
    &:not(.vue-grid-placeholder) {
      background: var(--rgl-item-bg);
      border: var(--rgl-item-border-width) solid var(--rgl-item-border);
      border-radius: var(--rgl-item-radius);
      box-shadow: var(--rgl-item-shadow);
      overflow: visible;

      &:hover {
        box-shadow: var(--rgl-item-shadow-hover);
      }

      &.vue-draggable-dragging {
        box-shadow: var(--rgl-item-shadow-drag);
      }

      &.static {
        background: var(--rgl-static-bg);
      }
    }

    // Drop target preview
    &.vue-grid-placeholder {
      z-index: 2;
      opacity: 1;
      user-select: none;
      background: var(--rgl-placeholder-bg);
      border: 2px dashed var(--rgl-placeholder-border);
      border-radius: var(--rgl-placeholder-radius);
      transition-duration: 100ms;
    }

    // Resize handle (south-east) — drawn with borders so it follows the theme
    > .vue-resizable-handle {
      position: absolute;
      right: 0;
      bottom: 0;
      width: 22px;
      height: 22px;
      padding: 0;
      background: none;
      box-sizing: border-box;
      cursor: se-resize;
      touch-action: none;
      z-index: 4;

      &::before {
        content: '';
        position: absolute;
        right: 6px;
        bottom: 6px;
        width: 8px;
        height: 8px;
        border-right: 2px solid var(--rgl-handle);
        border-bottom: 2px solid var(--rgl-handle);
        border-bottom-right-radius: 3px;
        transition: border-color var(--rgl-transition), transform var(--rgl-transition);
      }

      &:hover::before {
        border-color: var(--rgl-handle-hover);
        transform: scale(1.2);
      }
    }

    // Resize handle (south-west) — mirrored / RTL
    > .vue-rtl-resizable-handle {
      position: absolute;
      right: auto;
      bottom: 0;
      left: 0;
      width: 22px;
      height: 22px;
      padding: 0;
      background: none;
      box-sizing: border-box;
      cursor: sw-resize;
      touch-action: none;
      z-index: 4;

      &::before {
        content: '';
        position: absolute;
        left: 6px;
        bottom: 6px;
        width: 8px;
        height: 8px;
        border-left: 2px solid var(--rgl-handle);
        border-bottom: 2px solid var(--rgl-handle);
        border-bottom-left-radius: 3px;
        transition: border-color var(--rgl-transition), transform var(--rgl-transition);
      }

      &:hover::before {
        border-color: var(--rgl-handle-hover);
        transform: scale(1.2);
      }
    }
  }

  // Bare variant: a dragged widget gets a soft drop shadow that follows its rounded card
  &--bare :deep(.vue-grid-item.vue-draggable-dragging) {
    filter: drop-shadow(0 18px 24px rgb(0 0 0 / 0.25));
  }

  // With a drag handle (dragAllowFrom) only the handle should capture touches; the rest of an item
  // must still scroll the page / its own content. Give the handle element `touch-action: none`.
  &.has-drag-handle :deep(.vue-grid-item.no-touch) {
    touch-action: auto;
  }
}

// ── Slot wrapper + default item ──────────────────────────────────────────────
.r-layout-grid__item {
  position: relative;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.r-layout-grid--card .r-layout-grid__item {
  overflow: hidden;
  border-radius: inherit;
}

.r-layout-grid__default {
  position: relative;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 0.25rem;
  width: 100%;
  height: 100%;
  text-align: center;
  user-select: none;
}

.r-layout-grid__default-index {
  font-size: clamp(1.25rem, 3vw, 1.75rem);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.r-layout-grid__default-size {
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  color: var(--rgl-muted);
}

.r-layout-grid__badge {
  padding: 0.125rem 0.5rem;
  font-size: 0.6875rem;
  font-weight: 600;
  border-radius: 999px;
  color: var(--rgl-muted);
  background: color-mix(in srgb, var(--rgl-muted) 14%, transparent);
}

.r-layout-grid__remove {
  position: absolute;
  top: 0.375rem;
  right: 0.375rem;
  display: grid;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  border: 0;
  border-radius: 999px;
  color: var(--rgl-muted);
  background: transparent;
  cursor: pointer;
  opacity: 0;
  transition: opacity var(--rgl-transition), background var(--rgl-transition), color var(--rgl-transition);

  .r-layout-grid__item:hover &,
  &:focus-visible {
    opacity: 1;
  }

  &:hover {
    color: var(--rgl-danger);
    background: color-mix(in srgb, var(--rgl-danger) 12%, transparent);
  }

  &:focus-visible {
    outline: 2px solid var(--rgl-accent);
    outline-offset: 1px;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// Control panel
// ═════════════════════════════════════════════════════════════════════════════
.r-layout-grid__panel {
  border: 1px solid var(--rgl-border);
  border-radius: var(--rgl-radius);
  background: var(--rgl-surface);
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.04);
}

.r-layout-grid__panel-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1rem;
  padding: 0.5rem 0.75rem;
}

.r-layout-grid__panel-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.5rem;
  border: 0;
  border-radius: 0.5rem;
  background: transparent;
  color: var(--rgl-text);
  font: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background var(--rgl-transition);

  &:hover {
    background: color-mix(in srgb, var(--rgl-text) 6%, transparent);
  }

  &:focus-visible {
    outline: 2px solid var(--rgl-accent);
    outline-offset: 1px;
  }

  .r-layout-grid__icon {
    color: var(--rgl-accent);
  }

  .r-layout-grid__chevron {
    color: var(--rgl-muted);
    transition: transform var(--rgl-transition);
  }

  &[aria-expanded='true'] .r-layout-grid__chevron {
    transform: rotate(180deg);
  }
}

.r-layout-grid__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.r-layout-grid__chip {
  padding: 0.1875rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  border-radius: 999px;
  color: var(--rgl-muted);
  background: color-mix(in srgb, var(--rgl-muted) 12%, transparent);

  &.is-accent {
    color: var(--rgl-accent);
    background: color-mix(in srgb, var(--rgl-accent) 12%, transparent);
  }
}

// height: 0 → auto without JS
.r-layout-grid__collapse {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 240ms ease;

  &.is-open {
    grid-template-rows: 1fr;
  }
}

.r-layout-grid__collapse-inner {
  min-height: 0;
  overflow: hidden;
}

.r-layout-grid__panel-body {
  display: grid;
  gap: 1rem;
  padding: 0.25rem 0.75rem 0.875rem;
  border-top: 1px solid var(--rgl-border);
  padding-top: 0.875rem;
}

.r-layout-grid__toggles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 12.5rem), 1fr));
  gap: 0.5rem 1rem;
}

// Switch (native checkbox, fully styled)
.r-layout-grid__switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  font-size: 0.8125rem;
  cursor: pointer;
  user-select: none;

  input {
    position: absolute;
    opacity: 0;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    cursor: pointer;
  }
}

.r-layout-grid__switch-track {
  position: relative;
  flex-shrink: 0;
  width: 2rem;
  height: 1.125rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--rgl-muted) 35%, transparent);
  transition: background var(--rgl-transition);

  &::after {
    content: '';
    position: absolute;
    top: 0.125rem;
    left: 0.125rem;
    width: 0.875rem;
    height: 0.875rem;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.3);
    transition: transform var(--rgl-transition);
  }
}

.r-layout-grid__switch input:checked + .r-layout-grid__switch-track {
  background: var(--rgl-accent);

  &::after {
    transform: translateX(0.875rem);
  }
}

.r-layout-grid__switch input:focus-visible + .r-layout-grid__switch-track {
  outline: 2px solid var(--rgl-accent);
  outline-offset: 2px;
}

.r-layout-grid__numbers {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 7.5rem), 1fr));
  gap: 0.75rem;
}

.r-layout-grid__field {
  display: grid;
  gap: 0.25rem;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--rgl-muted);

  input {
    width: 100%;
    padding: 0.4375rem 0.625rem;
    font: inherit;
    font-size: 0.875rem;
    font-weight: 500;
    letter-spacing: normal;
    text-transform: none;
    border: 1px solid var(--rgl-border);
    border-radius: 0.5rem;
    color: var(--rgl-text);
    background: var(--rgl-bg);
    transition: border-color var(--rgl-transition), box-shadow var(--rgl-transition);

    &:focus {
      outline: none;
      border-color: var(--rgl-accent);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--rgl-accent) 20%, transparent);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &.is-disabled {
    opacity: 0.7;
  }
}

.r-layout-grid__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
}

.r-layout-grid__btn-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem;
}

.r-layout-grid__group-label {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--rgl-muted);
}

.r-layout-grid__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  white-space: nowrap;
  border: 1px solid var(--rgl-border);
  border-radius: 0.5rem;
  color: var(--rgl-text);
  background: var(--rgl-surface);
  cursor: pointer;
  transition:
    background var(--rgl-transition),
    border-color var(--rgl-transition),
    color var(--rgl-transition),
    transform 120ms ease;

  &:hover {
    border-color: color-mix(in srgb, var(--rgl-accent) 45%, var(--rgl-border));
    background: color-mix(in srgb, var(--rgl-accent) 6%, var(--rgl-surface));
  }

  &:active {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: 2px solid var(--rgl-accent);
    outline-offset: 2px;
  }

  &.is-active,
  &[aria-pressed='true'] {
    border-color: var(--rgl-accent);
    color: var(--rgl-accent);
    background: color-mix(in srgb, var(--rgl-accent) 10%, var(--rgl-surface));
  }

  &--primary {
    border-color: var(--rgl-accent);
    color: var(--c-bg, #fff);
    background: var(--rgl-accent);

    &:hover {
      background: color-mix(in srgb, var(--rgl-accent) 88%, #000);
    }
  }
}

.r-layout-grid__json {
  position: relative;

  pre {
    max-height: 16rem;
    margin: 0;
    padding: 0.875rem 1rem;
    overflow: auto;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.75rem;
    line-height: 1.55;
    border: 1px solid var(--rgl-border);
    border-radius: 0.625rem;
    color: var(--rgl-text);
    background: var(--rgl-bg);
  }
}

.r-layout-grid__json-copy {
  position: absolute;
  top: 0.5rem;
  right: 1.25rem;
  z-index: 1;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

// ═════════════════════════════════════════════════════════════════════════════
// Responsive + motion
// ═════════════════════════════════════════════════════════════════════════════
@media (max-width: 640px) {
  .r-layout-grid__panel-head {
    padding: 0.5rem;
  }

  .r-layout-grid__panel-body {
    padding-inline: 0.5rem;
  }

  .r-layout-grid__btn {
    padding: 0.4375rem 0.625rem;
  }

  .r-layout-grid__remove {
    opacity: 1; // no hover on touch screens
  }
}

@media (prefers-reduced-motion: reduce) {
  .r-layout-grid__skeleton-cell {
    animation: none;
  }

  .r-layout-grid__collapse,
  .r-layout-grid__switch-track,
  .r-layout-grid__switch-track::after,
  .r-layout-grid__chevron {
    transition: none;
  }

  .r-layout-grid :deep(.vue-grid-layout),
  .r-layout-grid :deep(.vue-grid-item) {
    transition: none;
  }
}
</style>