<template>
  <div class="contents">
    <UModal
      v-if="!forTable"
      v-model:open="isOpen"
      :transition="transition"
      :fullscreen="isFs"
      :dismissible="noClose"
      :close="false"
      :content="{ style: contentStyle }"
      :ui="mergedUI"
    >
      <!-- ── HEADER (not mounted at all when noHeader) ── -->
      <template v-if="!noHeader" #header>
        <slot name="header" :close="onCloseModal" :fullscreen="isFs" :toggle-fullscreen="toggleFullscreen">
          <div class="rm-header">
            <div class="rm-header__left">
              <i v-if="icon" :class="[icon, 'rm-header__icon']" />
              <div class="rm-header__text">
                <h3 v-if="title" class="rm-header__title">{{ title }}</h3>
                <p v-if="description" class="rm-header__desc">{{ description }}</p>
              </div>
            </div>

            <div class="rm-header__actions">
              <slot name="headerCenter" />
              <slot name="headerRight" />
              <!-- hidden when fullscreen is forced through the legacy isFullScreen prop -->
              <button
                v-if="expandable && !isFullScreen"
                type="button"
                class="rm-btn-close"
                :aria-label="isFs ? 'Exit full screen' : 'Full screen'"
                @click="toggleFullscreen"
              >
                <i :class="isFs ? 'ri-fullscreen-exit-line' : 'ri-fullscreen-line'" />
              </button>
              <button v-if="noClose" type="button" class="rm-btn-close" aria-label="Close" @click="onCloseModal">
                <i :class="closeIcon || 'ri-close-line'" />
              </button>
            </div>
          </div>
        </slot>
        <div class="sub-title" v-if="$slots.subTitle">
          <slot name="subTitle" />
        </div>
      </template>

      <!-- ── BODY ── -->
      <template #body>
        <div class="rm-body" :class="[props.height, props.bodyClass, props.overflowAuto && 'overflow-auto']">
          <slot />
        </div>
      </template>

      <!-- ── FOOTER (only when provided and not noFooter) ── -->
      <template v-if="$slots.footer && !noFooter" #footer>
        <div class="rm-footer">
          <slot name="footer" />
        </div>
      </template>
    </UModal>

    <!-- Legacy table modal (styled elsewhere) -->
    <Teleport to="body" v-else>
      <div class="r-wrapper-modal" :class="isOpen ? 'modal-ani-show' : ''" v-show="isOpen">
        <div class="overlay" @click.self="isOpen = false">
          <div class="r-modal" :class="props.height">
            <div class="r-modal-header" v-if="$slots.header">
              <div class="title"><slot name="header" /></div>
              <div :class="['btn-close', noClose ? '!hidden' : '']" @click="isOpen = false">
                <i class="ri-close-large-fill"></i>
              </div>
            </div>
            <div class="r-modal-body"><slot /></div>
            <div class="r-modal-footer" v-if="$slots.footer"><slot name="footer" /></div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const isOpen = defineModel()
// v-model:fullscreen (controlled) or the expandable toggle (uncontrolled)
const isFullscreen = defineModel('fullscreen', { default: false })
const emit = defineEmits(['onClose'])

const props = defineProps({
  title:        { type: String,  default: undefined },
  description:  { type: String,  default: undefined },
  icon:         { type: String,  default: undefined },
  closeIcon:    { type: String,  default: undefined },
  isFullScreen: { type: Boolean, default: false },      // legacy: forces fullscreen (no toggle)
  expandable:   { type: Boolean, default: false },      // adds a full-screen toggle to the header
  modalWidth:   { type: String,  default: undefined }, // '600px' | '80vw' ...
  modalHeight:  { type: String,  default: undefined }, // '600px' | '80vh' ...
  modalRadius:  { type: [String, Number], default: undefined }, // '8px' | 16 (px) | 'var(--r-lg)' | '0'
  bodyClass:    { type: String,  default: undefined },
  noClose:      { type: Boolean, default: true },      // true = close button shown + dismissible
  noHeader:     { type: Boolean, default: false },
  noFooter:     { type: Boolean, default: false },
  overflowAuto: { type: Boolean, default: false },
  ui:           { type: Object,  default: () => ({}) },
  transition:   { type: Boolean, default: true },
  height:       { type: String,  default: 'auto' },
  forTable:     { type: Boolean, default: false },
  // kept for caller compatibility (unused)
  overlay:      { type: Boolean, default: false },
  preventClose: { type: Boolean, default: false },
  appear:       { type: Boolean, default: false },
  width:        { type: String,  default: 'fit-content' },
})

// Portal content lives outside this component's DOM, so a CSS var set on our
// root never reaches it. Set the var on the content element itself instead.
const hasRadius = computed(() => props.modalRadius !== undefined && props.modalRadius !== null && props.modalRadius !== '')

const contentStyle = computed(() => {
  const style = {}
  if (props.modalWidth) style['--rm-w'] = props.modalWidth
  if (props.modalHeight) style['--rm-h'] = props.modalHeight
  if (hasRadius.value) {
    style['--rm-radius'] = typeof props.modalRadius === 'number' ? `${props.modalRadius}px` : props.modalRadius
  }
  return style
})

