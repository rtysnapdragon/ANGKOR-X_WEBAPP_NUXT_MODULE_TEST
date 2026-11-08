<script setup>
/**
 * RBadgeUi — Nuxt UI 4 UBadge wrapper: named static colors, light/dark tokens, extra props + slots.
 * UBadge stays `neutral`; color/variant visuals come from _color.scss (.tone--*) through --t-* vars.
 * Tokens: --tone-* in _color.scss · size scale --fs-* --py-* --px-* --gap-* in _vars.scss
 *
 * color   semantic : primary | secondary | success | info | warning | error | neutral
 *         named    : red | orange | yellow | lime | green | emerald | teal | cyan | sky | blue | violet | purple | pink | rose | gray
 *         custom   : any CSS color → '#ff00aa' | 'oklch(0.7 0.2 150)' | 'var(--my-color)'
 * variant solid | outline | soft | subtle
 *         legacy (old API, rendered as soft): default | success | danger | warning | info | muted
 * size    xs | sm | md | lg | xl
 * mode    auto (follows page theme) | light | dark (forced)
 * slots   dot · leading · default · count · trailing · close
 * emits   close (when `closable`)
 */
const props = defineProps({
  label: [String, Number],
  // 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
  // 'red' | 'orange' | 'yellow' | 'lime' | 'green' | 'emerald' | 'teal' | 'cyan' | 'sky' | 'blue' | 'violet' | 'purple' | 'pink' | 'rose' | 'gray'
  // or any CSS color: '#ff00aa' | 'oklch(0.7 0.2 150)' | 'var(--my-color)'
  color: { type: String, default: 'neutral' },
  // 'solid' | 'outline' | 'soft' | 'subtle'  (legacy → soft: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'muted')
  variant: { type: String, default: 'soft' },
  // 'auto' (follows page theme) | 'light' | 'dark' (forced)
  mode: { type: String, default: 'auto' },
  // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  size: { type: String, default: 'sm' },
  icon: String, // UBadge: leading by default; trailing when `trailing` is set
  leading: Boolean,
  leadingIcon: String,
  trailing: Boolean,
  trailingIcon: String,
  avatar: Object, // { src?, alt?, text? }
  square: Boolean,
  as: { type: [String, Object, Function], default: undefined }, // UBadge default ('span') | 'a' | 'button' | component
  ui: Object, // UBadge parts (base, label, leadingIcon…) + own parts: dot, count, close
  dot: Boolean, // status dot before the label
  pulse: Boolean, // animated ring on the dot
  pill: Boolean, // fully rounded
  count: [Number, String], // small counter chip after the label
  closable: Boolean, // close button after the label → emits `close`
  closeLabel: { type: String, default: 'Close' }, // aria-label of the close button
})

const emit = defineEmits(['close'])

// Old API: variant="success" → soft + semantic color
const LEGACY = {
  default: 'neutral', muted: 'neutral', success: 'success', danger: 'error', warning: 'warning', info: 'info',
}
const CSS_COLOR = /^(#|rgb|hsl|hwb|lab|lch|oklab|oklch|color\(|var\()/i

const color = computed(() => LEGACY[props.variant] ?? props.color)
const variant = computed(() => (LEGACY[props.variant] ? 'soft' : props.variant))

// Feeds .tone--{variant} (_color.scss): --t-fill (solid bg) · --t-on (text on fill) · --t-fg (text on soft/outline)
const vars = computed(() => {
  if (CSS_COLOR.test(color.value)) return { '--t-fill': color.value, '--t-on': '#fff', '--t-fg': color.value }
  const key = (p) => (props.mode === 'auto' ? (p === 'fill' ? '' : `-${p}`) : `-${p}-${props.mode}`)
  const v = (p) => `var(--tone-${color.value}${key(p)}, var(--tone-neutral${key(p)}))`
  return { '--t-fill': v('fill'), '--t-on': v('on'), '--t-fg': v('fg') }
})
</script>

<template>
  <UBadge
    color="neutral"
    :variant="variant"
    :size="size"
    :square="square"
    :icon="icon"
    :leading="leading"
    :leading-icon="leadingIcon"
    :trailing="trailing"
    :trailing-icon="trailingIcon"
    :avatar="avatar"
    :as="as"
    :ui="ui"
    class="r-badge-ui tone"
    :class="[
      `tone--${variant}`,
      `r-badge-ui--${size}`,
      { 'r-badge-ui--pill': pill, 'r-badge-ui--square': square, [`tone--${mode}`]: mode !== 'auto' },
    ]"
    :style="vars"
  >
    <template v-if="$slots.leading" #leading="slotProps">
      <slot name="leading" v-bind="slotProps" />
    </template>

    <template #default>
      <slot v-if="dot || $slots.dot" name="dot">
        <span class="r-badge-ui__dot" :class="[{ 'is-pulse': pulse }, ui?.dot]" aria-hidden="true" />
      </slot>

      <slot>
        <span v-if="label != null" class="r-badge-ui__label">{{ label }}</span>
      </slot>

      <slot name="count">
        <span v-if="count != null && count !== ''" class="r-badge-ui__count" :class="ui?.count">{{ count }}</span>
      </slot>

      <button
        v-if="closable"
        type="button"
        class="r-badge-ui__close"
        :class="ui?.close"
        :aria-label="closeLabel"
        @click.stop="emit('close', $event)"
      >
        <slot name="close"><UIcon name="i-lucide-x" /></slot>
      </button>
    </template>

    <template v-if="$slots.trailing" #trailing="slotProps">
      <slot name="trailing" v-bind="slotProps" />
    </template>
  </UBadge>
