<template>
  <div class="rmd">
    <DemoTabs v-model="tab" :tabs="tabs" />

    <p v-if="log.length" class="srd-log">
      <strong>Events:</strong>
      <span v-for="(l, i) in log" :key="i">{{ l }}</span>
    </p>

    <Transition name="srd-fade" mode="out-in">
      <div :key="tab" class="srd-panel" role="tabpanel">
        <p class="srd-desc">{{ activeTab?.desc }}</p>

        <!-- ═══ Basic ═══ -->
        <template v-if="tab === 'basic'">
          <UButton label="Open modal" variant="outline" @click="m.basic = true" />
          <RModal
            v-model="m.basic"
            title="Basic modal"
            description="Title, description, icon and a footer"
            icon="ri-information-line"
            @on-close="onClose('basic')"
          >
            <p>Body content goes in the default slot.</p>
            <template #footer>
              <UButton label="Cancel" variant="ghost" color="neutral" @click="m.basic = false" />
              <UButton label="Confirm" @click="m.basic = false" />
            </template>
          </RModal>
        </template>

        <!-- ═══ Width ═══ -->
        <template v-else-if="tab === 'width'">
          <div class="srd-row">
            <UButton v-for="w in widths" :key="w" :label="`modal-width ${w}`" variant="outline" @click="openWidth(w)" />
          </div>
          <RModal
            v-model="widthOpen"
            :modal-width="widthValue"
            :title="`modal-width = ${widthValue}`"
            icon="ri-expand-width-line"
          >
            <p>Default is 560px. Always capped to the viewport (`100vw − 2rem`).</p>
          </RModal>
        </template>

        <!-- ═══ Radius ═══ -->
        <template v-else-if="tab === 'radius'">
          <div class="srd-row">
            <UButton v-for="r in radii" :key="String(r)" :label="`modal-radius ${r}`" variant="outline" @click="openRadius(r)" />
            <UButton label="default (--r-xl)" variant="outline" @click="openRadius(undefined)" />
          </div>
          <RModal
            v-model="radiusOpen"
            :modal-radius="radiusValue"
            :title="`modal-radius = ${radiusValue ?? 'default'}`"
            icon="ri-shape-line"
          >
            <p>Number = px · string = any CSS value (`8px`, `var(--r-lg)`, `0`). Phones respect it too; fullscreen forces 0.</p>
          </RModal>
        </template>

        <!-- ═══ Fullscreen ═══ -->
        <template v-else-if="tab === 'full'">
          <div class="srd-row">
            <UButton label="is-full-screen (legacy)" variant="outline" @click="m.legacyFull = true" />
            <UButton label="expandable (toggle)" variant="outline" @click="m.expand = true" />
            <UButton label="v-model:fullscreen" variant="outline" @click="m.modelFull = true" />
            <UButton label="expandable + radius" variant="outline" @click="m.expandRadius = true" />
          </div>

          <RModal v-model="m.legacyFull" is-full-screen title="Legacy isFullScreen" icon="ri-fullscreen-line">
            <p>Forces fullscreen — the toggle is hidden because it could never exit.</p>
          </RModal>

          <RModal v-model="m.expand" expandable title="Expandable" description="Use the header button" icon="ri-fullscreen-line">
            <p>Uncontrolled — toggles internally.</p>
          </RModal>

          <RModal v-model="m.modelFull" v-model:fullscreen="fullscreen" expandable title="Controlled fullscreen" icon="ri-fullscreen-line">
            <p>Parent sees the state: <strong>{{ fullscreen }}</strong></p>
            <UButton label="Toggle from inside" size="sm" @click="fullscreen = !fullscreen" />
          </RModal>

          <RModal v-model="m.expandRadius" expandable :modal-radius="32" title="Expandable + modal-radius" icon="ri-shape-line">
            <p>32px corners normally, square corners in fullscreen.</p>
          </RModal>
        </template>

        <!-- ═══ Header ═══ -->
        <template v-else-if="tab === 'header'">
          <div class="srd-row">
            <UButton label="no-header" variant="outline" @click="m.noHeader = true" />
            <UButton label="headerCenter / headerRight / subTitle" variant="outline" @click="m.hslots = true" />
            <UButton label="custom #header" variant="outline" @click="m.customHeader = true" />
            <UButton label="close-icon" variant="outline" @click="m.closeIcon = true" />
          </div>

          <RModal v-model="m.noHeader" no-header>
            <p>No header at all — it isn't even mounted. Overlay click / Esc still close it.</p>
            <UButton label="Close" size="sm" @click="m.noHeader = false" />
          </RModal>

          <RModal v-model="m.hslots" title="Header slots" icon="ri-layout-top-line">
            <template #headerCenter><UBadge label="center" variant="subtle" /></template>
            <template #headerRight><UButton size="xs" variant="ghost" label="Share" /></template>
            <template #subTitle><div class="srd-sub">`#subTitle` renders under the header bar.</div></template>
            <p>`#headerCenter` and `#headerRight` sit before the close button.</p>
          </RModal>

          <RModal v-model="m.customHeader">
            <template #header="{ close, fullscreen: isFs, toggleFullscreen }">
              <div class="srd-custom-header">
                <strong>Custom header</strong>
                <span>
                  <UButton size="xs" variant="ghost" :label="isFs ? 'Shrink' : 'Expand'" @click="toggleFullscreen" />
                  <UButton size="xs" variant="ghost" label="Close" @click="close" />
                </span>
              </div>
            </template>
            <p>`#header` replaces the whole bar and receives `close`, `fullscreen`, `toggleFullscreen`.</p>
          </RModal>

          <RModal v-model="m.closeIcon" title="Custom close icon" close-icon="ri-close-circle-line">
            <p>`close-icon` swaps the X glyph.</p>
          </RModal>
        </template>

        <!-- ═══ Footer ═══ -->
        <template v-else-if="tab === 'footer'">
          <div class="srd-row">
            <UButton label="footer actions" variant="outline" @click="m.footer = true" />
            <UButton label="no-footer" variant="outline" @click="m.noFooter = true" />
            <UButton label="no footer slot" variant="outline" @click="m.noFooterSlot = true" />
          </div>

          <RModal v-model="m.footer" title="Footer slot" icon="ri-check-double-line">
            <p>The footer only renders when you provide `#footer`.</p>
            <template #footer>
              <UButton label="Discard" variant="ghost" color="neutral" @click="m.footer = false" />
              <UButton label="Save draft" variant="outline" @click="m.footer = false" />
              <UButton label="Publish" @click="m.footer = false" />
            </template>
          </RModal>

          <RModal v-model="m.noFooter" no-footer title="no-footer">
            <p>A `#footer` slot is provided but `no-footer` hides it.</p>
            <template #footer><UButton label="never shown" /></template>
          </RModal>

          <RModal v-model="m.noFooterSlot" title="No footer slot">
            <p>No `#footer` provided → no footer bar (and no border).</p>
          </RModal>
        </template>

        <!-- ═══ Close rules ═══ -->
        <template v-else-if="tab === 'close'">
          <div class="srd-row">
            <UButton label="default (X + Esc + overlay)" variant="outline" @click="m.closeDefault = true" />
            <UButton label=":no-close=false" variant="outline" @click="m.locked = true" />
            <UButton label=":transition=false" variant="outline" @click="m.noAnim = true" />
          </div>

          <RModal v-model="m.closeDefault" title="Default" description="X button, Esc and overlay click" @on-close="onClose('default')">
            <p>`@on-close` fires from the X button.</p>
          </RModal>

          <RModal v-model="m.locked" :no-close="false" title="Not dismissible" description="No X, no overlay click, no Esc">
            <p>`no-close` is inverted: `true` (default) = X shown + dismissible, `false` = locked.</p>
            <template #footer><UButton label="Done" @click="m.locked = false" /></template>
          </RModal>

          <RModal v-model="m.noAnim" :transition="false" title="No transition">
            <p>Opens and closes without animation.</p>
          </RModal>
        </template>

        <!-- ═══ Scroll / height ═══ -->
        <template v-else-if="tab === 'scroll'">
          <div class="srd-row">
            <UButton label="long content" variant="outline" @click="m.long = true" />
            <UButton label="fixed height" variant="outline" @click="m.fixed = true" />
            <UButton label="overflow-auto" variant="outline" @click="m.overflow = true" />
          </div>

          <RModal v-model="m.long" title="Long content" description="Header and footer stay put, the body scrolls">
            <p v-for="n in 40" :key="n">Row {{ n }} — the body scrolls with plain CSS (flex + min-height: 0).</p>
            <template #footer><UButton label="Done" @click="m.long = false" /></template>
          </RModal>

          <RModal v-model="m.fixed" height="h-[280px]" title="height prop" description="A Tailwind class applied to the body">
            <p v-for="n in 20" :key="n">Row {{ n }}</p>
          </RModal>

          <RModal v-model="m.overflow" overflow-auto height="h-[240px]" title="overflow-auto">
            <p v-for="n in 20" :key="n">Row {{ n }}</p>
          </RModal>
        </template>

        <!-- ═══ Form ═══ -->
        <template v-else-if="tab === 'form'">
          <UButton label="New contact" variant="outline" @click="m.form = true" />
          <RModal v-model="m.form" title="New contact" description="A real form: footer button submits it" icon="ri-user-add-line">
            <form id="rmodal-demo-form" class="srd-form" @submit.prevent="submit">
              <UInput v-model="form.name" placeholder="Name" required />
              <UInput v-model="form.email" type="email" placeholder="Email" required />
            </form>
            <template #footer>
              <UButton label="Cancel" variant="ghost" color="neutral" :disabled="saving" @click="m.form = false" />
              <UButton type="submit" form="rmodal-demo-form" label="Save" :loading="saving" />
            </template>
          </RModal>
        </template>

        <!-- ═══ ui override ═══ -->
        <template v-else-if="tab === 'ui'">
          <UButton label="Custom overlay + shadow" variant="outline" @click="m.ui = true" />
          <RModal v-model="m.ui" title="ui override" :ui="{ overlay: 'bg-black/60', content: 'shadow-2xl' }">
            <p>Your classes are appended per slot to the `rm-*` hooks — they don't replace them.</p>
          </RModal>
        </template>

        <!-- ═══ forTable (legacy) ═══ -->
        <template v-else-if="tab === 'table'">
          <UButton label="Open legacy table modal" variant="outline" @click="m.table = true" />
          <RModal v-model="m.table" for-table height="h-[320px]">
            <template #header>Legacy table modal</template>
            <p>`for-table` uses the old teleported markup (`.r-wrapper-modal`, `.r-modal`…), styled by your table CSS.</p>
            <template #footer><UButton label="Close" @click="m.table = false" /></template>
          </RModal>
        </template>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'

