<template>
    <RContent class="rcd">
      <header class="rcd__head">
        <div>
          <h1 class="rcd__title">RChart — every usage</h1>
          <p class="rcd__muted">Playground first, then one tab per area of the API. Events from every example land in the log below.</p>
        </div>
        <nav class="rcd__tabs" aria-label="Demo sections">
          <button v-for="t in TABS" :key="t.id" type="button" :class="{ 'is-active': tab === t.id }" :aria-pressed="tab === t.id" @click="tab = t.id">
            {{ t.label }}
          </button>
        </nav>
      </header>

      <!-- ═══ 1 · Playground ═══════════════════════════════════════════════ -->
      <section v-if="tab === 'playground'" class="rcd__playground">
        <RCard class="rcd__controls">
          <fieldset>
            <legend>Chart</legend>
            <label>type
              <select v-model="pg.type">
                <option v-for="t in ALL_TYPES" :key="t">{{ t }}</option>
              </select>
            </label>
            <label>variant
              <select v-model="pg.variant"><option>card</option><option>outline</option><option>flat</option><option>glass</option></select>
            </label>
            <label>theme
              <select v-model="pg.theme"><option>auto</option><option>light</option><option>dark</option></select>
            </label>
            <label>height <input v-model.number="pg.height" type="range" min="180" max="560" step="20" /> {{ pg.height }}</label>
            <label>state
              <select v-model="pg.state"><option>ready</option><option>loading</option><option>error</option><option>empty</option></select>
            </label>
          </fieldset>

          <fieldset>
            <legend>Header</legend>
            <label>align <select v-model="pg.header.align"><option>start</option><option>center</option><option>end</option></select></label>
            <label>layout <select v-model="pg.header.layout"><option>inline</option><option>stacked</option></select></label>
            <label>spacing <select v-model="pg.header.spacing"><option>sm</option><option>md</option><option>lg</option></select></label>
            <label>iconStyle <select v-model="pg.header.iconStyle"><option>soft</option><option>solid</option><option>plain</option></select></label>
            <label><input v-model="pg.header.bordered" type="checkbox" /> bordered</label>
            <label><input v-model="pg.header.visible" type="checkbox" /> visible</label>
          </fieldset>

          <fieldset>
            <legend>display</legend>
            <label v-for="k in DISPLAY_FLAGS" :key="k"><input v-model="pg.display[k]" type="checkbox" /> {{ k }}</label>
            <label>legend <select v-model="pg.legend"><option :value="true">bottom</option><option value="top">top</option><option :value="false">off</option></select></label>
          </fieldset>

          <fieldset>
            <legend>toolbar</legend>
            <label v-for="k in TOOLBAR_FLAGS" :key="k"><input v-model="pg.toolbar[k]" type="checkbox" /> {{ k }}</label>
          </fieldset>
        </RCard>

        <RChart
          v-model:type="pg.type"
          :title="`${pg.type} chart`"
          subtitle="Change anything on the left"
          description="This card is driven entirely by the controls — props, display, header and toolbar objects."
          icon="i-lucide-sliders-horizontal"
          :variant="pg.variant as any"
          :theme="pg.theme as any"
          :height="pg.height"
          :loading="pg.state === 'loading'"
          :error="pg.state === 'error' ? 'Simulated error message' : null"
          :header="pg.header"
          :display="{ ...pg.display, legend: pg.legend }"
          :toolbar="pg.toolbar"
          :periods="PERIODS"
          v-bind="pg.state === 'empty' ? {} : sample"
          @refresh="reload"
          @chart-click="log('chart-click', pt($event))"
          @type-change="log('type-change', $event)"
          @export="log('export', `${$event.format} ${$event.success ? 'ok' : 'failed'}`)"
        />
      </section>

      <!-- ═══ 2 · All 13 types ════════════════════════════════════════════ -->
      <section v-else-if="tab === 'types'" class="rcd__grid">
        <RChart type="line" title="line" :categories="months" :series="lineSeries" />
        <RChart type="area" title="area" :categories="months" :series="lineSeries" />
        <RChart type="bar" title="bar" :categories="weekdays" :series="barSeries" />
        <RChart type="stacked" title="stacked" :categories="weekdays" :series="barSeries" />
        <RChart type="mixed" title="mixed (secondary axis)" :categories="months.slice(0, 8)" :series="mixedSeries" :display="{ yAxisName: 'Signups', y2AxisName: 'Conversion %' }" />
        <RChart type="scatter" title="scatter" :series="scatterSeries" :display="{ xAxisName: 'Spend', yAxisName: 'Orders' }" />
        <RChart type="pie" title="pie" :data="traffic" />
        <RChart type="doughnut" title="doughnut" :data="traffic" />
        <RChart type="funnel" title="funnel" :data="funnel" />
        <RChart type="radar" title="radar" :indicators="radarIndicators" :series="radarSeries" />
        <RChart type="gauge" title="gauge" unit="%" :data="68" />
        <RChart type="heatmap" title="heatmap" :categories="hours" :y-categories="weekdays" :series="[{ name: 'Visits', data: heat }]" :display="{ dataLabels: true }" />
        <RChart class="rcd__wide" type="candlestick" title="candlestick" :categories="days" :series="[{ name: 'ACME', data: candles }]" :toolbar="{ zoom: true }" />
      </section>

      <!-- ═══ 3 · Header ══════════════════════════════════════════════════ -->
      <section v-else-if="tab === 'header'" class="rcd__grid">
        <RChart v-for="v in (['card', 'outline', 'flat', 'glass'] as const)" :key="v" :variant="v" :title="`variant: ${v}`" subtitle="subtitle" icon="i-lucide-palette" :height="180" type="line" :categories="weekdays" :series="oneSeries" :toolbar="false" />

        <RChart title="align: center · layout: stacked · solid icon · bordered" subtitle="Header settings" description="Description text sits under the subtitle." icon="i-lucide-layout-template" :header="{ align: 'center', layout: 'stacked', iconStyle: 'solid', bordered: true }" :height="180" type="bar" :categories="weekdays" :series="oneSeries" />
        <RChart title="align: end · spacing: lg · plain icon" icon="i-lucide-align-right" :header="{ align: 'end', spacing: 'lg', iconStyle: 'plain', titleTag: 'h2' }" :height="180" type="bar" :categories="weekdays" :series="oneSeries" />
        <RChart title="spacing: sm · custom class/style" :header="{ spacing: 'sm', class: 'rcd__accent', style: { background: 'color-mix(in srgb, var(--c-accent) 8%, transparent)' } }" :height="180" type="line" :categories="weekdays" :series="oneSeries" />
        <RChart title="header hidden" :header="{ visible: false }" :height="180" type="line" :categories="weekdays" :series="oneSeries" />
        <RChart title="icon=false" :icon="false" subtitle="Icon hidden even though a name is passed" :height="180" type="line" :categories="weekdays" :series="oneSeries" />
      </section>

      <!-- ═══ 4 · Toolbar, periods, filters, actions ═════════════════════ -->
      <section v-else-if="tab === 'toolbar'" class="rcd__grid">
        <RChart
          v-model:period="period"
          class="rcd__wide"
          type="area"
          title="Everything on"
          subtitle="typeSwitch · zoom (+slider) · PNG / SVG / CSV · fullscreen · reload"
          icon="i-lucide-wrench"
          currency="USD"
          export-name="everything-on"
          :loading="loading"
          :categories="months"
          :series="lineSeries"
          :periods="PERIODS"
          :toolbar="{ typeSwitch: true, zoom: true, exportPng: true, exportSvg: true, exportData: true, fullscreen: true }"
          :display="{ zoomSlider: true }"
          @refresh="reload"
          @period-change="log('period-change', $event.value)"
          @zoom="log('zoom', `${$event.start.toFixed(0)}–${$event.end.toFixed(0)}%`)"
          @fullscreen="log('fullscreen', $event)"
          @export="log('export', `${$event.format} ${$event.success ? 'ok' : 'failed'}`)"
        />
        <RChart title="typeSwitch: explicit list" type="bar" :categories="weekdays" :series="barSeries" :toolbar="{ typeSwitch: ['bar', 'stacked', 'line', 'area'] }" />
        <RChart title="typeSwitch: pie family" type="doughnut" :data="traffic" :toolbar="{ typeSwitch: true }" />
        <RChart title="Custom actions + #filters" type="line" :categories="weekdays" :series="[{ name: segment, data: segmentData }]" :toolbar="{ actions: [{ key: 'share', label: 'Share', icon: 'i-lucide-share-2' }, { key: 'alert', label: 'Set alert', icon: 'i-lucide-bell' }, { key: 'busy', label: 'Syncing', icon: 'i-lucide-cloud', loading: true }, { key: 'off', label: 'Disabled', disabled: true }] }" @action="log('action', $event.key)">
          <template #filters>
            <label class="rcd__inline">Segment
              <select v-model="segment"><option>Web</option><option>Mobile</option><option>Tablet</option></select>
            </label>
          </template>
        </RChart>
        <RChart title="toolbar: false (no reload either)" type="line" :categories="weekdays" :series="oneSeries" :toolbar="false" />
        <RChart title="refresh only: toolbar.refresh=false" type="line" :categories="weekdays" :series="oneSeries" :toolbar="{ refresh: false, fullscreen: true }" />
      </section>

      <!-- ═══ 5 · Formatting ══════════════════════════════════════════════ -->
      <section v-else-if="tab === 'format'" class="rcd__grid">
        <RChart title="unit: '%'" type="bar" unit="%" :categories="weekdays" :series="[{ name: 'Conversion', data: [3.1, 4.2, 3.8, 5.0, 4.6, 2.9, 3.3] }]" :display="{ dataLabels: true }" />
        <RChart title="currency: USD (en-US)" type="bar" currency="USD" locale="en-US" :categories="months.slice(0, 6)" :series="[{ name: 'Revenue', data: [4200, 5100, 3900, 6100, 7300, 6800] }]" :display="{ dataLabels: true }" />
        <RChart title="currency: KHR · locale: km" type="bar" currency="KHR" locale="km" :categories="months.slice(0, 6)" :series="[{ name: 'ចំណូល', data: [4200000, 5100000, 3900000, 6100000, 7300000, 6800000] }]" :display="{ dataLabels: true }" :labels="{ refresh: 'ផ្ទុកឡើងវិញ' }" />
        <RChart title="decimals: 1" type="line" :decimals="1" :categories="weekdays" :series="[{ name: 'Load', data: [0.52, 0.71, 0.64, 0.93, 0.8, 0.45, 0.38] }]" :display="{ dataLabels: true }" />
        <RChart title="valueFormatter (axis vs tooltip)" type="line" :categories="weekdays" :series="[{ name: 'Bytes', data: [1.2e6, 3.4e6, 2.2e6, 5.1e6, 4.4e6, 2.8e6, 1.9e6] }]" :value-formatter="fmtBytes" />
        <RChart title="colors + gradient off + smooth off" type="area" :colors="['#8b5cf6', '#14b8a6']" :categories="weekdays" :series="barSeries.slice(0, 2)" :display="{ gradient: false, smooth: false }" />
        <RChart title="series: per-series gradient / smooth / stack" type="mixed" :categories="weekdays" :series="[{ name: 'Bars', type: 'bar', gradient: true, data: wave(7, 90, 20) }, { name: 'Line', type: 'area', smooth: false, color: '#14b8a6', data: wave(7, 60, 15, 1) }]" />
      </section>

      <!-- ═══ 6 · options + passthrough props ═════════════════════════════ -->
      <section v-else-if="tab === 'options'" class="rcd__grid">
        <RChart
          title="options: merged over defaults (yours wins)"
          subtitle="grid, rotated labels, cross pointer, series merged by index"
          type="line"
          :categories="months"
          :series="[{ name: 'Sessions', data: sessions }, { name: 'Target', data: sessions.map(() => 900) }]"
          :options="{
            grid: { left: 24 },
            xAxis: { axisLabel: { rotate: 35 } },
            tooltip: { axisPointer: { type: 'cross' } },
            series: [{ smooth: false, lineStyle: { width: 3 } }, { lineStyle: { type: 'dashed', width: 2 }, symbol: 'none' }],
          }"
        />
        <RChart
          title="series[n].options + markLine / markPoint"
          type="bar"
          :categories="weekdays"
          :series="[{ name: 'Orders', data: wave(7, 120, 30), options: { markLine: { data: [{ type: 'average', name: 'Avg' }] }, markPoint: { data: [{ type: 'max' }, { type: 'min' }] } } }]"
        />
        <RChart title="options.title / dataset (own ECharts title)" type="line" :categories="weekdays" :series="oneSeries" :options="{ title: { text: 'Native ECharts title', left: 'center', textStyle: { fontSize: 12 } }, grid: { top: 48 } }" />
        <RChart title="initOptions: svg renderer" subtitle="needs renderer: ['canvas','svg'] in nuxt.config" type="line" :categories="weekdays" :series="oneSeries" :init-options="{ renderer: 'svg' }" />
        <RChart title="updateOptions: notMerge" type="line" :categories="weekdays" :series="oneSeries" :update-options="{ notMerge: true }" />
        <RChart title="autoresize: { throttle: 200 }" type="line" :categories="weekdays" :series="oneSeries" :autoresize="{ throttle: 200 }" />
        <RChart title="width / height as strings" type="line" width="min(100%, 28rem)" height="14rem" :categories="weekdays" :series="oneSeries" aria-label="Weekly line chart" />
        <RChart title="group: linked tooltips (A)" group="demo-linked" type="line" :categories="weekdays" :series="oneSeries" />
        <RChart title="group: linked tooltips (B)" group="demo-linked" type="bar" :categories="weekdays" :series="[{ name: 'Orders', data: wave(7, 50, 15) }]" />
        <RChart ref="manualChart" title="manualUpdate: drive it yourself" type="line" manual-update :categories="weekdays" :series="oneSeries">
          <template #footer>
            <button type="button" class="rcd__btn" @click="pushManual">setOption({ series })</button>
          </template>
        </RChart>
      </section>

      <!-- ═══ 7 · Layout slots ════════════════════════════════════════════ -->
      <section v-else-if="tab === 'slots'" class="rcd__grid">
        <RChart class="rcd__wide" type="doughnut" :data="traffic" :periods="PERIODS" title="ignored (title slot used)" icon="i-lucide-x" :toolbar="{ typeSwitch: true, exportData: true }">
          <template #header-start><UBadge label="header-start" variant="subtle" color="neutral" /></template>
          <template #icon><UIcon name="i-lucide-star" /></template>
          <template #title><h3 class="rcd__slot">#title slot</h3></template>
          <template #subtitle><p class="rcd__muted">#subtitle slot</p></template>
          <template #header-filter><span class="rcd__chip">#header-filter replaces the periods</span></template>
          <template #header-end><UBadge label="header-end" variant="subtle" /></template>
          <template #header-actions>
            <UButton icon="i-lucide-refresh-cw" size="sm" variant="soft" label="#header-actions (replaces reload)" />
          </template>
          <template #filters><span class="rcd__chip">#filters</span></template>
          <template #toolbar="{ type, refresh }">
            <span class="rcd__chip">#toolbar · type={{ type }}</span>
            <UButton size="xs" variant="outline" label="refresh()" @click="refresh" />
          </template>
          <template #legend="{ items, toggle }">
            <ul class="rcd__legend">
              <li v-for="it in items" :key="it.name">
                <button type="button" :class="{ 'is-off': !it.visible }" @click="toggle(it.name)"><i :style="{ background: it.color }" /> {{ it.name }}</button>
              </li>
            </ul>
          </template>
          <template #footer="{ state, period }">#footer · state={{ state }} · period={{ period }}</template>
        </RChart>

        <RChart title="#loading slot" loading type="bar">
          <template #loading><div class="rcd__center"><UIcon name="i-lucide-loader-circle" class="rcd__spin" /> Custom loading…</div></template>
        </RChart>
        <RChart title="#error slot" error="Service unavailable" type="bar" @refresh="log('refresh', 'retry')">
          <template #error="{ message, retry }"><div class="rcd__center">{{ message }} <UButton size="xs" variant="outline" label="Retry" @click="retry" /></div></template>
        </RChart>
        <RChart title="#empty slot" type="bar" :categories="[]" :series="[]">
          <template #empty><div class="rcd__center"><UIcon name="i-lucide-inbox" /> Nothing here yet</div></template>
        </RChart>
        <RChart title="#chart slot (replaces body + states)" type="bar">
          <template #chart="{ state, option }"><div class="rcd__center">Your own content · state={{ state }} · series={{ (option as any).series?.length ?? 0 }}</div></template>
        </RChart>
      </section>

      <!-- ═══ 8 · Forwarded slots ═════════════════════════════════════════ -->
      <section v-else-if="tab === 'forwarded'" class="rcd__grid">
        <RChart title="#tooltip (axis → params is an array)" type="bar" :categories="weekdays" :series="barSeries" :display="{ legend: 'top' }">
          <template #tooltip="params">
            <div class="rcd__tip">
              <strong>{{ params[0]?.axisValueLabel }}</strong>
              <div v-for="p in params" :key="p.seriesName"><span v-html="p.marker" /> {{ p.seriesName }}: <b>{{ p.value }}</b></div>
              <em>Total {{ params.reduce((s: number, p: any) => s + p.value, 0) }}</em>
            </div>
          </template>
        </RChart>

        <RChart title="#tooltip on a pie (item → params is an object)" type="pie" :data="traffic">
          <template #tooltip="p"><div class="rcd__tip"><strong>{{ p.name }}</strong> {{ p.value }} ({{ p.percent }}%)</div></template>
        </RChart>

        <RChart title="#tooltip-series-0-data-2 (one data point)" type="bar" :categories="weekdays" :series="[{ name: 'Orders', data: [120, 98, { value: 160, name: 'Wed' }, 140, 110, 90, 70] }]">
          <template #tooltip-series-0-data-2="p"><div class="rcd__tip"><strong>★ Best day</strong> {{ p.value }} orders</div></template>
        </RChart>

        <RChart title="#graphic (needs GraphicComponent)" type="line" :categories="months" :series="[{ name: 'Sessions', data: sessions }]">
          <template #graphic>
            <GGroup :x="badge.x" :y="badge.y">
              <GRect :width="104" :height="26" :r="13" fill="#ff8c42" draggable @drag="onBadgeDrag" />
              <GText :x="14" :y="6" text="Drag me" text-fill="#fff" />
            </GGroup>
          </template>
        </RChart>

        <RChart
          title="#dataView (needs ToolboxComponent)"
          type="bar"
          :categories="weekdays"
          :series="barSeries"
          :options="{ toolbox: { right: 12, feature: { dataView: { readOnly: true, title: 'Data', lang: ['Data', 'Close', 'Refresh'] } } } }"
          @dataview-changed="log('dataview-changed')"
        >
          <template #dataView="option">
            <table class="rcd__table">
              <thead><tr><th /><th v-for="s in option.series" :key="s.name">{{ s.name }}</th></tr></thead>
              <tbody>
                <tr v-for="(day, i) in option.xAxis[0].data" :key="day"><th>{{ day }}</th><td v-for="s in option.series" :key="s.name">{{ s.data[i] }}</td></tr>
              </tbody>
            </table>
          </template>
        </RChart>
      </section>

      <!-- ═══ 9 · Methods ═════════════════════════════════════════════════ -->
      <section v-else-if="tab === 'methods'" class="rcd__grid">
        <RChart ref="mc" class="rcd__wide" type="line" title="Exposed methods" :categories="weekdays" :series="[{ name: 'Visits', data: wave(7, 300, 80) }, { name: 'Signups', data: wave(7, 80, 20, 1) }]" :toolbar="{ zoom: true, typeSwitch: true, exportData: true }" :periods="PERIODS">
          <template #footer>
            <div class="rcd__tools">
              <b>vue-echarts</b>
              <button v-for="b in instanceButtons" :key="b.label" type="button" class="rcd__btn" @click="b.run()">{{ b.label }}</button>
            </div>
            <div class="rcd__tools">
              <b>shortcuts</b>
              <button v-for="b in shortcutButtons" :key="b.label" type="button" class="rcd__btn" @click="b.run()">{{ b.label }}</button>
            </div>
            <div class="rcd__tools">
              <b>RChart</b>
              <button v-for="b in rchartButtons" :key="b.label" type="button" class="rcd__btn" @click="b.run()">{{ b.label }}</button>
            </div>
          </template>
        </RChart>
      </section>

      <!-- ═══ 10 · Events ═════════════════════════════════════════════════ -->
      <section v-else-if="tab === 'events'" class="rcd__grid">
        <RChart
          class="rcd__wide"
          type="line"
          title="Every typed event + raw @chart-event"
          subtitle="Click, double-click, right-click, hover, toggle the legend, zoom (Ctrl+wheel), brush and restore with the toolbox"
          :categories="weekdays"
          :series="[{ name: 'Visits', data: wave(7, 300, 80) }, { name: 'Signups', data: wave(7, 80, 20, 1) }]"
          :toolbar="{ zoom: true, exportPng: true, exportData: true, fullscreen: true, typeSwitch: true }"
          :periods="PERIODS"
          :events="['mousemove']"
          :options="{ toolbox: { right: 12, top: 0, feature: { brush: { type: ['rect', 'clear'] }, restore: {} } }, brush: { xAxisIndex: 0 } }"
          @ready="log('ready')"
          @finished="onFinished"
          @chart-click="log('chart-click', pt($event))"
          @chart-dblclick="log('chart-dblclick', pt($event))"
          @chart-contextmenu="log('chart-contextmenu', pt($event))"
          @chart-hover="log('chart-hover', $event ? pt($event) : 'out')"
          @legend-change="log('legend-change', $event.name)"
          @zoom="log('zoom', `${$event.start.toFixed(0)}–${$event.end.toFixed(0)}%`)"
          @refresh="log('refresh')"
          @export="log('export', $event.format)"
          @fullscreen="log('fullscreen', $event)"
          @period-change="log('period-change', $event.value)"
          @type-change="log('type-change', $event)"
          @highlight="log('highlight')"
          @downplay="log('downplay')"
          @select-change="log('select-change')"
          @restore="log('restore')"
          @brush-selected="log('brush-selected')"
          @chart-event="onRaw"
        />
      </section>

      <!-- ═══ 11 · States ═════════════════════════════════════════════════ -->
      <section v-else-if="tab === 'states'" class="rcd__grid">
        <RChart title="loading (first load → skeleton)" type="bar" loading />
        <RChart title="error: true" type="bar" :error="true" @refresh="log('refresh', 'retry')" />
        <RChart title="error: message" type="bar" error="The analytics service did not respond." @refresh="log('refresh', 'retry')" />
        <RChart title="empty (no data)" type="bar" :categories="[]" :series="[]" />
        <RChart title="loading veil over existing data" type="line" :categories="weekdays" :series="barSeries" :loading="veil" @refresh="toggleVeil" />
        <RChart title="custom labels (km)" type="bar" :categories="[]" :series="[]" :labels="{ noData: 'គ្មានទិន្នន័យ', noDataHint: 'សូមសាកល្បងរយៈពេលផ្សេង' }" />
      </section>

      <!-- ═══ Event log ═══════════════════════════════════════════════════ -->
      <RCard class="rcd__log">
        <div class="rcd__log-head">
          <strong>Event log</strong>
          <label><input v-model="noisy" type="checkbox" /> include mousemove / finished</label>
          <button type="button" class="rcd__btn" @click="events = []">Clear</button>
        </div>
        <ol aria-live="polite">
          <li v-for="e in events" :key="e.id"><time>{{ e.time }}</time> <b>{{ e.name }}</b> {{ e.detail }}</li>
          <li v-if="!events.length" class="rcd__muted">Interact with a chart…</li>
        </ol>
      </RCard>
    </RContent>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { GGroup, GRect, GText } from 'vue-echarts/graphic'
