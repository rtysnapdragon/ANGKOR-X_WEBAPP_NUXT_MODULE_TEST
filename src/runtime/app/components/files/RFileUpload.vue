<script setup>
// RFileUpload — SARIKA
// Wraps NuxtUI v4.8.2 <UFileUpload>, keeping its real props/slots/emits/expose
// intact, and layering SARIKA extras on top:
//   - client-side maxSize / maxFiles validation (UFileUpload has neither natively)
//   - dimension guards (min/max width & height) for images
//   - optional frontend compression
//   - optional Upwork-style circular avatar cropper (zoom + drag-to-pan)
//   - per-file progress / retry / remove-all
//   - bilingual (EN/KM) labels
//
// Fixed vs. the previous draft:
//   • no more fake `max-size` / `max-files` props passed to UFileUpload — it
//     doesn't have them, they were silently ignored before.
//   • `@change` now matches NuxtUI's real contract: a native DOM Event, not
//     a File[] — we no longer misread it as a file list.
//   • modelValue is now genuinely the source of truth: validation happens
//     BEFORE we emit update:modelValue, so UFileUpload's own displayed
//     value can never drift out of sync with ours.
//   • flow order fixed: crop now happens BEFORE compression (crop defines
//     final pixels, compression should act on the cropped result — the old
//     order compressed first then discarded that work on crop-save).
//   • single-file mode (`multiple: false`) now sends a bare File to
//     UFileUpload instead of always forcing an array, matching its typed
//     contract (`M extends true ? File[] : File`).
// No lang="ts" — plain <script setup>

import { ref, computed, watch, nextTick, useTemplateRef, defineExpose } from 'vue'
import { useI18n } from 'vue-i18n'

// ── Props ─────────────────────────────────────────────────────────────────
const props = defineProps({
  // ── UFileUpload passthrough (real v4.8.2 API) ────────
  modelValue:   { type: [Array, Object, File], default: () => [] }, // always File[] on our side
  multiple:     { type: Boolean, default: false },
  accept:       { type: String,  default: null  },
  label:        { type: String,  default: 'Drop files here' },
  description:  { type: String,  default: null  },
  icon:         { type: [String, Boolean], default: 'i-lucide-upload-cloud' },
  color:        { type: String,  default: 'primary' },   // primary|secondary|success|info|warning|error|neutral
  variant:      { type: String,  default: 'area' },       // 'area' | 'button' (button only when multiple=false)
  size:         { type: String,  default: 'md' },         // xs|sm|md|lg|xl
  layout:       { type: String,  default: 'grid' },        // 'grid'|'list' — only applies when variant="area"
  position:     { type: String,  default: 'outside' },     // 'inside'|'outside' — only when layout="list"
  dropzone:     { type: Boolean, default: true  },
  interactive:  { type: Boolean, default: true  },
  highlight:    { type: Boolean, default: false },
  reset:        { type: Boolean, default: false },
  required:     { type: Boolean, default: false },
  disabled:     { type: Boolean, default: false },
  preview:      { type: Boolean, default: true  },
  fileImage:    { type: Boolean, default: true  },
  ui:           { type: Object,  default: () => ({}) },

  // ── SARIKA extras (validation UFileUpload doesn't natively do) ─────────
  maxSize:      { type: Number,  default: null  },          // bytes, enforced client-side
  maxFiles:     { type: Number,  default: null  },          // enforced client-side

  // Dimension limits (images only)
  maxWidth:     { type: Number,  default: null  },          // px
  maxHeight:    { type: Number,  default: null  },
  minWidth:     { type: Number,  default: null  },
  minHeight:    { type: Number,  default: null  },

  // Compression (runs AFTER crop, on the cropped result if cropping is on)
  compress:        { type: Boolean, default: false },
  compressQuality: { type: Number,  default: 0.82 },        // 0–1
  compressMaxPx:   { type: Number,  default: 1920 },        // longest edge

  // Crop — Upwork-style circular avatar cropper (zoom + drag)
  crop:         { type: Boolean, default: false },
  cropShape:    { type: String,  default: 'circle' },        // 'circle' | 'square'
  cropSize:     { type: Number,  default: 320  },            // display diameter, px
  cropOutputPx: { type: Number,  default: 512  },            // exported image size, px
  cropMaxZoom:  { type: Number,  default: 3    },

  // Upload handler — async (file, onProgress) => void
  uploadFn:     { type: Function, default: null },

  // Labels bilingual
  labelKm:       { type: String, default: null },
  descriptionKm: { type: String, default: null },
})

const emit = defineEmits([
  // ── Matches real UFileUpload emits ──────────────
  'update:modelValue',
  'change',            // native DOM Event, passthrough from UFileUpload

  // ── SARIKA extras ────────────────────────────────
  'add',               // File
  'remove',            // File
  'clear',             // all removed
  'error',             // { file, message, type: 'size'|'count'|'dimension'|'compress'|'upload' }
  'upload-start',      // { file }
  'upload-progress',   // { file, percent }
  'upload-success',    // { file }
  'upload-error',      // { file, error }
  'upload-complete',   // all done
  'crop-open',         // { file }
  'crop-save',         // { original, cropped }
  'crop-cancel',       // { file }
  'compress-done',     // { original, compressed }
])

const { locale } = useI18n()

// ── Ref to the real UFileUpload — expose its own inputRef/dropzoneRef too ──
const fuRef = useTemplateRef('fuRef')

// ── File entry state ───────────────────────────────────────────────────────
// Each entry: { id, file, preview, status, progress, error, compressed, cropped, dimError }
const entries = ref([])
let _nextId = 1

