<template>
  <section class="r-splendor" :class="rootClass" :aria-label="ariaLabel || title || undefined" :aria-busy="paddle.loading.value || undefined">
    <!-- ══ Header ══════════════════════════════════════════════════════════ -->
    <header v-if="title || subtitle || $slots.header" class="r-splendor__header">
      <slot name="header" v-bind="slotCtx">
        <div>
          <h3 v-if="title" class="r-splendor__title">{{ title }}</h3>
          <p v-if="subtitle" class="r-splendor__subtitle">{{ subtitle }}</p>
        </div>
      </slot>
    </header>

    <!-- ══ Toolbar ═════════════════════════════════════════════════════════ -->
    <div class="r-splendor__toolbar">
      <slot name="toolbar" v-bind="slotCtx">
        <div class="r-splendor__toolbar-start">
          <slot name="toolbar-start" v-bind="slotCtx" />

          <UInput
            v-if="opts.searchable"
            v-model="searchInput"
            class="r-splendor__search"
            type="search"
            icon="i-lucide-search"
            :placeholder="opts.searchPlaceholder ?? L.search"
            :aria-label="L.search"
            @keydown.enter="commitSearch"
            @keydown.esc="clearSearch"
          >
            <template v-if="searchInput" #trailing>
              <UButton icon="i-lucide-x" color="neutral" variant="link" size="xs" :aria-label="L.clearSearch" @click="clearSearch" />
            </template>
          </UInput>

          <UButton
            v-if="hasFilters"
            icon="i-lucide-sliders-horizontal"
            color="neutral"
            :variant="filtersOpen || activeCount ? 'soft' : 'outline'"
            size="sm"
            :aria-expanded="filtersOpen"
            aria-controls="r-splendor-filters"
            @click="filtersOpen = !filtersOpen"
          >
            {{ L.filters }}
            <UBadge v-if="activeCount" :label="String(activeCount)" size="sm" variant="solid" />
          </UButton>
        </div>

        <div class="r-splendor__toolbar-end">
          <slot name="toolbar-end" v-bind="slotCtx" />

          <div v-if="opts.chart" class="r-splendor__seg" role="group">
            <button type="button" :class="{ 'is-active': view === 'table' }" :aria-pressed="view === 'table'" @click="setView('table')">
              <UIcon name="i-lucide-table" /> <span>{{ L.viewTable }}</span>
            </button>
            <button type="button" :class="{ 'is-active': view === 'chart' }" :aria-pressed="view === 'chart'" @click="setView('chart')">
              <UIcon name="i-lucide-chart-column" /> <span>{{ L.viewChart }}</span>
            </button>
          </div>

          <UPopover v-if="opts.columnToggle">
            <UButton icon="i-lucide-columns-3" color="neutral" variant="outline" size="sm" :aria-label="L.columns" :title="L.columns" />
            <template #content>
              <ul class="r-splendor__columns">
                <li v-for="col in columns" :key="col.key">
                  <label><input type="checkbox" :checked="isColumnVisible(col)" @change="toggleColumn(col)" /> {{ col.label }}</label>
                </li>
              </ul>
            </template>
          </UPopover>

          <UDropdownMenu v-if="exportItems.length" :items="exportItems" :content="{ align: 'end' }">
            <UButton icon="i-lucide-download" color="neutral" variant="outline" size="sm" :aria-label="L.export" :title="L.export" />
          </UDropdownMenu>

          <UButton
            v-if="opts.refreshable && mode === 'api'"
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="outline"
            size="sm"
            :loading="paddle.loading.value"
            :aria-label="L.refresh"
            :title="L.refresh"
            @click="onRefresh"
          />
        </div>
      </slot>
    </div>

    <!-- ══ Filters ═════════════════════════════════════════════════════════ -->
    <div v-if="hasFilters && filtersOpen" id="r-splendor-filters" class="r-splendor__filters">
      <slot name="filters" v-bind="{ ...slotCtx, defs: filterDefs, values: filters, set: setFilter, reset: resetFilters }">
        <div v-for="def in filterDefs" :key="def.key" class="r-splendor__field">
          <label :for="`rsf-${uid}-${def.key}`">{{ def.label }}</label>

          <input
            v-if="def.type === 'text'"
            :id="`rsf-${uid}-${def.key}`"
            type="search"
            :placeholder="def.placeholder"
            :value="draftValue(def) ?? ''"
            @input="setFilterDebounced(def.key, ($event.target as HTMLInputElement).value)"
          />

          <select
            v-else-if="def.type === 'select'"
            :id="`rsf-${uid}-${def.key}`"
            :value="String(filters[def.key] ?? '')"
            @change="setFilter(def.key, ($event.target as HTMLSelectElement).value)"
          >
            <option value="">{{ L.any }}</option>
            <option v-for="o in def.options" :key="o.value" :value="String(o.value)">{{ o.label }}</option>
          </select>

          <select
            v-else-if="def.type === 'boolean'"
            :id="`rsf-${uid}-${def.key}`"
            :value="filters[def.key] === undefined || filters[def.key] === null || filters[def.key] === '' ? '' : String(filters[def.key])"
            @change="setFilter(def.key, parseBoolean(($event.target as HTMLSelectElement).value))"
          >
            <option value="">{{ L.any }}</option>
            <option value="true">{{ L.yes }}</option>
            <option value="false">{{ L.no }}</option>
          </select>

          <div v-else class="r-splendor__range">
            <input
              :id="`rsf-${uid}-${def.key}`"
              :type="def.type === 'number' ? 'number' : 'date'"
              :placeholder="L.from"
              :aria-label="`${def.label} ${L.from}`"
              :value="rangeValue(def, 'from')"
              @input="setRangeDebounced(def, 'from', ($event.target as HTMLInputElement).value)"
            />
            <span aria-hidden="true">–</span>
            <input
              :type="def.type === 'number' ? 'number' : 'date'"
              :placeholder="L.to"
              :aria-label="`${def.label} ${L.to}`"
              :value="rangeValue(def, 'to')"
              @input="setRangeDebounced(def, 'to', ($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>

        <UButton class="r-splendor__reset" icon="i-lucide-filter-x" color="neutral" variant="ghost" size="sm" :disabled="!activeCount" @click="resetFilters">
          {{ L.resetFilters }}
        </UButton>
      </slot>
    </div>

    <!-- ══ Bulk actions ════════════════════════════════════════════════════ -->
    <div v-if="selected.length" class="r-splendor__bulk" role="status">
      <strong>{{ selected.length }} {{ L.selected }}</strong>
      <slot name="bulk-actions" v-bind="{ ...slotCtx, keys: selected, rows: selectedRows(), clear: clearSelection }" />
      <UButton color="neutral" variant="link" size="xs" @click="clearSelection">{{ L.clearSelection }}</UButton>
    </div>

    <!-- ══ Body ════════════════════════════════════════════════════════════ -->
    <div class="r-splendor__body" :class="{ 'is-refreshing': paddle.refreshing.value }">
      <!-- error banner (rows still on screen) -->
      <div v-if="paddle.error.value && paddle.rows.value.length" class="r-splendor__banner" role="alert">
        <UIcon name="i-lucide-triangle-alert" />
        <span>{{ paddle.error.value.message }}</span>
        <UButton color="neutral" variant="link" size="xs" @click="onRefresh">{{ L.retry }}</UButton>
      </div>

      <!-- full-size states -->
      <template v-if="showSkeleton">
        <slot name="loading" v-bind="slotCtx">
          <div class="r-splendor__skeleton" aria-hidden="true">
            <i v-for="n in skeletonRows" :key="n" :style="{ '--d': `${n * 70}ms` }" />
          </div>
        </slot>
      </template>

      <template v-else-if="paddle.error.value && !paddle.rows.value.length">
        <slot name="error" v-bind="{ ...slotCtx, error: paddle.error.value, retry: onRefresh }">
          <div class="r-splendor__state" role="alert">
            <span class="r-splendor__state-icon is-error"><UIcon name="i-lucide-triangle-alert" /></span>
            <p class="r-splendor__state-title">{{ L.error }}</p>
            <p class="r-splendor__state-text">{{ paddle.error.value.message }}</p>
            <UButton icon="i-lucide-refresh-cw" color="neutral" variant="outline" size="sm" @click="onRefresh">{{ L.retry }}</UButton>
          </div>
        </slot>
      </template>

      <template v-else-if="!paddle.rows.value.length">
        <slot name="empty" v-bind="{ ...slotCtx, hasQuery, reset: resetAll }">
          <div class="r-splendor__state">
            <span class="r-splendor__state-icon"><UIcon :name="hasQuery ? 'i-lucide-search-x' : 'i-lucide-inbox'" /></span>
            <p class="r-splendor__state-title">{{ hasQuery ? L.noResults : L.empty }}</p>
            <p v-if="!hasQuery" class="r-splendor__state-text">{{ L.emptyHint }}</p>
            <UButton v-if="hasQuery" icon="i-lucide-filter-x" color="neutral" variant="outline" size="sm" @click="resetAll">{{ L.resetFilters }}</UButton>
          </div>
        </slot>
      </template>

      <!-- chart view -->
      <div v-else-if="view === 'chart' && chartProps" class="r-splendor__chart">
        <slot name="chart" v-bind="{ ...slotCtx, props: chartProps }">
          <RChart ref="chartRef" v-bind="chartProps" />
        </slot>
      </div>

      <!-- table view -->
      <div v-else class="r-splendor__scroll">
        <table class="r-splendor__table">
          <caption class="r-splendor__sr">{{ title || L.search }}</caption>
          <thead>
            <tr>
              <th v-if="opts.selectable" scope="col" class="r-splendor__check">
                <input
                  v-if="opts.selectable === 'multiple'"
                  ref="selectAllRef"
                  type="checkbox"
                  :checked="allOnPageSelected"
                  :aria-label="L.selectAll"
                  @change="toggleAllOnPage"
                />
              </th>
              <th
                v-for="col in visibleCols"
                :key="col.key"
                scope="col"
                :class="[`is-${col.align ?? 'start'}`, col.class]"
                :style="col.width ? { width: col.width } : undefined"
                :aria-sort="isSortable(col) ? ariaSort(col) : undefined"
              >
                <slot :name="`header-${col.key}`" v-bind="{ column: col, sort: sortOf(col) }">
                  <button v-if="isSortable(col)" type="button" class="r-splendor__sort" :title="opts.multiSort ? 'Shift+click: add to sort' : undefined" @click="toggleSort(col, $event.shiftKey)">
                    {{ col.label }}
                    <UIcon :name="sortIcon(col)" class="r-splendor__sort-icon" :class="{ 'is-on': sortOf(col) }" />
                    <sup v-if="sortOf(col) && sort.length > 1" class="r-splendor__sort-n">{{ sortIndex(col) }}</sup>
                  </button>
                  <span v-else>{{ col.label }}</span>
                </slot>
              </th>
              <th v-if="hasActions" scope="col" class="r-splendor__actions-col"><span class="r-splendor__sr">{{ L.actions }}</span></th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="(row, i) in paddle.rows.value"
              :key="rowId(row, i)"
              :class="[{ 'is-selected': isSelected(row) }, rowClass?.(row, i)]"
              @click="emit('row:click', row, i, $event)"
            >
              <td v-if="opts.selectable" class="r-splendor__check" @click.stop>
                <input
                  :type="opts.selectable === 'single' ? 'radio' : 'checkbox'"
                  :name="`rs-${uid}`"
                  :checked="isSelected(row)"
                  :disabled="keyOf(row) === undefined"
                  :aria-label="L.selectRow"
                  @change="toggleRow(row)"
                />
              </td>

              <td v-for="col in visibleCols" :key="col.key" :class="[`is-${col.align ?? 'start'}`, col.class]">
                <slot :name="`cell-${col.key}`" v-bind="{ row, value: cellValue(row, col), index: i, column: col }">{{ cellText(row, col) }}</slot>
              </td>

              <td v-if="hasActions" class="r-splendor__actions-col" @click.stop>
                <slot name="actions" v-bind="{ row, index: i }">
                  <UButton
                    v-for="a in opts.rowActions"
                    :key="a.key"
                    :icon="a.icon"
                    :color="a.color ?? 'neutral'"
                    variant="ghost"
                    size="xs"
                    :disabled="typeof a.disabled === 'function' ? a.disabled(row) : a.disabled"
                    :aria-label="a.label"
                    :title="a.label"
                    @click="emit('row:action', { action: a, row, index: i })"
                  />
                </slot>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ══ Footer ══════════════════════════════════════════════════════════ -->
    <footer v-if="showFooter" class="r-splendor__footer">
      <slot name="footer" v-bind="slotCtx">
        <p v-if="opts.summary" class="r-splendor__summary">
          <slot name="summary" v-bind="{ ...slotCtx, from: rangeFrom, to: rangeTo }">
            <template v-if="paddle.rows.value.length">
              {{ L.showing }} {{ nf.format(rangeFrom) }}–{{ nf.format(rangeTo) }}
              <template v-if="paddle.totalKnown.value"> {{ L.of }} {{ nf.format(paddle.total.value) }}</template>
            </template>
          </slot>
        </p>

        <div v-if="opts.paginated" class="r-splendor__paging">
          <label class="r-splendor__size">
            {{ L.rowsPerPage }}
            <select :value="pageSize" @change="setPageSize(Number(($event.target as HTMLSelectElement).value))">
              <option v-for="n in sizeChoices" :key="n" :value="n">{{ n }}</option>
            </select>
          </label>

          <UPagination
            v-if="paddle.totalKnown.value && paddle.totalPages.value > 1"
            :page="page"
            :total="paddle.total.value"
            :items-per-page="pageSize"
            :sibling-count="1"
            show-edges
            size="sm"
            @update:page="setPage"
          />
          <div v-else-if="!paddle.totalKnown.value" class="r-splendor__prevnext">
            <UButton icon="i-lucide-chevron-left" color="neutral" variant="outline" size="xs" :disabled="page <= 1" aria-label="Previous page" @click="setPage(page - 1)" />
            <span>{{ page }}</span>
            <UButton icon="i-lucide-chevron-right" color="neutral" variant="outline" size="xs" :disabled="!paddle.hasNext.value" aria-label="Next page" @click="setPage(page + 1)" />
          </div>
        </div>
      </slot>
    </footer>

    <p class="r-splendor__sr" aria-live="polite">{{ announcement }}</p>
  </section>
