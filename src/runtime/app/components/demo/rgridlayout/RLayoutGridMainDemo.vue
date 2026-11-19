<template>
    <RContent class="rgd">
      <!-- ══ 1. Header + exposed API ═════════════════════════════════════ -->
      <RCard class="rgd-card">
        <div class="rgd-head">
          <div>
            <h1 class="rgd-head__title">RGridLayout demo</h1>
            <p class="rgd-head__text">
              Every prop, slot, event, v-model and exposed method of <code>RGridLayout</code> in one page.
            </p>
          </div>
          <div class="rgd-seg" role="group" aria-label="Variant">
            <button v-for="v in ['card', 'bare']" :key="v" type="button" :class="{ 'is-active': variant === v }" :aria-pressed="variant === v" @click="variant = v">
              {{ v }}
            </button>
          </div>
        </div>

        <div class="rgd-toolbar">
          <span class="rgd-toolbar__label">Exposed methods</span>
          <!-- <RTooltip v-for="l in look" :text="l.label">
            <RBtn v-if="!l.click" :type="l?.type" :label="l?.label" :icon="l?.icon" @click="l?.click"/>
            <RBtn  :type="l?.type"  @click="l?.click" :label="l?.label" :icon="l?.icon"/>
          </RTooltip> -->
          <RBtn size="xs" variant="soft" icon="i-lucide-plus" label="addItem" @click="refRGridLayout?.addItem({ w: 3, h: 2 })" />
          <RBtn size="xs" variant="soft" icon="i-lucide-shuffle" label="addItemRandom" @click="refRGridLayout?.addItemRandom()" />
          <RBtn size="xs" variant="soft" icon="i-lucide-minus" label="removeItem" @click="removeLast" />
          <RBtn size="xs" variant="soft" icon="i-lucide-download" label="getLayout" @click="log('getLayout()', `${refRGridLayout?.getLayout().length} items`)" />
          <RBtn size="xs" variant="soft" icon="i-lucide-align-start-vertical" label="setLayout" @click="stackAll" />
          <RBtn size="xs" variant="soft" icon="i-lucide-scaling" label="setScale(0.75)" @click="refRGridLayout?.setScale(0.75)" />
          <RBtn size="xs" variant="soft" icon="i-lucide-scaling" label="setScale(1)" @click="refRGridLayout?.setScale(1)" />
          <RBtn size="xs" variant="soft" icon="i-lucide-minimize-2" label="stepWidth(-60)" @click="refRGridLayout?.stepWidth(-60)" />
          <RBtn size="xs" variant="soft" icon="i-lucide-move-horizontal" label="resetWidth" @click="refRGridLayout?.resetWidth()" />
          <RBtn size="xs" variant="soft" icon="i-lucide-arrow-left-right" label="changeDirection" @click="refRGridLayout?.changeDirection()" />
          <RBtn size="xs" variant="soft" icon="i-lucide-copy" label="copyLayoutJson" @click="refRGridLayout?.copyLayoutJson()" />
          <RBtn size="xs" variant="outline" icon="i-lucide-undo-2" label="resetLayout" @click="refRGridLayout?.resetLayout()" />
        </div>

        <div class="rgd-toolbar">
          <span class="rgd-toolbar__label">Props</span>
          <label class="rgd-check"><input v-model="showJson" type="checkbox" /> showLayoutJson</label>
          <label class="rgd-check"><input v-model="showPanel" type="checkbox" /> showControlPanel</label>
          <label class="rgd-check"><input v-model="verbose" type="checkbox" /> log move / resize</label>
          <div class="rgd-seg" role="group" aria-label="Labels">
            <button v-for="l in ['en', 'km']" :key="l" type="button" :class="{ 'is-active': lang === l }" :aria-pressed="lang === l" @click="lang = l">
              labels: {{ l }}
            </button>
          </div>
        </div>
      </RCard>

      <!-- ══ 2. The grid ═════════════════════════════════════════════════ -->
      <RCard class="rgd-card">
        <RGridLayout
          ref="refRGridLayout"
          v-model:layout="layout"
          v-model:responsive-layouts="responsiveLayouts"
          v-model:option="option"
          :breakpoints="BREAKPOINTS"
          :cols="COLS"
          :responsive="true"
          :show-control-panel="showPanel"
          :control-panel-open="true"
          :show-layout-json="showJson"
          :controls="CONTROLS"
          :variant="variant"
          :labels="labels"
          @layout-created="log('layout-created')"
          @layout-before-mount="log('layout-before-mount')"
          @layout-mounted="log('layout-mounted')"
          @layout-ready="log('layout-ready')"
          @layout-updated="log('layout-updated')"
          @breakpoint-changed="(bp) => log('breakpoint-changed', bp)"
          @move="(i, x, y) => log('move', `${i} → ${x},${y}`)"
          @moved="(i, x, y) => log('moved', `${i} → ${x},${y}`)"
          @resize="(i, h, w) => log('resize', `${i} → ${w}×${h}`)"
          @resized="(i, h, w) => log('resized', `${i} → ${w}×${h}`)"
          @container-resized="(i, h, w) => log('container-resized', `${i} → ${w}×${h}`)"
          @layout-change="(_, meta) => log('layout-change', `${meta.type} ${meta.i ?? ''} @${meta.breakpoint ?? '-'}`)"
          @item-add="(item) => log('item-add', item.i)"
          @item-remove="(item) => log('item-remove', item.i)"
          @reset="log('reset')"
        >
          <!-- #panel — extra controls inside the control panel -->
          <template #panel="{ state }">
            <div class="rgd-extra">
              <span class="rgd-toolbar__label">#panel slot</span>
              <RBtn size="xs" variant="outline" @click="state.isDraggable = !state.isDraggable">
                Drag: {{ state.isDraggable ? "on" : "off" }}
              </RBtn>
              <RBtn size="xs" variant="outline" @click="state.isResizable = !state.isResizable">
                Resize: {{ state.isResizable ? "on" : "off" }}
              </RBtn>
            </div>
          </template>

          <!-- #item-custom — one item with its own content (wins over #item) -->
          <template #item-custom="{ item, remove, cols, breakpoint }">
            <div class="rgd-item rgd-item--custom">
              <strong>#item-{{ item.i }}</strong>
              <span>{{ breakpoint || "—" }} · {{ cols }} cols</span>
              <RBtn size="xs" variant="ghost" color="error" icon="i-lucide-trash-2" aria-label="Remove" @click.stop="remove" />
            </div>
          </template>

          <!-- #item — content of every other item -->
          <template #item="{ item, index, remove }">
            <div class="rgd-item" :class="{ 'is-static': item.static }">
              <header class="rgd-item__head" :class="{ 'rgd-item__handle': item.i === 'handle' }">
                <span class="rgd-item__id">{{ index }} · {{ item.i }}</span>
                <button type="button" class="rgd-item__remove" aria-label="Remove" @click.stop="remove">
                  <UIcon name="i-lucide-x" />
                </button>
              </header>
              <p class="rgd-item__size">{{ item.w }} × {{ item.h }} @ {{ item.x }}, {{ item.y }}</p>
              <p v-if="NOTES[item.i]" class="rgd-item__note">{{ NOTES[item.i] }}</p>
              <input v-if="item.i === 'handle'" class="rgd-item__no-drag" type="text" placeholder="Typing here never drags" />
            </div>
          </template>

          <!-- #empty — shown when there are no items -->
          <template #empty>
            <div class="rgd-empty">
              <p>#empty slot — nothing to show.</p>
              <RBtn size="sm" variant="soft" icon="i-lucide-undo-2" @click="refRGridLayout?.resetLayout()">Restore items</RBtn>
            </div>
          </template>
        </RGridLayout>
      </RCard>

      <!-- ══ 3. v-model readout + event log ══════════════════════════════ -->
      <div class="rgd-split">
        <RCard class="rgd-card">
          <h2 class="rgd-h2">v-model:option</h2>
          <pre class="rgd-pre" tabindex="0">{{ optionJson }}</pre>
        </RCard>

        <RCard class="rgd-card">
          <div class="rgd-log-head">
            <h2 class="rgd-h2">Events</h2>
            <RBtn size="xs" variant="ghost" color="neutral" icon="i-lucide-eraser" @click="events = []">Clear</RBtn>
          </div>
          <ol class="rgd-log" aria-live="polite">
            <li v-for="e in events" :key="e.id">
              <time>{{ e.time }}</time>
              <b>{{ e.name }}</b>
              <span>{{ e.detail }}</span>
            </li>
            <li v-if="!events.length" class="rgd-log__empty">Interact with the grid to see events.</li>
          </ol>
        </RCard>
      </div>
    </RContent>
