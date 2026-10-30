<script setup>
// RDrawer — SARIKA
// Full UDrawer wrapper: all props, all slots, nested drawer, responsive sizing
// No lang="ts" — plain <script setup>
// Screen breakpoints via useScreenStore

import { computed, ref, provide, inject } from 'vue'
import { useScreenStore } from '../stores/screen'

// ── Props — mirrors every UDrawer prop exactly ─────────────────────────────
const props = defineProps({
  // UDrawer core
  direction:            { type: String,  default: null    }, // 'top'|'bottom'|'left'|'right'
  modal:                { type: Boolean, default: true    },
  overlay:              { type: Boolean, default: true    },
  handle:               { type: Boolean, default: true    },
  handleOnly:           { type: Boolean, default: false   },
  noClose:          { type: Boolean, default: false    },
  trapFocus:            { type: Boolean, default: true    },
  closeOnEscape:        { type: Boolean, default: true    },
  closeOnOutsideClick:  { type: Boolean, default: true    },
  shouldScaleBackground:{ type: Boolean, default: false   },
  // SARIKA extras
  title:                { type: String,  default: ''      },
  description:          { type: String,  default: ''      },
  icon:                 { type: String,  default: ''      },  // RemixIcon class
  // Size overrides per device (px or %)
  widthDesktop:         { type: String,  default: '500px' },
  widthTablet:          { type: String,  default: '400px' },
  widthMobile:          { type: String,  default: '92vw'  },
  heightDesktop:        { type: String,  default: '70vh'  },
  heightTablet:         { type: String,  default: '75vh'  },
  heightMobile:         { type: String,  default: '88vh'  },
  // Nested drawer support
  nested:               { type: Boolean, default: false   },
  // Dirty form guard — when true, outside-click will NOT close the drawer
  // Use with useFormDirty() or useZodForm().isDirty
  dirty:                { type: Boolean, default: false   },
  // ui passthrough (merged with SARIKA defaults)
  ui:                   { type: Object,  default: () => ({}) },
})

const open  = defineModel('open', { default: false })
const emit  = defineEmits(['open', 'close', 'update:open'])

const screen = useScreenStore()

// ── Resolved direction: auto bottom on mobile, right on desk/tablet ────────
const resolvedDirection = computed(() => {
  if (props.direction) return props.direction
  return screen.isMobile ? 'bottom' : 'right'
})

const isVertical = computed(() =>
  resolvedDirection.value === 'top' || resolvedDirection.value === 'bottom'
)

// ── Responsive size vars ───────────────────────────────────────────────────
const sizeVar = computed(() => {
  if (isVertical.value) {
    // top/bottom: control height
    if (screen.isMobile)  return { '--rd-size': props.heightMobile  }
    if (screen.isTablet)  return { '--rd-size': props.heightTablet  }
    return                       { '--rd-size': props.heightDesktop }
  }
  // left/right: control width
  if (screen.isMobile)  return { '--rd-size': props.widthMobile  }
  if (screen.isTablet)  return { '--rd-size': props.widthTablet  }
  return                       { '--rd-size': props.widthDesktop }
})

// ── SARIKA default ui tokens — merged with consumer :ui ───────────────────
const mergedUi = computed(() => ({
  overlay:   'rd-overlay',
  content:   'rd-content',
  handle:    'rd-handle',
  container: 'rd-container',
  header:    'rd-header-slot',
  title:     'rd-title',
  description: 'rd-description',
  body:      'rd-body',
  footer:    'rd-footer',
  ...props.ui,
}))

// ── Nested drawer support via provide/inject ───────────────────────────────
// Parent provides 'rDrawerNested'; child reads it to set nested=true automatically
const parentIsDrawer = inject('rDrawerNested', false)
const isNested = computed(() => props.nested || parentIsDrawer)
provide('rDrawerNested', true)

// ── Dirty guard — block outside-click close when form has unsaved changes ──
const resolvedCloseOnOutside = computed(() => props.dirty ? false : props.closeOnOutsideClick)

