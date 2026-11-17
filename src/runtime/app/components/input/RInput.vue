<script setup>
// RInput — SARIKA
// UInput / UPinInput wrapper (Nuxt UI 4) with AI auto-fill. Plain <script setup>, no TS.
import { ref, computed, watch, useSlots, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAiGenerate } from '../../composables/useAiGenerate'

// Object props (not an array): array-syntax props can't Boolean-cast, so `<RInput ai />`,
// `<RInput disabled />` etc. arrived as '' (falsy) and silently did nothing.
const props = defineProps({
  // UInput core
  size:           { type: String, default: 'md' },          // xs sm md lg xl
  name:           String,
  type:           { type: String, default: 'text' },
  ui:             { type: Object, default: () => ({}) },
  icon:           String,
  highlight:      Boolean,
  error:          [Boolean, String],
  variant:        String,                                   // outline | soft | subtle | ghost | none
  placeholder:    String,
  autofocus:      Boolean,
  autofocusDelay: Number,
  loading:        Boolean,
  leading:        Boolean,
  trailing:       Boolean,
  loadingIcon:    String,
  leadingIcon:    String,
  trailingIcon:   String,
  autocomplete:   { type: String, default: 'off' },
  disabled:       Boolean,
  readonly:       Boolean,
  min:            [Number, String],
  max:            [Number, String],
  maxlength:      [Number, String],
  color:          String,
  // Layout helpers
  label:          String,                                   // AI context only
  floatingLabel:  String,                                   // label text; enables floating mode
  score:          Boolean,                                  // right-align text
  isLeft:         Boolean,                                  // legacy no-op
  isRight:        Boolean,                                  // legacy no-op
  padded:         Boolean,                                  // legacy (v2) no-op
  // UPinInput
  pininput:       Boolean,
  mask:           Boolean,
  totp:           Boolean,                                  // → UPinInput `otp`
  placeholderPinInput: String,
  length:         { type: [Number, String], default: 6 },
  separator:      [Number, Array],                          // 4.9+: group inputs
  pinInputUI:     { type: Object, default: () => ({}) },
  typePinInput:   { type: String, default: 'number' },
  // AI generate
  ai:             Boolean,
  aiLabel:        String,
  aiInstruction:  String,
  aiLang:         String,                                   // en | km | auto
  formContext:    Object,
})

const emit = defineEmits(['onFocus', 'onBlur', 'onInput', 'complete', 'ai-filled', 'ai-error'])

const value    = defineModel()
const refInput = ref(null)
const slots    = useSlots()
const { locale } = useI18n()
const { generate, regenerate, loading: aiLoading, error: aiError } = useAiGenerate()

// ── AI ─────────────────────────────────────────────────────────────────────
const aiAnimating = ref(false)   // typewriter running
const aiSuccess   = ref(false)   // brief success flash

let alive = true
onBeforeUnmount(() => { alive = false })

async function typewrite(text) {
  const str = String(text ?? '')
  aiAnimating.value = true
  value.value = ''
  const delay = Math.max(18, Math.min(60, 900 / (str.length || 1)))
  for (const ch of str) {
    await new Promise((r) => setTimeout(r, delay))
    if (!alive) return
    value.value += ch
  }
  aiAnimating.value = false
  aiSuccess.value = true
  setTimeout(() => { aiSuccess.value = false }, 1800)
  emit('ai-filled', { value: str, model: 'claude-haiku-4-5' })
}

async function triggerAiGenerate(regen) {
  if (props.disabled || aiLoading.value || aiAnimating.value) return // no overlapping runs
  const opts = {
    label:       props.floatingLabel || props.label,
    name:        props.name,
    placeholder: props.placeholder,
    type:        props.type,
    formContext: props.formContext,
    lang:        props.aiLang || (locale.value === 'km' ? 'km' : 'en'),
    maxLength:   props.maxlength,
    instruction: props.aiInstruction,
  }
  try {
    const result = await (regen ? regenerate : generate)(opts)
    await typewrite(result.value)
  } catch (e) {
    emit('ai-error', { error: e?.message || 'AI error' })
  }
}

const resolvedAiLabel = computed(
  () => props.aiLabel || (locale.value === 'km' ? 'បង្កើតដោយ AI' : 'AI Generate'),
)

// ── Derived ────────────────────────────────────────────────────────────────
const isPinInput = computed(() => props.pininput)
const hasValue   = computed(() => value.value !== undefined && value.value !== null && value.value !== '')