function makeEntry(file) {
  return {
    id:         _nextId++,
    file,
    preview:    file.type?.startsWith('image/') ? URL.createObjectURL(file) : null,
    status:     'idle',   // idle | validating | compressing | uploading | success | error
    progress:   0,
    error:      null,
    compressed: null,
    cropped:    null,
    dimError:   null,
  }
}

function fmtBytes(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ── Warnings strip ──────────────────────────────────────────────────────────
const globalWarnings = ref([])
function addWarning(msg) {
  const id = _nextId++
  globalWarnings.value.push({ id, msg })
  setTimeout(() => {
    globalWarnings.value = globalWarnings.value.filter(w => w.id !== id)
  }, 5000)
}

// ── Normalizing helpers: our side is always File[], UFileUpload's side
//    depends on `multiple` ─────────────────────────────────────────────────
function toArray(payload) {
  if (!payload) return []
  return Array.isArray(payload) ? payload : [payload]
}

// Value handed DOWN to the real UFileUpload
const childModelValue = computed(() => {
  const arr = toArray(props.modelValue)
  return props.multiple ? arr : (arr[0] ?? null)
})

// ── Validation ──────────────────────────────────────────────────────────────
function validateFile(file, countSoFar) {
  if (props.maxFiles && countSoFar >= props.maxFiles) {
    return { type: 'count', message: locale.value === 'km'
      ? `អតិបរមា ${props.maxFiles} ឯកសារ`
      : `Maximum ${props.maxFiles} file${props.maxFiles > 1 ? 's' : ''} allowed` }
  }
  if (props.maxSize && file.size > props.maxSize) {
    return { type: 'size', message: locale.value === 'km'
      ? `ឯកសារធំពេក (អតិបរមា ${fmtBytes(props.maxSize)})`
      : `File too large — max ${fmtBytes(props.maxSize)}` }
  }
  return null
}

// ── Child → us: real UFileUpload update:modelValue handler ─────────────────
// This is the single point where validation happens BEFORE anything is
// accepted into our (authoritative) modelValue.
function onChildUpdate(payload) {
  const incoming = toArray(payload)
  const previous = toArray(props.modelValue)

  const kept  = incoming.filter(f => previous.includes(f))
  const added = incoming.filter(f => !previous.includes(f))

  const accepted = [...kept]

  for (const file of added) {
    const invalid = validateFile(file, accepted.length)
    if (invalid) {
      addWarning(invalid.message)
      emit('error', { file, message: invalid.message, type: invalid.type })
      continue
    }
    accepted.push(file)
    emit('add', file)
  }

  emit('update:modelValue', accepted)
}

// Native change event — passthrough, matches real UFileUpload contract
function onChildChange(evt) {
  emit('change', evt)
}

// ── Sync entries[] whenever the authoritative modelValue settles ───────────
watch(() => props.modelValue, (val) => {
  const files = toArray(val)

  files.forEach(f => {
    if (!entries.value.find(e => e.file === f)) {
      const entry = makeEntry(f)
      entries.value.push(entry)
      initEntry(entry)
    }
  })

  entries.value = entries.value.filter(e => files.includes(e.file))
}, { immediate: true })

// ── Init entry: dimension check → crop (if on) → compress → upload ─────────
async function initEntry(entry) {
  const file = entry.file
  const isImage = file.type?.startsWith('image/')

  // ── Dimension check
  if (isImage && (props.maxWidth || props.maxHeight || props.minWidth || props.minHeight)) {
    entry.status = 'validating'
    const dims = await getImageDimensions(file).catch(() => null)
    if (dims) {
      const errs = []
      if (props.maxWidth  && dims.w > props.maxWidth)  errs.push(`max width ${props.maxWidth}px (got ${dims.w}px)`)
      if (props.maxHeight && dims.h > props.maxHeight) errs.push(`max height ${props.maxHeight}px (got ${dims.h}px)`)
      if (props.minWidth  && dims.w < props.minWidth)  errs.push(`min width ${props.minWidth}px (got ${dims.w}px)`)
      if (props.minHeight && dims.h < props.minHeight) errs.push(`min height ${props.minHeight}px (got ${dims.h}px)`)
      if (errs.length) {
        entry.dimError = errs.join(' · ')
        entry.status   = 'error'
        entry.error    = entry.dimError
        emit('error', { file, message: entry.dimError, type: 'dimension' })
        return
      }
    }
    entry.status = 'idle'
  }

  // ── Crop (pauses flow until user saves; compress+upload continue in saveCrop)
  if (props.crop && isImage) {
    openCrop(entry)
    return
  }

  // ── Compress (no crop step)
  if (props.compress && isImage && file.type !== 'image/gif') {
    await runCompress(entry, file)
  }

  // ── Upload
  if (props.uploadFn) {
    await uploadEntry(entry)
  }
}

async function runCompress(entry, sourceFile) {
  entry.status = 'compressing'
  try {
    const compressed = await compressImage(sourceFile, props.compressQuality, props.compressMaxPx)
    entry.compressed = compressed
    emit('compress-done', { original: sourceFile, compressed })
  } catch (e) {
    emit('error', { file: entry.file, message: e?.message ?? 'Compression failed', type: 'compress' })
  }
  entry.status = 'idle'
}

// ── Image helpers ─────────────────────────────────────────────────────────
function getImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => { URL.revokeObjectURL(url); resolve({ w: img.naturalWidth, h: img.naturalHeight }) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image load failed')) }
    img.src = url
  })
}