import type RChartComponent from '~/components/RChart.vue'
import type { RChartChartEvent, RChartPeriod, RChartPoint, RChartPointEvent, RChartSeries, RChartType, RChartIndicator } from '~/utils/chart/types'

// ═════════════════════════════════════════════════════════════════════════════
// Navigation
// ═════════════════════════════════════════════════════════════════════════════
const TABS = [
  { id: 'playground', label: 'Playground' },
  { id: 'types', label: 'Chart types' },
  { id: 'header', label: 'Header' },
  { id: 'toolbar', label: 'Toolbar & filters' },
  { id: 'format', label: 'Formatting' },
  { id: 'options', label: 'Options & props' },
  { id: 'slots', label: 'Slots' },
  { id: 'forwarded', label: 'Tooltip · Graphic · DataView' },
  { id: 'methods', label: 'Methods' },
  { id: 'events', label: 'Events' },
  { id: 'states', label: 'States' },
]
const tab = ref('playground')

// ═════════════════════════════════════════════════════════════════════════════
// Demo data (deterministic)
// ═════════════════════════════════════════════════════════════════════════════
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const hours = ['06', '09', '12', '15', '18', '21']
const days = Array.from({ length: 20 }, (_, i) => `Oct ${i + 1}`)
const wave = (n: number, base: number, amp: number, phase = 0) =>
  Array.from({ length: n }, (_, i) => Math.round(base + Math.sin(i * 0.9 + phase) * amp + i * (amp / 6)))