</template>

<script setup lang="ts">
// <script setup lang="ts" generic="T extends Record<string, any>">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, useId, useSlots, watch } from 'vue'
import { useHttp } from '../../../composables/https'
import { useChartPaddle } from '../../../composables/useChartPaddle'
import type { PaddleHttp } from '../../../composables/useChartPaddle'
import { downloadBlob, safeFileName, tableToCsv } from '../../../utils/chart/export'
import { activeFilterCount, getPath, isFilterEmpty, isRange } from '../../../utils/chart/splendor.local'
import { DEFAULT_SPLENDOR_LABELS, resolveSplendorOptions } from '../../../utils/chart/splendor.types'
import type {
  SplendorApi,
  SplendorColumn,
  SplendorDataChange,
  SplendorError,
  SplendorExportContext,
  SplendorExportFormat,
  SplendorFilterDef,
  SplendorFilterValue,
  SplendorFilterValues,
  SplendorLabels,
  SplendorMode,
  SplendorOptions,
  SplendorRange,
  SplendorRowAction,
  SplendorSort,
  SplendorStatus,
} from '../../../utils/chart/splendor.types'
import { buildXlsx } from '../../../utils/chart/xlsx'
import type { XlsxCell } from '../../../utils/chart/xlsx'

// ═════════════════════════════════════════════════════════════════════════════
// Props / models / emits
// ═════════════════════════════════════════════════════════════════════════════
const props = withDefaults(
  defineProps<{
    /** `'api'` | `'local'`. Default: `'api'` when `api` is given, otherwise `'local'`. */
    mode?: SplendorMode
    /** API mode: `{ url, method, filter, where, params, paramMap, responseMap, … }`. Never read in local mode. */
    api?: SplendorApi<T>
    /** Local mode: the rows. Never triggers a request. */
    data?: readonly T[]
    columns: SplendorColumn<T>[]
    /** Filter definitions. (Filter *values* are `v-model:filters`.) */
    filterDefs?: SplendorFilterDef<T>[]
    options?: SplendorOptions<T>
    labels?: Partial<SplendorLabels>
    /** BCP 47 locale for numbers / dates / sorting. */
    locale?: string
    title?: string
    subtitle?: string
    ariaLabel?: string
    /** API mode: fetch on mount. Set `false` and call `refresh()` yourself to defer. */
    immediate?: boolean
    rowClass?: (row: T, index: number) => string | undefined
  }>(),
  {
    mode: undefined,
    api: undefined,
    data: undefined,
    filterDefs: () => [],
    options: undefined,
    labels: () => ({}),
    locale: undefined,
    title: undefined,
    subtitle: undefined,
    ariaLabel: undefined,
    immediate: true,
    rowClass: undefined,
  },
)

