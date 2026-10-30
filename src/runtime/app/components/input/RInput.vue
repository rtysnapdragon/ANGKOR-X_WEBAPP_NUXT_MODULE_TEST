<script setup>
// RInput — SARIKA
// Full UInput / UPinInput wrapper with AI auto-fill
// No lang="ts" — plain <script setup>
// AI: useAiGenerate composable → claude-haiku-4-5 (fast, free-tier)
// All props from provided RInput, plus AI extras

import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAiGenerate } from '../../composables/useAiGenerate'

// ── Props ─────────────────────────────────────────────────────────────────
const props = defineProps([
  // UInput core
  'size',           // xs sm md lg xl
  'name',
  'type',           // text|email|password|number|textarea|file|date|tel|url|search
  'ui',
  'icon',
  'highlight',
  'error',
  'variant',        // outline|soft|subtle|ghost|link|none
  'placeholder',
  'autofocus',
  'autofocusDelay',
  'loading',
  'leading',
  'trailing',
  'loadingIcon',
  'leadingIcon',
  'trailingIcon',
  'autocomplete',
  'disabled',
  'readonly',
  'min',
  'max',
  'maxlength',
  'color',
  // Layout helpers
  'score',
  'isRight',
  'isLeft',
  'floatingLabel',
  'padded',
  // UPinInput
  'pininput',
  'mask',
  'totp',
  'placeholderPinInput',
  'length',
  'separator',
  'pinInputUI',
  'typePinInput',
  // AI generate
  'ai',              // boolean — show AI button
  'aiLabel',         // string — button label override
  'aiInstruction',   // string — custom prompt override
  'aiLang',          // 'en'|'km'|'auto'
  'formContext',     // Record<string,unknown> — sibling fields for context
])

const emit = defineEmits([
  'update:modelValue',
  'onFocus', 'onBlur', 'onInput',
  'ai-filled',    // { value, model }
  'ai-error',     // { error }
])

const value   = defineModel()
const refInput = ref(null)
const { t, locale } = useI18n()
const { generate, regenerate, loading: aiLoading, error: aiError, last } = useAiGenerate()

// ── AI state ───────────────────────────────────────────────────────────────
const aiAnimating = ref(false)   // typewriter effect active
const aiSuccess   = ref(false)   // brief green flash after fill
const aiPopover   = ref(false)   // suggestion popover
const focused = ref(false)

// Animate value typewriter style
async function typewrite(text, target) {
  aiAnimating.value = true
  value.value       = ''
  const delay       = Math.max(18, Math.min(60, 900 / text.length))
  for (const ch of text) {
    await new Promise(r => setTimeout(r, delay))
    value.value += ch
  }
  aiAnimating.value = false
  aiSuccess.value   = true
  setTimeout(() => { aiSuccess.value = false }, 1800)
  emit('ai-filled', { value: text, model: 'claude-haiku-4-5' })
}

async function triggerAiGenerate(regen) {
  if (props.disabled) return
  const opts = {
    label:       props.floatingLabel || props.label,
    name:        props.name,
    placeholder: props.placeholder,
    type:        props.type || 'text',
    formContext: props.formContext,
    lang:        props.aiLang || (locale.value === 'km' ? 'km' : 'en'),
    maxLength:   props.maxlength,
    instruction: props.aiInstruction,
  }
  try {
    const fn     = regen ? regenerate : generate
    const result = await fn(opts)
    await typewrite(result.value, value)
  } catch (e) {
    emit('ai-error', { error: e?.message || 'AI error' })
  }
}

// ── Computed labels ────────────────────────────────────────────────────────
const resolvedAiLabel = computed(() =>
  props.aiLabel
    ? props.aiLabel
    : (locale.value === 'km' ? 'បង្កើតដោយ AI' : 'AI Generate')
)

// ── Derived flags ──────────────────────────────────────────────────────────
const isLeft    = computed(() => props.isLeft  ?? false)
const isRight   = computed(() => props.isRight ?? false)
const showAi    = computed(() => !!props.ai)
const isPinInput = computed(() => !!props.pininput)
const floatingLabel = computed(() => props.floatingLabel ?? false)
const aiIconName = computed(() =>
  aiLoading.value ? 'i-lucide-loader-2' : aiSuccess.value ? 'i-lucide-check' : 'i-lucide-sparkles'
)

const slots = useSlots() //Even better (automatic slot detection) behave exactly like Nuxt UI <RInput trailing />

