<template>
  <!--
    .rm-host is the only element inside this component's scoped DOM subtree.
    It carries CSS custom properties (width, etc.) that portal elements inherit
    via the cascade. All portal styling is in the global <style> block below.
  -->
  <div class="rm-host">
    <UModal
      ref="ref_content_h"
      v-model:open="isOpen"
      :transition="transition"
      :fullscreen="isFullScreen"
      :dismissible="noClose"
      :close-icon="closeIcon || 'ri-close-line'"
      :hide-header="noHeader"
      :hide-footer="noFooter"
      :content="{ style: { minWidth: modalWidthValue } }"
      :appear="appear"
      :ui="mergedUI"
      v-if="!forTable"
    >
      <!-- ── HEADER ── -->
      <template #header>
        <slot name="header">
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
              <button
                v-if="noClose"
                class="rm-btn-close"
                aria-label="Close"
                @click="onCloseModal"
              >
                <i class="ri-close-line" />
              </button>
            </div>
          </div>
        </slot>
        <div class="sub-title" v-if="$slots.subTitle">
          <slot name="subTitle"></slot>
        </div>
      </template>

      <!-- ── BODY ── -->
      <template #body>
        <div ref="ref_body_h" class="rm-body"   :class="[
          body_h > content_h - 133 ? 'rty-scroll' : '',
          props.height,
          overflowAuto ? 'overflow-auto' : '',
        ]">
          <slot />
        </div>
      </template>

      <!-- ── FOOTER — only mounts when parent provides content ── -->
      <template v-if="$slots.footer" #footer>
        <div class="rm-footer">
          <slot name="footer" />
        </div>
      </template>
    </UModal>

     <Teleport to="body" v-else>
    <div
      class="ocs-wrapper-modal"
      :class="isOpen ? 'modal-ani-show' : ''"
      v-show="isOpen"
    >
      <div class="overlay" @click.self="fnOverlayClose()">
        <div class="ocs-modal" :class="props.height">
          <div class="oc-modal-header" v-if="$slots.header">
            <div class="title">
              <slot name="header" />
            </div>
            <div
              :class="['btn-close', noClose ? '!hidden' : '']"
              @click="isOpen = false"
            >
              <i class="ri-close-large-fill"></i>
            </div>
          </div>

          <div class="oc-modal-body" ref="ref_body_h">
            <slot />
          </div>

          <div class="oc-modal-footer" v-if="$slots.footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </div>
  </Teleport>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const isOpen = defineModel()

onMounted(async () => {
  await getAllHeight();
});
const content_h = ref();

const ref_body_h = ref();
const body_h = ref();

async function getAllHeight() {
  setTimeout(() => {
    let content_h_c = document.getElementsByClassName("ref_content_h");
    if (content_h_c.length > 0) content_h.value = content_h_c[0].offsetHeight;
    body_h.value = ref_body_h.value?.offsetHeight;
  }, 100);
}

const props = defineProps({
  title:        { type: String,  default: undefined },
  description:  { type: String,  default: undefined },
  icon:         { type: String,  default: undefined },
  closeIcon:    { type: String,  default: undefined },
  isFullScreen: { type: Boolean, default: false     },
  modalWidth:   { type: String,  default: undefined }, // e.g. '600px' or '80vw'
  noClose:      { type: Boolean, default: true     }, // hide close button + lock dismiss
  noHeader:     { type: Boolean, default: false     },
  noFooter:     { type: Boolean, default: false     },
  overflowAuto: { type: Boolean, default: false     },
  ui:           { type: Object,  default: () => ({}) },
  transition:   { type: Boolean, default: true     },
  overlay:      { type: Boolean, default: false     },
  preventClose: { type: Boolean, default: false     },
  appear:       { type: Boolean, default: false     },
  width:        { type: String,  default: 'fit-content' },
  height:       { type: String,  default: 'auto' },
  forTable:     { type: Boolean, default: false     },
})

const noClose = computed(() => props.noClose)
const forTable = computed(() => props.forTable ?? false);
const transition = computed(() => props.transition);
const overlay = computed(() => props.overlay);
const preventClose = computed(() => props.preventClose);
const fullscreen = computed(() => props.fullscreen);
const appear = computed(() => props.appear);
const emit = defineEmits(['onClose'])

