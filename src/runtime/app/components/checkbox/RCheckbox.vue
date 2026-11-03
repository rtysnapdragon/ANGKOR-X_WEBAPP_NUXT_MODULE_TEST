<template>
  <!--
    UCheckbox in NuxtUI v4 renders its internal checkbox via Reka UI primitives.
    The [data-slot="base"] element IS in the component's DOM tree (not teleported),
    so global (non-scoped) CSS targeting data-slot attributes works fine here.
    We inject .rcb-base onto the input via inputClass so we have a stable hook.
  -->
  <UCheckbox
    v-model="select"
    :ui="mergedUI"
    :label="label"
    :name="props.name"
    :help="props.help"
    :required="props.required"
    :indeterminate="props.indeterminate"
    :disabled="props.disabled"
    :value="props.value"
    :id="computedId"
    :color="props.color"
    :icon="props.icon ?? 'ri-check-line'"
    v-bind="$attrs"
    :style="{ '--rcb-radius': radiusMap[rounded] }"
  >
    <template v-if="$slots.label" #label>
      <slot name="label" />
    </template>
  </UCheckbox>
</template>

<script setup>
import { computed } from 'vue'
const select = defineModel()

const props = defineProps({
  ui:            { type: Object,  default: () => ({}) },
  label:         { type: String,  default: undefined  },
  name:          { type: String,  default: undefined  },
  help:          { type: String,  default: undefined  },
  required:      { type: Boolean, default: false      },
  value:         { type: [String, Number, Boolean, Object], default: undefined },
  disabled:      { type: Boolean, default: false      },
  id:            { type: String,  default: undefined  },
  indeterminate: { type: Boolean, default: false      },
  size:          { type: String,  default: 'md'       }, // 'sm' | 'md' | 'lg'
  color:         { type: String,  default: 'primary'   }, // 'primary' | 'accent' | 'danger' | 'info' | 'warning' | 'muted' | 'none'
  rounded:       { type: Boolean, default: false      },
  hasBorder:     { type: Boolean, default: false      },
  icon:          { type: String,  default: 'ri-check-line' },
  variant:       { type: String,  default: 'list' },    // card, list
})

const computedId = computed(() => props.id)
const rounded = computed(() => props.rounded ? 'md' : 'none')
const radiusMap = {
  '2xs': 'var(--rounded-2xs)',
  xs: 'var(--rounded-xs)',
  sm: 'var(--rounded-s)',
  md: 'var(--rounded-m)',
  lg: 'var(--rounded)',
  xl: 'var(--border-radius)',
  full: '9999px',
}
/*
 * ui prop for UCheckbox v4:
 * All values must be plain strings (NuxtUI v4 uses tv() / tailwind-variants).
 * We inject our own class names as the ONLY value per slot — no Tailwind classes
 * since TW4 isn't working in this project; everything is driven by the global SCSS.
 *
 * Key slots:
 *   root      — outermost wrapper div
 *   base      — the <input type="checkbox"> element itself
 *   indicator — the checkmark container shown when checked
 *   icon      — the SVG/icon inside indicator
 *   inner     — wrapper around label + help
 *   label     — the <label> element
 *   help      — the help text
 */
const mergedUI = computed(() => {
  const colorClass = `rcb--${props.color}`
  const sizeClass  = `rcb--${props.size}`

  const base = {
    root:      `rcb-root ${sizeClass} ${colorClass}`,
    container:  'rcb-container',
    base:      [`rcb-base`, `rcb--rounded-${rounded.value}`,
      "border border-(--color-w-b-3)",
      "data-[state=checked]:bg-primary/10",
      "data-[state=checked]:border-primary",
      "data-[state=checked]:text-primary",
      "data-[state=indeterminate]:bg-primary/10",
      "data-[state=indeterminate]:border-primary",
    ].join(" "),
    indicator: 'rcb-indicator',
    icon:      'rcb-icon',
    inner:     'rcb-inner',
    label:     'rcb-label',
    help:      'rcb-help',
    required:  'rcb-required',
  }

  // Safe merge: caller can override any slot string
  return { ...base, ...(props.ui ?? {}) }
})

// Bug fix: was `mounted()` — should be `onMounted()`
// Nothing needed here for now; kept as a hook for future use.
onMounted(() => {})
</script>

