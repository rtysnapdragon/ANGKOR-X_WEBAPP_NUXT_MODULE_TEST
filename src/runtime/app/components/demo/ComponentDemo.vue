<template>
  <div class="srd-demo">
    <h1>RSlider &amp; RDrawer — Usage Reference</h1>

    <!-- ── Component switch ── -->
    <div class="srd-seg" role="tablist" aria-label="Component">
      <button
        v-for="g in groupNames"
        :key="g"
        type="button"
        role="tab"
        class="srd-seg__btn"
        :class="{ 'is-active': group === g }"
        :aria-selected="group === g"
        @click="setGroup(g)"
      >
        {{ g }}
        <span class="srd-seg__count">{{ groups[g].length }}</span>
      </button>
    </div>

    <!-- ── Tab bar: Swiper = horizontal swipe / drag / wheel scroll when tabs overflow ── -->
    <Swiper
      class="srd-tabs"
      role="tablist"
      :modules="[FreeMode, Mousewheel]"
      slides-per-view="auto"
      :space-between="6"
      free-mode
      :mousewheel="{ forceToAxis: true }"
      @swiper="onSwiper"
    >
      <SwiperSlide v-for="t in tabs" :key="t.key" class="srd-tab-slide">
        <button
          type="button"
          role="tab"
          class="srd-tab"
          :class="{ 'is-active': tab === t.key }"
          :aria-selected="tab === t.key"
          @click="tab = t.key"
        >
          <i :class="t.icon" aria-hidden="true" />
          {{ t.label }}
        </button>
      </SwiperSlide>
    </Swiper>

    <p v-if="log.length" class="srd-log">
      <strong>Events:</strong>
      <span v-for="(l, i) in log" :key="i">{{ l }}</span>
    </p>

    <!-- ── Panels ── -->
    <Transition name="srd-fade" mode="out-in">
      <div :key="tab" class="srd-panel" role="tabpanel">
        <p class="srd-desc">{{ activeTab?.desc }}</p>

        <!-- ═══════════ RSlider ═══════════ -->

        <!-- Sides -->
        <template v-if="tab === 's-sides'">
          <div class="srd-row">
            <UButton v-for="side in sides" :key="side" :label="side" variant="outline" @click="s[side] = true" />
          </div>
          <RSlider
            v-for="side in sides"
            :key="side"
            v-model="s[side]"
            :side="side"
            :title="`Slider — ${side}`"
            description="On phones every side becomes a bottom sheet"
            icon="ri-layout-right-line"
            @closed="onClosed(`slider:${side}`)"
          >
            <p v-for="n in 3" :key="n">Content paragraph {{ n }}.</p>
          </RSlider>
        </template>

        <!-- Width -->
        <template v-else-if="tab === 's-width'">
          <div class="srd-row">
            <UButton label="width 600" variant="outline" @click="s.wide = true" />
            <UButton label="width 300" variant="outline" @click="s.narrow = true" />
          </div>
          <RSlider v-model="s.wide" :width="600" :max-width="700" title="600px wide" icon="ri-expand-width-line">
            <p>`width` is a number in px (default 420), capped by `max-width`.</p>
          </RSlider>
          <RSlider v-model="s.narrow" :width="300" title="300px wide" icon="ri-collapse-horizontal-line">
            <p>Smaller than the old hard 380px minimum.</p>
          </RSlider>
        </template>

        <!-- Fullscreen -->
        <template v-else-if="tab === 's-full'">
          <div class="srd-row">
            <UButton label="fullscreen prop" variant="outline" @click="s.full = true" />
            <UButton label="expandable (toggle)" variant="outline" @click="s.expand = true" />
            <UButton label="v-model:fullscreen" variant="outline" @click="s.modelFull = true" />
          </div>

          <RSlider v-model="s.full" fullscreen title="Always fullscreen" icon="ri-fullscreen-line">
            <p>Plain `fullscreen` prop.</p>
          </RSlider>

          <RSlider v-model="s.expand" expandable title="Expandable" description="Use the header button" icon="ri-fullscreen-line">
            <p>Uncontrolled — toggles internally.</p>
          </RSlider>

          <RSlider v-model="s.modelFull" v-model:fullscreen="sFullscreen" expandable title="Controlled fullscreen" icon="ri-fullscreen-line">
            <p>Parent sees the state: <strong>{{ sFullscreen }}</strong></p>
            <UButton label="Toggle from inside" size="sm" @click="sFullscreen = !sFullscreen" />
          </RSlider>
        </template>

        <!-- Dirty guard -->
        <template v-else-if="tab === 's-dirty'">
          <UButton label="Edit profile" variant="outline" @click="s.dirty = true" />
          <RSlider
            v-model="s.dirty"
            title="Edit profile"
            description="Type something, then click the overlay"
            icon="ri-user-settings-line"
            :dirty="isDirty"
            :prevent-close="saving"
            @closed="onClosed('slider:dirty')"
          >
            <div class="srd-form">
              <UInput v-model="form.name" placeholder="Name" />
              <UInput v-model="form.email" placeholder="Email" />
            </div>
            <template #footer="{ close }">
              <UButton label="Cancel" variant="ghost" color="neutral" :disabled="saving" @click="resetForm(); close()" />
              <UButton label="Save" :loading="saving" :disabled="!isDirty" @click="save(close)" />
            </template>
          </RSlider>
        </template>

        <!-- Slots -->
        <template v-else-if="tab === 's-slots'">
          <div class="srd-row">
            <UButton label="custom header" variant="outline" @click="s.header = true" />
            <UButton label="footer actions" variant="outline" @click="s.footer = true" />
            <RSlider v-model="s.trigger" title="Opened from trigger slot">
              <template #trigger>
                <UButton label="trigger slot" variant="outline" />
              </template>
              <p>The trigger lives inside the component.</p>
            </RSlider>
          </div>

          <RSlider v-model="s.header">
            <template #header="{ close, fullscreen, toggleFullscreen }">
              <div class="srd-custom-header">
                <strong>Custom header</strong>
                <span>
                  <UButton size="xs" variant="ghost" :label="fullscreen ? 'Shrink' : 'Expand'" @click="toggleFullscreen" />
                  <UButton size="xs" variant="ghost" label="Close" @click="close" />
                </span>
              </div>
            </template>
            <p>`#header` replaces the whole header and receives `close`, `fullscreen`, `toggleFullscreen`.</p>
          </RSlider>

          <RSlider v-model="s.footer" title="Footer slot" icon="ri-check-double-line">
            <p>The footer only renders when you provide it.</p>
            <template #footer="{ close }">
              <UButton label="Discard" variant="ghost" color="neutral" @click="close" />
              <UButton label="Apply" @click="close" />
            </template>
          </RSlider>
        </template>

        <!-- Behaviour -->
        <template v-else-if="tab === 's-flags'">
          <div class="srd-row">
            <UButton label="overlay off" variant="outline" @click="s.noOverlay = true" />
            <UButton label="modal off" variant="outline" @click="s.nonModal = true" />
            <UButton label="dismissible off" variant="outline" @click="s.locked = true" />
            <UButton label="transition off" variant="outline" @click="s.noAnim = true" />
            <UButton label="long content" variant="outline" @click="s.long = true" />
          </div>
          <RSlider v-model="s.noOverlay" :overlay="false" title="No overlay" />
          <RSlider v-model="s.nonModal" :modal="false" :overlay="false" title="Non-modal">
            <p>The page behind stays interactive.</p>
          </RSlider>
          <RSlider v-model="s.locked" :dismissible="false" title="Not dismissible" description="Only the X closes it" />
          <RSlider v-model="s.noAnim" :transition="false" title="No transition" />
          <RSlider v-model="s.long" title="Long content" description="Body scrolls, header/footer stay put">
            <p v-for="n in 40" :key="n">Row {{ n }} — scrolling is plain CSS now (no observers).</p>
            <template #footer="{ close }"><UButton label="Done" @click="close" /></template>
          </RSlider>
        </template>

        <!-- ═══════════ RDrawer ═══════════ -->

        <!-- Directions -->
        <template v-else-if="tab === 'd-dir'">
          <div class="srd-row">
            <UButton label="auto" variant="outline" @click="d.auto = true" />
            <UButton v-for="dir in sides" :key="dir" :label="dir" variant="outline" @click="d[dir] = true" />
          </div>
          <RDrawer v-model="d.auto" title="Auto direction" icon="ri-drag-move-2-line" description="Resize the window to see it switch">
            <p>No `direction` prop.</p>
          </RDrawer>
          <RDrawer
            v-for="dir in sides"
            :key="dir"
            v-model="d[dir]"
            :direction="dir"
            :title="`Drawer — ${dir}`"
            icon="ri-layout-right-line"
            @close="onClosed(`drawer:${dir}`)"
          >
            <p v-for="n in 3" :key="n">Content paragraph {{ n }}.</p>
          </RDrawer>
        </template>

        <!-- Sizes -->
        <template v-else-if="tab === 'd-size'">
          <UButton label="Custom sizes" variant="outline" @click="d.sizes = true" />
          <RDrawer
            v-model="d.sizes"
            title="Custom sizes"
            icon="ri-ruler-line"
            width-desktop="720px"
            width-tablet="520px"
            width-mobile="100vw"
            height-mobile="60vh"
          >
            <p>Desktop 720px · tablet 520px · mobile sheet 60vh. These props were dead before the fix — the CSS var never reached the panel.</p>
          </RDrawer>
        </template>

        <!-- Fullscreen -->
        <template v-else-if="tab === 'd-full'">
          <div class="srd-row">
            <UButton label="fullscreen prop" variant="outline" @click="d.full = true" />
            <UButton label="expandable (toggle)" variant="outline" @click="d.expand = true" />
            <UButton label="bottom + expandable" variant="outline" @click="d.expandBottom = true" />
            <UButton label="v-model:fullscreen" variant="outline" @click="d.modelFull = true" />
          </div>

          <RDrawer v-model="d.full" fullscreen title="Always fullscreen" icon="ri-fullscreen-line">
            <p>Plain `fullscreen` prop. The handle is hidden.</p>
          </RDrawer>

          <RDrawer v-model="d.expand" expandable title="Expandable" icon="ri-fullscreen-line">
            <p>Use the header button — it animates between sizes.</p>
          </RDrawer>

          <RDrawer v-model="d.expandBottom" direction="bottom" expandable title="Bottom sheet" icon="ri-fullscreen-line">
            <p>Works for top / bottom sheets too.</p>
          </RDrawer>

          <RDrawer v-model="d.modelFull" v-model:fullscreen="dFullscreen" expandable title="Controlled fullscreen" icon="ri-fullscreen-line">
            <p>Parent sees the state: <strong>{{ dFullscreen }}</strong></p>
            <UButton label="Toggle from inside" size="sm" @click="dFullscreen = !dFullscreen" />
          </RDrawer>
        </template>

        <!-- Dirty guard -->
        <template v-else-if="tab === 'd-dirty'">
          <UButton label="Edit profile" variant="outline" @click="d.dirty = true" />
          <RDrawer v-model="d.dirty" title="Edit profile" icon="ri-user-settings-line" :dirty="isDirty" @close="onClosed('drawer:dirty')">
            <div class="srd-form">
              <UInput v-model="form.name" placeholder="Name" />
              <UInput v-model="form.email" placeholder="Email" />
            </div>
            <template #footer="{ close }">
              <UButton label="Cancel" variant="ghost" color="neutral" @click="resetForm(); close()" />
              <UButton label="Save" :disabled="!isDirty" @click="save(close)" />
            </template>
          </RDrawer>
        </template>

        <!-- Close rules -->
        <template v-else-if="tab === 'd-close'">
          <div class="srd-row">
            <UButton label="noClose" variant="outline" @click="d.noClose = true" />
            <UButton label="Esc off" variant="outline" @click="d.noEsc = true" />
            <UButton label="outside click off" variant="outline" @click="d.noOutside = true" />
            <UButton label="handleOnly" variant="outline" @click="d.handleOnly = true" />
            <UButton label="non-modal" variant="outline" @click="d.nonModal = true" />
            <UButton label="no overlay / handle" variant="outline" @click="d.bare = true" />
          </div>

          <RDrawer v-model="d.noClose" no-close title="noClose" description="Only the X closes it">
            <p>Overlay, Esc and drag are all blocked.</p>
          </RDrawer>
          <RDrawer v-model="d.noEsc" :close-on-escape="false" title="Esc disabled">
            <p>Overlay click still closes.</p>
          </RDrawer>
          <RDrawer v-model="d.noOutside" :close-on-outside-click="false" title="Outside click disabled">
            <p>Esc still closes.</p>
          </RDrawer>
          <RDrawer v-model="d.handleOnly" direction="bottom" handle-only title="Handle only">
            <p>Dragging the body won't close it — only the handle.</p>
          </RDrawer>
          <RDrawer v-model="d.nonModal" :modal="false" :overlay="false" title="Non-modal">
            <p>The page behind stays interactive.</p>
          </RDrawer>
          <RDrawer v-model="d.bare" :overlay="false" :handle="false" title="No overlay, no handle" />
        </template>

        <!-- Nested -->
        <template v-else-if="tab === 'd-nested'">
          <UButton label="Open level 1" variant="outline" @click="d.nested1 = true" />
          <RDrawer v-model="d.nested1" direction="right" title="Level 1" icon="ri-stack-line">
            <p>Open another drawer on top:</p>
            <UButton label="Open level 2" @click="d.nested2 = true" />
            <RDrawer v-model="d.nested2" direction="right" title="Level 2" icon="ri-stack-fill" width-desktop="380px">
              <p>No `nested` prop needed.</p>
            </RDrawer>
          </RDrawer>
        </template>

        <!-- Slots -->
        <template v-else-if="tab === 'd-slots'">
          <div class="srd-row">
            <RDrawer v-model="d.trigger" title="Opened from trigger slot">
              <template #trigger><UButton label="trigger slot" variant="outline" /></template>
              <p>The trigger lives inside the component.</p>
            </RDrawer>
            <UButton label="#header" variant="outline" @click="d.header = true" />
            <UButton label="#drawer-header" variant="outline" @click="d.drawerHeader = true" />
            <UButton label="#body + #footer" variant="outline" @click="d.bodyFooter = true" />
            <UButton label="#content (no chrome)" variant="outline" @click="d.content = true" />
          </div>

          <RDrawer v-model="d.header">
            <template #header="{ close, fullscreen, toggleFullscreen }">
              <div class="srd-custom-header">
                <strong>Custom header</strong>
                <span>
                  <UButton size="xs" variant="ghost" :label="fullscreen ? 'Shrink' : 'Expand'" @click="toggleFullscreen" />
                  <UButton size="xs" variant="ghost" label="Close" @click="close" />
                </span>
              </div>
            </template>
            <p>`#header` replaces the whole header. It never rendered before.</p>
          </RDrawer>

          <RDrawer v-model="d.drawerHeader" title="ignored" icon="ri-star-line">
            <template #drawer-header="{ close }">
              <strong>Inner header markup (keeps the chrome bar)</strong>
              <UButton size="xs" variant="ghost" label="×" @click="close" />
            </template>
            <p>`#drawer-header` only swaps the markup inside the chrome bar.</p>
          </RDrawer>

          <RDrawer v-model="d.bodyFooter" title="Body + footer">
            <template #body="{ close }">
              <p>`#body` replaces the default slot. It never rendered before.</p>
              <UButton label="Close from body" size="sm" @click="close" />
            </template>
            <template #footer="{ close }">
              <UButton label="Cancel" variant="ghost" color="neutral" @click="close" />
              <UButton label="Confirm" @click="close" />
            </template>
          </RDrawer>

          <RDrawer v-model="d.content">
            <template #content="{ close }">
              <div class="srd-raw">
                <h4>Full override — you own every pixel</h4>
                <UButton label="Close" @click="close" />
              </div>
            </template>
          </RDrawer>
        </template>

        <!-- ui override -->
        <template v-else-if="tab === 'd-ui'">
          <UButton label="Custom overlay" variant="outline" @click="d.ui = true" />
          <RDrawer v-model="d.ui" title="ui override" :ui="{ overlay: 'bg-black/60', content: 'shadow-2xl' }">
            <p>Your classes are appended to the `rd-*` hooks, not replacing them.</p>
          </RDrawer>
        </template>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch, nextTick } from 'vue'
