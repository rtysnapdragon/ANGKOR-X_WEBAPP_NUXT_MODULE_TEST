<template>
  <fieldset
    class="r-checkboxes"
    :class="[`r-checkboxes--${orientation}`, `r-checkboxes--${variant}`, { 'r-checkboxes--border': isBorder }]"
    :disabled="disabled"
  >
    <legend v-if="legend || $slots.legend" class="r-checkboxes__legend">
      <slot name="legend">{{ legend }}</slot>
      <span v-if="required" class="r-checkboxes__required" aria-hidden="true">*</span>
    </legend>

    <div class="r-checkboxes__grid" :style="gridStyle">
      <RCheckbox
        v-for="(it, i) in normalized"
        :key="`${it.value ?? i}`"
        :model-value="isSelected(it.value)"
        :value="it.value"
        :label="it.label"
        :description="it.description"
        :name="name"
        :size="size"
        :variant="variant"
        :nowrap="nowrap"
        :disabled="disabled || it.disabled"
        @update:model-value="toggle(it, $event)"
      >
        <template v-if="$slots.label" #label><slot name="label" v-bind="slotProps(it)" /></template>
        <template v-if="$slots.description" #description><slot name="description" v-bind="slotProps(it)" /></template>
      </RCheckbox>
    </div>
  </fieldset>
</template>

<script setup>
import { computed } from 'vue'
import RCheckbox from './RCheckbox.vue'

/**
 * Like Nuxt UI's UCheckboxGroup. v-model is an array of item *values*.
 * items: primitives, or objects { value, label, description, disabled } (keys configurable).
 */
const model = defineModel({ default: () => [] })
const emit = defineEmits(['change'])

const props = defineProps({
  items: { type: Array, default: undefined },
  options: { type: Array, default: undefined }, // alias of `items`
  valueKey: { type: String, default: 'value' },
  labelKey: { type: String, default: 'label' },
  descriptionKey: { type: String, default: 'description' },
  legend: { type: String, default: undefined },
  name: { type: String, default: undefined },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  orientation: { type: String, default: 'horizontal', validator: (v) => ['horizontal', 'vertical'].includes(v) }, // horizontal = grid
  variant: { type: String, default: 'list', validator: (v) => ['list', 'card'].includes(v) },
  size: { type: String, default: 'md', validator: (v) => ['sm', 'md', 'lg'].includes(v) },
  columns: { type: [Number, String], default: undefined }, // 3 → 3 equal columns, or any grid-template-columns
  minItemWidth: { type: [Number, String], default: 160 }, // auto-fill column minimum
  gap: { type: String, default: undefined }, // CSS gap, e.g. "10px 16px"
  nowrap: { type: Boolean, default: true }, // box + label on one line (ellipsis)
  isBorder: { type: Boolean, default: true },
})

const normalized = computed(() =>
  (props.items ?? props.options ?? []).map((raw) => {
    const obj = raw !== null && typeof raw === 'object'
    return {
      raw,
      value: obj ? raw[props.valueKey] : raw,
      label: obj ? raw[props.labelKey] : String(raw),
      description: obj ? raw[props.descriptionKey] : undefined,
      disabled: obj && !!raw.disabled,
    }
  }),
)

const current = computed(() => {
  const v = model.value
  return Array.isArray(v) ? v : v == null || v === '' ? [] : [v]
})
const isSelected = (value) => current.value.some((x) => Object.is(x, value))

function toggle(it, on) {
  if (props.disabled || it.disabled || it.value == null) return
  if (on === isSelected(it.value)) return
  const next = on ? [...current.value, it.value] : current.value.filter((x) => !Object.is(x, it.value))
  model.value = next
  emit('change', next)
}

const px = (v) => (typeof v === 'number' ? `${v}px` : v)
const gridStyle = computed(() => ({
  '--rcb-min': px(props.minItemWidth),
  ...(props.gap ? { '--rcb-gap': props.gap } : {}),
  ...(props.columns != null
    ? { gridTemplateColumns: typeof props.columns === 'number' ? `repeat(${props.columns}, minmax(0, 1fr))` : props.columns }
    : {}),
}))

const slotProps = (it) => ({ item: it.raw, value: it.value, label: it.label, checked: isSelected(it.value) })
</script>

<style lang="scss">
.r-checkboxes {
  min-inline-size: 0;
  margin: 0;
  padding: 0;
  border: 0;

  &__legend { padding: 0; margin-bottom: 8px; font-size: 12px; font-weight: 600; color: var(--color-w-b-2); }
  &__required { margin-left: 3px; color: var(--c-danger, #dc2626); }

  // default: responsive grid, every column at least --rcb-min wide
  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(var(--rcb-min, 160px), 1fr));
    gap: var(--rcb-gap, 10px 16px);
    align-items: start;
  }

  &--vertical &__grid { grid-template-columns: minmax(0, 1fr); }

  &--border {
    padding: 8px 12px 12px;
    border: 1px solid var(--color-w-b-4);
    border-radius: 10px;
  }
  &--border &__legend { margin-bottom: 0; padding: 0 6px; }

  // list: only the box + label are clickable, not the empty grid cell
  &--list .r-checkbox { justify-self: start; }
}
</style>