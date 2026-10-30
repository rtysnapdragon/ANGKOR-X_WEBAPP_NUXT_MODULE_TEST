<template>
  <!--
    Two modes controlled by `inline` prop:
    ─────────────────────────────────────────────────────────────
    inline=false (default) — UPopover wraps everything.
      Trigger: a swatch button showing current color + hex.
      Click → picker opens in a floating panel.

    inline=true — renders the picker directly, no popover.
      Matches the old easylogic behaviour (always visible).
    ─────────────────────────────────────────────────────────────
  -->

  <!-- ── INLINE mode ─────────────────────────────────────────────────────── -->
  <div v-if="inline" class="rcp-root rcp-root--inline">
    <UColorPicker
      :model-value="safeModel"
      :as="as"
      :format="resolvedFormat"
      :throttle="throttle"
      :size="size"
      :disabled="disabled"
      :default-value="resolvedDefault"
      :ui="mergedUI"
      @update:model-value="onUpdate"
    />
    <button
      v-if="eyeDropperSupported"
      class="rcp-eyedrop"
      :class="{ 'rcp-eyedrop--loading': eyeDropLoading }"
      type="button"
      :disabled="disabled || eyeDropLoading"
      :title="trSafe('color.eye_dropper', 'Pick color from screen')"
      @click="openEyeDropper"
    >
      <i v-if="eyeDropLoading" class="ri-loader-4-line rcp-spin" />
      <i v-else class="ri-dropper-fill" />
    </button>
  </div>

  <!-- ── POPOVER mode (default) ──────────────────────────────────────────── -->
  <UPopover
    v-else
    v-model:open="isOpen"
    :content="{
      side: popoverSide,
      align: popoverAlign,
      sideOffset: 6,
    }"
    :arrow="false"
    :ui="{ content: 'rcp-popover-content' }"
    class="rcp-popover-host"
  >
    <!-- ── Trigger slot: swatch button ─────────────────────────────────── -->
    <template #default>
      <slot name="trigger" :color="model" :open="isOpen">
        <button
          class="rcp-trigger"
          :class="[
            `rcp-trigger--${triggerSize}`,
            { 'rcp-trigger--open': isOpen, 'rcp-trigger--disabled': disabled }
          ]"
          type="button"
          :disabled="disabled"
          :aria-label="trSafe('color.pick_color', 'Pick a color')"
        >
          <!-- Swatch preview -->
          <span
            class="rcp-trigger__swatch"
            :style="{ background: displayColor }"
          />
          <!-- Hex/value label (hide when trigger-size is xs/icon-only) -->
          <span v-if="showTriggerLabel" class="rcp-trigger__label">
            {{ displayLabel }}
          </span>
          <!-- Chevron -->
          <i
            class="rcp-trigger__chevron ri-arrow-down-s-line"
            :class="{ 'rcp-trigger__chevron--up': isOpen }"
          />
        </button>
      </slot>
    </template>

    <!-- ── Popover content: the picker + eye dropper ────────────────────── -->
    <template #content>
      <div class="rcp-panel">
        <!-- Header row inside panel -->
        <div v-if="showPanelHeader" class="rcp-panel__header">
          <span class="rcp-panel__title">
            {{ trSafe('color.pick_color', 'Pick a color') }}
          </span>
          <button class="rcp-panel__close" type="button" @click="isOpen = false">
            <i class="ri-close-line" />
          </button>
        </div>

        <!-- The actual color picker -->
        <UColorPicker
          :model-value="safeModel"
          :as="as"
          :format="resolvedFormat"
          :throttle="throttle"
          :size="size"
          :disabled="disabled"
          :default-value="resolvedDefault"
          :ui="mergedUI"
          @update:model-value="onUpdate"
        />

        <!-- Eye dropper row -->
        <div v-if="eyeDropperSupported" class="rcp-panel__footer">
          <button
            class="rcp-eyedrop"
            :class="{ 'rcp-eyedrop--loading': eyeDropLoading }"
            type="button"
            :disabled="disabled || eyeDropLoading"
            :title="trSafe('color.eye_dropper', 'Pick color from screen')"
            @click="openEyeDropper"
          >
            <i v-if="eyeDropLoading" class="ri-loader-4-line rcp-spin" />
            <i v-else class="ri-dropper-fill" />
            <span>{{ trSafe('color.eye_dropper', 'Screen picker') }}</span>
          </button>
        </div>
      </div>
    </template>
  </UPopover>
</template>

<script setup>
import { ColorTranslator } from 'colortranslator'

