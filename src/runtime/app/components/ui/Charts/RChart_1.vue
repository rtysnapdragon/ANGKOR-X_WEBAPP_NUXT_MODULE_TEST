<template>
  <section
    ref="rootRef"
    class="r-chart"
    :class="rootClass"
    :style="rootStyle"
    role="figure"
    :aria-label="ariaLabel || title || undefined"
    :aria-busy="loading || undefined"
  >
    <!-- ══ Header ══════════════════════════════════════════════════════════ -->
    <header
      v-if="hdr.visible"
      class="r-chart__header"
      :class="[`is-align-${hdr.align}`, `is-${hdr.layout}`, { 'is-bordered': hdr.bordered }, hdr.class]"
      :style="hdr.style"
    >
      <slot name="header" v-bind="ctx">
        <div class="r-chart__head-main">
          <slot name="header-start" v-bind="ctx" />

          <span v-if="showIcon" class="r-chart__icon" :class="`is-${hdr.iconStyle}`">
            <slot name="icon" v-bind="ctx"><UIcon :name="icon as string" /></slot>
          </span>

          <div v-if="hasTitleBlock" class="r-chart__titles">
            <slot name="title" v-bind="ctx">
              <component :is="hdr.titleTag" v-if="title" class="r-chart__title">{{ title }}</component>
            </slot>
            <slot name="subtitle" v-bind="ctx">
              <p v-if="subtitle" class="r-chart__subtitle">{{ subtitle }}</p>
            </slot>
            <p v-if="description" class="r-chart__description">{{ description }}</p>
          </div>
        </div>

        <div v-if="periods?.length || $slots['header-filter']" class="r-chart__head-filter">
          <slot name="header-filter" v-bind="ctx">
            <div class="r-seg" role="group" :aria-label="L.period">
              <button
                v-for="p in periods"
                :key="p.value"
                type="button"
                :class="{ 'is-active': p.value === periodValue }"
                :aria-pressed="p.value === periodValue"
                @click="setPeriod(p)"
              >
                {{ p.label }}
              </button>
            </div>
          </slot>
        </div>

        <div v-if="showHeaderEnd" class="r-chart__head-end">
          <slot name="header-end" v-bind="ctx" />
          <div v-if="tb.visible && tb.refresh || $slots['header-actions']" class="r-chart__head-actions">
            <slot name="header-actions" v-bind="ctx">
              <UButton
                icon="i-lucide-refresh-cw"
                color="neutral"
                variant="ghost"
                size="sm"
                :loading="loading"
                :title="L.refresh"
                :aria-label="L.refresh"
                @click="onRefresh"
              />
            </slot>
          </div>
        </div>
      </slot>
    </header>

    <!-- ══ Toolbar row ═════════════════════════════════════════════════════ -->
    <div v-if="showToolbarRow" class="r-chart__toolbar">
      <div class="r-chart__filters"><slot name="filters" v-bind="ctx" /></div>

      <div class="r-chart__tools">
        <slot name="toolbar" v-bind="ctx">
          <div v-if="switchTypes.length > 1" class="r-seg" role="group" :aria-label="L.chartType">
            <button
              v-for="t in switchTypes"
              :key="t"
              type="button"
              :class="{ 'is-active': t === currentType }"
              :aria-pressed="t === currentType"
              :title="t"
              @click="setType(t)"
            >
              <UIcon :name="TYPE_ICONS[t]" />
              <span class="r-chart__btn-label">{{ t }}</span>
            </button>
          </div>

          <div v-if="canZoom" class="r-chart__group" role="group">
            <UButton icon="i-lucide-zoom-in" color="neutral" variant="ghost" size="xs" :disabled="stateName !== 'ready'" :title="L.zoomIn" :aria-label="L.zoomIn" @click="zoomBy(ZOOM_STEP)" />
            <UButton icon="i-lucide-zoom-out" color="neutral" variant="ghost" size="xs" :disabled="stateName !== 'ready' || !zoomed" :title="L.zoomOut" :aria-label="L.zoomOut" @click="zoomBy(1 / ZOOM_STEP)" />
            <UButton icon="i-lucide-scan" color="neutral" variant="ghost" size="xs" :disabled="!zoomed" :title="L.zoomReset" :aria-label="L.zoomReset" @click="resetZoom" />
          </div>

          <UButton
            v-for="action in tb.actions"
            :key="action.key"
            :icon="action.icon"
            :loading="action.loading"
            :disabled="action.disabled"
            color="neutral"
            variant="ghost"
            size="xs"
            :title="action.label"
            :aria-label="action.label"
            @click="onAction(action)"
          >
            <span class="r-chart__btn-label" :class="{ 'is-always': !action.icon }">{{ action.label }}</span>
          </UButton>

          <UDropdownMenu v-if="exportItems.length" :items="exportItems" :content="{ align: 'end' }">
            <UButton icon="i-lucide-download" color="neutral" variant="ghost" size="xs" :disabled="stateName !== 'ready'" :title="L.export" :aria-label="L.export" />
          </UDropdownMenu>

          <UButton
            v-if="tb.fullscreen"
            :icon="isFullscreen ? 'i-lucide-minimize-2' : 'i-lucide-maximize-2'"
            color="neutral"
            variant="ghost"
            size="xs"
            :title="isFullscreen ? L.exitFullscreen : L.fullscreen"
            :aria-label="isFullscreen ? L.exitFullscreen : L.fullscreen"
            :aria-pressed="isFullscreen"
            @click="toggleFullscreen"
          />
        </slot>
      </div>
    </div>

    <!-- ══ Chart ═══════════════════════════════════════════════════════════ -->
    <div class="r-chart__body">
      <slot name="chart" v-bind="ctx">
        <div class="r-chart__stage">
          <VChart
            v-if="canMountChart"
            v-show="chartVisible"
            ref="vchart"
            class="r-chart__canvas"
            :option="vOption"
            :autoresize="autoresize"
            @click="onClick"
            @mouseover="onHover"
            @globalout="onHoverEnd"
            @legendselectchanged="onLegend"
            @datazoom="onZoom"
            @finished="onFinished"
          />
        </div>

        <div
          v-if="stateName !== 'ready'"
          class="r-chart__state"
          :class="[`is-${stateName}`, { 'is-veil': stateName === 'loading' && everReady }]"
          :role="stateName === 'error' ? 'alert' : 'status'"
        >
          <slot v-if="stateName === 'loading'" name="loading" v-bind="ctx">
            <div class="r-chart__skeleton" aria-hidden="true">
              <i v-for="(h, n) in SKELETON_BARS" :key="n" :style="{ '--h': `${h}%`, '--d': `${n * 60}ms` }" />
            </div>
            <span class="r-chart__sr">{{ L.loading }}</span>
          </slot>

          <slot v-else-if="stateName === 'error'" name="error" v-bind="{ ...ctx, message: errorMessage, retry: onRefresh }">
            <div class="r-chart__message">
              <span class="r-chart__message-icon is-error"><UIcon name="i-lucide-triangle-alert" /></span>
              <p class="r-chart__message-title">{{ L.errorTitle }}</p>
              <p v-if="errorMessage !== L.errorTitle" class="r-chart__message-text">{{ errorMessage }}</p>
              <UButton icon="i-lucide-refresh-cw" color="neutral" variant="outline" size="xs" @click="onRefresh">{{ L.retry }}</UButton>
            </div>
          </slot>

          <slot v-else name="empty" v-bind="ctx">
            <div class="r-chart__message">
              <span class="r-chart__message-icon"><UIcon name="i-lucide-chart-no-axes-column" /></span>
              <p class="r-chart__message-title">{{ L.noData }}</p>
              <p class="r-chart__message-text">{{ L.noDataHint }}</p>
            </div>
          </slot>
        </div>
      </slot>
    </div>

    <!-- ══ Legend (custom) / footer ════════════════════════════════════════ -->
    <div v-if="$slots.legend" class="r-chart__legend">
      <slot name="legend" v-bind="{ ...ctx, items: legendItems, toggle: toggleLegend }" />
    </div>

    <footer v-if="$slots.footer" class="r-chart__footer">
      <slot name="footer" v-bind="ctx" />
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useSlots, watch } from 'vue'
import { buildChart } from '~/utils/chart/build'
import { downloadBlob, downloadUrl, optionToSvg, safeFileName, tableToCsv } from '~/utils/chart/export'
import { createFormatter, mergeOptions } from '~/utils/chart/format'
import {
  DEFAULT_LABELS,
  SWITCH_FAMILIES,
  ZOOMABLE_TYPES,
} from '~/utils/chart/types'
import type {
  RChartAction,
  RChartActionEvent,
  RChartDisplay,
  RChartExportEvent,
  RChartExportFormat,
  RChartHeaderConfig,
  RChartIndicator,
  RChartInstance,
  RChartLabels,
  RChartLegendEvent,
  RChartPeriod,
  RChartPeriodEvent,
  RChartPoint,
  RChartPointEvent,
  RChartSeries,
  RChartTheme,
  RChartToolbarConfig,
  RChartTokens,
  RChartType,
  RChartValueFormatter,
  RChartVariant,
  RChartZoomEvent,
} from '~/utils/chart/types'

