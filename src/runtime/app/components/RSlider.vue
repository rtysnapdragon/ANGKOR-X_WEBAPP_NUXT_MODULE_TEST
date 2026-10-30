<template>
  <!--
    .r-slider-host is the only element that lives INSIDE this component's
    scoped DOM tree. We use it as a CSS custom-property carrier and as the
    namespace anchor for the global (non-scoped) style block below.
  -->
  <div class="r-slider-host" :class="sliderScreenMode === 'bottom' ? 'r-slider-host--bottom' : ''">
    <USlideover
      v-model:open="isOpen"
      :side="sliderScreenMode"
      :ui="mergedUI"
      :transition="transition"
      :overlay="overlay ?? true"
      :dismissible="resolvedDismissible"
      :prevent-close="preventClose"
      :close="{
        icon: closeIcon || 'ri-close-line',
        color: 'neutral',
        variant: 'ghost'
      }"
    >
      <!-- #header slot — lives in the portal but we own the markup -->
      <template #header>
        <slot name="header">
          <!-- Dirty form indicator strip -->
          <div v-if="dirty" class="rs__dirty-bar" aria-hidden="true" />
          <div class="rs-header">
            <div class="rs-header__left">
              <i v-if="icon" :class="[icon, 'rs-header__icon']" />
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
              <button class="rs-header__close" aria-label="Close" @click="closed">
                <i class="ri-close-line" />
              </button>
            </div>
          </div>
        </slot>
      </template>

      <!-- #body slot -->
      <template #body>
        <div
          ref="refRDrawerBody"
          class="rs-body"
          :class="{ 'rs-body--scroll': hasScroll }"
        >
          <slot />
        </div>
      </template>

      <!-- #footer slot — only renders when parent provides content -->
      <template v-if="$slots.footer" #footer>
        <div class="rs-footer">
          <slot name="footer" />
        </div>
      </template>
    </USlideover>
  </div>
</template>

<script setup>
import { useScreenStore } from '../stores/screen'

const screen = useScreenStore()

/* ── model + props ── */
const isOpen = defineModel()

const props = defineProps({
  title:        { type: String,  default: undefined },
  description:  { type: String,  default: undefined },
  icon:         { type: String,  default: undefined },
  closeIcon:    { type: String,  default: undefined },
  side:         { type: String,  default: 'right'   }, // 'left' | 'right' | 'top' | 'bottom'
  width:        { type: Number,  default: undefined }, // px, desktop only
  maxWidth:     { type: Number,  default: 900       }, // px
  transition:   { type: Boolean, default: true      },
  overlay:      { type: Boolean, default: true      },
  dismissible:  { type: Boolean, default: true      },
  preventClose: { type: Boolean, default: false     },
  // isScroll:     { type: Boolean, default: false     },
  ui:           { type: Object,  default: () => ({}) },
  // Dirty form guard — when true, clicking outside (overlay) will NOT close the slider.
  // The X button in the header still works (calls closed() explicitly).
  // Use with useZodForm().isDirty or useFormDirty()
  dirty:        { type: Boolean, default: false     },
})

const emit = defineEmits(['closed'])

/* ── computed ── */
const sliderScreenMode = computed(() =>
  screen.isMobile ? 'bottom' : (props.side || 'right')
)

// When dirty=true, block overlay/backdrop click. X button still works via closed().
const resolvedDismissible = computed(() => props.dirty ? false : props.dismissible)

/*
 * Build overlay merge safely — defaultUI.overlay was '' (string),
 * so spread of ...props.ui?.overlay?.transition crashed silently.
 * Now overlay is always an object before merging.
 */
const mergedUI = computed(() => {
  const isMobile = screen.isMobile

  const base = {
    // content gets our class so the global SCSS can target it
    content: [
      'rs-content',
      isMobile ? 'rs-content--bottom' : '',
      !isMobile && props.width ? `rs-content--width-${props.width}` : '',
    ],
    // header/body/footer ui values must be plain strings in NuxtUI v4 tv()
    header:  'rs-ui-header w-full',
    body:    'rs-ui-body w-full',
    footer:  'rs-ui-footer gap-0 p-1 sm:px-1 w-full',
    overlay: 'rs-overlay',
  }

  // Safe merge — never spread a non-object
  const userUI      = props.ui && typeof props.ui === 'object' ? props.ui : {}
  const userOverlay = userUI.overlay && typeof userUI.overlay === 'object' ? userUI.overlay : {}

  return {
    ...base,
    ...userUI,
    overlay: { ...userOverlay },
  }
})

