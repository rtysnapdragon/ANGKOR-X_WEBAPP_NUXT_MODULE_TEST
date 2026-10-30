<script setup lang="ts" generic="M extends boolean = false">
/**
 * RFileUpload
 * ---------------------------------------------------------------
 * Full custom re-implementation of NuxtUI v4.8.2 <UFileUpload>.
 *
 * Parity goals (see UFileUpload API):
 *  - All props          ✅ (icon/label/description/color/variant/size/
 *                            layout/position/highlight/accept/multiple/
 *                            reset/dropzone/interactive/required/disabled/
 *                            fileIcon/fileImage/fileDelete/fileDeleteIcon/
 *                            preview/ui/name/id/form*)
 *  - All slots          ✅ (default/leading/label/description/actions/
 *                            files/files-top/files-bottom/file/file-leading/
 *                            file-name/file-size/file-trailing)
 *  - All emits          ✅ (change / update:modelValue)
 *  - All exposes        ✅ (inputRef / dropzoneRef) + open()/removeFile()
 *                            passed through default/actions/files-bottom
 *                            slots exactly like UFileUpload.
 *
 * Additions beyond UFileUpload:
 *  - Per-file upload progress bar (via useRFileUpload + uploadHandler prop)
 *  - Retry single failed file, or retry all
 *  - Remove one-by-one or remove all
 *  - Validation warnings (max size / max files / image dimensions)
 *  - RBtn (Remixicon) everywhere instead of UButton/Lucide
 *  - Pure SCSS styling (SARIKA tokens), no Tailwind dependency
 * ---------------------------------------------------------------
 */
import { computed, ref, watch, useId, useAttrs } from 'vue'
import {
  useRFileUpload,
  formatBytes,
  type RUploadHandler,
  type RFileEntry
} from '../../composables/useRFileUpload'

type Color = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
type Variant = 'button' | 'area'
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type Layout = 'list' | 'grid'
type Position = 'inside' | 'outside'

interface FileDeleteConfig {
  color?: Color
  variant?: 'solid' | 'outline' | 'ghost' | 'soft' | 'link'
  size?: Size
}

interface RFileUploadUi {
  root?: string
  base?: string
  wrapper?: string
  icon?: string
  avatar?: string
  label?: string
  description?: string
  actions?: string
  files?: string
  file?: string
  fileLeadingAvatar?: string
  fileWrapper?: string
  fileName?: string
  fileSize?: string
  fileTrailingButton?: string
}

interface RFileUploadProps {
  as?: string
  id?: string
  name?: string
  /** Remixicon class. Set to false to hide. @default 'ri-upload-2-line' */
  icon?: string | false
  label?: string
  description?: string
  color?: Color
  /** 'button' variant only available when multiple is false */
  variant?: Variant
  size?: Size
  /** Only works when variant is 'area' @default 'grid' */
  layout?: Layout
  /** Only works when variant 'area' + layout 'list' @default 'outside' */
  position?: Position
  highlight?: boolean
  /** comma-separated MIME types or extensions @default '*' */
  accept?: string
  multiple?: M
  /** reset input when dialog opens @default false */
  reset?: boolean
  /** @default true */
  dropzone?: boolean
  /** @default true */
  interactive?: boolean
  required?: boolean
  disabled?: boolean
  /** Remixicon class for file icon */
  fileIcon?: string
  /** @default true */
  fileImage?: boolean
  /** @default true */
  fileDelete?: boolean | FileDeleteConfig
  fileDeleteIcon?: string
  /** @default true */
  preview?: boolean
  ui?: RFileUploadUi
  form?: string
  formaction?: string
  formenctype?: string
  formmethod?: string
  formnovalidate?: boolean
  formtarget?: string
  modelValue?: M extends true ? File[] : (File | null)

  /* ── RFileUpload additions (beyond UFileUpload) ── */
  /** Max size per file, in bytes */
  maxSize?: number
  /** Max number of files (multiple mode) */
  maxFiles?: number
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  /** Async function performing the real upload. Omit for select-only (no network) behavior. */
  uploadHandler?: RUploadHandler
  /** Show per-file progress bar while uploading */
  showProgress?: boolean
}