const tabs = [
  { key: 'basic',  label: 'Basic',        icon: 'ri-window-line',          desc: 'Title, description, icon, body and footer.' },
  { key: 'width',  label: 'Width',        icon: 'ri-expand-width-line',    desc: 'modalWidth — any CSS width, capped to the viewport.' },
  { key: 'radius', label: 'Radius',       icon: 'ri-shape-line',           desc: 'modalRadius — number (px) or any CSS value.' },
  { key: 'full',   label: 'Fullscreen',   icon: 'ri-fullscreen-line',      desc: 'isFullScreen (legacy) · expandable toggle · v-model:fullscreen · with modalRadius.' },
  { key: 'header', label: 'Header',       icon: 'ri-layout-top-line',      desc: 'noHeader · headerCenter / headerRight / subTitle · custom #header · closeIcon.' },
  { key: 'footer', label: 'Footer',       icon: 'ri-layout-bottom-line',   desc: 'footer slot · noFooter · no footer at all.' },
  { key: 'close',  label: 'Close rules',  icon: 'ri-lock-line',            desc: 'noClose · transition · the onClose event.' },
  { key: 'scroll', label: 'Scroll',       icon: 'ri-scroll-to-bottom-line', desc: 'Long content · fixed body height · overflowAuto.' },
  { key: 'form',   label: 'Form',         icon: 'ri-file-edit-line',       desc: 'A footer button submitting a form in the body.' },
  { key: 'ui',     label: ':ui override', icon: 'ri-palette-line',         desc: 'Classes appended per slot, not replacing the defaults.' },
  { key: 'table',  label: 'forTable',     icon: 'ri-table-line',           desc: 'Legacy table-modal branch (styled elsewhere).' },
]

