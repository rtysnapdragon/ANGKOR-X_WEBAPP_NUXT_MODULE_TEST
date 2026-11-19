<template>
  <div class="rdd">
    <DemoTabs v-model="tab" :tabs="tabs" />

    <p v-if="log.length" class="srd-log">
      <strong>Events:</strong>
      <span v-for="(l, i) in log" :key="i">{{ l }}</span>
    </p>

    <Transition name="srd-fade" mode="out-in">
      <div :key="tab" class="srd-panel" role="tabpanel">
        <p class="srd-desc">{{ activeTab?.desc }}</p>

        <!-- ═══ Directions ═══ -->
        <template v-if="tab === 'dir'">
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

        <!-- ═══ Sizes ═══ -->
        <template v-else-if="tab === 'size'">
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
            <p>Desktop 720px · tablet 520px · mobile sheet 60vh.</p>
          </RDrawer>
        </template>

        <!-- ═══ Fullscreen ═══ -->
        <template v-else-if="tab === 'full'">
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

          <RDrawer v-model="d.modelFull" v-model:fullscreen="fullscreen" expandable title="Controlled fullscreen" icon="ri-fullscreen-line">
            <p>Parent sees the state: <strong>{{ fullscreen }}</strong></p>
            <UButton label="Toggle from inside" size="sm" @click="fullscreen = !fullscreen" />
          </RDrawer>
        </template>

        <!-- ═══ Dirty guard ═══ -->
        <template v-else-if="tab === 'dirty'">
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

        <!-- ═══ Close rules ═══ -->
        <template v-else-if="tab === 'close'">
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

        <!-- ═══ Nested ═══ -->
        <template v-else-if="tab === 'nested'">
          <UButton label="Open level 1" variant="outline" @click="d.nested1 = true" />
          <RDrawer v-model="d.nested1" direction="right" title="Level 1" icon="ri-stack-line">
            <p>Open another drawer on top:</p>
            <UButton label="Open level 2" @click="d.nested2 = true" />
            <RDrawer v-model="d.nested2" direction="right" title="Level 2" icon="ri-stack-fill" width-desktop="380px">
              <p>No `nested` prop needed.</p>
            </RDrawer>
          </RDrawer>
        </template>

        <!-- ═══ Slots ═══ -->
        <template v-else-if="tab === 'slots'">
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
            <template #header="{ close, fullscreen: isFs, toggleFullscreen }">
              <div class="srd-custom-header">
                <strong>Custom header</strong>
                <span>
                  <UButton size="xs" variant="ghost" :label="isFs ? 'Shrink' : 'Expand'" @click="toggleFullscreen" />
                  <UButton size="xs" variant="ghost" label="Close" @click="close" />
                </span>
              </div>
            </template>
            <p>`#header` replaces the whole header.</p>
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
              <p>`#body` replaces the default slot.</p>
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

        <!-- ═══ ui override ═══ -->
        <template v-else-if="tab === 'ui'">
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
import { reactive, ref, computed } from 'vue'

const sides = ['right', 'left', 'top', 'bottom']

const tabs = [
  { key: 'dir',    label: 'Directions',   icon: 'ri-drag-move-2-line',    desc: 'auto (bottom on mobile, right otherwise) · right · left · top · bottom.' },
  { key: 'size',   label: 'Sizes',        icon: 'ri-ruler-line',          desc: 'Responsive width / height per device (desktop · tablet · mobile).' },
  { key: 'full',   label: 'Fullscreen',   icon: 'ri-fullscreen-line',     desc: 'fullscreen prop · expandable toggle · v-model:fullscreen · works on every direction.' },
  { key: 'dirty',  label: 'Dirty guard',  icon: 'ri-edit-circle-line',    desc: 'Unsaved changes block overlay click, Esc and drag-to-close.' },
  { key: 'close',  label: 'Close rules',  icon: 'ri-lock-line',           desc: 'noClose · closeOnEscape · closeOnOutsideClick · handleOnly · modal · overlay · handle.' },
  { key: 'nested', label: 'Nested',       icon: 'ri-stack-line',          desc: 'An RDrawer inside another RDrawer detects its parent automatically.' },
  { key: 'slots',  label: 'Slots',        icon: 'ri-layout-masonry-line', desc: 'trigger · header · drawer-header · body · footer · content.' },
  { key: 'ui',     label: ':ui override', icon: 'ri-palette-line',        desc: 'Your classes are appended per slot, not replacing the defaults.' },
]

const tab = ref(tabs[0].key)
const activeTab = computed(() => tabs.find((t) => t.key === tab.value))

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

const fullscreen = ref(false)

// ── event log ──
const log = ref([])
function onClosed(name) {
  log.value = [`${name} closed · ${new Date().toLocaleTimeString()}`, ...log.value].slice(0, 4)
}

// ── dirty-form demo ──
const saved = reactive({ name: 'Sokha', email: 'sokha@example.com' })
const form = reactive({ ...saved })
const isDirty = computed(() => form.name !== saved.name || form.email !== saved.email)

function resetForm() {
  Object.assign(form, saved)
}

async function save(close) {
  await new Promise((r) => setTimeout(r, 800))
  Object.assign(saved, form)
  close()
}
</script>
