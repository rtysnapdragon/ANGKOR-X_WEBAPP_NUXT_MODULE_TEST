<script setup lang="ts">
// RFormField — dynamic field renderer
// Renders the correct input based on FormField.type
import { inject, computed, ref, onMounted } from 'vue'
import type { FormField, SelectOption } from '@/types/form'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  field:   FormField
  modelValue?: unknown
  error?:  string
}>()

const emit = defineEmits<{
  'update:modelValue': [val: unknown]
  blur: [key: string]
  change: [key: string, val: unknown]
}>()

const { t } = useI18n()

// Inject form context if nested inside RForm
const rForm = inject<{
  modelValue: () => Record<string, unknown>
  errors:     { value: Record<string, string> }
  touched:    { value: Record<string, boolean> }
  loading:    () => boolean
  disabled:   () => boolean
  updateField: (k: string, v: unknown) => void
  setError:   (k: string, m: string) => void
  clearError: (k: string) => void
  touch:      (k: string) => void
} | null>('rForm', null)

const fieldValue = computed({
  get: () => props.modelValue ?? rForm?.modelValue()[props.field.key] ?? props.field.defaultValue ?? '',
  set: (val) => {
    if (rForm) rForm.updateField(props.field.key, val)
    emit('update:modelValue', val)
    emit('change', props.field.key, val)
  },
})

const fieldError = computed(() =>
  props.error ?? (rForm ? rForm.errors.value[props.field.key] : undefined)
)

const isDisabled = computed(() =>
  props.field.disabled || (rForm?.disabled() ?? false)
)

// Dynamic options from API
const apiOptions = ref<SelectOption[]>([])
const loadingOptions = ref(false)

onMounted(async () => {
  if (props.field.optionsUrl) {
    loadingOptions.value = true
    try {
      const res = await $fetch<SelectOption[]>(props.field.optionsUrl)
      apiOptions.value = res
    } catch {
      // silent
    } finally {
      loadingOptions.value = false
    }
  }
})

const resolvedOptions = computed(() =>
  apiOptions.value.length ? apiOptions.value : (props.field.options ?? [])
)

const label = computed(() => {
  if (!props.field.label) return ''
  try { return t(props.field.label) } catch { return props.field.label }
})

const placeholder = computed(() => {
  if (!props.field.placeholder) return ''
  try { return t(props.field.placeholder) } catch { return props.field.placeholder }
})

const spanClass = computed(() =>
  props.field.cols ? `r-field--span-${props.field.cols}` : ''
)

function handleBlur() {
  rForm?.touch(props.field.key)
  emit('blur', props.field.key)
}
</script>

