<script setup>
// RTextarea — SARIKA  (NuxtUI v4.8.2)
// Full UTextarea wrapper + AI translate in trailing slot
// No lang="ts" — plain <script setup>
//
// AI Translate props:
//   :ai="true"  or ai (<RTextarea ai />)            → show translate button in trailing
//   :ai-from="'auto'"       → source lang: 'auto'|'en'|'km'
//   :ai-to="'auto'"         → target lang: 'auto'|'en'|'km'
//   :ai-context="'medical'" → domain hint for better translation
//   :ai-replace="true"      → replace textarea value with translation
//                             (false → show result in popup panel only)

import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAiTranslateHugeFace } from '../../composables/useAiTranslateHugeFace'

// ── Props ─────────────────────────────────────────────────────────────────
const props = defineProps([
  // UTextarea core
  'size',
  'name',
  'rows',
  'maxRows',
  'resize',
  'autoResize',
  'placeholder',
  'disabled',
  'readonly',
  'autofocus',
  'autofocusDelay',
  'highlight',
  'color',
  'icon',
  'variant',
  'trailingIcon',
  'avatar',
  'loading',
  'loadingIcon',
  'maxLength',
  'absolute',
  'ui',
  // SARIKA extras
  'floatingLabel',
  // AI Translate
  'ai',            // boolean — show translate button
  'aiFrom',        // 'auto'|'en'|'km'
  'aiTo',          // 'auto'|'en'|'km'
  'aiContext',     // string — domain hint
  'aiReplace',     // boolean — replace value after translate (default true)
  'aiLabel',       // string — custom button label
])

const emit = defineEmits([
  'update:modelValue',
  'onFocus', 'onBlur', 'onInput',
  'ai-translated',   // { original, translated, from, to }
  'ai-error',        // { error }
])

const value          = defineModel()
const textareaRef    = ref(null)
const nativeTextarea = ref(null)
const { locale }     = useI18n()
const slots = useSlots()
const hasAI = computed(() => slots.ai != null || props.ai != null)
const { translate, loading: aiLoading, error: aiError, lastResult } = useAiTranslateHugeFace()

// ── Char count ────────────────────────────────────────────────────────────
const charCount = computed(() => {
  const v = value.value
  return typeof v === 'string' ? v.length : 0
})

// ── AI translate panel state ───────────────────────────────────────────────
const showPanel  = ref(false)
const panelText  = ref('')
const aiSuccess  = ref(false)
const aiLangFrom = ref('')
const aiLangTo   = ref('')

// ── Resolved AI button label ───────────────────────────────────────────────
const btnLabel = computed(() => {
  if (props.aiLabel) return props.aiLabel
  if (aiLoading.value) return locale.value === 'km' ? 'កំពុងបកប្រែ…' : 'Translating…'
  return locale.value === 'km' ? 'បកប្រែ AI' : 'AI Translate'
})

const btnIcon = computed(() => {
  if (aiLoading.value) return 'ri-loader-4-line'
  if (aiSuccess.value) return 'ri-check-line'
  return 'ri-translate-2'
})

// ── Target lang pill label ─────────────────────────────────────────────────
const targetLangLabel = computed(() => {
  const to   = props.aiTo ?? 'auto'
  const from = props.aiFrom ?? 'auto'
  if (to !== 'auto') return to.toUpperCase()
  // auto: opposite of detected or locale
  if (from !== 'auto') return from === 'km' ? 'EN' : 'ខ្មែរ'
  return locale.value === 'km' ? 'EN' : 'ខ្មែរ'
})

