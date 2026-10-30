<template>
  <!--
    RCheckboxes — wraps UCheckboxGroup (NuxtUI v4.8.2)
    Full API parity: all props, all slots, all emits, expose.

    WHY wrap UCheckboxGroup instead of the old manual v-for + RCheckbox?
    ─────────────────────────────────────────────────────────────────────
    UCheckboxGroup v4 handles keyboard nav, loop, aria-group, orientation,
    variant (list/card/table), required/name for form submission, and the
    value-key / label-key / description-key normalisation — all things the
    old implementation had to re-implement manually and incompletely.

    BACKWARDS-COMPAT shim
    ─────────────────────
    Old usage passed `options` (array of { label, value/pk/id, disabled }).
    New UCheckboxGroup expects `items`. The `normaliseItems` computed converts
    old-shape objects to CheckboxGroupItem shape automatically, so existing
    call-sites don't break.
  -->
  <UCheckboxGroup
    ref="groupRef"
    v-model="model"
    :items="normalisedItems"
    :default-value="defaultValue"
    :name="name"
    :required="required"
    :disabled="disabled"
    :legend="legend"
    :value-key="valueKey"
    :label-key="labelKey"
    :description-key="descriptionKey"
    :color="color"
    :size="size"
    :variant="variant"
    :orientation="orientation"
    :indicator="indicator"
    :highlight="highlight"
    :loop="loop"
    :icon="icon"
    :as="as"
    :ui="mergedUI"
    class="rcbg-root"
    :class="[
      isBorder && 'rcbg-root--border',
      `rcbg-root--${orientation}`,
      `rcbg-root--${variant}`,
    ]"
    @change="(e) => emit('change', e)"
    @update:model-value="(v) => emit('update:modelValue', v)"
  >
    <!-- #legend slot -->
    <template v-if="$slots.legend || legend" #legend>
      <slot name="legend">{{ legend }}</slot>
    </template>

    <!-- #label slot — receives { item } -->
    <template v-if="$slots.label" #label="slotProps">
      <slot name="label" v-bind="slotProps" />
    </template>

    <!-- #description slot — receives { item } -->
    <template v-if="$slots.description" #description="slotProps">
      <slot name="description" v-bind="slotProps" />
    </template>
  </UCheckboxGroup>
</template>

<script setup>
import { computed } from 'vue'
/**
 * Props mirror the full UCheckboxGroup v4.8.2 API plus:
 *  - `options`    backwards-compat alias for `items`
 *  - `isBorder`   legacy border toggle (kept from original RCheckboxes)
 *  - `pk`         legacy value-key alias (e.g. old usage used pk="id")
 */
const props = defineProps({
  // ── UCheckboxGroup native props ─────────────────────────────────────────
  /** The controlled value. Bind with v-model. */
  modelValue:     { type: Array,   default: undefined },
  /** Uncontrolled initial value. */
  defaultValue:   { type: Array,   default: undefined },
  /** Array of string | number | CheckboxGroupItem objects. */
  items:          { type: Array,   default: () => [] },
  /** Legend text shown above the group. */
  legend:         { type: String,  default: undefined },
  /** Field of each item object to use as the bound value. @default 'value' */
  valueKey:       { type: String,  default: 'value'   },
  /** Field of each item object to use as the label. @default 'label' */
  labelKey:       { type: String,  default: 'label'   },
  /** Field of each item object to use as the description. @default 'description' */
  descriptionKey: { type: String,  default: 'description' },
  /** Form field name (submitted with owning form). */
  name:           { type: String,  default: undefined },
  /** Makes the field required. Adds * to legend. */
  required:       { type: Boolean, default: false     },
  /** Disables all checkboxes. */
  disabled:       { type: Boolean, default: false     },
  /** Color of the checkboxes. */
  color:          { type: String,  default: 'primary' },
  /** Size of the checkboxes. */
  size:           { type: String,  default: 'md'      },
  /** Layout variant. */
  variant:        { type: String,  default: 'list'    },
  /** Layout orientation. */
  orientation:    { type: String,  default: 'vertical' },
  /** Position of the checkbox indicator. */
  indicator:      { type: String,  default: 'start'   },
  /** Highlight ring like a focus state. */
  highlight:      { type: Boolean, default: false     },
  /** Whether keyboard navigation loops. */
  loop:           { type: Boolean, default: false     },
  /** Icon displayed when checked. Defaults to NuxtUI app config check icon. */
  icon:           { type: String,  default: undefined },
  /** Root element tag. */
  as:             { type: String,  default: 'div'     },
  /** ui slot overrides for UCheckboxGroup. */
  ui:             { type: Object,  default: () => ({}) },

  // ── RCheckboxes additions / backwards-compat ────────────────────────────
  /**
   * Legacy alias for `items`.
   * Old shape: [{ label, value|pk|id, disabled, description?, ... }]
   */
  options:  { type: Array,   default: undefined },
  /** Show border around the group container. @default false */
  isBorder: { type: Boolean, default: false     },
  /**
   * Legacy value key alias used in old call-sites (pk="id").
   * Takes precedence over `valueKey` when set.
   */
  pk: { type: String, default: undefined },
})