// ═════════════════════════════════════════════════════════════════════════════
// Props / emits
// ═════════════════════════════════════════════════════════════════════════════
const props = withDefaults(
  defineProps<{
    /** Chart type. Also reflects the type switcher (use `v-model:type` to follow it). */
    type?: RChartType
    /** Pie / doughnut / funnel items, a gauge value, a single series of numbers, or candlestick / heatmap points. */
    data?: number | RChartPoint[]
    /** One or more series (cartesian, radar, scatter, mixed…). */
    series?: RChartSeries[]
    /** X axis labels (cartesian, candlestick, heatmap) or radar indicator names. */
    categories?: string[]
    /** Y axis labels (heatmap). */
    yCategories?: string[]
    indicators?: RChartIndicator[]

    title?: string
    subtitle?: string
    description?: string
    /** Iconify name (e.g. `i-lucide-chart-line`); `false` hides the icon even if the slot exists. */
    icon?: string | false

    /** Plot height. Numbers are px. */
    height?: number | string
    width?: number | string
    loading?: boolean
    /** `true` or a message → error state. */
    error?: string | boolean | null
    theme?: RChartTheme
    /** Overrides the series palette. */
    colors?: string[]
    variant?: RChartVariant
    display?: RChartDisplay
    header?: RChartHeaderConfig
    /** `false` hides all built-in controls (including the reload button). */
    toolbar?: RChartToolbarConfig | boolean
    periods?: RChartPeriod[]
    /** Selected period value (`v-model:period`). */
    period?: string

    unit?: string
    /** ISO 4217 code, e.g. `USD`, `KHR`. */
    currency?: string
    locale?: string
    decimals?: number
    valueFormatter?: RChartValueFormatter

    /** Native ECharts option. Deep-merged over the defaults — yours wins. `series` merges by index. */
    options?: Record<string, any>
    labels?: Partial<RChartLabels>
    /** Base file name for exports (default: title). */
    exportName?: string
    ariaLabel?: string
    autoresize?: boolean
  }>(),
  {
    type: 'line',
    data: undefined,
    series: undefined,
    categories: undefined,
    yCategories: undefined,
    indicators: undefined,
    title: undefined,
    subtitle: undefined,
    description: undefined,
    icon: undefined,
    height: 320,
    width: '100%',
    loading: false,
    error: null,
    theme: 'auto',
    colors: undefined,
    variant: 'card',
    display: () => ({}),
    header: () => ({}),
    toolbar: () => ({}),
    periods: undefined,
    period: undefined,
    unit: undefined,
    currency: undefined,
    locale: undefined,
    decimals: undefined,
    valueFormatter: undefined,
    options: undefined,
    labels: () => ({}),
    exportName: undefined,
    ariaLabel: undefined,
    autoresize: true,
  },
)