const tab = ref(tabs[0].key)
const activeTab = computed(() => tabs.find((t) => t.key === tab.value))

// ── open flags ──
const m = reactive({
  basic: false,
  legacyFull: false, expand: false, modelFull: false, expandRadius: false,
  noHeader: false, hslots: false, customHeader: false, closeIcon: false,
  footer: false, noFooter: false, noFooterSlot: false,
  closeDefault: false, locked: false, noAnim: false,
  long: false, fixed: false, overflow: false,
  form: false, ui: false, table: false,
})

const fullscreen = ref(false)

// ── width / radius pickers ──
const widths = ['400px', '560px', '800px', '90vw']
const widthOpen = ref(false)
const widthValue = ref('400px')
function openWidth(w) {
  widthValue.value = w
  widthOpen.value = true
}

const radii = [0, 8, 16, 32, '48px']
const radiusOpen = ref(false)
const radiusValue = ref(undefined)
function openRadius(r) {
  radiusValue.value = r
  radiusOpen.value = true
}

// ── event log ──
const log = ref([])
function onClose(name) {
  log.value = [`${name}: onClose · ${new Date().toLocaleTimeString()}`, ...log.value].slice(0, 4)
}

// ── form ──
const form = reactive({ name: '', email: '' })
const saving = ref(false)
async function submit() {
  saving.value = true
  await new Promise((r) => setTimeout(r, 1000))
  saving.value = false
  m.form = false
  Object.assign(form, { name: '', email: '' })
}
</script>
