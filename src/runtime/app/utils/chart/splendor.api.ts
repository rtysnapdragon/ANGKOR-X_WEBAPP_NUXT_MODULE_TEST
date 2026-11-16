import { getPath, isFilterEmpty, isRange } from './splendor.local'
import type {
  SplendorApi,
  SplendorColumn,
  SplendorError,
  SplendorFilterDef,
  SplendorParamMap,
  SplendorRequestState,
  SplendorResponseMap,
  SplendorSort,
} from './splendor.types'

export const DEFAULT_PARAM_MAP: Required<Omit<SplendorParamMap, 'filters'>> & Pick<SplendorParamMap, 'filters'> = {
  page: 'page',
  pageSize: 'page_size',
  search: 'search',
  sort: 'sort',
  sortBy: 'sort_by',
  sortDir: 'sort_dir',
  filter: 'filter',
  where: 'where',
  filters: undefined,
  rangeFrom: '_from',
  rangeTo: '_to',
}

/**
 * Ready-made `api` fragments for known backend conventions. Spread into the `api` prop:
 *   :api="{ url, ...SPLENDOR_PRESETS.rtable }"
 * `rtable` uses the payload names of the existing RTable server-side mode
 * (Pages / Records / Search / OrderBy / OrderDir). Verify them against your endpoint.
 */
export const SPLENDOR_PRESETS = {
  rtable: {
    paramMap: { page: 'Pages', pageSize: 'Records', search: 'Search', sortBy: 'OrderBy', sortDir: 'OrderDir' },
    sortFormat: 'split',
  },
} as const satisfies Record<string, Pick<SplendorApi, 'paramMap' | 'sortFormat'>>

// ─────────────────────────────────────────────────────────────────────────────
// Request
// ─────────────────────────────────────────────────────────────────────────────
function serializeSort(
  sort: readonly SplendorSort[],
  columns: readonly SplendorColumn[],
  api: SplendorApi,
  map: typeof DEFAULT_PARAM_MAP,
): Record<string, unknown> {
  if (!sort.length) return {}
  const serverKey = (key: string) => columns.find((c) => c.key === key)?.sortKey ?? key
  switch (api.sortFormat ?? 'colon') {
    case 'prefix':
      return { [map.sort]: sort.map((s) => `${s.dir === 'desc' ? '-' : ''}${serverKey(s.key)}`).join(',') }
    case 'split': {
      const first = sort[0]!
      return { [map.sortBy]: serverKey(first.key), [map.sortDir]: first.dir }
    }
    default:
      return { [map.sort]: sort.map((s) => `${serverKey(s.key)}:${s.dir}`).join(',') }
  }
}

function serializeFilters(
  values: SplendorRequestState['filters'],
  defs: readonly SplendorFilterDef[],
  map: typeof DEFAULT_PARAM_MAP,
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const def of defs) {
    const value = values[def.key]
    if (isFilterEmpty(value)) continue
    const name = def.param ?? def.key
    if (isRange(value)) {
      if (value.from !== null && value.from !== undefined && value.from !== '') out[`${name}${map.rangeFrom}`] = value.from
      if (value.to !== null && value.to !== undefined && value.to !== '') out[`${name}${map.rangeTo}`] = value.to
    } else {
      out[name] = value
    }
  }
  return map.filters ? (Object.keys(out).length ? { [map.filters]: out } : {}) : out
}

export interface BuiltRequest {
  method: NonNullable<SplendorApi['method']>
  /** GET → query params, anything else → JSON body. */
  payload: Record<string, unknown>
}

export interface BuildRequestInput {
  api: SplendorApi
  state: SplendorRequestState
  columns: readonly SplendorColumn[]
  filterDefs: readonly SplendorFilterDef[]
  paginated: boolean
  searchable: boolean
  minSearchLength: number
}

export function buildRequest(input: BuildRequestInput): BuiltRequest {
  const { api, state, columns, filterDefs } = input
  const map = { ...DEFAULT_PARAM_MAP, ...api.paramMap }
  const method = (api.method ?? 'GET').toUpperCase() as BuiltRequest['method']

  const defaults: Record<string, unknown> = {
    ...(api.params ?? {}),
    ...(api.filter !== undefined && api.filter !== '' ? { [map.filter]: api.filter } : {}),
    ...(api.where !== undefined && api.where !== '' ? { [map.where]: api.where } : {}),
    ...(input.paginated
      ? { [map.page]: state.page - 1 + (api.pageBase ?? 1), [map.pageSize]: state.pageSize }
      : {}),
    ...(input.searchable && state.search.trim().length >= Math.max(1, input.minSearchLength)
      ? { [map.search]: state.search.trim() }
      : {}),
    ...serializeSort(state.sort, columns, api, map),
    ...serializeFilters(state.filters, filterDefs, map),
  }

  const params = api.buildParams ? api.buildParams(state, defaults) : defaults
  return { method, payload: method === 'GET' ? toQuery(params) : params }
}

/** GET-safe params: drop empties, join arrays, JSON-stringify objects, keep primitives. */
export function toQuery(params: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue
    if (Array.isArray(value)) out[key] = value.join(',')
    else if (value instanceof Date) out[key] = value.toISOString()
    else if (typeof value === 'object') out[key] = JSON.stringify(value)
    else out[key] = value
  }
  return out
}