async function compressImage(file, quality, maxPx) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      let { naturalWidth: w, naturalHeight: h } = img
      const ratio = Math.min(maxPx / w, maxPx / h, 1)
      w = Math.round(w * ratio)
      h = Math.round(h * ratio)
      const canvas = document.createElement('canvas')
      canvas.width  = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      canvas.toBlob(
        blob => {
          URL.revokeObjectURL(url)
          if (!blob) { reject(new Error('Compress failed')); return }
          resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }))
        },
        'image/jpeg',
        quality
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image load failed')) }
    img.src = url
  })
}

// ── Upload per entry ──────────────────────────────────────────────────────
async function uploadEntry(entry) {
  if (!props.uploadFn) return
  const fileToUpload = entry.cropped ?? entry.compressed ?? entry.file
  entry.status   = 'uploading'
  entry.progress = 0
  entry.error    = null
  emit('upload-start', { file: fileToUpload })

  try {
    await props.uploadFn(fileToUpload, (pct) => {
      entry.progress = Math.min(pct, 99)
      emit('upload-progress', { file: fileToUpload, percent: pct })
    })
    entry.progress = 100
    entry.status   = 'success'
    emit('upload-success', { file: fileToUpload })
  } catch (err) {
    entry.status = 'error'
    entry.error  = err?.message ?? 'Upload failed'
    emit('upload-error', { file: fileToUpload, error: err })
    emit('error', { file: fileToUpload, message: entry.error, type: 'upload' })
  }

  const stillUploading = entries.value.some(e => e.status === 'uploading')
  if (!stillUploading) emit('upload-complete')
}

async function retryEntry(entry) {
  await uploadEntry(entry)
}
async function retryAll() {
  for (const e of entries.value.filter(e => e.status === 'error')) {
    await retryEntry(e)
  }
}

const hasAnyError   = computed(() => entries.value.some(e => e.status === 'error'))
const successCount  = computed(() => entries.value.filter(e => e.status === 'success').length)

// ── Remove ────────────────────────────────────────────────────────────────
function removeEntry(entry) {
  const idx = entries.value.indexOf(entry)
  if (idx !== -1) entries.value.splice(idx, 1)
  if (entry.preview) URL.revokeObjectURL(entry.preview)
  const newFiles = entries.value.map(e => e.file)
  emit('update:modelValue', newFiles)
  emit('remove', entry.file)
}

function removeAll() {
  entries.value.forEach(e => { if (e.preview) URL.revokeObjectURL(e.preview) })
  entries.value = []
  emit('update:modelValue', props.multiple ? [] : [])
  emit('clear')
}

function fmtName(name, max = 28) {
  if (!name) return ''
  if (name.length <= max) return name
  const ext  = name.includes('.') ? name.split('.').pop() : ''
  const base = name.slice(0, max - ext.length - 4)
  return `${base}…${ext ? `.${ext}` : ''}`
}

// ── Crop popup — Upwork-style circular cropper (zoom + drag-to-pan) ───────
const cropEntry  = ref(null)
const cropOpen   = ref(false)
const cropImgEl  = useTemplateRef('cropImgRef')
const cropNatural = ref({ w: 0, h: 0 })
const zoom       = ref(1)
const pan        = ref({ x: 0, y: 0 })
const dragging   = ref(false)
const dragStart  = ref({ x: 0, y: 0, panX: 0, panY: 0 })

function openCrop(entry) {
  cropEntry.value = entry
  cropOpen.value  = true
  zoom.value = 1
  pan.value  = { x: 0, y: 0 }
  emit('crop-open', { file: entry.file })
}

function onCropImgLoad(e) {
  cropNatural.value = { w: e.target.naturalWidth, h: e.target.naturalHeight }
}

const baseScale = computed(() => {
  const { w, h } = cropNatural.value
  if (!w || !h) return 1
  return Math.max(props.cropSize / w, props.cropSize / h)
})
const scale = computed(() => baseScale.value * zoom.value)
const displayedSize = computed(() => ({
  w: cropNatural.value.w * scale.value,
  h: cropNatural.value.h * scale.value,
}))
const panLimits = computed(() => ({
  x: Math.max(0, (displayedSize.value.w - props.cropSize) / 2),
  y: Math.max(0, (displayedSize.value.h - props.cropSize) / 2),
}))

function clampPan() {
  const lim = panLimits.value
  pan.value.x = Math.min(lim.x, Math.max(-lim.x, pan.value.x))
  pan.value.y = Math.min(lim.y, Math.max(-lim.y, pan.value.y))
}

watch(zoom, () => nextTick(clampPan))

function onDragStart(e) {
  dragging.value = true
  const point = e.touches ? e.touches[0] : e
  dragStart.value = { x: point.clientX, y: point.clientY, panX: pan.value.x, panY: pan.value.y }
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', onDragEnd)
  window.addEventListener('touchmove', onDragMove, { passive: false })
  window.addEventListener('touchend', onDragEnd)
}
function onDragMove(e) {
  if (!dragging.value) return
  if (e.touches) e.preventDefault()
  const point = e.touches ? e.touches[0] : e
  pan.value.x = dragStart.value.panX + (point.clientX - dragStart.value.x)
  pan.value.y = dragStart.value.panY + (point.clientY - dragStart.value.y)
  clampPan()
}
function onDragEnd() {
  dragging.value = false
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragEnd)
  window.removeEventListener('touchmove', onDragMove)
  window.removeEventListener('touchend', onDragEnd)
}

function resetCrop() {
  zoom.value = 1
  pan.value  = { x: 0, y: 0 }
}