const modelValue = computed(() => props.modelValue ?? [])
const defaultValue = computed(() => props.defaultValue ?? [])
const name = computed(() => props.name ?? 'name')
const required = computed(() => props.required ?? false)
const disabled = computed(() => props.disabled ?? false)
const legend = computed(() => props.legend ?? '')
const valueKey = computed(() => props.valueKey ?? 'value')
const labelKey = computed(() => props.labelKey ?? 'label')
const descriptionKey = computed(() => props.descriptionKey ?? 'description')
const color = computed(() => props.color ?? 'primary')
const size = computed(() => props.size ?? 'md')
const variant = computed(() => props.variant ?? 'list')
const orientation = computed(() => props.orientation ?? 'vertical')
const indicator = computed(() => props.indicator ?? 'start')
const highlight = computed(() => props.highlight ?? false)
const loop = computed(() => props.loop ?? false)
const icon = computed(() => props.icon ?? undefined)
const as = computed(() => props.as ?? 'div')
const ui = computed(() => props.ui ?? {})
const options = computed(() => props.options ?? [])
const isBorder = computed(() => props.isBorder ?? false)
const pk = computed(() => props.pk ?? undefined)

const emit = defineEmits([
  /** Mirrors UCheckboxGroup: fires with new selected array on any change. */
  'update:modelValue',
  /** Mirrors UCheckboxGroup: fires with the native Event on any checkbox change. */
  'change',
])

// ── v-model ──────────────────────────────────────────────────────────────
const model = defineModel({ default: undefined })

// ── Expose (mirrors what UCheckboxGroup exposes via its Reka root ref) ───
const groupRef = ref(null)
defineExpose({
  /** Direct ref to the underlying UCheckboxGroup component instance. */
  groupRef,
})

// ── Normalise old `options` shape → UCheckboxGroup `items` shape ──────────
//
// Old call-site example:
//   :options="[{ label: 'A', pk: 'a', disabled: false }]"
//   pk="id"  ← tells us the value key is 'id' not 'value'
//
// UCheckboxGroup expects items with a consistent value key.
// We map: option.value ?? option[pk] ?? option.id ?? option.pk → item.value
//
const resolvedValueKey = computed(() => props.pk ?? props.valueKey ?? 'value')

const normalisedItems = computed(() => {
  const raw = props.options ?? props.items ?? []
  if (!raw.length) return []

  return raw.map((item, i) => {
    // Primitive strings / numbers — pass through unchanged
    if (typeof item !== 'object' || item === null) return item

    // Object shape: normalise value key
    const vk  = resolvedValueKey.value
    const val = item[vk] ?? item.value ?? item.pk ?? item.id ?? String(i)

    return {
      ...item,
      // Ensure the value lands on the key UCheckboxGroup will read
      [vk]: val,
      // Normalise label: support label / Name / NameEnglish (old SARIKA pattern)
      label: item.label ?? item.Name ?? item.NameEnglish ?? String(val),
      // description passthrough
      description: item.description ?? item.Description ?? undefined,
    }
  })
})

// ── Merged UI: inject our SCSS classes, then spread caller overrides ───────
//
// Slots: root, fieldset, legend, item
// (inner checkbox slots live inside each item's UCheckbox instance)
//
const mergedUI = computed(() => ({
  root:     'rcbg-fieldset-root',
  fieldset: 'rcbg-fieldset',
  legend:   'rcbg-legend',
  item:     'rcbg-item',
  // Spread per-checkbox ui overrides from caller
  ...props.ui,
}))
</script>

<style lang="scss">
/* ════════════════════════════════════════════════════════════════════════════
   RCheckboxes — global SCSS (no scoped, no Tailwind)
   SARIKA tokens only · dark + light · all variants · all orientations
   ════════════════════════════════════════════════════════════════════════════

   WHY GLOBAL?
   UCheckboxGroup renders fieldset/legend/items as its own children.
   Vue scoped [data-v-xxx] is only stamped on elements this component
   creates directly — not on UCheckboxGroup's internals. Global CSS
   namespaced by our injected class names is the correct approach.
   ════════════════════════════════════════════════════════════════════════════ */

