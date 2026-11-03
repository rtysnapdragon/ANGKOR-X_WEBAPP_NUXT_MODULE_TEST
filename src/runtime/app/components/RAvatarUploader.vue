<script setup lang="ts">
// RAvatarUploader — SARIKA
// Click or drag-and-drop to upload an avatar image.
// Wraps RAvatar; exposes v-model (url), @upload (File), @error (string).
import { ref } from 'vue'

const props = withDefaults(defineProps<{
  modelValue?: string          // current image URL (v-model)
  name?:       string          // used for RAvatar initials fallback
  size?:       'sm' | 'md' | 'lg' | 'xl'
  accept?:     string          // file accept filter
  disabled?:   boolean
  shape?:      'circle' | 'square'
}>(), {
  size:   'md',
  accept: 'image/*',
  shape:  'circle',
})

const emit = defineEmits<{
  'update:modelValue': [url: string]
  upload:              [file: File]
  error:               [message: string]
}>()

const inputRef   = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const isUploading = ref(false)

// px map — kept in sync with SCSS $sizes map
const sizePx: Record<string, number> = {
  sm: 40, md: 64, lg: 88, xl: 112,
}

function openPicker() {
  if (!props.disabled) inputRef.value?.click()
}

async function handleFile(file: File) {
  if (!file.type.startsWith('image/')) {
    emit('error', 'Only image files are accepted.')
    return
  }
  isUploading.value = true
  // Instant local preview — same as React URL.createObjectURL
  const preview = URL.createObjectURL(file)
  emit('update:modelValue', preview)
  emit('upload', file)
  isUploading.value = false
}

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) handleFile(file)
  // reset so same file can be re-selected
  ;(e.target as HTMLInputElement).value = ''
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  if (!props.disabled) isDragging.value = true
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) handleFile(file)
}
</script>

<template>
  <div
    :class="[
      'r-au',
      `r-au--${size}`,
      `r-au--${shape}`,
      {
        'r-au--dragging':  isDragging,
        'r-au--disabled':  disabled,
        'r-au--uploading': isUploading,
      },
    ]"
    role="button"
    :tabindex="disabled ? -1 : 0"
    :aria-label="modelValue ? 'Change avatar' : 'Upload avatar'"
    :style="{ width: sizePx[size] + 'px', height: sizePx[size] + 'px' }"
    @click="openPicker"
    @keydown.enter.prevent="openPicker"
    @keydown.space.prevent="openPicker"
    @dragover="onDragOver"
    @dragleave="isDragging = false"
    @drop="onDrop"
  >
    <!-- hidden file input -->
    <input
      ref="inputRef"
      type="file"
      :accept="accept"
      class="r-au__input"
      tabindex="-1"
      aria-hidden="true"
      @change="onFileChange"
    />

    <!-- Avatar -->
    <RAvatar
      :src="modelValue"
      :name="name"
      :size="size"
      :shape="shape"
      class="r-au__avatar"
    />

    <!-- Hover / drag / upload overlay -->
    <div class="r-au__overlay" aria-hidden="true">
      <UIcon
        :name="
          isUploading  ? 'i-lucide-loader-2'
          : isDragging ? 'i-lucide-arrow-down-to-line'
                       : 'i-lucide-camera'
        "
        :class="{ 'animate-spin': isUploading }"
        class="r-au__overlay-icon"
      />
      <span v-if="!isUploading" class="r-au__overlay-label">
        {{ isDragging ? 'Drop here' : 'Change' }}
      </span>
    </div>

    <!-- Uploading ring -->
    <div v-if="isUploading" class="r-au__ring" aria-hidden="true" />
  </div>
</template>

<style lang="scss" scoped>
// Keep in sync with sizePx in <script>
$sizes: (sm: 40px, md: 64px, lg: 88px, xl: 112px);

.r-au {
  position:   relative;
  display:    inline-flex;
  flex-shrink: 0;
  cursor:     pointer;
  // @include focus-ring;
  // @include transition(fast);

  // ── Shape ──
  &--circle { border-radius: 50%; }
  &--square { border-radius: var(--radius-lg); }

  // ── Size (width/height driven by inline :style, but shape uses this for children) ──
  @each $key, $px in $sizes {
    &--#{$key} {
      .r-au__overlay-label {
        // hide label on small sizes
        @if $key == sm { display: none; }
      }
    }
  }

  // ── States ──
  &--disabled  { cursor: not-allowed; opacity: 0.5; pointer-events: none; }
  &--dragging  { outline: 2px dashed var(--c-accent); outline-offset: 3px; }
  &--uploading { cursor: wait; }

  // ── Hidden input ──
  &__input {
    position: absolute;
    inset:    0;
    width:    0;
    height:   0;
    opacity:  0;
    pointer-events: none;
  }

  // ── Avatar fills container ──
  &__avatar {
    width:         100% !important;
    height:        100% !important;
    border-radius: inherit;
    display:       block;
    pointer-events: none;
    // @include transition(fast);
  }

  // ── Overlay (camera icon + label) ──
  &__overlay {
    position:        absolute;
    inset:           0;
    border-radius:   inherit;
    background:      rgba(0, 0, 0, 0.48);
    color:           #fff;
    display:         flex;
    flex-direction:  column;
    align-items:     center;
    justify-content: center;
    gap:             4px;
    opacity:         0;
    // @include transition(fast);
  }

  &__overlay-icon  { font-size: 1.3rem; }
  &__overlay-label { font-size: 0.7rem; font-weight: 500; letter-spacing: 0.04em; }

  // show overlay
  &:hover       .r-au__overlay,
  &--dragging   .r-au__overlay,
  &--uploading  .r-au__overlay { opacity: 1; }

  // ── Upload progress ring ──
  &__ring {
    position:      absolute;
    inset:         -3px;
    border-radius: inherit;
    border:        2px solid transparent;
    border-top-color: var(--c-accent);
    animation:     au-spin 0.8s linear infinite;
  }
}

@keyframes au-spin {
  to { transform: rotate(360deg); }
}
</style>
