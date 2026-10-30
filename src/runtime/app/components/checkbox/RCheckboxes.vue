
<template>
  <div
    class="rty-checkbox-group-container"
    :class="isBorder ? 'rty-border' : ''"
    role="group"
  >
    <RCheckbox
      v-for="(option, index) in normalizedOptions"
      :key="option.id ?? option.pk ?? option.value ?? index"
      :model-value="isSelected(option)"
      @update:model-value="setSelected(option, $event)"
      :label="option.label"
      :id="`${option.id ?? option.pk ?? option.value ?? 'checkbox'}-${index}`"
      :disabled="disabled || option.disabled"
      :name="name"
      :ui="ui"
      :value="undefined"
      class="flex gap-1.5"
    >
      <template v-if="$slots.label" #label>
        <slot name="label" v-bind="option" />
      </template>
    </RCheckbox>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import RCheckbox from './RCheckbox.vue'

const model = defineModel({
  default: () => [],
})

const props = defineProps({
  options: {
    type: Array,
    default: () => [],
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  name: {
    type: String,
    default: undefined,
  },
  ui: {
    type: Object,
    default: () => ({}),
  },
  isBorder: {
    type: Boolean,
    default: true,
  },
})

const normalizedOptions = computed(() => props.options ?? [])

function optionValue(option) {
  return option && typeof option === 'object'
    ? option.value
    : option
}

function selectedValues() {
  const value = model.value

  if (Array.isArray(value)) {
    return value.map(optionValue)
  }

  if (value === null || value === undefined || value === '') {
    return []
  }

  return [optionValue(value)]
}

function isSelected(option) {
  return selectedValues().some(
    value => value === optionValue(option),
  )
}

function setSelected(option, checked) {
  const value = optionValue(option)

  if (value === undefined || value === null) return
  if (props.disabled || option.disabled) return

  const current = selectedValues()
  const next = checked
    ? [...new Set([...current, value])]
    : current.filter(item => item !== value)

  model.value = next
}
</script>

<style lang="scss" scoped>
.rty-checkbox-group-container {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 20px;
  padding-top: 8px;
  padding-bottom: 8px;

  &.rty-border {
    border: 1px solid var(--color-w-b-4);
    border-radius: 10px;
    padding: 8px 12px;
  }
}
</style>
