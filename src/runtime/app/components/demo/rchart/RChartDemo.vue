<template>
    <RContent class="rcd">
      <h1 class="rcd__title">RChart examples</h1>

      <div class="rcd__grid">
        <!-- 1 ▸ Line · periods · refresh · full toolbar ───────────────────── -->
        <RChart
          v-model:period="period"
          class="rcd__wide"
          type="area"
          title="Revenue"
          subtitle="Last 12 months"
          icon="i-lucide-trending-up"
          currency="USD"
          :loading="loading"
          :categories="months"
          :series="revenueSeries"
          :periods="periods"
          :toolbar="{ typeSwitch: true, zoom: true, exportPng: true, exportSvg: true, exportData: true, fullscreen: true }"
          :display="{ zoomSlider: true }"
          export-name="revenue"
          @refresh="reload"
          @period-change="log('period-change', $event.value)"
          @type-change="log('type-change', $event)"
          @zoom="log('zoom', `${$event.start.toFixed(0)}–${$event.end.toFixed(0)}%`)"
          @export="log('export', `${$event.format} ${$event.success ? 'ok' : 'failed'}`)"
          @fullscreen="log('fullscreen', $event)"
          @chart-click="log('chart-click', `${$event.seriesName} · ${$event.name}`)"
          @legend-change="log('legend-change', $event.name)"
          @ready="log('ready')"
        />

        <!-- 2 ▸ Bar / stacked with a switcher ─────────────────────────────── -->
        <RChart
          type="bar"
          title="Orders by channel"
          icon="i-lucide-shopping-bag"
          :categories="weekdays"
          :series="orderSeries"
          :toolbar="{ typeSwitch: ['bar', 'stacked', 'line'] }"
          :display="{ dataLabels: false, legend: 'top' }"
        />

        <!-- 3 ▸ Doughnut + custom #legend / #footer ───────────────────────── -->
        <RChart type="doughnut" title="Traffic sources" subtitle="Share of sessions" unit="%" :data="traffic" :toolbar="{ typeSwitch: true }">
          <template #legend="{ items, toggle }">
            <ul class="rcd__legend">
              <li v-for="it in items" :key="it.name">
                <button type="button" :class="{ 'is-off': !it.visible }" @click="toggle(it.name)">
                  <i :style="{ background: it.color }" /> {{ it.name }}
                </button>
              </li>
            </ul>
          </template>
          <template #footer>Click a source to hide it from the chart.</template>
        </RChart>

        <!-- 4 ▸ Mixed: bars + line on a secondary axis ────────────────────── -->
        <RChart
          type="mixed"
          title="Signups vs. conversion"
          :categories="months.slice(0, 8)"
          :series="mixedSeries"
          :display="{ yAxisName: 'Signups', y2AxisName: 'Conversion %' }"
        />

        <!-- 5 ▸ Custom header: slots, centered, stacked, glass ────────────── -->
        <RChart
          type="gauge"
          variant="glass"
          :header="{ align: 'center', layout: 'stacked', iconStyle: 'solid', bordered: true }"
          title="Storage"
          :height="240"
          unit="%"
          :data="[{ name: 'Used', value: 68 }]"
          :display="{ max: 100 }"
        >
          <template #icon><UIcon name="i-lucide-hard-drive" /></template>
          <template #subtitle><p class="rcd__muted">68 GB of 100 GB</p></template>
          <template #header-end><UBadge color="warning" variant="subtle" label="Almost full" /></template>
          <template #footer>Upgrade your plan to add more storage.</template>
        </RChart>

        <!-- 6 ▸ Toolbar actions + #filters ────────────────────────────────── -->
        <RChart
          type="line"
          title="Active users"
          :categories="weekdays"
          :series="[{ name: filter, data: filterData }]"
          :toolbar="{ actions: [{ key: 'share', label: 'Share', icon: 'i-lucide-share-2' }, { key: 'alert', label: 'Set alert', icon: 'i-lucide-bell' }] }"
          @action="log('action', $event.key)"
        >
          <template #filters>
            <label class="rcd__filter">
              Segment
              <select v-model="filter">
                <option>Web</option>
                <option>Mobile</option>
                <option>Tablet</option>
              </select>
            </label>
          </template>
        </RChart>

        <!-- 7 ▸ Native ECharts options (merged over the defaults, yours win) ─ -->
        <RChart
          type="line"
          title="Advanced options"
          subtitle="Custom colors, dashed line, rotated labels, own tooltip"
          :categories="months"
          :series="[{ name: 'Sessions', data: sessions }, { name: 'Target', data: sessions.map(() => 900) }]"
          :colors="['#8b5cf6', '#14b8a6']"
          :options="advancedOptions"
        />

        <!-- 8 ▸ States ─────────────────────────────────────────────────────── -->
        <RChart type="bar" title="Empty state" :categories="[]" :series="[]" />
        <RChart type="bar" title="Error state" error="The analytics service did not respond." @refresh="log('refresh', 'retry from error')" />
        <RChart type="bar" title="Loading state" loading />
      </div>

      <h2 class="rcd__subtitle">Other types</h2>
      <div class="rcd__grid">
        <RChart type="funnel" title="Checkout funnel" :data="funnel" />
        <RChart type="radar" title="Skills" :indicators="radarIndicators" :series="radarSeries" />
        <RChart type="scatter" title="Spend vs. orders" :series="scatterSeries" :display="{ xAxisName: 'Spend', yAxisName: 'Orders' }" />
        <RChart type="heatmap" title="Activity by hour" :categories="hours" :y-categories="weekdays" :series="[{ name: 'Visits', data: heat }]" :display="{ dataLabels: true }" />
        <RChart class="rcd__wide" type="candlestick" title="ACME stock" :categories="days" :series="[{ name: 'ACME', data: candles }]" :toolbar="{ zoom: true }" />
      </div>

      <RCard class="rcd__log">
        <strong>Events</strong>
        <ol><li v-for="(e, i) in events" :key="i"><b>{{ e.name }}</b> {{ e.detail }}</li></ol>
      </RCard>
    </RContent>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { RChartIndicator, RChartPeriod, RChartPoint, RChartSeries } from '~/utils/chart/types'

