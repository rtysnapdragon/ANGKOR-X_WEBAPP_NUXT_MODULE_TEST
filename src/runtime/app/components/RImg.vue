<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  src?: string | null
  alt?: string
  watermark?: string
  signed?: boolean
  customClass?: string | string[] | Record<string, boolean>
  aspect?: string
}

const props = withDefaults(defineProps<Props>(), {
  alt: 'Artwork image',
  aspect: '4/3'
})

const FALLBACK_IMAGE = '../assets/imgs/placeholder.png'

const imageSrc = computed(() => {
  if (!props.src || props.src.trim() === '') {
    return FALLBACK_IMAGE
  }

  return props.src
})

const handleError = (event: Event) => {
  const img = event.target as HTMLImageElement

  img.onerror = null
  img.src = FALLBACK_IMAGE
}
</script>

<template>
  <div
    class="relative overflow-hidden bg-gray-100 dark:bg-gray-800"
    :style="{ aspectRatio: aspect }"
  >
    <img
      :src="imageSrc"
      :alt="alt"
      loading="lazy"
      decoding="async"
      referrerpolicy="no-referrer"
      class="w-full h-full object-cover select-none pointer-events-none"
      :class="customClass"
      @error="handleError"
      @contextmenu.prevent
      @dragstart.prevent
    />

    <!-- Watermark -->
    <div
      v-if="watermark"
      class="pointer-events-none absolute bottom-3 right-3 rounded bg-black/40 px-2 py-1 text-xs text-white"
    >
      {{ watermark }}
    </div>

    <!-- Signed badge -->
    <div
      v-if="signed"
      class="pointer-events-none absolute left-3 top-3 rounded bg-emerald-500/70 px-2 py-1 text-[10px] font-semibold uppercase text-white"
    >
      Signed URL
    </div>
  </div>
</template>


<!-- <RImg
  src="/art.jpg"
  alt="Art"
  customClass="w-full h-64 object-cover rounded-xl"
/>
<RImg
  :src="img"
  alt="Art"
  :customClass="[
    'w-full',
    isGrid ? 'h-48' : 'h-96',
    'object-cover rounded-lg'
  ]"
/>
<RImg
  src="/art.jpg"
  alt="Art"
  :customClass="{
    'blur-sm': isLocked,
    'hover:scale-105 transition': true
  }"
/> -->