</template>

<script setup>
import { ref, computed } from "vue"

          // <RBtn size="xs" variant="soft" icon="i-lucide-plus" @click="refRGridLayout?.addItem({ w: 3, h: 2 })">addItem</RBtn>
          // <RBtn size="xs" variant="soft" icon="i-lucide-shuffle" @click="refRGridLayout?.addItemRandom()">addItemRandom</RBtn>
          // <RBtn size="xs" variant="soft" icon="i-lucide-minus" @click="removeLast">removeItem</RBtn>
          // <RBtn size="xs" variant="soft" icon="i-lucide-download" @click="log('getLayout()', `${refRGridLayout?.getLayout().length} items`)">getLayout</RBtn>
          // <RBtn size="xs" variant="soft" icon="i-lucide-align-start-vertical" @click="stackAll">setLayout</RBtn>
          // <RBtn size="xs" variant="soft" icon="i-lucide-scaling" @click="refRGridLayout?.setScale(0.75)">setScale(0.75)</RBtn>
          // <RBtn size="xs" variant="soft" icon="i-lucide-scaling" @click="refRGridLayout?.setScale(1)">setScale(1)</RBtn>
          // <RBtn size="xs" variant="soft" icon="i-lucide-minimize-2" @click="refRGridLayout?.stepWidth(-60)">stepWidth(-60)</RBtn>
          // <RBtn size="xs" variant="soft" icon="i-lucide-move-horizontal" @click="refRGridLayout?.resetWidth()">resetWidth</RBtn>
          // <RBtn size="xs" variant="soft" icon="i-lucide-arrow-left-right" @click="refRGridLayout?.changeDirection()">changeDirection</RBtn>
          // <RBtn size="xs" variant="soft" icon="i-lucide-copy" @click="refRGridLayout?.copyLayoutJson()">copyLayoutJson</RBtn>
          // <RBtn size="xs" variant="outline" icon="i-lucide-undo-2" @click="refRGridLayout?.resetLayout()">resetLayout</RBtn>