async function saveCrop() {
  const entry = cropEntry.value
  const img   = cropImgEl.value
  if (!entry || !img) return

  const out = props.cropOutputPx
  const s   = scale.value
  const imgLeft = (props.cropSize - displayedSize.value.w) / 2 + pan.value.x
  const imgTop  = (props.cropSize - displayedSize.value.h) / 2 + pan.value.y

  const sx = Math.max(0, -imgLeft / s)
  const sy = Math.max(0, -imgTop / s)
  const sSize = props.cropSize / s

  const canvas = document.createElement('canvas')
  canvas.width  = out
  canvas.height = out
  const ctx = canvas.getContext('2d')

  if (props.cropShape === 'circle') {
    ctx.beginPath()
    ctx.arc(out / 2, out / 2, out / 2, 0, Math.PI * 2)
    ctx.closePath()
    ctx.clip()
  }
  ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, out, out)

  const cropped = await new Promise(res =>
    canvas.toBlob(b => res(new File([b], entry.file.name, { type: 'image/png' })), 'image/png', 0.95)
  )

  entry.cropped = cropped
  if (entry.preview) URL.revokeObjectURL(entry.preview)
  entry.preview = URL.createObjectURL(cropped)
  cropOpen.value = false
  emit('crop-save', { original: entry.file, cropped })

  // continue the flow: compress the cropped result, then upload
  if (props.compress) {
    await runCompress(entry, cropped)
  }
  if (props.uploadFn) {
    await uploadEntry(entry)
  }
  cropEntry.value = null
}

function deleteCropImage() {
  const entry = cropEntry.value
  cropOpen.value = false
  if (entry) {
    emit('crop-cancel', { file: entry.file })
    removeEntry(entry)
  }
  cropEntry.value = null
}

function cancelCrop() {
  // Cancel keeps the file but drops the crop step — falls through to
  // compress/upload with the original image, matching "correct flow"
  // (cancelling a crop shouldn't silently discard the selected file).
  const entry = cropEntry.value
  cropOpen.value = false
  cropEntry.value = null
  if (!entry) return
  emit('crop-cancel', { file: entry.file })
  ;(async () => {
    if (props.compress && entry.file.type !== 'image/gif') {
      await runCompress(entry, entry.file)
    }
    if (props.uploadFn) await uploadEntry(entry)
  })()
}

// ── Merged NuxtUI :ui (SARIKA tokens layered over caller-provided overrides) ─
const mergedUi = computed(() => ({
  root:        'rfu__root',
  base:        'rfu__dropzone',
  icon:        'rfu__drop-icon',
  label:       'rfu__drop-label',
  description: 'rfu__drop-desc',
  actions:     'rfu__actions-area',
  files:       'rfu__files-area',
  ...props.ui,
}))

// ── Resolved bilingual labels ───────────────────────────────────────────────
const resolvedLabel = computed(() => (locale.value === 'km' && props.labelKm) ? props.labelKm : props.label)
const resolvedDesc  = computed(() => (locale.value === 'km' && props.descriptionKm) ? props.descriptionKm : props.description)

// ── Expose (mirrors UFileUpload's own expose + SARIKA extras) ─────────────
defineExpose({
  // real UFileUpload expose, forwarded
  inputRef:    computed(() => fuRef.value?.inputRef),
  dropzoneRef: computed(() => fuRef.value?.dropzoneRef),
  // convenience open()
  open:        () => fuRef.value?.inputRef?.value?.click?.(),
  // SARIKA extras
  clear:       removeAll,
  retry:       retryAll,
  retryFile:   retryEntry,
  entries,
  getUploadReady: () => entries.value.map(e => e.cropped ?? e.compressed ?? e.file),
})
</script>

