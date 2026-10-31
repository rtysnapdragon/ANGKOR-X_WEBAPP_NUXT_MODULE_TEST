import type { EChartsOption } from 'echarts'

// ─────────────────────────────────────────────────────────────────────────────
// Chart types
// ─────────────────────────────────────────────────────────────────────────────
export type RChartType =
  | 'line'
  | 'area'
  | 'bar'
  | 'stacked'
  | 'pie'
  | 'doughnut'
  | 'scatter'
  | 'radar'
  | 'gauge'
  | 'funnel'
  | 'heatmap'
  | 'candlestick'
  | 'mixed'

/** Types drawn on a cartesian (x / y) grid. */
export const CARTESIAN_TYPES: readonly RChartType[] = ['line', 'area', 'bar', 'stacked', 'scatter', 'candlestick', 'mixed']
/** Types where dataZoom (zoom / reset) is meaningful. */
export const ZOOMABLE_TYPES = CARTESIAN_TYPES
/** Default targets for the chart-type switcher, per family. */
export const SWITCH_FAMILIES: readonly (readonly RChartType[])[] = [
  ['line', 'area', 'bar', 'stacked'],
  ['pie', 'doughnut', 'funnel'],
]

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────
/** `[x, y]` / `[x, y, size]` (scatter), `[xIndex, yIndex, value]` (heatmap), `[open, close, low, high]` (candlestick). */
export type RChartTuple = Array<number | string | null>

export interface RChartDatum {
  name?: string
  value: number | null | RChartTuple
  color?: string
}

export type RChartPoint = number | null | RChartDatum | RChartTuple

export interface RChartSeries {
  name: string
  /** Numbers, `{ name, value }` objects, or tuples (see `RChartTuple`). A single number is allowed for gauges. */
  data: RChartPoint[] | number
  /** Per-series type — only used by `mixed` (and to turn one line series into an area). */
  type?: 'line' | 'area' | 'bar' | 'scatter'
  color?: string
  stack?: string
  smooth?: boolean
  /** 1 puts the series on a secondary y axis. */
  yAxisIndex?: 0 | 1
  /** Vertical gradient fill for area / bar. Falls back to `display.gradient`. */
  gradient?: boolean
  /** Raw ECharts series options, merged last (wins over everything). */
  options?: Record<string, unknown>
}

