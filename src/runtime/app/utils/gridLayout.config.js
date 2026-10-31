/**
 * RGridLayout defaults & helpers.
 *
 * Kept in a plain module (not in <script setup>) because `defineProps()` is hoisted out of
 * `setup()` and may only reference imports, never locally declared variables.
 */

// ── Default layout ("testLayout") ────────────────────────────────────────────
export const DEFAULT_ITEM_SIZE = Object.freeze({ w: 4, h: 4 })
export const TEST_LAYOUT_COUNT = 5

/** 5 items, all the same size (4 × 4), flowing left-to-right over a 12-column grid. */
export function createTestLayout(count = TEST_LAYOUT_COUNT, colNum = 12) {
  const { w, h } = DEFAULT_ITEM_SIZE
  const perRow = Math.max(1, Math.floor(colNum / w))
  return Array.from({ length: count }, (_, index) => ({
    i: String(index),
    x: (index % perRow) * w,
    y: Math.floor(index / perRow) * h,
    w,
    h,
  }))
}

// ── Option model ─────────────────────────────────────────────────────────────
export const DEFAULT_BREAKPOINTS = Object.freeze({ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 })
export const DEFAULT_COLS = Object.freeze({ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 })

export const DEFAULT_OPTION = Object.freeze({
  // behaviour
  isDraggable: true,
  isResizable: true,
  isMirrored: false,
  isBounded: false,
  isResponsive: true,
  isPreventCollision: false,
  isVerticalCompact: true,
  isRestoreOnDrag: false,
  isUseCssTransforms: true,
  isAutoSize: true,
  isUseStyleCursor: true,
  // geometry
  colNum: 12,
  rowHeight: 60,
  maxRows: Infinity,
  margin: [10, 10],
  containerPadding: [0, 0],
  transformScale: 1,
  breakpoints: DEFAULT_BREAKPOINTS,
  cols: DEFAULT_COLS,
  // drag / resize handles (null = use the library defaults)
  dragAllowFrom: null,
  dragIgnoreFrom: null,
  resizeIgnoreFrom: null,
  // visuals
  showGridLines: false,
})

/** Props of <RGridLayout> that map 1:1 onto an `option` key (vue-grid-layout-v3 native names). */
export const PROP_TO_OPTION = Object.freeze({
  isDraggable: 'isDraggable',
  isResizable: 'isResizable',
  isMirrored: 'isMirrored',
  isBounded: 'isBounded',
  responsive: 'isResponsive',
  preventCollision: 'isPreventCollision',
  verticalCompact: 'isVerticalCompact',
  restoreOnDrag: 'isRestoreOnDrag',
  useCssTransforms: 'isUseCssTransforms',
  autoSize: 'isAutoSize',
  useStyleCursor: 'isUseStyleCursor',
  colNum: 'colNum',
  rowHeight: 'rowHeight',
  maxRows: 'maxRows',
  margin: 'margin',
  containerPadding: 'containerPadding',
  transformScale: 'transformScale',
  breakpoints: 'breakpoints',
  cols: 'cols',
  dragAllowFrom: 'dragAllowFrom',
  dragIgnoreFrom: 'dragIgnoreFrom',
  resizeIgnoreFrom: 'resizeIgnoreFrom',
  showGridLines: 'showGridLines',
})

/** Library-native / legacy names accepted inside `option` as aliases of the canonical keys. */
const OPTION_ALIASES = Object.freeze({
  draggable: 'isDraggable',
  resizable: 'isResizable',
  mirrored: 'isMirrored',
  bounded: 'isBounded',
  responsive: 'isResponsive',
  preventCollision: 'isPreventCollision',
  verticalCompact: 'isVerticalCompact',
  compact: 'isVerticalCompact',
  restoreOnDrag: 'isRestoreOnDrag',
  useCssTransforms: 'isUseCssTransforms',
  autoSize: 'isAutoSize',
  useStyleCursor: 'isUseStyleCursor',
  gridBreakpoints: 'breakpoints',
  gridCols: 'cols',
})

/** Rewrites aliases to canonical keys; unknown keys are dropped. */
export function normalizeOption(option) {
  const out = {}
  if (!option || typeof option !== 'object') return out
  for (const [key, value] of Object.entries(option)) {
    if (value === undefined) continue
    const canonical = OPTION_ALIASES[key] ?? key
    if (canonical in DEFAULT_OPTION) out[canonical] = value
  }
  return out
}

const toNumber = (value, fallback, min = -Infinity, max = Infinity) => {
  const n = Number(value)
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback
}