const props = withDefaults(defineProps<RFileUploadProps>(), {
  icon: 'ri-upload-2-line',
  color: 'primary',
  variant: 'area',
  size: 'md',
  layout: 'grid',
  position: 'outside',
  highlight: false,
  accept: '*',
  reset: false,
  dropzone: true,
  interactive: true,
  required: false,
  disabled: false,
  fileImage: true,
  fileDelete: true,
  preview: true,
  showProgress: true
})

const emit = defineEmits<{
  change: [event: Event]
  'update:modelValue': [value: M extends true ? File[] : (File | null)]
  /** fired when a file finishes successfully */
  success: [file: File]
  /** fired when a file fails */
  error: [file: File, message: string]
  /** fired when validation rejects a file (size/dimensions/count) */
  warning: [message: string, file?: File]
}>()

const attrs = useAttrs()

/* ────────────────── refs exposed like UFileUpload ────────────────── */
const inputRef = ref<HTMLInputElement | null>(null)
const dropzoneRef = ref<HTMLDivElement | null>(null)
const isDragging = ref(false)

const autoId = useId()
const inputId = computed(() => props.id ?? autoId)

/* ────────────────── upload engine ────────────────── */
const limits = computed(() => ({
  maxSize: props.maxSize,
  maxFiles: props.multiple ? props.maxFiles : 1,
  accept: props.accept,
  minDimensions: props.minWidth && props.minHeight ? { width: props.minWidth, height: props.minHeight } : undefined,
  maxDimensions: props.maxWidth && props.maxHeight ? { width: props.maxWidth, height: props.maxHeight } : undefined
}))

const {
  entries,
  isUploading,
  hasErrors,
  erroredEntries,
  addFiles: engineAddFiles,
  retryFile,
  retryAll,
  removeFile: engineRemoveFile,
  removeAll: engineRemoveAll
} = useRFileUpload({
  limits: limits.value,
  uploadHandler: props.uploadHandler,
  onWarning: (message, file) => emit('warning', message, file)
})

watch(entries, (list) => {
  list.forEach((e) => {
    if (e.status === 'success') emit('success', e.file)
    if (e.status === 'error' && e.error) emit('error', e.file, e.error)
  })
}, { deep: true })

/* keep modelValue in sync with entries (File-only, mirrors UFileUpload's value shape) */
function syncModelValue() {
  if (props.multiple) {
    emit('update:modelValue', entries.value.map(e => e.file) as any)
  } else {
    emit('update:modelValue', (entries.value[0]?.file ?? null) as any)
  }
}

watch(entries, syncModelValue, { deep: false })

/* seed from external modelValue (e.g. v-model reset to null/[]) */
watch(() => props.modelValue, (val) => {
  const incomingFiles: File[] = Array.isArray(val) ? val : (val ? [val] : [])
  const currentFiles = entries.value.map(e => e.file)
  const same = incomingFiles.length === currentFiles.length
    && incomingFiles.every((f, i) => f === currentFiles[i])
  if (same) return
  if (incomingFiles.length === 0) {
    engineRemoveAll()
  }
  // Adding files externally isn't a common UFileUpload use case; we only honor external clears.
})

/* ────────────────── open() / file selection ────────────────── */
function open() {
  if (props.disabled) return
  if (props.reset && inputRef.value) inputRef.value.value = ''
  inputRef.value?.click()
}

function onInputChange(e: Event) {
  emit('change', e)
  const target = e.target as HTMLInputElement
  void handleIncoming(target.files)
  // allow re-selecting the same file again later
  target.value = ''
}

async function handleIncoming(files: FileList | File[] | null) {
  if (!files) return
  if (!props.multiple && entries.value.length > 0) {
    engineRemoveAll()
  }
  await engineAddFiles(files)
}

