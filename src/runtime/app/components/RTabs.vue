<script setup>
import { computed, nextTick, ref } from 'vue'
import RIcon from './RIcon.vue'

defineOptions({ name: 'RTabs' })

const props = defineProps({
  modelValue: { type: [String, Number], default: undefined },
  items: { type: Array, default: () => [] },
  ariaLabel: { type: String, default: 'Tabs' },
  variant: { type: String, default: 'pills' },
  size: { type: String, default: 'md' },
  compact: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'select'])

const root = ref(null)
const list = computed(() => props.items.filter(Boolean))
const idOf = (tab, index) => tab.id ?? tab.value ?? index
const labelOf = tab => tab.label ?? tab.text ?? tab.title ?? String(idOf(tab, 0))
const isActive = (tab, index) => props.modelValue === idOf(tab, index)
const focusActive = () => nextTick(() => root.value?.querySelector('[data-active="true"]')?.focus())

function select(tab, index) {
  if (tab.disabled) return
  const id = idOf(tab, index)
  emit('update:modelValue', id)
  emit('select', tab, id)
}

function move(step) {
  const tabs = list.value
  if (!tabs.length) return
  let index = tabs.findIndex((tab, i) => isActive(tab, i))
  if (index < 0) index = step > 0 ? -1 : 0
  for (let count = 0; count < tabs.length; count++) {
    index = (index + step + tabs.length) % tabs.length
    if (!tabs[index].disabled) {
      select(tabs[index], index)
      focusActive()
      return
    }
  }
}

function onKeydown(event) {
  if (event.key === 'ArrowRight') {
    event.preventDefault()
    move(1)
  }
  else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    move(-1)
  }
  else if (event.key === 'Home') {
    event.preventDefault()
    const index = list.value.findIndex(tab => !tab.disabled)
    if (index >= 0) {
      select(list.value[index], index)
      focusActive()
    }
  }
  else if (event.key === 'End') {
    event.preventDefault()
    for (let i = list.value.length - 1; i >= 0; i--) {
      if (!list.value[i].disabled) {
        select(list.value[i], i)
        focusActive()
        break
      }
    }
  }
}
</script>

<template>
  <div
    ref="root"
    class="r-tabs"
    :class="[`r-tabs--${variant}`, `r-tabs--${size}`, { 'is-compact': compact }]"
    role="tablist"
    :aria-label="ariaLabel"
    @keydown="onKeydown"
  >
    <button
      v-for="(tab, index) in list"
      :key="idOf(tab, index)"
      type="button"
      role="tab"
      class="r-tabs__tab"
      :class="{ 'is-active': isActive(tab, index), 'is-contextual': tab.contextual }"
      :disabled="tab.disabled"
      :aria-selected="isActive(tab, index)"
      :data-active="isActive(tab, index) ? 'true' : 'false'"
      :tabindex="isActive(tab, index) ? 0 : -1"
      @click="select(tab, index)"
    >
      <slot
        name="tab"
        :tab="tab"
        :index="index"
        :active="isActive(tab, index)"
        :disabled="tab.disabled"
      >
        <RIcon
          v-if="tab.icon"
          :name="tab.icon"
        />
        <span>{{ labelOf(tab) }}</span>
      </slot>
    </button>
  </div>
</template>

<style lang="scss">
.r-tabs {
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 0;
  padding: 3px;
  background: color-mix(in srgb, var(--color-w-b-1) 5%, transparent);
  border-radius: 10px;
  overflow-x: auto;
  scrollbar-width: none;
}
.r-tabs__tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--c-muted);
  white-space: nowrap;
  background: transparent;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  transition: color 140ms cubic-bezier(0.2, 0.7, 0.2, 1), background 140ms cubic-bezier(0.2, 0.7, 0.2, 1), box-shadow 140ms cubic-bezier(0.2, 0.7, 0.2, 1);
  &:hover:not(:disabled) { color: var(--color-w-b-1); background: color-mix(in srgb, var(--color-w-b-1) 7%, transparent); }
  &.is-active {
    color: var(--color-primary);
    font-weight: 600;
    background: var(--bg-content);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08), 0 0 0 1px color-mix(in srgb, var(--color-primary) 18%, transparent);
  }
  &.is-contextual { color: var(--c-accent); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
  &:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 1px; }
}
.r-tabs--sm .r-tabs__tab { padding: 4px 10px; font-size: 0.75rem; }
.r-tabs.is-compact .r-tabs__tab { padding: 4px 9px; }
.r-tabs--underline {
  gap: 4px;
  background: transparent;
  border-radius: 0;
  padding: 0;
  .r-tabs__tab {
    padding: 8px 12px;
    border-radius: 0;
    border-bottom: 2px solid transparent;
    &.is-active { color: var(--color-primary); background: transparent; box-shadow: none; border-bottom-color: var(--color-primary); }
  }
}
</style>