const props = defineProps({
  // ── UColorPicker native ─────────────────────────────────────────────────
  as:           { type: String,  default: 'div'     },
  format:       { type: String,  default: 'hex'     },
  throttle:     { type: Number,  default: 50        },
  size:         { type: String,  default: 'md'      },
  disabled:     { type: Boolean, default: false     },
  defaultValue: { type: String,  default: '#FFFFFF' },
  ui:           { type: Object,  default: () => ({}) },

  // ── Popover behaviour ───────────────────────────────────────────────────
  /**
   * When true: renders the picker directly (no popover, always visible).
   * When false (default): hides behind a swatch trigger button.
   */
  inline:        { type: Boolean, default: false    },
  /** Popover placement side. @default 'bottom' */
  popoverSide:   { type: String,  default: 'bottom' },
  /** Popover alignment. @default 'start' */
  popoverAlign:  { type: String,  default: 'start'  },
  /** Show title + close button inside the popover panel. @default false */
  showPanelHeader: { type: Boolean, default: false  },

  // ── Trigger button appearance ───────────────────────────────────────────
  /**
   * Size of the swatch trigger button.
   * 'sm'   — swatch only (icon-only, no hex label)
   * 'md'   — swatch + hex value (default)
   * 'lg'   — swatch + hex + chevron, taller
   */
  triggerSize:   { type: String,  default: 'md'     },
  /**
   * Override the label shown in the trigger.
   * Defaults to the current color value (hex/rgb/etc).
   */
  triggerLabel:  { type: String,  default: undefined },

  // ── Backwards-compat shim (old :init="{ color, format }" call-sites) ────
  init: { type: Object, default: undefined },
})

const emit = defineEmits([
  'update:modelValue',
  'onChange',
  'onPicker',
  'open',
  'close',
])

// ── v-model ─────────────────────────────────────────────────────────────────
const model = defineModel({ default: undefined })

// ── Popover open state ───────────────────────────────────────────────────────
const isOpen = ref(false)
watch(isOpen, (v) => emit(v ? 'open' : 'close'))

// ── Color sanitising ─────────────────────────────────────────────────────────
// UColorPicker calls `new ColorTranslator(modelValue || defaultValue)`
// WITHOUT a try/catch in selectorThumbStyle, so any null/undefined/empty
// or malformed colour string throws:
//   "The provided string color doesn't have a correct format"
// Every string that reaches the picker or the swatch must be validated here.
const FALLBACK_COLOR = '#FFFFFF'

function normalizeColor(v, fallback = FALLBACK_COLOR) {
  if (typeof v !== 'string' || !v.trim()) return fallback
  try {
    return new ColorTranslator(v.trim()).HEX
  } catch {
    return fallback
  }
}

// ── Backwards-compat: resolve format + defaultValue from init shim ───────────
const resolvedFormat = computed(() =>
  props.format !== 'hex'
    ? props.format
    : (props.init?.format ?? props.init?.outputFormat ?? 'hex')
)

const resolvedDefault = computed(() => {
  const raw = props.defaultValue !== '#FFFFFF'
    ? props.defaultValue
    : (props.init?.color ?? '#FFFFFF')
  return normalizeColor(raw, FALLBACK_COLOR)
})

// The value fed into UColorPicker — never null/undefined/'', always a valid colour
const safeModel = computed(() =>
  normalizeColor(model.value, resolvedDefault.value)
)

// ── Display (what shows on the trigger) ──────────────────────────────────────
// `displayColor` feeds the swatch background so it MUST be a valid CSS colour.
// `displayLabel` is the human-readable text (honours `triggerLabel` verbatim).
const displayColor = computed(() => safeModel.value)

const displayLabel = computed(() =>
  props.triggerLabel ?? displayColor.value
)

// Only show the hex label when trigger is md or lg
const showTriggerLabel = computed(() =>
  props.triggerSize !== 'sm'
)

// ── Emit forwarding ──────────────────────────────────────────────────────────
function onUpdate(val) {
  model.value = val
  emit('update:modelValue', val)
  emit('onChange', val)
}

// ── Eye dropper ──────────────────────────────────────────────────────────────
const eyeDropperSupported = ref(false)
const eyeDropLoading      = ref(false)

onMounted(() => {
  eyeDropperSupported.value = typeof window !== 'undefined' && 'EyeDropper' in window
})

async function openEyeDropper() {
  emit('onPicker')
  if (!eyeDropperSupported.value) return
  eyeDropLoading.value = true
  try {
    const result = await new window.EyeDropper().open()
    model.value = result.sRGBHex
    emit('update:modelValue', result.sRGBHex)
    emit('onChange', result.sRGBHex)
  } catch (err) {
    if (err?.name !== 'AbortError') console.warn('[RColorPicker]', err)
  } finally {
    eyeDropLoading.value = false
  }
}

