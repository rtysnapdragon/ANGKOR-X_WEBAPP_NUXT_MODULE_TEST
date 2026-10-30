<template>
  <div class="r-canvas">
    <!-- ── Toolbar ──────────────────────────────────────────────────────── -->
    <div class="r-canvas__toolbar">
      <div class="r-canvas__tool-group">
        <input ref="photoInputRef" type="file" accept="image/*" class="r-canvas__hidden-input" @change="onPhotoSelected">
        <button type="button" class="r-canvas__btn" title="Add photo" @click="photoInputRef?.click()">
          <i class="i-lucide-image" /><span>Photo</span>
        </button>
        <button type="button" class="r-canvas__btn" title="Add line" @click="addLine">
          <i class="i-lucide-minus" /><span>Line</span>
        </button>
        <button type="button" class="r-canvas__btn" title="Add rectangle" @click="addRectangle">
          <i class="i-lucide-square" /><span>Rectangle</span>
        </button>

        <div class="r-canvas__popover-wrap">
          <button type="button" class="r-canvas__btn" title="Add icon" @click="iconMenuOpen = !iconMenuOpen">
            <i class="i-lucide-shapes" /><span>Icon</span>
          </button>
          <div v-if="iconMenuOpen" class="r-canvas__icon-menu" @mouseleave="iconMenuOpen = false">
            <button
              v-for="icon in ICONS"
              :key="icon.name"
              type="button"
              class="r-canvas__icon-option"
              :title="icon.name"
              @click="addIcon(icon); iconMenuOpen = false"
            >
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path :d="icon.d" :fill="icon.filled ? 'currentColor' : 'none'" :stroke="icon.filled ? 'none' : 'currentColor'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div class="r-canvas__sep" />

      <div class="r-canvas__tool-group">
        <button type="button" class="r-canvas__btn r-canvas__btn--icon" title="Bring to front" :disabled="!selected" @click="orderOp('front')"><i class="i-lucide-bring-to-front" /></button>
        <button type="button" class="r-canvas__btn r-canvas__btn--icon" title="Bring forward" :disabled="!selected" @click="orderOp('forward')"><i class="i-lucide-chevron-up" /></button>
        <button type="button" class="r-canvas__btn r-canvas__btn--icon" title="Send backward" :disabled="!selected" @click="orderOp('backward')"><i class="i-lucide-chevron-down" /></button>
        <button type="button" class="r-canvas__btn r-canvas__btn--icon" title="Send to back" :disabled="!selected" @click="orderOp('back')"><i class="i-lucide-send-to-back" /></button>
        <button type="button" class="r-canvas__btn r-canvas__btn--icon" title="Duplicate" :disabled="!selected" @click="duplicateSelected"><i class="i-lucide-copy" /></button>
        <button type="button" class="r-canvas__btn r-canvas__btn--icon r-canvas__btn--danger" title="Delete" :disabled="!selected" @click="deleteSelected"><i class="i-lucide-trash-2" /></button>
      </div>

      <div class="r-canvas__spacer" />

      <button type="button" class="r-canvas__btn" :class="{ 'is-active': snapEnabled }" title="Toggle snap guidelines" @click="snapEnabled = !snapEnabled">
        <i class="i-lucide-align-center-vertical" /><span>Snap</span>
      </button>
      <button type="button" class="r-canvas__btn r-canvas__btn--ghost" @click="emits('cancel')">Cancel</button>
      <button type="button" class="r-canvas__btn r-canvas__btn--primary" @click="save">
        <i class="i-lucide-check" /><span>Insert</span>
      </button>
    </div>

    <!-- ── Body: stage + sidebar ────────────────────────────────────────── -->
    <div class="r-canvas__body">
      <div class="r-canvas__stage-wrap">
        <div class="r-canvas__stage" :style="{ width: `${width}px`, height: `${height}px` }">
          <canvas ref="canvasElRef" />
        </div>
      </div>

      <div class="r-canvas__sidebar">
        <!-- Layers -->
        <div class="r-canvas__panel">
          <h4 class="r-canvas__panel-title">Layers</h4>
          <div v-if="!layers.length" class="r-canvas__empty">Nothing on the canvas yet</div>
          <div
            v-for="layer in layers"
            :key="layer.id"
            class="r-canvas__layer"
            :class="{ 'is-active': layer.active }"
            @click="selectLayer(layer)"
          >
            <i :class="layerIcon(layer.type)" class="r-canvas__layer-icon" />
            <span class="r-canvas__layer-name">{{ layer.label }}</span>
            <button type="button" class="r-canvas__layer-btn" title="Toggle visibility" @click.stop="toggleVisible(layer)">
              <i :class="layer.visible ? 'i-lucide-eye' : 'i-lucide-eye-off'" />
            </button>
            <button type="button" class="r-canvas__layer-btn" title="Lock / unlock" @click.stop="toggleLock(layer)">
              <i :class="layer.locked ? 'i-lucide-lock' : 'i-lucide-lock-open'" />
            </button>
          </div>
        </div>

        <!-- Properties -->
        <div v-if="selected" class="r-canvas__panel">
          <h4 class="r-canvas__panel-title">Properties</h4>
          <div class="r-canvas__prop-grid">
            <label class="r-canvas__prop">X<input type="number" v-model.number="propX" @input="applyProp('left', propX)"></label>
            <label class="r-canvas__prop">Y<input type="number" v-model.number="propY" @input="applyProp('top', propY)"></label>
            <label class="r-canvas__prop">W<input type="number" v-model.number="propW" min="1" @input="applyScale('x', propW)"></label>
            <label class="r-canvas__prop">H<input type="number" v-model.number="propH" min="1" @input="applyScale('y', propH)"></label>
            <label class="r-canvas__prop r-canvas__prop--wide">
              Rotation
              <input type="range" min="-180" max="180" v-model.number="propAngle" @input="applyProp('angle', propAngle)">
              <span class="r-canvas__prop-value">{{ propAngle }}°</span>
            </label>
            <label class="r-canvas__prop r-canvas__prop--wide">
              Opacity
              <input type="range" min="0" max="1" step="0.05" v-model.number="propOpacity" @input="applyProp('opacity', propOpacity)">
              <span class="r-canvas__prop-value">{{ Math.round(propOpacity * 100) }}%</span>
            </label>
            <label v-if="canFill" class="r-canvas__prop r-canvas__prop--color">
              Fill <input type="color" v-model="propFill" @input="applyProp('fill', propFill)">
            </label>
            <label v-if="canStroke" class="r-canvas__prop r-canvas__prop--color">
              Stroke <input type="color" v-model="propStroke" @input="applyProp('stroke', propStroke)">
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Canvas, Rect, Line as FabricLine, FabricImage, Path } from 'fabric'