const emit = defineEmits<{
  'chart-click': [event: RChartPointEvent]
  'chart-hover': [event: RChartPointEvent | null]
  'legend-change': [event: RChartLegendEvent]
  zoom: [event: RChartZoomEvent]
  ready: [chart: RChartInstance]
  refresh: []
  export: [event: RChartExportEvent]
  fullscreen: [active: boolean]
  'period-change': [event: RChartPeriodEvent]
  'type-change': [type: RChartType]
  action: [event: RChartActionEvent]
  'update:type': [type: RChartType]
  'update:period': [value: string]
}>()

const slots = useSlots()

// ═════════════════════════════════════════════════════════════════════════════
// Constants
// ═════════════════════════════════════════════════════════════════════════════
const TYPE_ICONS: Record<RChartType, string> = {
  line: 'i-lucide-chart-line',
  area: 'i-lucide-chart-area',
  bar: 'i-lucide-chart-column',
  stacked: 'i-lucide-chart-column-stacked',
  pie: 'i-lucide-chart-pie',
  doughnut: 'i-lucide-circle-dot',
  scatter: 'i-lucide-chart-scatter',
  radar: 'i-lucide-radar',
  gauge: 'i-lucide-gauge',
  funnel: 'i-lucide-funnel',
  heatmap: 'i-lucide-grid-3x3',
  candlestick: 'i-lucide-chart-candlestick',
  mixed: 'i-lucide-chart-no-axes-combined',
}
const SKELETON_BARS = [42, 68, 52, 80, 60, 90, 48, 72, 58, 84, 64, 76]
const ZOOM_STEP = 0.6

