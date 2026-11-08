<script setup>
/**
 * RBadge — standalone badge (no UBadge underneath). API mirrors Nuxt UI 4 UBadge, plus dot / pulse / pill / mode.
 * Tokens: --tone-* + .tone--* rules in _color.scss · size scale --fs-* --py-* --px-* --gap-* in _vars.scss
 *
 * color   semantic : primary | secondary | success | info | warning | error | neutral
 *         named    : red | orange | yellow | lime | green | emerald | teal | cyan | sky | blue | violet | purple | pink | rose | gray
 *         custom   : any CSS color → '#ff00aa' | 'oklch(0.7 0.2 150)' | 'var(--my-color)'
 * variant solid | outline | soft | subtle
 *         legacy (old API, rendered as soft): default | success | danger | warning | info | muted
 * size    xs | sm | md | lg | xl
 * mode    auto (follows page theme) | light | dark (forced)
 * slots   dot · leading · default · trailing
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
  icon: String, // leading by default; trailing when `trailing` is set
  leading: Boolean, // force `icon` to the leading side
  leadingIcon: String,
  trailing: Boolean, // move `icon` to the trailing side
  trailingIcon: String,
  avatar: Object, // { src?, alt?, text? }
  dot: Boolean, // status dot before the label
  pulse: Boolean, // animated ring on the dot
  pill: Boolean, // fully rounded
  square: Boolean, // equal padding, for icon-only badges
  as: { type: [String, Object, Function], default: 'span' }, // 'span' | 'a' | 'button' | component
  ui: Object, // extra classes per part: { root, dot, leading, label, trailing }
})

// Old API: variant="success" → soft + semantic color
const LEGACY = {
  default: 'neutral', muted: 'neutral', success: 'success', danger: 'error', warning: 'warning', info: 'info',
}
const CSS_COLOR = /^(#|rgb|hsl|hwb|lab|lch|oklab|oklch|color\(|var\()/i
const AVATAR_SIZE = { xs: '3xs', sm: '3xs', md: '2xs', lg: '2xs', xl: 'xs' }

const color = computed(() => LEGACY[props.variant] ?? props.color)
const variant = computed(() => (LEGACY[props.variant] ? 'soft' : props.variant))

// Feeds .tone--{variant} (_color.scss): --t-fill (solid bg) · --t-on (text on fill) · --t-fg (text on soft/outline)
const vars = computed(() => {
  if (CSS_COLOR.test(color.value)) return { '--t-fill': color.value, '--t-on': '#fff', '--t-fg': color.value }
  const key = (p) => (props.mode === 'auto' ? (p === 'fill' ? '' : `-${p}`) : `-${p}-${props.mode}`)
  const v = (p) => `var(--tone-${color.value}${key(p)}, var(--tone-neutral${key(p)}))`
  return { '--t-fill': v('fill'), '--t-on': v('on'), '--t-fg': v('fg') }
})

const isLeading = computed(() => !!(props.leadingIcon || (props.icon && (props.leading || !props.trailing))))
const isTrailing = computed(() => !!(props.trailingIcon || (props.icon && props.trailing)))
const leadingName = computed(() => props.leadingIcon ?? props.icon ?? '')
const trailingName = computed(() => props.trailingIcon ?? props.icon ?? '')
</script>

<template>
  <component
    :is="as"
    class="r-badge tone"
    :class="[
      `tone--${variant}`,
      `r-badge--${size}`,
      { 'r-badge--pill': pill, 'r-badge--square': square, [`tone--${mode}`]: mode !== 'auto' },
      ui?.root,
    ]"
    :style="vars"
  >
    <slot v-if="dot || $slots.dot" name="dot">
      <span class="r-badge__dot" :class="[{ 'is-pulse': pulse }, ui?.dot]" aria-hidden="true" />
    </slot>

    <slot name="leading">
      <UAvatar v-if="avatar" v-bind="avatar" :size="AVATAR_SIZE[size]" class="r-badge__avatar" :class="ui?.leading" />
      <UIcon v-else-if="isLeading" :name="leadingName" class="r-badge__icon" :class="ui?.leading" />
    </slot>

    <slot>
      <span v-if="label != null" class="r-badge__label" :class="ui?.label">{{ label }}</span>
    </slot>

    <slot name="trailing">
      <UIcon v-if="isTrailing" :name="trailingName" class="r-badge__icon" :class="ui?.trailing" />
    </slot>
  </component>
</template>

<style lang="scss" scoped>
// Colors / variants live in _color.scss (.tone--*) · sizes in _vars.scss — only layout here
.r-badge {
  display: inline-flex;
  align-items: center;
  border-radius: var(--radius-sm, 6px);
  font: inherit;
  font-weight: 500;
  line-height: 1.25;
  white-space: nowrap;
  vertical-align: middle;

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

      &.r-badge--square {
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

  &__icon {
    flex-shrink: 0;
    width: 1.15em;
    height: 1.15em;
  }

  &__avatar {
    flex-shrink: 0;
  }

  &__dot {
    flex-shrink: 0;
    width: 0.6em;
    height: 0.6em;
    border-radius: 50%;
    background: var(--t-dot, currentColor);

    &.is-pulse {
      animation: r-badge-pulse 1.8s ease-out infinite;
    }
  }
}

@keyframes r-badge-pulse {
  0%   { box-shadow: 0 0 0 0 color-mix(in oklab, var(--t-dot, currentColor) 55%, transparent); }
  100% { box-shadow: 0 0 0 0.5em transparent; }
}

@media (prefers-reduced-motion: reduce) {
  .r-badge__dot.is-pulse {
    animation: none;
  }
}
</style>