<script setup>
// RDrawer — SARIKA
// UDrawer (Nuxt UI 4 / vaul-vue) wrapper: responsive sizing, dirty guard, nested drawers,
// fullscreen (+ expand toggle). Plain <script setup>, no TS.
import { computed, provide, inject, watch } from 'vue'
import { useScreenStore } from '../stores/screen'

const props = defineProps({
  // ── UDrawer ──
  direction:             { type: String,  default: null },  // top | bottom | left | right (auto: bottom on mobile, right otherwise)
  modal:                 { type: Boolean, default: true },
  overlay:               { type: Boolean, default: true },
  handle:                { type: Boolean, default: true },
  handleOnly:            { type: Boolean, default: false }, // drag only by the handle
  noClose:               { type: Boolean, default: false }, // blocks overlay / Esc / drag close
  closeOnEscape:         { type: Boolean, default: true },
  closeOnOutsideClick:   { type: Boolean, default: true },
  shouldScaleBackground: { type: Boolean, default: false },
  trapFocus:             { type: Boolean, default: true },  // legacy no-op (vaul traps focus when modal)
  nested:                { type: Boolean, default: false }, // auto-true inside another RDrawer
  // ── SARIKA chrome ──
  title:       { type: String, default: '' },
  description: { type: String, default: '' },
  icon:        { type: String, default: '' },                // RemixIcon class
  expandable:  { type: Boolean, default: false },            // full-screen toggle in the header
  dirty:       { type: Boolean, default: false },            // unsaved changes → blocks overlay/Esc/drag close
  // ── size per device (left/right → width, top/bottom → height) ──
  widthDesktop:  { type: String, default: '500px' },
  widthTablet:   { type: String, default: '400px' },
  widthMobile:   { type: String, default: '92vw' },
  heightDesktop: { type: String, default: '70vh' },
  heightTablet:  { type: String, default: '75vh' },
  heightMobile:  { type: String, default: '88vh' },
  // ── ui passthrough (appended per slot) ──
  ui: { type: Object, default: () => ({}) },
})

const open = defineModel()
// v-model:fullscreen (controlled) or plain :fullscreen / expandable toggle (uncontrolled)
const isFullscreen = defineModel('fullscreen', { default: false })

// `update:open` is intentionally not declared: a parent's `v-model:open` falls through to UDrawer.
const emit = defineEmits(['open', 'close'])

const screen = useScreenStore()

// ── Direction ──
const resolvedDirection = computed(() => {
  if (props.direction) return props.direction
  return screen.isMobile ? 'bottom' : 'right'
})

const isVertical = computed(() => ['top', 'bottom'].includes(resolvedDirection.value))

// ── Responsive size (CSS var --rd-size) ──
const sizeVar = computed(() => {
  const device = screen.isMobile ? 'Mobile' : screen.isTablet ? 'Tablet' : 'Desktop'
  return { '--rd-size': props[`${isVertical.value ? 'height' : 'width'}${device}`] }
})

// ── Close rules ──
// vaul's `dismissible=false` blocks overlay click, Esc and drag-to-close together.
const canDismiss = computed(() => !props.noClose && !props.dirty)

// UDrawer v4 has no close-on-escape / close-on-outside-click props (nor trap-focus) —
// they were leaking onto the renderless root and doing nothing. They're applied here through
// the `content` prop, which forwards DialogContent events.
// The CSS var also goes here: `:style` on <UDrawer> never reached the portaled content,
// so --rd-size was always unset and every width/height prop was dead.
const contentProps = computed(() => ({
  style: sizeVar.value,
  onEscapeKeyDown: (e) => { if (!props.closeOnEscape) e.preventDefault() },
  onPointerDownOutside: (e) => { if (!props.closeOnOutsideClick) e.preventDefault() },
}))

// ── ui: hook classes per slot, caller's `ui` appended (strings/arrays only) ──
function mergeSlots(base, user = {}) {
  return Object.fromEntries(
    [...new Set([...Object.keys(base), ...Object.keys(user || {})])].map((k) => [
      k,
      [base[k], user?.[k]].flat().filter((v) => typeof v === 'string' && v).join(' '),
    ]),
  )
}