// Used until the real SARIKA tokens have been read from the DOM (mirrors _color.scss :root).
const FALLBACK_TOKENS: RChartTokens = {
  text: '#1a1510',
  muted: '#8a7f72',
  border: 'rgba(255, 140, 66, 0.16)',
  surface: '#ffffff',
  accent: '#ff8c42',
  font: "Inter, Battambang, NotoSansKhmer, system-ui, sans-serif",
  palette: ['#ff8c42', '#60a5fa', '#4ade80', '#ffb347', '#f87171', '#8b3e3e', '#8a7f72'],
  up: '#4ade80',
  down: '#f87171',
}

// ═════════════════════════════════════════════════════════════════════════════
// Resolved config
// ═════════════════════════════════════════════════════════════════════════════
const L = computed<RChartLabels>(() => ({ ...DEFAULT_LABELS, ...props.labels }))

const hdr = computed(() => ({
  visible: true,
  align: 'start' as const,
  layout: 'inline' as const,
  bordered: false,
  spacing: 'md' as const,
  iconStyle: 'soft' as const,
  titleTag: 'h3' as const,
  ...props.header,
}))

const tb = computed(() => {
  const off = props.toolbar === false
  const custom = typeof props.toolbar === 'object' && props.toolbar ? props.toolbar : {}
  return {
    visible: !off,
    refresh: !off,
    exportPng: false,
    exportSvg: false,
    exportData: false,
    fullscreen: false,
    zoom: false,
    typeSwitch: false as boolean | RChartType[],
    actions: [] as RChartAction[],
    ...custom,
  }
})

const disp = computed<RChartDisplay>(() => ({
  legend: true,
  tooltip: true,
  grid: true,
  axisLabels: true,
  dataLabels: false,
  animation: true,
  ...props.display,
}))

const fmt = computed(() =>
  createFormatter({ unit: props.unit, currency: props.currency, locale: props.locale, decimals: props.decimals, valueFormatter: props.valueFormatter }),
)

// ═════════════════════════════════════════════════════════════════════════════
// Local state (type / period work with or without v-model)
// ═════════════════════════════════════════════════════════════════════════════
const rootRef = ref<HTMLElement | null>(null)
const vchart = ref<RChartInstance | null>(null)
const mounted = ref(false)
const everReady = ref(false)
const reducedMotion = ref(false)
const tokens = shallowRef<RChartTokens>(FALLBACK_TOKENS)

const currentType = ref<RChartType>(props.type)
const periodValue = ref<string | undefined>(props.period ?? props.periods?.[0]?.value)
const legendSelected = ref<Record<string, boolean>>({})
const zoomRange = ref({ start: 0, end: 100 })

watch(() => props.type, (v) => { currentType.value = v })
watch(() => props.period, (v) => { if (v !== undefined) periodValue.value = v })
watch(currentType, () => {
  legendSelected.value = {}
  zoomRange.value = { start: 0, end: 100 }
})

// ═════════════════════════════════════════════════════════════════════════════
// Theme tokens (ECharts cannot read CSS variables → resolve them from the DOM)
// ═════════════════════════════════════════════════════════════════════════════
function readTokens() {
  const el = rootRef.value
  if (!el) return
  const cs = getComputedStyle(el)
  const v = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback
  const f = FALLBACK_TOKENS
  const accent = v('--c-accent', f.accent)
  tokens.value = {
    text: v('--c-text', f.text),
    muted: v('--c-muted', f.muted),
    border: v('--c-border', f.border),
    surface: v('--c-surface', f.surface),
    accent,
    font: v('--font-fallback', f.font),
    up: v('--c-success', f.up),
    down: v('--c-danger', f.down),
    palette: [
      accent,
      v('--c-info', f.palette[1]!),
      v('--c-success', f.palette[2]!),
      v('--c-accent-2', f.palette[3]!),
      v('--c-danger', f.palette[4]!),
      v('--color-w-b-3', f.palette[5]!),
      v('--c-muted', f.palette[6]!),
    ],
  }
}

let themeObserver: MutationObserver | null = null
let motionQuery: MediaQueryList | null = null
const onMotionChange = () => { reducedMotion.value = Boolean(motionQuery?.matches) }

// ═════════════════════════════════════════════════════════════════════════════
// Option building
// ═════════════════════════════════════════════════════════════════════════════
const colorMode = useColorMode()
watch(() => [props.theme, colorMode.value], () => nextTick(readTokens))

const built = computed(() =>
  buildChart({
    type: currentType.value,
    title: props.title,
    data: props.data,
    series: props.series,
    categories: props.categories,
    yCategories: props.yCategories,
    indicators: props.indicators,
    tokens: tokens.value,
    colors: props.colors,
    display: disp.value,
    fmt: fmt.value,
    zoom: tb.value.zoom && ZOOMABLE_TYPES.includes(currentType.value),
    legendSlot: Boolean(slots.legend),
    animate: disp.value.animation !== false && !reducedMotion.value,
  }),
)

