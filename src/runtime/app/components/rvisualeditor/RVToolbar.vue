<script setup>
// Word-style ribbon (tabs + labelled groups) or UEditor-style compact row. Presentational: all editing goes
// through the Tiptap editor passed in; every external value is treated as possibly null/invalid.
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { onClickOutside } from '@vueuse/core'

defineOptions({ name: 'RVToolbar' })

const props = defineProps({
  editor: { type: Object, default: null },
  features: { type: Object, default: () => ({}) }, // { key: { visible, enabled } }
  fonts: { type: Array, default: () => [] }, // [{ key }]
  fontSizes: { type: Array, default: () => [] }, // [number]
  editable: { type: Boolean, default: true },
  mode: { type: String, default: 'ribbon', validator: (v) => ['ribbon', 'compact'].includes(v) },
  compact: { type: Boolean, default: false }, // narrow container
  insertItems: { type: Array, default: () => [] }, // [{ group, title, hint, icon, run(editor) }]
  textColors: { type: Array, default: () => [] }, // [{ name, value }]
  highlights: { type: Array, default: () => [] },
  applyLink: { type: Function, default: null }, // (url) => boolean
  tick: { type: Number, default: 0 }, // bumped by the parent on every editor transaction
})

// ---- null-safe accessors ------------------------------------------------------------------------------
const noop = new Proxy(function noopFn() {}, { get: () => noop, apply: () => noop })
const ed = () => { const e = props.editor; return e && !e.isDestroyed ? e : null }
const act = (...a) => { try { return ed()?.isActive(...a) ?? false } catch { return false } }
const attrs = (name) => { try { return ed()?.getAttributes(name) ?? {} } catch { return {} } }
const chain = () => ed()?.chain().focus() ?? noop
const feature = (key) => (props.features && typeof props.features === 'object' ? props.features[key] : undefined)
const vis = (key) => feature(key)?.visible === true
const usable = (key) => props.editable && feature(key)?.enabled === true
const list = (v) => (Array.isArray(v) ? v : [])
const COLOR_RE = /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%/]+\)|hsla?\([\d\s.,%/deg]+\))$/i
const safeColor = (c) => (typeof c === 'string' && COLOR_RE.test(c) ? c : null)

