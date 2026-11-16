import type { RChartType } from './types'

// ─────────────────────────────────────────────────────────────────────────────
// Query state (all of it is v-model-able on the component)
// ─────────────────────────────────────────────────────────────────────────────
export type SplendorSortDir = 'asc' | 'desc'
export interface SplendorSort {
  /** `SplendorColumn.key` */
  key: string
  dir: SplendorSortDir
}

export interface SplendorRange<V = string | number> {
  from?: V | null
  to?: V | null
}
/** text → string · select → string | number · boolean → boolean · number → range · date → range (YYYY-MM-DD) */
export type SplendorFilterValue = string | number | boolean | SplendorRange | null | undefined
export type SplendorFilterValues = Record<string, SplendorFilterValue>

// ─────────────────────────────────────────────────────────────────────────────
// Columns & filters
// ─────────────────────────────────────────────────────────────────────────────
export type SplendorColumnType = 'text' | 'number' | 'date' | 'boolean'

export interface SplendorColumn<T = Record<string, any>> {
  /** Unique id; also the default data path (`'user.name'` works). Slot names: `cell-<key>`, `header-<key>`. */
  key: string
  label: string
  /** Data path when it differs from `key`. */
  field?: string
  type?: SplendorColumnType
  sortable?: boolean
  /** Name sent to the server for sorting (API mode). Default: `key`. */
  sortKey?: string
  /** Local-mode comparator; overrides the built-in one. */
  sortFn?: (a: T, b: T) => number
  /** `false` = hidden by default (can be toggled when `options.columnToggle`). */
  visible?: boolean
  align?: 'start' | 'center' | 'end'
  width?: string
  class?: string
  /** Display formatter (does not affect sorting / filtering). */
  format?: (value: unknown, row: T) => string
}

export interface SplendorFilterOption {
  label: string
  value: string | number
}

export interface SplendorFilterDef<T = Record<string, any>> {
  key: string
  label: string
  type: 'text' | 'select' | 'boolean' | 'number' | 'date'
  /** Data path (local mode). Default: `key`. */
  field?: string
  /** Name sent to the server (API mode). Default: `key`. */
  param?: string
  options?: SplendorFilterOption[]
  placeholder?: string
  /** Local-mode predicate; overrides the built-in matching. Return `true` to keep the row. */
  apply?: (row: T, value: SplendorFilterValue) => boolean
}

export interface SplendorRowAction {
  key: string
  label: string
  icon?: string
  color?: 'neutral' | 'error' | 'primary'
  disabled?: boolean | ((row: any) => boolean)
}

// ─────────────────────────────────────────────────────────────────────────────
// API mode
// ─────────────────────────────────────────────────────────────────────────────
export interface SplendorParamMap {
  page?: string // default 'page'
  pageSize?: string // 'page_size'
  search?: string // 'search'
  sort?: string // 'sort'        (sortFormat 'colon' | 'prefix')
  sortBy?: string // 'sort_by'   (sortFormat 'split')
  sortDir?: string // 'sort_dir' (sortFormat 'split')
  /** Static `api.filter` is sent under this name. Default 'filter'. */
  filter?: string
  /** Static `api.where` is sent under this name. Default 'where'. */
  where?: string
  /** `undefined` → each user filter is sent flat (`status=active`). A name → nested (`filters: { status: 'active' }`). */
  filters?: string
  /** Suffixes for range filters: `price_from`, `price_to`. */
  rangeFrom?: string // '_from'
  rangeTo?: string // '_to'
}

export type SplendorSortFormat = 'colon' | 'prefix' | 'split'

export interface SplendorResponseMap {
  /** Dot path (`'data.items'`) or function. Default: auto-detect (root array, Items, items, data, results, rows, list…). */
  items?: string | ((raw: any) => unknown)
  total?: string | ((raw: any) => unknown)
  totalPages?: string | ((raw: any) => unknown)
  page?: string | ((raw: any) => unknown)
  pageSize?: string | ((raw: any) => unknown)
}

export interface SplendorRequestState {
  search: string
  filters: SplendorFilterValues
  sort: SplendorSort[]
  page: number
  pageSize: number
}