/* ────────────────── dropzone ────────────────── */
function onDragOver(e: DragEvent) {
  if (!props.dropzone || props.disabled) return
  e.preventDefault()
  isDragging.value = true
}
function onDragLeave() {
  isDragging.value = false
}
async function onDrop(e: DragEvent) {
  if (!props.dropzone || props.disabled) return
  e.preventDefault()
  isDragging.value = false
  await handleIncoming(e.dataTransfer?.files ?? null)
}
function onZoneClick() {
  if (props.interactive && !props.disabled) open()
}

/* ────────────────── remove (one-by-one + all) ────────────────── */
function removeFile(id?: string) {
  if (id) {
    engineRemoveFile(id)
  } else {
    engineRemoveAll()
  }
}

/* ────────────────── computed display helpers ────────────────── */
const hasFiles = computed(() => entries.value.length > 0)
const showDropArea = computed(() => props.variant === 'area' && (!hasFiles.value || props.position === 'outside' || props.layout === 'grid'))

const fileDeleteConfig = computed<FileDeleteConfig>(() => {
  if (props.fileDelete === false) return {}
  if (props.fileDelete === true || props.fileDelete === undefined) {
    return props.layout === 'grid'
      ? { color: 'neutral', variant: 'solid', size: 'xs' }
      : { color: 'neutral', variant: 'link', size: 'sm' }
  }
  return props.fileDelete
})

defineExpose({
  inputRef,
  dropzoneRef,
  open,
  removeFile,
  retryFile,
  retryAll
})
</script>

