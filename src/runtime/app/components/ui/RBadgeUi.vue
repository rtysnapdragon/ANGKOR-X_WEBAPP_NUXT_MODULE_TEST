<script setup lang="ts">
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
  icon?: string // UBadge: leading by default; trailing when `trailing` is set
  leading?: boolean
  leadingIcon?: string
  trailing?: boolean
  trailingIcon?: string
  avatar?: { src?: string; alt?: string; text?: string }
  square?: boolean
  as?: string | Component
  ui?: Record<string, string> // UBadge parts (base, label, leadingIcon…) + own parts: dot, count, close
  dot?: boolean // status dot before the label
  pulse?: boolean // animated ring on the dot
  pill?: boolean // fully rounded
  count?: number | string // small counter chip after the label
  closable?: boolean // close button after the label → emits `close`
  closeLabel?: string // aria-label of the close button
}>(), { color: 'neutral', variant: 'soft', mode: 'auto', size: 'sm', closeLabel: 'Close' })

const emit = defineEmits<{ close: [event: MouseEvent] }>()

// Old API: variant="success" → soft + semantic color
const LEGACY: Record<string, string> = {
  default: 'neutral', muted: 'neutral', success: 'success', danger: 'error', warning: 'warning', info: 'info',
}
const CSS_COLOR = /^(#|rgb|hsl|hwb|lab|lch|oklab|oklch|color\(|var\()/i

const color = computed(() => LEGACY[props.variant] ?? props.color)
const variant = computed(() => (LEGACY[props.variant] ? 'soft' : props.variant))

// Feeds .tone--{variant} (_color.scss): --t-fill (solid bg) · --t-on (text on fill) · --t-fg (text on soft/outline)
const vars = computed(() => {
  if (CSS_COLOR.test(color.value)) return { '--t-fill': color.value, '--t-on': '#fff', '--t-fg': color.value }
  const key = (p: string) => (props.mode === 'auto' ? (p === 'fill' ? '' : `-${p}`) : `-${p}-${props.mode}`)
  const v = (p: string) => `var(--tone-${color.value}${key(p)}, var(--tone-neutral${key(p)}))`
  return { '--t-fill': v('fill'), '--t-on': v('on'), '--t-fg': v('fg') }
})
</script>

<template>
  <UBadge
    color="neutral"
    :variant="variant as 'solid' | 'outline' | 'soft' | 'subtle'"
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
  border-radius: var(--radius-sm);
  line-height: 1.25;
  white-space: nowrap;

  @each $s in xs, sm, md, lg, xl {
    &--#{$s} {
      gap: var(--gap-#{$s});
      padding: var(--py-#{$s}) var(--px-#{$s});
      font-size: var(--fs-#{$s});

      &.r-badge-ui--square {
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
    border-radius: var(--radius-full);
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
    border-radius: var(--radius-full);
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