const sessions = wave(12, 700, 160)
const oneSeries: RChartSeries[] = [{ name: 'Visits', data: wave(7, 300, 80) }]
const lineSeries: RChartSeries[] = [{ name: 'Online', data: wave(12, 4200, 900) }, { name: 'In store', data: wave(12, 2600, 500, 1.4) }]
const barSeries: RChartSeries[] = [
  { name: 'Web', data: wave(7, 120, 30) },
  { name: 'Mobile', data: wave(7, 90, 24, 1) },
  { name: 'Partners', data: wave(7, 40, 12, 2) },
]
const mixedSeries: RChartSeries[] = [
  { name: 'Signups', type: 'bar', data: wave(8, 320, 80) },
  { name: 'Conversion %', type: 'line', yAxisIndex: 1, data: [3.1, 3.4, 3.2, 3.9, 4.2, 4.0, 4.6, 4.9] },
]
const traffic = [{ name: 'Search', value: 46 }, { name: 'Direct', value: 24 }, { name: 'Social', value: 18 }, { name: 'Email', value: 12 }]
const funnel = [{ name: 'Visits', value: 12000 }, { name: 'Product views', value: 7400 }, { name: 'Add to cart', value: 3100 }, { name: 'Checkout', value: 1500 }, { name: 'Paid', value: 980 }]
const radarIndicators: RChartIndicator[] = ['Speed', 'Quality', 'Support', 'Price', 'Docs'].map((name) => ({ name, max: 100 }))
const radarSeries: RChartSeries[] = [{ name: 'Us', data: [82, 90, 76, 64, 88] }, { name: 'Market', data: [70, 72, 68, 80, 60] }]
const scatterSeries: RChartSeries[] = [{ name: 'Customers', data: Array.from({ length: 30 }, (_, i): RChartPoint => [Math.round(100 + i * 18 + Math.sin(i) * 60), Math.round(2 + i * 0.6 + Math.cos(i * 1.7) * 3), 20 + (i % 7) * 12]) }]
const heat = weekdays.flatMap((_, y) => hours.map((__, x): RChartPoint => [x, y, Math.round(20 + Math.abs(Math.sin((x + 1) * (y + 2))) * 80)]))
const candles = days.map((_, i): RChartPoint => {
  const open = 100 + Math.sin(i / 2) * 8 + i
  const close = open + Math.sin(i * 1.3) * 5
  return [Math.round(open), Math.round(close), Math.round(Math.min(open, close) - 3), Math.round(Math.max(open, close) + 3)] // open, close, low, high
})