// ─────────────────────────────────────────────────────────────────────────────
// Response
// ─────────────────────────────────────────────────────────────────────────────
const ITEM_KEYS = ['Items', 'items', 'data', 'Data', 'results', 'Results', 'rows', 'Rows', 'list', 'List', 'records', 'Records']
const TOTAL_PATHS = [
  'Total', 'total', 'TotalCount', 'totalCount', 'total_count', 'TotalItems', 'totalItems', 'total_items', 'TotalRecord', 'totalRecords',
  'Count', 'count', 'meta.total', 'Meta.Total', 'pagination.total', 'Pagination.Total', 'pagination.totalItems', 'data.total', 'data.Total',
]
const PAGES_PATHS = ['TotalPages', 'totalPages', 'total_pages', 'Pages', 'pages', 'meta.totalPages', 'meta.last_page', 'pagination.totalPages', 'data.totalPages']
const PAGE_PATHS = ['Page', 'page', 'CurrentPage', 'currentPage', 'current_page', 'meta.page', 'meta.current_page', 'pagination.page']
const SIZE_PATHS = ['PageSize', 'pageSize', 'page_size', 'PerPage', 'perPage', 'per_page', 'meta.per_page', 'meta.pageSize', 'pagination.pageSize']

const resolve = (raw: unknown, spec: string | ((r: any) => unknown) | undefined, fallbacks: readonly string[]): unknown => {
  if (typeof spec === 'function') return spec(raw)
  if (typeof spec === 'string') return getPath(raw, spec)
  for (const path of fallbacks) {
    const v = getPath(raw, path)
    if (v !== undefined && v !== null) return v
  }
  return undefined
}

const toCount = (v: unknown): number | undefined => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined
}

function detectItems(raw: unknown): unknown[] | undefined {
  if (Array.isArray(raw)) return raw
  for (const key of ITEM_KEYS) {
    const v = getPath(raw, key)
    if (Array.isArray(v)) return v
    // `{ data: { items: [...] } }`
    if (v && typeof v === 'object') {
      for (const inner of ITEM_KEYS) {
        const w = getPath(v, inner)
        if (Array.isArray(w)) return w
      }
    }
  }
  return undefined
}

export interface MappedResponse<T> {
  items: T[]
  total?: number
  totalPages?: number
  page?: number
  pageSize?: number
}

/** Returns `null` when the payload has no recognisable item list. */
export function mapResponse<T>(raw: unknown, api: Pick<SplendorApi<T>, 'transform' | 'responseMap'>): MappedResponse<T> | null {
  if (api.transform) {
    const out = api.transform(raw)
    return out && Array.isArray(out.items) ? out : null
  }
  const map: SplendorResponseMap = api.responseMap ?? {}
  const itemsValue = map.items === undefined ? detectItems(raw) : resolve(raw, map.items, [])
  if (!Array.isArray(itemsValue)) return null

  return {
    items: itemsValue as T[],
    total: toCount(resolve(raw, map.total, TOTAL_PATHS)),
    totalPages: toCount(resolve(raw, map.totalPages, PAGES_PATHS)),
    page: toCount(resolve(raw, map.page, PAGE_PATHS)),
    pageSize: toCount(resolve(raw, map.pageSize, SIZE_PATHS)),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Failures — shaped after what `useHttp` actually returns
//   success : { data: ref(body), error: ref(null), status }
//   failure : { data: ref(null), error: ref(err.response?.data), status }   (aborted / no response → error undefined)
//   401     : { data: ref(null), error: ref(null), status: 401 }            (silent, after a failed token refresh)
//   no cfg  : { data: ref(null), error: ref(true) }
//   offline : error { Message: 'No internet connection', StatusCode: 1001 }
// ─────────────────────────────────────────────────────────────────────────────
export interface HttpLikeResponse {
  data: { value: unknown }
  error: { value: unknown }
  status?: number
}

export function classifyFailure(res: HttpLikeResponse): SplendorError | null {
  const err = res.error.value
  const status = res.status

  if (err === null && status === 401) return { kind: 'unauthorized', message: 'Unauthorized', status, retryable: false }
  if (err === null) return null

  if (err === true) return { kind: 'config', message: 'Invalid request configuration', retryable: false, detail: err }

  const body = (typeof err === 'object' && err !== null ? err : {}) as { Message?: unknown; message?: unknown; detail?: unknown; StatusCode?: unknown }
  const text = [body.Message, body.message, body.detail, typeof err === 'string' ? err : undefined].find((v) => typeof v === 'string' && v) as string | undefined

  if (body.StatusCode === 1001) return { kind: 'offline', message: text ?? 'No internet connection', retryable: true, detail: err }
  if (status === undefined) return { kind: 'network', message: text ?? 'Network error', retryable: true, detail: err }
  return {
    kind: 'http',
    message: text ?? `Request failed (${status})`,
    status,
    detail: err,
    retryable: status >= 500 || status === 408 || status === 429,
  }
}