<style lang="scss">
/* ════════════════════════════════════════════════════════════════════════════
   RCheckbox — global SCSS (no scoped, no Tailwind)
   Targets UCheckbox's internal [data-slot] and [data-state] attributes.

   WHY GLOBAL (not scoped)?
   UCheckbox renders its internals inline (not teleported), so the elements
   ARE in the DOM tree. However, [data-slot] attributes are on UCheckbox's
   own child elements. Vue's scoped [data-v-xxx] is only stamped on elements
   this component renders directly — UCheckbox's internals don't get it.
   So :deep() in a scoped block would need the attribute to be present, which
   it is — but the generated selector becomes:
     [data-slot="base"][data-v-xxx]   ← never matches (UCheckbox owns that element)
   Global CSS with our .rcb-root namespace is the correct approach.
   ════════════════════════════════════════════════════════════════════════════ */

// ── Color map — maps prop `color` to SARIKA tokens ─────────────────────────
$rcb-colors: (
  'accent':  var(--c-accent),
  'success': var(--c-success),
  'danger':  var(--c-danger),
  'info':    var(--c-info),
  'warning': var(--c-accent-2),
);

// ── Root wrapper ────────────────────────────────────────────────────────────
.rcb-root {
  position:    relative;
  display:     flex;
  align-items: flex-start;
  gap:         var(--sp-2);
  font-family: var(--font-400,var(--font-fallback));
  width:       100%;

  // ── Sizes ────────────────────────────────────────────────────────────────
  &.rcb--sm {
    --rcb-size:        14px;
    --rcb-radius:      3px;
    --rcb-icon-size:   8px;
    --rcb-label-size:  0.75rem;
  }
  &.rcb--md {
    --rcb-size:        16px;
    --rcb-radius:      4px;
    --rcb-icon-size:   10px;
    --rcb-label-size:  0.8125rem;
  }
  &.rcb--lg {
    --rcb-size:        18px;
    --rcb-radius:      5px;
    --rcb-icon-size:   12px;
    --rcb-label-size:  0.875rem;
  }

  // ── Color: map --rcb-color from color prop class ────────────────────────
  @each $name, $token in $rcb-colors {
    &.rcb--#{$name} { --rcb-color: #{$token}; }
  }

  // ── Disabled state ────────────────────────────────────────────────────────
  &:has([data-disabled]) {
    opacity: 0.55;
    cursor:  not-allowed;
    pointer-events: none;
  }
}

// ── The checkbox input element ─────────────────────────────────────────────
//
// UCheckbox renders [data-slot="base"] on the actual <input type="checkbox">.
// We use our injected .rcb-base class as the primary hook (more stable than
// relying solely on data-slot, in case NuxtUI changes that in a patch).
//

// .rcb-base {
//   border-radius: var(--rcb-radius);
// }

.rcb-base {
  border-radius: var(--rcb-radius, var(--rounded-m)) !important;
}