// ── Demo data (deterministic) ────────────────────────────────────────────────
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const hours = ['06', '09', '12', '15', '18', '21']
const wave = (n: number, base: number, amp: number, phase = 0) =>
  Array.from({ length: n }, (_, i) => Math.round(base + Math.sin(i * 0.9 + phase) * amp + i * (amp / 6)))

const periods: RChartPeriod[] = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '12m', label: '12M' },
]
const period = ref('12m')
const loading = ref(false)

const revenueSeries = computed<RChartSeries[]>(() => [
  { name: 'Online', data: wave(12, 4200, 900) },
  { name: 'In store', data: wave(12, 2600, 500, 1.4) },
])
const orderSeries: RChartSeries[] = [
  { name: 'Web', data: wave(7, 120, 30) },
  { name: 'Mobile', data: wave(7, 90, 24, 1) },
  { name: 'Partners', data: wave(7, 40, 12, 2) },
]
const traffic = [
  { name: 'Search', value: 46 },
  { name: 'Direct', value: 24 },
  { name: 'Social', value: 18 },
  { name: 'Email', value: 12 },
]
const mixedSeries: RChartSeries[] = [
  { name: 'Signups', type: 'bar', data: wave(8, 320, 80) },
  { name: 'Conversion %', type: 'line', yAxisIndex: 1, data: [3.1, 3.4, 3.2, 3.9, 4.2, 4.0, 4.6, 4.9] },
]
const sessions = wave(12, 700, 160)

const filter = ref('Web')
const filterData = computed(() => wave(7, filter.value === 'Web' ? 800 : filter.value === 'Mobile' ? 600 : 200, 140))

