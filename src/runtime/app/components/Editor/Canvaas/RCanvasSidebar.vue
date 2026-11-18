<script setup>
// Left rail + panel: Design (sizes/templates), Elements, Text, Uploads, Draw, Layers, Help.
import { ref, watch } from 'vue'
import RCanvasColor from './RCanvasColor.vue'
import { PAGE_PRESET_GROUPS, TEMPLATES, SHAPES, LINES, TEXT_PRESETS, SHORTCUTS } from './RCanvasData'

const props = defineProps({
  state: { type: Object, required: true },
  api: { type: Object, required: true },
  fonts: { type: Array, default: () => [] },
  mediaItems: { type: Array, default: () => [] },
  mediaLoading: { type: Boolean, default: false },
})
const emit = defineEmits(['upload-files', 'add-url', 'insert-media', 'request-media'])

const TABS = [
  { id: 'design', icon: 'layout-template', label: 'Design' },
  { id: 'elements', icon: 'shapes', label: 'Elements' },
  { id: 'text', icon: 'type', label: 'Text' },
  { id: 'uploads', icon: 'image-up', label: 'Uploads' },
  { id: 'draw', icon: 'pen-line', label: 'Draw' },
  { id: 'layers', icon: 'layers', label: 'Layers' },
  { id: 'help', icon: 'keyboard', label: 'Keys' },
]
const tab = ref('design')
const customW = ref(props.state.width)
const customH = ref(props.state.height)
const url = ref('')
const search = ref('')
const fileInput = ref(null)
const dragId = ref(null)
const renaming = ref(null)

watch(() => [props.state.width, props.state.height], ([w, h]) => { customW.value = w; customH.value = h })
watch(tab, (t) => { if (t === 'uploads') emit('request-media', { search: search.value }) })

function applyCustomSize() {
  const w = Number(customW.value)
  const h = Number(customH.value)
  if (w >= 50 && h >= 50) props.api.setSize(w, h)
}
function onFiles(e) {
  const files = Array.from(e.target.files ?? [])
  if (files.length) emit('upload-files', files)
  e.target.value = ''
}
function onDropFiles(e) {
  const files = Array.from(e.dataTransfer?.files ?? []).filter(f => f.type.startsWith('image/'))
  if (files.length) emit('upload-files', files)
}
function addUrl() {
  const v = url.value.trim()
  if (!v) return
  emit('add-url', v)
  url.value = ''
}
function onDrop(targetId) {
  if (dragId.value && dragId.value !== targetId) props.api.moveLayerTo(dragId.value, targetId)
  dragId.value = null
}
function commitRename(id, e) {
  props.api.renameLayer(id, e.target.value.trim())
  renaming.value = null
}
const isSelected = id => props.state.selectedIds.includes(id)
const setDefaultFont = (e) => { props.state.defaultFont = e.target.value }
const preview = t => ({ background: t.bg })
</script>