<template>
  <div
    class="r-file-upload"
    :class="[
      `r-fu--${color}`,
      `r-fu--${variant}`,
      `r-fu--${size}`,
      `r-fu--layout-${layout}`,
      `r-fu--pos-${position}`,
      {
        'r-fu--disabled': disabled,
        'r-fu--highlight': highlight,
        'r-fu--dragging': isDragging,
        'r-fu--multiple': multiple
      }
    ]"
    :style="ui?.root"
  >
    <slot
      :open="open"
      :remove-file="removeFile"
      :retry-file="retryFile"
      :retry-all="retryAll"
      :files="entries.map(e => e.file)"
      :entries="entries"
    >
      <div
        v-if="showDropArea"
        ref="dropzoneRef"
        class="r-fu__base"
        :class="{ 'r-fu__base--interactive': interactive && !disabled, 'r-fu__base--dragging': isDragging }"
        :tabindex="interactive && !disabled ? 0 : undefined"
        :style="ui?.base"
        @click="onZoneClick"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
        @keydown.enter="onZoneClick"
        @keydown.space.prevent="onZoneClick"
      >
        <div class="r-fu__wrapper" :style="ui?.wrapper">
          <slot name="leading">
            <i
              v-if="icon !== false"
              class="r-fu__icon"
              :class="icon"
              :style="ui?.icon"
            />
          </slot>

          <slot name="label">
            <p v-if="label" class="r-fu__label" :style="ui?.label">
              {{ label }}
            </p>
          </slot>

          <slot name="description">
            <p v-if="description" class="r-fu__description" :style="ui?.description">
              {{ description }}
            </p>
          </slot>

          <div v-if="$slots.actions" class="r-fu__actions" :style="ui?.actions">
            <slot name="actions" :open="open" />
          </div>
          <div v-else-if="!interactive" class="r-fu__actions" :style="ui?.actions">
            <RBtn
              :label="multiple ? 'Select files' : 'Select file'"
              icon="ri-upload-2-line"
              color="neutral"
              variant="outline"
              :size="size"
              :disabled="disabled"
              @click="open"
            />
          </div>
        </div>
      </div>

      <input
        :id="inputId"
        ref="inputRef"
        v-bind="attrs"
        type="file"
        class="r-fu__input"
        :name="name"
        :accept="accept"
        :multiple="multiple"
        :required="required"
        :disabled="disabled"
        :form="form"
        :formaction="formaction"
        :formenctype="formenctype"
        :formmethod="formmethod"
        :formnovalidate="formnovalidate"
        :formtarget="formtarget"
        @change="onInputChange"
      >

      <!-- ── files list ── -->
      <template v-if="preview && hasFiles">
        <div class="r-fu__files-top">
          <slot name="files-top" :open="open" :files="entries.map(e => e.file)" />
        </div>

        <div
          v-if="hasErrors"
          class="r-fu__retry-all"
        >
          <span class="r-fu__retry-all-text">
            <i class="ri-error-warning-line" />
            {{ erroredEntries.length }} file{{ erroredEntries.length === 1 ? '' : 's' }} failed to upload
          </span>
          <RBtn
            label="Retry all"
            icon="ri-refresh-line"
            color="danger"
            variant="soft"
            size="xs"
            @click="retryAll"
          />
        </div>

        <div class="r-fu__files" :style="ui?.files">
          <slot name="files" :files="entries.map(e => e.file)" :entries="entries" :remove-file="removeFile">
            <div
              v-for="entry in entries"
              :key="entry.id"
              class="r-fu__file"
              :class="[`r-fu__file--${entry.status}`]"
              :style="ui?.file"
            >
              <slot
                name="file"
                :file="entry.file"
                :entry="entry"
                :remove-file="() => removeFile(entry.id)"
                :retry="() => retryFile(entry.id)"
              >
                <slot name="file-leading" :file="entry.file" :entry="entry">
                  <div class="r-fu__file-leading">
                    <img
                      v-if="fileImage && entry.previewUrl"
                      :src="entry.previewUrl"
                      class="r-fu__file-avatar"
                      :style="ui?.avatar"
                      alt=""
                    >
                    <i
                      v-else
                      class="r-fu__file-icon"
                      :class="fileIcon || (entry.file.type.startsWith('image/') ? 'ri-image-line' : 'ri-file-line')"
                    />
                  </div>
                </slot>

                <div class="r-fu__file-wrapper" :style="ui?.fileWrapper">
                  <slot name="file-name" :file="entry.file" :entry="entry">
                    <p class="r-fu__file-name" :style="ui?.fileName">
                      {{ entry.file.name }}
                    </p>
                  </slot>

                  <slot name="file-size" :file="entry.file" :entry="entry">
                    <p class="r-fu__file-size" :style="ui?.fileSize">
                      {{ formatBytes(entry.file.size) }}
                    </p>
                  </slot>

                  <!-- progress bar -->
                  <div
                    v-if="showProgress && entry.status === 'uploading'"
                    class="r-fu__progress"
                  >
                    <div class="r-fu__progress-track">
                      <div
                        class="r-fu__progress-bar"
                        :style="{ width: `${entry.progress}%` }"
                      />
                    </div>
                    <span class="r-fu__progress-pct">{{ entry.progress }}%</span>
                  </div>

                  <!-- error + retry (single) -->
                  <div v-if="entry.status === 'error'" class="r-fu__file-error">
                    <span class="r-fu__file-error-text">
                      <i class="ri-error-warning-line" />
                      {{ entry.error }}
                    </span>
                    <RBtn
                      label="Retry"
                      icon="ri-refresh-line"
                      color="danger"
                      variant="link"
                      size="xs"
                      @click="retryFile(entry.id)"
                    />
                  </div>
                </div>

                <slot name="file-trailing" :file="entry.file" :entry="entry" :remove-file="() => removeFile(entry.id)">
                  <div class="r-fu__file-trailing" :style="ui?.fileTrailingButton">
                    <i
                      v-if="entry.status === 'success'"
                      class="r-fu__file-status-icon r-fu__file-status-icon--success ri-checkbox-circle-fill"
                    />
                    <RBtn
                      v-if="fileDelete !== false"
                      square
                      :icon="fileDeleteIcon || 'ri-close-line'"
                      :color="fileDeleteConfig.color || 'neutral'"
                      :variant="fileDeleteConfig.variant || 'link'"
                      :size="fileDeleteConfig.size || 'sm'"
                      @click="removeFile(entry.id)"
                    />
                  </div>
                </slot>
              </slot>
            </div>
          </slot>
        </div>

        <div class="r-fu__files-bottom">
          <slot name="files-bottom" :remove-file="removeFile" :files="entries.map(e => e.file)">
            <RBtn
              v-if="entries.length"
              label="Remove all files"
              icon="ri-delete-bin-line"
              color="neutral"
              variant="ghost"
              size="xs"
              @click="removeFile()"
            />
          </slot>
        </div>
      </template>
    </slot>
  </div>
