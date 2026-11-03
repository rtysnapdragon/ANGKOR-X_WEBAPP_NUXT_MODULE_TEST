<template>
  <UPopover
    v-model:open="isOpen"
    :arrow="arrow"
    :content="{
      side: side,
      align: align,
      sideOffset: sideOffset,
    }"
    :mode="mode"
    :disabled="disabled"
    :ui="mergedUI"
    class="rpp-host"
  >
    <!-- Trigger slot — whatever the consumer puts here becomes the clickable anchor -->
    <template #default>
      <slot :open="isOpen" />
    </template>

    <template #anchor v-if="$slots.anchor">
      <slot name="anchor" :open="isOpen" />
    </template>

    <!-- Panel content slot -->
    <template #content="{ close }">
      <div
        class="rpp-panel"
        :class="[
          `rpp-panel--${size}`,
          noPadding && 'rpp-panel--no-pad',
          panelClass,
        ]"
        :style="panelStyle"
        role="dialog"
      >
        <!-- Optional header -->
        <div v-if="title || $slots.header" class="rpp-panel__header">
          <slot name="header">
            <span class="rpp-panel__title">{{ title }}</span>
          </slot>
          <button
            v-if="showClose"
            class="rpp-panel__close"
            type="button"
            :aria-label="closeLabel"
            @click="isOpen = false"
          >
            <i class="ri-close-line" />
          </button>
        </div>

        <!-- Body -->
        <div
          v-if="$slots.body || $slots.default === undefined"
          class="rpp-panel__body"
          :class="{ 'rpp-panel__body--scroll': scrollable }"
        >
          <slot name="body">
            <slot name="content" />
          </slot>
        </div>

        <!-- If no body/content slot, render default slot directly (no extra wrapper) -->
        <slot v-if="!$slots.body && !$slots.content" />

        <!-- Optional footer -->
        <div v-if="$slots.footer" class="rpp-panel__footer">
          <slot name="footer" />
        </div>
      </div>
    </template>
  </UPopover>
</template>

<script setup>
const props = defineProps({
  // ── UPopover native ─────────────────────────────────────────────────────
  /** 'hover' fires on mouseenter; 'click' (default) fires on click */
  mode:        { type: String,  default: 'click'  }, // click/hover
  /** Popover placement side */
  side:        { type: String,  default: 'bottom' }, // left/rigth/top/bottom
  /** Alignment along the side axis */
  align:       { type: String,  default: 'center' }, // center/end/start
  /** Gap between trigger and panel in px */
  sideOffset:  { type: Number,  default: 6        }, // from triger to panel
  /** Show the small arrow pip */
  arrow:       { type: Boolean, default: false     },
  /** Disable opening */
  modal:       { type: Boolean, default: false     },
  disabled:    { type: Boolean, default: false     },
  dismissible: { type: Boolean, default: false     },
  /** ui slot overrides passed straight to UPopover */
  ui:          { type: Object,  default: () => ({}) },

  // ── Panel appearance ────────────────────────────────────────────────────
  /** Optional title in the panel header */
  title:       { type: String,  default: undefined },
  /** Show × close button in panel header */
  showClose:   { type: Boolean, default: false     },
  closeLabel:  { type: String,  default: 'Close'  },
  /** Panel size preset: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'auto' */
  size:        { type: String,  default: 'md'     },
  /** Remove internal body padding */
  noPadding:   { type: Boolean, default: false     },
  /** Make body scrollable when content overflows */
  scrollable:  { type: Boolean, default: false     },
  /** Extra class on .rpp-panel */
  panelClass:  { type: [String, Array, Object], default: '' },
  /** Inline style on .rpp-panel */
  panelStyle:  { type: [String, Object], default: undefined },
})

const emit = defineEmits(['open', 'close', 'update:open'])

const isOpen = defineModel('open', { default: false })

watch(isOpen, (v) => emit(v ? 'open' : 'close'))

// Strip our custom props before forwarding to UPopover so no unknown attrs land on the DOM
const mergedUI = computed(() => ({
  content: 'rpp-content ring-0 shadow-none',  // zero-padding wrapper — we control padding in .rpp-panel // no border with ring-0/shadow-none border-0
  arrow:   'rpp-arrow',
  ...props.ui,
}))

defineExpose({ isOpen })
</script>

<style lang="scss" scoped>
// ── Host: inline so it never breaks flex/grid layouts ────────────────────
.rpp-host {
  display: inline-flex !important;
}

