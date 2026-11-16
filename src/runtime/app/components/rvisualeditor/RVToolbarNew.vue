<script setup>
// Word-style ribbon (tabs + labelled groups) or UEditor-style compact row. Presentational: all editing goes
// through the Tiptap editor passed in; every external value is treated as possibly null/invalid.
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'

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
  t: { type: Function, default: (key, fallback) => fallback ?? key }, // (key, fallback) => string
})

// ---- i18n helpers (delegate to the parent's safe `t`; fall back to the English label) -----------------
const tKey = (label) => `rve_${String(label).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')}`
const tl = (label) => props.t(tKey(label), label)
const tr = (key, fallback) => props.t(key, fallback)

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
  const acc = [{ id: 'home', label: 'Home', labelKey: 'rve_home' }]
  if (hasInsert()) acc.push({ id: 'insert', label: 'Insert', labelKey: 'rve_insert' })
  if (vis('spacing') || vis('indent')) acc.push({ id: 'layout', label: 'Layout', labelKey: 'rve_layout' })
  if (tableActive.value) acc.push({ id: 'table', label: 'Table', labelKey: 'rve_table', contextual: true })
  return acc
})
watch(tabs, (t) => { if (!t.some((x) => x.id === activeTab.value)) activeTab.value = 'home' })
const isShown = (id) => (ribbon.value ? activeTab.value === id : id === 'home' || (id === 'insert' && hasInsert()) || (id === 'table' && tableActive.value))
function selectTab(id) { activeTab.value = id; collapsed.value = false; closePops() }
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
  ['p', 'Normal', 'rve_normal'],
  ...(vis('headings') ? [1, 2, 3, 4, 5, 6].map((n) => [String(n), `Heading ${n}`, `rve_heading_${n}`]) : []),
  ...(vis('lists') ? [['bullet', 'Bulleted list', 'rve_bulleted_list'], ['ordered', 'Numbered list', 'rve_numbered_list'], ['task', 'To-do list', 'rve_todo_list']] : []),
  ...(vis('blockquote') ? [['quote', 'Quote', 'rve_quote']] : []),
  ...(vis('codeBlock') ? [['code', 'Code block', 'rve_code_block']] : []),
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
const LINE_HEIGHTS = [['1', 'Single'], ['1.15', '1.15'], ['1.5', '1.5'], ['2', 'Double'], ['2.5', '2.5']]
const SPACINGS = [['-0.02em', 'Tight'], ['0em', 'Normal'], ['0.04em', 'Wide'], ['0.1em', 'Wider']]
const curLineHeight = () => attrs(act('heading') ? 'heading' : 'paragraph').lineHeight ?? ''

// RSelect option lists (items expose Name/NameEnglish for the label and `value` as the pk)
const option = (value, name) => ({ Name: name, NameEnglish: name, value })
const styleOptions = computed(() => BLOCK_OPTS.value.map(([value, label, labelKey]) => option(value, tr(labelKey, label))))
const fontOptions = computed(() => fontList.value.map((f) => ({
  Name: f.key,
  NameEnglish: f.key,
  value: f.key,
  groupLabel: typeof f.group === 'string' && f.group ? tr(`rve_font_group_${f.group.toLowerCase()}`, f.group) : '',
})))
const sizeOptions = computed(() => sizeList.value.map((n) => option(`${n}px`, String(n))))
const lineHeightOptions = computed(() => LINE_HEIGHTS.map(([value, label]) => option(value, tl(label))))
const spacingOptions = computed(() => SPACINGS.map(([value, label]) => option(value, tl(label))))

const localOf = (opts) => computed(() => ({ data: opts.value, keySearch: ['Name', 'NameEnglish'] }))
const styleLocal = localOf(styleOptions)
const fontLocal = localOf(fontOptions)
const sizeLocal = localOf(sizeOptions)
const lineHeightLocal = localOf(lineHeightOptions)
const spacingLocal = localOf(spacingOptions)
const FONT_TEMPLATE = { labelKey: 'Name', labelKeyEn: 'NameEnglish', subLabelKey: 'groupLabel', subLabelKeyEn: 'groupLabel' }