// ── Merged UI ────────────────────────────────────────────────────────────────
const mergedUI = computed(() => ({
  root:               'rcp-u-root',
  picker:             'rcp-u-picker',
  selector:           'rcp-u-selector',
  selectorBackground: 'rcp-u-selector-bg',
  selectorThumb:      'rcp-u-selector-thumb',
  track:              'rcp-u-track',
  trackThumb:         'rcp-u-track-thumb',
  ...props.ui,
}))

// ── i18n helper — optional, gracefully absent ────────────────────────────────
const { tr } = useTr?.() ?? {}
function trSafe(key, fallback) {
  return tr ? tr(key) : fallback
}

defineExpose({ isOpen, openEyeDropper, eyeDropperSupported })
</script>

<style lang="scss">
/* ════════════════════════════════════════════════════════════════════════════
   RColorPicker — global SCSS · SARIKA tokens · dark + light
   ════════════════════════════════════════════════════════════════════════════ */

// ── Inline host ──────────────────────────────────────────────────────────────
.rcp-root {
  position:       relative;
  display:        inline-flex;
  flex-direction: column;
  align-items:    center;
  gap:            var(--sp-2);
  font-family:    var(--font-fallback);

  &--inline { /* no extra styles needed */ }
}

// ── Popover host ─────────────────────────────────────────────────────────────
// UPopover renders a wrapper — make it inline so it doesn't stretch to 100%
.rcp-popover-host {
  display: inline-flex !important;
}

// ── UColorPicker slot overrides ──────────────────────────────────────────────
.rcp-u-root,
[data-slot="root"].rcp-u-root {
  position: relative;
  &[data-disabled], &:has([data-disabled]) { opacity: .6; pointer-events: none; }
}

.rcp-u-picker,
[data-slot="picker"].rcp-u-picker {
  display:     flex;
  gap:         var(--sp-3);
  align-items: stretch;
}

.rcp-u-selector,
[data-slot="selector"].rcp-u-selector {
  border-radius: var(--r-md) !important;
  overflow:      hidden;
  touch-action:  none;
  cursor:        crosshair;
  box-shadow:    0 2px 8px color-mix(in srgb, var(--c-text) 12%, transparent),
                 0 0 0 1px var(--c-border);
  transition:    box-shadow var(--t-fast) var(--ease-out);
  &:hover { box-shadow: 0 2px 12px color-mix(in srgb, var(--c-text) 18%, transparent), 0 0 0 1px color-mix(in srgb, var(--c-accent) 40%, transparent); }
}

.rcp-u-selector-bg { width: 100%; height: 100%; position: relative; border-radius: var(--r-md); }

// Thumb shared mixin
%rcp-thumb {
  border-radius: 50% !important;
  box-shadow: 0 0 0 2px #fff, 0 0 0 4px rgba(0,0,0,.25), 0 2px 6px rgba(0,0,0,.3) !important;
  cursor: pointer;
  transition: box-shadow var(--t-fast) var(--ease-out);
  &:hover, &:active {
    box-shadow: 0 0 0 2px #fff, 0 0 0 4px var(--c-accent), 0 2px 8px rgba(0,0,0,.4) !important;
  }
  &[data-disabled] { cursor: not-allowed; }
}

.rcp-u-selector-thumb {
  @extend %rcp-thumb;
  position:  absolute;
  width:     16px; height: 16px;
  border:    none;
  transform: translate(-50%, -50%);
}

.rcp-u-track {
  width: 8px !important;
  border-radius: var(--r-full) !important;
  touch-action: none;
  cursor: ns-resize;
  box-shadow: 0 0 0 1px var(--c-border);
  flex-shrink: 0;
  position: relative;
}

.rcp-u-track-thumb {
  @extend %rcp-thumb;
  position:  absolute;
  width:     16px !important; height: 16px !important;
  left:      50%;
  transform: translate(-50%, -50%);
}

// ── Popover content wrapper ──────────────────────────────────────────────────
// UPopover teleports [data-slot="content"] — so we target globally.
.rcp-popover-content {
  padding:    0 !important;
  border:     none !important;
  background: transparent !important;
  box-shadow: none !important;
  // Remove UPopover's own padding/border — .rcp-panel carries the real surface
}