</template>

<style lang="scss" scoped>
/* ============================================
   RFileUpload — styles
   SARIKA tokens only · glassmorphism · no Tailwind
   ============================================ */

.r-file-upload {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  width: 100%;
  font-family: var(--font-fallback);
  color: var(--c-text);

  &.r-fu--layout-list {
    align-items: flex-start;
  }
}

/* ── dropzone / base ── */
.r-fu__base {
  position: relative;
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  border-radius: var(--r-lg);
  border: 1.5px dashed var(--c-border);
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  box-shadow: var(--glass-shadow);
  padding: var(--sp-6) var(--sp-4);
  transition:
    background-color var(--t-base) var(--ease-out),
    border-color var(--t-base) var(--ease-out),
    box-shadow var(--t-base) var(--ease-out);
  outline: none;

  &--interactive {
    cursor: pointer;

    &:hover {
      background: color-mix(in srgb, var(--c-accent) 6%, var(--glass-bg));
      border-color: var(--c-accent);
    }

    &:focus-visible {
      border-color: var(--c-accent);
      box-shadow: var(--glow-accent-sm);
    }
  }

  &--dragging {
    border-color: var(--c-accent);
    background: color-mix(in srgb, var(--c-accent) 10%, var(--glass-bg));
    box-shadow: var(--glow-accent);
  }
}

.r-file-upload.r-fu--disabled .r-fu__base {
  cursor: not-allowed;
  opacity: 0.6;
}

.r-file-upload.r-fu--highlight .r-fu__base {
  border-color: var(--c-accent);
  box-shadow: var(--glow-accent-sm);
}

/* color variants tint the border/glow on highlight or drag */
@each $clr in primary, secondary, success, info, warning, error, neutral {
  .r-fu--#{$clr}.r-fu--highlight .r-fu__base,
  .r-fu--#{$clr} .r-fu__base--dragging {
    border-color: var(--c-accent);
  }
}
.r-fu--success.r-fu--highlight .r-fu__base { border-color: var(--c-success); }
.r-fu--error.r-fu--highlight .r-fu__base,
.r-fu--error .r-fu__base--dragging { border-color: var(--c-danger); }
.r-fu--info.r-fu--highlight .r-fu__base { border-color: var(--c-info); }
.r-fu--warning.r-fu--highlight .r-fu__base { border-color: var(--c-accent-2); }

/* variant: button (compact, no big dropzone) */
.r-fu--button .r-fu__base {
  flex-direction: row;
  align-items: center;
  padding: var(--sp-2) var(--sp-3);
  border-style: solid;
}

/* ── content inside dropzone ── */
.r-fu__wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: var(--sp-1);
}

.r-fu__icon {
  font-size: 30px;
  color: var(--c-accent);
  filter: drop-shadow(var(--glow-text));
  margin-bottom: var(--sp-1);
}

.r-fu__label {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--c-text);
  margin: 0;
}

.r-fu__description {
  font-size: 0.8rem;
  color: var(--c-muted);
  margin: 0;
}

.r-fu__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
  justify-content: center;
  margin-top: var(--sp-4);
}

.r-fu__input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* ── sizes ── */
.r-fu--xs .r-fu__icon { font-size: 22px; }
.r-fu--sm .r-fu__icon { font-size: 24px; }
.r-fu--md .r-fu__icon { font-size: 28px; }
.r-fu--lg .r-fu__icon { font-size: 32px; }
.r-fu--xl .r-fu__icon { font-size: 38px; }

.r-fu--xs .r-fu__label,
.r-fu--sm .r-fu__label { font-size: 0.85rem; }
.r-fu--lg .r-fu__label,
.r-fu--xl .r-fu__label { font-size: 1.05rem; }

/* ── files-top / files-bottom slots ── */
.r-fu__files-top:empty,
.r-fu__files-bottom:empty {
  display: none;
}

.r-fu__files-bottom {
  display: flex;
  justify-content: center;
  margin-top: var(--sp-1);
}