// npm i swiper
import { Swiper, SwiperSlide } from 'swiper/vue'
import { FreeMode, Mousewheel } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/free-mode'

const sides = ['right', 'left', 'top', 'bottom']

// ── tabs (add an entry here + a <template v-else-if> panel above) ──
const groups = {
  RSlider: [
    { key: 's-sides', label: 'Sides',       icon: 'ri-layout-right-line',   desc: 'right (default) · left · top · bottom — every side becomes a bottom sheet on phones.' },
    { key: 's-width', label: 'Width',       icon: 'ri-expand-width-line',   desc: 'Custom width / max-width in px (left & right only).' },
    { key: 's-full',  label: 'Fullscreen',  icon: 'ri-fullscreen-line',     desc: 'fullscreen prop · expandable toggle · v-model:fullscreen.' },
    { key: 's-dirty', label: 'Dirty guard', icon: 'ri-edit-circle-line',    desc: 'Overlay / Esc are blocked while there are unsaved changes; prevent-close locks everything while saving.' },
    { key: 's-slots', label: 'Slots',       icon: 'ri-layout-masonry-line', desc: 'header · footer · trigger.' },
    { key: 's-flags', label: 'Behaviour',   icon: 'ri-toggle-line',         desc: 'overlay · modal · dismissible · transition · long scrolling content.' },
  ],
  RDrawer: [
    { key: 'd-dir',    label: 'Directions',   icon: 'ri-drag-move-2-line',    desc: 'auto (bottom on mobile, right otherwise) · right · left · top · bottom.' },
    { key: 'd-size',   label: 'Sizes',        icon: 'ri-ruler-line',          desc: 'Responsive width / height per device (desktop · tablet · mobile).' },
    { key: 'd-full',   label: 'Fullscreen',   icon: 'ri-fullscreen-line',     desc: 'fullscreen prop · expandable toggle · v-model:fullscreen · works on every direction.' },
    { key: 'd-dirty',  label: 'Dirty guard',  icon: 'ri-edit-circle-line',    desc: 'Unsaved changes block overlay click, Esc and drag-to-close.' },
    { key: 'd-close',  label: 'Close rules',  icon: 'ri-lock-line',           desc: 'noClose · closeOnEscape · closeOnOutsideClick · handleOnly · modal · overlay · handle.' },
    { key: 'd-nested', label: 'Nested',       icon: 'ri-stack-line',          desc: 'An RDrawer inside another RDrawer detects its parent automatically.' },
    { key: 'd-slots',  label: 'Slots',        icon: 'ri-layout-masonry-line', desc: 'trigger · header · drawer-header · body · footer · content.' },
    { key: 'd-ui',     label: ':ui override', icon: 'ri-palette-line',        desc: 'Your classes are appended per slot, not replacing the defaults.' },
  ],
}

