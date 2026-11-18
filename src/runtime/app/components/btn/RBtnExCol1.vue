<template>
  <!-- Expand / collapse button. Pure SVG paths, so colour follows `currentColor` and the state change is animated. -->
  <RTooltip :text="label" side="right" :sideOffset="sideOffset" open-delay="300" close-delay="400">
    <button
      type="button"
      class="r-btn-excol"
      :class="[`r-btn-excol--${size}`, { 'is-collapsed': collapsed }]"
      :aria-label="label || undefined"
      :aria-expanded="!collapsed"
    >
      <svg
        class="r-btn-excol__svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <!-- left panel (shrinks when collapsed) -->
        <path class="r-btn-excol__panel" d="M3 7a3 3 0 0 1 3-3h3v16H6a3 3 0 0 1-3-3z" fill="currentColor" stroke="none" />
        <!-- outer frame -->
        <path class="r-btn-excol__frame" d="M6 4h12a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z" />
        <!-- panel divider (slides with the panel) -->
        <path class="r-btn-excol__divider" d="M9 4v16" />
        <!-- chevron: points left = "collapse", rotates to point right = "expand" -->
        <path class="r-btn-excol__arrow" d="M16 15l-3-3 3-3" />
      </svg>
    </button>
  </RTooltip>
</template>

<script setup>
defineProps({
  /** true = the sidebar is collapsed, so the button offers "expand" */
  collapsed: { type: Boolean, default: false },
  size: { type: String, default: 'sm', validator: (v) => ['sm', 'md'].includes(v) },
  /** accessible name */
  label: { type: String, default: '' },
  sideOffset: { type: Number, default: 8 },
})
</script>

<style lang="scss" scoped>
$ease: cubic-bezier(0.4, 0, 0.2, 1);

.r-btn-excol {
  --size: 20px;

  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
  width: var(--size);
  height: var(--size);
  padding: 0;
  // border: 1px solid var(--c-border);
  border-radius: 10px;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition:
    background 0.15s,
    border-color 0.15s,
    color 0.15s;

  &:hover {
    background: var(--color-item-hover);
    border-color: var(--c-accent);
    color: var(--c-accent);
  }

  &:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }

  &--md {
    --size: 36px;
  }

  &__svg {
    width: 16px;
    height: 16px;
    overflow: visible;
    color: var(--c-accentr);
  }

  &__panel,
  &__divider,
  &__arrow {
    transform-box: fill-box;
    transition: transform 0.22s $ease;
  }

  &__panel {
    opacity: 0.16;
    transform-origin: left center;
  }

  &__arrow {
    transform-origin: center;
  }

  // collapsed: narrow panel, divider follows it, chevron flips to "expand"
  &.is-collapsed {
    .r-btn-excol__panel {
      transform: scaleX(0.55);
    }

    .r-btn-excol__divider {
      transform: translateX(-2.7px);
    }

    .r-btn-excol__arrow {
      transform: rotate(180deg);
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .r-btn-excol__panel,
  .r-btn-excol__divider,
  .r-btn-excol__arrow {
    transition: none;
  }
}
</style>
