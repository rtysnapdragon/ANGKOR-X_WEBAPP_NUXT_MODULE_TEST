<script setup>
// Colour picker: swatch button → palette + native picker + hex field.
import { computed } from 'vue'
import RCanvasPop from './RCanvasPop.vue'
import { PALETTE } from './RCanvasData'

const props = defineProps({
  modelValue: { type: String, default: null },
  title: { type: String, default: 'Color' },
  icon: { type: String, default: 'palette' },
  allowNone: { type: Boolean, default: false },
  align: { type: String, default: 'left' },
})
const emit = defineEmits(['update:modelValue'])

function toHex(c) {
  if (typeof c !== 'string') return '#000000'
  if (/^#[0-9a-f]{6}$/i.test(c)) return c.toLowerCase()
  if (/^#[0-9a-f]{3}$/i.test(c)) return `#${[...c.slice(1)].map(x => x + x).join('')}`.toLowerCase()
  return '#000000'
}

const hex = computed(() => toHex(props.modelValue))
const isGradient = computed(() => props.modelValue === '#gradient')
const swatch = computed(() => (props.modelValue && !isGradient.value
  ? { background: props.modelValue }
  : { background: isGradient.value ? 'linear-gradient(135deg,#ff9966,#8e2de2)' : 'transparent' }))

const pick = c => emit('update:modelValue', c)
function onHex(e) {
  const v = e.target.value.trim()
  if (/^#?[0-9a-f]{6}$/i.test(v)) pick(v.startsWith('#') ? v : `#${v}`)
  else e.target.value = hex.value
}
</script>

<template>
  <RCanvasPop :title="title" :align="align">
    <template #trigger>
      <UIcon :name="`i-lucide-${icon}`" class="rc-ico" />
      <span class="rc-swatch" :class="{ 'is-empty': !modelValue }" :style="swatch" />
    </template>
    <div class="rc-colors">
      <div class="rc-colors__grid">
        <button
          v-for="c in PALETTE"
          :key="c"
          type="button"
          class="rc-colors__chip"
          :class="{ 'is-on': modelValue === c }"
          :style="{ background: c }"
          :title="c"
          @click="pick(c)"
        />
      </div>
      <div class="rc-colors__row">
        <input type="color" :value="hex" class="rc-colors__native" :aria-label="title" @input="pick($event.target.value)">
        <input type="text" :value="hex" maxlength="7" class="rc-input" spellcheck="false" @change="onHex">
        <button v-if="allowNone" type="button" class="rc-link" @click="pick(null)">None</button>
      </div>
    </div>
  </RCanvasPop>
</template>