const search = defineModel<string>('search', { default: '' })
const filters = defineModel<SplendorFilterValues>('filters', { default: () => ({}) })
const page = defineModel<number>('page', { default: 1 })
const pageSize = defineModel<number>('pageSize', { default: 0 })
const sort = defineModel<SplendorSort[]>('sort', { default: () => [] })
const selected = defineModel<Array<string | number>>('selected', { default: () => [] })
const visibleColumns = defineModel<string[] | undefined>('visibleColumns', { default: undefined })
const view = defineModel<'table' | 'chart'>('view', { default: 'table' })

const emit = defineEmits<{
  'data:change': [payload: SplendorDataChange<T>]
  'data:filterChange': [payload: { search: string; filters: SplendorFilterValues; activeCount: number }]
  'data:sortChange': [sort: SplendorSort[]]
  'data:pageChange': [payload: { page: number; pageSize: number }]
  'status:change': [status: SplendorStatus]
  error: [error: SplendorError]
  'selection:change': [payload: { keys: Array<string | number>; rows: T[] }]
  'row:click': [row: T, index: number, event: MouseEvent]
  'row:action': [payload: { action: SplendorRowAction; row: T; index: number }]
  export: [payload: SplendorExportContext<T> & { handled: boolean }]
  refresh: []
  'view:change': [view: 'table' | 'chart']
}>()

