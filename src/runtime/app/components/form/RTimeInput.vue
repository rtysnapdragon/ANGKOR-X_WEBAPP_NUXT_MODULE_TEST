<script setup lang="ts">
import { computed } from 'vue';
import { Time } from '@internationalized/date'

// ─── Types ───────────────────────────────────────────────────────────────────
type SingleValue = InstanceType<typeof Time>
type RangeValue = { start: InstanceType<typeof Time>; end: InstanceType<typeof Time> }

interface Props {
  /** Enable range mode (start + end time) */
  range?: boolean
  /** Label shown above input(s) */
  label?: string
  /** Range start label */
  startLabel?: string
  /** Range end label */
  endLabel?: string
  /** Disabled state */
  disabled?: boolean
  /** Show seconds segment */
  seconds?: boolean
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** Color variant - maps to NuxtUI color */
  color?: 'primary' | 'secondary' | 'neutral' | 'success' | 'warning' | 'error' | 'info'
  /** Variant style */
  variant?: 'outline' | 'soft' | 'subtle' | 'ghost' | 'none'
  /** Placeholder text */
  placeholder?: string
  /** Required field */
  required?: boolean
  /** Error message */
  error?: string
  /** Helper / hint text */
  hint?: string
  /** Additional UInputTime UI overrides (single mode) */
  ui?: Record<string, unknown>
  /** Additional class on root wrapper */
  class?: string
}

// ─── Props & Emits ───────────────────────────────────────────────────────────
const props = withDefaults(defineProps<Props>(), {
  range: false,
  label: '',
  startLabel: 'Start Time',
  endLabel: 'End Time',
  disabled: false,
  seconds: false,
  size: 'md',
  color: 'primary',
  variant: 'outline',
  placeholder: '',
  required: false,
  error: '',
  hint: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: SingleValue | RangeValue]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
}>()

// ─── Model ───────────────────────────────────────────────────────────────────
const modelValue = defineModel<SingleValue | RangeValue>()

const singleValue = computed({
  get: () => (props.range ? new Time(0, 0, 0) : (modelValue.value as SingleValue)),
  set: (v: SingleValue) => {
    if (!props.range) modelValue.value = v
  },
})

const rangeValue = computed({
  get: () =>
    props.range
      ? (modelValue.value as RangeValue)
      : { start: new Time(0, 0, 0), end: new Time(23, 59, 0) },
  set: (v: RangeValue) => {
    if (props.range) modelValue.value = v
  },
})

// Individual range bindings
const startValue = computed({
  get: () => rangeValue.value.start,
  set: (v: SingleValue) => {
    rangeValue.value = { ...rangeValue.value, start: v }
  },
})

const endValue = computed({
  get: () => rangeValue.value.end,
  set: (v: SingleValue) => {
    rangeValue.value = { ...rangeValue.value, end: v }
  },
})

// ─── Shared UI config ─────────────────────────────────────────────────────────
// Merges NuxtUI default slots with Sarika token overrides
const baseUi = computed(() => ({
  base: 'r-time-input__field',
  ...(props.ui ?? {}),
}))

// ─── Derived state ───────────────────────────────────────────────────────────
const hasError = computed(() => !!props.error)
const uid = useId()
</script>

<template>
  <div
    :class="[
      'r-time-input',
      `r-time-input--${size}`,
      { 'r-time-input--range': range, 'r-time-input--disabled': disabled, 'r-time-input--error': hasError },
      props.class,
    ]"
  >
    <!-- Optional outer label -->
    <label v-if="label" :for="uid" class="r-time-input__label">
      {{ label }}
      <span v-if="required" class="r-time-input__required" aria-hidden="true">*</span>
    </label>

    <!-- ── Single mode ── -->
    <template v-if="!range">
      <UInputTime
        :id="uid"
        v-model="singleValue"
        :disabled="disabled"
        :size="size"
        :color="color"
        :variant="variant"
        :placeholder="placeholder || undefined"
        :ui="baseUi"
        class="r-time-input__single"
        @blur="emit('blur', $event)"
        @focus="emit('focus', $event)"
      />
    </template>

    <!-- ── Range mode ── -->
    <template v-else>
      <div class="r-time-input__range-wrap">
        <div class="r-time-input__range-field">
          <span class="r-time-input__range-label">{{ startLabel }}</span>
          <UInputTime
            v-model="startValue"
            :disabled="disabled"
            :size="size"
            :color="color"
            :variant="variant"
            :ui="baseUi"
            class="r-time-input__range-start"
            @blur="emit('blur', $event)"
            @focus="emit('focus', $event)"
          />
        </div>

        <!-- Divider arrow -->
        <span class="r-time-input__range-sep" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>

        <div class="r-time-input__range-field">
          <span class="r-time-input__range-label">{{ endLabel }}</span>
          <UInputTime
            v-model="endValue"
            :disabled="disabled"
            :size="size"
            :color="color"
            :variant="variant"
            :ui="baseUi"
            class="r-time-input__range-end"
            @blur="emit('blur', $event)"
            @focus="emit('focus', $event)"
          />
        </div>
      </div>
    </template>

    <!-- Error message -->
    <p v-if="hasError" class="r-time-input__error" role="alert">
      <UIcon name="i-lucide-alert-circle" class="r-time-input__error-icon" />
      {{ error }}
    </p>

    <!-- Hint text -->
    <p v-else-if="hint" class="r-time-input__hint">{{ hint }}</p>
  </div>
