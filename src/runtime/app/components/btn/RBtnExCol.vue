<template>
  <!--
    Expand / collapse button for the sidebar.
    Pure SVG paths, so colour follows `currentColor` and every state change is animated.

    Two modes, driven by `collapsed`:
      collapsed = false  (sidebar open, action = COLLAPSE)
        panel  : left
        arrow  : points RIGHT at rest, flips to LEFT on hover / focus
      collapsed = true   (sidebar closed, action = EXPAND)
        panel  : right
        arrow  : points LEFT at rest, flips to RIGHT on hover / focus
    On touch screens there is no hover, so the arrow shows the action direction at rest.
  -->
  <RTooltip :text="label" :side="side" :sideOffset="sideOffset" open-delay="300" close-delay="400">
    <button type="button" class="r-btn-excol" :class="[`r-btn-excol--${size}`, { 'is-collapsed': collapsed, 'is-mirrored': mirror }]"
      :aria-label="label || undefined"
      :aria-expanded="!collapsed"
      :aria-controls="controls || undefined"
      v-bind="$attrs"
    >
      <svg class="r-btn-excol__svg" viewBox="0 0 24 24" fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <!-- sidebar panel: left when open, mirrors to the right when collapsed -->
        <path class="r-btn-excol__panel" d="M3 7a3 3 0 0 1 3-3h3v16H6a3 3 0 0 1-3-3z" fill="currentColor" stroke="none" />
        <!-- outer frame -->
        <path class="r-btn-excol__frame" d="M6 4h12a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z" />
        <!-- panel divider (mirrors with the panel) -->
        <path class="r-btn-excol__divider" d="M9 4v16" />
        <!-- chevron, drawn pointing left; rotated by CSS -->
        <path class="r-btn-excol__arrow" d="M16 15l-3-3 3-3" />
      </svg>
    </button>
  </RTooltip>
</template>

<script setup>
import RTooltip from '../RTooltip.vue'

// Listeners such as @click have to land on the <button>, not on RTooltip,
// so attrs are forwarded by hand with v-bind="$attrs".
defineOptions({ inheritAttrs: false })

defineProps({
  /** true = the sidebar is collapsed, so the button offers "expand" */
  collapsed: { type: Boolean, default: false },
  size: { type: String, default: 'sm', validator: (v) => ['sm', 'md'].includes(v) },
  /** accessible name and tooltip text, e.g. "Collapse sidebar" / "Expand sidebar" */
  label: { type: String, default: '' },
  /** id of the sidebar this button controls (aria-controls) */
  controls: { type: String, default: '' },
  sideOffset: { type: Number, default: 8 },
  /** tooltip side, e.g. "right" for a left sidebar or "left" for a right sidebar */
  side: { type: String, default: 'right' },
  /** mirror the icon for a right-side sidebar */
  mirror: { type: Boolean, default: false },
})
</script>

<style lang="scss" scoped>
$ease: cubic-bezier(0.4, 0, 0.2, 1);
$dur: 0.22s;

.r-btn-excol {
  // 24px is the WCAG 2.2 minimum pointer target (was 20px)
  --size: 24px;

  // Arrow direction is a rotation of the left-pointing chevron:
  //   0deg = left, 180deg = right.
  // Collapse mode: right at rest, left on hover (the action points at the sidebar).
  --arrow-rest: 180deg;
  --arrow-hover: 0deg;
  --arrow-x: 0px;
  --arrow-rot: var(--arrow-rest);

  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
  width: var(--size);
  height: var(--size);
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition:
    background 0.15s,
    color 0.15s,
    transform 0.1s;

  &--md {
    --size: 36px;
  }

  // Expand mode: left at rest, right on hover (the action points away from the sidebar).
  // The panel sits on the right, so the chevron shifts into the content area on its left
  // instead of overlapping the divider.
  &.is-collapsed {
    --arrow-rest: 0deg;
    --arrow-hover: 180deg;
    --arrow-x: -5.5px;
  }

  // Hover and keyboard focus preview the action.
  @media (hover: hover) {
    &:hover {
      background: var(--color-item-hover);
      color: var(--c-accent);
    }

    &:hover,
    &:focus-visible {
      --arrow-rot: var(--arrow-hover);
    }

    &:hover .r-btn-excol__panel {
      opacity: 0.28;
    }
  }

  // Touch has no hover, so show the action direction up front.
  @media (hover: none) {
    --arrow-rot: var(--arrow-hover);
  }

  &:active {
    transform: scale(0.94);
  }

  &:focus-visible {
    outline: 2px solid var(--c-accent);
    outline-offset: 2px;
  }

  &__svg {
    width: 18px;
    height: 18px;
    overflow: visible;
  }

  &.is-mirrored &__svg {
    transform: scaleX(-1);
  }

  // panel and divider mirror around the vertical centre of the 24x24 viewBox
  &__panel,
  &__divider {
    transform-box: view-box;
    transform-origin: 12px 12px;
    transition:
      transform $dur $ease,
      opacity $dur $ease;
  }

  &__panel {
    opacity: 0.16;
  }

  &__arrow {
    transform-box: fill-box;
    transform-origin: center;
    transform: translateX(var(--arrow-x)) rotate(var(--arrow-rot));
    transition: transform $dur $ease;
  }

  &.is-collapsed &__panel,
  &.is-collapsed &__divider {
    transform: scaleX(-1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .r-btn-excol,
  .r-btn-excol__panel,
  .r-btn-excol__divider,
  .r-btn-excol__arrow {
    transition: none;
  }
}
</style>