// ── Outer host wrapper ────────────────────────────────────────────────────
.rcbg-root {
  display:     flex;
  flex-direction: column;
  font-family: var(--font-fallback);

  // Legacy border from original RCheckboxes
  &--border {
    border:        1px solid var(--c-border);
    border-radius: var(--r-md);
    padding:       var(--sp-3) var(--sp-4);
    background:    color-mix(in srgb, var(--c-surface) 60%, transparent);
  }
}

// ── Fieldset (flex container for all checkboxes) ──────────────────────────
.rcbg-fieldset {
  // UCheckboxGroup sets flex-direction via orientation variant.
  // We set gap and padding; direction is already controlled by UCheckboxGroup.
  display:   flex;
  flex-wrap: wrap;
  gap:       var(--sp-2) var(--sp-5);
  border:    none;
  margin:    0;
  padding:   0;

  // Horizontal orientation: tighter row gap
  .rcbg-root--horizontal & {
    flex-direction: row;
    align-items:    center;
    gap:            var(--sp-2) var(--sp-6);
  }

  // Vertical orientation: column stack
  .rcbg-root--vertical & {
    flex-direction: column;
    gap:            var(--sp-1) 0;
  }
}

// ── Legend ────────────────────────────────────────────────────────────────
.rcbg-legend {
  display:       block;
  font-size:     0.8125rem;
  font-weight:   600;
  color:         var(--c-text);
  margin-bottom: var(--sp-2);
  font-family:   var(--font-fallback);
  line-height:   1.4;

  // Required asterisk rendered by UCheckboxGroup via ui.legend
  // We style it here since we own the legend slot class
  &::after {
    content: '';  // reset — UCheckboxGroup adds * via Tailwind; we rely on it
  }
}

// ── Individual checkbox item wrapper ──────────────────────────────────────
.rcbg-item {
  display:     flex;
  align-items: flex-start;
  position:    relative;
  transition:  background var(--t-fast) var(--ease-out),
               border-color var(--t-fast) var(--ease-out);

  // ── card variant ────────────────────────────────────────────────────────
  .rcbg-root--card & {
    padding:       var(--sp-3) var(--sp-4);
    border-radius: var(--r-md);
    border:        1px solid var(--c-border);
    background:    color-mix(in srgb, var(--c-surface) 55%, transparent);
    cursor:        pointer;
    width:         100%;

    &:hover {
      border-color: color-mix(in srgb, var(--c-accent) 30%, transparent);
      background:   color-mix(in srgb, var(--c-accent) 5%, transparent);
    }

    // Checked card: accent ring
    &:has([data-state="checked"]) {
      border-color: color-mix(in srgb, var(--c-accent) 45%, transparent);
      background:   color-mix(in srgb, var(--c-accent) 8%, transparent);
      box-shadow:   var(--glow-accent-sm);
    }

    // Disabled card
    &:has([data-disabled]) {
      opacity:        0.55;
      cursor:         not-allowed;
      pointer-events: none;
    }
  }

  // ── table variant ────────────────────────────────────────────────────────
  .rcbg-root--table & {
    padding:     var(--sp-3);
    border:      1px solid var(--c-border);
    background:  color-mix(in srgb, var(--c-surface) 40%, transparent);

    &:first-of-type { border-radius: var(--r-md) var(--r-md) 0 0; }
    &:last-of-type  { border-radius: 0 0 var(--r-md) var(--r-md); }

    // Horizontal table — side-by-side cells
    .rcbg-root--horizontal & {
      &:first-of-type { border-radius: var(--r-md) 0 0 var(--r-md); }
      &:last-of-type  { border-radius: 0 var(--r-md) var(--r-md) 0; }
    }

    &:has([data-state="checked"]) {
      background:   color-mix(in srgb, var(--c-accent) 8%, transparent);
      border-color: color-mix(in srgb, var(--c-accent) 35%, transparent);
      z-index:      1;
    }
  }
}

// ── Dark mode ─────────────────────────────────────────────────────────────
.dark {
  .rcbg-root--border {
    background: color-mix(in srgb, var(--c-surface) 30%, transparent);
  }

  .rcbg-item {
    .rcbg-root--card & {
      background: color-mix(in srgb, var(--c-surface) 35%, transparent);

      &:has([data-state="checked"]) {
        background: color-mix(in srgb, var(--c-accent) 12%, transparent);
      }
    }

    .rcbg-root--table & {
      background: color-mix(in srgb, var(--c-surface) 25%, transparent);
    }
  }
}
</style>