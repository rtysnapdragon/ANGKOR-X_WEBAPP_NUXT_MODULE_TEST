<script setup>
import { computed } from 'vue'

defineOptions({ name: 'RIcon' })

const props = defineProps({
  name: { type: String, default: '' },
  size: { type: [Number, String], default: null },
  label: { type: String, default: '' },
  class: { type: String, default: '' },
})

const iconName = computed(() =>
  typeof props.name === 'string' ? props.name.trim() : ''
)
const isRemix = computed(() => iconName.value.startsWith('ri-') )
const style = computed(() => {
  if (props.size === null || props.size === undefined || props.size === '') return undefined
  return { fontSize: typeof props.size === 'number' ? `${props.size}px` : String(props.size) }
})
const classStyle = computed(() => props.class)
const _isHtml = computed(() => /<[a-z][\s\S]*>/i.test(props.name))
// const isHtml = computed(() => /<[a-z][\s\S]*>/i.test(props.name))
const __isHtml = computed(() => {
  if (typeof props.name !== 'string') return false
  return /<\/?[a-z][^>]*>/i.test(props.name)
})

const isHtml = computed(() => /<\/?[a-z][^>]*>/i.test(iconName.value) )

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

</script>

<template>
  <!-- eslint-disable vue/no-v-html -->
  <span
    v-if="isHtml"
    :class="`r-icon r-icon--html ${classStyle}`"
    :style="style"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
    role="img"
    v-html="iconName"
  />
  <!-- eslint-enable vue/no-v-html -->
  <i
    v-else-if="isRemix"
    class="r-icon"
    :class="`${iconName} ${classStyle}`"
    :style="style"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : 'true'"
  />
  <UIcon
    v-else
    :name="iconName"
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
