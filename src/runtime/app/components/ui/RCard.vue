<script setup lang="ts">
// RCard — glass morphism card
const props = withDefaults(defineProps<{
  title?:     string
  subtitle?:  string
  icon?:      string
  class?:string
  glass?:     boolean
  padding?:   'none' | 'sm' | 'md' | 'lg'
  hoverable?: boolean
  hasBorder?:  boolean
}>(), {
  padding:  'md',
  hasBorder: false,
})

const emits = defineEmits(['click'])
const classStye = computed(() => props.class)

function onClick(event: Event) {
  emits('click', event)
}
</script>

<template>
  <div :class="[
    'r-card', 
    classStye,
    `r-card--pad-${padding}`,
    { 'r-card--glass': glass, 'r-card--hoverable': hoverable, 'r-card--bordered': hasBorder }
  ]" @click="onClick">
    <!-- Header -->
    <div v-if="$slots.header || title" class="r-card__header">
      <slot name="header">
        <div class="r-card__title-wrap">
          <UIcon v-if="icon" :name="icon" class="r-card__icon" />
          <div>
            <p class="r-card__title">{{ title }}</p>
            <p v-if="subtitle" class="r-card__subtitle">{{ subtitle }}</p>
          </div>
        </div>
      </slot>
      <div v-if="$slots.actions" class="r-card__actions">
        <slot name="actions" />
      </div>
    </div>

    <!-- Body -->
    <div class="r-card__body">
      <slot />
    </div>

    <!-- Footer -->
    <div v-if="$slots.footer" class="r-card__footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* ── BASE GLASS ── */
.glass {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--c-border);
  // box-shadow: var(--glass-shadow);
}

.r-card {
  @extend .glass;
  background:    var(--c-surface);
  border-radius: var(--radius-lg);
  overflow:      hidden;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 60%);
    pointer-events: none;
    border-radius: inherit;
  }

  &--bordered { border: 0.5px solid var(--c-active); }

  // &--glass {
  //   @include glass;
  // }

  &--hoverable:hover {
    box-shadow: 0 8px 32px rgba(0,0,0,0.1);
    transform:  translateY(-1px);
  }

  /* Padding variants */
  &--pad-none .r-card__body { padding: 0; }
  &--pad-xs   .r-card__body { padding: var(--space-1); }
  &--pad-s   .r-card__body { padding: var(--space-2); }
  &--pad-sm   .r-card__body { padding: var(--space-3); }
  &--pad-md   .r-card__body { padding: var(--space-4) var(--space-5); }
  &--pad-lg   .r-card__body { padding: var(--space-6) var(--space-8); }

  &__header {
    display:       flex;
    align-items:   center;
    justify-content: space-between;
    padding:       var(--space-4) var(--space-5);
    border-bottom: 1px solid var(--c-border);
    gap:           var(--space-3);
  }

  &__title-wrap {
    display:     flex;
    align-items: center;
    gap:         var(--space-3);
  }

  &__icon {
    font-size:  1.2rem;
    color:      var(--c-accent);
    flex-shrink: 0;
  }

  &__title {
    font-size:   0.9rem;
    font-weight: 600;
    color:       var(--c-text);
  }

  &__subtitle {
    font-size: 0.78rem;
    color:     var(--c-muted);
    margin-top: 2px;
  }

  &__actions {
    display:     flex;
    align-items: center;
    gap:         var(--space-2);
    flex-shrink: 0;
  }

  &__footer {
    padding:    var(--space-3) var(--space-5);
    border-top: 1px solid var(--c-border);
    background: rgba(0,0,0,0.02);
  }
}
</style>
