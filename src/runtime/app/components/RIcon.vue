<script setup>
import { computed } from 'vue'

defineOptions({ name: 'RIcon' })

const props = defineProps({
  name: { type: String, default: '' },
  size: { type: [Number, String], default: null },
  label: { type: String, default: '' },
})

const isHtml = computed(() => /<[a-z][\s\S]*>/i.test(props.name))
// const isHtml = computed(() => /<[a-z][\s\S]*>/i.test(props.name))
const __isHtml = computed(() => {
  if (typeof props.name !== 'string') return false
  return /<\/?[a-z][^>]*>/i.test(props.name)
})
const _isHtml = computed(() => {
  return typeof props.name === 'string' &&
    /<\/?[a-z][^>]*>/i.test(props.name)
})
/*
isHtml detects
'<i class="ri-line-chart-line"></i>' // true
'<i class="ri-home-line"></i>'       // true
'<b>Hello</b>'                       // true
'<svg><path d="..."/></svg>'       // true
'<img src="image.png">'              // true
'Hello World'                        // false
'ri-line-chart-line'                 // false
*/

const isRemix = computed(() => props.name.trim().startsWith('ri-'))
const style = computed(() => {
  if (props.size === null || props.size === undefined || props.size === '') return undefined
  return { fontSize: typeof props.size === 'number' ? `${props.size}px` : String(props.size) }
})
</script>

<template>
  <!-- eslint-disable vue/no-v-html -->
  <span
    v-if="isHtml"
    class="r-icon r-icon--html"
    :style="style"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
    role="img"
    v-html="name"
  />
  <!-- eslint-enable vue/no-v-html -->
  <i
    v-else-if="isRemix"
    class="r-icon"
    :class="name"
    :style="style"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
  />
  <UIcon
    v-else
    :name="name"
    class="r-icon"
    :style="style"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
  />
</template>

<style lang="scss">
.r-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  font-size: 1em;
  line-height: 1;
  vertical-align: middle;

  &.r-icon--html {
    svg {
      display: block;
      width: 1em;
      height: 1em;
      fill: currentColor;
    }
  }
}
</style>