// ═════════════════════════════════════════════════════════════════════════════
// Config
// ═════════════════════════════════════════════════════════════════════════════
const uid = useId()
const slots = useSlots()
const mode = computed<SplendorMode>(() => props.mode ?? (props.api ? 'api' : 'local'))
const opts = computed(() => resolveSplendorOptions<T>(props.options))
const L = computed<SplendorLabels>(() => ({ ...DEFAULT_SPLENDOR_LABELS, ...props.labels }))
const hasFilters = computed(() => opts.value.filterable && props.filterDefs.length > 0)

if (import.meta.dev) {
  if (props.mode === 'api' && !props.api) console.warn('[RChartSplendor] mode="api" needs the `api` prop.')
  if (props.mode === 'local' && props.api) console.warn('[RChartSplendor] `api` is ignored in local mode — no request will be made.')
  if (props.mode === 'local' && props.data === undefined) console.warn('[RChartSplendor] local mode expects the `data` prop.')
}

// Normalise controlled state before the first render (page size comes from options).
if (!Number.isInteger(page.value) || page.value < 1) page.value = 1
if (!Number.isInteger(pageSize.value) || pageSize.value < 1) pageSize.value = opts.value.defaultPageSize

const sizeChoices = computed(() => [...new Set([...opts.value.pageSizeOptions, pageSize.value])].sort((a, b) => a - b))

// ═════════════════════════════════════════════════════════════════════════════
// Data engine (shared by API + local mode)
// ═════════════════════════════════════════════════════════════════════════════
const paddle = useChartPaddle<T>({
  mode,
  data: () => (mode.value === 'local' ? props.data : undefined),
  api: () => (mode.value === 'api' ? props.api : undefined),
  columns: () => props.columns,
  filterDefs: () => props.filterDefs,
  options: opts,
  query: { search, filters, page, pageSize, sort },
  http: useHttp as unknown as PaddleHttp,
  locale: () => props.locale,
  onError: (e) => emit('error', e),
})

const requestState = () => ({ search: search.value, filters: filters.value, sort: sort.value, page: page.value, pageSize: pageSize.value })

onMounted(() => {
  if (props.immediate || mode.value === 'local') paddle.start()
})

// ═════════════════════════════════════════════════════════════════════════════
// Search (debounced) & filters
// ═════════════════════════════════════════════════════════════════════════════
const searchInput = ref(search.value)
let searchTimer: ReturnType<typeof setTimeout> | undefined
const filterTimers = new Map<string, ReturnType<typeof setTimeout>>()
const draft = reactive<Record<string, SplendorFilterValue>>({})

// Parent-driven changes flow back into the input.
watch(search, (v) => { if (v !== searchInput.value) searchInput.value = v })
watch(searchInput, (v) => {
  clearTimeout(searchTimer)
  if (v === search.value) return
  searchTimer = setTimeout(() => { search.value = v }, Math.max(0, opts.value.searchDebounce))
})

function commitSearch() {
  clearTimeout(searchTimer)
  if (searchInput.value !== search.value) search.value = searchInput.value
}
function clearSearch() {
  clearTimeout(searchTimer)
  searchInput.value = ''
  search.value = ''
}

function setFilter(key: string, value: SplendorFilterValue) {
  clearTimeout(filterTimers.get(key))
  filterTimers.delete(key)
  delete draft[key]
  const next = { ...filters.value }
  if (isFilterEmpty(value)) delete next[key]
  else next[key] = value
  filters.value = next
}

