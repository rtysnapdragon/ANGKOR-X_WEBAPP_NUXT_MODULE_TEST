import { computed, getCurrentScope, onScopeDispose, ref, shallowRef, toValue, watch } from 'vue'
import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import { buildRequest, classifyFailure, mapResponse } from '../utils/chart/splendor.api'
import type { BuiltRequest, HttpLikeResponse } from '../utils/chart/splendor.api'
import { clampPage, paginate, processLocal } from '../utils/chart/splendor.local'
import type {
  ResolvedSplendorOptions,
  SplendorApi,
  SplendorColumn,
  SplendorError,
  SplendorFilterDef,
  SplendorFilterValues,
  SplendorMode,
  SplendorSort,
  SplendorStatus,
} from '~/utils/chart/splendor.types'

/** Minimal shape of the project's `useHttp` (see composables/http.ts). */
export type PaddleHttp = (url: string, options?: Record<string, any>) => Promise<HttpLikeResponse>

/** The five pieces of controllable query state (the component binds them to `defineModel`). */
export interface PaddleQuery {
  search: Ref<string>
  filters: Ref<SplendorFilterValues>
  page: Ref<number>
  pageSize: Ref<number>
  sort: Ref<SplendorSort[]>
}

export interface UseChartPaddleInput<T> {
  mode: MaybeRefOrGetter<SplendorMode>
  /** Local mode only. Never read in API mode. */
  data: MaybeRefOrGetter<readonly T[] | undefined>
  /** API mode only. Never read in local mode. */
  api: MaybeRefOrGetter<SplendorApi<T> | undefined>
  columns: MaybeRefOrGetter<readonly SplendorColumn<T>[]>
  filterDefs: MaybeRefOrGetter<readonly SplendorFilterDef<T>[]>
  options: MaybeRefOrGetter<ResolvedSplendorOptions<T>>
  query: PaddleQuery
  /** Pass the project's `useHttp`. Never called in local mode. */
  http: PaddleHttp
  locale?: MaybeRefOrGetter<string | undefined>
  onError?: (error: SplendorError) => void
}

export interface UseChartPaddleReturn<T> {
  /** Rows to render (already paginated). */
  rows: ComputedRef<T[]>
  /** Every row matching the query, before pagination (local mode; = `rows` in API mode). */
  allRows: ComputedRef<T[]>
  total: ComputedRef<number>
  /** `false` when an API response carried no total metadata (pagination falls back to prev / next). */
  totalKnown: ComputedRef<boolean>
  totalPages: ComputedRef<number>
  hasNext: ComputedRef<boolean>
  status: Ref<SplendorStatus>
  error: Ref<SplendorError | null>
  loading: ComputedRef<boolean>
  /** Loading while rows are already on screen (keep them, show a veil). */
  refreshing: ComputedRef<boolean>
  request: Ref<BuiltRequest | null>
  /** Begin fetching (API mode). Call from `onMounted` so SSR never fires requests. */
  start: () => void
  stop: () => void
  /** Re-run the current query now (API mode); a no-op in local mode. */
  refresh: () => Promise<void>
}

// ─────────────────────────────────────────────────────────────────────────────
const stable = (value: unknown): string =>
  JSON.stringify(value, (_k, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)))
      : v,
  )

/** Resolves `false` if `signal` aborts while waiting. */
const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<boolean>((resolve) => {
    if (signal.aborted) return resolve(false)
    const t = setTimeout(() => { signal.removeEventListener('abort', onAbort); resolve(true) }, ms)
    const onAbort = () => { clearTimeout(t); resolve(false) }
    signal.addEventListener('abort', onAbort, { once: true })
  })