const PERIODS: RChartPeriod[] = [{ value: '7d', label: '7D' }, { value: '30d', label: '30D' }, { value: '12m', label: '12M' }]

// ═════════════════════════════════════════════════════════════════════════════
// Playground
// ═════════════════════════════════════════════════════════════════════════════
const ALL_TYPES: RChartType[] = ['line', 'area', 'bar', 'stacked', 'pie', 'doughnut', 'scatter', 'radar', 'gauge', 'funnel', 'heatmap', 'candlestick', 'mixed']
const DISPLAY_FLAGS = ['tooltip', 'grid', 'axisLabels', 'dataLabels', 'animation', 'gradient', 'smooth', 'zoomSlider'] as const
const TOOLBAR_FLAGS = ['visible', 'refresh', 'exportPng', 'exportSvg', 'exportData', 'fullscreen', 'zoom', 'typeSwitch'] as const

const pg = reactive({
  type: 'area' as RChartType,
  variant: 'card',
  theme: 'auto',
  height: 320,
  state: 'ready',
  legend: true as boolean | 'top',
  header: { visible: true, align: 'start', layout: 'inline', spacing: 'md', iconStyle: 'soft', bordered: false } as Record<string, any>,
  display: { tooltip: true, grid: true, axisLabels: true, dataLabels: false, animation: true, gradient: true, smooth: true, zoomSlider: false } as Record<string, boolean>,
  toolbar: { visible: true, refresh: true, exportPng: true, exportSvg: false, exportData: true, fullscreen: true, zoom: true, typeSwitch: true } as Record<string, boolean>,
})