// ---- action table: one source for visibility, active, disabled, run, shortcut ------------------------------
const inList = () => act('listItem') || act('taskItem')
const T = (feature, icon, label, kbd, run, active, can) => ({ feature, icon, label, kbd, run, active, can })
const A = {
  undo: T('history', 'i-lucide-undo-2', 'Undo', ['meta', 'Z'], () => chain().undo().run(), null, () => ed().can().undo()),
  redo: T('history', 'i-lucide-redo-2', 'Redo', ['meta', 'shift', 'Z'], () => chain().redo().run(), null, () => ed().can().redo()),
  bold: T('textFormatting', 'i-lucide-bold', 'Bold', ['meta', 'B'], () => chain().toggleBold().run(), () => act('bold'), () => ed().can().toggleBold()),
  italic: T('textFormatting', 'i-lucide-italic', 'Italic', ['meta', 'I'], () => chain().toggleItalic().run(), () => act('italic'), () => ed().can().toggleItalic()),
  underline: T('textFormatting', 'i-lucide-underline', 'Underline', ['meta', 'U'], () => chain().toggleUnderline().run(), () => act('underline'), () => ed().can().toggleUnderline()),
  strike: T('textFormatting', 'i-lucide-strikethrough', 'Strikethrough', ['meta', 'shift', 'S'], () => chain().toggleStrike().run(), () => act('strike'), () => ed().can().toggleStrike()),
  subscript: T('textFormatting', 'i-lucide-subscript', 'Subscript', ['meta', ','], () => chain().toggleSubscript().run(), () => act('subscript'), () => ed().can().toggleSubscript()),
  superscript: T('textFormatting', 'i-lucide-superscript', 'Superscript', ['meta', '.'], () => chain().toggleSuperscript().run(), () => act('superscript'), () => ed().can().toggleSuperscript()),
  clear: T('textFormatting', 'i-lucide-remove-formatting', 'Clear formatting', [], () => chain().unsetAllMarks().run(), null, () => true),
  bulletList: T('lists', 'i-lucide-list', 'Bulleted list', ['meta', 'shift', '8'], () => chain().toggleBulletList().run(), () => act('bulletList'), () => ed().can().toggleBulletList()),
  orderedList: T('lists', 'i-lucide-list-ordered', 'Numbered list', ['meta', 'shift', '7'], () => chain().toggleOrderedList().run(), () => act('orderedList'), () => ed().can().toggleOrderedList()),
  taskList: T('lists', 'i-lucide-list-checks', 'To-do list', ['meta', 'shift', '9'], () => chain().toggleTaskList().run(), () => act('taskList'), () => ed().can().toggleTaskList()),
  outdent: T('indent', 'i-lucide-indent-decrease', 'Decrease indent', ['meta', '['], () => (inList() ? chain().liftListItem(act('taskItem') ? 'taskItem' : 'listItem').run() : chain().outdent().run()), null, () => (inList() ? true : ed().can().outdent())),
  indent: T('indent', 'i-lucide-indent-increase', 'Increase indent', ['meta', ']'], () => (inList() ? chain().sinkListItem(act('taskItem') ? 'taskItem' : 'listItem').run() : chain().indent().run()), null, () => (inList() ? true : ed().can().indent())),
  alignLeft: T('alignment', 'i-lucide-align-left', 'Align left', ['meta', 'shift', 'L'], () => chain().setTextAlign('left').run(), () => act({ textAlign: 'left' }), () => ed().can().setTextAlign('left')),
  alignCenter: T('alignment', 'i-lucide-align-center', 'Center', ['meta', 'shift', 'E'], () => chain().setTextAlign('center').run(), () => act({ textAlign: 'center' }), () => ed().can().setTextAlign('center')),
  alignRight: T('alignment', 'i-lucide-align-right', 'Align right', ['meta', 'shift', 'R'], () => chain().setTextAlign('right').run(), () => act({ textAlign: 'right' }), () => ed().can().setTextAlign('right')),
  alignJustify: T('alignment', 'i-lucide-align-justify', 'Justify', ['meta', 'shift', 'J'], () => chain().setTextAlign('justify').run(), () => act({ textAlign: 'justify' }), () => ed().can().setTextAlign('justify')),
  blockquote: T('blockquote', 'i-lucide-text-quote', 'Quote', ['meta', 'shift', 'B'], () => chain().toggleBlockquote().run(), () => act('blockquote'), () => ed().can().toggleBlockquote()),
  addRowBefore: T('tables', 'i-lucide-between-horizontal-start', 'Row above', [], () => chain().addRowBefore().run(), null, () => ed().can().addRowBefore()),
  addRowAfter: T('tables', 'i-lucide-between-horizontal-end', 'Row below', [], () => chain().addRowAfter().run(), null, () => ed().can().addRowAfter()),
  addColBefore: T('tables', 'i-lucide-between-vertical-start', 'Column left', [], () => chain().addColumnBefore().run(), null, () => ed().can().addColumnBefore()),
  addColAfter: T('tables', 'i-lucide-between-vertical-end', 'Column right', [], () => chain().addColumnAfter().run(), null, () => ed().can().addColumnAfter()),
  deleteRow: T('tables', 'i-lucide-rows-3', 'Delete row', [], () => chain().deleteRow().run(), null, () => ed().can().deleteRow()),
  deleteCol: T('tables', 'i-lucide-columns-3', 'Delete column', [], () => chain().deleteColumn().run(), null, () => ed().can().deleteColumn()),
  mergeCells: T('tables', 'i-lucide-table-cells-merge', 'Merge cells', [], () => chain().mergeCells().run(), null, () => ed().can().mergeCells()),
  splitCell: T('tables', 'i-lucide-table-cells-split', 'Split cell', [], () => chain().splitCell().run(), null, () => ed().can().splitCell()),
  headerRow: T('tables', 'i-lucide-table-properties', 'Header row', [], () => chain().toggleHeaderRow().run(), () => act('tableHeader'), () => ed().can().toggleHeaderRow()),
  deleteTable: T('tables', 'i-lucide-trash-2', 'Delete table', [], () => chain().deleteTable().run(), null, () => ed().can().deleteTable()),
}
const isOff = (id) => {
  const a = A[id]
  if (!a || !ed() || !usable(a.feature)) return true
  try { return a.can ? !a.can() : false } catch { return true }
}
const isOn = (id) => { try { return !!A[id]?.active?.() } catch { return false } }
const run = (id) => { if (!isOff(id)) { try { A[id].run() } catch { /* command not available */ } } }
const ids = (group) => list(group).filter((id) => A[id] && vis(A[id].feature))

const G = {
  history: ['undo', 'redo'],
  marks: ['bold', 'italic', 'underline', 'strike', 'subscript', 'superscript'],
  lists: ['bulletList', 'orderedList', 'taskList', 'outdent', 'indent'],
  align: ['alignLeft', 'alignCenter', 'alignRight', 'alignJustify', 'blockquote'],
  rows: ['addRowBefore', 'addRowAfter', 'addColBefore', 'addColAfter', 'deleteRow', 'deleteCol'],
  merge: ['mergeCells', 'splitCell'],
  table: ['headerRow', 'deleteTable'],
  indent: ['outdent', 'indent'],
}