// Mirrors UInput's own rule: icon/loading sit on the leading side unless `trailing` is set.
const hasLeading = computed(() => !!(
  slots.leading || props.leadingIcon ||
  ((props.icon || props.loading) && !props.trailing)
))
const hasTrailing = computed(() => !!(
  slots.trailing || props.trailingIcon ||
  ((props.icon || props.loading) && props.trailing)
))
// Passed as CSS vars (not v-bind() in CSS) so the global stylesheet can read them.
const fieldStyle = computed(() => ({
  '--rinp-pl': hasLeading.value ? '35px' : '12px',
  '--rinp-pr': hasTrailing.value ? '35px' : '12px',
}))

// ── Number sanitizer (digits + one dot, max 2 decimals) ────────────────────
watch(value, (v) => {
  if (props.type === 'number' && typeof v === 'string') {
    let clean = v.replace(/[^0-9.]/g, '')
    const parts = clean.split('.')
    if (parts.length > 2) clean = parts[0] + '.' + parts[1]
    if (parts[1]) clean = parts[0] + '.' + parts[1].substring(0, 2)
    if (clean !== v) value.value = clean
  }
})

// ── ui: hook classes per slot; caller's ui is appended, not replacing ──────
function mergeSlots(base, user = {}) {
  return Object.fromEntries(
    [...new Set([...Object.keys(base), ...Object.keys(user)])].map((k) => [
      k,
      [base[k], user[k]].flat().filter(Boolean).join(' '),
    ]),
  )
}

const inputUi = computed(() => mergeSlots({
  root:         'w-full',
  base:         ['r-inp', !!props.error && 'r-inp--error', props.score && 'r-inp--score'],
  leadingIcon:  'rinp-icon',
  trailingIcon: 'rinp-icon',
}, props.ui))

const pinUi = computed(() => mergeSlots({
  root:      'rinp-pin',
  base:      ['rinp-pin__cell', !!props.error && 'rinp-pin__cell--error'],
  separator: 'rinp-pin__sep',
}, props.pinInputUI))

defineExpose({
  ocInput:      () => refInput.value,
  aiGenerate:   () => triggerAiGenerate(false),
  aiRegenerate: () => triggerAiGenerate(true),
  inputRef:     refInput,
})
</script>

<template>
  <!-- ══ PinInput mode ══ -->
  <div v-if="isPinInput">
    <UPinInput
      v-model="value"
      :length="length"
      :type="typePinInput"
      :mask="mask"
      :otp="totp"
      :size="size"
      :disabled="disabled"
      :placeholder="placeholderPinInput"
      :separator="separator"
      :color="error ? 'error' : color"
      :highlight="highlight"
      :variant="variant"
      :ui="pinUi"
      @complete="emit('complete', $event)"
    >
      <template v-if="$slots.separator" #separator="{ index }">
        <slot name="separator" :index="index" />
      </template>
    </UPinInput>
  </div>

  <!-- ══ Regular input ══ -->
  <div v-else class="rinp-wrap">
    <div class="rinp-field" :class="{ 'rinp-field--floating': floatingLabel }" :style="fieldStyle">
      <UInput
        ref="refInput"
        v-model="value"
        :size="size"
        :name="name"
        :ui="inputUi"
        :type="type"
        :color="error ? 'error' : color"
        :highlight="highlight"
        :placeholder="floatingLabel ? ' ' : placeholder"
        :icon="icon"
        :loading="loading"
        :leading="leading"
        :trailing="trailing"
        :loading-icon="loadingIcon"
        :leading-icon="leadingIcon"
        :trailing-icon="trailingIcon"
        :disabled="disabled"
        :readonly="readonly"
        :autocomplete="autocomplete"
        :autofocus="autofocus"
        :autofocus-delay="autofocusDelay"
        :min="min"
        :max="max"
        :maxlength="maxlength"
        :variant="variant"
        :class="['rinp-input w-full', aiAnimating && 'rinp-input--ai-typing', aiSuccess && 'rinp-input--ai-done']"
        @focus="emit('onFocus', $event)"
        @blur="emit('onBlur', $event)"
        @input="emit('onInput', $event)"
      >
        <template v-if="$slots.leading" #leading><slot name="leading" /></template>
        <template v-if="$slots.trailing" #trailing><slot name="trailing" /></template>
      </UInput>

      <label
        v-if="floatingLabel"
        class="rinp-float-label"
        :class="{ 'rinp-float-label--up': hasValue }"
      >
        <span class="rinp-float-label__text">{{ floatingLabel }}</span>
      </label>
    </div>

    <!-- ── AI generate ── -->
    <div v-if="ai" class="rinp-ai">
      <button
        type="button"
        :disabled="disabled || aiLoading || aiAnimating"
        :class="[
          'rinp-ai__btn',
          aiLoading   && 'rinp-ai__btn--loading',
          aiSuccess   && 'rinp-ai__btn--success',
          aiAnimating && 'rinp-ai__btn--typing',
        ]"
        :title="resolvedAiLabel"
        @click="triggerAiGenerate(false)"
      >
        <span class="rinp-ai__icon-wrap">
          <i
            :class="
              aiLoading   ? 'ri-loader-4-line rinp-ai__spin' :
              aiSuccess   ? 'ri-checkbox-circle-fill' :
              aiAnimating ? 'ri-quill-pen-ai-line' :
                            'ri-sparkling-line'
            "
            aria-hidden="true"
          />
        </span>
        <span class="rinp-ai__label">{{ resolvedAiLabel }}</span>
        <span v-if="aiLoading || aiAnimating" class="rinp-ai__shimmer" aria-hidden="true" />
      </button>

      <button
        v-if="value && !aiLoading && !aiAnimating"
        type="button"
        :disabled="disabled"
        class="rinp-ai__regen"
        :title="locale === 'km' ? 'បង្កើតឡើងវិញ' : 'Regenerate'"
        @click="triggerAiGenerate(true)"
      >
        <i class="ri-refresh-line" aria-hidden="true" />
      </button>
    </div>

    <Transition name="rinp-err">
      <div v-if="aiError" class="rinp-ai-error">
        <i class="ri-error-warning-line" aria-hidden="true" />
        {{ aiError }}
      </div>
    </Transition>
  </div>