// ═════════════════════════════════════════════════════════════════════════════
// Static config
// ═════════════════════════════════════════════════════════════════════════════
const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }
const COLS = { lg: 12, md: 8, sm: 4, xs: 2, xxs: 2 }
const CONTROLS = ["toggles", "numbers", "size", "scale", "items", "direction", "json", "reset"]

// Each item shows one per-item option (GridItem props)
const BASE = [
  { i: "free", x: 0, y: 0, w: 3, h: 3 },
  { i: "static", x: 3, y: 0, w: 3, h: 3, static: true },
  { i: "limits", x: 6, y: 0, w: 3, h: 3, minW: 2, maxW: 5, minH: 2, maxH: 4 },
  { i: "no-drag", x: 9, y: 0, w: 3, h: 3, isDraggable: false },
  { i: "no-resize", x: 0, y: 3, w: 3, h: 3, isResizable: false },
  { i: "bounded", x: 3, y: 3, w: 3, h: 3, isBounded: true },
  { i: "ratio", x: 6, y: 3, w: 3, h: 3, preserveAspectRatio: true },
  { i: "handle", x: 9, y: 3, w: 3, h: 3, dragAllowFrom: ".rgd-item__handle", dragIgnoreFrom: ".rgd-item__no-drag" },
  { i: "custom", x: 0, y: 6, w: 4, h: 2 },
]
const NOTES = {
  free: "Drag + resize.",
  static: "static: true — never moves.",
  limits: "minW 2 · maxW 5 · minH 2 · maxH 4.",
  "no-drag": "isDraggable: false.",
  "no-resize": "isResizable: false.",
  bounded: "isBounded: true.",
  ratio: "preserveAspectRatio: true.",
  handle: "dragAllowFrom header, dragIgnoreFrom input.",
}