function setFilterDebounced(key: string, value: SplendorFilterValue) {
  draft[key] = value
  clearTimeout(filterTimers.get(key))
  filterTimers.set(key, setTimeout(() => setFilter(key, draft[key]), Math.max(0, opts.value.searchDebounce)))
}

const draftValue = (def: SplendorFilterDef<T>) => (def.key in draft ? draft[def.key] : filters.value[def.key])
const rangeValue = (def: SplendorFilterDef<T>, edge: 'from' | 'to') => {
  const v = draftValue(def)
  return isRange(v) ? (v[edge] ?? '') : ''
}
function setRangeDebounced(def: SplendorFilterDef<T>, edge: 'from' | 'to', value: string) {
  const current = draftValue(def)
  const next: SplendorRange = { ...(isRange(current) ? current : {}), [edge]: value === '' ? null : def.type === 'number' ? Number(value) : value }
  setFilterDebounced(def.key, next)
}
const parseBoolean = (v: string) => (v === '' ? null : v === 'true')

const activeCount = computed(() => activeFilterCount(filters.value))
const filtersOpen = ref(activeCount.value > 0)
const hasQuery = computed(() => search.value.trim().length > 0 || activeCount.value > 0)

function resetSearch() { clearSearch() }
function resetFilters() {
  for (const t of filterTimers.values()) clearTimeout(t)
  filterTimers.clear()
  for (const k of Object.keys(draft)) delete draft[k]
  filters.value = {}
}
function resetSort() { sort.value = [] }
function resetAll() { resetSearch(); resetFilters(); resetSort() }

// ═════════════════════════════════════════════════════════════════════════════
// Columns, sorting, cells
// ═════════════════════════════════════════════════════════════════════════════
const isColumnVisible = (c: SplendorColumn<T>) => (visibleColumns.value ? visibleColumns.value.includes(c.key) : c.visible !== false)
const visibleCols = computed(() => props.columns.filter(isColumnVisible))
function toggleColumn(c: SplendorColumn<T>) {
  const current = visibleColumns.value ?? props.columns.filter((x) => x.visible !== false).map((x) => x.key)
  visibleColumns.value = current.includes(c.key) ? current.filter((k) => k !== c.key) : [...current, c.key]
}

const hasActions = computed(() => opts.value.rowActions.length > 0 || Boolean(slots.actions))
const isSortable = (c: SplendorColumn<T>) => opts.value.sortable && c.sortable !== false
const sortOf = (c: SplendorColumn<T>) => sort.value.find((s) => s.key === c.key)
const sortIndex = (c: SplendorColumn<T>) => sort.value.findIndex((s) => s.key === c.key) + 1
const ariaSort = (c: SplendorColumn<T>) => (sortOf(c)?.dir === 'asc' ? 'ascending' : sortOf(c)?.dir === 'desc' ? 'descending' : 'none')
const sortIcon = (c: SplendorColumn<T>) => (sortOf(c)?.dir === 'asc' ? 'i-lucide-arrow-up' : sortOf(c)?.dir === 'desc' ? 'i-lucide-arrow-down' : 'i-lucide-arrow-up-down')

/** none → asc → desc → none. Shift+click adds to a multi-column sort when `options.multiSort`. */
function toggleSort(col: SplendorColumn<T>, additive: boolean) {
  const current = sortOf(col)
  const next: SplendorSort | null = !current ? { key: col.key, dir: 'asc' } : current.dir === 'asc' ? { key: col.key, dir: 'desc' } : null
  if (additive && opts.value.multiSort) {
    const rest = sort.value.filter((s) => s.key !== col.key)
    sort.value = next ? [...rest, next] : rest
  } else {
    sort.value = next ? [next] : []
  }
}

const nf = computed(() => new Intl.NumberFormat(props.locale))
const df = computed(() => new Intl.DateTimeFormat(props.locale, { dateStyle: 'medium' }))
const cellValue = (row: T, col: SplendorColumn<T>) => getPath(row, col.field ?? col.key)