</template>

<!--
  GLOBAL (non-scoped), namespaced .rinp-* / .r-inp*.
  WHY: the real <input> is rendered inside UInput. Scoped CSS only stamps this
  component's own elements (and child roots), so the old scoped `.r-inp` / `.pin-input-base`
  rules never matched the <input> — error + score styles were dead code. The hook classes
  are injected through the `ui` prop instead and styled here.
  No !important: Tailwind 4 utilities live in @layer; unlayered SFC CSS always wins.
-->
<style lang="scss">
// ── Layout ──
.rinp-wrap {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--sp-2);
  width: 100%;
  font-family: var(--font-400, var(--font-fallback));
}

.rinp-field {
  position: relative;
  flex: 1;
  min-width: 0;

  &--floating { padding-top: 10px; } // room for the raised label
}

// ── Input ──
.r-inp {
  width: 100%;
  height: 38px;
  min-height: 38px;
  padding-block: 0;
  padding-inline: var(--rinp-pl, 12px) var(--rinp-pr, 12px);
  font-family: var(--font-400, var(--font-fallback));
  font-size: 13px;
  color: var(--c-text);
  background: transparent;
  border: 1px solid var(--color-w-b-4);
  border-radius: var(--r-md);
  box-shadow: none; // also kills Nuxt UI's ring-based variants
  outline: none;
  transition: border-color var(--t-fast) var(--ease-in-out), box-shadow var(--t-fast) var(--ease-in-out);

  &:focus,
  &:focus-visible {
    border-color: var(--c-accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--c-accent) 12%, transparent);
  }

  &::placeholder { font-size: 12px; color: var(--c-muted); }

  &:disabled {
    background: var(--bg-tertiary);
    opacity: 0.65;
    cursor: not-allowed;
  }

  // keep transparent background + theme text colour on browser autofill
  &:-webkit-autofill,
  &:-webkit-autofill:hover,
  &:-webkit-autofill:focus {
    -webkit-text-fill-color: var(--c-text);
    caret-color: var(--c-text);
    transition: background-color 99999s ease-in-out 0s;
  }

  // number spinners / Edge reveal
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  &[type='number'] { -moz-appearance: textfield; appearance: textfield; }
  &::-ms-reveal { display: none; }

  &--score { text-align: end; }

  &--error {
    border-color: var(--c-danger);

    &:focus,
    &:focus-visible {
      border-color: var(--c-danger);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--c-danger) 12%, transparent);
    }

    &:-webkit-autofill { -webkit-text-fill-color: var(--c-danger); }
  }
}

.rinp-icon {
  font-size: 15px;
  color: var(--c-muted);
}

// AI states (declared after .r-inp so they win on equal specificity)
.rinp-input--ai-typing .r-inp {
  border-color: var(--c-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--c-accent) 12%, transparent);
  color: var(--c-accent);
}