<template>
  <div class="rfu-wrap">

    <!-- ══ Global warnings ══════════════════════════════ -->
    <TransitionGroup name="rfu-warn" tag="div" class="rfu-warnings">
      <div v-for="w in globalWarnings" :key="w.id" class="rfu-warnings__item">
        <i class="ri-error-warning-line" aria-hidden="true" />
        {{ w.msg }}
      </div>
    </TransitionGroup>

    <!-- ══ Real UFileUpload core ════════════════════════ -->
    <UFileUpload
      ref="fuRef"
      :model-value="childModelValue"
      :multiple="multiple"
      :accept="accept"
      :label="resolvedLabel"
      :description="resolvedDesc"
      :icon="icon"
      :color="color"
      :variant="variant"
      :size="size"
      :layout="layout"
      :position="position"
      :dropzone="dropzone"
      :interactive="interactive"
      :highlight="highlight"
      :reset="reset"
      :required="required"
      :disabled="disabled"
      :preview="preview"
      :file-image="fileImage"
      :ui="mergedUi"
      class="rfu"
      v-bind="$attrs"
      @update:model-value="onChildUpdate"
      @change="onChildChange"
    >
      <!-- ── #leading / #label / #description passthrough ── -->
      <template v-if="$slots.leading" #leading><slot name="leading" /></template>
      <template v-if="$slots.label" #label><slot name="label" /></template>
      <template v-if="$slots.description" #description><slot name="description" /></template>

      <!-- ── #actions ───────────────────────────────────── -->
      <template #actions="scope">
        <slot name="actions" v-bind="scope">
          <button type="button" class="rfu__action-btn" :disabled="disabled" @click="scope.open?.()">
            <i class="ri-upload-cloud-2-line" aria-hidden="true" />
            {{ locale === 'km' ? 'ជ្រើសរើសឯកសារ' : 'Select files' }}
          </button>
        </slot>
      </template>

      <!-- ── #files — full custom list ─────────────────── -->
      <template #files="scope">
        <slot name="files" v-bind="scope">
          <div v-if="entries.length" class="rfu__file-list">

            <div class="rfu__file-list-head">
              <span class="rfu__file-count">
                {{ entries.length }} {{ entries.length === 1 ? 'file' : 'files' }}
                <template v-if="maxFiles">/ {{ maxFiles }}</template>
                <template v-if="uploadFn">
                  · <span class="rfu__file-ok">{{ successCount }} done</span>
                </template>
              </span>

              <div class="rfu__file-list-actions">
                <button
                  v-if="hasAnyError && uploadFn"
                  type="button" class="rfu__icon-btn rfu__icon-btn--warn"
                  @click="retryAll"
                >
                  <i class="ri-refresh-line" aria-hidden="true" />
                  <span>{{ locale === 'km' ? 'ព្យាយាមទាំងអស់' : 'Retry all' }}</span>
                </button>

                <button type="button" class="rfu__icon-btn rfu__icon-btn--danger" @click="removeAll">
                  <i class="ri-delete-bin-2-line" aria-hidden="true" />
                  <span>{{ locale === 'km' ? 'លុបទាំងអស់' : 'Remove all' }}</span>
                </button>
              </div>
            </div>

            <TransitionGroup name="rfu-entry" tag="div" class="rfu__entries">
              <div
                v-for="entry in entries" :key="entry.id"
                :class="['rfu__entry', `rfu__entry--${entry.status}`]"
              >
                <div class="rfu__entry-thumb">
                  <img v-if="entry.preview" :src="entry.preview" :alt="entry.file.name" class="rfu__thumb-img" />
                  <span v-else class="rfu__thumb-icon"><i class="ri-file-line" aria-hidden="true" /></span>

                  <div
                    v-if="['uploading','success','error','compressing','validating'].includes(entry.status)"
                    class="rfu__thumb-status"
                  >
                    <i v-if="entry.status === 'success'" class="ri-checkbox-circle-fill rfu__status-ok" aria-hidden="true" />
                    <i v-else-if="entry.status === 'error'" class="ri-error-warning-fill rfu__status-err" aria-hidden="true" />
                    <i v-else class="ri-loader-4-line animate-spin rfu__status-spin" aria-hidden="true" />
                  </div>
                </div>

                <div class="rfu__entry-info">
                  <div class="rfu__entry-name" :title="entry.file.name">{{ fmtName(entry.file.name) }}</div>

                  <div class="rfu__entry-meta">
                    <span>{{ fmtBytes(entry.compressed?.size ?? entry.file.size) }}</span>
                    <span v-if="entry.compressed" class="rfu__compress-badge">
                      <i class="ri-arrow-down-line" aria-hidden="true" />
                      {{ Math.round((1 - entry.compressed.size / entry.file.size) * 100) }}%
                    </span>
                  </div>

                  <div v-if="entry.error" class="rfu__entry-error">
                    <i class="ri-error-warning-line" aria-hidden="true" />
                    {{ entry.error }}
                  </div>

                  <div v-if="entry.status === 'uploading' || entry.status === 'success'" class="rfu__progress-track">
                    <div
                      class="rfu__progress-fill"
                      :class="{ 'rfu__progress-fill--done': entry.status === 'success' }"
                      :style="{ width: entry.progress + '%' }"
                    />
                  </div>
                </div>

                <div class="rfu__entry-btns">
                  <button
                    v-if="crop && entry.file.type?.startsWith('image/') && entry.status !== 'uploading'"
                    type="button" class="rfu__btn-sm" title="Crop" @click="openCrop(entry)"
                  >
                    <i class="ri-crop-line" aria-hidden="true" />
                  </button>

                  <button
                    v-if="entry.status === 'error' && uploadFn"
                    type="button" class="rfu__btn-sm rfu__btn-sm--warn" title="Retry upload" @click="retryEntry(entry)"
                  >
                    <i class="ri-refresh-line" aria-hidden="true" />
                  </button>

                  <button
                    v-if="entry.status !== 'uploading'"
                    type="button" class="rfu__btn-sm rfu__btn-sm--danger" title="Remove file" @click="removeEntry(entry)"
                  >
                    <i class="ri-delete-bin-line" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </TransitionGroup>
          </div>
        </slot>
      </template>

      <!-- ── #files-top / #files-bottom ─────────────────── -->
      <template v-if="$slots['files-top']" #files-top="scope"><slot name="files-top" v-bind="scope" /></template>
      <template #files-bottom="scope"><slot name="files-bottom" v-bind="scope" /></template>

      <!-- ── per-file slots passthrough (only used if caller drops #files override) ── -->
      <template v-if="$slots.file" #file="scope"><slot name="file" v-bind="scope" /></template>
      <template v-if="$slots['file-leading']" #file-leading="scope"><slot name="file-leading" v-bind="scope" /></template>
      <template v-if="$slots['file-name']" #file-name="scope"><slot name="file-name" v-bind="scope" /></template>
      <template v-if="$slots['file-size']" #file-size="scope"><slot name="file-size" v-bind="scope" /></template>
      <template v-if="$slots['file-trailing']" #file-trailing="scope"><slot name="file-trailing" v-bind="scope" /></template>

      <!-- ── default slot (fully custom trigger, e.g. avatar-style) ── -->
      <template v-if="$slots.default" #default="scope"><slot v-bind="scope" /></template>
    </UFileUpload>

    <!-- ══ Crop popup — circular, Upwork-style zoom + drag ═════════════ -->
    <Transition name="rfu-modal">
      <div v-if="cropOpen" class="rfu-crop-overlay" @click.self="cancelCrop">
        <div class="rfu-crop-panel">

          <div class="rfu-crop-panel__head">
            <div class="rfu-crop-panel__title">
              {{ locale === 'km' ? 'រូបភាពរបស់អ្នក' : 'Your photo' }}
            </div>
            <button type="button" class="rfu-crop-panel__close" @click="cancelCrop">
              <i class="ri-close-line" aria-hidden="true" />
            </button>
          </div>

          <div class="rfu-crop-panel__body">
            <div
              class="rfu-crop-panel__stage"
              :style="{ width: cropSize + 'px', height: cropSize + 'px' }"
              @mousedown="onDragStart"
              @touchstart.passive="onDragStart"
            >
              <img
                v-if="cropEntry"
                ref="cropImgRef"
                :src="cropEntry.preview"
                class="rfu-crop-panel__img"
                :class="{ 'is-dragging': dragging }"
                :style="{
                  width: displayedSize.w + 'px',
                  height: displayedSize.h + 'px',
                  transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px)`
                }"
                draggable="false"
                @load="onCropImgLoad"
              />
              <div class="rfu-crop-panel__mask" :class="`rfu-crop-panel__mask--${cropShape}`" />
              <div class="rfu-crop-panel__move-hint">
                <i class="ri-drag-move-2-line" aria-hidden="true" /> {{ locale === 'km' ? 'ផ្លាស់ទី' : 'Move' }}
              </div>
            </div>

            <div class="rfu-crop-panel__zoom">
              <i class="ri-zoom-out-line" aria-hidden="true" />
              <input
                type="range" min="1" :max="cropMaxZoom" step="0.01"
                v-model.number="zoom"
              />
              <i class="ri-zoom-in-line" aria-hidden="true" />
              <button type="button" class="rfu-crop-panel__reset" title="Reset" @click="resetCrop">
                <i class="ri-restart-line" aria-hidden="true" />
              </button>
            </div>

            <button type="button" class="rfu-crop-panel__delete" @click="deleteCropImage">
              <i class="ri-delete-bin-line" aria-hidden="true" />
              {{ locale === 'km' ? 'លុបរូបភាពនេះ' : 'Delete current image' }}
            </button>
          </div>

          <div class="rfu-crop-panel__foot">
            <button type="button" class="rfu__icon-btn" @click="cancelCrop">
              {{ locale === 'km' ? 'បោះបង់' : 'Cancel' }}
            </button>
            <button type="button" class="rfu__icon-btn rfu__icon-btn--accent" @click="saveCrop">
              {{ locale === 'km' ? 'ភ្ជាប់រូបភាព' : 'Attach photo' }}
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
@mixin transition($speed: base) {
  @if      $speed == fast { transition: all 0.15s ease; }
  @else if $speed == slow { transition: all 0.35s ease; }
  @else                   { transition: all 0.2s  ease; }
}
@mixin flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}
@mixin truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rfu-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-3, 12px);
  font-family: var(--font-fallback, 'Inter', system-ui, sans-serif);
  position: relative;
}

// ── Warnings ────────────────────────────────────────────────────────────
.rfu-warnings {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &__item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    background: rgba(248, 113, 113, 0.1);
    border: 1px solid rgba(248, 113, 113, 0.25);
    border-radius: var(--radius-md, 10px);
    font-size: 0.78rem;
    color: var(--c-danger, #f87171);
    font-weight: 500;
    i { font-size: 1rem; flex-shrink: 0; }
  }
}
.rfu-warn-enter-active, .rfu-warn-leave-active { transition: all 0.2s ease; }
.rfu-warn-enter-from,  .rfu-warn-leave-to      { opacity: 0; transform: translateY(-6px); }

// ── Action button ───────────────────────────────────────────────────────
.rfu__action-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  border: 1px solid var(--c-border, rgba(255,140,66,0.16));
  border-radius: var(--radius-md, 10px);
  background: transparent;
  color: var(--c-text, #1a1510);
  font-size: 0.875rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  @include transition(fast);

  i { font-size: 1rem; color: var(--c-accent, #ff8c42); }

  &:hover {
    border-color: var(--c-accent, #ff8c42);
    color: var(--c-accent, #ff8c42);
    background: rgba(255, 140, 66, 0.06);
  }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

// ── File list ───────────────────────────────────────────────────────────
.rfu__file-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2, 8px);
  margin-top: var(--space-3, 12px);

  &-head { @include flex-between; padding: 0 var(--space-1, 4px); margin-bottom: var(--space-1, 4px); }
  &-actions { display: flex; align-items: center; gap: var(--space-2, 8px); }
}
.rfu__file-count { font-size: 0.75rem; color: var(--c-muted, #8a7f72); font-weight: 500; }
.rfu__file-ok { color: var(--c-success, #4ade80); font-weight: 600; }

.rfu__entries { display: flex; flex-direction: column; gap: 8px; }

.rfu__entry {
  display: flex;
  align-items: center;
  gap: var(--space-3, 12px);
  padding: var(--space-3, 12px);
  background: var(--glass-bg, rgba(255,255,255,0.72));
  border: 1px solid var(--c-border, rgba(255,140,66,0.16));
  border-radius: var(--radius-md, 10px);
  backdrop-filter: var(--glass-blur-sm, blur(12px) saturate(150%));
  -webkit-backdrop-filter: var(--glass-blur-sm, blur(12px) saturate(150%));
  @include transition;

  &--success { border-color: rgba(74, 222, 128, 0.3); }
  &--error   { border-color: rgba(248, 113, 113, 0.35); background: rgba(248,113,113,0.04); }
  &--uploading { border-color: rgba(255,140,66,0.3); }
  &--compressing, &--validating { opacity: 0.8; }
}
.rfu-entry-enter-active { transition: all 0.25s ease; }
.rfu-entry-leave-active { transition: all 0.2s ease; }
.rfu-entry-enter-from   { opacity: 0; transform: translateX(-10px); }
.rfu-entry-leave-to     { opacity: 0; transform: translateX(10px); max-height: 0; }

.rfu__entry-thumb {
  position: relative;
  width: 48px; height: 48px;
  flex-shrink: 0;
  border-radius: var(--radius-md, 10px);
  overflow: hidden;
  background: var(--bg-tertiary, #f1f3f6);
  @include flex-center;
}
.rfu__thumb-img { width: 100%; height: 100%; object-fit: cover; border-radius: inherit; }
.rfu__thumb-icon { font-size: 1.4rem; color: var(--c-muted, #8a7f72); i { display: flex; } }
.rfu__thumb-status {
  position: absolute; inset: 0;
  @include flex-center;
  background: rgba(0,0,0,0.35);
  border-radius: inherit;
}
.rfu__status-ok   { font-size: 1.3rem; color: var(--c-success, #4ade80); }
.rfu__status-err  { font-size: 1.3rem; color: var(--c-danger, #f87171); }
.rfu__status-spin { font-size: 1.3rem; color: var(--c-accent, #ff8c42); }

.rfu__entry-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.rfu__entry-name { font-size: 0.82rem; font-weight: 500; color: var(--c-text, #1a1510); @include truncate; }
.rfu__entry-meta { display: flex; align-items: center; gap: 8px; font-size: 0.72rem; color: var(--c-muted, #8a7f72); }
.rfu__compress-badge {
  display: inline-flex; align-items: center; gap: 2px;
  padding: 1px 6px;
  background: rgba(74, 222, 128, 0.12);
  color: var(--c-success, #4ade80);
  border-radius: var(--radius-full, 9999px);
  font-size: 0.68rem; font-weight: 700;
}
.rfu__entry-error {
  display: flex; align-items: center; gap: 4px;
  font-size: 0.72rem; color: var(--c-danger, #f87171); font-weight: 500;
  i { font-size: 0.85rem; }
}
.rfu__progress-track {
  height: 4px; background: var(--c-border, rgba(255,140,66,0.16));
  border-radius: 999px; overflow: hidden; margin-top: 2px;
}
.rfu__progress-fill {
  height: 100%; background: var(--c-accent, #ff8c42);
  border-radius: 999px; @include transition(slow);
  box-shadow: 0 0 8px rgba(255,140,66,0.4);
  &--done { background: var(--c-success, #4ade80); box-shadow: 0 0 8px rgba(74,222,128,0.4); }
}
.rfu__entry-btns { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.rfu__btn-sm {
  width: 28px; height: 28px;
  border: 1px solid var(--c-border, rgba(255,140,66,0.16));
  border-radius: var(--radius-sm, 6px);
  background: transparent;
  color: var(--c-muted, #8a7f72);
  cursor: pointer;
  @include flex-center; @include transition(fast);
  font-size: 0.9rem;
  &:hover { border-color: var(--c-accent, #ff8c42); color: var(--c-accent, #ff8c42); }
  &--warn:hover   { border-color: var(--color-yellow, #ffb347); color: var(--color-yellow, #ffb347); }
  &--danger:hover { border-color: var(--c-danger, #f87171); color: var(--c-danger, #f87171); }
}
.rfu__icon-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 12px;
  border: 1px solid var(--c-border, rgba(255,140,66,0.16));
  border-radius: var(--radius-md, 10px);
  background: transparent;
  color: var(--c-muted, #8a7f72);
  font-size: 0.75rem; font-weight: 500; font-family: inherit;
  cursor: pointer; @include transition(fast);
  i { font-size: 0.88rem; }
  &:hover { border-color: var(--c-accent, #ff8c42); color: var(--c-accent, #ff8c42); }
  &--warn:hover   { border-color: var(--color-yellow, #ffb347); color: var(--color-yellow, #ffb347); }
  &--danger { color: var(--c-muted); &:hover { border-color: var(--c-danger, #f87171); color: var(--c-danger, #f87171); } }
  &--accent {
    border-color: var(--c-accent, #ff8c42);
    background: var(--c-accent, #ff8c42);
    color: #fff;
    box-shadow: 0 0 16px rgba(255,140,66,0.25);
    &:hover { background: var(--c-accent-2, #ffb347); border-color: var(--c-accent-2, #ffb347); }
  }
}

// ── Crop modal (Upwork-style circular cropper) ─────────────────────────
.rfu-crop-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(8px);
  @include flex-center;
  padding: var(--space-4, 16px);
}
.rfu-crop-panel {
  width: min(420px, 100%);
  background: var(--glass-bg, rgba(255,255,255,0.95));
  backdrop-filter: var(--glass-blur, blur(24px) saturate(180%));
  -webkit-backdrop-filter: var(--glass-blur, blur(24px) saturate(180%));
  border: 1px solid var(--glass-border, rgba(255,140,66,0.16));
  border-radius: var(--radius-xl, 24px);
  box-shadow: var(--glass-shadow, 0 8px 32px rgba(0,0,0,0.08));
  overflow: hidden;
  display: flex; flex-direction: column;

  &__head {
    @include flex-between;
    padding: var(--space-4, 16px) var(--space-5, 20px);
    border-bottom: 1px solid var(--c-border, rgba(255,140,66,0.16));
  }
  &__title { font-size: 1.05rem; font-weight: 700; color: var(--c-text, #1a1510); }
  &__close {
    width: 32px; height: 32px;
    border: 1px solid var(--c-border, rgba(255,140,66,0.16));
    border-radius: var(--radius-md, 10px);
    background: transparent; color: var(--c-muted, #8a7f72);
    cursor: pointer; @include flex-center; @include transition(fast);
    font-size: 1rem;
    &:hover { border-color: var(--c-accent, #ff8c42); color: var(--c-accent, #ff8c42); }
  }

  &__body {
    display: flex; flex-direction: column; align-items: center; gap: var(--space-4, 16px);
    padding: var(--space-5, 20px);
  }

  &__stage {
    position: relative;
    border-radius: 50%;
    overflow: hidden;
    background: repeating-conic-gradient(#e5e5e5 0% 25%, #f2f2f2 0% 50%) 50% / 16px 16px;
    cursor: grab;
    touch-action: none;
    user-select: none;
    &:active { cursor: grabbing; }
  }
  &__img {
    position: absolute;
    top: 50%; left: 50%;
    max-width: none;
    pointer-events: none;
    will-change: transform;
  }
  &__mask {
    position: absolute; inset: 0;
    pointer-events: none;
    box-shadow: inset 0 0 0 2000px rgba(0,0,0,0); // placeholder, real ring below
    border: 2px solid rgba(255,255,255,0.9);
    border-radius: 50%;
  }
  &__move-hint {
    position: absolute;
    left: 50%; bottom: 12px; transform: translateX(-50%);
    display: flex; align-items: center; gap: 4px;
    padding: 4px 10px;
    background: rgba(0,0,0,0.55);
    color: #fff;
    font-size: 0.7rem; font-weight: 600;
    border-radius: var(--radius-full, 9999px);
    pointer-events: none;
  }

  &__zoom {
    display: flex; align-items: center; gap: 10px;
    width: 100%;
    color: var(--c-muted, #8a7f72);
    i { font-size: 1.1rem; flex-shrink: 0; }
    input[type="range"] {
      flex: 1;
      accent-color: var(--c-accent, #ff8c42);
    }
  }
  &__reset {
    width: 30px; height: 30px;
    border: 1px solid var(--c-border, rgba(255,140,66,0.16));
    border-radius: var(--radius-sm, 6px);
    background: transparent; color: var(--c-muted, #8a7f72);
    cursor: pointer; @include flex-center; @include transition(fast);
    &:hover { border-color: var(--c-accent, #ff8c42); color: var(--c-accent, #ff8c42); }
  }

  &__delete {
    display: inline-flex; align-items: center; gap: 6px;
    background: none; border: none;
    color: var(--c-danger, #f87171);
    font-size: 0.8rem; font-weight: 600;
    cursor: pointer; font-family: inherit;
    &:hover { text-decoration: underline; }
  }

  &__foot {
    @include flex-between;
    padding: var(--space-4, 16px) var(--space-5, 20px);
    border-top: 1px solid var(--c-border, rgba(255,140,66,0.16));
    background: rgba(0,0,0,0.02);
  }
}

.rfu-modal-enter-active { transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
.rfu-modal-leave-active { transition: all 0.18s ease; }
.rfu-modal-enter-from   { opacity: 0; transform: scale(0.95); }
.rfu-modal-leave-to     { opacity: 0; transform: scale(0.96); }
</style>

<!-- ─────────────────────────────────────────────────────────
     GLOBAL — SARIKA tokens over NuxtUI's own :ui slot classes
     (root/base/icon/label/description/actions/files map 1:1
     to the real FileUploadProps['ui'] keys)
────────────────────────────────────────────────────────── -->
<style lang="scss">
.rfu__root { width: 100%; font-family: var(--font-fallback, 'Inter', system-ui, sans-serif) !important; }

.rfu__dropzone {
  position: relative;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  padding: var(--space-8, 32px) var(--space-6, 24px) !important;
  border: 2px dashed var(--c-border, rgba(255,140,66,0.16)) !important;
  border-radius: var(--radius-xl, 24px) !important;
  background: var(--glass-bg, rgba(255,255,255,0.72)) !important;
  backdrop-filter: var(--glass-blur-sm, blur(12px) saturate(150%)) !important;
  -webkit-backdrop-filter: var(--glass-blur-sm, blur(12px) saturate(150%)) !important;
  box-shadow: var(--glass-shadow, 0 8px 32px rgba(0,0,0,0.08)) !important;
  gap: var(--space-3, 12px) !important;
  text-align: center !important;
  // @include transition;

  &[data-dragging="true"], &:focus-within {
    border-color: var(--c-accent, #ff8c42) !important;
    background: rgba(255, 140, 66, 0.04) !important;
    box-shadow: 0 0 40px rgba(255,140,66,0.12), var(--glass-shadow) !important;
  }
}

.rfu__drop-icon {
  font-size: 2.5rem !important;
  color: var(--c-accent, #ff8c42) !important;
  filter: drop-shadow(0 0 12px rgba(255,140,66,0.3)) !important;
  margin-bottom: var(--space-1, 4px) !important;
}
.rfu__drop-label {
  font-size: 1rem !important;
  font-weight: 600 !important;
  color: var(--c-text, #1a1510) !important;
}
.rfu__drop-desc {
  font-size: 0.78rem !important;
  color: var(--c-muted, #8a7f72) !important;
}
.rfu__actions-area { margin-top: var(--space-3, 12px) !important; }
.rfu__files-area { margin-top: var(--space-2, 8px) !important; }

.dark {
  .rfu__dropzone { background: rgba(19,19,26,0.72) !important; border-color: var(--c-border, rgba(255,140,66,0.12)) !important; }
  .rfu__entry { background: rgba(19,19,26,0.72) !important; }
  .rfu-crop-panel { background: rgba(19,19,26,0.95) !important; }
}
</style>