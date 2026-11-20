<template>
  <USlideover
    v-model:open="isOpen"
    :side="resolvedSide"
    :ui="mergedUI"
    :transition="transition"
    :overlay="overlay"
    :modal="modal"
    :dismissible="resolvedDismissible"
    :close="false"
    :content="{ style: contentStyle }"
  >
    <!-- Optional trigger (USlideover's default slot) -->
    <template v-if="$slots.trigger" #default>
      <slot name="trigger" :open="isOpen" />
    </template>

    <!-- ── Header ── -->
    <template #header>
      <slot name="header"
        :close="closed"
        :fullscreen="isFullscreen"
        :toggle-fullscreen="toggleFullscreen"
      >
        <div v-if="dirty" class="rs__dirty-bar" aria-hidden="true" />
        <div class="rs-header">
          <div class="rs-header__left">
            <RIcon v-if="icon" :name="[icon, 'rs-header__icon']" />
            <div>
              <h3 v-if="title" class="rs-header__title">{{ title }}</h3>
              <p v-if="description" class="rs-header__desc">{{ description }}</p>
            </div>
          </div>

          <div class="rs__head-end">
            <span v-if="dirty" class="rs__unsaved-badge" title="You have unsaved changes">
              <i class="ri-edit-circle-line" aria-hidden="true" />
              Unsaved
            </span>

            <button
              v-if="expandable"
              type="button"
              class="rs-header__btn"
              :aria-label="isFullscreen ? 'Exit full screen' : 'Full screen'"
              @click="toggleFullscreen"
            >
              <i :class="isFullscreen ? 'ri-fullscreen-exit-line' : 'ri-fullscreen-line'" />
            </button>

            <button
              type="button"
              class="rs-header__btn"
              aria-label="Close"
              :disabled="preventClose"
              @click="closed"
            >
              <i :class="closeIcon || 'ri-close-line'" />
            </button>
          </div>
        </div>
      </slot>
    </template>

    <!-- ── Body (default slot) ── -->
    <template #body>
      <div class="rs-body">
        <slot :close="closed" :fullscreen="isFullscreen" />
      </div>
    </template>

    <!-- ── Footer (only when provided) ── -->
    <template v-if="$slots.footer" #footer>
      <div class="rs-footer">
        <slot name="footer" :close="closed" />
      </div>
    </template>
  </USlideover>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useScreenStore } from '../stores/screen'

const screen = useScreenStore()

/* ── models ── */
const isOpen = defineModel()
// v-model:fullscreen (controlled) or plain :fullscreen / expandable toggle (uncontrolled)
const isFullscreen = defineModel('fullscreen', { default: false })

const props = defineProps({
  title:        { type: String,  default: undefined },
  description:  { type: String,  default: undefined },
  icon:         { type: String,  default: undefined },
  closeIcon:    { type: String,  default: undefined },
  side:         { type: String,  default: 'right' },  // left | right | top | bottom (bottom on mobile)
  width:        { type: Number,  default: undefined }, // px, left/right only (default 420)
  maxWidth:     { type: Number,  default: 900 },       // px, left/right only
  transition:   { type: Boolean, default: true },
  overlay:      { type: Boolean, default: true },
  modal:        { type: Boolean, default: true },
  dismissible:  { type: Boolean, default: true },      // overlay click / Esc
  preventClose: { type: Boolean, default: false },     // blocks overlay, Esc AND the X button
  expandable:   { type: Boolean, default: false },     // adds a full-screen toggle to the header
  dirty:        { type: Boolean, default: false },     // blocks overlay/Esc close; X still works
  ui:           { type: Object,  default: () => ({}) },
})

const emit = defineEmits(['closed'])

/* ── derived ── */
const resolvedSide = computed(() => (screen.isMobile ? 'bottom' : props.side || 'right'))
const isHorizontal = computed(() => resolvedSide.value === 'left' || resolvedSide.value === 'right')

// NOTE: v4 USlideover has no `prevent-close` prop (v2 leftover) — it maps onto `dismissible`.
const resolvedDismissible = computed(() => !props.dirty && !props.preventClose && props.dismissible)

// CSS vars go on the content element itself — the panel is teleported to <body>, so a var
// set on this component's root (v-bind() in CSS) can't be relied on to reach it.
const contentStyle = computed(() => ({
  '--rs-w': props.width ? `${props.width}px` : undefined,
  '--rs-max-w': `${props.maxWidth}px`,
}))

// Hook classes per slot; caller's `ui` is appended per slot (strings/arrays only).
// Previously `overlay: { ...userOverlay }` always replaced 'rs-overlay' with `{}` → overlay style lost.
function mergeSlots(base, user = {}) {
  return Object.fromEntries(
    [...new Set([...Object.keys(base), ...Object.keys(user || {})])].map((k) => [
      k,
      [base[k], user?.[k]].flat().filter((v) => typeof v === 'string' && v).join(' '),
    ]),
  )
}

