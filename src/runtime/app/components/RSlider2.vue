<!-- components/RSlideover.vue -->
<script setup>
const open = defineModel({ type: Boolean, default: false })

const props = defineProps({
  title:        { type: String,  default: null },
  description:  { type: String,  default: null },
  icon:         { type: String,  default: null },
  ui:           { type: Object,  default: () => ({}) },
  transition:   { type: [Object, Boolean], default: undefined },
  overlay:      { type: Boolean, default: true },
  preventClose: { type: Boolean, default: false },
  side:         { type: String,  default: 'right' }, // 'left' | 'right'
  appear:       { type: Boolean, default: false },
  isScroll:     { type: Boolean, default: true },
  dismissible:  { type: Boolean, default: true },
  closeIcon:    { type: String,  default: 'i-heroicons-x-mark' },
  class:        { type: [String, Array, Object], default: '' },
})

const emit = defineEmits(['update:modelValue', 'open', 'close', 'after-leave'])

// ── Refs ─────────────────────────────────────────────────────────
const bodyRef      = ref(null)
const hasScrollY   = ref(false)
const bodyMaxH     = ref('none')

// ── Measure body height to determine scroll need ─────────────────
const measureBody = () => {
  nextTick(() => {
    const el = bodyRef.value
    if (!el) return

    // Natural scroll height vs visible height
    hasScrollY.value = el.scrollHeight > el.clientHeight

    // Set max-height from available viewport space
    const rect     = el.getBoundingClientRect()
    const viewH    = window.innerHeight
    const footerEl = el.closest('[data-slideover]')?.querySelector('[data-slot="footer"]')
    const footerH  = footerEl ? footerEl.offsetHeight : 0
    const headerEl = el.closest('[data-slideover]')?.querySelector('[data-slot="header"]')
    const headerH  = headerEl ? headerEl.offsetHeight : 0

    const available = viewH - rect.top - footerH - headerH - 48
    bodyMaxH.value  = `${Math.max(available, 120)}px`
  })
}

// ── Watch open state ─────────────────────────────────────────────
watch(open, (val) => {
  if (val) {
    emit('open')
    nextTick(measureBody)
    window.addEventListener('resize', measureBody)
  } else {
    emit('close')
    window.removeEventListener('resize', measureBody)
  }
})

onBeforeUnmount(() => window.removeEventListener('resize', measureBody))

// ── Merged UI tokens ─────────────────────────────────────────────
const defaultUI = computed(() => ({
  overlay:   'r-slideover-overlay fixed inset-0',
  content:   [
    'r-slideover-content',
    'fixed inset-y-0 flex flex-col focus:outline-none',
    'bg-[var(--c-surface)] shadow-2xl',
    props.side === 'left' ? 'left-0' : 'right-0',
  ].join(' '),
  header:    'r-slideover-header flex items-start justify-between gap-3 shrink-0',
  wrapper:   'r-slideover-wrapper flex flex-col min-h-0 flex-1 overflow-hidden',
  body:      [
    'r-slideover-body flex-1',
    props.isScroll ? 'overflow-y-auto' : 'overflow-hidden',
  ].join(' '),
  footer:    'r-slideover-footer shrink-0',
  title:     'r-slideover-title text-base font-semibold',
  description: 'r-slideover-desc text-sm mt-0.5',
  close:     'r-slideover-close',
  ...props.ui,
}))

// ── Expose bodyRef for parent usage ──────────────────────────────
defineExpose({ bodyRef, hasScrollY, measureBody })
</script>

<template>
  <USlideover
    v-model:open="open"
    :side="side"
    :overlay="overlay"
    :prevent-close="preventClose"
    :appear="appear"
    :dismissible="dismissible"
    :transition="transition"
    :class="[props.class, 'r-slideover-root']"
    :ui="defaultUI"
    data-slideover
    @after-leave="$emit('after-leave')"
  >
    <!-- ── Header slot ── -->
    <template #header>
      <slot name="header">
        <div class="r-slideover-head-inner">
          <!-- Icon + title + description -->
          <div class="r-slideover-head-left">
            <div v-if="icon || $slots.icon" class="r-slideover-icon-wrap">
              <slot name="icon">
                <i :class="[icon, 'r-slideover-icon']" aria-hidden="true" />
              </slot>
            </div>
            <div class="r-slideover-head-text">
              <slot name="title">
                <p v-if="title" class="r-slideover-title" v-html="title" />
              </slot>
              <slot name="description">
                <p v-if="description" class="r-slideover-desc" v-html="description" />
              </slot>
            </div>
          </div>

          <!-- Close button -->
          <button
            v-if="dismissible"
            type="button"
            class="r-slideover-close-btn"
            :aria-label="'Close'"
            @click="open = false"
          >
            <i :class="closeIcon" aria-hidden="true" />
          </button>
        </div>
      </slot>
    </template>

    <!-- ── Default body slot ── -->
    <template #body>
      <!-- Scroll wrapper — measured by bodyRef -->
      <div
        ref="bodyRef"
        class="r-slideover-body-scroll"
        :class="{ 'has-scroll': hasScrollY }"
        :style="{ maxHeight: bodyMaxH, overflowY: isScroll ? 'auto' : 'hidden' }"
      >
        <slot />
      </div>
    </template>

    <!-- ── Footer slot ── -->
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </USlideover>
</template>

