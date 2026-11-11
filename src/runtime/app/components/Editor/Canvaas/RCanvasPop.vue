<script setup>
// Tiny popover used by the RCanvas toolbars (trigger button + floating panel).
import { onBeforeUnmount, onMounted, ref } from 'vue'

defineProps({
  title: { type: String, default: '' },
  align: { type: String, default: 'left' },   // 'left' | 'right'
  active: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const open = ref(false)
const root = ref(null)

function close() { open.value = false }
function onOutside(e) {
  if (open.value && root.value && !root.value.contains(e.target)) open.value = false
}

onMounted(() => document.addEventListener('pointerdown', onOutside, true))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onOutside, true))
defineExpose({ close })
</script>

<template>
  <div ref="root" class="rc-pop">
    <button
      type="button"
      class="rc-btn"
      :class="{ 'is-on': open || active }"
      :title="title"
      :aria-label="title"
      :aria-expanded="open"
      :disabled="disabled"
      @click="open = !open"
    >
      <slot name="trigger" />
    </button>
    <div v-if="open" class="rc-pop__panel" :class="`is-${align}`" @keydown.esc.stop="close">
      <slot :close="close" />
    </div>
  </div>
</template>