// Props appropriate for the selected type
const sample = computed<Record<string, unknown>>(() => {
  switch (pg.type) {
    case 'pie': case 'doughnut': return { data: traffic }
    case 'funnel': return { data: funnel }
    case 'gauge': return { data: 68, unit: '%' }
    case 'radar': return { indicators: radarIndicators, series: radarSeries }
    case 'scatter': return { series: scatterSeries }
    case 'heatmap': return { categories: hours, yCategories: weekdays, series: [{ name: 'Visits', data: heat }] }
    case 'candlestick': return { categories: days, series: [{ name: 'ACME', data: candles }] }
    case 'mixed': return { categories: months.slice(0, 8), series: mixedSeries }
    case 'bar': case 'stacked': return { categories: weekdays, series: barSeries }
    default: return { categories: months, series: lineSeries }
  }
})

// ═════════════════════════════════════════════════════════════════════════════
// Misc example state
// ═════════════════════════════════════════════════════════════════════════════
const period = ref('12m')
const loading = ref(false)
const veil = ref(false)
const segment = ref('Web')
const segmentData = computed(() => wave(7, segment.value === 'Web' ? 800 : segment.value === 'Mobile' ? 600 : 200, 140))

function reload() {
  log('refresh', 'reloading…')
  loading.value = true
  setTimeout(() => (loading.value = false), 1200)
}
function toggleVeil() {
  veil.value = true
  setTimeout(() => (veil.value = false), 1500)
}