const hasLeading = computed(() => {
  return !!(
    props.leading ||
    props.leadingIcon ||
    props.icon ||
    props.ai ||
    slots.leading
  )
})

const hasTrailing = computed(() => {
  return !!(
    props.trailing ||
    props.trailingIcon ||
    props.loading ||
    slots.trailing
  )
})
const leftPadding = computed(() => hasLeading.value ? '35px' : '12px' )

const rightPadding = computed(() => hasTrailing.value ? '35px' : '12px' )

// Now all of these automatically add padding:

// ✅ <RInput leading />
// ✅ <RInput leading-icon="ri-search-line" />
// ✅ <RInput icon="ri-user-line" />
// ✅ <RInput ai />
// ✅ <template #leading>
// ✅ <RInput trailing />
// ✅ <RInput trailing-icon="ri-close-line" />
// ✅ <template #trailing>
// ── Number watcher (keep only valid numeric chars) ────────────────────────
watch(value, (v) => {
  if (props.type === 'number' && typeof v === 'string') {
    let clean = v.replace(/[^0-9.]/g, '')
    const parts = clean.split('.')
    if (parts.length > 2) clean = parts[0] + '.' + parts[1]
    if (parts[1]) clean = parts[0] + '.' + parts[1].substring(0, 2)
    if (clean !== v) value.value = clean
  }
})

// ── UPinInput UI ──────────────────────────────────────────────────────────
const pinUi = computed(() => ({
  root:      'relative inline-flex items-center gap-1.5',
  base:      'pin-input-base !w-8 !h-8 rounded-md border-0 p-0 placeholder:text-dimmed text-center disabled:cursor-not-allowed disabled:opacity-75 transition-colors text-[12px]',
  separator: 'text-dimmed flex items-center justify-center',
  ...props.pinInputUI,
}))

// ── UInput UI (merged) ────────────────────────────────────────────────────
const inputUi = computed(() => {
  const def = {
    root:    'w-full relative inline-flex items-center',
    base: [
      'r-inp',
      props.error ? 'r-inp--error' : '',
      props.score ? 'r-inp--score' : '',
      'peer transition-colors text-[12px]',
      !props.floatingLabel ? 'rounded-md border-0 appearance-none placeholder:text-dimmed disabled:cursor-not-allowed disabled:opacity-75' : '',
    ].filter(Boolean).join(' '),
    wrapper:     'relative r-input-wrapper',
    leadingIcon: 'leadingIcon text-[12px] text-gray-400',
    trailingIcon:'trailingIcon text-[12px] text-gray-400',
    icon: {
      base:    'flex justify-center items-center',
      leading: { wrapper: 'absolute inset-y-0 start-0 flex items-center ps-3' },
      trailing:{ wrapper: `absolute inset-y-0 end-0 flex items-center pe-3` },
    },
    file: { base: 'file:hidden' },
  }

  // Deep merge with consumer :ui
  return {
    ...def,
    ...props.ui,
    icon: { ...def.icon, ...(props.ui?.icon ?? {}) },
    file: { ...def.file, ...(props.ui?.file ?? {}) },
  }
})

// ── Expose ref ────────────────────────────────────────────────────────────
defineExpose({
  ocInput:       () => refInput.value,
  aiGenerate:    () => triggerAiGenerate(false),
  aiRegenerate:  () => triggerAiGenerate(true),
  inputRef:      refInput,
})
</script>

