<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import RDialog from '../RDialog.vue'
import RModal from '../RModal.vue'
import RSlider from '../RSlider.vue'
import FloatingInput from '../input/FloatingInput.vue'
import RVisualEditorRawEditor from './RVisualEditorRawEditor.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  initialImage: { type: String, default: '' },
  document: { type: [Object, String], default: null },
  title: { type: String, default: 'Design builder' },
  saveLabel: { type: String, default: 'Apply' },
  mediaItems: { type: Array, default: () => [] },
  mediaLoading: { type: Boolean, default: false },
  uploadHandler: { type: Function, default: null },
})

const emit = defineEmits(['update:modelValue', 'save', 'cancel'])

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})

const docVersion = ref(0)
const confirmOpen = ref(false)
const discardOpen = ref(false)
const dirty = ref(false)
const pendingSave = ref(null)
const fileName = ref('')
const previewUrl = ref('')
const fileNameInput = ref(null)
const canvasRef = ref(null)

watch(() => [props.document, props.initialImage], () => {
  docVersion.value += 1
  dirty.value = false
}, { immediate: true })

const canvasKey = computed(() => `${props.document ? 'doc' : 'image'}:${docVersion.value}`)

const canConfirm = computed(() => !!(pendingSave.value?.file || pendingSave.value?.blob))
const previewAlt = computed(() => fileName.value || 'Design preview')
const dimensions = computed(() => {
  const width = Math.round(Number(pendingSave.value?.width) || 0)
  const height = Math.round(Number(pendingSave.value?.height) || 0)
  return width > 0 && height > 0 ? `${width} × ${height} px` : '—'
})
const fileSize = computed(() => formatBytes(pendingSave.value?.file?.size ?? pendingSave.value?.blob?.size))