const mergedUI = computed(() => mergeSlots({
  overlay: 'rs-overlay',
  content: [
    'rs-content divide-y-0',
    isHorizontal.value ? 'rs-content--h' : 'rs-content--v',
    `rs-content--${resolvedSide.value}`,
    isFullscreen.value && 'rs-content--fullscreen',
  ],
  header: 'rs-ui-header',
  body:   'rs-ui-body',
  footer: 'rs-ui-footer',
}, props.ui))

/* ── actions ── */
function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
}

function closed() {
  if (props.preventClose) return
  isOpen.value = false
}

// `closed` now fires for every close path (X, overlay, Esc, parent v-model) — it used to
// fire only from the X button.
watch(isOpen, (open, was) => {
  if (was && !open) emit('closed')
})
</script>

<!--
  GLOBAL (non-scoped), namespaced .rs-*. USlideover portals to <body>, so scoped CSS can't
  reach the panel. No !important: Tailwind 4 utilities live in @layer and unlayered SFC CSS
  always wins over layered CSS.
  Removed: ResizeObserver/MutationObserver scroll detection → plain `overflow-y: auto`.
-->
<style lang="scss">
/* ── overlay ── */
.rs-overlay {
  background: color-mix(in srgb, var(--c-bg) 60%, transparent);
  -webkit-backdrop-filter: var(--glass-blur-sm);
  backdrop-filter: var(--glass-blur-sm);
}

/* ── panel ── */
.rs-content {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-c-card, var(--c-surface));
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  color: var(--c-text);
  transition:
    width var(--t-base) var(--ease-out),
    max-width var(--t-base) var(--ease-out),
    height var(--t-base) var(--ease-out),
    border-radius var(--t-base) var(--ease-out);

  // left / right
  &--h {
    width: var(--rs-w, 420px);
    max-width: min(var(--rs-max-w, 900px), 100%);
    height: 100dvh;
  }

  // top / bottom (and every phone): full-width sheet
  &--v {
    width: 100%;
    max-width: 100%;
    height: auto;
    max-height: 92dvh;
  }

  &--bottom { border-radius: var(--r-xl) var(--r-xl) 0 0; }
  &--top    { border-radius: 0 0 var(--r-xl) var(--r-xl); }

  // must stay last so it wins on equal specificity
  &--fullscreen {
    width: 100%;
    max-width: 100%;
    height: 100dvh;
    max-height: 100dvh;
    border-radius: 0;
  }
}

/* ── Nuxt UI slot wrappers ── */
.rs-ui-header {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 100%;
  min-height: 0;
  padding: 0;
  border-bottom: 1px solid var(--c-border);
}

.rs-ui-body {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  padding: 0;
  overflow: hidden; // .rs-body scrolls
  border: 0;
}

.rs-ui-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
  width: 100%;
  padding: 0;
  border-top: 1px solid var(--c-border);
}

/* ── dirty bar + unsaved badge ── */
.rs__dirty-bar {
  flex-shrink: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--c-accent), var(--c-accent-2));
}

.rs__head-end {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.rs__unsaved-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
  color: var(--c-accent);
  background: color-mix(in srgb, var(--c-accent) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--c-accent) 25%, transparent);
  border-radius: var(--r-full);

  i { font-size: 0.8rem; }
}

// [data-slot="header"]{
//   padding: 50px;
// }

/* ── header markup ── */
.rs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
  width: 100%;
  min-height: 64px;
  padding: 20px 15px !important;
  font-family: var(--font-400);

  &__left {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    min-width: 0;
  }

  &__icon {
    flex-shrink: 0;
    font-size: 20px;
    color: var(--c-accent);
    filter: drop-shadow(var(--glow-text));
  }

  &__title {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    line-height: 1.3;
    color: var(--c-text);
  }

  &__desc {
    margin: 2px 0 0;
    font-size: 0.78rem;
    line-height: 1.4;
    color: var(--c-muted);
  }

  // close + expand buttons
  &__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    padding: 0;
    font-size: 1rem;
    color: var(--c-muted);
    background: transparent;
    border: 0;
    border-radius: var(--r-full);
    cursor: pointer;
    transition: background var(--t-fast) var(--ease-out), color var(--t-fast) var(--ease-out);

    // was `--c-hover` (a dark brown in light mode) + `--c-text` → unreadable hover
    &:hover:not(:disabled) {
      background: color-mix(in srgb, var(--c-accent) 10%, transparent);
      color: var(--c-accent);
    }

    &:disabled { opacity: 0.4; cursor: not-allowed; }
  }
}

/* ── body ── */
.rs-body {
  flex: 1 1 auto;
  min-height: 0;
  padding: 8px 15px;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-gutter: stable; // no layout jump when the scrollbar appears
  scrollbar-width: thin;
  scrollbar-color: var(--color-w-b-3) transparent;
}

/* ── footer ── */
.rs-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--sp-2);
  width: 100%;
  min-height: 56px;
  padding: 8px 15px;
}
</style>