// ---- tabs -------------------------------------------------------------------------------------------------------
const ribbon = computed(() => props.mode === 'ribbon')
const activeTab = ref('home')
const collapsed = ref(false)
const tableActive = ref(false)
watch(() => props.tick, () => { tableActive.value = vis('tables') && act('table') }, { immediate: true })

const itemsOf = (pred) => list(props.insertItems).filter((i) => i && typeof i.run === 'function' && pred(i))
const mediaItems = computed(() => itemsOf((i) => i.group === 'Media'))
const blockItems = computed(() => itemsOf((i) => ['Callout', 'Warning callout', 'Divider', 'Code', 'Date'].includes(i.title)))
const hasInsert = () => vis('tables') || vis('links') || mediaItems.value.length > 0 || blockItems.value.length > 0
const tabs = computed(() => {
  const t = [{ id: 'home', label: 'Home' }]
  if (hasInsert()) t.push({ id: 'insert', label: 'Insert' })
  if (vis('spacing') || vis('indent')) t.push({ id: 'layout', label: 'Layout' })
  if (tableActive.value) t.push({ id: 'table', label: 'Table', contextual: true })
  return t
})
watch(tabs, (t) => { if (!t.some((x) => x.id === activeTab.value)) activeTab.value = 'home' })
const isShown = (id) => (ribbon.value ? activeTab.value === id : id === 'home' || (id === 'insert' && hasInsert()) || (id === 'table' && tableActive.value))
function selectTab(id) { activeTab.value = id; collapsed.value = false; pop.value = null }
function onTabKey(e) {
  const all = tabs.value
  const i = all.findIndex((t) => t.id === activeTab.value)
  if (i < 0) return
  const next = e.key === 'ArrowRight' ? all[(i + 1) % all.length] : e.key === 'ArrowLeft' ? all[(i - 1 + all.length) % all.length] : null
  if (next) { e.preventDefault(); selectTab(next.id) }
}

// ---- selects --------------------------------------------------------------------------------------------------------
const fontList = computed(() => list(props.fonts).filter((f) => f && typeof f.key === 'string'))
const sizeList = computed(() => list(props.fontSizes).filter((n) => Number.isFinite(n)))
const BLOCK_OPTS = computed(() => [
  ['p', 'Normal'],
  ...(vis('headings') ? [1, 2, 3, 4, 5, 6].map((n) => [String(n), `Heading ${n}`]) : []),
  ...(vis('lists') ? [['bullet', 'Bulleted list'], ['ordered', 'Numbered list'], ['task', 'To-do list']] : []),
  ...(vis('blockquote') ? [['quote', 'Quote']] : []),
  ...(vis('codeBlock') ? [['code', 'Code block']] : []),
])
const curBlock = () => (act('heading') ? String(attrs('heading').level ?? 'p') : act('bulletList') ? 'bullet' : act('orderedList') ? 'ordered' : act('taskList') ? 'task' : act('blockquote') ? 'quote' : act('codeBlock') ? 'code' : 'p')
function onBlock(v) {
  if (!usable('headings') && !usable('lists')) return
  const c = chain()
  if (v === 'p') c.setParagraph().run()
  else if (/^[1-6]$/.test(v)) c.setHeading({ level: Number(v) }).run()
  else if (v === 'bullet') c.toggleBulletList().run()
  else if (v === 'ordered') c.toggleOrderedList().run()
  else if (v === 'task') c.toggleTaskList().run()
  else if (v === 'quote') c.toggleBlockquote().run()
  else if (v === 'code') c.toggleCodeBlock().run()
}
const val = (e) => (typeof e?.target?.value === 'string' ? e.target.value : '')
const onFont = (e) => { const v = val(e); v ? chain().setFontFamily(v).run() : chain().unsetFontFamily().run() }
const onSize = (e) => { const v = val(e); v ? chain().setFontSize(v).run() : chain().unsetFontSize().run() }
const LINE_HEIGHTS = [['1', 'Single'], ['1.15', '1.15'], ['1.5', '1.5'], ['2', 'Double'], ['2.5', '2.5']]
const SPACINGS = [['-0.02em', 'Tight'], ['0em', 'Normal'], ['0.04em', 'Wide'], ['0.1em', 'Wider']]
const curLineHeight = () => attrs(act('heading') ? 'heading' : 'paragraph').lineHeight ?? ''
const onLineHeight = (e) => { const v = val(e); v ? chain().setLineHeight(v).run() : chain().unsetLineHeight().run() }
const onSpacing = (e) => { const v = val(e); v ? chain().setLetterSpacing(v).run() : chain().unsetLetterSpacing().run() }