const styleSel = ref(undefined)
const fontSel = ref(undefined)
const sizeSel = ref(undefined)
const lineHeightSel = ref(undefined)
const spacingSel = ref(undefined)

const pickOption = (opts, value) => (value ? opts.find((o) => o.value === value) : undefined)
function syncSelects() {
  styleSel.value = pickOption(styleOptions.value, curBlock()) ?? styleSel.value
  const fam = attrs('textStyle').fontFamily ?? ''
  fontSel.value = fam ? pickOption(fontOptions.value, fam) ?? fontSel.value : undefined
  const fs = attrs('textStyle').fontSize ?? ''
  sizeSel.value = fs ? pickOption(sizeOptions.value, fs) ?? sizeSel.value : undefined
  const lh = curLineHeight()
  lineHeightSel.value = lh ? pickOption(lineHeightOptions.value, lh) ?? lineHeightSel.value : undefined
  const ls = attrs('textStyle').letterSpacing ?? ''
  spacingSel.value = ls ? pickOption(spacingOptions.value, ls) ?? spacingSel.value : undefined
}
watch(() => props.tick, syncSelects, { immediate: true })

const selValue = (sel) => (sel && !sel.isDefault ? sel.value ?? '' : '')
function onStyleSelect(sel) { onBlock(selValue(sel) || 'p') }
function onFontSelect(sel) { const v = selValue(sel); v ? chain().setFontFamily(v).run() : chain().unsetFontFamily().run() }
function onSizeSelect(sel) { const v = selValue(sel); v ? chain().setFontSize(v).run() : chain().unsetFontSize().run() }
function onLineHeightSelect(sel) { const v = selValue(sel); v ? chain().setLineHeight(v).run() : chain().unsetLineHeight().run() }
function onSpacingSelect(sel) { const v = selValue(sel); v ? chain().setLetterSpacing(v).run() : chain().unsetLetterSpacing().run() }

// ---- popovers: colors, link, table grid (rendered through RPopover) ---------------------------------------------
const popOpen = reactive({ color: false, highlight: false, link: false, table: false })
const closePops = () => { popOpen.color = false; popOpen.highlight = false; popOpen.link = false; popOpen.table = false }
const curColor = () => safeColor(attrs('textStyle').color)
const curHighlight = () => safeColor(attrs('highlight').color)
const setColor = (v) => { (safeColor(v) ? chain().setColor(v) : chain().unsetColor()).run(); popOpen.color = false }
const setHighlight = (v) => { (safeColor(v) ? chain().setHighlight({ color: v }) : chain().unsetHighlight()).run(); popOpen.highlight = false }

const linkUrl = ref('')
const linkError = ref('')
const linkInput = ref(null)
watch(() => popOpen.link, (open) => {
  if (!open) return
  linkUrl.value = String(attrs('link').href ?? '')
  linkError.value = ''
  nextTick(() => linkInput.value?.focus())
})
function submitLink() {
  const ok = typeof props.applyLink === 'function' ? props.applyLink(linkUrl.value) : false
  if (!ok) { linkError.value = tr('rve_enter_valid_link', 'Enter a valid http(s), mailto or tel link.'); return }
  popOpen.link = false
}
function removeLink() { chain().extendMarkRange('link').unsetLink().run(); popOpen.link = false }

const GRID_ROWS = 6
const GRID_COLS = 8
const grid = reactive({ r: 0, c: 0 })
function insertTable(r, c) {
  if (!usable('tables') || !(r > 0) || !(c > 0)) return
  chain().insertTable({ rows: r, cols: c, withHeaderRow: true }).run()
  popOpen.table = false
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
    nextTick(() => { popOpen.link = true })
  },
})
onBeforeUnmount(() => { closePops() })
</script>