</template>

<style lang="scss">
/* ============================================================
   RTimeInput — Sarika token-based styling
   Overrides UInputTime internals via deep selectors
   ============================================================ */

.r-time-input {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-family: var(--font-fallback);

  // ── Label ────────────────────────────────────────────────
  &__label {
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--c-text);
    letter-spacing: 0.01em;
    display: inline-flex;
    align-items: center;
    gap: 2px;
  }

  &__required {
    color: var(--c-danger);
    font-size: 0.9em;
    line-height: 1;
  }

  // ── Range layout ─────────────────────────────────────────
  &__range-wrap {
    display: flex;
    align-items: flex-end;
    gap: 8px;
  }

  &__range-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
  }

  &__range-label {
    font-size: 0.72rem;
    font-weight: 500;
    color: var(--c-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  &__range-sep {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--c-muted);
    padding-bottom: 2px;
    flex-shrink: 0;
    // align with input bottom edge
    margin-bottom: 2px;
  }

  // ── Error & Hint ─────────────────────────────────────────
  &__error {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.78rem;
    color: var(--c-danger);
    margin: 0;
  }

  &__error-icon {
    font-size: 0.875rem;
    flex-shrink: 0;
  }

  &__hint {
    font-size: 0.78rem;
    color: var(--c-muted);
    margin: 0;
  }

  // ── Disabled state ───────────────────────────────────────
  &--disabled {
    opacity: 0.55;
    pointer-events: none;
  }

  // ── Size modifiers ───────────────────────────────────────
  &--xs { --_input-h: 1.75rem; --_input-fs: 0.75rem; }
  &--sm { --_input-h: 2rem;    --_input-fs: 0.8125rem; }
  &--md { --_input-h: 2.25rem; --_input-fs: 0.875rem; }
  &--lg { --_input-h: 2.625rem;--_input-fs: 0.9375rem; }
  &--xl { --_input-h: 3rem;    --_input-fs: 1rem; }
}

// ── Deep override: UInputTime internal elements ─────────────────────────────
// Targets the NuxtUI v4 `input-time` root wrapper rendered by UInputTime
.r-time-input__field {
  // Root element NuxtUI renders
  &,
  & > [class*="input-time"] {
    height: var(--_input-h, 2.25rem);
    font-size: var(--_input-fs, 0.875rem);
    border-radius: 10px;
    border-color: var(--c-border);
    background: var(--c-surface);
    color: var(--c-text);
    transition: border-color 0.18s ease, box-shadow 0.18s ease;
    font-family: var(--font-fallback);

    &:focus-within {
      border-color: var(--c-accent);
      box-shadow: 0 0 0 3px rgba(255, 140, 66, 0.14), var(--glow-accent-sm);
      outline: none;
    }

    // Segment (hour / minute / second / period) highlight
    [data-segment] {
      color: var(--c-text);
      border-radius: 4px;

      &:focus,
      &[data-focused] {
        background: rgba(255, 140, 66, 0.15);
        color: var(--c-accent);
        outline: none;
      }

      // Placeholder filler chars
      &[data-placeholder] {
        color: var(--c-muted);
      }
    }

    // AM/PM period button
    [data-type="dayPeriod"] {
      font-weight: 600;
      color: var(--c-accent);

      &:focus,
      &[data-focused] {
        background: rgba(255, 140, 66, 0.15);
      }
    }

    // Separator colons
    [data-literal] {
      color: var(--c-muted);
      user-select: none;
    }
  }
}

// ── Error border state ────────────────────────────────────────────────────────
.r-time-input--error {
  .r-time-input__field,
  .r-time-input__field > [class*="input-time"] {
    border-color: var(--c-danger) !important;

    &:focus-within {
      box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.16);
    }
  }
}

// ── Dark mode ─────────────────────────────────────────────────────────────────
.dark {
  .r-time-input__field,
  .r-time-input__field > [class*="input-time"] {
    background: var(--c-surface);
    border-color: var(--c-border);

    [data-segment] {
      color: var(--c-text);
    }
  }
}
</style>
