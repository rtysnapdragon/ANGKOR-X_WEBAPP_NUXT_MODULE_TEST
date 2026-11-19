<template>
  <div class="rcd">
    <h1>{{ title }}</h1>
    <p class="srd-desc">
      Each main tab renders its own demo component; inside, every use case is a sub-tab.
      Both tab bars swipe horizontally when they overflow.
    </p>

    <template v-if="demos.length">
      <!-- Folder tabs — only shown when /demo/ has sub folders -->
      <DemoTabs v-if="groups.length > 2" v-model="group" :tabs="groups" variant="line" />

      <!-- Main tabs (Swiper pill bar) — built automatically from /demo/** -->
      <DemoTabs v-model="active" :tabs="visibleTabs" variant="pill" />

      <!-- Active demo component -->
      <Transition name="srd-fade" mode="out-in">
        <component :is="current" v-if="current" :key="active" />
      </Transition>
    </template>

    <p v-else class="srd-desc">
      No demo components found. Add files named <code>*Demo.vue</code> to
      <code>{{ DEMO_GLOB }}</code> (sub folders are scanned too).
    </p>
  </div>
</template>

<script setup>
import { ref, computed, watch, markRaw, defineAsyncComponent } from 'vue'
import DemoTabs from './DemoTabs.vue' // explicit: Nuxt prefixes components in sub folders with their path

// ─────────────────────────────────────────────────────────────
// Auto-discovery (recursive)
// Drop RSliderDemo.vue, forms/RInputDemo.vue, ui/kit/RTabDemo.vue, … anywhere
// under /demo/ and they appear as tabs — nothing to register here.
//
// This file lives IN the demo folder (src/runtime/app/components/demo/), so the
// glob is RELATIVE to it. Don't use `~/…` here: inside a module/layer `~`
// points at the consuming app's srcDir, not at src/runtime/app, so it matches
// nothing and no demo renders.
// `!./ComponentDemo.vue` is required: it also ends with "Demo.vue" and would
// otherwise import itself.
// ─────────────────────────────────────────────────────────────
const DEMO_GLOB = './**/*Demo.vue'
const loaders = import.meta.glob(['./**/*Demo.vue', '!./ComponentDemo.vue'], { import: 'default' })
console.log("import.meta.glob ------------------- ",import.meta.glob)
console.log("DEMO_GLOB ------------------- ",DEMO_GLOB)
console.log("loaders ------------------- ",loaders)
// RSliderDemo -> r_slider_demo      forms/RInputDemo -> forms_r_input_demo
function toSnakeCase(name) {
  return name
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[-\s/]+/g, '_')
    .toLowerCase()
}

// Optional icons, keyed by the snake_case key. Unlisted demos get a default.
const ICONS = {
  r_modal_demo: 'ri-window-line',
  r_slider_demo: 'ri-layout-right-line',
  r_drawer_demo: 'ri-layout-bottom-line',
  r_comfirm_demo: 'ri-question-line',
  r_confirm_demo: 'ri-question-line',
}
const DEFAULT_ICON = 'ri-puzzle-line'
const ROOT_GROUP = { key: 'root', label: 'General' }

// pass 1 — read file info
const files = Object.entries(loaders).map(([path, loader]) => {
  const rel = path.replace(/^\.\//, '') // './buttons/RBtnDemo.vue' -> 'buttons/RBtnDemo.vue'
  const parts = rel.split('/')
  const name = parts.pop().replace(/\.vue$/, '') // RInputDemo
  const folder = parts.join('/') // forms/inputs ('' for the root)
  return { name, folder, loader }
})

// the key is the snake_case component name; only if two demos in different
// folders share a name is the folder prepended to keep keys unique
const nameCount = files.reduce((m, f) => m.set(f.name, (m.get(f.name) || 0) + 1), new Map())

// pass 2 — build demo entries
const demos = files
  .map(({ name, folder, loader }) => {
    const key = toSnakeCase(nameCount.get(name) > 1 && folder ? `${folder}/${name}` : name)
    return {
      key,
      label: name.replace(/Demo$/, ''), // RInput
      icon: ICONS[key] || DEFAULT_ICON,
      group: folder ? toSnakeCase(folder) : ROOT_GROUP.key,
      groupLabel: folder ? folder.split('/').join(' / ') : ROOT_GROUP.label,
      // lazy: a demo's code is only fetched when its tab is opened
      component: markRaw(defineAsyncComponent(loader)),
    }
  })
  .sort((a, b) => a.group.localeCompare(b.group) || a.label.localeCompare(b.label))

const componentMap = Object.fromEntries(demos.map((d) => [d.key, d.component]))
const demoByKey = Object.fromEntries(demos.map((d) => [d.key, d]))

// folder tabs: "All" + one per folder (root demos are "General")
const groups = [
  { key: 'all', label: 'All', icon: 'ri-apps-line' },
  ...[...new Map(demos.map((d) => [d.group, d.groupLabel]))].map(([key, label]) => ({
    key,
    label,
    icon: 'ri-folder-line',
  })),
]

const title = computed(() => {
  const labels = demos.map((d) => d.label)
  return labels.length && labels.length <= 5
    ? `${labels.join(' · ')} — Usage Reference`
    : 'Component Demos — Usage Reference'
})

// ─────────────────────────────────────────────────────────────
// State — active demo is kept in the URL (?demo=r_slider_demo) so it can be
// shared/bookmarked and survives a refresh.
// ─────────────────────────────────────────────────────────────
const route = useRoute()
const router = useRouter()

const fromQuery = typeof route.query.demo === 'string' ? route.query.demo : ''
const active = ref(componentMap[fromQuery] ? fromQuery : demos[0]?.key ?? '')
const group = ref('all')

// opening a link to a demo that lives in a folder selects that folder tab
if (demoByKey[active.value] && groups.length > 2) group.value = demoByKey[active.value].group

const visibleTabs = computed(() =>
  demos
    .filter((d) => group.value === 'all' || d.group === group.value)
    .map(({ key, label, icon }) => ({ key, label, icon }))
)

const current = computed(() => componentMap[active.value] ?? null)

// switching folder: keep the active demo if it's still visible, else pick the first
watch(group, () => {
  if (!visibleTabs.value.some((t) => t.key === active.value)) {
    active.value = visibleTabs.value[0]?.key ?? ''
  }
})

watch(active, (key) => {
  if (key && route.query.demo !== key) {
    router.replace({ query: { ...route.query, demo: key } })
  }
})
</script>

<style lang="scss" scoped>
.rcd {
  max-width: 820px;
  margin: 0 auto;
  padding: var(--sp-6);

  h1 {
    margin-bottom: var(--sp-2);
    font-size: 20px;
  }
}
</style>