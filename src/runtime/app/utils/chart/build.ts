import type { EChartsOption } from 'echarts'
import { escapeHtml, verticalGradient, withAlpha } from './format'
import type {
  RChartBuildResult,
  RChartDatum,
  RChartDisplay,
  RChartFormatContext,
  RChartIndicator,
  RChartLegendItem,
  RChartPoint,
  RChartSeries,
  RChartTable,
  RChartTokens,
  RChartType,
} from './types'

type Opt = Record<string, any>
type Fmt = (value: unknown, ctx?: RChartFormatContext) => string

export interface BuildInput {
  type: RChartType
  title?: string
  data?: number | RChartPoint[]
  series?: RChartSeries[]
  categories?: string[]
  yCategories?: string[]
  indicators?: RChartIndicator[]
  tokens: RChartTokens
  /** User colors; falls back to `tokens.palette`. */
  colors?: string[]
  display: RChartDisplay
  fmt: Fmt
  /** Add a dataZoom (cartesian only). */
  zoom: boolean
  /** A `#legend` slot replaces the ECharts legend. */
  legendSlot: boolean
  animate: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────────────────────
const isDatum = (p: unknown): p is RChartDatum =>
  typeof p === 'object' && p !== null && !Array.isArray(p) && 'value' in p
const valueOf = (p: RChartPoint) => (isDatum(p) ? p.value : p)
const asArray = (data: RChartSeries['data'] | undefined): RChartPoint[] =>
  Array.isArray(data) ? data : data === undefined || data === null ? [] : [data]
const finite = (list: unknown[]) => list.filter((v): v is number => typeof v === 'number' && Number.isFinite(v))

function seriesList(i: BuildInput): RChartSeries[] {
  if (i.series?.length) return i.series
  if (i.data !== undefined && i.data !== null && (Array.isArray(i.data) ? i.data.length : true)) {
    return [{ name: i.title || 'Series', data: i.data }]
  }
  return []
}

/** `{ name, value }` items for pie / doughnut / funnel — from `data`, or from series[0]. */
function namedItems(i: BuildInput): Array<{ name: string; value: number | null; color?: string }> {
  const source = Array.isArray(i.data) && i.data.length ? i.data : asArray(i.series?.[0]?.data)
  return source.map((p, idx) => {
    if (isDatum(p)) return { name: p.name ?? String(idx + 1), value: typeof p.value === 'number' ? p.value : null, color: p.color }
    const cat = i.categories?.[idx]
    return { name: cat ?? String(idx + 1), value: typeof p === 'number' ? p : null }
  })
}

const palette = (i: BuildInput) => (i.colors?.length ? i.colors : i.tokens.palette)

// ─────────────────────────────────────────────────────────────────────────────
// Shared option pieces
// ─────────────────────────────────────────────────────────────────────────────
function baseOption(i: BuildInput, colors: string[]): Opt {
  const { tokens: t, display: d } = i
  const legendTop = d.legend === 'top'
  return {
    color: colors,
    backgroundColor: 'transparent',
    textStyle: { fontFamily: t.font, color: t.muted },
    animation: i.animate,
    animationDuration: 600,
    animationEasing: 'cubicOut',
    animationDurationUpdate: 350,
    aria: { enabled: true, decal: { show: false } },
    tooltip:
      d.tooltip === false
        ? { show: false }
        : {
            confine: true,
            backgroundColor: t.surface,
            borderColor: t.border,
            borderWidth: 1,
            padding: [8, 12],
            textStyle: { color: t.text, fontSize: 12 },
            extraCssText: 'border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.14);',
            valueFormatter: (v: unknown) => i.fmt(v),
          },
    legend: {
      show: d.legend !== false && !i.legendSlot,
      type: 'scroll',
      [legendTop ? 'top' : 'bottom']: 0,
      icon: 'circle',
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 16,
      textStyle: { color: t.muted, fontSize: 12 },
      pageIconColor: t.text,
      pageIconInactiveColor: t.border,
      pageTextStyle: { color: t.muted },
      inactiveColor: t.border,
    },
  }
}

function gridBox(i: BuildInput, extra: { top?: number; bottom?: number } = {}) {
  const d = i.display
  const legendOn = d.legend !== false && !i.legendSlot
  const slider = i.zoom && d.zoomSlider
  return {
    left: 8,
    right: 16,
    top: (legendOn && d.legend === 'top' ? 44 : 20) + (d.yAxisName ? 18 : 0) + (extra.top ?? 0),
    bottom: (legendOn && d.legend !== 'top' ? 36 : 8) + (slider ? 34 : 0) + (extra.bottom ?? 0),
    // No `containLabel`: ECharts 6 keeps axis labels / names inside the canvas by itself
    // (and warns if `containLabel` is used without the legacy feature registered).
  }
}

function valueAxis(i: BuildInput, name?: string, opts: { split?: boolean; scale?: boolean } = {}): Opt {
  const { tokens: t, display: d } = i
  return {
    type: 'value',
    name,
    min: d.min,
    max: d.max,
    scale: opts.scale ?? false,
    nameTextStyle: { color: t.muted, align: 'left', fontSize: 11 },
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { show: (opts.split ?? true) && d.grid !== false, lineStyle: { color: t.border, type: 'dashed' } },
    axisLabel: { show: d.axisLabels !== false, color: t.muted, formatter: (v: number) => i.fmt(v, { axis: true }) },
  }
}

function categoryAxis(i: BuildInput, gap: boolean): Opt {
  const { tokens: t, display: d } = i
  return {
    type: 'category',
    data: i.categories ?? [],
    name: d.xAxisName,
    boundaryGap: gap,
    axisTick: { show: false },
    axisLine: { lineStyle: { color: t.border } },
    axisLabel: { show: d.axisLabels !== false, color: t.muted, hideOverlap: true, margin: 12 },
  }
}

function dataZoom(i: BuildInput): Opt[] | undefined {
  if (!i.zoom) return undefined
  const { tokens: t, display: d } = i
  const zooms: Opt[] = [
    { type: 'inside', xAxisIndex: 0, filterMode: 'filter', zoomOnMouseWheel: 'ctrl', moveOnMouseWheel: false, preventDefaultMouseMove: false },
  ]
  if (d.zoomSlider) {
    zooms.push({
      type: 'slider',
      xAxisIndex: 0,
      height: 18,
      bottom: d.legend !== false && !i.legendSlot && d.legend !== 'top' ? 38 : 8,
      borderColor: 'transparent',
      backgroundColor: withAlpha(t.muted, 0.08),
      fillerColor: withAlpha(t.accent, 0.16),
      dataBackground: { lineStyle: { color: t.border }, areaStyle: { color: withAlpha(t.muted, 0.1) } },
      handleStyle: { color: t.accent, borderColor: t.accent },
      moveHandleStyle: { color: t.accent },
      textStyle: { color: t.muted },
    })
  }
  return zooms
}

const labelOf = (i: BuildInput, position: string) => ({
  show: i.display.dataLabels === true,
  position,
  color: i.tokens.text,
  fontSize: 11,
  formatter: (p: { value: unknown }) => i.fmt(Array.isArray(p.value) ? p.value[p.value.length - 1] : p.value),
})

// ─────────────────────────────────────────────────────────────────────────────
// Families
// ─────────────────────────────────────────────────────────────────────────────
function buildCartesian(i: BuildInput): RChartBuildResult {
  const { tokens: t, display: d } = i
  const colors = palette(i)
  const list = seriesList(i)
  const stackedType = i.type === 'stacked'
  const defaultKind = i.type === 'bar' || stackedType ? 'bar' : i.type === 'area' ? 'area' : i.type === 'scatter' ? 'scatter' : 'line'

  const resolved = list.map((s, idx) => {
    const kind = s.type ?? (i.type === 'mixed' ? (idx === 0 ? 'bar' : 'line') : defaultKind)
    return { s, kind, color: s.color ?? colors[idx % colors.length]! }
  })

  const hasBar = resolved.some((r) => r.kind === 'bar')
  const scatterOnly = resolved.length > 0 && resolved.every((r) => r.kind === 'scatter') && !i.categories?.length
  const dual = resolved.some((r) => r.s.yAxisIndex === 1)

  const series = resolved.map(({ s, kind, color }) => {
    const data = asArray(s.data)
    const common: Opt = {
      name: s.name,
      data,
      yAxisIndex: s.yAxisIndex ?? 0,
      emphasis: { focus: 'series' },
      ...(s.stack || stackedType ? { stack: s.stack ?? 'total' } : {}),
    }
    if (kind === 'bar') {
      const grad = s.gradient ?? d.gradient ?? false
      const r = d.barRadius ?? 6
      return {
        ...common,
        type: 'bar',
        barMaxWidth: 36,
        itemStyle: { color: grad ? verticalGradient(color, 1, 0.55) : color, borderRadius: stackedType || s.stack ? 0 : [r, r, 0, 0] },
        label: labelOf(i, stackedType ? 'inside' : 'top'),
      }
    }
    if (kind === 'scatter') {
      return {
        ...common,
        type: 'scatter',
        symbolSize: (v: unknown) => (Array.isArray(v) && typeof v[2] === 'number' ? Math.min(40, Math.max(6, Math.sqrt(Math.abs(v[2])) * 2)) : 10),
        itemStyle: { color: withAlpha(color, 0.72), borderColor: color, borderWidth: 1 },
        label: labelOf(i, 'top'),
      }
    }
    const grad = s.gradient ?? d.gradient ?? true
    return {
      ...common,
      type: 'line',
      smooth: s.smooth ?? d.smooth ?? true,
      symbol: 'circle',
      symbolSize: 6,
      showSymbol: data.length <= 40,
      lineStyle: { width: 2.5, color },
      itemStyle: { color, borderColor: t.surface, borderWidth: 2 },
      areaStyle: kind === 'area' ? { color: grad ? verticalGradient(color) : withAlpha(color, 0.16) } : undefined,
      label: labelOf(i, 'top'),
    }
  })

  // `series[n].options` (raw ECharts options) wins over everything built above
  const finalSeries = series.map((s: Opt, idx) => ({ ...s, ...(resolved[idx]!.s.options ?? {}) }))

  const option: Opt = {
    ...baseOption(i, resolved.map((r) => r.color)),
    grid: gridBox(i),
    xAxis: scatterOnly ? valueAxis(i, d.xAxisName, { split: false, scale: true }) : categoryAxis(i, hasBar),
    yAxis: dual ? [valueAxis(i, d.yAxisName), { ...valueAxis(i, d.y2AxisName, { split: false }), position: 'right' }] : valueAxis(i, d.yAxisName, { scale: scatterOnly }),
    series: finalSeries,
    dataZoom: dataZoom(i),
  }
  option.tooltip = d.tooltip === false ? option.tooltip : {
    ...option.tooltip,
    trigger: scatterOnly ? 'item' : 'axis',
    axisPointer: { type: hasBar ? 'shadow' : 'line', shadowStyle: { color: withAlpha(t.accent, 0.08) }, lineStyle: { color: t.border }, crossStyle: { color: t.muted } },
  }

  const categories = i.categories ?? []
  const table: RChartTable = scatterOnly
    ? { columns: ['Series', 'X', 'Y'], rows: resolved.flatMap((r) => asArray(r.s.data).map((p) => { const v = valueOf(p) as unknown[]; return [r.s.name, (v?.[0] as number) ?? null, (v?.[1] as number) ?? null] })) }
    : { columns: ['Category', ...list.map((s) => s.name)], rows: categories.map((c, idx) => [c, ...list.map((s) => { const v = valueOf(asArray(s.data)[idx] as RChartPoint); return typeof v === 'number' ? v : null })]) }

  return {
    option: option as EChartsOption,
    table,
    legend: resolved.map((r) => ({ name: r.s.name, color: r.color })),
    hasData: resolved.some((r) => asArray(r.s.data).length > 0) && (scatterOnly || categories.length > 0),
  }
}

function buildCandlestick(i: BuildInput): RChartBuildResult {
  const { tokens: t } = i
  const list = seriesList(i)
  const first = list[0]
  const points = asArray(first?.data)
  const option: Opt = {
    ...baseOption(i, palette(i)),
    legend: { show: false },
    grid: gridBox(i),
    xAxis: categoryAxis(i, true),
    yAxis: valueAxis(i, i.display.yAxisName, { scale: true }),
    series: [{
      name: first?.name ?? i.title ?? 'Price',
      type: 'candlestick',
      data: points,
      itemStyle: { color: t.up, color0: t.down, borderColor: t.up, borderColor0: t.down },
      ...(first?.options ?? {}),
    }],
    dataZoom: dataZoom(i),
  }
  option.tooltip = i.display.tooltip === false ? option.tooltip : { ...option.tooltip, trigger: 'axis', axisPointer: { type: 'cross', lineStyle: { color: t.border } } }
  const cats = i.categories ?? []
  return {
    option: option as EChartsOption,
    table: { columns: ['Category', 'Open', 'Close', 'Low', 'High'], rows: cats.map((c, idx) => { const v = (valueOf(points[idx] as RChartPoint) as unknown[]) ?? []; return [c, ...[0, 1, 2, 3].map((k) => (typeof v[k] === 'number' ? (v[k] as number) : null))] }) },
    legend: [],
    hasData: points.length > 0 && cats.length > 0,
  }
}

function buildPieLike(i: BuildInput, kind: 'pie' | 'doughnut' | 'funnel'): RChartBuildResult {
  const { tokens: t, display: d } = i
  const colors = palette(i)
  const items = namedItems(i)
  const data = items.map((it) => ({ name: it.name, value: it.value, ...(it.color ? { itemStyle: { color: it.color } } : {}) }))
  const legendTop = d.legend === 'top'
  const legendOn = d.legend !== false && !i.legendSlot
  const percentTip = (p: Opt) => `${p.marker ?? ''} ${escapeHtml(p.name)} &nbsp;<b>${escapeHtml(i.fmt(p.value))}</b>${typeof p.percent === 'number' ? ` &nbsp;(${p.percent}%)` : ''}`

  let series: Opt
  if (kind === 'funnel') {
    series = {
      name: i.title ?? 'Funnel',
      type: 'funnel',
      left: '6%', width: '62%', top: legendOn && legendTop ? 44 : 16, bottom: legendOn && !legendTop ? 44 : 16,
      minSize: '14%', maxSize: '100%', sort: 'descending', gap: 3,
      itemStyle: { borderColor: t.surface, borderWidth: 2, borderRadius: 6 },
      label: { show: true, position: 'right', color: t.text, formatter: (p: Opt) => `${p.name}  ${i.fmt(p.value)}` },
      labelLine: { show: true, lineStyle: { color: t.border } },
      emphasis: { label: { fontWeight: 600 } },
      data,
    }
  } else {
    const ring = kind === 'doughnut'
    series = {
      name: i.title ?? 'Share',
      type: 'pie',
      radius: ring ? ['54%', '76%'] : ['0%', '74%'],
      center: ['50%', legendOn ? (legendTop ? '56%' : '45%') : '50%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: ring ? 8 : 6, borderColor: t.surface, borderWidth: 2 },
      label: d.dataLabels ? { show: true, color: t.text, formatter: '{b}: {d}%' } : { show: false, position: 'center' },
      labelLine: { show: Boolean(d.dataLabels), lineStyle: { color: t.border } },
      emphasis: {
        scale: true,
        scaleSize: 6,
        ...(ring && !d.dataLabels ? { label: { show: true, color: t.text, fontSize: 18, fontWeight: 600, formatter: (p: Opt) => `${p.name}\n${i.fmt(p.value)}` } } : {}),
      },
      data,
    }
  }

  const option: Opt = {
    ...baseOption(i, colors),
    series: [series],
  }
  if (d.tooltip !== false) option.tooltip = { ...option.tooltip, trigger: 'item', formatter: percentTip }

  return {
    option: option as EChartsOption,
    table: { columns: ['Name', 'Value'], rows: items.map((it) => [it.name, it.value]) },
    legend: items.map((it, idx) => ({ name: it.name, color: it.color ?? colors[idx % colors.length]! })),
    hasData: items.length > 0,
  }
}

function buildRadar(i: BuildInput): RChartBuildResult {
  const { tokens: t } = i
  const colors = palette(i)
  const list = seriesList(i)
  const values = list.map((s) => asArray(s.data).map((p) => (typeof valueOf(p) === 'number' ? (valueOf(p) as number) : 0)))
  const indicator: RChartIndicator[] = i.indicators?.length
    ? i.indicators
    : (i.categories ?? []).map((name, idx) => ({ name, max: Math.ceil(Math.max(1, ...finite(values.map((v) => v[idx] ?? 0))) * 1.15) }))

  const option: Opt = {
    ...baseOption(i, list.map((s, idx) => s.color ?? colors[idx % colors.length]!)),
    radar: {
      indicator,
      radius: i.display.legend !== false && !i.legendSlot ? '60%' : '68%',
      center: ['50%', i.display.legend === 'top' ? '56%' : '48%'],
      splitNumber: 4,
      axisName: { color: t.muted, fontSize: 12 },
      axisLine: { lineStyle: { color: t.border } },
      splitLine: { lineStyle: { color: t.border } },
      splitArea: { show: false },
    },
    series: [{
      type: 'radar',
      symbol: 'circle',
      symbolSize: 5,
      emphasis: { areaStyle: { opacity: 0.32 } },
      data: list.map((s, idx) => {
        const color = s.color ?? colors[idx % colors.length]!
        return { name: s.name, value: values[idx], itemStyle: { color }, lineStyle: { width: 2, color }, areaStyle: { color: withAlpha(color, 0.16) } }
      }),
    }],
  }
  if (i.display.tooltip !== false) option.tooltip = { ...option.tooltip, trigger: 'item' }

  return {
    option: option as EChartsOption,
    table: { columns: ['Indicator', ...list.map((s) => s.name)], rows: indicator.map((ind, idx) => [ind.name, ...values.map((v) => v[idx] ?? null)]) },
    legend: list.map((s, idx) => ({ name: s.name, color: s.color ?? colors[idx % colors.length]! })),
    hasData: list.length > 0 && indicator.length > 0,
  }
}

function buildGauge(i: BuildInput): RChartBuildResult {
  const { tokens: t, display: d } = i
  const colors = palette(i)
  const first = seriesList(i)[0]
  const source = typeof i.data === 'number' ? i.data : first?.data
  const pointRaw = Array.isArray(source) ? source[0] : source
  const datum = isDatum(pointRaw) ? pointRaw : undefined
  const raw = datum ? datum.value : (pointRaw as number | null | undefined)
  const value = typeof raw === 'number' ? raw : null
  const name = datum?.name ?? first?.name ?? i.title ?? ''
  const color = datum?.color ?? first?.color ?? colors[0]!

  const option: Opt = {
    color: colors,
    backgroundColor: 'transparent',
    textStyle: { fontFamily: t.font, color: t.muted },
    animation: i.animate,
    animationDuration: 800,
    aria: { enabled: true, decal: { show: false } },
    tooltip: { show: false },
    series: [{
      type: 'gauge',
      min: d.min ?? 0,
      max: d.max ?? 100,
      startAngle: 210,
      endAngle: -30,
      radius: '92%',
      center: ['50%', '60%'],
      progress: { show: true, width: 16, roundCap: true, itemStyle: { color } },
      axisLine: { roundCap: true, lineStyle: { width: 16, color: [[1, withAlpha(t.muted, 0.18)]] } },
      pointer: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      anchor: { show: false },
      title: { show: Boolean(name), offsetCenter: [0, '46%'], color: t.muted, fontSize: 13 },
      detail: { valueAnimation: true, offsetCenter: [0, '6%'], fontSize: 32, fontWeight: 600, color: t.text, formatter: (v: number) => i.fmt(v) },
      data: [{ value: value ?? 0, name }],
      ...(first?.options ?? {}),
    }],
  }

  return {
    option: option as EChartsOption,
    table: { columns: ['Name', 'Value'], rows: [[name || 'Value', value]] },
    legend: [],
    hasData: value !== null,
  }
}

function buildHeatmap(i: BuildInput): RChartBuildResult {
  const { tokens: t, display: d } = i
  const first = seriesList(i)[0]
  const points = asArray(first?.data)
  const triples = points.map((p) => valueOf(p) as unknown[])
  const values = finite(triples.map((p) => p?.[2]))
  const min = d.min ?? (values.length ? Math.min(...values) : 0)
  const max = d.max ?? (values.length ? Math.max(...values) : 1)
  const xs = i.categories ?? []
  const ys = i.yCategories ?? []

  const axis = (data: string[], name?: string): Opt => ({
    type: 'category', data, name, splitArea: { show: false },
    axisTick: { show: false }, axisLine: { show: false },
    axisLabel: { show: d.axisLabels !== false, color: t.muted, hideOverlap: true },
  })

  const option: Opt = {
    ...baseOption(i, palette(i)),
    legend: { show: false },
    grid: { ...gridBox(i), bottom: 64 },
    xAxis: axis(xs, d.xAxisName),
    yAxis: axis(ys, d.yAxisName),
    visualMap: {
      min, max, calculable: false, orient: 'horizontal', left: 'center', bottom: 4,
      itemWidth: 12, itemHeight: 140, textStyle: { color: t.muted },
      formatter: (v: number) => i.fmt(v, { axis: true }),
      inRange: { color: [withAlpha(t.accent, 0.08), t.accent] },
    },
    series: [{
      name: first?.name ?? i.title ?? 'Value',
      type: 'heatmap',
      data: points,
      label: { show: d.dataLabels === true, color: t.text, formatter: (p: Opt) => i.fmt(p.value?.[2]) },
      itemStyle: { borderRadius: 4, borderColor: t.surface, borderWidth: 2 },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: withAlpha(t.accent, 0.4) } },
      ...(first?.options ?? {}),
    }],
  }
  if (d.tooltip !== false) {
    option.tooltip = {
      ...option.tooltip, trigger: 'item',
      formatter: (p: Opt) => `${escapeHtml(xs[p.value?.[0]] ?? p.value?.[0])} · ${escapeHtml(ys[p.value?.[1]] ?? p.value?.[1])}: <b>${escapeHtml(i.fmt(p.value?.[2]))}</b>`,
    }
  }

  return {
    option: option as EChartsOption,
    table: { columns: ['X', 'Y', 'Value'], rows: triples.map((p) => [xs[p?.[0] as number] ?? (p?.[0] as number) ?? null, ys[p?.[1] as number] ?? (p?.[1] as number) ?? null, (p?.[2] as number) ?? null]) },
    legend: [],
    hasData: points.length > 0 && xs.length > 0 && ys.length > 0,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry
// ─────────────────────────────────────────────────────────────────────────────
export function buildChart(i: BuildInput): RChartBuildResult {
  switch (i.type) {
    case 'pie': return buildPieLike(i, 'pie')
    case 'doughnut': return buildPieLike(i, 'doughnut')
    case 'funnel': return buildPieLike(i, 'funnel')
    case 'radar': return buildRadar(i)
    case 'gauge': return buildGauge(i)
    case 'heatmap': return buildHeatmap(i)
    case 'candlestick': return buildCandlestick(i)
    default: return buildCartesian(i)
  }
}

export type { RChartLegendItem }