const fmtBytes = (v: number, ctx: { axis?: boolean }) => {
  const mb = v / 1e6
  return ctx.axis ? `${mb.toFixed(0)} MB` : `${mb.toFixed(2)} MB`
}

// #graphic badge
const badge = reactive({ x: 80, y: 20 })
const onBadgeDrag = (e: { offsetX: number; offsetY: number }) => {
  badge.x = e.offsetX - 52
  badge.y = e.offsetY - 13
}

// manualUpdate chart
const manualChart = ref<InstanceType<typeof RChartComponent> | null>(null)
function pushManual() {
  manualChart.value?.setOption({ series: [{ name: 'Visits', type: 'line', data: wave(7, 300, 120, Math.random() * 6) }] })
}

// ═════════════════════════════════════════════════════════════════════════════
// Methods tab
// ═════════════════════════════════════════════════════════════════════════════
const mc = ref<InstanceType<typeof RChartComponent> | null>(null)
const instanceButtons = [
  { label: 'getWidth()', run: () => log('getWidth()', mc.value?.getWidth()) },
  { label: 'getHeight()', run: () => log('getHeight()', mc.value?.getHeight()) },
  { label: 'getDom()', run: () => log('getDom()', mc.value?.getDom()?.tagName) },
  { label: 'getOption()', run: () => log('getOption()', `${(mc.value?.getOption() as any)?.series?.length} series`) },
  { label: 'setOption()', run: () => mc.value?.setOption({ series: [{ name: 'Visits', type: 'line', data: wave(7, 300, 120, Math.random() * 6) }] }) },
  { label: 'resize()', run: () => mc.value?.resize() },
  { label: 'dispatchAction()', run: () => mc.value?.dispatchAction({ type: 'showTip', seriesIndex: 1, dataIndex: 2 }) },
  { label: 'convertToPixel()', run: () => log('convertToPixel', JSON.stringify(mc.value?.convertToPixel({ seriesIndex: 0 }, [2, 300]))) },
  { label: 'convertFromPixel()', run: () => log('convertFromPixel', JSON.stringify(mc.value?.convertFromPixel({ seriesIndex: 0 }, [200, 120]))) },
  { label: 'containPixel()', run: () => log('containPixel', mc.value?.containPixel({ seriesIndex: 0 }, [200, 120])) },
  { label: 'getDataURL()', run: () => log('getDataURL()', `${mc.value?.getDataURL({ type: 'png', pixelRatio: 1 })?.length} chars`) },
  { label: 'getConnectedDataURL()', run: () => log('getConnectedDataURL()', `${mc.value?.getConnectedDataURL({ type: 'png' })?.length} chars`) },
  { label: 'clear()', run: () => mc.value?.clear() },
  { label: 'dispose()', run: () => log('dispose()', 'skipped — it destroys the chart; call it only on teardown') },
]
const shortcutButtons = [
  { label: 'highlight()', run: () => mc.value?.highlight({ seriesIndex: 0 }) },
  { label: 'downplay()', run: () => mc.value?.downplay() },
  { label: 'showTip()', run: () => mc.value?.showTip({ seriesIndex: 0, dataIndex: 3 }) },
  { label: 'hideTip()', run: () => mc.value?.hideTip() },
  { label: 'toggleLegend()', run: () => mc.value?.toggleLegend('Signups') },
  { label: 'unselectLegend()', run: () => mc.value?.unselectLegend('Signups') },
  { label: 'selectLegend()', run: () => mc.value?.selectLegend('Signups') },
]
const rchartButtons = [
  { label: 'refresh()', run: () => mc.value?.refresh() },
  { label: 'exportAs(png)', run: () => mc.value?.exportAs('png') },
  { label: 'exportAs(svg)', run: () => mc.value?.exportAs('svg') },
  { label: 'exportAs(csv)', run: () => mc.value?.exportAs('csv') },
  { label: 'toggleFullscreen()', run: () => mc.value?.toggleFullscreen() },
  { label: 'zoomIn()', run: () => mc.value?.zoomIn() },
  { label: 'zoomOut()', run: () => mc.value?.zoomOut() },
  { label: 'resetZoom()', run: () => mc.value?.resetZoom() },
  { label: "setType('bar')", run: () => mc.value?.setType('bar') },
  { label: "setType('line')", run: () => mc.value?.setType('line') },
  { label: "setPeriod('30d')", run: () => mc.value?.setPeriod('30d') },
  { label: 'getBuiltOption()', run: () => log('getBuiltOption()', Object.keys(mc.value?.getBuiltOption() ?? {}).join(', ')) },
]