<template>
  <!-- ══ PinInput mode ════════════════════════════════════ -->
  <div v-if="isPinInput">
    <UPinInput
      v-model="value"
      :length="length ?? 6"
      :type="typePinInput ?? 'number'"
      :mask="mask ?? false"
      :size="size ?? 'md'"
      :disabled="disabled"
      :otp="totp ?? false"
      :placeholder="placeholderPinInput"
      :separator="separator ?? ' '"
      :color="color"
      :highlight="highlight ?? false"
      :error="error ?? false"
      :variant="variant"
      :ui="pinUi"
      @focus="focused = true"
      @blur="focused = false"
    >
      <template v-if="$slots.separator" #separator>
        <UIcon name="i-lucide-minus" class="size-4" />
      </template>
    </UPinInput>
  </div>

  <!-- ══ Regular Input ════════════════════════════════════ -->
  <div v-else class="rinp-wrap">

    <!-- Floating label wrapper -->
    <div class="rinp-field" :class="{ 'rinp-field--floating': floatingLabel }">
      <UInput
        ref="refInput"
        v-model="value"
        :size="size ?? 'md'"
        :name="name"
        :ui="inputUi"
        :type="type ?? 'text'"
        :color="color"
        :highlight="highlight ?? false"
        :error="error ?? false"
        :placeholder="floatingLabel ? ' ' : placeholder"
        :loading="loading"
        :leading="leading"
        :trailing="trailing"
        :loading-icon="loadingIcon"
        :leading-icon="leadingIcon"
        :trailing-icon="trailingIcon"
        :disabled="disabled"
        :readonly="readonly"
        :autocomplete="autocomplete ?? 'off'"
        :autofocus="autofocus"
        :autofocus-delay="autofocusDelay"
        :min="min"
        :max="max"
        :maxlength="maxlength"
        :padded="padded"
        :variant="variant"
        :class="[
          'rinp-input w-full',
          aiAnimating && 'rinp-input--ai-typing',
          aiSuccess   && 'rinp-input--ai-done',
        ]"
        @focus="$emit('onFocus', $event)"
        @blur="$emit('onBlur', $event)"
        @input="$emit('onInput', $event)"
      >
        <!-- Leading slot passthrough -->
        <template v-if="$slots.leading" #leading>
          <slot name="leading" />
        </template>

        <!-- Trailing slot: custom OR floating label -->
        <template v-if="$slots.trailing" #trailing>
          <slot name="trailing" />
          <!-- Float label is rendered outside, not here -->
        </template>
      </UInput>

      <!-- Floating label -->
      <label
        v-if="floatingLabel"
        class="rinp-float-label"
        :class="{ 'rinp-float-label--up': value || placeholder }"
      >
        <span class="rinp-float-label__text">{{ floatingLabel }}</span>
      </label>
    </div>

    <!-- ── AI Generate button ─────────────────────────── -->
    <div v-if="showAi" class="rinp-ai">
      <!-- Main button -->
      <button
        type="button"
        :disabled="!!disabled || aiLoading"
        :class="[
          'rinp-ai__btn',
          aiLoading   && 'rinp-ai__btn--loading',
          aiSuccess   && 'rinp-ai__btn--success',
          aiAnimating && 'rinp-ai__btn--typing',
        ]"
        :title="resolvedAiLabel"
        @click="triggerAiGenerate(false)"
      >
        <!-- Animated sparkle icon -->
        <span class="rinp-ai__icon-wrap">
          <i
            :class="[
              aiLoading   ? 'ri-loader-4-line rinp-ai__spin'      :
              aiSuccess   ? 'ri-checkbox-circle-fill'             :
              aiAnimating ? 'ri-quill-pen-ai-line'                :
                            'ri-sparkling-line',
            ]"
            aria-hidden="true"
          />
        </span>
        <span class="rinp-ai__label">{{ resolvedAiLabel }}</span>

        <!-- Shimmer overlay while loading -->
        <span v-if="aiLoading || aiAnimating" class="rinp-ai__shimmer" aria-hidden="true" />
      </button>

      <!-- Regenerate icon (once we have a value) -->
      <button
        v-if="value && !aiLoading && !aiAnimating"
        type="button"
        :disabled="!!disabled"
        class="rinp-ai__regen"
        :title="locale === 'km' ? 'បង្កើតឡើងវិញ' : 'Regenerate'"
        @click="triggerAiGenerate(true)"
      >
        <i class="ri-refresh-line" aria-hidden="true" />
      </button>
    </div>

    <!-- AI error inline -->
    <Transition name="rinp-err">
      <div v-if="aiError" class="rinp-ai-error">
        <i class="ri-error-warning-line" aria-hidden="true" />
        {{ aiError }}
      </div>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>

// ─────────────────────────────────────────────────────────
// WRAPPER
// ─────────────────────────────────────────────────────────
.rinp-wrap {
  display:        flex;
  align-items:    center;
  gap:            var(--space-2, 8px);
  width:          100%;
  flex-wrap:      wrap;
  font-family:    var(--font-fallback, 'Inter', system-ui, sans-serif);
}

// ─────────────────────────────────────────────────────────
// FIELD (input + floating label)
// ─────────────────────────────────────────────────────────
.rinp-field {
  position: relative;
  flex:     1;
  min-width: 0;

  &--floating { padding-top: 10px; } // room for float label
}

