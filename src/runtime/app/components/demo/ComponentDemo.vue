<template>
  <div class="srd-demo">
    <h1>RSlider &amp; RDrawer — Usage Reference</h1>

    <p v-if="log.length" class="srd-log">
      <strong>Events:</strong>
      <span v-for="(l, i) in log" :key="i">{{ l }}</span>
    </p>

    <!-- ═══════════════════════════════ RSlider ═══════════════════════════════ -->
    <h2 class="srd-group">RSlider</h2>

    <!-- 1. Sides -->
    <section>
      <h3>1. Sides — right (default) · left · top · bottom</h3>
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
        @closed="onClosed(`side:${side}`)"
      >
        <p v-for="n in 3" :key="n">Content paragraph {{ n }}.</p>
      </RSlider>
    </section>

    <!-- 2. Width -->
    <section>
      <h3>2. Custom width / max-width (left &amp; right only)</h3>
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
    </section>

    <!-- 3. Fullscreen -->
    <section>
      <h3>3. Fullscreen — prop · expandable toggle · v-model:fullscreen</h3>
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

      <RSlider
        v-model="s.modelFull"
        v-model:fullscreen="sFullscreen"
        expandable
        title="Controlled fullscreen"
        icon="ri-fullscreen-line"
      >
        <p>Parent sees the state: <strong>{{ sFullscreen }}</strong></p>
        <UButton label="Toggle from inside" size="sm" @click="sFullscreen = !sFullscreen" />
      </RSlider>
    </section>

    <!-- 4. Dirty guard -->
    <section>
      <h3>4. Dirty guard — overlay / Esc blocked while there are unsaved changes</h3>
      <UButton label="Edit profile" variant="outline" @click="s.dirty = true" />
      <RSlider
        v-model="s.dirty"
        title="Edit profile"
        description="Try clicking the overlay after typing"
        icon="ri-user-settings-line"
        :dirty="isDirty"
        :prevent-close="saving"
        @closed="onClosed('dirty')"
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
    </section>

    <!-- 5. Slots -->
    <section>
      <h3>5. Slots — header · footer · trigger</h3>
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
    </section>

    <!-- 6. Behaviour flags -->
    <section>
      <h3>6. Behaviour — no overlay · non-modal · not dismissible · no transition · long scroll</h3>
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
    </section>

    <!-- ═══════════════════════════════ RDrawer ═══════════════════════════════ -->
    <h2 class="srd-group">RDrawer</h2>

    <!-- 1. Directions -->
    <section>
      <h3>1. Directions — auto (bottom on mobile, right otherwise) · right · left · top · bottom</h3>
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
    </section>

    <!-- 2. Sizes -->
    <section>
      <h3>2. Responsive sizes per device</h3>
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
    </section>

    <!-- 3. Fullscreen -->
    <section>
      <h3>3. Fullscreen — prop · expandable toggle · v-model:fullscreen</h3>
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
    </section>

    <!-- 4. Dirty guard -->
    <section>
      <h3>4. Dirty guard — unsaved changes block overlay / Esc / drag</h3>
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
    </section>

    <!-- 5. Close rules / drag -->
    <section>
      <h3>5. Close rules — noClose · closeOnEscape / closeOnOutsideClick off · handleOnly · non-modal · no overlay</h3>
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
    </section>

    <!-- 6. Nested -->
    <section>
      <h3>6. Nested drawers — inner RDrawer auto-detects its parent</h3>
      <UButton label="Open level 1" variant="outline" @click="d.nested1 = true" />
      <RDrawer v-model="d.nested1" direction="right" title="Level 1" icon="ri-stack-line" :should-scale-background="false">
        <p>Open another drawer on top:</p>
        <UButton label="Open level 2" @click="d.nested2 = true" />
        <RDrawer v-model="d.nested2" direction="right" title="Level 2" icon="ri-stack-fill" width-desktop="380px">
          <p>No `nested` prop needed.</p>
        </RDrawer>
      </RDrawer>
    </section>

    <!-- 7. Slots -->
    <section>
      <h3>7. Slots — trigger · header · drawer-header · body · footer · content</h3>
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
    </section>

    <!-- 8. ui override -->
    <section>
      <h3>8. :ui override — appended per slot, not replacing</h3>
      <UButton label="Custom overlay" variant="outline" @click="d.ui = true" />
      <RDrawer v-model="d.ui" title="ui override" :ui="{ overlay: 'bg-black/60', content: 'shadow-2xl' }">
        <p>Your classes are appended to the `rd-*` hooks.</p>
      </RDrawer>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'

const sides = ['right', 'left', 'top', 'bottom']

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

<style lang="scss" scoped>
.srd-demo {
  max-width: 760px;
  margin: 0 auto;
  padding: var(--sp-6);

  h1 { margin-bottom: var(--sp-4); }

  .srd-group {
    margin: var(--sp-8) 0 var(--sp-4);
    padding-bottom: var(--sp-2);
    font-size: 18px;
    color: var(--c-accent);
    border-bottom: 2px solid var(--c-border);
  }

  section {
    margin-bottom: var(--sp-6);
    padding-bottom: var(--sp-5);
    border-bottom: 1px solid var(--c-border);
  }

  h3 { margin-bottom: var(--sp-2); font-size: 14px; color: var(--c-muted); }
}

.srd-row { display: flex; flex-wrap: wrap; gap: var(--sp-2); }

.srd-log {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-3);
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
</style>