<style lang="scss" scoped>
// ── Root ────────────────────────────────────────────────────────
.r-slideover-root {
  font-family: var(--font-fallback, 'Inter', system-ui, sans-serif);
}

// ── Overlay ──────────────────────────────────────────────────────
:deep(.r-slideover-overlay) {
  background: var(--c-bg) !important;
  backdrop-filter: blur(6px) saturate(140%);
  -webkit-backdrop-filter: blur(6px) saturate(140%);
}

// ── Content panel ────────────────────────────────────────────────
:deep(.r-slideover-content) {
  width: var(--r-slideover-width, 480px);
  max-width: 95vw;
  // background: var(--c-surface);
  background: var(--c-bg) !important;
  box-shadow:
    -8px 0 40px rgba(0, 0, 0, 0.12),
    -1px 0 0 var(--c-border);
  display: flex;
  flex-direction: column;
  // height is always 100vh (inset-y-0)

  // Left side shadow direction flips
  [data-side='left'] & {
    box-shadow: 8px 0 40px rgba(0, 0, 0, 0.12), 1px 0 0 var(--c-border);
  }

  @media (max-width: 640px) {
    width: 90vw !important;
    max-width: 90vw !important;
  }
}

// ── Header ───────────────────────────────────────────────────────
:deep(.r-slideover-header) {
  padding: 18px 20px 16px;
  border-bottom: 1px solid var(--c-border);
  background: var(--c-bg) !important;
  flex-shrink: 0;
}

.r-slideover-head-inner {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.r-slideover-head-left {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.r-slideover-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: var(--r-md, 12px);
  background: rgba(255, 140, 66, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.r-slideover-icon {
  font-size: 18px;
  color: var(--c-accent, #ff8c42);
}

.r-slideover-head-text {
  flex: 1;
  min-width: 0;
}

.r-slideover-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--c-text);
  letter-spacing: -0.01em;
  line-height: 1.3;
  margin: 0;
}

.r-slideover-desc {
  font-size: 0.775rem;
  color: var(--c-muted);
  line-height: 1.5;
  margin: 3px 0 0;
}

// ── Close button ─────────────────────────────────────────────────
.r-slideover-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: var(--r-md, 12px);
  border: 1px solid var(--c-border);
  background: transparent;
  color: var(--c-muted);
  cursor: pointer;
  flex-shrink: 0;
  font-size: 17px;
  transition:
    background var(--t-fast, 150ms),
    color var(--t-fast, 150ms),
    border-color var(--t-fast, 150ms);

  &:hover {
    background: rgba(255, 140, 66, 0.08);
    border-color: rgba(255, 140, 66, 0.3);
    color: var(--c-accent, #ff8c42);
  }

  &:active { transform: scale(0.93); }
}

// ── Wrapper (flex column, fills remaining height) ─────────────────
:deep(.r-slideover-wrapper) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// ── Body (NuxtUI slot) ────────────────────────────────────────────
:deep(.r-slideover-body) {
  flex: 1;
  min-height: 0;
  overflow: hidden; // child .r-slideover-body-scroll handles scroll
  padding: 0;       // reset NuxtUI default; padding goes on inner scroll div
}

// ── Inner scroll wrapper (our ref target) ────────────────────────
.r-slideover-body-scroll {
  height: 100%;
  padding: 18px 20px;

  // Custom scrollbar
  scrollbar-width: thin;
  scrollbar-color: var(--c-accent, #ff8c42) transparent;

  &::-webkit-scrollbar        { width: 4px; }
  &::-webkit-scrollbar-track  { background: transparent; }
  &::-webkit-scrollbar-thumb  {
    background: rgba(255, 140, 66, 0.35);
    border-radius: 999px;
    &:hover { background: var(--c-accent, #ff8c42); }
  }

  // Subtle top shadow when scrolled content exists
  &.has-scroll {
    border-top: 1px solid var(--c-border);
  }
}

// ── Footer ────────────────────────────────────────────────────────
:deep(.r-slideover-footer) {
  padding: 14px 20px;
  border-top: 1px solid var(--c-border);
    background: var(--c-surface);

  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-shrink: 0;
}

// ── Dark mode ─────────────────────────────────────────────────────
.dark {
  :deep(.r-slideover-content) {
      background: var(--c-surface);

    box-shadow:
      -8px 0 40px rgba(0, 0, 0, 0.5),
      -1px 0 0 var(--c-border);
  }

  :deep(.r-slideover-overlay) {
    background: rgba(0, 0, 0, 0.65);
  }
}

// ── Width sizes (use via class or CSS var) ─────────────────────
// Pass :class="'r-slideover--sm'" etc or override --r-slideover-width
.r-slideover-root {
  &.r-slideover--sm  { --r-slideover-width: 360px; }
  &.r-slideover--md  { --r-slideover-width: 480px; }   // default
  &.r-slideover--lg  { --r-slideover-width: 600px; }
  &.r-slideover--xl  { --r-slideover-width: 760px; }
  &.r-slideover--2xl { --r-slideover-width: 900px; }
  &.r-slideover--full{ --r-slideover-width: 100vw; }
}
</style>