const props = defineProps({
  modelValue: { type: [String, Object], default: null }, // canvas.toJSON() from a previous save
  width: { type: Number, default: 900 },
  height: { type: Number, default: 560 },
  background: { type: String, default: '#ffffff' },
})

const emits = defineEmits(['save', 'cancel'])

// ─── Preset icon paths (simple, original geometry — not lifted from any icon set) ─
const ICONS = [
  { name: 'Star', filled: true, d: 'M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.9-6.2 3.9 1.6-7L2 9.2l7.1-.6z' },
  { name: 'Heart', filled: true, d: 'M12 21s-7.4-4.6-9.9-9.1C.4 8.2 2 4 6 4c2.1 0 3.6 1.2 6 4 2.4-2.8 3.9-4 6-4 4 0 5.7 4.2 3.9 7.9-2.5 4.5-9.9 9.1-9.9 9.1z' },
  { name: 'Bell', filled: true, d: 'M6 10a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6zM10 20a2 2 0 0 0 4 0' },
  { name: 'Flag', filled: true, d: 'M5 3v18M5 4h12l-2 4 2 4H5z' },
  { name: 'Bookmark', filled: true, d: 'M6 3h12v18l-6-4-6 4z' },
  { name: 'Shield', filled: true, d: 'M12 2l8 3v6c0 5-3.4 9-8 11-4.6-2-8-6-8-11V5z' },
  { name: 'Check', filled: false, d: 'M20 6 9 17l-5-5' },
  { name: 'Close', filled: false, d: 'M18 6 6 18M6 6l12 12' },
  { name: 'Plus', filled: false, d: 'M12 4v16M4 12h16' },
  { name: 'Arrow Right', filled: false, d: 'M4 12h14m0 0-5-5m5 5-5 5' },
  { name: 'Chevron Down', filled: false, d: 'M5 8l7 7 7-7' },
  { name: 'Circle', filled: false, d: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z' },
]

const width = computed(() => props.width)
const height = computed(() => props.height)

// ─── Refs ────────────────────────────────────────────────────────────────────
const canvasElRef = ref(null)
const photoInputRef = ref(null)
const iconMenuOpen = ref(false)

const selected = ref(false)
const layersVersion = ref(0)
const snapEnabled = ref(true)

const propX = ref(0)
const propY = ref(0)
const propW = ref(0)
const propH = ref(0)
const propAngle = ref(0)
const propOpacity = ref(1)
const propFill = ref('#000000')
const propStroke = ref('#000000')

let canvas = null
let activeObj = null
let guideLines = []
let uidCounter = 0

const SNAP_THRESHOLD = 6

const canFill = computed(() => !!activeObj && activeObj.type !== 'line')
const canStroke = computed(() => !!activeObj)

// ════════════════════════════════════════════════════════════════════════
// Setup
// ════════════════════════════════════════════════════════════════════════
onMounted(() => {
  canvas = new Canvas(canvasElRef.value, {
    width: width.value,
    height: height.value,
    backgroundColor: props.background,
    preserveObjectStacking: true,
  })

  if (props.modelValue) {
    try {
      const json = typeof props.modelValue === 'string' ? JSON.parse(props.modelValue) : props.modelValue
      canvas.loadFromJSON(json).then(() => canvas.requestRenderAll())
    } catch {
      // Invalid/incompatible design JSON — start from a blank canvas instead of failing.
    }
  }

  canvas.on('selection:created', onSelection)
  canvas.on('selection:updated', onSelection)
  canvas.on('selection:cleared', () => { selected.value = false; activeObj = null })
  canvas.on('object:added', bumpLayers)
  canvas.on('object:removed', bumpLayers)
  canvas.on('object:modified', () => { bumpLayers(); syncPropsFromObject() })
  canvas.on('object:scaling', syncPropsFromObject)
  canvas.on('object:rotating', syncPropsFromObject)
  canvas.on('object:moving', handleSnapping)
  canvas.on('mouse:up', clearGuides)
})

onBeforeUnmount(() => {
  canvas?.dispose()
})

// ════════════════════════════════════════════════════════════════════════
// Selection + property sync
// ════════════════════════════════════════════════════════════════════════
function onSelection() {
  activeObj = canvas.getActiveObject()
  selected.value = !!activeObj
  syncPropsFromObject()
}

function syncPropsFromObject() {
  if (!activeObj) return
  propX.value = Math.round(activeObj.left)
  propY.value = Math.round(activeObj.top)
  propW.value = Math.round(activeObj.getScaledWidth())
  propH.value = Math.round(activeObj.getScaledHeight())
  propAngle.value = Math.round(activeObj.angle)
  propOpacity.value = activeObj.opacity ?? 1
  propFill.value = typeof activeObj.fill === 'string' ? activeObj.fill : '#000000'
  propStroke.value = typeof activeObj.stroke === 'string' ? activeObj.stroke : '#000000'
}

function applyProp(key, value) {
  if (!activeObj) return
  activeObj.set(key, value)
  canvas.requestRenderAll()
}

function applyScale(axis, px) {
  if (!activeObj) return
  if (axis === 'x') activeObj.set('scaleX', px / (activeObj.width || 1))
  else activeObj.set('scaleY', px / (activeObj.height || 1))
  canvas.requestRenderAll()
}

// ════════════════════════════════════════════════════════════════════════
// Object creation — Photo / Line / Rectangle / Icon
// ════════════════════════════════════════════════════════════════════════
function addRectangle() {
  const rect = new Rect({
    left: width.value / 2 - 70,
    top: height.value / 2 - 45,
    width: 140,
    height: 90,
    rx: 8,
    ry: 8,
    fill: '#ff8c42',
  })
  canvas.add(rect)
  canvas.setActiveObject(rect)
  canvas.requestRenderAll()
}

function addLine() {
  const cx = width.value / 2
  const cy = height.value / 2
  const line = new FabricLine([cx - 90, cy, cx + 90, cy], {
    stroke: '#1a1510',
    strokeWidth: 3,
  })
  canvas.add(line)
  canvas.setActiveObject(line)
  canvas.requestRenderAll()
}

function addIcon(icon) {
  const path = new Path(icon.d, {
    left: width.value / 2 - 24,
    top: height.value / 2 - 24,
    fill: icon.filled ? '#ff8c42' : 'transparent',
    stroke: icon.filled ? undefined : '#1a1510',
    strokeWidth: icon.filled ? 0 : 2,
    strokeLineJoin: 'round',
    strokeLineCap: 'round',
    scaleX: 2,
    scaleY: 2,
  })
  canvas.add(path)
  canvas.setActiveObject(path)
  canvas.requestRenderAll()
}

function onPhotoSelected(e) {
  const file = e.target?.files?.[0]
  e.target.value = ''
  if (!file) return

  const reader = new FileReader()
  reader.onload = async () => {
    const img = await FabricImage.fromURL(reader.result)
    const maxW = width.value * 0.8
    const maxH = height.value * 0.8
    const scale = Math.min(1, maxW / img.width, maxH / img.height)
    img.set({
      left: width.value / 2 - (img.width * scale) / 2,
      top: height.value / 2 - (img.height * scale) / 2,
      scaleX: scale,
      scaleY: scale,
    })
    canvas.add(img)
    canvas.setActiveObject(img)
    canvas.requestRenderAll()
  }
  reader.readAsDataURL(file)
}

// ════════════════════════════════════════════════════════════════════════
// Layer system
// ════════════════════════════════════════════════════════════════════════
function labelFor(type) {
  if (type === 'image') return 'Photo'
  if (type === 'line') return 'Line'
  if (type === 'rect') return 'Rectangle'
  if (type === 'path') return 'Icon'
  return type
}
function layerIcon(type) {
  if (type === 'image') return 'i-lucide-image'
  if (type === 'line') return 'i-lucide-minus'
  if (type === 'rect') return 'i-lucide-square'
  if (type === 'path') return 'i-lucide-shapes'
  return 'i-lucide-square'
}
function bumpLayers() { layersVersion.value++ }

const layers = computed(() => {
  layersVersion.value // eslint-disable-line no-unused-expressions -- establish reactive dependency
  if (!canvas) return []
  return [...canvas.getObjects()].reverse().map((obj) => {
    if (!obj.__ruid) obj.__ruid = `layer-${uidCounter++}`
    return {
      id: obj.__ruid,
      obj,
      type: obj.type,
      label: labelFor(obj.type),
      visible: obj.visible !== false,
      locked: !!obj.lockMovementX,
      active: obj === activeObj,
    }
  })
})

function selectLayer(layer) {
  canvas.setActiveObject(layer.obj)
  canvas.requestRenderAll()
}
function toggleVisible(layer) {
  layer.obj.visible = !layer.obj.visible
  canvas.requestRenderAll()
  bumpLayers()
}
function toggleLock(layer) {
  const next = !layer.obj.lockMovementX
  layer.obj.set({
    lockMovementX: next,
    lockMovementY: next,
    lockScalingX: next,
    lockScalingY: next,
    lockRotation: next,
    hasControls: !next,
  })
  canvas.requestRenderAll()
  bumpLayers()
}

// ════════════════════════════════════════════════════════════════════════
// Ordering / duplicate / delete
// ════════════════════════════════════════════════════════════════════════
function orderOp(op) {
  if (!activeObj) return
  if (op === 'front') canvas.bringObjectToFront(activeObj)
  else if (op === 'forward') canvas.bringObjectForward(activeObj)
  else if (op === 'backward') canvas.sendObjectBackwards(activeObj)
  else if (op === 'back') canvas.sendObjectToBack(activeObj)
  canvas.requestRenderAll()
  bumpLayers()
}

function duplicateSelected() {
  if (!activeObj) return
  activeObj.clone().then((clone) => {
    clone.set({ left: activeObj.left + 24, top: activeObj.top + 24 })
    canvas.add(clone)
    canvas.setActiveObject(clone)
    canvas.requestRenderAll()
  })
}

function deleteSelected() {
  if (!activeObj) return
  canvas.remove(activeObj)
  activeObj = null
  selected.value = false
  canvas.requestRenderAll()
}

// ════════════════════════════════════════════════════════════════════════
// Snap guidelines — center + edge alignment against siblings and the canvas
// ════════════════════════════════════════════════════════════════════════
function clearGuides() {
  guideLines.forEach(l => canvas.remove(l))
  guideLines = []
}

function drawGuide(orientation, pos) {
  const line = orientation === 'v'
    ? new FabricLine([pos, 0, pos, height.value], { stroke: '#ff3366', strokeWidth: 1, strokeDashArray: [4, 4], selectable: false, evented: false, excludeFromExport: true })
    : new FabricLine([0, pos, width.value, pos], { stroke: '#ff3366', strokeWidth: 1, strokeDashArray: [4, 4], selectable: false, evented: false, excludeFromExport: true })
  canvas.add(line)
  canvas.bringObjectToFront(line)
  guideLines.push(line)
}

function handleSnapping(e) {
  clearGuides()
  if (!snapEnabled.value) return

  const obj = e.target
  const centerX = width.value / 2
  const centerY = height.value / 2
  const objCenter = obj.getCenterPoint()
  const objBounds = obj.getBoundingRect()

  let snappedX = null
  let snappedY = null

  if (Math.abs(objCenter.x - centerX) < SNAP_THRESHOLD) { snappedX = centerX; drawGuide('v', centerX) }
  if (Math.abs(objCenter.y - centerY) < SNAP_THRESHOLD) { snappedY = centerY; drawGuide('h', centerY) }

  for (const target of canvas.getObjects()) {
    if (target === obj || guideLines.includes(target)) continue
    const tCenter = target.getCenterPoint()
    const tBounds = target.getBoundingRect()

    if (snappedX === null) {
      if (Math.abs(objCenter.x - tCenter.x) < SNAP_THRESHOLD) { snappedX = tCenter.x; drawGuide('v', tCenter.x) }
      else if (Math.abs(objBounds.left - tBounds.left) < SNAP_THRESHOLD) { snappedX = tBounds.left + (objCenter.x - objBounds.left); drawGuide('v', tBounds.left) }
      else if (Math.abs((objBounds.left + objBounds.width) - (tBounds.left + tBounds.width)) < SNAP_THRESHOLD) {
        const edge = tBounds.left + tBounds.width
        snappedX = edge - ((objBounds.left + objBounds.width) - objCenter.x)
        drawGuide('v', edge)
      }
    }

    if (snappedY === null) {
      if (Math.abs(objCenter.y - tCenter.y) < SNAP_THRESHOLD) { snappedY = tCenter.y; drawGuide('h', tCenter.y) }
      else if (Math.abs(objBounds.top - tBounds.top) < SNAP_THRESHOLD) { snappedY = tBounds.top + (objCenter.y - objBounds.top); drawGuide('h', tBounds.top) }
      else if (Math.abs((objBounds.top + objBounds.height) - (tBounds.top + tBounds.height)) < SNAP_THRESHOLD) {
        const edge = tBounds.top + tBounds.height
        snappedY = edge - ((objBounds.top + objBounds.height) - objCenter.y)
        drawGuide('h', edge)
      }
    }
  }

  if (snappedX !== null) obj.set('left', obj.left + (snappedX - objCenter.x))
  if (snappedY !== null) obj.set('top', obj.top + (snappedY - objCenter.y))
}

// ════════════════════════════════════════════════════════════════════════
// Save — flatten to PNG + keep the editable JSON design
// ════════════════════════════════════════════════════════════════════════
function save() {
  clearGuides()
  canvas.discardActiveObject()
  canvas.requestRenderAll()

  const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 2 })
  const json = JSON.stringify(canvas.toJSON())
  emits('save', { dataUrl, json, width: width.value, height: height.value })
}
</script>