const clone = (value) => JSON.parse(JSON.stringify(value))

// Flow the items left → right, top → bottom for a given column count
function pack(items, cols) {
  let x = 0
  let y = 0
  let rowH = 0
  return items.map((item) => {
    const w = Math.min(item.w, cols)
    if (x + w > cols) {
      x = 0
      y += rowH
      rowH = 0
    }
    const placed = { ...item, x, y, w }
    x += w
    rowH = Math.max(rowH, item.h)
    return placed
  })
}

const buildResponsive = () => ({
  lg: clone(BASE),
  md: pack(BASE, COLS.md),
  sm: pack(BASE, COLS.sm),
  xs: pack(BASE, COLS.xs),
  xxs: pack(BASE, COLS.xxs),
})

// ═════════════════════════════════════════════════════════════════════════════
// v-model state
// ═════════════════════════════════════════════════════════════════════════════
const refRGridLayout = ref(null)
const layout = ref(clone(BASE))
const responsiveLayouts = ref(buildResponsive())
// 2 ─ look
const look = [
  { type: 'save', icon: 'save', label: 'add_item', variant: 'outline', click: () => refRGridLayout.value?.addItem({ w: 3, h: 2 }) },
  { type: 'create', icon: 'create', label: 'add_item_random', size: 's', click: () => refRGridLayout.value?.addItemRandom() },
  { type: 'next', icon: 'next', label: 'remove_item', isIconRight: true, click: () => refRGridLayout.value?.removeItem() },
  { type: 'apply', label: 'get_layout', noIcon: true, click: () => refRGridLayout.value?.getLayout() },
  { type: 'send', icon: 'send', label: 'set_layout', isLabelBold: true, click: () => refRGridLayout.value?.setLayout() },
  { color: 'dark-green', type: 'import', icon: 'ri-leaf-line', label: 'set_scale(0.75)', click: () => refRGridLayout.value?.setScale(0.75) },
  { color: 'dark-green', type: 'import', icon: 'ri-leaf-line', label: 'set_scale(1)', click: () => refRGridLayout.value?.setScale(1) },
  { color: 'dark-green', type: 'import', icon: 'ri-leaf-line', label: 'step_width(-60)', click: () => refRGridLayout.value?.setStepWidth(-60) },
  { color: 'dark-green', type: 'import', icon: 'ri-leaf-line', label: 'reset_width', click: () => refRGridLayout.value?.resetWidth() },
  { color: 'dark-green', type: 'import', icon: 'ri-leaf-line', label: 'change_direction', click: () => refRGridLayout.value?.changeDirection() },
  { color: 'dark-green', type: 'import', icon: 'ri-leaf-line', label: 'copy_layout_json', click: () => refRGridLayout.value?.copyLayoutJson() },
  { color: 'dark-green', type: 'import', icon: 'ri-leaf-line', label: 'reset_layout', click: () => refRGridLayout.value?.resetLayout() },
  { color: 'dark-green', type: 'import', icon: 'ri-leaf-line', label: 'clear_items', click: () => refRGridLayout.value?.clearItems() },
]
// One object for all behaviour options. Native props (e.g. :responsive, :breakpoints, :cols)
// win over the same key in this object.
const option = ref({
  isDraggable: true,
  isResizable: true,
  isMirrored: false,
  isBounded: false,
  isPreventCollision: false,
  isVerticalCompact: true,
  isRestoreOnDrag: false,
  isUseCssTransforms: true,
  isAutoSize: true,
  isUseStyleCursor: true,
  showGridLines: true,
  rowHeight: 56,
  margin: [12, 12],
  containerPadding: [8, 8],
  maxRows: Infinity,
  transformScale: 1,
})