// Bug 8 fix: never use v-html for user-supplied strings — use {{ }} instead.
// Computed wrappers kept for reactivity but only used as text.
const modalWidthValue = computed(() => props.modalWidth ?? 'fit-content')
const overflowAuto = computed(() => props.overflowAuto ?? true)
/*
 * Bug 3 / Bug 7 fix: ui slot values must be plain strings for NuxtUI v4 tv().
 * Bug 6 fix: hide-header / hide-footer toggling done via CSS on our own classes
 *            (rm-ui-header--hidden etc.) since the scoped .hide-header rule
 *            never reached the portal anyway.
 */
const mergedUI = computed(() => {
  const base = {
    overlay:  'rm-overlay',
    content:  'rm-content ref_content_h', // this class "ref_content_h" use in table for calculate scroll also
    header:   props.noHeader ? 'rm-ui-header rm-ui-header--hidden' : 'rm-ui-header',
    body:     'rm-ui-body',
    footer:   props.noFooter ? 'rm-ui-footer rm-ui-footer--hidden' : 'rm-ui-footer',
    wrapper:  'rm-ui-wrapper',
    title:    'rm-ui-title',
    description: 'rm-ui-desc',
    close:    'rm-ui-close',
  }

  // Safe merge with caller's ui overrides
  const userUI = props.ui && typeof props.ui === 'object' ? props.ui : {}
  return { ...base, ...userUI }
})

// Bug 5 fix: dismissible = !noClose (was incorrectly `noClose` — inverted).
// Already fixed inline on the UModal binding above.

function onCloseModal() {
  isOpen.value = false
  emit('onClose')
}
</script>

<!--
  SCOPED — only touches .rm-host (lives in component tree, not portal).
  Sets CSS custom properties that cascade into portal children via var().
-->
<style lang="scss" scoped>
.rm-host {
  --rm-min-width: v-bind(modalWidthValue);
  display: contents; // zero layout impact
}
</style>

<!--
  GLOBAL (non-scoped) — targets teleported portal DOM.

  WHY NOT SCOPED?
  UModal uses <DialogPortal> → content teleports to document.body,
  outside this component's DOM subtree. Vue's scoped [data-v-xxx]
  attribute is never stamped on those elements, so every :deep()
  in a scoped block silently fails to match.

  FIX: Non-scoped block, namespaced by .rm-content / .rm-overlay
  (our custom classes injected via the ui prop) — no global leakage.
-->
<style lang="scss">

/* ── Overlay ── */
.rm-overlay {
  background: color-mix(in srgb, var(--c-bg) 55%, transparent) !important;
  backdrop-filter: blur(6px) saturate(160%);
  -webkit-backdrop-filter: blur(6px) saturate(160%);
}

/* ── Content panel (the modal box itself) ── */
.rm-content {
  // Layout — min-width driven by prop via CSS custom property
  min-width: var(--rm-min-width, fit-content);
  width: calc(100vw - 2rem);
  max-width: 560px;
  display: flex;
  flex-direction: column;
  max-height: calc(100dvh - 4rem);

  // SARIKA glass surface
  background: var(--bg-content) !important;
  backdrop-filter: var(--glass-blur) !important;
  -webkit-backdrop-filter: var(--glass-blur) !important;
  color: var(--c-text) !important;
  border: 1px solid var(--c-border);
  border-radius: var(--r-xl) !important;
  box-shadow: var(--glass-shadow) !important;
  overflow: hidden;

  // Zero out NuxtUI's slot default paddings — we control each slot
  [data-slot="header"],
  [data-slot="body"],
  [data-slot="footer"] {
    padding: 0 !important;
  }
}

/* fullscreen variant */
.rm-content[data-fullscreen="true"],
.rm-content.rm-content--fullscreen {
  width: 100vw  !important;
  max-width: 100vw !important;
  height: 100dvh !important;
  max-height: 100dvh !important;
  border-radius: 0 !important;
  border: none;
}

/* ── NuxtUI slot wrappers (injected via ui prop strings) ── */
.rm-ui-header {
  padding: 0 !important;
  min-height: 0 !important;
  border-bottom: 1px solid var(--c-border);

  // Bug 4 fix: one clean value, no conflicting overrides.
  // Actual height is driven by rm-header padding below.
}