const groupNames = Object.keys(groups)
const group = ref('RSlider')
const tab = ref(groups.RSlider[0].key)
const tabs = computed(() => groups[group.value])
const activeTab = computed(() => tabs.value.find((t) => t.key === tab.value))

function setGroup(g) {
  group.value = g
  tab.value = groups[g][0].key
}

// ── Swiper: keep the active tab in view ──
let swiper = null
function onSwiper(sw) {
  swiper = sw
}
watch([group, tab], async () => {
  await nextTick()
  swiper?.update()
  const i = tabs.value.findIndex((t) => t.key === tab.value)
  swiper?.slideTo(Math.max(0, i - 1))
})

// ── open flags ──
const s = reactive({
  right: false, left: false, top: false, bottom: false,
  wide: false, narrow: false,
  full: false, expand: false, modelFull: false,
  dirty: false,
  header: false, footer: false, trigger: false,
  noOverlay: false, nonModal: false, locked: false, noAnim: false, long: false,
})

const d = reactive({
  auto: false, right: false, left: false, top: false, bottom: false,
  sizes: false,
  full: false, expand: false, expandBottom: false, modelFull: false,
  dirty: false,
  noClose: false, noEsc: false, noOutside: false, handleOnly: false, nonModal: false, bare: false,
  nested1: false, nested2: false,
  trigger: false, header: false, drawerHeader: false, bodyFooter: false, content: false,
  ui: false,
})