const optionJson = computed(() => JSON.stringify(option.value, null, 2)) // Infinity → null

// ═════════════════════════════════════════════════════════════════════════════
// UI props
// ═════════════════════════════════════════════════════════════════════════════
const variant = ref("card")
const showPanel = ref(true)
const showJson = ref(false)
const lang = ref("en")

const LABELS = {
  en: {},
  km: {
    controlPanel: "ផ្ទាំងគ្រប់គ្រង",
    items: "ធាតុ",
    columns: "ជួរឈរ",
    addItem: "បន្ថែមធាតុ",
    addItemRandom: "បន្ថែមចៃដន្យ",
    reset: "កំណត់ឡើងវិញ",
    showJson: "បង្ហាញ JSON",
    hideJson: "លាក់ JSON",
    copyJson: "ចម្លង JSON",
    copied: "បានចម្លង",
    changeDirection: "ប្តូរទិស",
    scale: "មាត្រដ្ឋាន",
  },
}
const labels = computed(() => LABELS[lang.value])

// ═════════════════════════════════════════════════════════════════════════════
// Methods + event log
// ═════════════════════════════════════════════════════════════════════════════
function removeLast() {
  const last = layout.value.at(-1)
  if (last) refRGridLayout.value?.removeItem(last.i)
}

// setLayout(): stack everything in one column
function stackAll() {
  let y = 0
  refRGridLayout.value?.setLayout(
    layout.value.map((item) => {
      const next = { ...item, x: 0, y }
      y += item.h
      return next
    }),
  )
}

const events = ref([])
const verbose = ref(false)
const NOISY = new Set(["move", "resize", "container-resized"])
let eventId = 0

function log(name, detail = "") {
  if (!verbose.value && NOISY.has(name)) return
  const time = new Date().toLocaleTimeString([], { hour12: false })
  events.value = [{ id: ++eventId, time, name, detail }, ...events.value].slice(0, 40)
}
</script>

<style lang="scss">
.rgd {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4, 1rem);
  padding: 0;
  max-width: 100%;

  code {
    padding: 0.0625rem 0.375rem;
    font-size: 0.8125rem;
    border-radius: var(--r-sm, 8px);
    background: color-mix(in srgb, var(--c-accent) 10%, transparent);
  }
}

.rgd-card {
  min-width: 0;
}

.rgd-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sp-4, 1rem);
  margin-bottom: var(--sp-4, 1rem);

  &__title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.01em;
    color: var(--c-text);
  }

  &__text {
    margin: var(--sp-1, 0.25rem) 0 0;
    max-width: 62ch;
    color: var(--c-muted);
  }
}

.rgd-h2 {
  margin: 0 0 var(--sp-3, 0.75rem);
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--c-text);
}

// Segmented control
.rgd-seg {
  display: inline-flex;
  padding: 0.125rem;
  border: 1px solid var(--c-border);
  border-radius: var(--r-md, 12px);
  background: var(--c-bg);

  button {
    padding: 0.25rem 0.75rem;
    font: inherit;
    font-size: 0.8125rem;
    font-weight: 500;
    border: 0;
    border-radius: calc(var(--r-md, 12px) - 2px);
    color: var(--c-muted);
    background: transparent;
    cursor: pointer;
    transition: background var(--t-fast, 150ms) var(--ease-out, ease-out), color var(--t-fast, 150ms) var(--ease-out, ease-out);

    &.is-active {
      color: var(--c-text);
      background: var(--c-surface);
      box-shadow: 0 1px 2px rgb(0 0 0 / 0.12);
    }

    &:focus-visible {
      outline: 2px solid var(--c-accent);
      outline-offset: 1px;
    }
  }
}