// ── Close handler ──────────────────────────────────────────────────────────
function close() {
  open.value = false
  emit('close')
}
</script>

<template>
  <UDrawer
    v-model:open="open"
    :direction="resolvedDirection"
    :modal="modal"
    :overlay="overlay"
    :handle="handle"
    :handle-only="handleOnly"
    :dismissible="!noClose"
    :trap-focus="trapFocus"
    :close-on-escape="closeOnEscape"
    :close-on-outside-click="resolvedCloseOnOutside"
    :should-scale-background="shouldScaleBackground"
    :nested="isNested"
    :ui="mergedUi"
    :style="sizeVar"
    class="rd"
    @update:open="$emit('update:open', $event)"
  >

    <!-- ── Default slot (trigger) ─────────────────────────
         Passes through whatever the parent puts as trigger.
         UDrawer uses its default slot as the trigger button.
    ─────────────────────────────────────────────────────── -->
    <!-- <slot /> -->

    <!-- ── #header slot ──────────────────────────────────── -->
    <template v-if="$slots.header" #header>
      <slot name="header" :close="close" />
    </template>

    <!-- ── #body slot ────────────────────────────────────── -->
    <template v-if="$slots.body" #body>
      <slot name="body" :close="close" />
    </template>

    <!-- ── #footer slot ──────────────────────────────────── -->
    <template v-if="$slots.footer" #footer>
      <slot name="footer" :close="close" />
    </template>

    <!-- ── #content slot (full override — no chrome) ──────
         When #content is used we still inject the SARIKA
         header chrome (icon + title + description + close).
         Consumer can suppress it by not passing title/icon.
    ─────────────────────────────────────────────────────── -->
    <template #content>
      <slot name="content" :close="close">
        <!-- Dirty form indicator strip ────────────────── -->
        <div v-if="dirty" class="rd__dirty-bar" aria-hidden="true" />

        <!-- SARIKA chrome header ─────────────────────── -->
        <div
          v-if="title || icon || $slots['drawer-header']"
          class="rd__chrome-head"
        >
          <slot name="drawer-header" :close="close">
            <div class="rd__title-wrap">
              <!-- RemixIcon -->
              <span v-if="icon" class="rd__icon-wrap">
                <i :class="icon" aria-hidden="true" />
              </span>
              <div>
                <h2 v-if="title" class="rd__title" v-html="title" />
                <p v-if="description" class="rd__desc" v-html="description" />
              </div>
            </div>
            <div class="rd__head-end">
              <!-- Unsaved changes badge -->
              <span v-if="dirty" class="rd__unsaved-badge" title="You have unsaved changes">
                <i class="ri-edit-circle-line" aria-hidden="true" />
                Unsaved
              </span>
              <!-- Close button -->
              <button type="button" class="rd__close" aria-label="Close drawer" @click="close">
                <i class="ri-close-line" aria-hidden="true" />
              </button>
            </div>
          </slot>
        </div>

        <!-- Scrollable body ──────────────────────────── -->
             <!-- ── Default slot (trigger) ─────────────────────────
         Passes through whatever the parent puts as trigger.
         UDrawer uses its default slot as the trigger button.
    ─────────────────────────────────────────────────────── -->
        <div class="rd__body" >
          <slot :close="close" />
        </div>

        <!-- Footer ──────────────────────────────────── -->
        <div v-if="$slots.footer" class="rd__footer">
          <slot name="footer" :close="close" />
        </div>
      </slot>
    </template>
  </UDrawer>
</template>