const sFullscreen = ref(false)
const dFullscreen = ref(false)

// ── event log ──
const log = ref([])
function onClosed(name) {
  log.value = [`${name} closed · ${new Date().toLocaleTimeString()}`, ...log.value].slice(0, 4)
}

// ── dirty-form demo (shared by slider + drawer) ──
const saved = reactive({ name: 'Sokha', email: 'sokha@example.com' })
const form = reactive({ ...saved })
const isDirty = computed(() => form.name !== saved.name || form.email !== saved.email)
const saving = ref(false)

function resetForm() {
  Object.assign(form, saved)
}

async function save(close) {
  saving.value = true // RSlider: prevent-close disables the X while saving
  await new Promise((r) => setTimeout(r, 1200))
  Object.assign(saved, form)
  saving.value = false
  close()
}
</script>

<!-- Global, namespaced .srd-* (Swiper's own DOM isn't reachable from scoped CSS) -->
<style lang="scss">
.srd-demo {
  max-width: 760px;
  margin: 0 auto;
  padding: var(--sp-6);
  font-family: var(--font-400);

  h1 { margin-bottom: var(--sp-4); }
}

/* ── component switch ── */
.srd-seg {
  display: inline-flex;
  gap: 2px;
  margin-bottom: var(--sp-3);
  padding: 3px;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--r-full);

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 16px;
    font-size: 13px;
    font-weight: 600;
    color: var(--c-muted);
    background: transparent;
    border: 0;
    border-radius: var(--r-full);
    cursor: pointer;
    transition: background var(--t-fast) var(--ease-out), color var(--t-fast) var(--ease-out);

    &:hover { color: var(--c-text); }

    &.is-active {
      color: var(--c-accent);
      background: color-mix(in srgb, var(--c-accent) 12%, transparent);
    }
  }

  &__count {
    min-width: 18px;
    padding: 0 5px;
    font-size: 11px;
    line-height: 18px;
    text-align: center;
    background: color-mix(in srgb, var(--c-accent) 14%, transparent);
    border-radius: var(--r-full);
  }
}