const chartOption = computed(() => mergeOptions(built.value.option as Record<string, any>, props.options))
// vue-echarts types `option` from the modules enabled in nuxt.config; the merged object is intentionally wider.
const vOption = computed<any>(() => chartOption.value)

// ═════════════════════════════════════════════════════════════════════════════
// States
// ═════════════════════════════════════════════════════════════════════════════
const stateName = computed<'loading' | 'error' | 'empty' | 'ready'>(() => {
  if (!mounted.value || props.loading) return 'loading'
  if (props.error) return 'error'
  return built.value.hasData ? 'ready' : 'empty'
})
const errorMessage = computed(() => (typeof props.error === 'string' && props.error ? props.error : L.value.errorTitle))

watch(stateName, (s) => { if (s === 'ready') everReady.value = true }, { immediate: true })

const canMountChart = computed(() => mounted.value && (everReady.value || stateName.value === 'ready'))
const chartVisible = computed(() => stateName.value === 'ready' || (stateName.value === 'loading' && everReady.value))

// ═════════════════════════════════════════════════════════════════════════════
// Layout bits
// ═════════════════════════════════════════════════════════════════════════════
const toCss = (v: number | string) => (typeof v === 'number' ? `${v}px` : v)

const rootStyle = computed(() => ({ width: toCss(props.width), '--r-chart-height': toCss(props.height) }))
const rootClass = computed(() => [
  `r-chart--${props.variant}`,
  `r-chart--space-${hdr.value.spacing}`,
  {
    // `.dark` re-scopes the SARIKA tokens for this subtree only
    dark: props.theme === 'dark',
    'r-chart--light': props.theme === 'light',
    'is-fullscreen': isFullscreen.value,
  },
])

const showIcon = computed(() => props.icon !== false && (Boolean(props.icon) || Boolean(slots.icon)))
const hasTitleBlock = computed(() => Boolean(props.title || props.subtitle || props.description || slots.title || slots.subtitle))
const showHeaderEnd = computed(() => (tb.value.visible && tb.value.refresh) || Boolean(slots['header-end']) || Boolean(slots['header-actions']))

const switchTypes = computed<RChartType[]>(() => {
  const s = tb.value.typeSwitch
  if (Array.isArray(s)) return s
  if (!s) return []
  return [...(SWITCH_FAMILIES.find((fam) => fam.includes(currentType.value)) ?? [])]
})
const canZoom = computed(() => tb.value.zoom && ZOOMABLE_TYPES.includes(currentType.value))
const zoomed = computed(() => zoomRange.value.start > 0.5 || zoomRange.value.end < 99.5)

const exportItems = computed(() => {
  const items: Array<{ label: string; icon: string; onSelect: () => void }> = []
  if (tb.value.exportPng) items.push({ label: L.value.exportPng, icon: 'i-lucide-image', onSelect: () => doExport('png') })
  if (tb.value.exportSvg) items.push({ label: L.value.exportSvg, icon: 'i-lucide-file-code', onSelect: () => doExport('svg') })
  if (tb.value.exportData) items.push({ label: L.value.exportData, icon: 'i-lucide-table', onSelect: () => doExport('csv') })
  return items
})

const hasDefaultTools = computed(
  () => switchTypes.value.length > 1 || canZoom.value || exportItems.value.length > 0 || tb.value.fullscreen || tb.value.actions.length > 0,
)
const showToolbarRow = computed(() => tb.value.visible && (hasDefaultTools.value || Boolean(slots.filters) || Boolean(slots.toolbar)))

const legendItems = computed(() => built.value.legend.map((it) => ({ ...it, visible: legendSelected.value[it.name] !== false })))

// ═════════════════════════════════════════════════════════════════════════════
// Interactions
// ═════════════════════════════════════════════════════════════════════════════
function setType(t: RChartType) {
  if (t === currentType.value) return
  currentType.value = t
  emit('update:type', t)
  emit('type-change', t)
}

function setPeriod(p: RChartPeriod) {
  if (p.value === periodValue.value) return
  periodValue.value = p.value
  emit('update:period', p.value)
  emit('period-change', { value: p.value, period: p })
}

const onRefresh = () => emit('refresh')
const onAction = (action: RChartAction) => emit('action', { key: action.key, action })

function toPoint(p: any): RChartPointEvent {
  return {
    componentType: p?.componentType,
    seriesType: p?.seriesType,
    seriesName: p?.seriesName,
    seriesIndex: p?.seriesIndex,
    name: p?.name,
    dataIndex: p?.dataIndex,
    value: p?.value,
    color: typeof p?.color === 'string' ? p.color : undefined,
    raw: p,
  }
}
const onClick = (p: unknown) => emit('chart-click', toPoint(p))
const onHover = (p: unknown) => emit('chart-hover', toPoint(p))
const onHoverEnd = () => emit('chart-hover', null)