<style lang="scss" scoped>
// ─────────────────────────────────────────────────────────
// SARIKA chrome (scoped to this component's own elements)
// ─────────────────────────────────────────────────────────
.rd {
  display: contents; // neutral host — UDrawer controls DOM

  &__chrome-head {
    display:         flex;
    align-items:     flex-start;
    justify-content: space-between;
    gap:             var(--space-3);
    padding:         var(--space-4) var(--space-5);
    border-bottom:   1px solid var(--c-border);
    flex-shrink:     0;
  }

  &__title-wrap {
    display:     flex;
    align-items: flex-start;
    gap:         var(--space-3);
    min-width:   0;
  }

  &__icon-wrap {
    width:         38px;
    height:        38px;
    border-radius: var(--radius-md);
    background:    rgba(255,140,66,0.1);
    color:         var(--c-accent);
    // @include flex-center;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size:     1.1rem;
    flex-shrink:   0;
  }

  &__title {
    font-family: var(--font-400);
    font-size:   0.95rem;
    font-weight: 700;
    color:       var(--c-text);
    line-height: 1.3;
    margin:      0;
  }

  &__desc {
    font-family: var(--font-400);
    color: var(--sub-color);
    font-size:  0.78rem;
    color:      var(--c-muted);
    margin:     3px 0 0;
    line-height: 1.5;
  }

  &__close {
    width:         32px;
    height:        32px;
    border:        1px solid var(--c-border);
    border-radius: var(--radius-md);
    background:    transparent;
    color:         var(--c-muted);
    cursor:        pointer;
    // @include flex-center;
      display: flex;
    align-items: center;
    justify-content: center;
    // @include transition(fast);
    flex-shrink:   0;
    font-size:     1rem;

    &:hover {
      border-color: var(--c-accent);
      color:        var(--c-accent);
      background:   rgba(255,140,66,0.06);
    }
  }

  &__body {
    flex:        1;
    overflow-y:  auto;
    padding:     var(--space-5);
    scrollbar-width: thin;
    scrollbar-color: var(--c-accent) transparent;

    &::-webkit-scrollbar       { width: 4px; }
    &::-webkit-scrollbar-track { background: var(--bg-tertiary); }
    &::-webkit-scrollbar-thumb { background: var(--c-accent); border-radius: 999px; }
  }

  &__footer {
    flex-shrink:  0;
    padding:      var(--space-4) var(--space-5);
    border-top:   1px solid var(--c-border);
    // background:   var(--c-bg) !important; 
    display:      flex;
    justify-content: flex-end;
    align-items: center;
    gap:          var(--space-2);
  }

  // ── Dirty form guard UI ─────────────────────────────────
  &__dirty-bar {
    height:     3px;
    background: linear-gradient(90deg, var(--c-accent), var(--c-accent-2, #ffb347));
    flex-shrink: 0;
  }

  &__head-end {
    display:     flex;
    align-items: center;
    gap:         var(--space-2);
    flex-shrink: 0;
  }

  &__unsaved-badge {
    display:       inline-flex;
    align-items:   center;
    gap:           4px;
    padding:       3px 8px;
    border-radius: 999px;
    font-size:     0.7rem;
    font-weight:   600;
    color:         var(--c-accent);
    background:    rgba(255,140,66,0.1);
    border:        1px solid rgba(255,140,66,0.25);
    white-space:   nowrap;

    i { font-size: 0.8rem; }
  }
}
</style>

<!-- ─────────────────────────────────────────────────────────
     GLOBAL — override UDrawer/vaul-vue portal styles
     Using CSS custom property --rd-size set by :style binding
────────────────────────────────────────────────────────── -->
<style lang="scss">

// ── Overlay ───────────────────────────────────────────────
.rd-overlay {
  background:      rgba(0,0,0,0.45) !important;
  backdrop-filter: blur(6px) !important;
  // @include transition;
}

// ── Content panel ─────────────────────────────────────────
.rd-content {
  background:    var(--c-surface) !important;
  font-family:   var(--font-fallback) !important;
  display:       flex !important;
  flex-direction: column !important;
  overflow:      hidden !important;

  // Transition
  transition:
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    opacity   0.3s ease !important;

  // ── SIZE via CSS var (injected by :style) ──────────────
  // left/right drawers → width
  &[data-vaul-drawer-direction="left"],
  &[data-vaul-drawer-direction="right"] {
    width:     var(--rd-size, 500px) !important;
    max-width: min(var(--rd-size, 500px), 95vw) !important;
  }

  // top/bottom drawers → height
  &[data-vaul-drawer-direction="top"],
  &[data-vaul-drawer-direction="bottom"] {
    height:     var(--rd-size, 70vh) !important;
    max-height: min(var(--rd-size, 70vh), 95dvh) !important;
  }

  // Bottom drawer: rounded top corners
  &[data-vaul-drawer-direction="bottom"] {
    border-radius: var(--radius-xl) var(--radius-xl) 0 0 !important;
  }

  // Top drawer: rounded bottom corners
  &[data-vaul-drawer-direction="top"] {
    border-radius: 0 0 var(--radius-xl) var(--radius-xl) !important;
  }

  // Right drawer: rounded left corners
  &[data-vaul-drawer-direction="right"] {
    border-radius: var(--radius-xl) 0 0 var(--radius-xl) !important;
  }

  // Left drawer: rounded right corners
  &[data-vaul-drawer-direction="left"] {
    border-radius: 0 var(--radius-xl) var(--radius-xl) 0 !important;
  }
}

// ── Handle ────────────────────────────────────────────────
.rd-handle {
  cursor:      grab !important;
  // @include transition(fast);

  &::before {
    content:       '' !important;
    display:       block !important;
    width:         40px !important;
    height:        4px !important;
    border-radius: 999px !important;
    background:    var(--c-border) !important;
    margin:        0 auto !important;
    // @include transition(fast);
  }

  &:hover::before { background: var(--c-accent) !important; }
  
  // Handle padding offset
  &[data-slot="handle"] {
    padding:1px 0 !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center;
  }
  
  &[data-vaul-handle]{
    top: 0;
  }
}

// ── Container ─────────────────────────────────────────────
.rd-container {
  display:        flex !important;
  flex-direction: column !important;
  height:         100% !important;
  overflow:       hidden !important;
}

// ── Body ──────────────────────────────────────────────────
.rd-body {
  flex:       1 !important;
  overflow-y: auto !important;
  scrollbar-width: thin;
  scrollbar-color: var(--c-accent) transparent;

  &::-webkit-scrollbar       { width: 4px; }
  &::-webkit-scrollbar-thumb { background: var(--c-accent); border-radius: 999px; }
}

// ── Footer ────────────────────────────────────────────────
.rd-footer {
  flex-shrink: 0 !important;
}


.rd-content[data-vaul-drawer-direction="left"] [data-slot="handle"],
.rd-content[data-vaul-drawer-direction="right"] [data-slot="handle"] {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  padding: 0;
}

.rd-content[data-vaul-drawer-direction="left"] [data-slot="handle"] {
  right: -11px;
}

.rd-content[data-vaul-drawer-direction="right"] [data-slot="handle"] {
  left: -11px;
}

.rd-content[data-vaul-drawer-direction="left"] .rd-handle::before,
.rd-content[data-vaul-drawer-direction="right"] .rd-handle::before {
  width: 4px;
  height: 4px;
}

.rd-content[data-vaul-drawer-direction="bottom"] [data-slot="handle"]{
  top: -8px;
}
.rd-content[data-vaul-drawer-direction="top"] [data-slot="handle"] {
  top: 880px;
}

// ── Dark mode ─────────────────────────────────────────────
.dark {
  .rd-overlay { background: rgba(0,0,0,0.65) !important; }
  .rd-content { background: rgba(19,19,26,0.97) !important; border-left: 1px solid var(--c-border); }
  .rd-handle::before { background: var(--c-border) !important; }
}

// ── Mobile responsive (override if direction not manually set) ─────────────
@media (max-width: 767px) {
  .rd-content[data-vaul-drawer-direction="bottom"] {
    border-radius: var(--radius-xl) var(--radius-xl) 0 0 !important;
  }
}
</style>