/* ── scroll detection ── */
const refRDrawerBody = ref(null)
const hasScroll = ref(false)

let resizeObserver = null
let mutationObserver = null

function checkScroll() {
  const body = refRDrawerBody.value

  if (!body) {
    hasScroll.value = false
    return
  }

  // Force browser layout to be up-to-date
  const scrollHeight = body.scrollHeight
  const clientHeight = body.clientHeight

  hasScroll.value = scrollHeight > clientHeight + 1
}

async function observeBody() {
  await nextTick()

  const body = refRDrawerBody.value

  if (!body) return

  // Initial check
  checkScroll()

  // Detect size changes
  resizeObserver?.disconnect()
  resizeObserver = new ResizeObserver(() => {
    checkScroll()
  })

  resizeObserver.observe(body)

  // Detect slot/content changes
  mutationObserver?.disconnect()
  mutationObserver = new MutationObserver(() => {
    checkScroll()
  })

  mutationObserver.observe(body, {
    childList: true,
    subtree: true,
    characterData: true,
  })
}

function stopObservingBody() {
  resizeObserver?.disconnect()
  resizeObserver = null

  mutationObserver?.disconnect()
  mutationObserver = null

  window.removeEventListener('resize', checkScroll)
}

onMounted(async () => {
  await observeBody()

  window.addEventListener('resize', checkScroll, { passive: true })
})

onUnmounted(() => {
  stopObservingBody()
})

watch(isOpen, async (open) => {
  if (open) {
    // USlideover is teleported, so give it time to render
    await nextTick()

    setTimeout(() => {
      observeBody()
    }, 120)
  } else {
    stopObservingBody()
    hasScroll.value = false
  }
})


function closed() {
  isOpen.value = false
  emit('closed')
}
</script>

<!--
  SCOPED block — only for the HOST element (.r-slider-host).
  CSS custom properties set here flow into the portal via var() inheritance
  because the portal content reads vars from :root / body, and we set them
  on .r-slider-host which is an ancestor in the *cascade* (not DOM) sense.
  All actual portal element styling is in the GLOBAL block below.
-->
<!-- <style lang="scss" scoped>

.r-slider-host {
  // Expose token overrides as custom props so the global block can read them
  --rs-width:      v-bind("props.width ? props.width + 'px' : '420px'");
  --rs-max-width:  v-bind("props.maxWidth ? props.maxWidth + 'px' : '900px'");
  display: contents; // host div adds zero layout impact
}
</style> -->

<!--
  GLOBAL (non-scoped) block — targets the teleported portal DOM.

  WHY NOT SCOPED?
  USlideover uses <DialogPortal> which teleports to document.body.
  Vue's scoped CSS adds a [data-v-xxxxxx] attribute to elements inside
  the component's own DOM subtree. The teleported elements are OUTSIDE
  that subtree, so Vue never stamps the scoped attribute on them.
  Result: every :deep() rule in a scoped block simply never matches.

  FIX: Use a non-scoped block, namespaced by .rs-content (our custom class
  injected via the ui prop) so we never accidentally leak styles globally.
-->
<style lang="scss">
// .rs-content--width-400 { width: 400px; }
// .rs-content--width-500 { width: 500px; }
// .rs-content--width-600 { width: 600px; }
// .rs-content--width-700 { width: 700px; }
// .rs-content--width-800 { width: 900px; }