function onLegend(p: { name: string; selected: Record<string, boolean> }) {
  legendSelected.value = { ...p.selected }
  emit('legend-change', { name: p.name, selected: { ...p.selected } })
}

function onZoom(p: any) {
  const b = p?.batch?.[0] ?? p
  if (typeof b?.start === 'number' && typeof b?.end === 'number') {
    zoomRange.value = { start: b.start, end: b.end }
    emit('zoom', { start: b.start, end: b.end })
  }
}

let readyEmitted = false
function onFinished() {
  if (readyEmitted || !vchart.value) return
  readyEmitted = true
  emit('ready', vchart.value)
}

function toggleLegend(name: string) {
  vchart.value?.dispatchAction({ type: 'legendToggleSelect', name })
}

// ── Zoom ─────────────────────────────────────────────────────────────────────
function applyZoom(start: number, end: number) {
  const span = Math.min(100, Math.max(2, end - start))
  let s = start
  let e = start + span
  if (s < 0) { e -= s; s = 0 }
  if (e > 100) { s -= e - 100; e = 100 }
  vchart.value?.dispatchAction({ type: 'dataZoom', dataZoomIndex: 0, start: Math.max(0, s), end: Math.min(100, e) })
}

function zoomBy(factor: number) {
  const { start, end } = zoomRange.value
  const mid = (start + end) / 2
  const half = Math.min(50, Math.max(1, ((end - start) / 2) * factor))
  applyZoom(mid - half, mid + half)
}
const resetZoom = () => applyZoom(0, 100)

// ── Export ───────────────────────────────────────────────────────────────────
function doExport(format: RChartExportFormat) {
  const fileName = `${safeFileName(props.exportName || props.title || 'chart')}.${format}`
  try {
    if (format === 'csv') {
      downloadBlob(tableToCsv(built.value.table), fileName)
    } else if (format === 'png') {
      if (!vchart.value) throw new Error('Chart is not ready')
      downloadUrl(vchart.value.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: tokens.value.surface }), fileName)
    } else {
      const dom = vchart.value?.getDom()
      if (!dom) throw new Error('Chart is not ready')
      downloadBlob(optionToSvg(chartOption.value as never, dom.clientWidth, dom.clientHeight, tokens.value.surface), fileName)
    }
    emit('export', { format, fileName, success: true })
  } catch (error) {
    emit('export', { format, fileName, success: false, error })
  }
}

// ── Fullscreen (native API, with a fixed-position fallback for iOS Safari) ───
const isFullscreen = ref(false)
let pseudoFullscreen = false

async function toggleFullscreen() {
  const el = rootRef.value
  if (!el) return
  if (isFullscreen.value) {
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => {})
    pseudoFullscreen = false
    isFullscreen.value = false
    return
  }
  try {
    if (!el.requestFullscreen) throw new Error('unsupported')
    await el.requestFullscreen()
    pseudoFullscreen = false
  } catch {
    pseudoFullscreen = true
  }
  isFullscreen.value = true
}

function onFullscreenChange() {
  if (pseudoFullscreen) return
  isFullscreen.value = document.fullscreenElement === rootRef.value
}
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && pseudoFullscreen && isFullscreen.value) toggleFullscreen()
}

watch(isFullscreen, (active) => {
  emit('fullscreen', active)
  nextTick(() => vchart.value?.resize())
})

// ═════════════════════════════════════════════════════════════════════════════
// Lifecycle
// ═════════════════════════════════════════════════════════════════════════════
onMounted(() => {
  readTokens()
  mounted.value = true

  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion.value = motionQuery.matches
  motionQuery.addEventListener('change', onMotionChange)

  // Light/dark toggles flip a class on <html>; re-read the tokens when that happens.
  themeObserver = new MutationObserver(() => nextTick(readTokens))
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-theme'] })

  document.addEventListener('fullscreenchange', onFullscreenChange)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  themeObserver?.disconnect()
  motionQuery?.removeEventListener('change', onMotionChange)
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  document.removeEventListener('keydown', onKeydown)
  if (document.fullscreenElement === rootRef.value) document.exitFullscreen().catch(() => {})
})

// Everything slots / parents might need
const ctx = computed(() => ({
  type: currentType.value,
  state: stateName.value,
  loading: props.loading,
  period: periodValue.value,
  chart: vchart.value,
  option: chartOption.value,
  refresh: onRefresh,
}))