<template>
  <div v-if="ed()" class="rv-tb" :data-mode="mode" :data-compact="compact" :data-tick="tick" role="toolbar" :aria-label="tr('rve_formatting_toolbar', 'Formatting toolbar')">
    <!-- ===== tab strip + quick access ===== -->
    <div class="rv-tb__strip">
      <div v-if="ids(G.history).length" class="rv-qat" role="group" :aria-label="tr('rve_quick_access', 'Quick access')">
        <UTooltip v-for="id in ids(G.history)" :key="id" :text="tl(A[id].label)" :kbds="A[id].kbd">
          <button type="button" class="rv-btn" :disabled="isOff(id)" :aria-label="tl(A[id].label)" @mousedown.prevent @click="run(id)"><UIcon :name="A[id].icon" /></button>
        </UTooltip>
      </div>
      <div v-if="ribbon" class="rv-tabs" role="tablist" :aria-label="tr('rve_ribbon_tabs', 'Ribbon tabs')" @keydown="onTabKey">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          role="tab"
          class="rv-tab"
          :class="{ 'is-active': activeTab === tab.id, 'is-contextual': tab.contextual }"
          :aria-selected="activeTab === tab.id"
          :tabindex="activeTab === tab.id ? 0 : -1"
          @click="selectTab(tab.id)"
          @dblclick="collapsed = !collapsed"
        >{{ tr(tab.labelKey, tab.label) }}</button>
      </div>
      <span class="rv-tb__grow" />
      <UTooltip v-if="ribbon" :text="collapsed ? tr('rve_expand_ribbon', 'Expand the ribbon') : tr('rve_collapse_ribbon', 'Collapse the ribbon')">
        <button type="button" class="rv-btn" :aria-label="collapsed ? tr('rve_expand_ribbon', 'Expand the ribbon') : tr('rve_collapse_ribbon', 'Collapse the ribbon')" :aria-expanded="!collapsed" @click="collapsed = !collapsed"><UIcon :name="collapsed ? 'i-lucide-chevron-down' : 'i-lucide-chevron-up'" /></button>
      </UTooltip>
    </div>

    <!-- ===== panel ===== -->
    <div v-show="!ribbon || !collapsed" class="rv-tb__panel" role="tabpanel">
      <!-- HOME -->
      <template v-if="isShown('home')">
        <section v-if="vis('headings') || vis('lists') || vis('blockquote') || vis('codeBlock')" class="rv-rg" :aria-label="tr('rve_styles', 'Styles')">
          <div class="rv-rg__body">
            <div class="rv-sel rv-sel--style">
              <RSelect v-model="styleSel" :localData="styleLocal" pk="value" :placeholder="tr('rve_paragraph_style', 'Paragraph style')" :disabled="!usable('headings') && !usable('lists')" @update:modelValue="onStyleSelect" />
            </div>
          </div>
          <span class="rv-rg__label">{{ tr('rve_styles', 'Styles') }}</span>
        </section>

        <section v-if="vis('fonts') || ids(G.marks).length || vis('colors')" class="rv-rg" :aria-label="tr('rve_font', 'Font')">
          <div class="rv-rg__body rv-rg__body--rows">
            <div v-if="vis('fonts')" class="rv-rg__row">
              <div class="rv-sel rv-sel--font">
                <RSelect v-model="fontSel" :localData="fontLocal" pk="value" :placeholder="tr('rve_font', 'Font')" :templateOption="FONT_TEMPLATE" :disabled="!usable('fonts')" @update:modelValue="onFontSelect" />
              </div>
              <div class="rv-sel rv-sel--size">
                <RSelect v-model="sizeSel" :localData="sizeLocal" pk="value" :placeholder="tr('rve_size', 'Size')" :disabled="!usable('fonts')" @update:modelValue="onSizeSelect" />
              </div>
            </div>
            <div class="rv-rg__row">
              <UTooltip v-for="id in ids(G.marks)" :key="id" :text="tl(A[id].label)" :kbds="A[id].kbd">
                <button type="button" class="rv-btn" :class="{ 'is-active': isOn(id) }" :disabled="isOff(id)" :aria-label="tl(A[id].label)" :aria-pressed="isOn(id)" @mousedown.prevent @click="run(id)"><UIcon :name="A[id].icon" /></button>
              </UTooltip>
              <span v-if="vis('colors')" class="rv-pop-wrap">
                <UTooltip :text="tr('rve_font_color', 'Font color')">
                  <RPopover v-model="popOpen.color" use="nuxtui" :content="{ side: 'bottom-start' }">
                    <template #trigger>
                      <button type="button" class="rv-btn rv-btn--split" :class="{ 'is-active': popOpen.color }" :disabled="!usable('colors')" :aria-label="tr('rve_font_color', 'Font color')" aria-haspopup="true" :aria-expanded="popOpen.color" @mousedown.prevent><UIcon name="i-lucide-baseline" /><i v-if="curColor()" class="rv-btn__bar" :style="{ background: curColor() }" /></button>
                    </template>
                    <div class="rv-pop-in" role="dialog" :aria-label="tr('rve_font_color', 'Font color')">
                      <div class="rv-pop__label">{{ tr('rve_font_color', 'Font color') }}</div>
                      <div class="rv-swatches">
                        <button type="button" class="rv-swatch rv-swatch--none" :aria-label="tr('rve_automatic', 'Automatic')" @mousedown.prevent @click="setColor(null)">A</button>
                        <button v-for="c in list(textColors)" :key="c.value" type="button" class="rv-swatch" :style="{ color: c.value }" :aria-label="`${tl(c.name)} ${tr('rve_text_color', 'Text color')}`" @mousedown.prevent @click="setColor(c.value)">A</button>
                      </div>
                    </div>
                  </RPopover>
                </UTooltip>
              </span>
              <span v-if="vis('colors')" class="rv-pop-wrap">
                <UTooltip :text="tr('rve_highlight_color', 'Highlight color')">
                  <RPopover v-model="popOpen.highlight" use="nuxtui" :content="{ side: 'bottom-start' }">
                    <template #trigger>
                      <button type="button" class="rv-btn rv-btn--split" :class="{ 'is-active': popOpen.highlight || act('highlight') }" :disabled="!usable('colors')" :aria-label="tr('rve_highlight_color', 'Highlight color')" aria-haspopup="true" :aria-expanded="popOpen.highlight" @mousedown.prevent><UIcon name="i-lucide-highlighter" /><i v-if="curHighlight()" class="rv-btn__bar" :style="{ background: curHighlight() }" /></button>
                    </template>
                    <div class="rv-pop-in" role="dialog" :aria-label="tr('rve_highlight_color', 'Highlight color')">
                      <div class="rv-pop__label">{{ tr('rve_highlight', 'Highlight') }}</div>
                      <div class="rv-swatches">
                        <button type="button" class="rv-swatch rv-swatch--none" :aria-label="tr('rve_no_highlight', 'No highlight')" @mousedown.prevent @click="setHighlight(null)"><UIcon name="i-lucide-ban" /></button>
                        <button v-for="c in list(highlights)" :key="c.value" type="button" class="rv-swatch rv-swatch--bg" :style="{ background: c.value }" :aria-label="`${tl(c.name)} ${tr('rve_highlight', 'Highlight')}`" @mousedown.prevent @click="setHighlight(c.value)" />
                      </div>
                    </div>
                  </RPopover>
                </UTooltip>
              </span>
              <UTooltip v-if="vis('textFormatting')" :text="tr('rve_clear_formatting', 'Clear formatting')">
                <button type="button" class="rv-btn" :disabled="isOff('clear')" :aria-label="tr('rve_clear_formatting', 'Clear formatting')" @mousedown.prevent @click="run('clear')"><UIcon :name="A.clear.icon" /></button>
              </UTooltip>
            </div>
          </div>
          <span class="rv-rg__label">{{ tr('rve_font', 'Font') }}</span>
        </section>

        <section v-if="ids(G.lists).length || ids(G.align).length" class="rv-rg" :aria-label="tr('rve_paragraph', 'Paragraph')">
          <div class="rv-rg__body rv-rg__body--rows">
            <div class="rv-rg__row">
              <UTooltip v-for="id in ids(G.lists)" :key="id" :text="tl(A[id].label)" :kbds="A[id].kbd">
                <button type="button" class="rv-btn" :class="{ 'is-active': isOn(id) }" :disabled="isOff(id)" :aria-label="tl(A[id].label)" :aria-pressed="isOn(id)" @mousedown.prevent @click="run(id)"><UIcon :name="A[id].icon" /></button>
              </UTooltip>
            </div>
            <div class="rv-rg__row">
              <UTooltip v-for="id in ids(G.align)" :key="id" :text="tl(A[id].label)" :kbds="A[id].kbd">
                <button type="button" class="rv-btn" :class="{ 'is-active': isOn(id) }" :disabled="isOff(id)" :aria-label="tl(A[id].label)" :aria-pressed="isOn(id)" @mousedown.prevent @click="run(id)"><UIcon :name="A[id].icon" /></button>
              </UTooltip>
            </div>
          </div>
          <span class="rv-rg__label">{{ tr('rve_paragraph', 'Paragraph') }}</span>
        </section>
      </template>

      <!-- INSERT -->
      <template v-if="isShown('insert')">
        <section v-if="vis('tables')" class="rv-rg" :aria-label="tr('rve_tables', 'Tables')">
          <div class="rv-rg__body">
            <span class="rv-pop-wrap">
              <UTooltip :text="tr('rve_insert_table', 'Insert a table')">
                <RPopover v-model="popOpen.table" use="nuxtui" :content="{ side: 'bottom-start' }">
                  <template #trigger>
                    <button type="button" class="rv-big" :class="{ 'is-active': popOpen.table }" :disabled="!usable('tables')" aria-haspopup="true" :aria-expanded="popOpen.table" @mousedown.prevent><UIcon name="i-lucide-table" /><span>{{ tr('rve_table', 'Table') }}</span></button>
                  </template>
                  <div class="rv-pop-in rv-pop-in--grid" role="dialog" :aria-label="tr('rve_insert_table', 'Insert a table')">
                    <div class="rv-pop__label">{{ grid.r > 0 ? `${grid.r} × ${grid.c} ${tr('rve_table', 'Table')}` : tr('rve_insert_table', 'Insert a table') }}</div>
                    <div class="rv-grid" :style="{ gridTemplateColumns: `repeat(${GRID_COLS}, 20px)` }" @mouseleave="grid.r = grid.c = 0">
                      <template v-for="r in GRID_ROWS" :key="r">
                        <button v-for="c in GRID_COLS" :key="`${r}-${c}`" type="button" class="rv-grid__cell" :class="{ 'is-on': r <= grid.r && c <= grid.c }" :aria-label="`${r} ${tr('rve_rows_by', 'rows by')} ${c} ${tr('rve_columns', 'columns')}`" @mousedown.prevent @mouseenter="(grid.r = r), (grid.c = c)" @focus="(grid.r = r), (grid.c = c)" @click="insertTable(r, c)" />
                      </template>
                    </div>
                  </div>
                </RPopover>
              </UTooltip>
            </span>
          </div>
          <span class="rv-rg__label">{{ tr('rve_tables', 'Tables') }}</span>
        </section>

        <section v-if="mediaItems.length" class="rv-rg" :aria-label="tr('rve_media', 'Media')">
          <div class="rv-rg__body">
            <UTooltip v-for="item in mediaItems" :key="item.id || item.title" :text="tr(item.hintKey, item.hint) || tr(item.titleKey, item.title)">
              <button type="button" class="rv-big" :disabled="!editable" @mousedown.prevent @click="runItem(item)"><UIcon :name="item.icon" /><span>{{ tr(item.titleKey, item.title) }}</span></button>
            </UTooltip>
          </div>
          <span class="rv-rg__label">{{ tr('rve_media', 'Media') }}</span>
        </section>

        <section v-if="vis('links')" class="rv-rg" :aria-label="tr('rve_links', 'Links')">
          <div class="rv-rg__body">
            <span class="rv-pop-wrap">
              <UTooltip :text="tr('rve_link', 'Link')" :kbds="['meta', 'K']">
                <RPopover v-model="popOpen.link" use="nuxtui" :content="{ side: 'bottom-start' }">
                  <template #trigger>
                    <button type="button" class="rv-big" :class="{ 'is-active': act('link') || popOpen.link }" :disabled="!usable('links')" aria-haspopup="true" :aria-expanded="popOpen.link" @mousedown.prevent><UIcon name="i-lucide-link" /><span>{{ tr('rve_link', 'Link') }}</span></button>
                  </template>
                  <div class="rv-pop-in rv-pop-in--link" role="dialog" :aria-label="tr('rve_link', 'Link')">
                    <input ref="linkInput" v-model="linkUrl" class="rv-input" type="text" :placeholder="tr('rve_paste_link', 'Paste a link…')" :aria-label="tr('rve_link_url', 'Link URL')" @keydown.enter.prevent="submitLink" @keydown.esc.prevent="popOpen.link = false">
                    <p v-if="linkError" class="rv-pop__error" role="alert">{{ linkError }}</p>
                    <div class="rv-pop__actions">
                      <button type="button" class="rv-pill rv-pill--primary" @click="submitLink">{{ tr('rve_apply', 'Apply') }}</button>
                      <button type="button" class="rv-pill" :disabled="!act('link')" @click="removeLink">{{ tr('rve_remove', 'Remove') }}</button>
                    </div>
                  </div>
                </RPopover>
              </UTooltip>
            </span>
          </div>
          <span class="rv-rg__label">{{ tr('rve_links', 'Links') }}</span>
        </section>

        <section v-if="blockItems.length" class="rv-rg" :aria-label="tr('rve_blocks', 'Blocks')">
          <div class="rv-rg__body">
            <UTooltip v-for="item in blockItems" :key="item.id || item.title" :text="tr(item.hintKey, item.hint) || tr(item.titleKey, item.title)">
              <button type="button" class="rv-big" :disabled="!editable" @mousedown.prevent @click="runItem(item)"><UIcon :name="item.icon" /><span>{{ tr(item.titleKey, item.title) }}</span></button>
            </UTooltip>
          </div>
          <span class="rv-rg__label">{{ tr('rve_blocks', 'Blocks') }}</span>
        </section>
      </template>

      <!-- LAYOUT -->
      <template v-if="isShown('layout') && ribbon">
        <section v-if="ids(G.indent).length" class="rv-rg" :aria-label="tr('rve_indent', 'Indent')">
          <div class="rv-rg__body">
            <UTooltip v-for="id in ids(G.indent)" :key="id" :text="tl(A[id].label)" :kbds="A[id].kbd">
              <button type="button" class="rv-big" :disabled="isOff(id)" @mousedown.prevent @click="run(id)"><UIcon :name="A[id].icon" /><span>{{ tl(A[id].label) }}</span></button>
            </UTooltip>
          </div>
          <span class="rv-rg__label">{{ tr('rve_indent', 'Indent') }}</span>
        </section>
        <section v-if="vis('spacing')" class="rv-rg" :aria-label="tr('rve_spacing', 'Spacing')">
          <div class="rv-rg__body rv-rg__body--rows">
            <div class="rv-rg__row">
              <div class="rv-field"><span>{{ tr('rve_line_height', 'Line height') }}</span>
                <div class="rv-sel rv-sel--lh">
                  <RSelect v-model="lineHeightSel" :localData="lineHeightLocal" pk="value" :placeholder="tr('rve_default', 'Default')" :disabled="!usable('spacing')" @update:modelValue="onLineHeightSelect" />
                </div>
              </div>
            </div>
            <div class="rv-rg__row">
              <div class="rv-field"><span>{{ tr('rve_letter_spacing', 'Letter spacing') }}</span>
                <div class="rv-sel rv-sel--ls">
                  <RSelect v-model="spacingSel" :localData="spacingLocal" pk="value" :placeholder="tr('rve_default', 'Default')" :disabled="!usable('spacing')" @update:modelValue="onSpacingSelect" />
                </div>
              </div>
            </div>
          </div>
          <span class="rv-rg__label">{{ tr('rve_spacing', 'Spacing') }}</span>
        </section>
      </template>

      <!-- TABLE (contextual) -->
      <template v-if="isShown('table') && tableActive">
        <section class="rv-rg" :aria-label="tr('rve_rows_and_columns', 'Rows and columns')">
          <div class="rv-rg__body">
            <UTooltip v-for="id in ids(G.rows)" :key="id" :text="tl(A[id].label)">
              <button type="button" class="rv-big rv-big--sm" :disabled="isOff(id)" @mousedown.prevent @click="run(id)"><UIcon :name="A[id].icon" /><span>{{ tl(A[id].label) }}</span></button>
            </UTooltip>
          </div>
          <span class="rv-rg__label">{{ tr('rve_rows_and_columns', 'Rows & columns') }}</span>
        </section>
        <section class="rv-rg" :aria-label="tr('rve_merge', 'Merge')">
          <div class="rv-rg__body">
            <UTooltip v-for="id in ids(G.merge)" :key="id" :text="tl(A[id].label)">
              <button type="button" class="rv-big rv-big--sm" :disabled="isOff(id)" @mousedown.prevent @click="run(id)"><UIcon :name="A[id].icon" /><span>{{ tl(A[id].label) }}</span></button>
            </UTooltip>
          </div>
          <span class="rv-rg__label">{{ tr('rve_merge', 'Merge') }}</span>
        </section>
        <section class="rv-rg" :aria-label="tr('rve_table', 'Table')">
          <div class="rv-rg__body">
            <UTooltip v-for="id in ids(G.table)" :key="id" :text="tl(A[id].label)">
              <button type="button" class="rv-big rv-big--sm" :class="{ 'is-active': isOn(id), 'is-danger': id === 'deleteTable' }" :disabled="isOff(id)" @mousedown.prevent @click="run(id)"><UIcon :name="A[id].icon" /><span>{{ tl(A[id].label) }}</span></button>
            </UTooltip>
          </div>
          <span class="rv-rg__label">{{ tr('rve_table', 'Table') }}</span>
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
  border-radius: 14px 14px 0 0;
}
.rv-tb__strip { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-bottom: 1px solid var(--border-card); }
.rv-tb__grow { flex: 1 1 auto; }
.rv-qat { display: flex; align-items: center; gap: 2px; padding: 3px; background: color-mix(in srgb, var(--color-w-b-1) 5%, transparent); border-radius: 10px; }
.rv-tabs { display: flex; align-items: center; gap: 2px; min-width: 0; padding: 3px; background: color-mix(in srgb, var(--color-w-b-1) 5%, transparent); border-radius: 10px; overflow-x: auto; scrollbar-width: none; }
.rv-tab {
  position: relative;
  padding: 6px 14px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--c-muted);
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  transition: color 140ms cubic-bezier(0.2, 0.7, 0.2, 1), background 140ms cubic-bezier(0.2, 0.7, 0.2, 1), box-shadow 140ms cubic-bezier(0.2, 0.7, 0.2, 1);
  &:hover { color: var(--color-w-b-1); background: color-mix(in srgb, var(--color-w-b-1) 7%, transparent); }
  &.is-active { color: var(--color-primary); font-weight: 600; background: var(--bg-content); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08), 0 0 0 1px color-mix(in srgb, var(--color-primary) 18%, transparent); }
  &.is-contextual { color: var(--c-accent); }
  &:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 1px; }
}
.rv-tb__panel {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  gap: 8px;
  min-height: 84px;
  padding: 10px 12px;
  background: var(--bg-hover);
}
.rv-rg {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px;
  background: var(--bg-content);
  border: 1px solid var(--border-card);
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}
.rv-rg__body { display: flex; align-items: center; flex-wrap: wrap; gap: 2px; flex: 1 1 auto; }
.rv-rg__body--rows { flex-direction: column; align-items: flex-start; justify-content: center; gap: 4px; flex-wrap: nowrap; }
.rv-rg__row { display: flex; align-items: center; gap: 2px; flex-wrap: wrap; }
.rv-rg__label { order: -1; font-size: 0.625rem; font-weight: 600; color: color-mix(in srgb, var(--c-muted) 80%, transparent); text-align: left; text-transform: uppercase; letter-spacing: 0.06em; }
.rv-pop-wrap { position: relative; display: inline-flex; }
.rv-pop-in { display: grid; gap: 8px; }
.rv-pop-in--link { min-width: 18rem; }
.rv-pop-in--grid { min-width: 0; }