// ---- popovers: colors, link, table grid ------------------------------------------------------------------------
const rootEl = ref(null)
const pop = ref(null) // 'color' | 'highlight' | 'link' | 'table' | null
onClickOutside(rootEl, () => { pop.value = null })
const togglePop = (name) => { pop.value = pop.value === name ? null : name }
const curColor = () => safeColor(attrs('textStyle').color)
const curHighlight = () => safeColor(attrs('highlight').color)
const setColor = (v) => (safeColor(v) ? chain().setColor(v).run() : chain().unsetColor().run())
const setHighlight = (v) => (safeColor(v) ? chain().setHighlight({ color: v }).run() : chain().unsetHighlight().run())

const linkUrl = ref('')
const linkError = ref('')
const linkInput = ref(null)
function toggleLink(open) {
  const next = typeof open === 'boolean' ? open : pop.value !== 'link'
  pop.value = next ? 'link' : null
  if (next) { linkUrl.value = String(attrs('link').href ?? ''); linkError.value = ''; nextTick(() => linkInput.value?.focus()) }
}
function submitLink() {
  const ok = typeof props.applyLink === 'function' ? props.applyLink(linkUrl.value) : false
  if (!ok) { linkError.value = 'Enter a valid http(s), mailto or tel link.'; return }
  pop.value = null
}
function removeLink() { chain().extendMarkRange('link').unsetLink().run(); pop.value = null }

const GRID_ROWS = 6
const GRID_COLS = 8
const grid = reactive({ r: 0, c: 0 })
function insertTable(r, c) {
  if (!usable('tables') || !(r > 0) || !(c > 0)) return
  chain().insertTable({ rows: r, cols: c, withHeaderRow: true }).run()
  pop.value = null
}
function runItem(item) {
  const e = ed()
  if (!e || typeof item?.run !== 'function') return
  try { item.run(e) } catch { /* item not applicable here */ }
}

defineExpose({
  openLink() {
    if (!vis('links')) return
    if (ribbon.value && tabs.value.some((t) => t.id === 'insert')) activeTab.value = 'insert'
    collapsed.value = false
    nextTick(() => toggleLink(true))
  },
})
onBeforeUnmount(() => { pop.value = null })
</script>