.rcb-base,
.rcb-root [data-slot="base"] {
  // Reset browser and NuxtUI defaults
  all:          unset;
  box-sizing:   border-box;
  appearance:   none;
  -webkit-appearance: none;
  position:     relative;
  display:      inline-flex;
  align-items:  center;
  justify-content: center;
  flex-shrink:  0;

  // Sizing from CSS custom property (set by size variant)
  width:        var(--rcb-size, 16px);
  height:       var(--rcb-size, 16px);
  min-width:    var(--rcb-size, 16px);
  

  // Surface
  border:        2px solid var(--color-w-b-3);
  border-radius: var(--rcb-radius, 4px) ;
  background:    transparent;
  cursor:        pointer;
  overflow:      visible; // allow focus ring to bleed out

  // &.rcb--rounded-2xs { border-radius: var(--rounded-2xs) !important; }
  // &.rcb--rounded-xs  { border-radius: var(--rounded-xs) !important; }
  // &.rcb--rounded-sm  { border-radius: var(--rounded-s) !important; }
  // &.rcb--rounded-md  { border-radius: var(--rounded-m) !important; }
  // &.rcb--rounded-lg  { border-radius: var(--rounded) !important; }
  // &.rcb--rounded-xl  { border-radius: var(--border-radius) !important; }

  transition:
    border-color  var(--t-fast) var(--ease-out),
    background    var(--t-fast) var(--ease-out),
    box-shadow    var(--t-fast) var(--ease-out);

  // ── Checkmark via ::before (remixicon glyph) ──────────────────────────
  // ri-check-line = \eb7a
  // ri-subtract-line (indeterminate) = \f1ae
  &::before {
    content:     '\eb7a';    // ri-check-line
    font-family: 'remixicon' !important;
    font-style:  normal;
    font-size:   var(--rcb-icon-size, 10px);
    font-weight: 700;
    line-height: 1;
    color:       var(--rcb-color, var(--c-accent));
    display:     flex;
    align-items: center;
    justify-content: center;
    width:       100%;
    height:      100%;
    padding: 3px;
    opacity:     0;
    transform:   scale(0.5);
    transition:
      opacity   var(--t-fast) var(--ease-out),
      transform var(--t-fast) var(--ease-out);
  }

  // ── Checked state ────────────────────────────────────────────────────────
  &:checked,
  &[data-state="checked"],
  &[aria-checked="true"] {
    border-color: var(--rcb-color, var(--c-accent));
    background:   color-mix(in srgb, var(--rcb-color, var(--c-accent)) 8%, var(--c-surface));
    box-shadow:   0 0 0 0px transparent; // ready for focus extension

    &::before {
      opacity:   1;
      transform: scale(1);
    }
  }

  // ── Indeterminate (minus) ─────────────────────────────────────────────
  &[data-state="indeterminate"],
  &:indeterminate {
    border-color: var(--rcb-color, var(--c-accent));
    background:   color-mix(in srgb, var(--rcb-color, var(--c-accent)) 8%, var(--c-surface));

    &::before {
      content:   '\f1ae'; // ri-subtract-line
      opacity:   1;
      transform: scale(1);
    }
  }

  // ── Hover ─────────────────────────────────────────────────────────────
  &:hover:not(:checked):not([data-state="checked"]):not(:disabled) {
    border-color: color-mix(in srgb, var(--rcb-color, var(--c-accent)) 50%, var(--color-w-b-3));
    background:   color-mix(in srgb, var(--rcb-color, var(--c-accent)) 5%, var(--c-surface));
  }

  // ── Focus ring ────────────────────────────────────────────────────────
  // Uses ::after so we don't conflict with ::before checkmark
  &:focus-visible {
    outline: none;
    box-shadow:
      0 0 0 3px color-mix(in srgb, var(--rcb-color, var(--c-accent)) 22%, transparent);
  }

  // ── Disabled ──────────────────────────────────────────────────────────
  &:disabled,
  &[data-disabled] {
    cursor:       not-allowed;
    opacity:      0.5;
    border-color: var(--color-w-b-3);
    background:   var(--bg-tertiary);
  }
}

// ── NuxtUI's indicator wrapper (shown when checked; holds the SVG icon) ───
// We hide NuxtUI's built-in SVG icon entirely and rely on our ::before glyph.
// This prevents double checkmarks (our remixicon glyph + NuxtUI's SVG).
.rcb-indicator,
.rcb-root [data-slot="indicator"] {
  display: none !important;
}

// .rcb-container{
//   display: flex;
//   align-items: center;
//   flex-direction: row-reverse !important;
//   // background-color: burlywood;
// }

// ── Inner wrapper (label + help stack) ──────────────────────────────────────
.rcb-inner,
.rcb-root [data-slot="inner"] {
  display:        flex;
  flex-direction: column;
  gap:            2px;
  margin-left:    0; // reset NuxtUI default ms-*
  padding-top:    1px; // optical alignment with checkbox top
}

// ── Label ────────────────────────────────────────────────────────────────
.rcb-label,
.rcb-root [data-slot="label"] {
  display:       block;
  font-size:     var(--rcb-label-size, 0.8125rem);
  font-weight:   500;
  color:         var(--color-w-b-3);
  line-height:   1.4;
  cursor:        pointer;
  user-select:   none;
  font-family:   var(--font-400,var(--font-fallback));

  // When disabled
  .rcb-root:has([data-disabled]) & {
    cursor: not-allowed;
    color:  var(--c-muted);
  }
}

// ── Help text ─────────────────────────────────────────────────────────────
.rcb-help,
.rcb-root [data-slot="help"] {
  font-size:  0.72rem;
  color:      var(--c-muted);
  line-height: 1.4;
  font-family: var(--font-400,var(--font-fallback));
}

// ── Required asterisk ─────────────────────────────────────────────────────
.rcb-required,
.rcb-root [data-slot="required"] {
  font-size: 0.72rem;
  color:     var(--c-danger);
}

// ── Dark mode adjustments ─────────────────────────────────────────────────
.dark {
  .rcb-base,
  .rcb-root [data-slot="base"] {
    background:   var(--c-surface);
    border-color: var(--color-w-b-2);

    &:checked,
    &[data-state="checked"] {
      background: color-mix(in srgb, var(--rcb-color, var(--c-accent)) 12%, var(--c-surface));
    }
  }

  .rcb-label,
  .rcb-root [data-slot="label"] {
    color: var(--color-w-b-4);
  }
}
</style>