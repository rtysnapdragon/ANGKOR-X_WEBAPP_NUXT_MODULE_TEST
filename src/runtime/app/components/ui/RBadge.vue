<script setup lang="ts">
// RBadge — status / label badge
withDefaults(defineProps<{
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info' | 'muted'
  size?:    'sm' | 'md'
  dot?:     boolean
  pill?:    boolean
}>(), {
  variant: 'default',
  size:    'sm',
})
</script>

<template>
  <span :class="['r-badge', `r-badge--${variant}`, `r-badge--${size}`, { 'r-badge--pill': pill }]">
    <span v-if="dot" class="r-badge__dot" />
    <slot />
  </span>
</template>

<style lang="scss" scoped>
.r-badge {
  display:      inline-flex;
  align-items:  center;
  gap:          4px;
  font-weight:  500;
  border-radius: var(--radius-sm);
  white-space:  nowrap;

  &--sm  { padding: 2px 8px;   font-size: 0.7rem;  }
  &--md  { padding: 4px 12px;  font-size: 0.8rem;  }
  &--pill { border-radius: var(--radius-full); }

  &--default { background: rgba(138,127,114,0.14); color: var(--c-muted); }
  &--success { background: rgba(74,222,128,0.15);  color: var(--color-green); }
  &--danger  { background: rgba(248,113,113,0.15); color: var(--color-red); }
  &--warning { background: rgba(255,179,71,0.15);  color: var(--color-yellow); }
  &--info    { background: rgba(96,165,250,0.15);  color: var(--color-blue); }
  &--muted   { background: var(--bg-tertiary);     color: var(--c-muted); }

  &__dot {
    width:         6px;
    height:        6px;
    border-radius: 50%;
    background:    currentColor;
    flex-shrink:   0;
  }
}
</style>