function cellText(row: T, col: SplendorColumn<T>): string {
  const v = cellValue(row, col)
  if (col.format) return col.format(v, row)
  if (v === null || v === undefined || v === '') return '—'
  switch (col.type) {
    case 'number': return Number.isFinite(Number(v)) ? nf.value.format(Number(v)) : String(v)
    case 'date': {
      const d = new Date(v as string | number | Date)
      return Number.isNaN(d.getTime()) ? String(v) : df.value.format(d)
    }
    case 'boolean': return v ? L.value.yes : L.value.no
    default: return typeof v === 'object' ? JSON.stringify(v) : String(v)
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// Pagination
// ═════════════════════════════════════════════════════════════════════════════
const setPage = (p: number) => { page.value = Math.max(1, Math.min(Math.floor(p) || 1, paddle.totalKnown.value ? paddle.totalPages.value : Number.MAX_SAFE_INTEGER)) }
const setPageSize = (n: number) => { if (n > 0) pageSize.value = n } // the engine resets page to 1

const rangeFrom = computed(() => (page.value - 1) * pageSize.value + 1)
const rangeTo = computed(() => (page.value - 1) * pageSize.value + paddle.rows.value.length)
const showFooter = computed(() => opts.value.summary || opts.value.paginated)

// ═════════════════════════════════════════════════════════════════════════════
// Selection
// ═════════════════════════════════════════════════════════════════════════════
const keyOf = (row: T): string | number | undefined => {
  const k = getPath(row, opts.value.rowKey)
  return typeof k === 'string' || typeof k === 'number' ? k : undefined
}
const rowId = (row: T, i: number) => keyOf(row) ?? `i${i}`
const selectedSet = computed(() => new Set(selected.value))
const isSelected = (row: T) => { const k = keyOf(row); return k !== undefined && selectedSet.value.has(k) }
const known = new Map<string | number, T>() // rows we have seen selected, for cross-page events

function setSelected(keys: Array<string | number>) {
  selected.value = keys
  emit('selection:change', { keys, rows: selectedRows() })
}
function selectedRows(): T[] {
  return selected.value.map((k) => known.get(k) ?? paddle.allRows.value.find((r) => keyOf(r) === k)).filter((r): r is T => r !== undefined)
}
function toggleRow(row: T) {
  const k = keyOf(row)
  if (k === undefined) return
  if (opts.value.selectable === 'single') { known.clear(); known.set(k, row); setSelected([k]); return }
  if (selectedSet.value.has(k)) { known.delete(k); setSelected(selected.value.filter((x) => x !== k)) }
  else { known.set(k, row); setSelected([...selected.value, k]) }
}
const pageKeys = computed(() => paddle.rows.value.map(keyOf).filter((k): k is string | number => k !== undefined))
const allOnPageSelected = computed(() => pageKeys.value.length > 0 && pageKeys.value.every((k) => selectedSet.value.has(k)))
const selectAllRef = ref<HTMLInputElement | null>(null)
watch([() => selected.value, pageKeys], () => {
  if (selectAllRef.value) selectAllRef.value.indeterminate = !allOnPageSelected.value && pageKeys.value.some((k) => selectedSet.value.has(k))
}, { flush: 'post' })
function toggleAllOnPage() {
  if (allOnPageSelected.value) {
    const drop = new Set(pageKeys.value)
    drop.forEach((k) => known.delete(k))
    setSelected(selected.value.filter((k) => !drop.has(k)))
  } else {
    for (const r of paddle.rows.value) { const k = keyOf(r); if (k !== undefined) known.set(k, r) }
    setSelected([...new Set([...selected.value, ...pageKeys.value])])
  }
}
function clearSelection() { known.clear(); setSelected([]) }

// ═════════════════════════════════════════════════════════════════════════════
// Chart view (rendered by the existing RChart)
// ═════════════════════════════════════════════════════════════════════════════
const chartRef = ref<{ exportAs: (f: 'png' | 'svg' | 'csv') => void } | null>(null)
const colLabel = (key: string) => props.columns.find((c) => c.key === key)?.label ?? key
const toNum = (v: unknown) => (v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Number(v))

const chartProps = computed<Record<string, unknown> | null>(() => {
  const c = opts.value.chart
  if (!c) return null
  const rows = paddle.rows.value
  const field = (key: string) => props.columns.find((x) => x.key === key)?.field ?? key
  const names = rows.map((r) => String(getPath(r, field(c.categoryKey)) ?? ''))
  const base = { type: c.type, title: c.title, height: c.height ?? 320, toolbar: false, header: { visible: false }, variant: 'flat', locale: props.locale, ...c.props }
  if (c.type === 'pie' || c.type === 'doughnut' || c.type === 'funnel') {
    const key = c.series[0]?.key
    return { ...base, data: rows.map((r, i) => ({ name: names[i], value: key ? toNum(getPath(r, field(key))) : null })) }
  }
  return {
    ...base,
    categories: names,
    series: c.series.map((s) => ({ name: s.label ?? colLabel(s.key), type: s.type, data: rows.map((r) => toNum(getPath(r, field(s.key)))) })),
  }
})

function setView(v: 'table' | 'chart') {
  if (view.value === v) return
  view.value = v
  emit('view:change', v)
}

// ═════════════════════════════════════════════════════════════════════════════
// Export (CSV / Excel built in, SVG through the chart, hooks override all three)
// ═════════════════════════════════════════════════════════════════════════════
const exportItems = computed(() => {
  const e = opts.value.export
  const items: Array<{ label: string; icon: string; onSelect: () => void }> = []
  if (e.csv) items.push({ label: L.value.exportCsv, icon: 'i-lucide-file-text', onSelect: () => void exportAs('csv') })
  if (e.excel) items.push({ label: L.value.exportExcel, icon: 'i-lucide-file-spreadsheet', onSelect: () => void exportAs('excel') })
  if (e.svg && opts.value.chart) items.push({ label: L.value.exportSvg, icon: 'i-lucide-image', onSelect: () => void exportAs('svg') })
  return items
})

async function exportAs(format: SplendorExportFormat, scope: 'page' | 'all' = opts.value.export.scope) {
  const e = opts.value.export
  const fileName = safeFileName(e.fileName || props.title || 'data')
  let rows: T[] = paddle.rows.value

  if (scope === 'all') {
    if (mode.value === 'local') rows = paddle.allRows.value
    else if (e.fetchAll) rows = await e.fetchAll(requestState())
  }

  const ctx: SplendorExportContext<T> = { format, fileName, columns: visibleCols.value, rows, scope }
  const handler = e.handlers?.[format]
  emit('export', { ...ctx, handled: Boolean(handler) })
  if (handler) { await handler(ctx); return }

  if (format === 'svg') {
    if (!opts.value.chart) return
    if (view.value !== 'chart') { setView('chart'); await nextTick(); await nextTick() }
    chartRef.value?.exportAs('svg')
    return
  }

  const head = ctx.columns.map((c) => c.label)
  const raw = (r: T): XlsxCell[] =>
    ctx.columns.map((c) => {
      const v = cellValue(r, c)
      if (v === null || v === undefined) return null
      if (typeof v === 'number' || typeof v === 'boolean' || typeof v === 'string') return v
      return v instanceof Date ? v.toISOString() : JSON.stringify(v)
    })

  if (format === 'csv') {
    downloadBlob(tableToCsv({ columns: head, rows: rows.map((r) => raw(r).map((v) => (typeof v === 'boolean' ? String(v) : (v ?? null)))) }), `${fileName}.csv`)
  } else {
    downloadBlob(buildXlsx(props.title || 'Data', head, rows.map(raw)), `${fileName}.xlsx`)
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// Status, events, a11y
// ═════════════════════════════════════════════════════════════════════════════
const showSkeleton = computed(() => mode.value === 'api' && (paddle.status.value === 'idle' || (paddle.loading.value && !paddle.rows.value.length)))
const skeletonRows = computed(() => Math.min(pageSize.value || 6, 8))
const onRefresh = () => { emit('refresh'); void paddle.refresh() }

const announcement = computed(() => {
  if (paddle.loading.value) return L.value.loading
  if (paddle.error.value) return paddle.error.value.message
  return paddle.status.value === 'success' ? `${paddle.total.value} ${L.value.loaded}` : ''
})

watch(paddle.status, (s) => emit('status:change', s))
watch([search, filters], () => emit('data:filterChange', { search: search.value, filters: filters.value, activeCount: activeCount.value }))
watch(sort, (s) => emit('data:sortChange', s))
watch([page, pageSize], () => emit('data:pageChange', { page: page.value, pageSize: pageSize.value }))
watch(
  () => [paddle.rows.value, paddle.total.value] as const,
  ([items, total]) =>
    emit('data:change', {
      items, total, totalKnown: paddle.totalKnown.value, page: page.value, pageSize: pageSize.value,
      totalPages: paddle.totalPages.value, search: search.value, filters: filters.value, sort: sort.value, source: mode.value,
    }),
  { flush: 'post' },
)

const slotCtx = computed(() => ({
  mode: mode.value,
  status: paddle.status.value,
  rows: paddle.rows.value,
  total: paddle.total.value,
  page: page.value,
  pageSize: pageSize.value,
  search: search.value,
  filters: filters.value,
  sort: sort.value,
  refresh: onRefresh,
}))

const rootClass = computed(() => ({
  'is-dense': opts.value.dense,
  'is-striped': opts.value.striped,
  'is-sticky': opts.value.stickyHeader,
}))

onBeforeUnmount(() => {
  clearTimeout(searchTimer)
  for (const t of filterTimers.values()) clearTimeout(t)
  filterTimers.clear()
  paddle.stop()
})

defineExpose({
  /** Re-run the current query (API mode). */
  refresh: onRefresh,
  resetSearch,
  resetFilters,
  resetSort,
  /** Search + filters + sort. */
  resetAll,
  exportAs,
  setPage,
  setPageSize,
  clearSelection,
  /** Current query + paging snapshot. */
  getState: () => ({ ...requestState(), mode: mode.value, status: paddle.status.value, total: paddle.total.value, totalPages: paddle.totalPages.value }),
  rows: paddle.rows,
  status: paddle.status,
  error: paddle.error,
})
</script>

<style lang="scss">
// Unscoped on purpose (UPopover / UDropdownMenu render in portals, consumers restyle freely). SARIKA tokens only.
.r-splendor {
  --rs-pad: 1rem;

  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
  padding: var(--rs-pad);
  color: var(--c-text);
  font-family: var(--font-fallback);
  border: 1px solid var(--c-border);
  border-radius: var(--r-lg, 16px);
  background: var(--bg-card, var(--c-surface));

  &__sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

  &__header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
  &__title { margin: 0; font-size: 1rem; font-weight: 600; }
  &__subtitle { margin: 0.125rem 0 0; font-size: 0.8125rem; color: var(--c-muted); }

  // ── Toolbar ────────────────────────────────────────────────────────────────
  &__toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.5rem; }
  &__toolbar-start, &__toolbar-end { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; min-width: 0; }
  &__toolbar-start { flex: 1 1 18rem; }
  &__search { flex: 1 1 14rem; max-width: 24rem; }

  &__seg {
    display: inline-flex; padding: 0.125rem; border: 1px solid var(--c-border); border-radius: var(--r-md, 12px);
    background: color-mix(in srgb, var(--c-muted) 7%, transparent);

    button {
      display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.25rem 0.625rem; font: inherit; font-size: 0.75rem; font-weight: 500;
      border: 0; border-radius: calc(var(--r-md, 12px) - 2px); color: var(--c-muted); background: transparent; cursor: pointer;
      &.is-active { color: var(--c-accent); background: var(--c-surface); box-shadow: 0 1px 2px rgb(0 0 0 / 0.12); }
      &:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 1px; }
    }
  }

  &__columns { display: grid; gap: 0.25rem; margin: 0; padding: 0.5rem 0.75rem; list-style: none; font-size: 0.8125rem; label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; } input { accent-color: var(--c-accent); } }

  // ── Filters ────────────────────────────────────────────────────────────────
  &__filters {
    display: flex; flex-wrap: wrap; align-items: flex-end; gap: 0.75rem 1rem; padding: 0.75rem;
    border: 1px dashed color-mix(in srgb, var(--c-accent) 45%, transparent); border-radius: var(--r-md, 12px);
    background: color-mix(in srgb, var(--c-accent) 5%, transparent);
  }
  &__field {
    display: grid; gap: 0.25rem; min-width: 10rem; font-size: 0.75rem; color: var(--c-muted);
    input, select { padding: 0.375rem 0.5rem; font: inherit; font-size: 0.8125rem; border: 1px solid var(--c-border); border-radius: var(--r-sm, 8px); color: var(--c-text); background: var(--c-surface); &:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 0; } }
  }
  &__range { display: flex; align-items: center; gap: 0.375rem; input { flex: 1; min-width: 0; } }

  // ── Bulk ───────────────────────────────────────────────────────────────────
  &__bulk { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem; padding: 0.5rem 0.75rem; font-size: 0.8125rem; border-radius: var(--r-md, 12px); background: color-mix(in srgb, var(--c-accent) 10%, transparent); }

  // ── Body ───────────────────────────────────────────────────────────────────
  &__body { position: relative; min-height: 8rem; transition: opacity var(--t-base, 250ms) var(--ease-out, ease-out); &.is-refreshing { opacity: 0.55; pointer-events: none; } }
  &__scroll { overflow-x: auto; border: 1px solid var(--c-border); border-radius: var(--r-md, 12px); }
  &__chart { padding: 0.5rem 0; }

  &__banner { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; padding: 0.5rem 0.75rem; font-size: 0.8125rem; border-radius: var(--r-md, 12px); color: var(--c-danger); background: color-mix(in srgb, var(--c-danger) 10%, transparent); }

  &__table {
    width: 100%; border-collapse: collapse; font-size: 0.875rem;
    th, td { padding: 0.625rem 0.875rem; border-bottom: 1px solid var(--c-border); white-space: nowrap; &.is-end { text-align: end; } &.is-center { text-align: center; } &.is-start { text-align: start; } }
    th { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--c-muted); background: color-mix(in srgb, var(--c-muted) 6%, var(--c-surface)); }
    tbody tr { transition: background var(--t-fast, 150ms) var(--ease-out, ease-out); &:hover { background: color-mix(in srgb, var(--c-accent) 5%, transparent); } &:last-child td { border-bottom: 0; } &.is-selected { background: color-mix(in srgb, var(--c-accent) 10%, transparent); } }
    input[type='checkbox'], input[type='radio'] { accent-color: var(--c-accent); }
  }
  &__check { width: 2.5rem; }
  &__actions-col { width: 1%; text-align: end; white-space: nowrap; }

  &__sort {
    display: inline-flex; align-items: center; gap: 0.25rem; padding: 0; font: inherit; font-weight: inherit; letter-spacing: inherit; text-transform: inherit; color: inherit; background: none; border: 0; cursor: pointer;
    &:hover { color: var(--c-text); } &:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 2px; border-radius: 4px; }
  }
  &__sort-icon { opacity: 0.45; &.is-on { opacity: 1; color: var(--c-accent); } }
  &__sort-n { font-size: 0.625rem; color: var(--c-accent); }

  &.is-dense &__table th, &.is-dense &__table td { padding: 0.375rem 0.75rem; }
  &.is-striped &__table tbody tr:nth-child(even) { background: color-mix(in srgb, var(--c-muted) 5%, transparent); }
  &.is-sticky &__scroll { max-height: 32rem; overflow-y: auto; }
  &.is-sticky &__table th { position: sticky; top: 0; z-index: 1; }

  // ── States ─────────────────────────────────────────────────────────────────
  &__state { display: grid; justify-items: center; gap: 0.375rem; padding: 2.5rem 1rem; text-align: center; }
  &__state-icon { display: grid; place-items: center; width: 3rem; height: 3rem; margin-bottom: 0.25rem; border-radius: 50%; font-size: 1.375rem; color: var(--c-muted); background: color-mix(in srgb, var(--c-muted) 12%, transparent); &.is-error { color: var(--c-danger); background: color-mix(in srgb, var(--c-danger) 12%, transparent); } }
  &__state-title { margin: 0; font-weight: 600; }
  &__state-text { margin: 0 0 0.5rem; font-size: 0.8125rem; color: var(--c-muted); }

  &__skeleton {
    display: grid; gap: 0.5rem; padding: 0.5rem 0;
    i { height: 2.25rem; border-radius: var(--r-sm, 8px); background: linear-gradient(100deg, color-mix(in srgb, var(--c-muted) 10%, transparent) 30%, color-mix(in srgb, var(--c-accent) 16%, transparent) 50%, color-mix(in srgb, var(--c-muted) 10%, transparent) 70%); background-size: 300% 100%; animation: r-splendor-shimmer 1.6s ease-in-out infinite; animation-delay: var(--d); }
  }

  // ── Footer ─────────────────────────────────────────────────────────────────
  &__footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.75rem; font-size: 0.8125rem; color: var(--c-muted); }
  &__summary { margin: 0; }
  &__paging { display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem 1rem; }
  &__size { display: inline-flex; align-items: center; gap: 0.5rem; select { padding: 0.25rem 0.375rem; font: inherit; border: 1px solid var(--c-border); border-radius: var(--r-sm, 8px); color: var(--c-text); background: var(--c-surface); } }
  &__prevnext { display: inline-flex; align-items: center; gap: 0.5rem; }

  @media (max-width: 640px) {
    --rs-pad: 0.75rem;
    &__seg button span { display: none; }
    &__field { min-width: 100%; }
  }
}

@keyframes r-splendor-shimmer { 0% { background-position: 100% 0; } 100% { background-position: 0 0; } }
@media (prefers-reduced-motion: reduce) { .r-splendor__skeleton i { animation: none; } .r-splendor__body, .r-splendor__table tbody tr { transition: none; } }
</style>
