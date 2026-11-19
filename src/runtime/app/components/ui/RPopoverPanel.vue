<template>
  <UPopover
    v-model:open="openModel"
    portal="body"
    :arrow="arrow"
    :content="{ side, align, sideOffset }"
    :mode="mode"
    :modal="modal"
    :dismissible="dismissible"
    :ui="mergedUI"
    :class="$slots.default ? 'rpp-host' : undefined"
  >
    <!-- Trigger — whatever the consumer puts here becomes the clickable anchor -->
    <template v-if="$slots.default" #default>
      <slot :open="isOpen" />
    </template>

    <template v-if="$slots.anchor" #anchor>
      <slot name="anchor" :open="isOpen" />
    </template>

    <!-- Panel -->
    <template #content>
      <div
        class="rpp-panel"
        :class="[`rpp-panel--${size}`, noPadding && 'rpp-panel--no-pad', panelClass]"
        :style="panelStyle"
      >
        <div v-if="title || $slots.header" class="rpp-panel__header">
          <slot name="header" :close="close">
            <span class="rpp-panel__title">{{ title }}</span>
          </slot>
          <button
            v-if="showClose"
            class="rpp-panel__close"
            type="button"
            :aria-label="closeLabel"
            @click="close"
          >
            <i class="ri-close-line" />
          </button>
        </div>

        <div
          v-if="$slots.body || $slots.content"
          class="rpp-panel__body"
          :class="{ 'rpp-panel__body--scroll': scrollable }"
        >
          <slot name="body" :close="close">
            <slot name="content" :close="close" />
          </slot>
        </div>

        <div v-if="$slots.footer" class="rpp-panel__footer">
          <slot name="footer" :close="close" />
        </div>
      </div>
    </template>
  </UPopover>
</template>

<script setup>
import { computed, watch } from 'vue'

const props = defineProps({
  // ── UPopover native ──
  mode:        { type: String,  default: 'click'  }, // click | hover
  side:        { type: String,  default: 'bottom' }, // top | right | bottom | left
  align:       { type: String,  default: 'center' }, // start | center | end
  sideOffset:  { type: Number,  default: 6        }, // px gap trigger → panel
  arrow:       { type: Boolean, default: false    },
  modal:       { type: Boolean, default: false    },
  dismissible: { type: Boolean, default: true     }, // outside click / Esc closes (UPopover default)
  disabled:    { type: Boolean, default: false    }, // handled here — UPopover has no `disabled` prop
  ui:          { type: Object,  default: () => ({}) },

  // ── Panel appearance ──
  title:       { type: String,  default: undefined },
  showClose:   { type: Boolean, default: false    },
  closeLabel:  { type: String,  default: 'Close'  },
  size:        { type: String,  default: 'md'     }, // xs | sm | md | lg | xl | auto
  noPadding:   { type: Boolean, default: false    },
  scrollable:  { type: Boolean, default: false    },
  panelClass:  { type: [String, Array, Object], default: '' },
  panelStyle:  { type: [String, Object], default: undefined },
})

const emit = defineEmits(['open', 'close'])
const isOpen = defineModel('open', { default: false })
const openModel = computed({
  get: () => isOpen.value,
  set: (v) => {
    if (v && props.disabled) return
    isOpen.value = v
  },
})

watch(isOpen, (v) => emit(v ? 'open' : 'close'))

const open = () => { if (!props.disabled) isOpen.value = true }
const close = () => { isOpen.value = false }
const toggle = () => (isOpen.value ? close() : open())

// Hook classes per UPopover slot; caller's `ui` is appended per slot, not replacing.
const mergedUI = computed(() => {
  const base = { content: 'rpp-content', arrow: 'rpp-arrow' }
  const user = props.ui || {}
  return Object.fromEntries(
    [...new Set([...Object.keys(base), ...Object.keys(user)])].map((k) => [
      k,
      [base[k], user[k]].flat().filter(Boolean).join(' '),
    ]),
  )
})

defineExpose({ isOpen, open, close, toggle })
</script>

<!--
  GLOBAL (non-scoped): UPopover portals its content to <body> by default, so
  scoped / :deep() never reaches .rpp-content or .rpp-arrow. All selectors are
  namespaced .rpp-*. No !important: Tailwind 4 utilities live in @layer and
  unlayered SFC CSS always wins over layered CSS.
-->
<style lang="scss">
// Class lands on the trigger element (UPopover forwards `class` to its Trigger)
.rpp-host { display: inline-flex; }

// UPopover's own content shell — neutralised, .rpp-panel carries the surface
.rpp-content {
  z-index: 5555555 !important;
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  overflow: visible;
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
}

.rpp-arrow {
  fill: var(--c-surface);
  stroke: none;
}

// ── Panel surface ──
.rpp-panel {
  display: flex;
  flex-direction: column;
  background: var(--c-surface);
  -webkit-backdrop-filter: var(--glass-blur-sm);
  backdrop-filter: var(--glass-blur-sm);
  border: 0;
  border-radius: var(--r-xl);
  box-shadow: var(--glass-shadow); // per-theme token, no dark-mode override needed
  overflow: hidden;
  font-family: var(--font-400, var(--font-fallback));

  &--xs   { min-width: 120px; max-width: 180px; }
  &--sm   { min-width: 160px; max-width: 240px; }
  &--md   { min-width: 200px; max-width: 320px; }
  &--lg   { min-width: 280px; max-width: 420px; }
  &--xl   { min-width: 320px; max-width: 560px; }
  &--auto { min-width: unset; max-width: unset; }

  &--no-pad .rpp-panel__body { padding: 0; }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-3);
    padding: var(--sp-3) var(--sp-4);
    border-bottom: 1px solid var(--c-border);
    flex-shrink: 0;
  }

  &__title {
    flex: 1;
    min-width: 0;
    font-size: 0.8125rem;
    font-weight: 600;
    line-height: 1.4;
    letter-spacing: -0.01em;
    color: var(--c-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    font-size: 1rem;
    color: var(--c-muted);
    background: transparent;
    border: 0;
    border-radius: var(--r-full);
    cursor: pointer;
    transition: background var(--t-fast) var(--ease-out), color var(--t-fast) var(--ease-out);

    &:hover {
      background: color-mix(in srgb, var(--c-accent) 10%, transparent);
      color: var(--c-accent);
    }

    i { display: flex; line-height: 1; }
  }

  &__body {
    flex: 1 1 auto;
    padding: var(--sp-4);
    color: var(--c-text);

    &--scroll {
      max-height: min(60vh, 420px);
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: var(--color-w-b-3) transparent;

      &::-webkit-scrollbar { width: 4px; }
      &::-webkit-scrollbar-track { background: transparent; }
      &::-webkit-scrollbar-thumb { background: var(--color-w-b-3); border-radius: var(--r-full); }
    }
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--sp-2);
    padding: var(--sp-3) var(--sp-4);
    border-top: 1px solid var(--c-border);
    flex-shrink: 0;
  }
}
</style>