function formatBytes(value) {
  const size = Number(value)
  if (!Number.isFinite(size) || size <= 0) return '—'
  if (size < 1024) return `${Math.round(size)} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function clearPendingSave() {
  if (previewUrl.value) {
    try {
      URL.revokeObjectURL(previewUrl.value)
    }
    catch {
      /* ignore */
    }
  }
  previewUrl.value = ''
  pendingSave.value = null
  fileName.value = ''
}

function fileExtension(file) {
  const byType = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/avif': '.avif',
  }[file?.type]
  if (byType) return byType
  const match = String(file?.name || '').match(/(\.[a-z0-9]{1,8})$/i)
  return match?.[1]?.toLowerCase() || '.png'
}

function normalizeFileName(value, file) {
  const fallback = file?.name || 'design.png'
  const extension = fileExtension(file)
  const cleaned = String(value || '').trim().replace(/[\\/:*?"<>|]+/g, '-').slice(0, 120)
  const base = (cleaned || fallback.replace(/\.[^.]+$/, ''))
    .replace(/\.[a-z0-9]{1,8}$/i, '')
    .replace(/[. ]+$/, '')
  return `${base || 'design'}${extension}`
}

function onCanvasChange() {
  dirty.value = true
}

function onCanvasReady() {
  dirty.value = false
}

function onSave(payload) {
  if (!dirty.value) {
    emit('save', payload)
    return
  }
  clearPendingSave()
  pendingSave.value = payload
  fileName.value = payload?.file?.name || 'design.png'
  const source = payload?.blob ?? payload?.file
  if (source) {
    try {
      previewUrl.value = URL.createObjectURL(source)
    }
    catch {
      previewUrl.value = ''
    }
  }
  confirmOpen.value = true
}

function cancelConfirm() {
  confirmOpen.value = false
  clearPendingSave()
}

function confirmSave() {
  const payload = pendingSave.value
  if (!payload) return
  const source = payload.file ?? payload.blob
  if (!source) return
  const file = new File([source], normalizeFileName(fileName.value, payload.file), {
    type: payload.file?.type || payload.blob?.type || 'image/png',
    lastModified: Date.now(),
  })
  confirmOpen.value = false
  emit('save', { ...payload, file })
  clearPendingSave()
}

function performCancel() {
  confirmOpen.value = false
  discardOpen.value = false
  dirty.value = false
  clearPendingSave()
  emit('cancel')
  open.value = false
}

function requestCancel() {
  canvasRef.value?.getDocument?.()
  if (dirty.value) {
    discardOpen.value = true
    return
  }
  performCancel()
}

function focusFileNameInput() {
  const root = fileNameInput.value?.$el ?? fileNameInput.value
  const input = root?.querySelector?.('input') ?? root
  input?.focus()
  input?.select()
}

watch(confirmOpen, async (isOpen) => {
  if (!isOpen) {
    clearPendingSave()
    return
  }
  await nextTick()
  focusFileNameInput()
})

watch(open, (isOpen) => {
  if (!isOpen) {
    cancelConfirm()
    discardOpen.value = false
    dirty.value = false
    return
  }
  dirty.value = false
})

onBeforeUnmount(clearPendingSave)
</script>

<template>
  <RSlider
    v-model="open"
    :ui="{
      overlay: 'rv-design-builder-overlay',
      content: 'rv-design-builder-content',
      header: 'rv-design-builder-header',
      body: 'rv-design-builder-body',
    }"
    :fullscreen="true"
    :prevent-close="true"
  >
    <div class="rv-design-builder">
      <RVisualEditorRawEditor
        v-if="open"
        ref="canvasRef"
        :key="canvasKey"
        :document="document"
        :initial-image="initialImage"
        :title="title"
        :save-label="saveLabel"
        :media-items="mediaItems"
        :media-loading="mediaLoading"
        :upload-handler="uploadHandler"
        @change="onCanvasChange"
        @ready="onCanvasReady"
        @save="onSave"
        @cancel="requestCancel"
      />
    </div>
  </RSlider>

  <RModal
    v-model="confirmOpen"
    title="Save changes"
    description="Review the exported image before replacing the current one."
    icon="ri-image-line"
    modal-width="560px"
    :no-close="false"
    :ui="{ overlay: 'rv-save-dialog-overlay', content: 'rv-save-dialog-content' }"
  >
    <div
      v-if="pendingSave"
      class="rv-save-dialog"
    >
      <div class="rv-save-dialog__preview-wrap">
        <span class="rv-save-dialog__label">Preview</span>
        <div class="rv-save-dialog__preview">
          <img
            v-if="previewUrl"
            :src="previewUrl"
            :alt="previewAlt"
          >
          <span
            v-else
            class="rv-save-dialog__empty"
          >No preview</span>
        </div>
      </div>

      <div class="rv-save-dialog__meta">
        <div class="rv-save-dialog__section">
          <span class="rv-save-dialog__section-title">Image options</span>
          <FloatingInput
            ref="fileNameInput"
            v-model="fileName"
            class="rv-save-dialog__name"
            label="File name"
            @keydown.enter.prevent="confirmSave"
          />
        </div>

        <div class="rv-save-dialog__stats">
          <div class="rv-save-dialog__stat">
            <span>Dimensions</span>
            <strong>{{ dimensions }}</strong>
          </div>
          <div class="rv-save-dialog__stat">
            <span>File size</span>
            <strong>{{ fileSize }}</strong>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="rv-save-dialog__btn"
        @click="cancelConfirm"
      >
        Cancel
      </button>
      <button
        type="button"
        class="rv-save-dialog__btn rv-save-dialog__btn--primary"
        :disabled="!canConfirm"
        @click="confirmSave"
      >
        Save
      </button>
    </template>
  </RModal>

  <RDialog
    v-model:open="discardOpen"
    title="Discard changes?"
    description="You have unsaved changes. If you leave now, they will be lost."
    icon="ri-error-warning-line"
    tone="warning"
    size="sm"
    confirm-text="Discard changes"
    cancel-text="Keep editing"
    :dismissible="false"
    :show-close="false"
    close-on-confirm
    :ui="{ overlay: 'rv-discard-dialog-overlay', content: 'rv-discard-dialog-content' }"
    @confirm="performCancel"
  />
</template>

<style lang="scss" scoped>
.rv-design-builder {
  display: flex;
  flex: 1 1 auto;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--bg-content);

  :deep(.rc) {
    flex: 1 1 auto;
    min-height: 0;
  }
}

.rv-save-dialog {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 18px;
  padding: 4px 0 8px;

  &__preview-wrap,
  &__meta {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }

  &__label,
  &__stat > span {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: var(--c-muted);
    text-transform: uppercase;
  }

  &__preview {
    display: grid;
    place-items: center;
    min-height: 170px;
    padding: 10px;
    overflow: hidden;
    background: var(--bg-tertiary, #f3f4f6);
    border: 1px solid var(--c-border);
    border-radius: var(--r-lg, 12px);

    img {
      display: block;
      max-width: 100%;
      max-height: 240px;
      object-fit: contain;
      border-radius: calc(var(--r-lg, 12px) - 4px);
    }
  }

  &__empty {
    font-size: 0.78rem;
    color: var(--c-muted);
  }

  &__meta {
    gap: 14px;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__section-title {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--c-text);
  }

  &__name {
    --color-bg: var(--bg-wrapper, var(--c-surface));
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  &__stat {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    padding: 10px 12px;
    background: var(--bg-tertiary, #f3f4f6);
    border: 1px solid var(--c-border);
    border-radius: 8px;

    strong {
      overflow: hidden;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--c-text);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 84px;
    height: 36px;
    padding: 0 16px;
    font: inherit;
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--c-text);
    background: transparent;
    border: 1px solid var(--c-border);
    border-radius: 8px;
    cursor: pointer;

    &:hover:not(:disabled) {
      border-color: var(--c-accent);
      color: var(--c-accent);
    }

    &--primary {
      color: #fff;
      background: var(--c-accent);
      border-color: var(--c-accent);
    }

    &--primary:hover:not(:disabled) {
      color: #fff;
      background: color-mix(in srgb, var(--c-accent) 88%, #000);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

@media (max-width: 560px) {
  .rv-save-dialog {
    grid-template-columns: 1fr;

    &__preview img {
      max-height: 190px;
    }
  }
}
</style>

<style lang="scss">
.rv-design-builder-overlay {
  z-index: 10000 !important;
}
.rv-design-builder-content {
  z-index: 10001 !important;
  margin: 0 !important;
}
.rv-design-builder-header {
  display: none !important;
}
.rv-design-builder-body .rs-body {
  padding: 0 !important;
  overflow: hidden !important;
  scrollbar-gutter: auto !important;
}
.rv-save-dialog-overlay {
  z-index: 10100 !important;
}
.rv-save-dialog-content {
  z-index: 10101 !important;
}
.rv-discard-dialog-overlay {
  z-index: 10200 !important;
}
.rv-discard-dialog-content {
  z-index: 10201 !important;
}
</style>