<template>
  <div v-if="ed()" ref="rootEl" class="rv-tb" :data-mode="mode" :data-compact="compact" :data-tick="tick" role="toolbar" aria-label="Formatting toolbar">
    <!-- ===== tab strip + quick access ===== -->
    <div class="rv-tb__strip">
      <div v-if="ids(G.history).length" class="rv-qat" role="group" aria-label="Quick access">
        <UTooltip v-for="id in ids(G.history)" :key="id" :text="A[id].label" :kbds="A[id].kbd">
          <button type="button" class="rv-btn" :disabled="isOff(id)" :aria-label="A[id].label" @mousedown.prevent @click="run(id)"><UIcon :name="A[id].icon" /></button>
        </UTooltip>
      </div>
      <div v-if="ribbon" class="rv-tabs" role="tablist" aria-label="Ribbon tabs" @keydown="onTabKey">
        <button
          v-for="t in tabs"
          :key="t.id"
          type="button"
          role="tab"
          class="rv-tab"
          :class="{ 'is-active': activeTab === t.id, 'is-contextual': t.contextual }"
          :aria-selected="activeTab === t.id"
          :tabindex="activeTab === t.id ? 0 : -1"
          @click="selectTab(t.id)"
          @dblclick="collapsed = !collapsed"
        >{{ t.label }}</button>
      </div>
      <span class="rv-tb__grow" />
      <UTooltip v-if="ribbon" :text="collapsed ? 'Expand the ribbon' : 'Collapse the ribbon'">
        <button type="button" class="rv-btn" :aria-label="collapsed ? 'Expand the ribbon' : 'Collapse the ribbon'" :aria-expanded="!collapsed" @click="collapsed = !collapsed"><UIcon :name="collapsed ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'" /></button>
      </UTooltip>
    </div>

    <!-- ===== panel ===== -->
    <div v-show="!ribbon || !collapsed" class="rv-tb__panel" role="tabpanel">
      <!-- HOME -->
      <template v-if="isShown('home')">
        <section v-if="vis('headings') || vis('lists') || vis('blockquote') || vis('codeBlock')" class="rv-rg" aria-label="Styles">
          <div class="rv-rg__body">
            <select class="rv-select rv-select--wide" aria-label="Paragraph style" :value="curBlock()" :disabled="!usable('headings') && !usable('lists')" @change="onBlock(val($event))">
              <option v-for="o in BLOCK_OPTS" :key="o[0]" :value="o[0]">{{ o[1] }}</option>
            </select>
          </div>
          <span class="rv-rg__label">Styles</span>
        </section>

        <section v-if="vis('fonts') || ids(G.marks).length || vis('colors')" class="rv-rg" aria-label="Font">
          <div class="rv-rg__body rv-rg__body--rows">
            <div v-if="vis('fonts')" class="rv-rg__row">
              <select class="rv-select rv-select--font" aria-label="Font family" :value="attrs('textStyle').fontFamily ?? ''" :disabled="!usable('fonts')" @change="onFont">
                <option value="">Font</option>
                <option v-for="f in fontList" :key="f.key" :value="f.key">{{ f.key }}</option>
              </select>
              <select class="rv-select rv-select--size" aria-label="Font size" :value="attrs('textStyle').fontSize ?? ''" :disabled="!usable('fonts')" @change="onSize">
                <option value="">Size</option>
                <option v-for="n in sizeList" :key="n" :value="`${n}px`">{{ n }}</option>
              </select>
            </div>
            <div class="rv-rg__row">
              <UTooltip v-for="id in ids(G.marks)" :key="id" :text="A[id].label" :kbds="A[id].kbd">
                <button type="button" class="rv-btn" :class="{ 'is-active': isOn(id) }" :disabled="isOff(id)" :aria-label="A[id].label" :aria-pressed="isOn(id)" @mousedown.prevent @click="run(id)"><UIcon :name="A[id].icon" /></button>
              </UTooltip>
              <span v-if="vis('colors')" class="rv-pop-wrap">
                <UTooltip text="Font color">
                  <button type="button" class="rv-btn rv-btn--split" :class="{ 'is-active': pop === 'color' }" :disabled="!usable('colors')" aria-label="Font color" aria-haspopup="true" :aria-expanded="pop === 'color'"  @mousedown.prevent @click="togglePop('color')"><UIcon name="i-lucide-baseline" /><i v-if="curColor()" class="rv-btn__bar" :style="{ background: curColor() }" /></button>
                </UTooltip>
                <div v-if="pop === 'color'" class="rv-pop" role="dialog" aria-label="Font color">
                  <div class="rv-pop__label">Font color</div>
                  <div class="rv-swatches">
                    <button type="button" class="rv-swatch rv-swatch--none" aria-label="Automatic" @mousedown.prevent @click="setColor(null)">A</button>
                    <button v-for="c in list(textColors)" :key="c.value" type="button" class="rv-swatch" :style="{ color: c.value }" :aria-label="`${c.name} text`" @mousedown.prevent @click="setColor(c.value)">A</button>
                  </div>
                </div>
              </span>
              <span v-if="vis('colors')" class="rv-pop-wrap">
                <UTooltip text="Highlight color">
                  <button type="button" class="rv-btn rv-btn--split" :class="{ 'is-active': pop === 'highlight' || act('highlight') }" :disabled="!usable('colors')" aria-label="Highlight color" aria-haspopup="true" :aria-expanded="pop === 'highlight'"  @mousedown.prevent @click="togglePop('highlight')"><UIcon name="i-lucide-highlighter" /><i v-if="curHighlight()" class="rv-btn__bar" :style="{ background: curHighlight() }" /></button>
                </UTooltip>
                <div v-if="pop === 'highlight'" class="rv-pop" role="dialog" aria-label="Highlight color">
                  <div class="rv-pop__label">Highlight</div>
                  <div class="rv-swatches">
                    <button type="button" class="rv-swatch rv-swatch--none" aria-label="No highlight" @mousedown.prevent @click="setHighlight(null)"><UIcon name="i-lucide-ban" /></button>
                    <button v-for="c in list(highlights)" :key="c.value" type="button" class="rv-swatch rv-swatch--bg" :style="{ background: c.value }" :aria-label="`${c.name} highlight`" @mousedown.prevent @click="setHighlight(c.value)" />
                  </div>
                </div>
              </span>
              <UTooltip v-if="vis('textFormatting')" text="Clear formatting">
                <button type="button" class="rv-btn" :disabled="isOff('clear')" aria-label="Clear formatting" @mousedown.prevent @click="run('clear')"><UIcon :name="A.clear.icon" /></button>
              </UTooltip>
            </div>
          </div>
          <span class="rv-rg__label">Font</span>
        </section>

        <section v-if="ids(G.lists).length || ids(G.align).length" class="rv-rg" aria-label="Paragraph">
          <div class="rv-rg__body rv-rg__body--rows">
            <div class="rv-rg__row">
              <UTooltip v-for="id in ids(G.lists)" :key="id" :text="A[id].label" :kbds="A[id].kbd">
                <button type="button" class="rv-btn" :class="{ 'is-active': isOn(id) }" :disabled="isOff(id)" :aria-label="A[id].label" :aria-pressed="isOn(id)" @mousedown.prevent @click="run(id)"><UIcon :name="A[id].icon" /></button>
              </UTooltip>
            </div>
            <div class="rv-rg__row">
              <UTooltip v-for="id in ids(G.align)" :key="id" :text="A[id].label" :kbds="A[id].kbd">
                <button type="button" class="rv-btn" :class="{ 'is-active': isOn(id) }" :disabled="isOff(id)" :aria-label="A[id].label" :aria-pressed="isOn(id)" @mousedown.prevent @click="run(id)"><UIcon :name="A[id].icon" /></button>
              </UTooltip>
            </div>
          </div>
          <span class="rv-rg__label">Paragraph</span>
        </section>
      </template>

      <!-- INSERT -->
      <template v-if="isShown('insert')">
        <section v-if="vis('tables')" class="rv-rg" aria-label="Tables">
          <div class="rv-rg__body">
            <span class="rv-pop-wrap">
              <UTooltip text="Insert a table">
                <button type="button" class="rv-big" :class="{ 'is-active': pop === 'table' }" :disabled="!usable('tables')" aria-haspopup="true" :aria-expanded="pop === 'table'" @mousedown.prevent @click="togglePop('table')"><UIcon name="i-lucide-table" /><span>Table</span></button>
              </UTooltip>
              <div v-if="pop === 'table'" class="rv-pop rv-pop--grid" role="dialog" aria-label="Insert table">
                <div class="rv-pop__label">{{ grid.r > 0 ? `${grid.r} × ${grid.c} table` : 'Insert table' }}</div>
                <div class="rv-grid" :style="{ gridTemplateColumns: `repeat(${GRID_COLS}, 20px)` }" @mouseleave="grid.r = grid.c = 0">
                  <template v-for="r in GRID_ROWS" :key="r">
                    <button v-for="c in GRID_COLS" :key="`${r}-${c}`" type="button" class="rv-grid__cell" :class="{ 'is-on': r <= grid.r && c <= grid.c }" :aria-label="`${r} rows by ${c} columns`" @mousedown.prevent @mouseenter="(grid.r = r), (grid.c = c)" @focus="(grid.r = r), (grid.c = c)" @click="insertTable(r, c)" />
                  </template>
                </div>
              </div>
            </span>
          </div>
          <span class="rv-rg__label">Tables</span>
        </section>

        <section v-if="mediaItems.length" class="rv-rg" aria-label="Media">
          <div class="rv-rg__body">
            <UTooltip v-for="item in mediaItems" :key="item.title" :text="item.hint || item.title">
              <button type="button" class="rv-big" :disabled="!editable" @mousedown.prevent @click="runItem(item)"><UIcon :name="item.icon" /><span>{{ item.title }}</span></button>
            </UTooltip>
          </div>
          <span class="rv-rg__label">Media</span>
        </section>

        <section v-if="vis('links')" class="rv-rg" aria-label="Links">
          <div class="rv-rg__body">
            <span class="rv-pop-wrap">
              <UTooltip text="Link" :kbds="['meta', 'K']">
                <button type="button" class="rv-big" :class="{ 'is-active': act('link') || pop === 'link' }" :disabled="!usable('links')" aria-haspopup="true" :aria-expanded="pop === 'link'" @mousedown.prevent @click="toggleLink()"><UIcon name="i-lucide-link" /><span>Link</span></button>
              </UTooltip>
              <div v-if="pop === 'link'" class="rv-pop rv-pop--link" role="dialog" aria-label="Link">
                <input ref="linkInput" v-model="linkUrl" class="rv-input" type="text" placeholder="Paste a link…" aria-label="Link URL" @keydown.enter.prevent="submitLink" @keydown.esc.prevent="pop = null">
                <p v-if="linkError" class="rv-pop__error" role="alert">{{ linkError }}</p>
                <div class="rv-pop__actions">
                  <button type="button" class="rv-pill rv-pill--primary" @click="submitLink">{{ $t('apply') }}</button>
                  <button type="button" class="rv-pill" :disabled="!act('link')" @click="removeLink">Remove</button>
                </div>
              </div>
            </span>
          </div>
          <span class="rv-rg__label">{{$t('links')}}</span>
        </section>

        <section v-if="blockItems.length" class="rv-rg" aria-label="Blocks">
          <div class="rv-rg__body">
            <UTooltip v-for="item in blockItems" :key="item.title" :text="item.hint || item.title">
              <button type="button" class="rv-big" :disabled="!editable" @mousedown.prevent @click="runItem(item)"><UIcon :name="item.icon" /><span>{{ item.title }}</span></button>
            </UTooltip>
          </div>
          <span class="rv-rg__label">Blocks</span>
        </section>
      </template>

      <!-- LAYOUT -->
      <template v-if="isShown('layout') && ribbon">
        <section v-if="ids(G.indent).length" class="rv-rg" aria-label="Indent">
          <div class="rv-rg__body">
            <UTooltip v-for="id in ids(G.indent)" :key="id" :text="A[id].label" :kbds="A[id].kbd">
              <button type="button" class="rv-big" :disabled="isOff(id)" @mousedown.prevent @click="run(id)"><UIcon :name="A[id].icon" /><span>{{ A[id].label }}</span></button>
            </UTooltip>
          </div>
          <span class="rv-rg__label">Indent</span>
        </section>
        <section v-if="vis('spacing')" class="rv-rg" aria-label="Spacing">
          <div class="rv-rg__body rv-rg__body--rows">
            <div class="rv-rg__row">
              <label class="rv-field"><span>Line height</span>
                <select class="rv-select" aria-label="Line height" :value="curLineHeight()" :disabled="!usable('spacing')" @change="onLineHeight">
                  <option value="">Default</option>
                  <option v-for="o in LINE_HEIGHTS" :key="o[0]" :value="o[0]">{{ o[1] }}</option>
                </select>
              </label>
            </div>
            <div class="rv-rg__row">
              <label class="rv-field"><span>Letter spacing</span>
                <select class="rv-select" aria-label="Letter spacing" :value="attrs('textStyle').letterSpacing ?? ''" :disabled="!usable('spacing')" @change="onSpacing">
                  <option value="">Default</option>
                  <option v-for="o in SPACINGS" :key="o[0]" :value="o[0]">{{ o[1] }}</option>
                </select>
              </label>
            </div>
          </div>
          <span class="rv-rg__label">Spacing</span>
        </section>
      </template>

      <!-- TABLE (contextual) -->
      <template v-if="isShown('table') && tableActive">
        <section class="rv-rg" aria-label="Rows and columns">
          <div class="rv-rg__body">
            <UTooltip v-for="id in ids(G.rows)" :key="id" :text="A[id].label">
              <button type="button" class="rv-big rv-big--sm" :disabled="isOff(id)" @mousedown.prevent @click="run(id)"><UIcon :name="A[id].icon" /><span>{{ A[id].label }}</span></button>
            </UTooltip>
          </div>
          <span class="rv-rg__label">Rows &amp; columns</span>
        </section>
        <section class="rv-rg" aria-label="Merge">
          <div class="rv-rg__body">
            <UTooltip v-for="id in ids(G.merge)" :key="id" :text="A[id].label">
              <button type="button" class="rv-big rv-big--sm" :disabled="isOff(id)" @mousedown.prevent @click="run(id)"><UIcon :name="A[id].icon" /><span>{{ A[id].label }}</span></button>
            </UTooltip>
          </div>
          <span class="rv-rg__label">Merge</span>
        </section>
        <section class="rv-rg" aria-label="Table">
          <div class="rv-rg__body">
            <UTooltip v-for="id in ids(G.table)" :key="id" :text="A[id].label">
              <button type="button" class="rv-big rv-big--sm" :class="{ 'is-active': isOn(id), 'is-danger': id === 'deleteTable' }" :disabled="isOff(id)" @mousedown.prevent @click="run(id)"><UIcon :name="A[id].icon" /><span>{{ A[id].label }}</span></button>
            </UTooltip>
          </div>
          <span class="rv-rg__label">Table</span>
        </section>
      </template>
    </div>
  </div>