/* ── swiper tab bar ── */
.srd-tabs {
  margin-bottom: var(--sp-4);
  border-bottom: 1px solid var(--c-border);
  // soft edge fade = "there's more to swipe"
  -webkit-mask-image: linear-gradient(90deg, transparent 0, black 14px, black calc(100% - 14px), transparent 100%);
  mask-image: linear-gradient(90deg, transparent 0, black 14px, black calc(100% - 14px), transparent 100%);
}

.srd-tab-slide { width: auto; } // required by slides-per-view="auto"

.srd-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  color: var(--c-muted);
  background: transparent;
  border: 0;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: color var(--t-fast) var(--ease-out), border-color var(--t-fast) var(--ease-out);

  &:hover { color: var(--c-text); }

  &.is-active {
    color: var(--c-accent);
    border-bottom-color: var(--c-accent);
  }
}

/* ── panel ── */
.srd-panel { min-height: 200px; }

.srd-desc {
  margin-bottom: var(--sp-3);
  font-size: 13px;
  color: var(--c-muted);
}

.srd-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
}

.srd-log {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-3);
  margin-bottom: var(--sp-3);
  padding: var(--sp-2) var(--sp-3);
  font-size: 12px;
  color: var(--c-muted);
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--r-sm);
}

.srd-form { display: grid; gap: var(--sp-3); }

.srd-custom-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--sp-3) var(--sp-4);
}

.srd-raw { padding: var(--sp-6); }

/* ── panel transition ── */
.srd-fade-enter-active,
.srd-fade-leave-active { transition: opacity var(--t-fast) var(--ease-out), transform var(--t-fast) var(--ease-out); }
.srd-fade-enter-from,
.srd-fade-leave-to { opacity: 0; transform: translateY(4px); }
</style>