<template>
  <aside class="rc-side">
    <nav class="rc-rail" aria-label="Tools">
      <button
        v-for="t in TABS" :key="t.id" type="button" class="rc-rail__btn" :class="{ 'is-on': tab === t.id }"
        :aria-pressed="tab === t.id" @click="tab = t.id"
      >
        <UIcon :name="`i-lucide-${t.icon}`" class="rc-ico rc-ico--lg" />
        <span>{{ t.label }}</span>
      </button>
    </nav>

    <div class="rc-panel">
      <!-- ── Design ───────────────────────────────────────────────────── -->
      <section v-if="tab === 'design'">
        <h3 class="rc-panel__title">Templates</h3>
        <div class="rc-tpl">
          <button v-for="t in TEMPLATES" :key="t.id" type="button" class="rc-tpl__item" :title="`Apply “${t.name}”`" @click="api.applyTemplate(t)">
            <span class="rc-tpl__thumb" :style="[preview(t), { aspectRatio: `${t.w} / ${t.h}` }]" />
            <span>{{ t.name }}</span>
          </button>
        </div>

        <h3 class="rc-panel__title">Page size</h3>
        <div class="rc-list rc-list--grouped">
          <div v-for="group in PAGE_PRESET_GROUPS" :key="group.id" class="rc-list__group">
            <div class="rc-list__label">
              {{ group.label }}
            </div>
            <button
              v-for="p in group.presets" :key="p.id" type="button" class="rc-list__item"
              :class="{ 'is-on': state.width === p.w && state.height === p.h }" @click="api.setSize(p.w, p.h)"
            >
              <span>{{ p.label }}</span><small>{{ p.w }} × {{ p.h }}</small>
            </button>
          </div>
        </div>
        <div class="rc-row rc-row--gap">
          <input v-model.number="customW" type="number" min="50" max="8000" class="rc-num" aria-label="Width">
          <span>×</span>
          <input v-model.number="customH" type="number" min="50" max="8000" class="rc-num" aria-label="Height">
          <button type="button" class="rc-btn rc-btn--solid" @click="applyCustomSize">Resize</button>
        </div>
        <label class="rc-check"><input v-model="state.snap" type="checkbox"> Smart guides &amp; snapping</label>
      </section>

      <!-- ── Elements ─────────────────────────────────────────────────── -->
      <section v-else-if="tab === 'elements'">
        <h3 class="rc-panel__title">Shapes</h3>
        <div class="rc-shapes">
          <button v-for="s in SHAPES" :key="s.id" type="button" class="rc-shapes__item" :title="s.label" @click="api.addShape(s.id)">
            <svg viewBox="0 0 100 100" aria-hidden="true"><path :d="s.d" fill="currentColor" /></svg>
          </button>
        </div>
        <h3 class="rc-panel__title">Lines</h3>
        <div class="rc-list">
          <button v-for="l in LINES" :key="l.id" type="button" class="rc-list__item" @click="api.addLine(l.id)">
            <svg class="rc-linepreview" viewBox="0 0 100 8" aria-hidden="true">
              <line x1="4" y1="4" x2="96" y2="4" stroke="currentColor" stroke-width="3" stroke-linecap="round" :stroke-dasharray="l.dash ? l.dash.map(n => n / 2).join(' ') : undefined" />
            </svg>
            <small>{{ l.label }}</small>
          </button>
        </div>
      </section>

      <!-- ── Text ─────────────────────────────────────────────────────── -->
      <section v-else-if="tab === 'text'">
        <h3 class="rc-panel__title">Add text</h3>
        <button
          v-for="p in TEXT_PRESETS" :key="p.id" type="button" class="rc-text-preset"
          :style="{ fontSize: `${Math.max(14, p.fontSize / 3)}px`, fontWeight: p.fontWeight, fontFamily: state.defaultFont }"
          @click="api.addText(p.id)"
        >
          {{ p.label }}
        </button>
        <label class="rc-field">Default font
          <select class="rc-select" :value="state.defaultFont" @change="setDefaultFont">
            <option v-for="f in fonts" :key="f" :value="f">{{ f }}</option>
          </select>
        </label>
        <p class="rc-hint">Double-click any text to edit it. Khmer needs a Khmer font — pick “Noto Sans Khmer” or “Battambang”.</p>
      </section>

      <!-- ── Uploads ──────────────────────────────────────────────────── -->
      <section v-else-if="tab === 'uploads'">
        <h3 class="rc-panel__title">Upload</h3>
        <div class="rc-drop" @dragover.prevent @drop.prevent="onDropFiles">
          <input ref="fileInput" type="file" accept="image/*" multiple hidden @change="onFiles">
          <button type="button" class="rc-btn rc-btn--solid" @click="fileInput?.click()">
            <UIcon name="i-lucide-upload" class="rc-ico" /> Upload images
          </button>
          <small>or drop files here</small>
        </div>
        <div class="rc-row rc-row--gap">
          <input v-model="url" type="url" class="rc-input" placeholder="https://… image URL" @keydown.enter.prevent="addUrl">
          <button type="button" class="rc-btn" :disabled="!url.trim()" @click="addUrl">Add</button>
        </div>

        <h3 class="rc-panel__title">Media library</h3>
        <form class="rc-row rc-row--gap" @submit.prevent="emit('request-media', { search })">
          <input v-model="search" type="search" class="rc-input" placeholder="Search media…">
          <button type="submit" class="rc-btn">Search</button>
        </form>
        <p v-if="mediaLoading" class="rc-hint">Loading…</p>
        <p v-else-if="!mediaItems.length" class="rc-hint">No media to show.</p>
        <div class="rc-media">
          <button v-for="m in mediaItems" :key="m.id ?? m.url" type="button" class="rc-media__item" :title="m.name" @click="emit('insert-media', m)">
            <img :src="m.thumbnailUrl || m.url" :alt="m.name" loading="lazy" crossorigin="anonymous">
          </button>
        </div>
      </section>

      <!-- ── Draw ─────────────────────────────────────────────────────── -->
      <section v-else-if="tab === 'draw'">
        <h3 class="rc-panel__title">Pen</h3>
        <button
          type="button" class="rc-btn rc-btn--solid" :class="{ 'is-on': state.tool === 'draw' }"
          @click="api.setTool(state.tool === 'draw' ? 'select' : 'draw')"
        >
          <UIcon name="i-lucide-pen-line" class="rc-ico" /> {{ state.tool === 'draw' ? 'Stop drawing' : 'Start drawing' }}
        </button>
        <div class="rc-row rc-row--gap">
          <RCanvasColor :model-value="state.pen.color" title="Pen color" icon="pen-line" @update:model-value="api.setPen({ color: $event })" />
          <label class="rc-grow">Width <b>{{ state.pen.width }}</b>
            <input type="range" min="1" max="60" :value="state.pen.width" @input="api.setPen({ width: Number($event.target.value) })">
          </label>
        </div>
        <p class="rc-hint">Each stroke becomes a vector path you can move, recolor and layer.</p>
      </section>

      <!-- ── Layers ───────────────────────────────────────────────────── -->
      <section v-else-if="tab === 'layers'">
        <h3 class="rc-panel__title">Layers ({{ state.layers.length }})</h3>
        <p v-if="!state.layers.length" class="rc-hint">Nothing on this page yet.</p>
        <ul class="rc-layers">
          <li
            v-for="l in state.layers" :key="l.id" class="rc-layer" :class="{ 'is-on': isSelected(l.id), 'is-hidden': !l.visible }"
            draggable="true" @dragstart="dragId = l.id" @dragover.prevent @drop.prevent="onDrop(l.id)"
            @click="api.selectById(l.id, $event.shiftKey || $event.ctrlKey || $event.metaKey)"
          >
            <UIcon :name="`i-lucide-${{ text: 'type', image: 'image', line: 'minus', shape: 'shapes', group: 'group', multi: 'layers' }[l.kind]}`" class="rc-ico" />
            <input
              v-if="renaming === l.id" class="rc-input rc-layer__rename" :value="l.name" autofocus
              @click.stop @keydown.enter="commitRename(l.id, $event)" @keydown.esc="renaming = null" @blur="commitRename(l.id, $event)"
            >
            <span v-else class="rc-layer__name" :title="l.name" @dblclick.stop="renaming = l.id">{{ l.name }}</span>
            <button type="button" class="rc-btn rc-btn--sm" :title="l.visible ? 'Hide' : 'Show'" @click.stop="api.toggleVisible(l.id)">
              <UIcon :name="l.visible ? 'i-lucide-eye' : 'i-lucide-eye-off'" class="rc-ico" />
            </button>
            <button type="button" class="rc-btn rc-btn--sm" :class="{ 'is-on': l.locked }" :title="l.locked ? 'Unlock' : 'Lock'" @click.stop="api.toggleLock(l.id)">
              <UIcon :name="l.locked ? 'i-lucide-lock' : 'i-lucide-lock-open'" class="rc-ico" />
            </button>
          </li>
        </ul>
        <p class="rc-hint">Drag to reorder · Shift-click to multi-select · double-click to rename.</p>
      </section>

      <!-- ── Help ─────────────────────────────────────────────────────── -->
      <section v-else>
        <h3 class="rc-panel__title">Keyboard shortcuts</h3>
        <dl class="rc-keys">
          <template v-for="[k, d] in SHORTCUTS" :key="k"><dt>{{ k }}</dt><dd>{{ d }}</dd></template>
        </dl>
      </section>
    </div>
  </aside>
</template>