// .r-slider-host {
//   // Expose token overrides as custom props so the global block can read them
//   --rs-width:      v-bind("props.width ? props.width + 'px' : '420px'");
//   --rs-max-width:  v-bind("props.maxWidth ? props.maxWidth + 'px' : '900px'");
//   display: contents; // host div adds zero layout impact
// }
/* ── dirty bar + unsaved badge ── */
.rs__dirty-bar {
  height: 3px;
  background: linear-gradient(90deg, var(--c-accent), var(--c-accent-2, #ffb347));
  flex-shrink: 0;
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
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--c-accent);
  background: rgba(255, 140, 66, 0.1);
  border: 1px solid rgba(255, 140, 66, 0.25);
  white-space: nowrap;
  i { font-size: 0.8rem; }
}

/* ── overlay ── */
.rs-overlay {
  background: color-mix(in srgb, var(--c-bg) 60%, transparent) !important;
  backdrop-filter: blur(4px);
}

/* ── content panel (the sliding drawer itself) ── */
.rs-content {
  // Layout
  display: flex;
  flex-direction: column;
  width: v-bind('props.width ? props.width + "px" : "420px"') !important;
  max-width: v-bind('props.maxWidth ? props.maxWidth + "px" : "900px"') !important;
  height: 100dvh;
  min-width: 380px;

  // SARIKA surface
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  color: var(--c-text);
  border-left: 1px solid var(--c-border);
  box-shadow: var(--glass-shadow);

  // radius token (consumed by NuxtUI internally via --ui-radius)
  --ui-radius: var(--r-xl);

  // Zero out NuxtUI's default slot padding — we control it per-slot
  [data-slot="header"],
  [data-slot="body"],
  [data-slot="footer"] {
    padding: 0 !important;
  }
}

/* bottom-sheet variant (mobile) */
.rs-content--bottom {
  width: 100vw !important;
  max-width: 100vw !important;
  height: auto !important;
  max-height: 92dvh;
  border-left: none;
  border-top: 1px solid var(--c-border);
  border-radius: var(--r-xl) var(--r-xl) 0 0 !important;
}

/* ── NuxtUI slot wrappers (string classes we inject via ui prop) ── */
.rs-ui-header {
  padding: 0 !important;
  border-bottom: 1px solid var(--c-border);
  min-height: 0 !important;
  width: 100% !important;
  display: flex !important;
  flex-direction: column !important;
}

.rs-ui-body {
  flex: 1;
  padding: 0 !important;
  min-height: 0 !important;
  min-width: 0;
  // overflow: hidden; // scroll controlled by rs-body inside

  // overflow-x: hidden !important; // scroll controlled by rs-body inside
  // overflow-y: auto !important; // scroll controlled by rs-body inside
}

.rs-ui-footer {
  padding: 0 !important;
  width: 100% !important;
  display: flex !important;
  border-top: 1px solid var(--c-border);
  justify-content: flex-end !important;
  align-items: center !important;
}

/* ── our own header markup (inside the #header slot) ── */
.rs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
  padding: 8px 15px;
  min-height: 64px;
  font-family: var(--font-400);
  width: 100% !important;

  &__left {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    min-width: 0;
  }

  &__icon {
    font-size: 20px;
    color: var(--c-accent);
    flex-shrink: 0;
    filter: drop-shadow(var(--glow-text));
  }

  &__title {
    margin: 0;
    font-family: var(--font-400) !important;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--c-text);
    line-height: 1.3;
  }

  &__desc {
    margin: 2px 0 0;
    font-family: var(--font-400) !important;
    font-size: 0.78rem;
    color: var(--c-muted);
    line-height: 1.4;
  }

  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    width: 32px !important;
    height: 32px !important;
    border-radius: var(--r-full);
    border: none;
    background: transparent;
    color: var(--c-muted);
    // font-size: 18px !important;
    cursor: pointer;
    flex-shrink: 0;
    padding: 0 !important;
    transition: background var(--t-fast) var(--ease-out), color var(--t-fast) var(--ease-out);

    &:hover {
      background: var(--c-hover);
      color: var(--c-text);
    }
  }
}

/* ── body content area ── */
.rs-body {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 8px 15px;
  // overflow: hidden;

  &--scroll {
    overflow-y: auto !important;
    overflow-x: hidden !important;
    padding-right: 8px !important;
    // padding-right: calc(var(--sp-4) - 4px); // compensate for scrollbar

    // SARIKA scrollbar
    // scrollbar-width: thin;
    // scrollbar-color: var(--color-w-b-3) transparent;

    // &::-webkit-scrollbar        { width: 4px; }
    // &::-webkit-scrollbar-track  { background: transparent; }
    // &::-webkit-scrollbar-thumb  {
    //   background: var(--color-w-b-3);
    //   border-radius: var(--r-full);
    // }
    // &::-webkit-scrollbar-thumb:hover {
    //   background: var(--color-w-b-2);
    // }
  }
}

/* ── footer content area ── */
.rs-footer {
  display: flex !important;
  align-items: center;
  flex-direction: row;
  justify-content: flex-end;
  gap: var(--sp-2);
  // padding: var(--sp-3) var(--sp-5);
  padding: 8px 15px;
  min-height: 56px;
}

// /* ── dark mode adjustments ── */
// .dark .rs-content {
//   border-left-color: var(--c-border);
//   box-shadow: 0 0 0 1px var(--c-border), var(--glass-shadow);
// }

// .dark .rs-content--bottom {
//   border-top-color: var(--c-border);
// }
</style>