const toPair = (value, fallback) =>
  Array.isArray(value) && value.length >= 2
    ? [toNumber(value[0], fallback[0], 0), toNumber(value[1], fallback[1], 0)]
    : [...fallback]

/** Returns a fully-populated, sanitised, *detached* option object. */
export function finalizeOption(raw) {
  const o = { ...DEFAULT_OPTION, ...raw }
  const maxRows = Number(o.maxRows)
  return {
    ...o,
    colNum: Math.round(toNumber(o.colNum, DEFAULT_OPTION.colNum, 1, 48)),
    rowHeight: toNumber(o.rowHeight, DEFAULT_OPTION.rowHeight, 1, 2000),
    maxRows: Number.isFinite(maxRows) && maxRows > 0 ? Math.floor(maxRows) : Infinity,
    margin: toPair(o.margin, DEFAULT_OPTION.margin),
    containerPadding: toPair(o.containerPadding, DEFAULT_OPTION.containerPadding),
    transformScale: toNumber(o.transformScale, 1, 0.1, 4),
    breakpoints: { ...(o.breakpoints || DEFAULT_BREAKPOINTS) },
    cols: { ...(o.cols || DEFAULT_COLS) },
  }
}

// ── Control panel metadata ───────────────────────────────────────────────────
export const CONTROL_GROUPS = Object.freeze([
  'toggles',
  'numbers',
  'size',
  'scale',
  'items',
  'direction',
  'reset',
  'json',
])

export const TOGGLE_OPTIONS = Object.freeze([
  { key: 'isDraggable', label: 'draggable' },
  { key: 'isResizable', label: 'resizable' },
  { key: 'isMirrored', label: 'mirrored' },
  { key: 'isBounded', label: 'bounded' },
  { key: 'isResponsive', label: 'responsive' },
  { key: 'isPreventCollision', label: 'preventCollision' },
  { key: 'isVerticalCompact', label: 'verticalCompact' },
  { key: 'isRestoreOnDrag', label: 'restoreOnDrag' },
  { key: 'isUseCssTransforms', label: 'useCssTransforms' },
  { key: 'isAutoSize', label: 'autoSize' },
  { key: 'isUseStyleCursor', label: 'useStyleCursor' },
  { key: 'showGridLines', label: 'showGridLines' },
])

export const DEFAULT_LABELS = Object.freeze({
  controlPanel: 'Grid controls',
  items: 'items',
  columns: 'cols',
  breakpoint: 'Breakpoint',
  // toggles
  draggable: 'Draggable',
  resizable: 'Resizable',
  mirrored: 'Mirrored',
  bounded: 'Bounded',
  responsive: 'Responsive',
  preventCollision: 'Prevent collision',
  verticalCompact: 'Vertical compact',
  restoreOnDrag: 'Restore on drag',
  useCssTransforms: 'CSS transforms',
  autoSize: 'Auto size',
  useStyleCursor: 'Style cursor',
  showGridLines: 'Grid lines',
  // numbers
  rowHeight: 'Row height',
  colNum: 'Columns',
  marginX: 'Margin X',
  marginY: 'Margin Y',
  maxRows: 'Max rows',
  maxRowsHint: 'Empty = unlimited',
  // actions
  decreaseWidth: 'Narrower',
  increaseWidth: 'Wider',
  resetWidth: 'Full width',
  scale: 'Scale',
  addItem: 'Add item',
  addItemRandom: 'Add random item',
  changeDirection: 'Change direction',
  reset: 'Reset',
  showJson: 'Layout JSON',
  hideJson: 'Hide JSON',
  copyJson: 'Copy JSON',
  copied: 'Copied',
  remove: 'Remove',
  static: 'Static',
  empty: 'No items yet',
  emptyHint: 'Add an item to get started.',
  loading: 'Loading grid…',
})

// ── Layout helpers ───────────────────────────────────────────────────────────
/** Detached copy of a layout; drops invalid entries and guarantees x/y/w/h/i exist. */
export function cloneLayout(layout) {
  if (!Array.isArray(layout)) return []
  return layout
    .filter((item) => item && typeof item === 'object')
    .map((item, index) => ({
      x: 0,
      y: 0,
      w: 1,
      h: 1,
      ...item,
      i: item.i ?? String(index),
    }))
}

/** Stable string for comparing layouts. Ignores the transient `moved` flag the library adds. */
export function layoutSignature(layout) {
  return JSON.stringify(layout ?? [], (key, value) => (key === 'moved' ? undefined : value))
}

export function cloneLayoutMap(map) {
  const out = {}
  for (const [key, value] of Object.entries(map || {})) out[key] = cloneLayout(value)
  return out
}