export interface SplendorApi<T = Record<string, any>> {
  url: string
  /** Default `'GET'`. GET sends `params`; every other method sends `body`. */
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** Static query / body params merged into every request. */
  params?: Record<string, unknown>
  /** Static filter always applied (sent as `paramMap.filter`). Objects are JSON-stringified for GET. */
  filter?: Record<string, unknown> | string
  /** Static where-clause always applied (sent as `paramMap.where`). Objects are JSON-stringified for GET. */
  where?: Record<string, unknown> | string
  paramMap?: SplendorParamMap
  sortFormat?: SplendorSortFormat
  /** First page number the server expects (0 or 1). Default 1. */
  pageBase?: 0 | 1
  responseMap?: SplendorResponseMap
  /** Full control over the request params (receives the defaults it would have sent). */
  buildParams?: (state: SplendorRequestState, defaults: Record<string, unknown>) => Record<string, unknown>
  /** Full control over response mapping. */
  transform?: (raw: any) => { items: T[]; total?: number; totalPages?: number; page?: number; pageSize?: number }
  /** Extra `useHttp` options (responseType, alertError, …). `method`, `signal`, `params`, `body` are set by the component. */
  options?: Record<string, unknown>
  /** Retries for network errors / 5xx / 408 / 429 (default `options.retry`). */
  retry?: number
}

export type SplendorErrorKind = 'network' | 'offline' | 'unauthorized' | 'http' | 'mapping' | 'config'
export interface SplendorError {
  kind: SplendorErrorKind
  message: string
  status?: number
  /** Raw `error` value returned by `useHttp`. */
  detail?: unknown
  retryable: boolean
}

export interface SplendorDataChange<T = Record<string, any>> {
  items: T[]
  total: number
  /** `false` when an API response carried no total (only prev / next paging is possible). */
  totalKnown: boolean
  page: number
  pageSize: number
  totalPages: number
  search: string
  filters: SplendorFilterValues
  sort: SplendorSort[]
  source: SplendorMode
}

export type SplendorStatus = 'idle' | 'loading' | 'success' | 'error'
export type SplendorMode = 'api' | 'local'

// ─────────────────────────────────────────────────────────────────────────────
// Options
// ─────────────────────────────────────────────────────────────────────────────
export interface SplendorExportContext<T = Record<string, any>> {
  format: SplendorExportFormat
  fileName: string
  columns: SplendorColumn<T>[]
  rows: T[]
  scope: 'page' | 'all'
}
export type SplendorExportFormat = 'csv' | 'excel' | 'svg'

export interface SplendorChartConfig {
  type: RChartType
  /** Column / field used for categories (x axis, pie names). */
  categoryKey: string
  series: Array<{ key: string; label?: string; type?: 'line' | 'area' | 'bar' | 'scatter' }>
  title?: string
  height?: number | string
  /** Passed straight to <RChart> (display, toolbar, colors, currency, options…). */
  props?: Record<string, unknown>
}

export interface SplendorOptions<T = Record<string, any>> {
  searchable?: boolean
  searchPlaceholder?: string
  /** ms. Default 300. */
  searchDebounce?: number
  /** Searches shorter than this are ignored (API + local). Default 0. */
  minSearchLength?: number
  /** Local mode: data paths to search. Default: every column's field. */
  searchFields?: string[]

  filterable?: boolean
  paginated?: boolean
  pageSizeOptions?: number[]
  defaultPageSize?: number

  sortable?: boolean
  multiSort?: boolean

  selectable?: boolean | 'single' | 'multiple'
  rowKey?: string

  columnToggle?: boolean
  refreshable?: boolean
  rowActions?: SplendorRowAction[]

  /** API mode: retries for retryable failures. Default 0. */
  retry?: number
  /** ms; doubles on each attempt. Default 500. */
  retryDelay?: number

  dense?: boolean
  striped?: boolean
  stickyHeader?: boolean
  summary?: boolean

  export?: {
    csv?: boolean
    excel?: boolean
    /** Needs `chart`. */
    svg?: boolean
    fileName?: string
    /** `'all'` in API mode needs `fetchAll`. Default `'page'`. */
    scope?: 'page' | 'all'
    /** API mode: return every row matching the current query. */
    fetchAll?: (state: SplendorRequestState) => Promise<T[]>
    /** Replace the built-in export for a format. */
    handlers?: Partial<Record<SplendorExportFormat, (ctx: SplendorExportContext<T>) => void | Promise<void>>>
  } | false

  /** Optional chart view of the current rows (rendered with RChart). */
  chart?: SplendorChartConfig
}