// ── Panel (the glass card inside the popover) ────────────────────────────────
.rcp-panel {
  display:         flex;
  flex-direction:  column;
  gap:             var(--sp-3);
  padding:         var(--sp-4);
  border-radius:   var(--r-xl);
  border:          1px solid var(--c-border);
  background:      var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  box-shadow:      var(--glass-shadow);
  min-width:       fit-content;

  &__header {
    display:         flex;
    align-items:     center;
    justify-content: space-between;
    gap:             var(--sp-3);
    padding-bottom:  var(--sp-2);
    border-bottom:   1px solid var(--c-border);
  }

  &__title {
    font-size:   0.8rem;
    font-weight: 600;
    color:       var(--c-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  &__close {
    display:         inline-flex;
    align-items:     center;
    justify-content: center;
    width:           24px;
    height:          24px;
    border-radius:   var(--r-full);
    border:          none;
    background:      transparent;
    color:           var(--c-muted);
    font-size:       1rem;
    cursor:          pointer;
    transition:      background var(--t-fast), color var(--t-fast);
    &:hover { background: var(--c-hover); color: var(--c-text); }
  }

  &__footer {
    padding-top:  var(--sp-2);
    border-top:   1px solid var(--c-border);
    display:      flex;
    justify-content: flex-start;
  }
}

// ── Trigger button ────────────────────────────────────────────────────────────
.rcp-trigger {
  display:       inline-flex;
  align-items:   center;
  gap:           var(--sp-2);
  border:        1px solid var(--c-border);
  border-radius: var(--r-md);
  background:    var(--c-surface);
  cursor:        pointer;
  font-family:   var(--font-fallback);
  transition:    border-color var(--t-fast) var(--ease-out),
                 box-shadow   var(--t-fast) var(--ease-out),
                 background   var(--t-fast) var(--ease-out);

  // Sizes
  &--sm { padding: var(--sp-1);               }
  &--md { padding: var(--sp-1) var(--sp-3);   }
  &--lg { padding: var(--sp-2) var(--sp-4);   }

  &:hover:not(.rcp-trigger--disabled) {
    border-color: color-mix(in srgb, var(--c-accent) 50%, var(--c-border));
    box-shadow:   var(--glow-accent-sm);
    background:   color-mix(in srgb, var(--c-accent) 4%, var(--c-surface));
  }

  &--open {
    border-color: var(--c-accent) !important;
    box-shadow:   0 0 0 3px color-mix(in srgb, var(--c-accent) 15%, transparent) !important;
  }

  &--disabled {
    opacity:        0.55;
    cursor:         not-allowed;
    pointer-events: none;
  }

  // The color swatch circle
  &__swatch {
    display:       block;
    flex-shrink:   0;
    border-radius: var(--r-sm);
    border:        1px solid color-mix(in srgb, var(--c-text) 14%, transparent);
    // Size varies by trigger size — use em so it scales
    width:  1.1rem;
    height: 1.1rem;

    .rcp-trigger--lg & { width: 1.25rem; height: 1.25rem; }
  }

  // Hex / color value label
  &__label {
    font-size:      0.78rem;
    font-weight:    600;
    color:          var(--c-text);
    font-family:    ui-monospace, monospace;
    letter-spacing: 0.04em;
    min-width:      56px;
    line-height:    1;

    .rcp-trigger--lg & { font-size: 0.875rem; }
  }

  // Chevron
  &__chevron {
    font-size:  0.9rem;
    color:      var(--c-muted);
    transition: transform var(--t-fast) var(--ease-out);
    margin-left: auto;

    &--up { transform: rotate(180deg); }
  }
}

// ── Eye dropper button ────────────────────────────────────────────────────────
.rcp-eyedrop {
  display:       inline-flex;
  align-items:   center;
  gap:           var(--sp-1);
  padding:       4px var(--sp-2);
  border-radius: var(--r-md);
  border:        1px solid var(--c-border);
  background:    transparent;
  color:         var(--c-muted);
  font-size:     0.75rem;
  font-family:   var(--font-fallback);
  cursor:        pointer;
  transition:    border-color var(--t-fast), color var(--t-fast), background var(--t-fast);

  i { font-size: 0.875rem; display: flex; }

  &:hover:not(:disabled) {
    border-color: var(--c-accent);
    color:        var(--c-accent);
    background:   color-mix(in srgb, var(--c-accent) 8%, transparent);
  }
  &:disabled { opacity: .45; cursor: not-allowed; }
  &--loading { border-color: var(--c-accent); color: var(--c-accent); cursor: wait; }
}

// ── Spinner ───────────────────────────────────────────────────────────────────
.rcp-spin { animation: rcp-spin .7s linear infinite; }
@keyframes rcp-spin { to { transform: rotate(360deg); } }

// ── Dark mode ─────────────────────────────────────────────────────────────────
.dark {
  .rcp-u-selector { box-shadow: 0 2px 12px color-mix(in srgb,#000 40%,transparent), 0 0 0 1px var(--c-border); }
  .rcp-u-track    { box-shadow: 0 0 0 1px var(--c-border); }
  .rcp-trigger    { background: color-mix(in srgb, var(--c-surface) 60%, transparent); }
  .rcp-panel      { box-shadow: 0 8px 32px color-mix(in srgb,#000 50%,transparent), 0 1px 0 color-mix(in srgb,#fff 4%,transparent) inset; }
}
</style>