// ── Trigger translate ──────────────────────────────────────────────────────
async function triggerTranslate() {
  const text = value.value?.toString()?.trim()
  if (!text) return

  panelText.value = ''
  showPanel.value = false

  try {
    const result = await translate({
      text,
      from:    props.aiFrom ?? 'auto',
      to:      props.aiTo   ?? 'auto',
      context: props.aiContext,
    })

    panelText.value = result.translated
    aiLangFrom.value = result.detectedFrom.toUpperCase()
    aiLangTo.value   = result.to.toUpperCase()

    if (props.aiReplace !== false) {
      // replace textarea value with translation
      value.value = result.translated
      aiSuccess.value = true
      setTimeout(() => { aiSuccess.value = false }, 2000)
    } else {
      // show result in popup panel
      showPanel.value = true
    }

    emit('ai-translated', {
      original:   text,
      translated: result.translated,
      from:       result.detectedFrom,
      to:         result.to,
    })

  } catch (e) {
    emit('ai-error', { error: e?.message ?? 'Translation failed' })
  }
}

// Apply panel text to textarea
function applyTranslation() {
  value.value   = panelText.value
  showPanel.value = false
}

// ── Expose ─────────────────────────────────────────────────────────────────
onMounted(() => {
  nativeTextarea.value = textareaRef.value?.$el?.querySelector('textarea')
})

defineExpose({
  textarea:  nativeTextarea,
  translate: triggerTranslate,
})

// ── Merged NuxtUI ui ───────────────────────────────────────────────────────
const mergedUi = computed(() => ({
  root:    'w-full relative',
  base:    'r-textarea w-full',
  wrapper: 'relative w-full',
  ...props.ui,
}))
</script>

<template>
  <div class="rtxt-wrap">

    <!-- ── Floating label ───────────────────────────────── -->
    <label v-if="floatingLabel" class="rtxt-float-label">
      {{ floatingLabel }}
    </label>

    <!-- ── Main textarea ────────────────────────────────── -->
    <div class="rtxt-field" :class="{ 'rtxt-field--floating': floatingLabel }">
      <UTextarea
        ref="textareaRef"
        v-model="value"
        :name="name"
        :size="size ?? 'md'"
        :rows="rows ?? 4"
        :maxrows="maxRows"
        :autoresize="autoResize ?? false"
        :resize="resize"
        :placeholder="placeholder ?? (locale === 'km' ? 'សូមបញ្ចូល…' : 'Enter text…')"
        :disabled="disabled"
        :readonly="readonly"
        :autofocus="autofocus"
        :autofocus-delay="autofocusDelay"
        :highlight="highlight ?? false"
        :color="color ?? 'primary'"
        :variant="variant ?? 'outline'"
        :icon="icon"
        :trailing-icon="trailingIcon"
        :avatar="avatar"
        :loading="loading ?? false"
        :loading-icon="loadingIcon"
        :ui="mergedUi"
        class="w-full "
        @blur="$emit('onBlur', $event)"
        @focus="$emit('onFocus', $event)"
        @input="$emit('onInput', $event)"
        @update:model-value="$emit('update:modelValue', $event)"
      >
        <!-- ── Leading slot passthrough ─────────────────── -->
        <template v-if="$slots.leading" #leading>
          <slot name="leading" />
        </template>

        <!-- ── Trailing slot: AI translate OR custom ────── -->
        <template #trailing>
          <slot name="trailing" :hasAI="hasAI">
            <!-- AI translate button (shown when :ai="true") -->
            <div v-if="hasAI" class="rtxt-ai-trail">
              <!-- Target language pill -->
              <span class="rtxt-ai-lang">{{ targetLangLabel }}</span>

              <!-- Translate button -->
              <button
                type="button"
                :disabled="!!disabled || aiLoading"
                :class="[
                  'rtxt-ai-btn',
                  aiLoading && 'rtxt-ai-btn--loading',
                  aiSuccess && 'rtxt-ai-btn--success',
                ]"
                :title="btnLabel"
                @click.stop="triggerTranslate"
              >
                <i
                  :class="[btnIcon, aiLoading && 'rtxt-ai-spin']"
                  aria-hidden="true"
                />
                <span class="rtxt-ai-btn__label">{{ btnLabel }}</span>
                <!-- shimmer sweep while loading -->
                <span v-if="aiLoading" class="rtxt-ai-shimmer" aria-hidden="true" />
              </button>
            </div>
          </slot>
        </template>
      </UTextarea>

      <!-- ── Char counter ──────────────────────────────── -->
      <div
        v-if="maxLength > 0"
        class="rtxt-counter"
        :class="{ 'rtxt-counter--warn': charCount >= maxLength * 0.9 }"
        aria-live="polite"
      >
        {{ charCount }}/{{ maxLength }}
      </div>

      <!-- ── Absolute default slot ─────────────────────── -->
      <div v-if="absolute" class="rtxt-absolute">
        <slot />
      </div>
    </div>

    <!-- ══ AI translate result panel ════════════════════
         Only shown when :ai-replace="false"
    ════════════════════════════════════════════════════ -->
    <Transition name="rtxt-panel">
      <div v-if="showPanel && panelText" class="rtxt-panel">

        <!-- Panel header -->
        <div class="rtxt-panel__head">
          <div class="rtxt-panel__title">
            <i class="ri-translate-2" aria-hidden="true" />
            <span>{{ aiLangFrom }} → {{ aiLangTo }}</span>
            <span class="rtxt-panel__model">claude-haiku-4-5</span>
          </div>
          <button
            type="button"
            class="rtxt-panel__close"
            @click="showPanel = false"
          >
            <i class="ri-close-line" aria-hidden="true" />
          </button>
        </div>

        <!-- Translated text -->
        <div class="rtxt-panel__body">
          <p class="rtxt-panel__text">{{ panelText }}</p>
        </div>

        <!-- Panel actions -->
        <div class="rtxt-panel__foot">
          <button type="button" class="rtxt-panel__copy" @click="showPanel = false">
            <i class="ri-close-line" aria-hidden="true" />
            {{ locale === 'km' ? 'បិទ' : 'Dismiss' }}
          </button>
          <button type="button" class="rtxt-panel__apply" @click="applyTranslation">
            <i class="ri-corner-down-left-line" aria-hidden="true" />
            {{ locale === 'km' ? 'ប្រើប្រាស់' : 'Use translation' }}
          </button>
        </div>

      </div>
    </Transition>

    <!-- ── AI error ───────────────────────────────────── -->
    <Transition name="rtxt-err">
      <div v-if="aiError" class="rtxt-error">
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
.rtxt-wrap {
  display:        flex;
  flex-direction: column;
  gap:            var(--space-2, 8px);
  width:          100%;
  font-family:    var(--font-400, 'Inter', system-ui, sans-serif);
  position:       relative;
}