// ═════════════════════════════════════════════════════════════════════════════
// Event log
// ═════════════════════════════════════════════════════════════════════════════
const events = ref<Array<{ id: number; time: string; name: string; detail: string }>>([])
const noisy = ref(false)
let eventId = 0
let lastNoisy = 0

function log(name: string, detail: unknown = '') {
  const time = new Date().toLocaleTimeString([], { hour12: false })
  events.value = [{ id: ++eventId, time, name, detail: String(detail ?? '') }, ...events.value].slice(0, 16)
}
const pt = (e: RChartPointEvent) => [e.seriesName, e.name].filter(Boolean).join(' · ')
function onFinished() {
  if (noisy.value) log('finished')
}
function onRaw({ name, params }: RChartChartEvent) {
  if (name === 'mousemove') {
    if (!noisy.value || Date.now() - lastNoisy < 400) return
    lastNoisy = Date.now()
  }
  // typed events are already logged above; only show the ones with no typed twin
  if (['mousemove', 'mouseout', 'legendselected', 'legendunselected', 'brush', 'brushEnd', 'brushselected', 'datazoom'].includes(name)) {
    log(`chart-event:${name}`, (params as { seriesName?: string })?.seriesName ?? '')
  }
}
</script>

<style lang="scss">
.rcd {
  display: flex;
  flex-direction: column;
  gap: var(--sp-5, 1.25rem);
  padding: 0;

  &__head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: var(--sp-4, 1rem); }
  &__title { margin: 0; font-size: 1.5rem; font-weight: 700; letter-spacing: -0.01em; color: var(--c-text); }
  &__muted { margin: 0.25rem 0 0; font-size: 0.8125rem; color: var(--c-muted); }
  &__wide { grid-column: 1 / -1; }
  &__center { display: inline-flex; align-items: center; gap: 0.5rem; padding: 1rem; color: var(--c-muted); font-size: 0.875rem; }
  &__slot { margin: 0; font-size: 1rem; color: var(--c-accent); }
  &__spin { animation: rcd-spin 1s linear infinite; }

  &__tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    padding: 0.25rem;
    border: 1px solid var(--c-border);
    border-radius: var(--r-md, 12px);
    background: color-mix(in srgb, var(--c-muted) 7%, transparent);

    button {
      padding: 0.3125rem 0.75rem;
      font: inherit;
      font-size: 0.8125rem;
      font-weight: 500;
      border: 0;
      border-radius: calc(var(--r-md, 12px) - 2px);
      color: var(--c-muted);
      background: transparent;
      cursor: pointer;

      &:hover { color: var(--c-text); }
      &.is-active { color: var(--c-accent); background: var(--c-surface); box-shadow: 0 1px 2px rgb(0 0 0 / 0.12); }
      &:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 1px; }
    }
  }

  &__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 26rem), 1fr)); gap: var(--sp-4, 1rem); }

  &__playground { display: grid; grid-template-columns: 16rem minmax(0, 1fr); gap: var(--sp-4, 1rem); align-items: start; }
  &__controls {
    position: sticky;
    top: 1rem;
    font-size: 0.8125rem;

    fieldset { display: grid; gap: 0.375rem; margin: 0 0 0.75rem; padding: 0; border: 0; }
    legend { margin-bottom: 0.375rem; padding: 0; font-weight: 600; color: var(--c-text); }
    label { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; color: var(--c-muted); }
    select { padding: 0.125rem 0.375rem; font: inherit; border: 1px solid var(--c-border); border-radius: var(--r-sm, 8px); color: var(--c-text); background: var(--c-surface); }
    input[type='checkbox'] { accent-color: var(--c-accent); }
    input[type='range'] { width: 6rem; accent-color: var(--c-accent); }
  }

  &__inline { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: var(--c-muted); select { padding: 0.25rem 0.5rem; font: inherit; border: 1px solid var(--c-border); border-radius: var(--r-sm, 8px); color: var(--c-text); background: var(--c-surface); } }
  &__chip { padding: 0.125rem 0.5rem; font-size: 0.75rem; border-radius: var(--r-full, 9999px); color: var(--c-accent); background: color-mix(in srgb, var(--c-accent) 12%, transparent); }

  &__legend { display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; margin: 0; padding: 0; list-style: none; }
  &__legend button { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.125rem 0.25rem; font: inherit; font-size: 0.8125rem; color: var(--c-text); background: none; border: 0; border-radius: var(--r-sm, 8px); cursor: pointer; }
  &__legend button.is-off { color: var(--c-muted); text-decoration: line-through; }
  &__legend i { width: 0.5rem; height: 0.5rem; border-radius: 50%; }

  &__tip { display: grid; gap: 0.125rem; font-size: 0.75rem; color: var(--c-text); em { margin-top: 0.25rem; font-style: normal; color: var(--c-muted); } }
  &__table { width: 100%; font-size: 0.8125rem; border-collapse: collapse; color: var(--c-text); th, td { padding: 0.375rem 0.5rem; text-align: start; border-bottom: 1px solid var(--c-border); } }

  &__tools { display: flex; flex-wrap: wrap; align-items: center; gap: 0.375rem; margin-bottom: 0.5rem; b { min-width: 5.5rem; font-size: 0.75rem; color: var(--c-muted); } }
  &__btn { padding: 0.1875rem 0.5rem; font: inherit; font-size: 0.75rem; border: 1px solid var(--c-border); border-radius: var(--r-sm, 8px); color: var(--c-text); background: var(--c-surface); cursor: pointer; &:hover { border-color: var(--c-accent); color: var(--c-accent); } &:focus-visible { outline: 2px solid var(--c-accent); } }

  &__log {
    font-size: 0.8125rem;
    ol { margin: 0.5rem 0 0; padding: 0; list-style: none; max-height: 14rem; overflow: auto; }
    li { padding: 0.125rem 0; color: var(--c-muted); }
    b { color: var(--c-accent); }
    time { font-variant-numeric: tabular-nums; }
  }
  &__log-head { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; label { margin-inline-start: auto; font-size: 0.75rem; color: var(--c-muted); } }

  @media (max-width: 960px) {
    &__playground { grid-template-columns: minmax(0, 1fr); }
    &__controls { position: static; }
  }
}

@keyframes rcd-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .rcd__spin { animation: none; } }
</style>