// Effective fullscreen: the model / toggle OR the legacy `isFullScreen` prop.
const isFs = computed(() => isFullscreen.value || props.isFullScreen)

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value
}

// Hook classes per UModal slot; caller's `ui` is appended per slot, not replacing.
// `ref_content_h` is relied on by RTable for scroll calculation — keep it.
const mergedUI = computed(() => {
  const base = {
    overlay: 'rm-overlay',
    content: ['rm-content ref_content_h', isFs.value && 'rm-content--fullscreen'],
    header: 'rm-ui-header',
    body: 'rm-ui-body',
    footer: 'rm-ui-footer',
  }
  const user = props.ui || {}
  return Object.fromEntries(
    [...new Set([...Object.keys(base), ...Object.keys(user)])].map((k) => [
      k,
      [base[k], user[k]].flat().filter(Boolean).join(' '),
    ]),
  )
})

function onCloseModal() {
  isOpen.value = false
  emit('onClose')
}
</script>

<!--
  GLOBAL (non-scoped): UModal teleports to <body>, so scoped [data-v] never matches.
  Everything is namespaced under .rm-* (injected via the ui prop) — no leakage.
  No !important needed: Nuxt UI 4 / Tailwind 4 utilities sit in @layer, and
  unlayered SFC CSS always wins over layered CSS.
-->
<style lang="scss">
/* ── Overlay ── */
.rm-overlay {
  background: color-mix(in srgb, var(--c-bg) 55%, transparent);
  -webkit-backdrop-filter: var(--glass-blur-sm);
  backdrop-filter: var(--glass-blur-sm);
}

/* ── Panel ── */
.rm-content {
  display: flex;
  flex-direction: column;
  width: var(--rm-w, 560px);
  height: var(--rm-h, auto);
  max-width: calc(100vw - 2rem);
  max-height: calc(100dvh - 4rem);
  overflow: hidden;
  background: var(--bg-wrapper, var(--c-surface));
  color: var(--c-text);
  font-family: var(--font-400, var(--font-fallback));
  border: 0;
  border-radius: var(--rm-radius, var(--r-xl)); // modalRadius prop
  box-shadow: none; // kills Tailwind ring/shadow defaults

  // kills default divide-y between header/body/footer
  > * { border-width: 0; }

  &--fullscreen {
    width: 100vw;
    max-width: 100vw;
    height: 100dvh;
    max-height: 100dvh;
    border-radius: 0;
  }
}

/* ── UModal slots ── */
.rm-ui-header { padding: 0; min-height: 0; flex-shrink: 0;border-bottom: 1px solid var(--c-border); }

.rm-ui-body {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0; // lets .rm-body scroll — replaces the old JS height measuring
  padding: 0;
  overflow: hidden;
}

.rm-ui-footer {
  flex-shrink: 0;
  padding: 0;
  border-top: 1px solid var(--c-border);
}

/* ── Header ── */
.rm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
  width: 100%;
  min-height: 60px;
  padding: var(--sp-4) var(--sp-5);

  &__left { display: flex; align-items: center; gap: var(--sp-3); flex: 1; min-width: 0; }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    font-size: 22px;
    color: var(--c-accent);
    border-radius: var(--r-full);
    filter: drop-shadow(var(--glow-text));
  }

  &__text { display: flex; flex-direction: column; min-width: 0; }

  &__title {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    line-height: 1.4;
    color: var(--c-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__desc { margin: 2px 0 0; font-size: 0.78rem; line-height: 1.4; color: var(--c-muted); }

  &__actions { display: flex; align-items: center; gap: var(--sp-2); flex-shrink: 0; }
}

/* ── Close button ── */
.rm-btn-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  font-size: 16px;
  color: var(--c-muted);
  background: transparent;
  border: 1px solid var(--c-border);
  border-radius: var(--r-full);
  cursor: pointer;
  transition:
    background var(--t-fast) var(--ease-out),
    border-color var(--t-fast) var(--ease-out),
    color var(--t-fast) var(--ease-out);

  &:hover { background: var(--c-hover); border-color: var(--c-accent); color: var(--c-accent); }
}

/* ── Body / Footer content ── */
.rm-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: var(--sp-2) var(--sp-5);
  font-size: 13px;
  color: var(--c-text);
}

.rm-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--sp-2);
  width: 100%;
  min-height: 66px;
  padding: var(--sp-3) var(--sp-5);
}

/* ── Mobile ── */
@media (max-width: 480px) {
  .rm-content:not(.rm-content--fullscreen) {
    max-width: calc(100vw - 1rem);
    border-radius: var(--rm-radius, var(--r-lg));
  }
}
</style>




<!-- <RModal v-model="open" title="Report" expandable :modal-radius="16" />
<RModal v-model="open" v-model:fullscreen="fs" expandable modal-radius="0" /> -->