/* ── retry-all banner ── */
.r-fu__retry-all {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--r-md);
  background: color-mix(in srgb, var(--c-danger) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--c-danger) 30%, transparent);
}

.r-fu__retry-all-text {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  font-size: 0.8rem;
  color: var(--c-danger);
}

/* ── files list ── */
.r-fu__files {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: var(--sp-2);
}

.r-fu--layout-grid .r-fu__files {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--sp-3);

  @media (min-width: 640px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

/* ── individual file ── */
.r-fu__file {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  width: 100%;
  min-width: 0;
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--r-md);
  border: 1px solid var(--c-border);
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur-sm);
  -webkit-backdrop-filter: var(--glass-blur-sm);
  transition: border-color var(--t-fast) var(--ease-out), box-shadow var(--t-fast) var(--ease-out);

  &--error {
    border-color: color-mix(in srgb, var(--c-danger) 50%, var(--c-border));
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--c-danger) 18%, transparent);
  }

  &--success {
    border-color: color-mix(in srgb, var(--c-success) 35%, var(--c-border));
  }
}

.r-fu--layout-grid .r-fu__file {
  flex-direction: column;
  aspect-ratio: 1 / 1;
  padding: 0;
  overflow: hidden;
  align-items: stretch;
}

.r-fu--layout-grid .r-fu__file-wrapper {
  display: none;
}

/* ── file leading (avatar/icon) ── */
.r-fu__file-leading {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.r-fu__file-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--r-sm);
  object-fit: cover;
  flex-shrink: 0;
}

.r-fu--layout-grid .r-fu__file-avatar {
  width: 100%;
  height: 100%;
  border-radius: var(--r-lg);
}

.r-fu__file-icon {
  font-size: 26px;
  color: var(--c-muted);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--r-sm);
  background: var(--c-hover);
}

/* ── file text block ── */
.r-fu__file-wrapper {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
  gap: 2px;
}

.r-fu__file-name {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--c-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.r-fu__file-size {
  margin: 0;
  font-size: 0.72rem;
  color: var(--c-muted);
}

/* ── progress bar ── */
.r-fu__progress {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin-top: var(--sp-1);
}

.r-fu__progress-track {
  flex: 1;
  height: 5px;
  border-radius: var(--r-full);
  background: var(--c-hover);
  overflow: hidden;
}

.r-fu__progress-bar {
  height: 100%;
  border-radius: var(--r-full);
  background: linear-gradient(90deg, var(--c-accent), var(--c-accent-2));
  box-shadow: var(--glow-accent-sm);
  transition: width var(--t-base) var(--ease-out);
}

.r-fu__progress-pct {
  font-size: 0.68rem;
  color: var(--c-muted);
  min-width: 30px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* ── per-file error + retry ── */
.r-fu__file-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
  margin-top: 2px;
}

.r-fu__file-error-text {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.7rem;
  color: var(--c-danger);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── file trailing (status icon + delete button) ── */
.r-fu__file-trailing {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  flex-shrink: 0;
  margin-left: auto;
}

.r-fu--layout-grid .r-fu__file-trailing {
  position: absolute;
  top: var(--sp-1);
  right: var(--sp-1);
  margin-left: 0;
  background: color-mix(in srgb, var(--c-bg) 70%, transparent);
  border-radius: var(--r-full);
  backdrop-filter: blur(6px);
}

.r-fu__file-status-icon {
  font-size: 16px;
  display: inline-flex;

  &--success {
    color: var(--c-success);
  }
}

/* ── dark theme adjustments ── */
.dark {
  .r-fu__file-icon {
    background: var(--c-hover);
  }

  .r-fu__icon {
    filter: drop-shadow(0 0 10px color-mix(in srgb, var(--c-accent) 45%, transparent));
  }
}

/* ── responsive: mobile tightening ── */
@media (max-width: 480px) {
  .r-fu__base {
    padding: var(--sp-4) var(--sp-3);
  }

  .r-fu--layout-grid .r-fu__files {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--sp-2);
  }

  .r-fu__actions {
    flex-direction: column;
    width: 100%;

    > * {
      width: 100%;
    }
  }
}
</style>