</template>

<style lang="scss" scoped>
// Colors / variants live in _color.scss (.tone--*) · sizes in _vars.scss — overrides UBadge's own scale
.r-badge-ui {
  border-radius: var(--radius-sm, 6px);
  font: inherit;
  font-weight: 500;
  line-height: 1.25;
  white-space: nowrap;

  // size scale lives in _vars.scss (--fs/--py/--px/--gap-*); fallbacks keep it working without it
  @each $s, $fs, $py, $px, $gap in (
    (xs, 0.625rem, 1px, 6px, 3px),
    (sm, 0.7rem, 2px, 8px, 4px),
    (md, 0.8rem, 4px, 12px, 6px),
    (lg, 0.9rem, 5px, 14px, 6px),
    (xl, 1rem, 6px, 16px, 8px)
  ) {
    &--#{$s} {
      gap: var(--gap-#{$s}, #{$gap});
      padding: var(--py-#{$s}, #{$py}) var(--px-#{$s}, #{$px});
      font-size: var(--fs-#{$s}, #{$fs});

      &.r-badge-ui--square {
        padding: var(--py-#{$s}, #{$py});
      }
    }
  }

  &--square {
    justify-content: center;
    aspect-ratio: 1;
  }

  &--pill {
    border-radius: var(--radius-full, 9999px);
  }

  &__label {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__dot {
    flex-shrink: 0;
    width: 0.6em;
    height: 0.6em;
    border-radius: 50%;
    background: var(--t-dot, currentColor);

    &.is-pulse {
      animation: r-badge-ui-pulse 1.8s ease-out infinite;
    }
  }

  &__count {
    min-width: 1.6em;
    padding: 0 0.4em;
    border-radius: var(--radius-full, 9999px);
    background: color-mix(in oklab, currentColor 16%, transparent);
    font-size: 0.9em;
    font-variant-numeric: tabular-nums;
    line-height: 1.5;
    text-align: center;
  }

  &__close {
    display: inline-grid;
    place-items: center;
    margin-inline-end: -0.2em;
    padding: 0.15em;
    border-radius: var(--radius-full, 9999px);
    opacity: 0.7;
    cursor: pointer;
    transition: opacity 0.15s ease, background-color 0.15s ease;

    &:hover {
      opacity: 1;
      background: color-mix(in oklab, currentColor 16%, transparent);
    }

    &:focus-visible {
      opacity: 1;
      outline: 2px solid currentColor;
      outline-offset: 1px;
    }
  }
}

@keyframes r-badge-ui-pulse {
  0%   { box-shadow: 0 0 0 0 color-mix(in oklab, var(--t-dot, currentColor) 55%, transparent); }
  100% { box-shadow: 0 0 0 0.5em transparent; }
}

@media (prefers-reduced-motion: reduce) {
  .r-badge-ui__dot.is-pulse {
    animation: none;
  }
}
</style>