</template>

<style lang="scss">
// Ribbon-only styles. Shared controls (.rv-btn, .rv-pill, .rv-input, .rv-pop, .rv-swatch…) live in RVisualEditor.vue.
.rv-tb {
  position: sticky;
  top: 0;
  z-index: 30;
  background: var(--bg-content);
  border-bottom: 1px solid var(--border-card);
  border-radius: 12px 12px 0 0;
}
.rv-tb__strip { display: flex; align-items: center; gap: 8px; padding: 4px 12px 0; }
.rv-tb__grow { flex: 1 1 auto; }
.rv-qat { display: flex; align-items: center; gap: 2px; padding-right: 8px; margin-right: 4px; border-right: 1px solid var(--border-card); }
.rv-tabs { display: flex; align-items: flex-end; gap: 2px; min-width: 0; overflow-x: auto; scrollbar-width: none; }
.rv-tab {
  position: relative;
  padding: 7px 14px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--c-muted);
  border-radius: 6px 6px 0 0;
  cursor: pointer;
  white-space: nowrap;
  transition: color 120ms cubic-bezier(0.2, 0.7, 0.2, 1), background 120ms cubic-bezier(0.2, 0.7, 0.2, 1);
  &:hover { color: var(--color-w-b-1); background: color-mix(in srgb, var(--color-w-b-1) 8%, transparent); }
  &.is-active { color: var(--color-primary); font-weight: 600; background: var(--bg-hover); }
  &.is-active::after { content: ''; position: absolute; left: 10px; right: 10px; bottom: 0; height: 2px; background: var(--color-primary); border-radius: 2px 2px 0 0; }
  &.is-contextual { color: var(--c-accent); }
  &:focus-visible { outline: 2px solid var(--color-primary); outline-offset: -2px; }
}
.rv-tb__panel {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 0;
  min-height: 84px;
  padding: 6px 8px 4px;
  background: var(--bg-hover);
  border-top: 1px solid var(--border-card);
}
.rv-rg {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0 8px;
  border-right: 1px solid var(--border-card);
  &:last-child { border-right: 0; }
}
.rv-rg__body { display: flex; align-items: center; flex-wrap: wrap; gap: 2px; flex: 1 1 auto; }
.rv-rg__body--rows { flex-direction: column; align-items: flex-start; justify-content: center; gap: 4px; flex-wrap: nowrap; }
.rv-rg__row { display: flex; align-items: center; gap: 2px; flex-wrap: wrap; }
.rv-rg__label { padding-top: 2px; font-size: 0.6875rem; color: color-mix(in srgb, var(--c-muted) 65%, transparent); text-align: center; letter-spacing: 0.02em; }
.rv-pop-wrap { position: relative; display: inline-flex; }