.rgd-toolbar,
.rgd-extra {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-2, 0.5rem);

  & + & {
    margin-top: var(--sp-3, 0.75rem);
    padding-top: var(--sp-3, 0.75rem);
    border-top: 1px solid var(--c-border);
  }

  &__label {
    min-width: 6.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--c-muted);
  }
}

.rgd-check {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  color: var(--c-text);
  cursor: pointer;

  input {
    accent-color: var(--c-accent);
  }
}

// Grid items
.rgd-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  height: 100%;
  padding: 0.625rem 0.75rem;
  overflow: hidden;
  border: 1px solid var(--c-border);
  border-radius: var(--r-md, 12px);
  background: var(--c-surface);

  &.is-static {
    border-style: dashed;
    background: color-mix(in srgb, var(--c-muted) 8%, var(--c-surface));
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  &__handle {
    cursor: grab;
    color: var(--c-accent);
  }

  &__id {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--c-text);
  }

  &__remove {
    display: grid;
    place-items: center;
    width: 1.375rem;
    height: 1.375rem;
    padding: 0;
    border: 0;
    border-radius: var(--r-sm, 8px);
    color: var(--c-muted);
    background: transparent;
    cursor: pointer;

    &:hover {
      color: var(--c-danger);
      background: color-mix(in srgb, var(--c-danger) 12%, transparent);
    }

    &:focus-visible {
      outline: 2px solid var(--c-accent);
    }
  }

  &__size {
    margin: 0;
    font-size: 0.75rem;
    font-variant-numeric: tabular-nums;
    color: var(--c-muted);
  }

  &__note {
    margin: 0;
    font-size: 0.75rem;
    color: var(--c-text);
  }

  &__no-drag {
    width: 100%;
    margin-top: auto;
    padding: 0.25rem 0.5rem;
    font: inherit;
    font-size: 0.75rem;
    border: 1px solid var(--c-border);
    border-radius: var(--r-sm, 8px);
    color: var(--c-text);
    background: var(--c-bg);

    &:focus {
      outline: 2px solid var(--c-accent);
      outline-offset: 0;
    }
  }

  &--custom {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    border-color: color-mix(in srgb, var(--c-accent) 45%, transparent);
    background: color-mix(in srgb, var(--c-accent) 8%, var(--c-surface));

    span {
      font-size: 0.75rem;
      color: var(--c-muted);
    }
  }
}

.rgd-empty {
  display: grid;
  justify-items: center;
  gap: var(--sp-3, 0.75rem);
  padding: var(--sp-8, 2rem);
  border: 2px dashed var(--c-border);
  border-radius: var(--r-lg, 16px);
  color: var(--c-muted);

  p {
    margin: 0;
  }
}

// Readout + log
.rgd-split {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--sp-4, 1rem);

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }
}

.rgd-pre {
  max-height: 18rem;
  margin: 0;
  padding: var(--sp-3, 0.75rem) var(--sp-4, 1rem);
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.75rem;
  line-height: 1.55;
  border: 1px solid var(--c-border);
  border-radius: var(--r-md, 12px);
  color: var(--c-text);
  background: var(--c-bg);
}

.rgd-log-head {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .rgd-h2 {
    margin: 0;
  }
}

.rgd-log {
  display: grid;
  gap: 0.125rem;
  max-height: 18rem;
  margin: var(--sp-3, 0.75rem) 0 0;
  padding: 0;
  overflow: auto;
  list-style: none;
  font-size: 0.75rem;

  li {
    display: grid;
    grid-template-columns: auto auto 1fr;
    gap: 0.5rem;
    padding: 0.25rem 0;
    border-bottom: 1px solid var(--c-border);
    color: var(--c-muted);

    &:last-child {
      border-bottom: 0;
    }

    time {
      font-variant-numeric: tabular-nums;
    }

    b {
      font-weight: 600;
      color: var(--c-accent);
    }
  }

  &__empty {
    display: block !important;
  }
}
</style>