defineExpose({
  /** The vue-echarts instance (setOption, dispatchAction, getDataURL, resize…). */
  chart: vchart,
  getOption: () => chartOption.value,
  refresh: onRefresh,
  exportAs: doExport,
  toggleFullscreen,
  zoomIn: () => zoomBy(ZOOM_STEP),
  zoomOut: () => zoomBy(1 / ZOOM_STEP),
  resetZoom,
  resize: () => vchart.value?.resize(),
})
</script>

<style lang="scss">
// Not scoped on purpose: UDropdownMenu renders in a portal, and consumers need to restyle freely.
// SARIKA tokens only (see _color.scss). Fallbacks cover tokens that live in other files.

.r-chart {
  --r-chart-pad: 1.25rem;
  --r-chart-gap: 0.75rem;

  position: relative;
  display: flex;
  flex-direction: column;
  max-width: 100%;
  min-width: 0;
  color: var(--c-text);
  font-family: var(--font-fallback);
  border: 1px solid transparent;
  border-radius: var(--r-lg, 16px);
  background: transparent;
  transition: box-shadow var(--t-base, 250ms) var(--ease-out, ease-out);

  &--space-sm { --r-chart-pad: 0.75rem; --r-chart-gap: 0.5rem; }
  &--space-md { --r-chart-pad: 1.25rem; --r-chart-gap: 0.75rem; }
  &--space-lg { --r-chart-pad: 1.75rem; --r-chart-gap: 1rem; }

  // ── Variants ───────────────────────────────────────────────────────────────
  &--card {
    border-color: var(--c-border);
    background: var(--bg-card, var(--c-surface));
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.04);
  }

  &--outline {
    border-color: var(--c-border);
  }

  &--flat {
    border-radius: 0;
  }

  &--glass {
    border-color: var(--glass-border, var(--c-border));
    background: var(--glass-bg, var(--c-surface));
    backdrop-filter: var(--glass-blur-sm, blur(12px));
    box-shadow: var(--glass-shadow, none);
  }

  // Forced light inside a dark page: mirrors the :root block of _color.scss
  &--light {
    --c-surface: #ffffff;
    --bg-card: #ffffff;
    --c-text: #1a1510;
    --c-muted: #8a7f72;
    --c-border: rgba(255, 140, 66, 0.16);
    --glass-bg: rgba(255, 255, 255, 0.72);
    --glass-border: rgba(255, 140, 66, 0.16);
  }

  &.is-fullscreen {
    position: fixed;
    inset: 0;
    z-index: 2000;
    width: 100% !important;
    height: 100%;
    border-radius: 0;
    background: var(--c-surface);

    .r-chart__body {
      flex: 1;
      height: auto;
      min-height: 0;
    }
  }

  // ── Header ─────────────────────────────────────────────────────────────────
  &__header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--r-chart-gap) 1rem;
    padding: var(--r-chart-pad) var(--r-chart-pad) 0;

    &.is-bordered {
      padding-bottom: var(--r-chart-gap);
      border-bottom: 1px solid var(--c-border);
    }

    &.is-align-end { flex-direction: row-reverse; text-align: end; }

    &.is-align-center {
      justify-content: center;
      text-align: center;

      .r-chart__head-main { flex: 1 1 100%; justify-content: center; }
    }

    &.is-stacked .r-chart__head-main { flex-direction: column; align-items: inherit; }
    &.is-stacked.is-align-start .r-chart__head-main { align-items: flex-start; }
    &.is-stacked.is-align-end .r-chart__head-main { align-items: flex-end; }
    &.is-stacked.is-align-center .r-chart__head-main { align-items: center; }
  }

  &__head-main {
    display: flex;
    flex: 1 1 14rem;
    align-items: center;
    gap: 0.75rem;
    min-width: 0;
  }

  &__icon {
    display: grid;
    flex-shrink: 0;
    place-items: center;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: var(--r-md, 12px);
    font-size: 1.125rem;

    &.is-soft { color: var(--c-accent); background: color-mix(in srgb, var(--c-accent) 12%, transparent); }
    &.is-solid { color: var(--c-surface); background: var(--c-accent); }
    &.is-plain { width: auto; height: auto; color: var(--c-muted); }
  }

  &__titles { min-width: 0; }

  &__title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.3;
    color: var(--c-text);
  }

  &__subtitle,
  &__description {
    margin: 0.125rem 0 0;
    font-size: 0.8125rem;
    line-height: 1.45;
    color: var(--c-muted);
  }

  &__description { max-width: 64ch; }

  &__head-filter,
  &__head-end { display: flex; align-items: center; gap: 0.5rem; }

  &__head-actions { display: inline-flex; align-items: center; gap: 0.25rem; }

  // ── Toolbar ────────────────────────────────────────────────────────────────
  &__toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--r-chart-gap);
    padding: var(--r-chart-gap) var(--r-chart-pad) 0;
  }

  &__filters,
  &__tools { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; min-width: 0; }
  &__tools { margin-inline-start: auto; }
  &__group { display: inline-flex; align-items: center; }

  &__btn-label { font-size: 0.75rem; text-transform: capitalize; }

  // ── Body ───────────────────────────────────────────────────────────────────
  &__body {
    position: relative;
    flex: 0 0 auto;
    height: calc(var(--r-chart-height, 320px) + var(--r-chart-pad));
    min-height: 10rem;
  }

  &__stage {
    position: absolute;
    inset: var(--r-chart-gap) var(--r-chart-pad) var(--r-chart-pad);
  }

  &__canvas { width: 100%; height: 100%; }

  &__legend,
  &__footer { padding: 0 var(--r-chart-pad) var(--r-chart-pad); }

  &__footer {
    padding-top: var(--r-chart-gap);
    border-top: 1px solid var(--c-border);
    font-size: 0.8125rem;
    color: var(--c-muted);
  }

  // ── States ─────────────────────────────────────────────────────────────────
  &__state {
    position: absolute;
    inset: var(--r-chart-gap) var(--r-chart-pad) var(--r-chart-pad);
    display: grid;
    place-items: center;
    border-radius: var(--r-md, 12px);

    &.is-veil { background: color-mix(in srgb, var(--c-surface) 70%, transparent); }
  }

  &__skeleton {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
    width: 100%;
    height: 100%;
    padding: 0.5rem 0.25rem;

    i {
      flex: 1;
      height: var(--h);
      border-radius: 6px 6px 0 0;
      background: linear-gradient(
        100deg,
        color-mix(in srgb, var(--c-muted) 10%, transparent) 30%,
        color-mix(in srgb, var(--c-accent) 18%, transparent) 50%,
        color-mix(in srgb, var(--c-muted) 10%, transparent) 70%
      );
      background-size: 300% 100%;
      animation: r-chart-shimmer 1.6s ease-in-out infinite;
      animation-delay: var(--d);
    }
  }

  &__sr {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  &__message {
    display: grid;
    justify-items: center;
    gap: 0.375rem;
    max-width: 22rem;
    padding: 1rem;
    text-align: center;
  }

  &__message-icon {
    display: grid;
    place-items: center;
    width: 2.75rem;
    height: 2.75rem;
    margin-bottom: 0.25rem;
    border-radius: 50%;
    font-size: 1.25rem;
    color: var(--c-muted);
    background: color-mix(in srgb, var(--c-muted) 12%, transparent);

    &.is-error { color: var(--c-danger); background: color-mix(in srgb, var(--c-danger) 12%, transparent); }
  }

  &__message-title { margin: 0; font-size: 0.9375rem; font-weight: 600; color: var(--c-text); }
  &__message-text { margin: 0 0 0.5rem; font-size: 0.8125rem; color: var(--c-muted); }
}