<template>
  <!-- Decorators: divider / heading -->
  <div v-if="field.type === 'divider'" class="r-field-divider" :class="spanClass" />
  <div v-else-if="field.type === 'heading'" class="r-field-heading" :class="spanClass">
    <slot name="heading">{{ label }}</slot>
  </div>
  <input v-else-if="field.type === 'hidden'" type="hidden" :name="field.key" :value="String(fieldValue)" />

  <!-- Regular fields -->
  <div
    v-else
    :class="['r-field', spanClass, { 'r-field--error': !!fieldError }]"
    :style="field.cols && field.cols > 1 ? { gridColumn: `span ${field.cols}` } : {}"
  >
    <!-- Label -->
    <label v-if="label" class="r-field__label">
      {{ label }}
      <span v-if="field.validation?.required" class="r-field__required" aria-hidden="true">*</span>
      <span v-if="!field.validation?.required" class="r-field__optional">
        ({{ $t('optional') }})
      </span>
    </label>

    <!-- ── Textarea ── -->
    <textarea
      v-if="field.type === 'textarea'"
      v-model="fieldValue"
      class="r-field__input r-field__textarea"
      :placeholder="placeholder"
      :disabled="isDisabled"
      :readonly="field.readonly"
      :rows="field.rows ?? 4"
      @blur="handleBlur"
    />

    <!-- ── Select ── -->
    <div v-else-if="field.type === 'select'" class="r-field__select-wrap">
      <select
        v-model="fieldValue"
        class="r-field__input r-field__select"
        :disabled="isDisabled || loadingOptions"
        @blur="handleBlur"
      >
        <option value="" disabled>{{ placeholder || $t('select') }}</option>
        <option
          v-for="opt in resolvedOptions"
          :key="String(opt.value)"
          :value="opt.value"
          :disabled="opt.disabled"
        >{{ opt.label }}</option>
      </select>
      <UIcon name="i-lucide-chevron-down" class="r-field__select-arrow" />
    </div>

    <!-- ── Multiselect (USelectMenu) ── -->
    <USelectMenu
      v-else-if="field.type === 'multiselect'"
      v-model="fieldValue"
      :options="resolvedOptions"
      :placeholder="placeholder"
      :disabled="isDisabled"
      multiple
      class="r-field__uselect"
      @blur="handleBlur"
    />

    <!-- ── Toggle ── -->
    <div v-else-if="field.type === 'toggle'" class="r-field__toggle-wrap">
      <button
        type="button"
        role="switch"
        :aria-checked="!!fieldValue"
        :class="['r-toggle', { 'r-toggle--on': !!fieldValue }]"
        :disabled="isDisabled"
        @click="fieldValue = !fieldValue"
      >
        <span class="r-toggle__thumb" />
      </button>
    </div>

    <!-- ── Checkbox ── -->
    <label v-else-if="field.type === 'checkbox'" class="r-field__checkbox-wrap">
      <input
        type="checkbox"
        v-model="fieldValue"
        class="r-field__checkbox"
        :disabled="isDisabled"
        @blur="handleBlur"
      />
      <span class="r-field__checkbox-label">{{ placeholder }}</span>
    </label>

    <!-- ── Radio group ── -->
    <div v-else-if="field.type === 'radio'" class="r-field__radio-group">
      <label
        v-for="opt in resolvedOptions"
        :key="String(opt.value)"
        class="r-field__radio-item"
      >
        <input
          type="radio"
          :value="opt.value"
          v-model="fieldValue"
          class="r-field__radio"
          :disabled="isDisabled || opt.disabled"
        />
        <span>{{ opt.label }}</span>
      </label>
    </div>

    <!-- ── Range ── -->
    <div v-else-if="field.type === 'range'" class="r-field__range-wrap">
      <input
        type="range"
        v-model="fieldValue"
        class="r-field__range"
        :min="field.validation?.min ?? 0"
        :max="field.validation?.max ?? 100"
        :disabled="isDisabled"
      />
      <span class="r-field__range-val">{{ fieldValue }}</span>
    </div>

    <!-- ── File ── -->
    <div v-else-if="field.type === 'file'" class="r-field__file-wrap">
      <label class="r-field__file-label">
        <UIcon name="i-lucide-upload" />
        <span>{{ placeholder || 'Choose file' }}</span>
        <input
          type="file"
          :accept="field.accept"
          :multiple="field.multiple"
          :disabled="isDisabled"
          class="r-field__file-input"
          @change="fieldValue = ($event.target as HTMLInputElement).files"
        />
      </label>
    </div>

    <!-- ── Default: text, email, password, number, tel, url, date, datetime, color ── -->
    <div v-else class="r-field__input-wrap">
      <UIcon v-if="field.icon" :name="field.icon" class="r-field__input-icon" />
      <span v-if="field.prefix" class="r-field__affix r-field__prefix">{{ field.prefix }}</span>
      <input
        :type="field.type"
        v-model="fieldValue"
        :class="['r-field__input', { 'r-field__input--has-icon': field.icon, 'r-field__input--has-prefix': field.prefix }]"
        :placeholder="placeholder"
        :disabled="isDisabled"
        :readonly="field.readonly"
        :minlength="field.validation?.minLength"
        :maxlength="field.validation?.maxLength"
        :min="field.validation?.min"
        :max="field.validation?.max"
        :pattern="field.validation?.pattern"
        :autocomplete="field.type === 'password' ? 'current-password' : 'off'"
        @blur="handleBlur"
      />
      <span v-if="field.suffix" class="r-field__affix r-field__suffix">{{ field.suffix }}</span>
    </div>

    <!-- Hint -->
    <p v-if="field.hint && !fieldError" class="r-field__hint">{{ field.hint }}</p>
    <!-- Error -->
    <p v-if="fieldError" class="r-field__error" role="alert">
      <UIcon name="i-lucide-alert-circle" />
      {{ fieldError }}
    </p>
  </div>
</template>

<style lang="scss" scoped>