.rinp-input {
  // @include transition(fast);
  &--ai-typing :deep(input) {
    border-color: var(--c-accent, #ff8c42) !important;
    box-shadow:   0 0 0 3px rgba(255,140,66,0.12) !important;
    color:        var(--c-accent, #ff8c42) !important;
  }

  &--ai-done :deep(input) {
    border-color: var(--c-success, #4ade80) !important;
    box-shadow:   0 0 0 3px rgba(74,222,128,0.12) !important;
  }

  :deep(input),
  :deep(textarea) {
    min-height: 38px;
    padding: 1px 0;
    font-family: var(--font-400, 'Inter', system-ui, sans-serif) !important;
    font-size: 13px !important;
    padding-left: v-bind(leftPadding);
    padding-right: v-bind(rightPadding);
    color: var(--c-text, #1a1510) !important;
    border-radius: var(--rounded);
  }

  :deep(input::placeholder),
  :deep(textarea::placeholder) {
    font-family: var(--font-400, 'Inter', system-ui, sans-serif) !important;
  }

  :deep(input:focus) + .rinp-float-label,
  .rinp-input:deep(input:not(:placeholder-shown)) + .rinp-float-label {
    top: 0;
    // transform: translateY(-50%);
    font-size: .72rem;
    color: var(--c-accent);
  }
}
// ─────────────────────────────────────────────────────────
// FLOATING LABEL
// ─────────────────────────────────────────────────────────
.rinp-float-label {
  position:       absolute;
  top:            50%;
  left:           12px;
  transform:      translateY(-50%);
  pointer-events: none;
  transition: .2s ease;
  //  background: var(--c-surface);
  // padding: 0 4px;
  // @include transition(fast);

  &__text {
    font-size:   0.875rem;
    color:       var(--c-muted, #8a7f72);
    background:  var(--c-surface, #fff);
    padding:     0 4px;
    display:     inline-block;
    border-radius: 2px;
    // @include transition(fast);
  }

  &--up,
  :deep(input:focus) ~ &,
  :deep(input:not(:placeholder-shown)) ~ & {
    top:       0;
    transform: translateY(-50%);

    .rinp-float-label__text {
      font-size:   0.72rem;
      font-weight: 500;
      color:       var(--c-accent, #ff8c42);
    }
  }
}

// ─────────────────────────────────────────────────────────
// AI GENERATE BUTTON
// ─────────────────────────────────────────────────────────
.rinp-ai {
  display:     flex;
  align-items: center;
  gap:         6px;
  flex-shrink: 0;

  &__btn {
    position:      relative;
    display:       inline-flex;
    align-items:   center;
    gap:           6px;
    padding:       6px 14px;
    border:        1px solid var(--c-border, rgba(255,140,66,0.16));
    border-radius: var(--radius-md, 10px);
    background:    var(--c-surface, #fff);
    color:         var(--c-text, #1a1510);
    font-size:     0.78rem;
    font-weight:   600;
    font-family:   inherit;
    cursor:        pointer;
    overflow:      hidden;
    white-space:   nowrap;
    // @include transition(fast);

    &:hover:not(:disabled) {
      border-color: var(--c-accent, #ff8c42);
      color:        var(--c-accent, #ff8c42);
      background:   rgba(255,140,66,0.06);
    }

    &--loading {
      border-color: var(--c-accent, #ff8c42);
      color:        var(--c-accent, #ff8c42);
      cursor:       wait;
    }

    &--success {
      border-color: var(--c-success, #4ade80);
      color:        var(--c-success, #4ade80);
      background:   rgba(74,222,128,0.08);
    }

    &--typing {
      border-color: var(--c-accent, #ff8c42);
      color:        var(--c-accent, #ff8c42);
      background:   rgba(255,140,66,0.06);
    }

    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }

  &__icon-wrap {
    display:    flex;
    align-items: center;
    justify-content: center;
    font-size:  0.95rem;
  }

  &__label { line-height: 1; }

  // Shimmer sweep animation
  &__shimmer {
    position:   absolute;
    inset:      0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255,140,66,0.18) 40%,
      rgba(255,179,71,0.25) 50%,
      rgba(255,140,66,0.18) 60%,
      transparent 100%
    );
    background-size: 200% 100%;
    animation:  rinp-shimmer 1.4s ease-in-out infinite;
    pointer-events: none;
    border-radius: inherit;
  }

  // Spinning loader
  &__spin { animation: rinp-spin 0.8s linear infinite; }

  // Regen icon button
  &__regen {
    width:         28px;
    height:        28px;
    border:        1px solid var(--c-border, rgba(255,140,66,0.16));
    border-radius: var(--radius-md, 10px);
    background:    transparent;
    color:         var(--c-muted, #8a7f72);
    cursor:        pointer;
    display:       flex;
    align-items:   center;
    justify-content: center;
    font-size:     0.9rem;
    // @include transition(fast);

    &:hover { border-color: var(--c-accent, #ff8c42); color: var(--c-accent, #ff8c42); }
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

// ─────────────────────────────────────────────────────────
// AI ERROR
// ─────────────────────────────────────────────────────────
.rinp-ai-error {
  width:       100%;
  display:     flex;
  align-items: center;
  gap:         5px;
  font-size:   0.72rem;
  color:       var(--c-danger, #f87171);
  padding:     4px 2px;
  i { font-size: 0.85rem; }
}

.rinp-err-enter-active, .rinp-err-leave-active { transition: all 0.18s ease; }
.rinp-err-enter-from, .rinp-err-leave-to { opacity: 0; transform: translateY(-4px); }



// scoped
.r-inp-ai-score {
  text-align: end;
}

// ── Base input ─────────────────────────────────────────────

// .r-inp input,
// .r-inp textarea {
//   font-family: var(--font-400, 'Inter', system-ui, sans-serif) !important;
//   font-size: 13px !important;
// }

// .r-inp input::placeholder,
// .r-inp textarea::placeholder {
//   font-family: var(--font-400, 'Inter', system-ui, sans-serif) !important;
// }

.r-inp {
  box-shadow:      none !important;
  border:          1px solid var(--color-w-b-4, rgba(255,140,66,0.16)) !important;
  border-radius:   var(--radius-md, 10px) !important;
  font-size:       13px !important;
  color:           var(--c-text, #1a1510) !important;
  height:          38px;
  width:           100%;
  background:      transparent !important;
  font-family:     var(--font-fallback, 'Inter', system-ui, sans-serif) !important;
  // @include transition(fast);

  &:focus {
    // border-color: var(--c-accent, rgb(255, 140, 66,0.2)) !important;
    // box-shadow:   0 0 0 3px rgba(255,140,66,0.12) !important;
    outline:      none !important;
  }

  &:disabled { background: var(--bg-tertiary, #f1f3f6) !important; opacity: 0.65; }

  &::placeholder { color: var(--c-muted, #c6c4c4) !important; font-size: 12px; }

  // Remove number spinners
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button { -webkit-appearance: none !important; margin: 0 !important; }

  // Hide Edge password reveal
  &::-ms-reveal { display: none; }

  &--error {
    border-color: var(--c-danger, #f87171) !important;
    &:focus { box-shadow: 0 0 0 3px rgba(248,113,113,0.12) !important; }
  }

  &--score {
    text-align: end !important;
    
    // ── Leading / trailing slot spacing ───────────────────────
    [data-slot="leading"]  { padding-left:  12px !important; }
    [data-slot="trailing"] {
      position:  absolute;
      top:       50%;
      right:     0;
      transform: translateY(-50%);
      padding-right: 12px !important;
    }
    [data-slot="base"] {
      // padding-left:  12px;
      // padding-right: 12px;
      // padding-left: v-bind('isLeft ?? ui.leading ?? ui.leadingIcon ? "35px" : "12px"') !important;
      // padding-right: v-bind('isRight ?? ui.trailing ?? ui.trailingIcon ? "35px" : "12px"') !important;
      // padding-left: v-bind(leftPadding);
      // padding-right: v-bind(rightPadding);
      // padding-left: v-bind('ui.leading ? "30px" : "12px"') !important;
      // padding-right: v-bind('ui.trailingIcon ? "30px" : "12px"') !important;
      font-size:     13px;
      font-family: var(--font-400);
    }
  }

  // ── Icons ─────────────────────────────────────────────────
  .trailingIcon, .leadingIcon { font-size: 15px !important; }
}

// ── PinInput ──────────────────────────────────────────────
.pin-input-base {
  width:  28px !important;
  height: 28px !important;
  border: 1px solid var(--color-w-b-4, rgba(255,140,66,0.16)) !important;
  border-radius: var(--radius-sm, 6px) !important;
  background: transparent !important;

  &:focus { border-color: var(--c-accent, #ff8c42) !important; }
}

// ── R input wrapper ──────────────────────────────────────
.r-input-wrapper {
  position: relative;
  width: 100%;
}
</style>