<style scoped>
.r-canvas {
  --ui-primary: var(--c-accent);
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 520px;
  background: var(--c-surface);
  color: var(--c-text);
  border-radius: 0.75rem;
  overflow: hidden;
}

/* ─── Toolbar ────────────────────────────────────────────────────────────── */
.r-canvas__toolbar {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.625rem 0.875rem;
  border-bottom: 1px solid var(--c-border);
  background: var(--c-surface);
  overflow-x: auto;
}

.r-canvas__tool-group {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.r-canvas__sep {
  width: 1px;
  align-self: stretch;
  background: var(--c-border);
  margin: 0 0.25rem;
}

.r-canvas__spacer { flex: 1 1 auto; }

.r-canvas__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.4rem 0.625rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--c-text);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 0.5rem;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.12s, border-color 0.12s, color 0.12s;
}
.r-canvas__btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--c-accent) 10%, transparent);
  border-color: var(--c-border);
}
.r-canvas__btn.is-active {
  background: var(--c-accent);
  border-color: var(--c-accent);
  color: #fff;
}
.r-canvas__btn:disabled { opacity: 0.4; cursor: not-allowed; }
.r-canvas__btn--icon { padding: 0.4rem; }
.r-canvas__btn--ghost { color: var(--c-muted); }
.r-canvas__btn--danger:hover:not(:disabled) { background: color-mix(in srgb, var(--c-danger) 12%, transparent); color: var(--c-danger); }
.r-canvas__btn--primary {
  background: var(--c-accent);
  border-color: var(--c-accent);
  color: #fff;
}
.r-canvas__btn--primary:hover { filter: brightness(1.05); }