export type ResolvedSplendorOptions<T = Record<string, any>> = Required<
  Pick<
    SplendorOptions<T>,
    | 'searchable' | 'searchDebounce' | 'minSearchLength' | 'filterable' | 'paginated' | 'pageSizeOptions' | 'defaultPageSize'
    | 'sortable' | 'multiSort' | 'rowKey' | 'columnToggle' | 'refreshable' | 'retry' | 'retryDelay'
    | 'dense' | 'striped' | 'stickyHeader' | 'summary'
  >
> & {
  selectable: false | 'single' | 'multiple'
  searchPlaceholder?: string
  searchFields?: string[]
  rowActions: SplendorRowAction[]
  export: Exclude<SplendorOptions<T>['export'], false | undefined> & { scope: 'page' | 'all' }
  chart?: SplendorChartConfig
}

export const DEFAULT_SPLENDOR_OPTIONS = {
  searchable: true,
  searchDebounce: 300,
  minSearchLength: 0,
  filterable: true,
  paginated: true,
  pageSizeOptions: [10, 25, 50, 100],
  defaultPageSize: 10,
  sortable: true,
  multiSort: false,
  rowKey: 'id',
  columnToggle: false,
  refreshable: true,
  retry: 0,
  retryDelay: 500,
  dense: false,
  striped: false,
  stickyHeader: false,
  summary: true,
} as const

export function resolveSplendorOptions<T>(options: SplendorOptions<T> | undefined): ResolvedSplendorOptions<T> {
  const o = options ?? {}
  const pageSizeOptions = o.pageSizeOptions?.length ? o.pageSizeOptions : [...DEFAULT_SPLENDOR_OPTIONS.pageSizeOptions]
  const exp = o.export === false ? {} : (o.export ?? {})
  return {
    ...DEFAULT_SPLENDOR_OPTIONS,
    ...stripUndefined(o as Record<string, unknown>),
    pageSizeOptions,
    defaultPageSize: o.defaultPageSize ?? pageSizeOptions[0] ?? DEFAULT_SPLENDOR_OPTIONS.defaultPageSize,
    selectable: o.selectable === true ? 'multiple' : o.selectable || false,
    rowActions: o.rowActions ?? [],
    export: { scope: 'page', ...exp, ...(o.export === false ? { csv: false, excel: false, svg: false } : {}) },
  } as ResolvedSplendorOptions<T>
}

function stripUndefined<V extends Record<string, unknown>>(obj: V): V {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as V
}

// ─────────────────────────────────────────────────────────────────────────────
// Labels (i18n: pass translated strings; English defaults)
// ─────────────────────────────────────────────────────────────────────────────
export interface SplendorLabels {
  search: string
  clearSearch: string
  filters: string
  resetFilters: string
  columns: string
  refresh: string
  retry: string
  loading: string
  loaded: string
  empty: string
  emptyHint: string
  noResults: string
  error: string
  rowsPerPage: string
  showing: string
  of: string
  selected: string
  clearSelection: string
  selectAll: string
  selectRow: string
  actions: string
  export: string
  exportCsv: string
  exportExcel: string
  exportSvg: string
  viewTable: string
  viewChart: string
  any: string
  yes: string
  no: string
  from: string
  to: string
  sortedBy: string
}

export const DEFAULT_SPLENDOR_LABELS: SplendorLabels = {
  search: 'Search',
  clearSearch: 'Clear search',
  filters: 'Filters',
  resetFilters: 'Reset filters',
  columns: 'Columns',
  refresh: 'Refresh',
  retry: 'Try again',
  loading: 'Loading data',
  loaded: 'results loaded',
  empty: 'Nothing here yet',
  emptyHint: 'There is no data to show.',
  noResults: 'No results match your search or filters',
  error: 'Could not load the data',
  rowsPerPage: 'Rows per page',
  showing: 'Showing',
  of: 'of',
  selected: 'selected',
  clearSelection: 'Clear selection',
  selectAll: 'Select all rows on this page',
  selectRow: 'Select row',
  actions: 'Actions',
  export: 'Export',
  exportCsv: 'CSV',
  exportExcel: 'Excel (.xlsx)',
  exportSvg: 'Chart as SVG',
  viewTable: 'Table',
  viewChart: 'Chart',
  any: 'Any',
  yes: 'Yes',
  no: 'No',
  from: 'From',
  to: 'To',
  sortedBy: 'sorted',
}