export function useChartPaddle<T extends Record<string, any>>(input: UseChartPaddleInput<T>): UseChartPaddleReturn<T> {
  const { query } = input
  const isApi = computed(() => toValue(input.mode) === 'api')
  const opts = computed(() => toValue(input.options))

  const status = ref<SplendorStatus>('idle')
  const error = ref<SplendorError | null>(null)
  const request = ref<BuiltRequest | null>(null)

  // ── Local mode ─────────────────────────────────────────────────────────────
  const processed = computed<T[]>(() => {
    if (isApi.value) return []
    const o = opts.value
    const columns = toValue(input.columns)
    return processLocal(toValue(input.data) ?? [], {
      search: query.search.value,
      minSearchLength: o.minSearchLength,
      searchFields: o.searchFields ?? columns.map((c) => c.field ?? c.key),
      filters: query.filters.value,
      filterDefs: toValue(input.filterDefs),
      sort: query.sort.value,
      columns,
      locale: toValue(input.locale),
    })
  })

  // ── API mode ───────────────────────────────────────────────────────────────
  const remoteRows = shallowRef<T[]>([])
  const remoteTotal = ref<number | undefined>(undefined)
  const remotePages = ref<number | undefined>(undefined)

  const totalKnown = computed(() => !isApi.value || remoteTotal.value !== undefined || remotePages.value !== undefined)

  const total = computed(() => {
    if (!isApi.value) return processed.value.length
    if (remoteTotal.value !== undefined) return remoteTotal.value
    if (remotePages.value !== undefined) return remotePages.value * query.pageSize.value
    return (query.page.value - 1) * query.pageSize.value + remoteRows.value.length // what we have seen so far
  })

  const hasNext = computed(() => {
    if (!opts.value.paginated) return false
    if (totalKnown.value) return query.page.value < totalPages.value
    return remoteRows.value.length >= query.pageSize.value
  })

  const totalPages = computed(() => {
    if (!opts.value.paginated) return 1
    const size = Math.max(1, query.pageSize.value)
    if (!totalKnown.value) return query.page.value + (remoteRows.value.length >= size ? 1 : 0)
    if (isApi.value && remotePages.value !== undefined && remoteTotal.value === undefined) return Math.max(1, remotePages.value)
    return Math.max(1, Math.ceil(total.value / size))
  })

  const rows = computed<T[]>(() => {
    if (isApi.value) return remoteRows.value
    if (!opts.value.paginated) return processed.value
    return paginate(processed.value, clampPage(query.page.value, totalPages.value), query.pageSize.value)
  })
  const allRows = computed<T[]>(() => (isApi.value ? remoteRows.value : processed.value))

  const loading = computed(() => isApi.value && status.value === 'loading')
  const refreshing = computed(() => loading.value && remoteRows.value.length > 0)

  // ── Fetching ───────────────────────────────────────────────────────────────
  let started = false
  let scheduled = false
  let requestId = 0
  let controller: AbortController | null = null

  function cancel() {
    controller?.abort()
    controller = null
    requestId++ // anything still in flight is now stale
  }

  function fail(e: SplendorError) {
    status.value = 'error'
    error.value = e
    input.onError?.(e)
  }

  async function load(): Promise<void> {
    if (!isApi.value) return
    const api = toValue(input.api)
    if (!api?.url) {
      fail({ kind: 'config', message: 'RChartSplendor: `api.url` is required in API mode', retryable: false })
      return
    }

    controller?.abort()
    const ctrl = (controller = new AbortController())
    const id = ++requestId
    const isCurrent = () => id === requestId && !ctrl.signal.aborted

    const o = opts.value
    const built = buildRequest({
      api: api as SplendorApi,
      state: {
        search: query.search.value,
        filters: query.filters.value,
        sort: query.sort.value,
        page: query.page.value,
        pageSize: query.pageSize.value,
      },
      columns: toValue(input.columns) as SplendorColumn[],
      filterDefs: toValue(input.filterDefs) as SplendorFilterDef[],
      paginated: o.paginated,
      searchable: o.searchable,
      minSearchLength: o.minSearchLength,
    })
    request.value = built

    status.value = 'loading'
    error.value = null

    const maxRetries = Math.max(0, api.retry ?? o.retry)
    let attempt = 0

    // eslint-disable-next-line no-constant-condition
    while (true) {
      let res: HttpLikeResponse
      try {
        res = await input.http(api.url, {
          ...(api.options ?? {}),
          method: built.method,
          signal: ctrl.signal,
          ...(built.method === 'GET' ? { params: built.payload } : { body: built.payload }),
        })
      } catch (e) {
        if (!isCurrent()) return
        const message = e instanceof Error ? e.message : 'Network error'
        res = { data: { value: null }, error: { value: { message } }, status: undefined }
      }

      // Stale or cancelled: a newer request owns the state. (useHttp reports aborts as `error: undefined`.)
      if (!isCurrent()) return

      const failure = classifyFailure(res)
      if (!failure) {
        const mapped = mapResponse<T>(res.data.value, api)
        if (!mapped) {
          fail({ kind: 'mapping', message: 'Unrecognised response: no item list found. Set `api.responseMap.items` or `api.transform`.', retryable: false, detail: res.data.value })
          return
        }

        // The requested page no longer exists (rows were deleted, filter narrowed): jump to the last real page.
        if (o.paginated && mapped.items.length === 0 && query.page.value > 1) {
          const pages = mapped.totalPages ?? (mapped.total !== undefined ? Math.ceil(mapped.total / query.pageSize.value) : 1)
          const target = Math.min(query.page.value - 1, Math.max(1, pages))
          remoteTotal.value = mapped.total
          remotePages.value = mapped.totalPages
          query.page.value = target // → requestKey changes → one more request
          return
        }

        remoteRows.value = mapped.items
        remoteTotal.value = mapped.total
        remotePages.value = mapped.totalPages
        status.value = 'success'
        error.value = null
        return
      }

      if (attempt < maxRetries && failure.retryable) {
        attempt++
        const waited = await sleep(o.retryDelay * 2 ** (attempt - 1), ctrl.signal)
        if (!waited || !isCurrent()) return
        continue
      }
      fail(failure)
      return
    }
  }

  function scheduleLoad() {
    if (!started || !isApi.value || scheduled) return
    scheduled = true
    // One request per tick, however many pieces of query state changed (e.g. filter + page reset).
    queueMicrotask(() => {
      scheduled = false
      void load()
    })
  }

  // The only two watchers: page reset, and "something the server cares about changed".
  const effectiveSearch = computed(() => {
    const s = query.search.value.trim()
    return s.length >= Math.max(1, opts.value.minSearchLength) ? s : ''
  })

  const resetKey = computed(() => {
    const api = toValue(input.api)
    return stable({
      s: effectiveSearch.value,
      f: query.filters.value,
      o: query.sort.value,
      z: query.pageSize.value,
      a: api && { u: api.url, m: api.method, p: api.params, f: api.filter, w: api.where, pm: api.paramMap, sf: api.sortFormat },
    })
  })
  watch(resetKey, () => { if (query.page.value !== 1) query.page.value = 1 })

  const requestKey = computed(() => stable({ r: resetKey.value, p: query.page.value, g: opts.value.paginated, m: isApi.value }))
  watch(requestKey, () => {
    if (isApi.value) scheduleLoad()
    else { cancel(); status.value = 'success' }
  })

  // Local mode: keep the page valid when the data shrinks.
  watch(totalPages, (pages) => {
    if (!isApi.value && opts.value.paginated && query.page.value > pages) query.page.value = Math.max(1, pages)
  })

  function start() {
    started = true
    if (isApi.value) void load()
    else status.value = 'success'
  }

  function stop() {
    started = false
    cancel()
  }

  async function refresh() {
    if (!isApi.value) return
    scheduled = false
    await load()
  }

  if (getCurrentScope()) onScopeDispose(stop)
  if (!isApi.value) status.value = 'success'

  return { rows, allRows, total, totalKnown, totalPages, hasNext, status, error, loading, refreshing, request, start, stop, refresh }
}