.r-canvas__hidden-input {
  position: absolute;
  width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0;
}

/* ─── Icon popover ───────────────────────────────────────────────────────── */
.r-canvas__popover-wrap { position: relative; }
.r-canvas__icon-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 30;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.25rem;
  padding: 0.5rem;
  width: 176px;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 0.625rem;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}
.r-canvas__icon-option {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid transparent;
  border-radius: 0.5rem;
  background: transparent;
  color: var(--c-text);
  cursor: pointer;
}
.r-canvas__icon-option:hover {
  background: color-mix(in srgb, var(--c-accent) 10%, transparent);
  border-color: var(--c-border);
}

/* ─── Body ───────────────────────────────────────────────────────────────── */
.r-canvas__body {
  flex: 1 1 auto;
  display: flex;
  min-height: 0;
}

.r-canvas__stage-wrap {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  overflow: auto;
  background: repeating-conic-gradient(var(--bg-tertiary) 0% 25%, var(--c-surface) 0% 50%) 50% / 20px 20px;
}

.r-canvas__stage {
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
  border-radius: 0.5rem;
  overflow: hidden;
  background: #fff;
  flex-shrink: 0;
}

/* ─── Sidebar ────────────────────────────────────────────────────────────── */
.r-canvas__sidebar {
  width: 260px;
  flex-shrink: 0;
  border-left: 1px solid var(--c-border);
  overflow-y: auto;
  background: var(--c-surface);
}