const mergedUi = computed(() => mergeSlots({
  overlay: 'rd-overlay',
  content: ['rd-content', isFullscreen.value && 'rd-content--fullscreen'],
  handle:  'rd-handle',
}, props.ui))

// ── Nested drawers (provide/inject) ──
const parentIsDrawer = inject('rDrawerNested', false)
const isNested = computed(() => props.nested || parentIsDrawer)
provide('rDrawerNested', true)

// ── Actions / events ──
function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
}

function close() {
  open.value = false
}

// `open` was declared but never emitted, and `close` only fired from the X button.
watch(open, (v, was) => {
  if (v) emit('open')
  else if (was) emit('close')
})
</script>

<template>
  <UDrawer
    v-model:open="open"
    :direction="resolvedDirection"
    :modal="modal"
    :overlay="overlay"
    :handle="handle && !isFullscreen"
    :handle-only="handleOnly"
    :dismissible="canDismiss"
    :should-scale-background="shouldScaleBackground"
    :nested="isNested"
    :ui="mergedUi"
    :content="contentProps"
  >
    <!-- UDrawer's default slot is its trigger → exposed as #trigger -->
    <template v-if="$slots.trigger" #default>
      <slot name="trigger" :open="open" />
    </template>

    <template #content>
      <!-- #content = full override, no chrome -->
      <slot
        name="content"
        :close="close"
        :fullscreen="isFullscreen"
        :toggle-fullscreen="toggleFullscreen"
      >
        <!--
          One wrapper → DrawerContent's children are just [handle, container]. Nuxt UI already
          lays those out per direction (row / row-reverse / col / col-reverse), so no more forced
          flex-direction or the handle position hacks (e.g. top: 880px).
        -->
        <div class="rd-container">
          <div v-if="dirty" class="rd__dirty-bar" aria-hidden="true" />

          <!-- Header: #header replaces it entirely; #drawer-header replaces the inner markup -->
          <template v-if="$slots.header">
            <slot name="header" :close="close" :fullscreen="isFullscreen" :toggle-fullscreen="toggleFullscreen" />
          </template>
          <div
            v-else-if="title || icon || expandable || $slots['drawer-header']"
            class="rd__chrome-head"
          >
            <slot name="drawer-header" :close="close">
              <div class="rd__title-wrap">
                <span v-if="icon" class="rd__icon-wrap">
                  <i :class="icon" aria-hidden="true" />
                </span>
                <div>
                  <h2 v-if="title" class="rd__title" v-html="title" />
                  <p v-if="description" class="rd__desc" v-html="description" />
                </div>
              </div>

              <div class="rd__head-end">
                <span v-if="dirty" class="rd__unsaved-badge" title="You have unsaved changes">
                  <i class="ri-edit-circle-line" aria-hidden="true" />
                  Unsaved
                </span>

                <button
                  v-if="expandable"
                  type="button"
                  class="rd__btn"
                  :aria-label="isFullscreen ? 'Exit full screen' : 'Full screen'"
                  @click="toggleFullscreen"
                >
                  <i :class="isFullscreen ? 'ri-fullscreen-exit-line' : 'ri-fullscreen-line'" aria-hidden="true" />
                </button>

                <button type="button" class="rd__btn" aria-label="Close drawer" @click="close">
                  <i class="ri-close-line" aria-hidden="true" />
                </button>
              </div>
            </slot>
          </div>

          <!-- Body: #body, else the default slot. (#header/#body were forwarded to UDrawer but its
               #content override hid them, so they never rendered.) -->
          <div class="rd__body">
            <slot name="body" :close="close">
              <slot :close="close" :fullscreen="isFullscreen" />
            </slot>
          </div>

          <div v-if="$slots.footer" class="rd__footer">
            <slot name="footer" :close="close" />
          </div>
        </div>
      </slot>
    </template>
  </UDrawer>
</template>

