<template>
  <div
    class="r-radios"
    :class="[modeCheckBox ? 'r-radios--checkbox' : 'r-radios--radio', { 'is-disabled': disabled }]"
  >
    <!--
      Single-item mode.
      A native RadioGroup can't be unchecked once selected (that's correct radio
      semantics) — but a lone option almost always means "toggle this one thing
      on/off", so it renders as a real toggle instead of a locked-in radio.
    -->
    <button
      v-if="isSingle"
      type="button"
      class="r-radios__single"
      role="checkbox"
      :aria-checked="singleChecked"
      :disabled="disabled"
      @click="toggleSingle"
    >
      <span class="r-radios__box">
        <span class="r-radios__dot" />
      </span>
      <span class="r-radios__label" v-if="$slots.label || singleLabel">
        <slot name="label" :option="singleOption">{{ singleLabel }}</slot>
      </span>
    </button>

    <URadioGroup
      v-else
      v-model="select"
      :items="normalizedItems"
      :disabled="disabled"
      :ui="ui"
      orientation="horizontal"
      @change="(v) => emit('onChange', v)"
    >
      <template #label="{ item }" v-if="$slots.label">
        <slot name="label" :option="item" />
      </template>
    </URadioGroup>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const select = defineModel()

const props = defineProps({
  ui: { type: Object, default: () => ({}) },
  options: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
  // Legacy field-name bridge — lets old callers keep passing
  // :option-attribute / :value-attribute without touching their data.
  optionAttribute: { type: String, default: 'label' },
  valueAttribute: { type: String, default: 'value' },
  modeCheckBox: { type: Boolean, default: false }, // visual only: square vs circle
})

const emit = defineEmits(['onChange'])

// Nuxt UI v4's URadioGroup expects { label, value } (or plain strings/numbers).
// This normalizes whatever field names the caller's data actually uses.
const normalizedItems = computed(() =>
  (props.options || []).map((opt) => {
    if (opt === null || typeof opt !== 'object') return opt
    return {
      ...opt,
      label: opt.label ?? opt[props.optionAttribute],
      value: opt.value ?? opt[props.valueAttribute],
    }
  })
)

const isSingle = computed(() => normalizedItems.value.length === 1)
const singleOption = computed(() => normalizedItems.value[0])
const singleLabel = computed(() =>
  typeof singleOption.value === 'object' ? singleOption.value?.label : singleOption.value
)
const singleValue = computed(() =>
  typeof singleOption.value === 'object' ? singleOption.value?.value : singleOption.value
)
const singleChecked = computed(() => select.value === singleValue.value)

function toggleSingle() {
  if (props.disabled) return
  select.value = singleChecked.value ? undefined : singleValue.value
  emit('onChange', select.value)
}

const ui = computed(() => {
  const defaultUI = {
    root: 'ui-rradio-root relative',
    fieldset: 'ui-rradio-fieldset flex flex-wrap items-center gap-x-5 gap-y-3',
    legend: 'ui-rradio-legend mb-1 block font-medium text-default',
    item: 'ui-rradio-item flex items-center',
    container: 'ui-rradio-container flex items-center',
    base: 'ui-rradio-base size-4 overflow-hidden',
    indicator: 'ui-rradio-indicator flex items-center justify-center size-full',
    wrapper: 'ui-rradio-wrapper',
    label: 'ui-rradio-label',
    description: 'ui-rradio-description text-muted',
  }

  return { ...defaultUI, ...props.ui }
})
</script>

<style lang="scss">
.ui-rradio-root {
  .ui-rradio-item {
    width: fit-content;
    display: flex;
    flex-direction: row;
    justify-content: center;
    gap: 5px;
  }
  .ui-rradio-wrapper{
    width: fit-content;
    padding: 0 !important;
    margin: 0 !important;
    &:last-child {
      width: 100%;
    }
  }
  .ui-rradio-fieldset{
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: center;
    gap: 10px;
  }
}
// ─── Shared look for both the URadioGroup items and the single-item toggle ───
.r-radios {
  &.is-disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  // ── URadioGroup path — styled via the explicit ui-rradio-* hook classes ──
  .ui-rradio-label {
    font-size: 12px;
    font-weight: 400;
    color: var(--c-text);
    cursor: pointer;
    line-height: 1;
  }

  .ui-rradio-legend {
    font-size: 12px;
    font-weight: 500;
    color: var(--c-text);
  }

  .ui-rradio-description {
    font-size: 11px;
    color: var(--c-muted);
  }

  .ui-rradio-base {
    width: 16px;
    height: 16px;
    border: 1.5px solid var(--c-border);
    background: var(--c-surface);
    box-shadow: none;
    transition: border-color var(--t-fast, .15s) var(--ease-in-out), background-color var(--t-fast, .15s) var(--ease-in-out);

    &:focus-visible {
      outline: 2px solid var(--c-accent);
      outline-offset: 2px;
    }

    &[data-state="checked"] {
      border-color: var(--c-accent);
      background: var(--c-accent);
    }
  }

  .ui-rradio-indicator {
    &::after {
      content: "";
      background: #fff;
      transform: scale(1);
      transition: transform var(--t-fast, .15s) var(--ease-in-out);
    }
  }

  &--radio .ui-rradio-base {
    border-radius: var(--r-full, 9999px);
  }
  &--radio .ui-rradio-indicator::after {
    width: 6px;
    height: 6px;
    border-radius: var(--r-full, 9999px);
  }

  &--checkbox .ui-rradio-base {
    border-radius: 5px;
  }
  &--checkbox .ui-rradio-indicator::after {
    width: 8px;
    height: 8px;
    border-radius: 2px;
    clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
  }

  // ── Single-item toggle path ──
  &__single {
    all: unset;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;

    &:disabled {
      cursor: not-allowed;
    }

    &:focus-visible &__box {
      outline: 2px solid var(--c-accent);
      outline-offset: 2px;
    }
  }

  &__box {
    position: relative;
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    border: 1.5px solid var(--c-border);
    background: var(--c-surface);
    transition: border-color var(--t-fast, .15s) var(--ease-in-out), background-color var(--t-fast, .15s) var(--ease-in-out);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__dot {
    width: 6px;
    height: 6px;
    background: #fff;
    transform: scale(0);
    transition: transform var(--t-fast, .15s) var(--ease-in-out);
  }

  &--radio &__box {
    border-radius: var(--r-full, 9999px);
  }
  &--radio &__dot {
    border-radius: var(--r-full, 9999px);
  }

  &--checkbox &__box {
    border-radius: 5px;
  }
  &--checkbox &__dot {
    width: 8px;
    height: 8px;
    border-radius: 2px;
    clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
  }

  &__single[aria-checked="true"] &__box {
    border-color: var(--c-accent);
    background: var(--c-accent);
  }
  &__single[aria-checked="true"] &__dot {
    transform: scale(1);
  }

  &__label {
    font-size: 12px;
    font-weight: 400;
    color: var(--c-text);
    line-height: 1;
  }
}
</style>