// RSelect integration: keep the searchable selects compact inside the ribbon
.rv-sel { display: inline-flex; }
.rv-sel--style { width: 9.5rem; }
.rv-sel--font { width: 9rem; }
.rv-sel--size { width: 5rem; }
.rv-sel--lh, .rv-sel--ls { width: 8rem; }
.rv-tb .r-custom-select { width: 100%; }
.rv-tb .r-custom-select button { height: 30px !important; border-radius: 8px !important; padding-top: 0 !important; padding-bottom: 0 !important; }
.rv-tb .r-wrapper-popover { display: inline-flex; }

.rv-big {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 56px;
  height: 58px;
  padding: 4px 8px;
  font-size: 0.75rem;
  color: var(--color-w-b-1);
  border-radius: 10px;
  cursor: pointer;
  transition: background 140ms cubic-bezier(0.2, 0.7, 0.2, 1), color 140ms cubic-bezier(0.2, 0.7, 0.2, 1);
  .iconify { font-size: 1.35rem; color: var(--color-primary); }
  &:hover:not(:disabled) { background: color-mix(in srgb, var(--color-w-b-1) 7%, transparent); }
  &.is-active { background: color-mix(in srgb, var(--color-primary) 12%, transparent); }
  &.is-danger .iconify { color: var(--r-c-danger); }
  &:disabled { opacity: 0.38; cursor: not-allowed; }
  &:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 1px; }
}
.rv-big--sm { min-width: 52px; height: 54px; .iconify { font-size: 1.15rem; } }

.rv-field { display: inline-flex; align-items: center; gap: 8px; font-size: 0.8125rem; color: var(--c-muted); span { min-width: 6.5rem; } }

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
  border-radius: 10px;
  .rv-tb__strip { padding: 4px 8px; border-bottom: 0; }
  .rv-tb__panel { min-height: 0; padding: 4px 8px; align-items: center; gap: 2px 4px; background: var(--bg-content); }
  .rv-rg { flex-direction: row; gap: 2px; padding: 2px 4px; background: transparent; border: 0; box-shadow: none; }
  .rv-rg__label { display: none; }
  .rv-rg__body--rows { flex-direction: row; align-items: center; flex-wrap: wrap; }
  .rv-rg__row { display: contents; }
  .rv-big { flex-direction: row; min-width: 0; height: 30px; padding: 0 6px; border-radius: 8px; span { display: none; } .iconify { font-size: 1rem; color: var(--c-muted); } }
}
.rv-tb[data-compact='true'] .rv-tb__panel { padding-left: 4px; padding-right: 4px; }
.rv-tb[data-compact='true'] .rv-rg { padding: 0 4px; }
</style>