/* ── Decorators ── */
.r-field-divider {
  height: 1px;
  background: var(--c-border);
  grid-column: 1 / -1;
  margin: var(--space-2) 0;
}
.r-field-heading {
  font-size:   0.78rem;
  font-weight: 700;
  color:       var(--c-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  grid-column: 1 / -1;
}

/* ── Field wrapper ── */
.r-field {
  display:       flex;
  flex-direction: column;
  gap:           var(--space-2);

  &--span-2 { grid-column: span 2; }
  &--span-3 { grid-column: span 3; }
  &--span-4 { grid-column: span 4; }

  // @include mobile-only {
  //   &--span-2, &--span-3, &--span-4 { grid-column: span 1; }
  // }

  &__label {
    font-size:   0.82rem;
    font-weight: 500;
    color:       var(--c-text);
    display:     flex;
    gap:         4px;
    align-items: baseline;
  }

  &__required { color: var(--c-danger); }
  &__optional { font-size: 0.72rem; color: var(--c-muted); font-weight: 400; }

  /* Common input style */
  &__input {
    width:       100%;
    height:      38px;
    padding:     0 var(--space-3);
    font-family: var(--font-fallback);
    font-size:   0.875rem;
    color:       var(--c-text);
    background:  var(--c-surface);
    border:      1px solid var(--c-border);
    border-radius: var(--radius-md);
    outline:     none;
    // @include transition(fast);
    // @include focus-ring;

    &::placeholder { color: var(--c-muted); }

    &:focus {
      border-color: var(--c-accent);
      box-shadow:   0 0 0 3px rgba(255,140,66,0.12);
    }

    &:disabled { opacity: 0.5; cursor: not-allowed; }

    &--has-icon    { padding-left: 36px; }
    &--has-prefix  { padding-left: 48px; }
  }

  &__textarea {
    height: auto;
    padding: var(--space-3);
    resize: vertical;
    min-height: 80px;
    line-height: 1.6;
  }

  &--error .r-field__input,
  &--error .r-field__select {
    border-color: var(--c-danger);
    &:focus { box-shadow: 0 0 0 3px rgba(248,113,113,0.12); }
  }

  /* Input wrap with icon */
  &__input-wrap {
    position: relative;
    display:  flex;
    align-items: center;
  }

  &__input-icon {
    position:  absolute;
    left:      10px;
    color:     var(--c-muted);
    font-size: 1rem;
    pointer-events: none;
  }

  &__affix {
    font-size: 0.82rem;
    color:     var(--c-muted);
    position:  absolute;
    pointer-events: none;
  }
  &__prefix { left: var(--space-3); }
  &__suffix { right: var(--space-3); }

  /* Select */
  &__select-wrap {
    position: relative;
  }
  &__select {
    appearance: none;
    cursor: pointer;
    padding-right: 36px;
  }
  &__select-arrow {
    position: absolute;
    right: 10px;
    top:   50%;
    transform: translateY(-50%);
    color: var(--c-muted);
    pointer-events: none;
  }

  /* Toggle */
  &__toggle-wrap { display: flex; align-items: center; }

  /* Checkbox */
  &__checkbox-wrap {
    display:     flex;
    align-items: center;
    gap:         var(--space-2);
    cursor:      pointer;
  }
  &__checkbox {
    width:  16px;
    height: 16px;
    accent-color: var(--c-accent);
    cursor: pointer;
  }
  &__checkbox-label { font-size: 0.875rem; color: var(--c-text); }

  /* Radio */
  &__radio-group { display: flex; flex-wrap: wrap; gap: var(--space-3); }
  &__radio-item  { display: flex; align-items: center; gap: var(--space-2); cursor: pointer; font-size: 0.875rem; }
  &__radio       { accent-color: var(--c-accent); }

  /* Range */
  &__range-wrap { display: flex; align-items: center; gap: var(--space-3); }
  &__range      { flex: 1; accent-color: var(--c-accent); }
  &__range-val  { font-size: 0.82rem; color: var(--c-accent); font-weight: 600; min-width: 32px; text-align: center; }

  /* File */
  &__file-label {
    display:       flex;
    align-items:   center;
    gap:           var(--space-2);
    padding:       var(--space-3) var(--space-4);
    border:        1px dashed var(--c-border);
    border-radius: var(--radius-md);
    cursor:        pointer;
    color:         var(--c-muted);
    font-size:     0.875rem;
    // @include transition(fast);
    &:hover { border-color: var(--c-accent); color: var(--c-accent); }
  }
  &__file-input { display: none; }

  /* Hint & Error */
  &__hint  { font-size: 0.75rem; color: var(--c-muted); }
  &__error {
    font-size: 0.75rem;
    color:     var(--c-danger);
    display:   flex;
    align-items: center;
    gap:       4px;
  }

  /* USelectMenu override */
  &__uselect { width: 100%; }
}

/* Toggle component */
.r-toggle {
  width:  44px;
  height: 24px;
  border-radius: var(--radius-full);
  background: var(--c-border);
  border: none;
  cursor: pointer;
  padding: 2px;
  position: relative;
  // @include transition(fast);

  &--on {
    background: var(--c-accent);
    box-shadow: var(--glow-accent-sm);
  }

  &__thumb {
    display: block;
    width:   20px;
    height:  20px;
    border-radius: 50%;
    background: #fff;
    // @include transition(fast);
    transform: translateX(0);

    .r-toggle--on & { transform: translateX(20px); }
  }
}
</style>