export interface RChartIndicator {
  name: string
  max?: number
  min?: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Display / header / toolbar
// ─────────────────────────────────────────────────────────────────────────────
export interface RChartDisplay {
  /** ECharts legend. `true` = bottom. Hidden automatically when a `#legend` slot is provided. */
  legend?: boolean | 'top' | 'bottom'
  tooltip?: boolean
  /** Horizontal split lines. */
  grid?: boolean
  axisLabels?: boolean
  dataLabels?: boolean
  animation?: boolean
  /** Gradient fill under areas / on bars. */
  gradient?: boolean
  smooth?: boolean
  /** Show the dataZoom slider under cartesian charts (needs `toolbar.zoom`). */
  zoomSlider?: boolean
  /** Gauge range, and y axis bounds for cartesian charts. */
  min?: number
  max?: number
  xAxisName?: string
  yAxisName?: string
  y2AxisName?: string
  /** Bar corner radius in px. */
  barRadius?: number
}

export interface RChartHeaderConfig {
  visible?: boolean
  align?: 'start' | 'center' | 'end'
  /** `inline`: icon beside the text. `stacked`: icon above the text. */
  layout?: 'inline' | 'stacked'
  bordered?: boolean
  spacing?: 'sm' | 'md' | 'lg'
  iconStyle?: 'soft' | 'solid' | 'plain'
  titleTag?: 'h1' | 'h2' | 'h3' | 'h4' | 'p'
  class?: string
  style?: Record<string, string | number>
}

export interface RChartAction {
  key: string
  label: string
  icon?: string
  disabled?: boolean
  loading?: boolean
}

export interface RChartToolbarConfig {
  visible?: boolean
  /** Default reload button inside `#header-actions`. */
  refresh?: boolean
  exportPng?: boolean
  exportSvg?: boolean
  /** CSV of the plotted data. */
  exportData?: boolean
  fullscreen?: boolean
  /** Zoom in / out / reset (adds a dataZoom to cartesian charts). */
  zoom?: boolean
  /** `true` = the default family of the current type, or an explicit list. */
  typeSwitch?: boolean | RChartType[]
  actions?: RChartAction[]
}

export interface RChartPeriod {
  value: string
  label: string
  range?: { from: string; to: string }
}

export type RChartVariant = 'card' | 'outline' | 'flat' | 'glass'
export type RChartTheme = 'auto' | 'light' | 'dark'

export interface RChartLabels {
  refresh: string
  export: string
  exportPng: string
  exportSvg: string
  exportData: string
  fullscreen: string
  exitFullscreen: string
  zoomIn: string
  zoomOut: string
  zoomReset: string
  chartType: string
  noData: string
  noDataHint: string
  errorTitle: string
  retry: string
  loading: string
  period: string
}

export const DEFAULT_LABELS: RChartLabels = {
  refresh: 'Refresh',
  export: 'Export',
  exportPng: 'Download PNG',
  exportSvg: 'Download SVG',
  exportData: 'Download CSV',
  fullscreen: 'Fullscreen',
  exitFullscreen: 'Exit fullscreen',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  zoomReset: 'Reset zoom',
  chartType: 'Chart type',
  noData: 'No data to show',
  noDataHint: 'Try a different period or filter.',
  errorTitle: 'Could not load this chart',
  retry: 'Try again',
  loading: 'Loading chart',
  period: 'Period',
}

// ─────────────────────────────────────────────────────────────────────────────
// Number formatting
// ─────────────────────────────────────────────────────────────────────────────
export interface RChartFormatContext {
  seriesName?: string
  name?: string
  /** `true` on axis ticks: compact notation, no unit. */
  axis?: boolean
}
export type RChartValueFormatter = (value: number, ctx: RChartFormatContext) => string

// ─────────────────────────────────────────────────────────────────────────────
// Events
// ─────────────────────────────────────────────────────────────────────────────
export interface RChartPointEvent {
  componentType: string
  seriesType?: string
  seriesName?: string
  seriesIndex?: number
  name?: string
  dataIndex?: number
  value?: unknown
  color?: string
  /** The untouched ECharts event params. */
  raw: unknown
}
export interface RChartLegendEvent { name: string; selected: Record<string, boolean> }
export interface RChartZoomEvent { start: number; end: number }
export type RChartExportFormat = 'png' | 'svg' | 'csv'
export interface RChartExportEvent { format: RChartExportFormat; fileName: string; success: boolean; error?: unknown }
export interface RChartPeriodEvent { value: string; period: RChartPeriod }
export interface RChartActionEvent { key: string; action: RChartAction }

export interface RChartChartEvent {
  /** Raw ECharts / ZRender event name, e.g. `click`, `brushEnd`, `zr:click`. */
  name: string
  params: unknown
}

/** Forwarded through `@chart-event` by default. */
export const DEFAULT_ECHARTS_EVENTS = [
  'click', 'dblclick', 'contextmenu', 'mouseover', 'mouseout', 'globalout',
  'highlight', 'downplay', 'selectchanged',
  'legendselectchanged', 'legendselected', 'legendunselected', 'legendselectall', 'legendinverseselect', 'legendscroll',
  'datazoom', 'datarangeselected', 'timelinechanged', 'timelineplaychanged',
  'restore', 'dataviewchanged', 'magictypechanged',
  'brush', 'brushEnd', 'brushselected', 'axisareaselected', 'globalcursortaken',
  'finished',
] as const

/** High-frequency / niche events: opt in with the `events` prop (e.g. `:events="['mousemove', 'zr:click']"`). */
export const OPT_IN_ECHARTS_EVENTS = [
  'rendered', 'mousemove', 'mousedown', 'mouseup',
  'geoselectchanged', 'geoselected', 'geounselected',
  'zr:click', 'zr:mousedown', 'zr:mouseup', 'zr:mousewheel', 'zr:dblclick', 'zr:contextmenu',
] as const

export type RChartEventName = (typeof DEFAULT_ECHARTS_EVENTS)[number] | (typeof OPT_IN_ECHARTS_EVENTS)[number]

/**
 * The vue-echarts template-ref API (`<VChart ref>`). `showLoading` / `hideLoading` / `setTheme` are
 * deliberately absent — vue-echarts exposes them through props instead.
 */
export interface RChartInstance {
  setOption: (option: EChartsOption, opts?: unknown) => void
  getOption: () => EChartsOption
  getWidth: () => number
  getHeight: () => number
  getDom: () => HTMLElement
  resize: (opts?: { width?: number | 'auto'; height?: number | 'auto'; silent?: boolean; animation?: unknown }) => void
  dispatchAction: (payload: Record<string, unknown>, opt?: boolean | { silent?: boolean; flush?: boolean }) => void
  convertToPixel: (finder: unknown, value: unknown) => number | number[] | undefined
  convertFromPixel: (finder: unknown, value: number | number[]) => number | number[] | undefined
  containPixel: (finder: unknown, value: number[]) => boolean
  getDataURL: (opts?: { type?: 'png' | 'jpeg' | 'svg'; pixelRatio?: number; backgroundColor?: string; excludeComponents?: string[] }) => string
  getConnectedDataURL: (opts?: { type?: 'png' | 'jpeg' | 'svg'; pixelRatio?: number; backgroundColor?: string; excludeComponents?: string[] }) => string
  clear: () => void
  dispose: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Builder contracts (internal, but exported for tests / reuse)
// ─────────────────────────────────────────────────────────────────────────────
export interface RChartTokens {
  text: string
  muted: string
  border: string
  surface: string
  accent: string
  font: string
  palette: string[]
  up: string
  down: string
}

export interface RChartTable {
  columns: string[]
  rows: Array<Array<string | number | null>>
}

export interface RChartLegendItem { name: string; color: string }

export interface RChartBuildResult {
  option: EChartsOption
  table: RChartTable
  legend: RChartLegendItem[]
  hasData: boolean
}