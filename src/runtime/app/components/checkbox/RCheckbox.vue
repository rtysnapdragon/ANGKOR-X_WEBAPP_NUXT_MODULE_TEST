<template>
  <label
    class="r-checkbox"
    :class="[
      `r-checkbox--${size}`,
      `r-checkbox--${variant}`,
      { 'is-checked': checked, 'is-disabled': disabled, 'is-nowrap': nowrap, 'has-text': hasText() },
      rootAttrs.class,
    ]"
    :style="rootAttrs.style"
  >
    <input
      :id="computedId"
      ref="el"
      type="checkbox"
      class="r-checkbox__input"
      :name="name"
      :value="isPrimitive(value) ? value : undefined"
      :checked="checked"
      :disabled="disabled"
      :required="required"
      :aria-checked="indeterminate ? 'mixed' : undefined"
      :aria-describedby="hasDesc() ? `${computedId}-desc` : undefined"
      v-bind="inputAttrs"
      @change="onChange"
    />

    <span v-if="hasText()" class="r-checkbox__text">
      <span v-if="hasLabel()" class="r-checkbox__label" :title="nowrap && typeof label === 'string' ? label : undefined">
        <slot name="label">{{ label }}</slot>
        <span v-if="required" class="r-checkbox__required" aria-hidden="true">*</span>
      </span>
      <span v-if="hasDesc()" :id="`${computedId}-desc`" class="r-checkbox__desc">
        <slot name="description">{{ descText }}</slot>
      </span>
    </span>
  </label>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, useAttrs, useId, useSlots, watch } from 'vue'

defineOptions({ inheritAttrs: false })

/**
 * v-model: boolean, or an array (then `value` is added to / removed from it).
 * class/style go to the root <label>; every other attribute goes to the <input>.
 */
const model = defineModel()
const emit = defineEmits(['change'])

const props = defineProps({
  label: { type: String, default: undefined },
  description: { type: String, default: undefined },
  help: { type: String, default: undefined }, // alias of `description`
  name: { type: String, default: undefined },
  value: { type: [String, Number, Boolean, Object], default: undefined },
  id: { type: String, default: undefined },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  indeterminate: { type: Boolean, default: false },
  nowrap: { type: Boolean, default: false },
  size: { type: String, default: 'md', validator: (v) => ['sm', 'md', 'lg'].includes(v) },
  variant: { type: String, default: 'list', validator: (v) => ['list', 'card'].includes(v) },
})

const slots = useSlots()
const attrs = useAttrs()
const el = ref()

const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }))
const inputAttrs = computed(() => {
  const { class: _c, style: _s, ...rest } = attrs
  return rest
})

const uid = useId() // SSR-safe (no Math.random hydration mismatch)
const computedId = computed(() => props.id || `r-checkbox-${uid}`)
const descText = computed(() => props.description ?? props.help)

const isPrimitive = (v) => v == null || ['string', 'number', 'boolean'].includes(typeof v)
const hasLabel = () => !!(props.label || slots.label)
const hasDesc = () => !!(descText.value || slots.description)
const hasText = () => hasLabel() || hasDesc()

const checked = computed(() =>
  Array.isArray(model.value) ? model.value.some((v) => Object.is(v, props.value)) : !!model.value,
)

function syncDom() {
  if (!el.value) return
  el.value.checked = checked.value // controlled: re-sync if the parent rejected the change
  el.value.indeterminate = props.indeterminate
}

function onChange(e) {
  const on = e.target.checked
  if (Array.isArray(model.value)) {
    model.value = on
      ? [...model.value, props.value]
      : model.value.filter((v) => !Object.is(v, props.value))
  } else {
    model.value = on
  }
  emit('change', e)
  nextTick(syncDom)
}

watch(() => props.indeterminate, syncDom, { flush: 'post' })
onMounted(syncDom)

defineExpose({ focus: () => el.value?.focus() })
</script>

<style lang="scss">
.r-checkbox {
  --rc-accent: var(--color-primary, #2563eb);
  --rc-size: 16px;
  --rc-ease: cubic-bezier(0.2, 0, 0, 1);
  --rc-check: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='none' stroke='%23000' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round' d='M5 12.5l4.5 4.5L19 7.5'/%3E%3C/svg%3E");
  --rc-dash: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='none' stroke='%23000' stroke-width='3.5' stroke-linecap='round' d='M6 12h12'/%3E%3C/svg%3E");

  position: relative;
  display: inline-grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  column-gap: 8px;
  min-width: 0;
  max-width: 100%;
  font-size: 13px;
  color: var(--color-w-b-1);
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  &:not(.has-text) { grid-template-columns: auto; }

  &--sm { --rc-size: 14px; font-size: 12px; }
  &--lg { --rc-size: 19px; font-size: 14px; }

  // ── box ──
  &__input {
    appearance: none;
    -webkit-appearance: none;
    position: relative;
    flex: none;
    width: var(--rc-size);
    height: var(--rc-size);
    margin: 0;
    font-size: inherit;
    border: 1.5px solid var(--color-w-b-3);
    border-radius: 5px;
    background: var(--c-surface, var(--bg-content));
    cursor: inherit;
    transition: background 0.15s ease, border-color 0.15s ease, box-shadow 0.2s ease, transform 0.15s var(--rc-ease);

    &::after {
      content: "";
      position: absolute;
      inset: 0;
      background: #fff;
      -webkit-mask: var(--rc-check) center / 72% no-repeat;
      mask: var(--rc-check) center / 72% no-repeat;
      opacity: 0;
      transform: scale(0.5);
      transition: opacity 0.15s ease, transform 0.2s var(--rc-ease);
    }

    &:checked,
    &:indeterminate {
      border-color: var(--rc-accent);
      background: var(--rc-accent);

      &::after { opacity: 1; transform: scale(1); }
    }

    &:indeterminate::after {
      -webkit-mask-image: var(--rc-dash);
      mask-image: var(--rc-dash);
    }

    &:focus-visible {
      outline: 2px solid color-mix(in srgb, var(--rc-accent) 45%, transparent);
      outline-offset: 2px;
    }
  }

  &.has-text &__input { margin-top: calc((1.5em - var(--rc-size)) / 2); }

  &:hover:not(.is-disabled) &__input:not(:checked):not(:indeterminate) {
    border-color: var(--rc-accent);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--rc-accent) 12%, transparent);
  }
  &:active:not(.is-disabled) &__input { transform: scale(0.9); }

  // ── text ──
  &__text { display: grid; min-width: 0; }
  &__label { display: block; line-height: 1.5; overflow-wrap: anywhere; }
  &__desc { display: block; font-size: 0.92em; line-height: 1.4; color: var(--color-w-b-2); }
  &__required { margin-left: 3px; color: var(--c-danger, #dc2626); }

  &.is-nowrap &__label,
  &.is-nowrap &__desc {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    overflow-wrap: normal;
  }

  &.is-disabled { cursor: not-allowed; opacity: 0.55; }

  // ── card variant ──
  &--card {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--color-w-b-4);
    border-radius: 10px;
    transition: border-color 0.15s ease, background 0.15s ease;

    &:hover:not(.is-disabled) { border-color: color-mix(in srgb, var(--rc-accent) 50%, var(--color-w-b-4)); }
    &.is-checked {
      border-color: var(--rc-accent);
      background: color-mix(in srgb, var(--rc-accent) 6%, transparent);
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .r-checkbox, .r-checkbox__input, .r-checkbox__input::after { transition: none !important; }
}
</style>