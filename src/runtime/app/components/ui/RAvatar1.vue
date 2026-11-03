<script setup lang="ts">
// RAvatar — user avatar with fallback initials
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  src?:    string
  name?:   string
  size?:   'xs' | 'sm' | 'md' | 'lg' | 'xl'
  shape?:  'circle' | 'square'
  status?: 'online' | 'offline' | 'busy' | 'away'
  color?:  string
}>(), {
  size:  'md',
  shape: 'circle',
})

const initials = computed(() => {
  if (!props.name) return '?'
  return props.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
})

const hue = computed(() => {
  if (props.color) return props.color
  let hash = 0
  for (const c of props.name ?? '') hash = c.charCodeAt(0) + ((hash << 5) - hash)
  return `hsl(${((hash % 360) + 360) % 360}, 55%, 52%)`
})
</script>

<template>
  <span :class="['r-avatar', `r-avatar--${size}`, `r-avatar--${shape}`]">
    <img
      v-if="src"
      :src="src"
      :alt="name"
      class="r-avatar__img"
      loading="lazy"
      @error="($event.target as HTMLImageElement).style.display = 'none'"
    />
    <span v-else class="r-avatar__initials" :style="{ background: hue }">
      {{ initials }}
    </span>
    <span v-if="status" :class="['r-avatar__status', `r-avatar__status--${status}`]" />
  </span>
</template>

<style lang="scss" scoped>
.r-avatar {
  position:    relative;
  display:     inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow:    visible;
  font-weight: 600;

  &--xs  { width: 24px;  height: 24px;  font-size: 0.6rem;  }
  &--sm  { width: 32px;  height: 32px;  font-size: 0.7rem;  }
  &--md  { width: 40px;  height: 40px;  font-size: 0.85rem; }
  &--lg  { width: 52px;  height: 52px;  font-size: 1rem;    }
  &--xl  { width: 72px;  height: 72px;  font-size: 1.3rem;  }

  &--circle { border-radius: 50%; }
  &--square { border-radius: var(--radius-md); }

  &__img {
    width:  100%;
    height: 100%;
    object-fit: cover;
    border-radius: inherit;
  }

  &__initials {
    width:  100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: inherit;
    color: #fff;
  }

  &__status {
    position:      absolute;
    bottom:        1px;
    right:         1px;
    width:         10px;
    height:        10px;
    border-radius: 50%;
    border:        2px solid var(--c-bg);

    &--online  { background: var(--c-success); }
    &--offline { background: var(--c-muted); }
    &--busy    { background: var(--c-danger); }
    &--away    { background: var(--color-yellow); }
  }
}
</style>
