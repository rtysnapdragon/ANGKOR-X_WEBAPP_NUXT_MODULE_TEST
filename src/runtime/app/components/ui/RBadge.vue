<script setup lang="ts">
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
import type { Component } from 'vue'

const props = withDefaults(defineProps<{
  label?: string | number
  color?:
    | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
    | 'red' | 'orange' | 'yellow' | 'lime' | 'green' | 'emerald' | 'teal' | 'cyan'
    | 'sky' | 'blue' | 'violet' | 'purple' | 'pink' | 'rose' | 'gray'
    | (string & {})
  variant?: 'solid' | 'outline' | 'soft' | 'subtle' | 'default' | 'success' | 'danger' | 'warning' | 'info' | 'muted'
  mode?: 'auto' | 'light' | 'dark'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  icon?: string // leading by default; trailing when `trailing` is set
  leading?: boolean // force `icon` to the leading side
  leadingIcon?: string
  trailing?: boolean // move `icon` to the trailing side
  trailingIcon?: string
  avatar?: { src?: string; alt?: string; text?: string }
  dot?: boolean // status dot before the label
  pulse?: boolean // animated ring on the dot
  pill?: boolean // fully rounded
  square?: boolean // equal padding, for icon-only badges
  as?: string | Component // 'span' (default) | 'a' | 'button' | component
  ui?: Partial<Record<'root' | 'dot' | 'leading' | 'label' | 'trailing', string>> // extra classes per part
}>(), { color: 'neutral', variant: 'soft', mode: 'auto', size: 'sm', as: 'span' })

// Old API: variant="success" → soft + semantic color
const LEGACY: Record<string, string> = {
  default: 'neutral', muted: 'neutral', success: 'success', danger: 'error', warning: 'warning', info: 'info',
}
const CSS_COLOR = /^(#|rgb|hsl|hwb|lab|lch|oklab|oklch|color\(|var\()/i
const AVATAR_SIZE = { xs: '3xs', sm: '3xs', md: '2xs', lg: '2xs', xl: 'xs' } as const

const color = computed(() => LEGACY[props.variant] ?? props.color)
const variant = computed(() => (LEGACY[props.variant] ? 'soft' : props.variant))

// Feeds .tone--{variant} (_color.scss): --t-fill (solid bg) · --t-on (text on fill) · --t-fg (text on soft/outline)
const vars = computed(() => {
  if (CSS_COLOR.test(color.value)) return { '--t-fill': color.value, '--t-on': '#fff', '--t-fg': color.value }
  const key = (p: string) => (props.mode === 'auto' ? (p === 'fill' ? '' : `-${p}`) : `-${p}-${props.mode}`)
  const v = (p: string) => `var(--tone-${color.value}${key(p)}, var(--tone-neutral${key(p)}))`
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
  border-radius: var(--radius-sm);
  font-weight: 500;
  line-height: 1.25;
  white-space: nowrap;
  vertical-align: middle;

  @each $s in xs, sm, md, lg, xl {
    &--#{$s} {
      gap: var(--gap-#{$s});
      padding: var(--py-#{$s}) var(--px-#{$s});
      font-size: var(--fs-#{$s});

      &.r-badge--square {
        padding: var(--py-#{$s});
      }
    }
  }

  &--pill {
    border-radius: var(--radius-full);
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