const funnel = [
  { name: 'Visits', value: 12000 },
  { name: 'Product views', value: 7400 },
  { name: 'Add to cart', value: 3100 },
  { name: 'Checkout', value: 1500 },
  { name: 'Paid', value: 980 },
]
const radarIndicators: RChartIndicator[] = ['Speed', 'Quality', 'Support', 'Price', 'Docs'].map((name) => ({ name, max: 100 }))
const radarSeries: RChartSeries[] = [
  { name: 'Us', data: [82, 90, 76, 64, 88] },
  { name: 'Market', data: [70, 72, 68, 80, 60] },
]
const scatterSeries: RChartSeries[] = [
  { name: 'Customers', data: Array.from({ length: 30 }, (_, i): RChartPoint => [Math.round(100 + i * 18 + Math.sin(i) * 60), Math.round(2 + i * 0.6 + Math.cos(i * 1.7) * 3), 20 + (i % 7) * 12]) },
]
const heat = weekdays.flatMap((_, y) => hours.map((__, x): RChartPoint => [x, y, Math.round(20 + Math.abs(Math.sin((x + 1) * (y + 2))) * 80)]))
const days = Array.from({ length: 20 }, (_, i) => `Oct ${i + 1}`)
const candles = days.map((_, i): RChartPoint => {
  const open = 100 + Math.sin(i / 2) * 8 + i
  const close = open + Math.sin(i * 1.3) * 5
  return [Math.round(open), Math.round(close), Math.round(Math.min(open, close) - 3), Math.round(Math.max(open, close) + 3)] // open, close, low, high
})

// Anything ECharts supports. Merged over RChart's defaults; yours wins. `series` merges by index.
// (markLine / toolbox etc. need their component listed in nuxt.config → echarts.components)
const advancedOptions = {
  grid: { left: 24 },
  xAxis: { axisLabel: { rotate: 35 } },
  tooltip: { axisPointer: { type: 'cross' } },
  series: [
    { smooth: false, lineStyle: { width: 3 } },
    { lineStyle: { type: 'dashed', width: 2 }, symbol: 'none', emphasis: { disabled: true } },
  ],
}

// ── Events ────────────────────────────────────────────────────────────────────
const events = ref<Array<{ name: string; detail: string }>>([])
const log = (name: string, detail: unknown = '') => {
  events.value = [{ name, detail: String(detail) }, ...events.value].slice(0, 12)
}

function reload() {
  log('refresh', 'reloading…')
  loading.value = true
  setTimeout(() => (loading.value = false), 1200)
}
</script>

<style lang="scss">
.rcd {
  display: flex;
  flex-direction: column;
  gap: var(--sp-5, 1.25rem);
  padding: 0;

  &__title { margin: 0; font-size: 1.5rem; font-weight: 700; color: var(--c-text); }
  &__subtitle { margin: var(--sp-4, 1rem) 0 0; font-size: 1.125rem; font-weight: 600; color: var(--c-text); }
  &__muted { margin: 0; font-size: 0.8125rem; color: var(--c-muted); }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 26rem), 1fr));
    gap: var(--sp-4, 1rem);
  }

  &__wide { grid-column: 1 / -1; }

  &__legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1rem;
    margin: 0;
    padding: 0;
    list-style: none;

    button {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.125rem 0.25rem;
      font: inherit;
      font-size: 0.8125rem;
      color: var(--c-text);
      background: none;
      border: 0;
      border-radius: var(--r-sm, 8px);
      cursor: pointer;

      &.is-off { color: var(--c-muted); text-decoration: line-through; }
      &:focus-visible { outline: 2px solid var(--c-accent); }
    }

    i { width: 0.5rem; height: 0.5rem; border-radius: 50%; }
  }

  &__filter {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: var(--c-muted);

    select {
      padding: 0.25rem 0.5rem;
      font: inherit;
      border: 1px solid var(--c-border);
      border-radius: var(--r-sm, 8px);
      color: var(--c-text);
      background: var(--c-surface);
    }
  }

  &__log {
    font-size: 0.8125rem;

    ol { margin: 0.5rem 0 0; padding: 0; list-style: none; color: var(--c-muted); }
    li { padding: 0.125rem 0; }
    b { color: var(--c-accent); }
  }
}
</style>