// ── UPopover content wrapper (teleported — scoped can reach via :deep) ───
// We zero out UPopover's own padding/bg here; .rpp-panel carries the real surface.
// This works via :deep because UPopover's content slot IS NOT teleported to
// document.body in NuxtUI v4 by default — it uses a floating element that
// stays in the DOM tree.  If your version teleports, switch to global SCSS.
:deep(.rpp-content) {
  padding:          0 !important;
  background:       transparent !important;
  border:           none !important;
  box-shadow:       none !important;
  border-radius:    0 !important;
  overflow:         visible !important;
}

:deep(.rpp-arrow) {
  fill:   var(--c-surface);
  color:  var(--c-border);
}

// ── Panel surface ────────────────────────────────────────────────────────
.rpp-panel {
  display:          flex;
  flex-direction:   column;
  background:       var(--c-surface);
  // border:           1px solid var(--c-border);
  border:           none !important;
  border-radius:    var(--r-xl, 16px);
  box-shadow:       var(--glass-shadow);
  overflow:         hidden;
  font-family:      var(--font-fallback, 'Inter', system-ui, sans-serif);

  // ── Size presets ──────────────────────────────────────────────────────
  &--xs   { min-width: 120px; max-width: 180px;  }
  &--sm   { min-width: 160px; max-width: 240px;  }
  &--md   { min-width: 200px; max-width: 320px;  }
  &--lg   { min-width: 280px; max-width: 420px;  }
  &--xl   { min-width: 320px; max-width: 560px;  }
  &--auto { min-width: unset; max-width: unset;  }

  // no-pad: strip body padding (caller controls it entirely)
  &--no-pad .rpp-panel__body { padding: 0 !important; }

  // ── Header ────────────────────────────────────────────────────────────
  &__header {
    display:         flex;
    align-items:     center;
    justify-content: space-between;
    gap:             var(--sp-3, 12px);
    padding:         var(--sp-3, 12px) var(--sp-4, 16px);
    border-bottom:   1px solid var(--c-border);
    flex-shrink:     0;
  }

  &__title {
    font-size:      0.8125rem;
    font-weight:    600;
    color:          var(--c-text);
    letter-spacing: -0.01em;
    line-height:    1.4;
    flex:           1;
    min-width:      0;
    overflow:       hidden;
    text-overflow:  ellipsis;
    white-space:    nowrap;
  }

  &__close {
    display:         inline-flex;
    align-items:     center;
    justify-content: center;
    width:           24px;
    height:          24px;
    border:          none;
    border-radius:   var(--r-full, 9999px);
    background:      transparent;
    color:           var(--c-muted);
    font-size:       1rem;
    cursor:          pointer;
    flex-shrink:     0;
    transition:      background var(--t-fast, 0.15s) ease,
                     color      var(--t-fast, 0.15s) ease;

    &:hover {
      background: color-mix(in srgb, var(--c-accent) 10%, transparent);
      color:      var(--c-accent);
    }

    i { line-height: 1; display: flex; }
  }

  // ── Body ──────────────────────────────────────────────────────────────
  &__body {
    padding: var(--sp-4, 16px);
    flex:    1;
    color:   var(--c-text);

    &--scroll {
      overflow-y:   auto;
      max-height:   min(60vh, 420px);
      // SARIKA scrollbar
      scrollbar-width: thin;
      scrollbar-color: var(--color-w-b-3, #9ca3af) transparent;

      &::-webkit-scrollbar        { width: 4px; }
      &::-webkit-scrollbar-track  { background: transparent; }
      &::-webkit-scrollbar-thumb  {
        background:    var(--color-w-b-3, #9ca3af);
        border-radius: var(--r-full, 9999px);
      }
    }
  }

  // ── Footer ────────────────────────────────────────────────────────────
  &__footer {
    display:       flex;
    align-items:   center;
    justify-content: flex-end;
    gap:           var(--sp-2, 8px);
    padding:       var(--sp-3, 12px) var(--sp-4, 16px);
    border-top:    1px solid var(--c-border);
    flex-shrink:   0;
  }
}

// ── Dark mode adjustments ────────────────────────────────────────────────
:global(.dark) .rpp-panel {
  background: var(--c-surface);
  box-shadow:
    0 8px 32px color-mix(in srgb, #000 50%, transparent),
    0 1px 0 color-mix(in srgb, #fff 4%, transparent) inset;
}
</style>
