<template>
  <div class="rsd">
    <DemoTabs v-model="tab" :tabs="tabs" />

    <p v-if="log.length" class="srd-log">
      <strong>Events:</strong>
      <span v-for="(l, i) in log" :key="i">{{ l }}</span>
    </p>

    <Transition name="srd-fade" mode="out-in">
      <div :key="tab" class="srd-panel" role="tabpanel">
        <p class="srd-desc">{{ activeTab?.desc }}</p>

        <!-- ═══ Sides ═══ -->
        <template v-if="tab === 'sides'">
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

        <!-- ═══ Width ═══ -->
        <template v-else-if="tab === 'width'">
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

        <!-- ═══ Fullscreen ═══ -->
        <template v-else-if="tab === 'full'">
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

          <RSlider v-model="s.modelFull" v-model:fullscreen="fullscreen" expandable title="Controlled fullscreen" icon="ri-fullscreen-line">
            <p>Parent sees the state: <strong>{{ fullscreen }}</strong></p>
            <UButton label="Toggle from inside" size="sm" @click="fullscreen = !fullscreen" />
          </RSlider>
        </template>

        <!-- ═══ Dirty guard ═══ -->
        <template v-else-if="tab === 'dirty'">
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

        <!-- ═══ Slots ═══ -->
        <template v-else-if="tab === 'slots'">
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
            <template #header="{ close, fullscreen: isFs, toggleFullscreen }">
              <div class="srd-custom-header">
                <strong>Custom header</strong>
                <span>
                  <UButton size="xs" variant="ghost" :label="isFs ? 'Shrink' : 'Expand'" @click="toggleFullscreen" />
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

        <!-- ═══ Behaviour ═══ -->
        <template v-else-if="tab === 'flags'">
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
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'

const sides = ['right', 'left', 'top', 'bottom']

const tabs = [
  { key: 'sides', label: 'Sides',       icon: 'ri-layout-right-line',   desc: 'right (default) · left · top · bottom — every side becomes a bottom sheet on phones.' },
  { key: 'width', label: 'Width',       icon: 'ri-expand-width-line',   desc: 'Custom width / max-width in px (left & right only).' },
  { key: 'full',  label: 'Fullscreen',  icon: 'ri-fullscreen-line',     desc: 'fullscreen prop · expandable toggle · v-model:fullscreen.' },
  { key: 'dirty', label: 'Dirty guard', icon: 'ri-edit-circle-line',    desc: 'Overlay / Esc are blocked while there are unsaved changes; prevent-close locks everything while saving.' },
  { key: 'slots', label: 'Slots',       icon: 'ri-layout-masonry-line', desc: 'header · footer · trigger.' },
  { key: 'flags', label: 'Behaviour',   icon: 'ri-toggle-line',         desc: 'overlay · modal · dismissible · transition · long scrolling content.' },
]

const tab = ref(tabs[0].key)
const activeTab = computed(() => tabs.find((t) => t.key === tab.value))

const s = reactive({
  right: false, left: false, top: false, bottom: false,
  wide: false, narrow: false,
  full: false, expand: false, modelFull: false,
  dirty: false,
  header: false, footer: false, trigger: false,
  noOverlay: false, nonModal: false, locked: false, noAnim: false, long: false,
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
const saving = ref(false)

function resetForm() {
  Object.assign(form, saved)
}

async function save(close) {
  saving.value = true // prevent-close disables the X while saving
  await new Promise((r) => setTimeout(r, 1200))
  Object.assign(saved, form)
  saving.value = false
  close()
}
</script>