.rv-big {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 56px;
  height: 60px;
  padding: 4px 8px;
  font-size: 0.75rem;
  color: var(--color-w-b-1);
  border-radius: 6px;
  cursor: pointer;
  transition: background 120ms cubic-bezier(0.2, 0.7, 0.2, 1), color 120ms cubic-bezier(0.2, 0.7, 0.2, 1);
  .iconify { font-size: 1.4rem; color: var(--color-primary); }
  &:hover:not(:disabled) { background: color-mix(in srgb, var(--color-w-b-1) 8%, transparent); }
  &.is-active { background: color-mix(in srgb, var(--color-primary) 11%, transparent); }
  &.is-danger .iconify { color: var(--r-c-danger); }
  &:disabled { opacity: 0.38; cursor: not-allowed; }
  &:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 1px; }
}
.rv-big--sm { min-width: 52px; height: 56px; .iconify { font-size: 1.2rem; } }

.rv-select {
  height: 28px;
  max-width: 10rem;
  padding: 0 8px;
  font: inherit;
  font-size: 0.8125rem;
  color: var(--color-w-b-1);
  background: var(--bg-content);
  border: 1px solid var(--border-card);
  border-radius: 6px;
  cursor: pointer;
  &:hover:not(:disabled) { border-color: var(--color-w-b-4); }
  &:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 1px; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
  option { color: initial; }
}
.rv-select--wide { width: 9.5rem; }
.rv-select--font { width: 8.5rem; }
.rv-select--size { width: 4.6rem; }
.rv-field { display: inline-flex; align-items: center; gap: 8px; font-size: 0.8125rem; color: var(--c-muted); span { min-width: 6.5rem; } }