// ── Segmented control (periods, type switch) ────────────────────────────────
.r-seg {
  display: inline-flex;
  max-width: 100%;
  padding: 0.125rem;
  overflow-x: auto;
  border: 1px solid var(--c-border);
  border-radius: var(--r-md, 12px);
  background: color-mix(in srgb, var(--c-muted) 7%, transparent);
  scrollbar-width: none;

  button {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.75rem;
    font: inherit;
    font-size: 0.75rem;
    font-weight: 500;
    white-space: nowrap;
    border: 0;
    border-radius: calc(var(--r-md, 12px) - 2px);
    color: var(--c-muted);
    background: transparent;
    cursor: pointer;
    transition: color var(--t-fast, 150ms) var(--ease-out, ease-out), background var(--t-fast, 150ms) var(--ease-out, ease-out);

    &:hover { color: var(--c-text); }

    &.is-active {
      color: var(--c-accent);
      background: var(--c-surface);
      box-shadow: 0 1px 2px rgb(0 0 0 / 0.12);
    }

    &:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 1px; }
  }
}

@keyframes r-chart-shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}

// ── Responsive ──────────────────────────────────────────────────────────────
@media (max-width: 640px) {
  .r-chart {
    &__head-filter { flex: 1 1 100%; }
    &__tools { margin-inline-start: 0; }
    &__btn-label:not(.is-always) { display: none; }
    .r-seg button .r-chart__btn-label { display: none; }
  }
}

@media (prefers-reduced-motion: reduce) {
  .r-chart,
  .r-seg button { transition: none; }
  .r-chart__skeleton i { animation: none; }
}
</style>