.r-canvas__panel {
  padding: 0.875rem;
  border-bottom: 1px solid var(--c-border);
}
.r-canvas__panel-title {
  margin: 0 0 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--c-muted);
}

.r-canvas__empty {
  font-size: 0.8125rem;
  color: var(--c-muted);
  padding: 0.5rem 0;
}

.r-canvas__layer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
}
.r-canvas__layer:hover { background: var(--bg-tertiary); }
.r-canvas__layer.is-active { background: color-mix(in srgb, var(--c-accent) 14%, transparent); }
.r-canvas__layer-icon { color: var(--c-muted); flex-shrink: 0; }
.r-canvas__layer-name {
  flex: 1 1 auto;
  font-size: 0.8125rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.r-canvas__layer-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  color: var(--c-muted);
  border-radius: 0.375rem;
  cursor: pointer;
}
.r-canvas__layer-btn:hover { color: var(--c-accent); background: color-mix(in srgb, var(--c-accent) 12%, transparent); }

/* ─── Properties ─────────────────────────────────────────────────────────── */
.r-canvas__prop-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.625rem;
}
.r-canvas__prop {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.6875rem;
  font-weight: 700;
  color: var(--c-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.r-canvas__prop input[type="number"] {
  width: 100%;
  padding: 0.35rem 0.5rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--c-text);
  background: var(--c-bg);
  border: 1px solid var(--c-border);
  border-radius: 0.375rem;
}
.r-canvas__prop--wide { grid-column: 1 / -1; }
.r-canvas__prop--wide input[type="range"] { width: 100%; }
.r-canvas__prop-value { font-size: 0.6875rem; color: var(--c-text); text-transform: none; }
.r-canvas__prop--color {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}
.r-canvas__prop--color input[type="color"] {
  width: 32px;
  height: 24px;
  padding: 0;
  border: 1px solid var(--c-border);
  border-radius: 0.25rem;
  background: none;
}
</style>