.rinp-input--ai-done .r-inp {
  border-color: var(--c-success);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--c-success) 12%, transparent);
}

// ── Floating label ──
// The label is a sibling of UInput's root, so `input:focus ~ label` can never match;
// :focus-within on the field is what drives the raise-on-focus.
.rinp-float-label {
  position: absolute;
  top: 50%;
  left: var(--rinp-pl, 12px);
  transform: translateY(-50%);
  pointer-events: none;
  transition: top var(--t-fast) var(--ease-in-out), left var(--t-fast) var(--ease-in-out);

  &__text {
    display: inline-block;
    padding: 0 4px;
    font-size: 0.875rem;
    color: var(--c-muted);
    background: var(--c-surface);
    border-radius: 2px;
    transition: font-size var(--t-fast) var(--ease-in-out), color var(--t-fast) var(--ease-in-out);
  }

  &--up,
  .rinp-field:focus-within > & {
    top: 0;
    left: 12px;

    .rinp-float-label__text {
      font-size: 0.72rem;
      font-weight: 500;
      color: var(--c-accent);
    }
  }
}

// ── PinInput ──
.rinp-pin__cell {
  width: 32px;
  height: 32px;
  padding: 0;
  font-size: 12px;
  text-align: center;
  color: var(--c-text);
  background: transparent;
  border: 1px solid var(--color-w-b-4);
  border-radius: var(--r-sm);
  box-shadow: none;
  outline: none;
  transition: border-color var(--t-fast) var(--ease-in-out), box-shadow var(--t-fast) var(--ease-in-out);

  &:focus,
  &:focus-visible {
    border-color: var(--c-accent);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--c-accent) 12%, transparent);
  }

  &:disabled { opacity: 0.65; cursor: not-allowed; }

  &--error { border-color: var(--c-danger); }
}

.rinp-pin__sep { color: var(--c-muted); }

// ── AI button ──
.rinp-ai {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;

  &__btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    font-family: inherit;
    font-size: 0.78rem;
    font-weight: 600;
    white-space: nowrap;
    color: var(--c-text);
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: var(--r-md);
    cursor: pointer;
    overflow: hidden;
    transition: border-color var(--t-fast) var(--ease-in-out), color var(--t-fast) var(--ease-in-out), background var(--t-fast) var(--ease-in-out);

    &:hover:not(:disabled) {
      border-color: var(--c-accent);
      color: var(--c-accent);
      background: color-mix(in srgb, var(--c-accent) 6%, transparent);
    }

    &--loading,
    &--typing {
      border-color: var(--c-accent);
      color: var(--c-accent);
    }
    &--loading { cursor: wait; }
    &--typing { background: color-mix(in srgb, var(--c-accent) 6%, transparent); }

    &--success {
      border-color: var(--c-success);
      color: var(--c-success);
      background: color-mix(in srgb, var(--c-success) 8%, transparent);
    }

    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }

  &__icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.95rem;
  }

  &__label { line-height: 1; }

  &__shimmer {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    background: linear-gradient(
      90deg,
      transparent 0%,
      color-mix(in srgb, var(--c-accent) 18%, transparent) 40%,
      color-mix(in srgb, var(--c-accent-2) 25%, transparent) 50%,
      color-mix(in srgb, var(--c-accent) 18%, transparent) 60%,
      transparent 100%
    );
    background-size: 200% 100%;
    animation: rinp-shimmer 1.4s ease-in-out infinite;
  }

  &__spin { animation: rinp-spin 0.8s linear infinite; }

  &__regen {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    font-size: 0.9rem;
    color: var(--c-muted);
    background: transparent;
    border: 1px solid var(--c-border);
    border-radius: var(--r-md);
    cursor: pointer;
    transition: border-color var(--t-fast) var(--ease-in-out), color var(--t-fast) var(--ease-in-out);

    &:hover:not(:disabled) { border-color: var(--c-accent); color: var(--c-accent); }
    &:disabled { opacity: 0.4; cursor: not-allowed; }
  }
}

@keyframes rinp-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@keyframes rinp-spin {
  to { transform: rotate(360deg); }
}

// ── AI error ──
.rinp-ai-error {
  display: flex;
  align-items: center;
  gap: 5px;
  width: 100%;
  padding: 4px 2px;
  font-size: 0.72rem;
  color: var(--c-danger);

  i { font-size: 0.85rem; }
}

.rinp-err-enter-active,
.rinp-err-leave-active { transition: all 0.18s ease; }
.rinp-err-enter-from,
.rinp-err-leave-to { opacity: 0; transform: translateY(-4px); }
</style>