<!--
  GLOBAL (non-scoped), namespaced .rd-* / .rd__*. UDrawer portals to <body> and the real
  elements are vaul's, so scoped CSS can't reach them. No !important: Tailwind 4 utilities live
  in @layer and unlayered SFC CSS always wins.
  Fixes: --space-* / --radius-* tokens (don't exist) → --sp-* / --r-*; hardcoded rgba/hex →
  tokens; the `.dark` block (incl. a stray `border-left` on every direction) removed;
  the handle `::before` pill drawn inside Nuxt's own handle pill removed.
-->
<style lang="scss">
// ── overlay ──
.rd-overlay {
  background: color-mix(in srgb, var(--c-bg) 55%, transparent);
  -webkit-backdrop-filter: var(--glass-blur-sm);
  backdrop-filter: var(--glass-blur-sm);
}

// ── panel ──
.rd-content {
  display: flex;
  overflow: hidden;
  background: var(--c-surface);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  color: var(--c-text);
  font-family: var(--font-400, var(--font-fallback));
  // keep vaul's slide transform, add size transitions for the fullscreen toggle
  // (vaul sets an inline `transition: none` while dragging, which still wins)
  transition:
    transform 0.5s cubic-bezier(0.32, 0.72, 0, 1),
    width var(--t-base) var(--ease-out),
    max-width var(--t-base) var(--ease-out),
    height var(--t-base) var(--ease-out),
    max-height var(--t-base) var(--ease-out),
    border-radius var(--t-base) var(--ease-out);

  // left / right → width
  &[data-vaul-drawer-direction='left'],
  &[data-vaul-drawer-direction='right'] {
    width: var(--rd-size, 500px);
    max-width: min(var(--rd-size, 500px), 95vw);
  }

  // top / bottom → height
  &[data-vaul-drawer-direction='top'],
  &[data-vaul-drawer-direction='bottom'] {
    height: var(--rd-size, 70vh);
    max-height: min(var(--rd-size, 70vh), 95dvh);
  }

  &[data-vaul-drawer-direction='bottom'] { border-radius: var(--r-xl) var(--r-xl) 0 0; }
  &[data-vaul-drawer-direction='top']    { border-radius: 0 0 var(--r-xl) var(--r-xl); }
  &[data-vaul-drawer-direction='right']  { border-radius: var(--r-xl) 0 0 var(--r-xl); }
  &[data-vaul-drawer-direction='left']   { border-radius: 0 var(--r-xl) var(--r-xl) 0; }
}

// ── fullscreen (3-part selector → beats the direction rules above) ──
.rd-content.rd-content--fullscreen[data-vaul-drawer-direction] {
  width: 100%;
  max-width: 100%;
  height: 100dvh;
  max-height: 100dvh;
  margin: 0; // Nuxt adds mt-24 / mb-24 on top/bottom
  border-radius: 0;
}

.rd-handle { cursor: grab; &:active { cursor: grabbing; } }

// ── layout inside the panel ──
.rd-container {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.rd__dirty-bar {
  flex-shrink: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--c-accent), var(--c-accent-2));
}

.rd__chrome-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sp-3);
  flex-shrink: 0;
  padding: var(--sp-4) var(--sp-5);
  border-bottom: 1px solid var(--c-border);
}

.rd__title-wrap {
  display: flex;
  align-items: flex-start;
  gap: var(--sp-3);
  min-width: 0;
}

.rd__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  font-size: 1.1rem;
  color: var(--c-accent);
  background: color-mix(in srgb, var(--c-accent) 10%, transparent);
  border-radius: var(--r-md);
}

.rd__title {
  margin: 0;
  font-family: var(--font-400);
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.3;
  color: var(--c-text);
}

.rd__desc {
  margin: 3px 0 0;
  font-family: var(--font-400);
  font-size: 0.78rem;
  color: var(--c-muted);
}

.rd__head-end {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  flex-shrink: 0;
}

// close + expand buttons
.rd__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  font-size: 1rem;
  color: var(--c-muted);
  background: transparent;
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
  cursor: pointer;
  transition:
    background var(--t-fast) var(--ease-out),
    border-color var(--t-fast) var(--ease-out),
    color var(--t-fast) var(--ease-out);

  &:hover {
    color: var(--c-accent);
    border-color: var(--c-accent);
    background: color-mix(in srgb, var(--c-accent) 6%, transparent);
  }
}

.rd__unsaved-badge {
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

.rd__body {
  flex: 1 1 auto;
  min-height: 0;
  padding: var(--sp-5);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--color-w-b-3) transparent;
}

.rd__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--sp-2);
  flex-shrink: 0;
  padding: var(--sp-4) var(--sp-5);
  border-top: 1px solid var(--c-border);
}
</style>