// ─────────────────────────────────────────────────────────
// FLOATING LABEL
// ─────────────────────────────────────────────────────────
.rtxt-float-label {
  font-size:   0.78rem;
  font-weight: 500;
  color:       var(--c-muted, #8a7f72);
  margin-bottom: 4px;
  display:     block;
}

// ─────────────────────────────────────────────────────────
// FIELD
// ─────────────────────────────────────────────────────────
.rtxt-field {
  position: relative;
  width:    100%;
}

// ─────────────────────────────────────────────────────────
// CHAR COUNTER
// ─────────────────────────────────────────────────────────
.rtxt-counter {
  position:  absolute;
  right:     var(--space-2, 8px);
  bottom:    var(--space-2, 8px);
  font-size: 10px;
  color:     var(--c-muted, #8a7f72);
  pointer-events: none;
  z-index:   2;

  &--warn { color: var(--c-danger, #f87171); font-weight: 600; }
}

// Absolute slot
.rtxt-absolute {
  position:     absolute;
  right:        0;
  bottom:       0;
  margin-right: 10px;
  margin-bottom: 6px;
  font-size:    10px;
  z-index:      2;
}

// ─────────────────────────────────────────────────────────
// AI TRAILING SLOT CONTENT
// ─────────────────────────────────────────────────────────
.rtxt-ai-trail {
  display:     flex;
  align-items: center;
  gap:         6px;
  padding-right: 2px;
}

// Target language pill
.rtxt-ai-lang {
  display:       inline-flex;
  align-items:   center;
  padding:       2px 7px;
  background:    rgba(255, 140, 66, 0.1);
  border:        1px solid rgba(255, 140, 66, 0.2);
  border-radius: var(--radius-full, 9999px);
  font-size:     10px;
  font-weight:   700;
  color:         var(--c-accent, #ff8c42);
  letter-spacing: 0.06em;
  line-height:   1;
  white-space:   nowrap;
}

// Translate button
.rtxt-ai-btn {
  position:      relative;
  display:       inline-flex;
  align-items:   center;
  gap:           5px;
  padding:       4px 10px;
  border:        1px solid var(--c-border, rgba(255,140,66,0.16));
  border-radius: var(--radius-md, 10px);
  background:    var(--c-surface, #fff);
  color:         var(--c-text, #1a1510);
  font-size:     11px;
  font-weight:   600;
  font-family:   var(--font-400, inherit);
  cursor:        pointer;
  overflow:      hidden;
  white-space:   nowrap;
  // @include transition(fast);

  &:hover:not(:disabled) {
    border-color: var(--c-accent, #ff8c42);
    color:        var(--c-accent, #ff8c42);
    background:   rgba(255, 140, 66, 0.06);
  }

  &--loading {
    border-color: var(--c-accent, #ff8c42);
    color:        var(--c-accent, #ff8c42);
    cursor:       wait;
  }

  &--success {
    border-color: var(--c-success, #4ade80);
    color:        var(--c-success, #4ade80);
    background:   rgba(74, 222, 128, 0.06);
  }

  &:disabled { opacity: 0.5; cursor: not-allowed; }

  // &__label {
  //   @include mobile-only { display: none; }
  // }
}

// Shimmer sweep
.rtxt-ai-shimmer {
  position:   absolute;
  inset:      0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 140, 66, 0.22) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation:  rtxt-shimmer 1.2s ease-in-out infinite;
  pointer-events: none;
  border-radius: inherit;
}

@keyframes rtxt-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

// Spin icon
.rtxt-ai-spin { animation: rtxt-spin 0.8s linear infinite; display: inline-block; }
@keyframes rtxt-spin { to { transform: rotate(360deg); } }

// ─────────────────────────────────────────────────────────
// TRANSLATION RESULT PANEL  (ai-replace: false)
// ─────────────────────────────────────────────────────────
.rtxt-panel {
  background:    var(--glass-bg, rgba(255,255,255,0.92));
  backdrop-filter: var(--glass-blur-sm, blur(12px) saturate(150%));
  -webkit-backdrop-filter: var(--glass-blur-sm, blur(12px) saturate(150%));
  border:        1px solid var(--c-border, rgba(255,140,66,0.16));
  border-radius: var(--radius-lg, 16px);
  box-shadow:    var(--glass-shadow, 0 8px 32px rgba(0,0,0,0.08));
  overflow:      hidden;

  &__head {
    display:         flex;
    align-items:     center;
    justify-content: space-between;
    padding:         var(--space-3, 12px) var(--space-4, 16px);
    border-bottom:   1px solid var(--c-border, rgba(255,140,66,0.16));
    gap:             var(--space-2, 8px);
  }

  &__title {
    display:     flex;
    align-items: center;
    gap:         var(--space-2, 8px);
    font-size:   0.82rem;
    font-weight: 600;
    color:       var(--c-text, #1a1510);

    i { color: var(--c-accent, #ff8c42); }
  }

  &__model {
    padding:       2px 7px;
    background:    rgba(255, 140, 66, 0.1);
    border-radius: var(--radius-full, 9999px);
    font-size:     10px;
    font-weight:   600;
    color:         var(--c-accent, #ff8c42);
    font-family:   var(--font-400, 'Fira Code', monospace);
  }

  &__close {
    width:         26px;
    height:        26px;
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
  }

  &__body {
    padding:    var(--space-4, 16px);
    max-height: 160px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--c-accent, #ff8c42) transparent;
  }

  &__text {
    font-size:   0.875rem;
    line-height: 1.65;
    color:       var(--c-text, #1a1510);
    white-space: pre-wrap;
    margin:      0;
  }

  &__foot {
    display:     flex;
    align-items: center;
    justify-content: flex-end;
    gap:         var(--space-2, 8px);
    padding:     var(--space-3, 12px) var(--space-4, 16px);
    border-top:  1px solid var(--c-border, rgba(255,140,66,0.16));
    background:  rgba(0,0,0,0.02);
  }

  &__copy {
    display:       inline-flex;
    align-items:   center;
    gap:           5px;
    padding:       5px 12px;
    border:        1px solid var(--c-border, rgba(255,140,66,0.16));
    border-radius: var(--radius-md, 10px);
    background:    transparent;
    color:         var(--c-muted, #8a7f72);
    font-size:     0.75rem;
    font-weight:   500;
    font-family:   inherit;
    cursor:        pointer;
    // @include transition(fast);
    &:hover { border-color: var(--c-accent, #ff8c42); color: var(--c-accent, #ff8c42); }
    i { font-size: 0.85rem; }
  }

  &__apply {
    display:       inline-flex;
    align-items:   center;
    gap:           5px;
    padding:       5px 12px;
    border:        1px solid var(--c-accent, #ff8c42);
    border-radius: var(--radius-md, 10px);
    background:    var(--c-accent, #ff8c42);
    color:         #fff;
    font-size:     0.75rem;
    font-weight:   600;
    font-family:   inherit;
    cursor:        pointer;
    box-shadow:    0 0 12px rgba(255, 140, 66, 0.2);
    // @include transition(fast);
    &:hover { background: var(--c-accent-2, #ffb347); border-color: var(--c-accent-2, #ffb347); }
    i { font-size: 0.85rem; }
  }
}

// Panel transition
.rtxt-panel-enter-active { transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
.rtxt-panel-leave-active { transition: all 0.15s ease; }
.rtxt-panel-enter-from   { opacity: 0; transform: translateY(-6px) scale(0.98); }
.rtxt-panel-leave-to     { opacity: 0; transform: translateY(-4px); }

// ─────────────────────────────────────────────────────────
// AI ERROR
// ─────────────────────────────────────────────────────────
.rtxt-error {
  display:     flex;
  align-items: center;
  gap:         5px;
  font-size:   0.72rem;
  color:       var(--c-danger, #f87171);
  i { font-size: 0.85rem; }
}

.rtxt-err-enter-active, .rtxt-err-leave-active { transition: all 0.18s ease; }
.rtxt-err-enter-from, .rtxt-err-leave-to { opacity: 0; transform: translateY(-4px); }




// ── Textarea base ─────────────────────────────────────────
:deep(.r-textarea) {  // work with scoped style
  color:            var(--c-text, #1a1510) !important;
  box-shadow:       none !important;
  background:       transparent !important;
  border:           1px solid var(--c-border, rgba(255,140,66,0.16)) !important;
  border-radius:    var(--radius-md, 10px) !important;
  font-size:        13px !important;
  font-family:      var(--font-400, 'Inter', system-ui, sans-serif) !important;
  width:            100% !important;
  padding:          8px 12px !important;
  resize:           none;
  transition:       border-color .15s ease, box-shadow .15s ease !important;
  line-height:      1.6 !important;

  &:focus {
    border-color: var(--c-accent, #ff8c42) !important;
    box-shadow:   0 0 0 3px rgba(255, 140, 66, 0.12) !important;
    outline:      none !important;
  }

  &:disabled {
    background: var(--bg-tertiary, #f1f3f6) !important;
    opacity:    0.65 !important;
    cursor:     not-allowed !important;
  }

  &::placeholder {
    color:     var(--c-muted, #8a7f72) !important;
    font-size: 13px !important;
  }
  
  // ── Trailing icon slot: right-align at top ───────────────
  // UTextarea puts trailing at top-right in multiline mode
  [data-slot="trailing"] {
    position:   absolute !important;
    top:        8px !important;
    right:      8px !important;
    // transform:  none !important;
    padding:    0 !important;
    bottom:     auto !important;
    align-items: flex-start !important;
  }
}

// Dark mode
.dark .r-textarea {
  background: transparent !important;
  color:      var(--c-text, #f0ece4) !important;
  border-color: var(--c-border, rgba(255,140,66,0.12)) !important;
}
</style>