/* Bug 6 fix: hide via global class that actually reaches the portal */
.rm-ui-header--hidden,
.rm-ui-footer--hidden {
  display: none !important;
}

.rm-header__icon{
  font-size: 18px;
  padding: 5px !important;
  border-radius: 50% !important;
  background-color: transparent !important;
  width: 40px !important;
  height: 40px !important;
  display: flex;
  align-items: center;
  justify-content: center;
}
.rm-ui-body {
  flex: 1;
  padding: 0 !important;
  overflow: hidden; // scroll controlled inside rm-body
}

.rm-ui-footer {
  padding: 0 !important;
  border-top: 1px solid var(--c-border);
}

.rm-ui-wrapper {
  // NuxtUI's inner title+description wrapper — zero extra spacing
}

.rm-ui-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--c-text);
  line-height: 1.3;
  margin: 0;
}

.rm-ui-desc {
  font-size: 0.78rem;
  color: var(--c-muted);
  margin-top: 2px;
  line-height: 1.4;
}

// NuxtUI's own close button (when we don't use #header slot)
.rm-ui-close {
  position: absolute;
  top: var(--sp-3);
  inset-inline-end: var(--sp-3);
}

/* ── Our header markup (inside the #header slot) ── */
.rm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
  padding: var(--sp-4) var(--sp-5);
  min-height: 60px;
  font-family: var(--font-400,var(--font-fallback));
  width: 100% !important;

  &__left {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    min-width: 0;
    flex: 1;
  }

  &__icon {
    font-size: 22px;
    color: var(--c-accent);
    flex-shrink: 0;
    filter: drop-shadow(var(--glow-text));
  }

  &__text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__title {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--c-text);
    line-height: 2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: var(--font-400,var(--font-fallback));
  }

  &__desc {
    margin: 2px 0 0;
    font-size: 0.78rem;
    color: var(--c-muted);
    line-height: 1.4;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    flex-shrink: 0;
  }
}

/* ── Close button ── */
.rm-btn-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: var(--r-full) !important;
  border: 1px solid var(--c-border);
  background: transparent;
  color: var(--c-muted);
  font-size: 16px;
  cursor: pointer;
  flex-shrink: 0;
  transition:
    background var(--t-fast) var(--ease-out),
    border-color var(--t-fast) var(--ease-out),
    color var(--t-fast) var(--ease-out);

  // Bug 3 fix: was `.btn-close { :hover { ... } }` — child combinator inside
  // a class rule, styling children of .btn-close, not the button itself.
  &:hover {
    background: var(--c-hover);
    border-color: var(--c-accent);
    color: var(--c-accent);
  }
}

/* ── Body content area ── */
.rm-body {
  padding: var(--sp-2) var(--sp-5);
  font-size: 13px;
  color: var(--c-text);
  font-family: var(--font-400,var(--font-fallback));
  overflow-y: auto;
  max-height: calc(100dvh - 4rem - 60px - 56px); // viewport - modal margin - header - footer



  // scrollbar-width: thin;
  // scrollbar-color: var(--color-w-b-3) transparent;

  // &::-webkit-scrollbar        { width: 4px; }
  // &::-webkit-scrollbar-track  { background: transparent; }
  // &::-webkit-scrollbar-thumb  {
  //   background: var(--color-w-b-3);
  //   border-radius: var(--r-full);
  // }
  // &::-webkit-scrollbar-thumb:hover { background: var(--color-w-b-2); }
}

.rty-scroll {
  // max-height: calc(100% - 52px);
  overflow-y: auto;
  padding-right: 10px!important;
}

/* ── Footer content area ── */
.rm-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--sp-2);
  padding: var(--sp-3) var(--sp-5);
  min-height: 56px;
  font-family: var(--font-400,var(--font-fallback));
  width: 100% !important
}

/* ── Dark mode ── */
.dark .rm-content {
  box-shadow:
    0 0 0 1px var(--c-border),
    var(--glass-shadow) !important;
}

.dark .rm-overlay {
  background: color-mix(in srgb, var(--c-bg) 70%, transparent) !important;
}

/* ── Mobile ── */
@media (max-width: 480px) {
  .rm-content {
    width: calc(100vw - 1rem);
    max-width: 100vw;
    border-radius: var(--r-lg) !important;
  }
}
</style>