.rv-pop--grid { padding: 12px; }
.rv-grid { display: grid; gap: 3px; }
.rv-grid__cell {
  width: 20px;
  height: 20px;
  background: var(--bg-content);
  border: 1px solid var(--color-w-b-4);
  border-radius: 3px;
  cursor: pointer;
  &.is-on { background: color-mix(in srgb, var(--color-primary) 11%, transparent); border-color: var(--color-primary); }
}

// compact = single UEditor-style row: no tabs, no labels, small icon-only buttons
.rv-tb[data-mode='compact'] {
  .rv-tb__panel { min-height: 0; padding: 4px 12px; align-items: center; gap: 2px 4px; background: var(--bg-content); border-top: 0; }
  .rv-rg { flex-direction: row; padding: 0 4px; }
  .rv-rg__label { display: none; }
  .rv-rg__body--rows { flex-direction: row; align-items: center; flex-wrap: wrap; }
  .rv-rg__row { display: contents; }
  .rv-big { flex-direction: row; min-width: 0; height: 30px; padding: 0 6px; span { display: none; } .iconify { font-size: 1rem; color: var(--c-muted); } }
}
.rv-tb[data-compact='true'] .rv-tb__panel { padding-left: 4px; padding-right: 4px; }
.rv-tb[data-compact='true'] .rv-rg { padding: 0 4px; }
</style>