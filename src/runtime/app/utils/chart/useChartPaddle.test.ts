import { describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { useChartPaddle } from '../app/composables/useChartPaddle'
import type { PaddleHttp } from '../app/composables/useChartPaddle'
import { resolveSplendorOptions } from '../app/utils/chart/splendor.types'
import type { SplendorApi, SplendorColumn, SplendorFilterDef, SplendorOptions } from '../app/utils/chart/splendor.types'

interface Row { id: number; name: string; role: string }
const columns: SplendorColumn<Row>[] = [{ key: 'id', label: 'ID', type: 'number' }, { key: 'name', label: 'Name' }]
const filterDefs: SplendorFilterDef<Row>[] = [{ key: 'role', label: 'Role', type: 'select' }]
const makeRows = (n: number): Row[] => Array.from({ length: n }, (_, i) => ({ id: i + 1, name: `User ${i + 1}`, role: i % 2 ? 'user' : 'admin' }))

const ok = (body: unknown, status = 200) => ({ data: { value: body }, error: { value: null }, status })
const failed = (error: unknown, status?: number) => ({ data: { value: null }, error: { value: error }, status })
const flush = async () => { for (let i = 0; i < 6; i++) { await nextTick(); await Promise.resolve() } }
const deferred = <V,>() => { let resolve!: (v: V) => void; const promise = new Promise<V>((r) => (resolve = r)); return { promise, resolve } }

function setup(opts: { mode?: 'api' | 'local'; data?: Row[]; api?: SplendorApi<Row>; options?: SplendorOptions<Row>; http?: PaddleHttp; onError?: (e: any) => void } = {}) {
  const query = { search: ref(''), filters: ref<Record<string, any>>({}), page: ref(1), pageSize: ref(10), sort: ref<any[]>([]) }
  const data = ref<Row[] | undefined>(opts.data)
  const api = ref(opts.api)
  const http = opts.http ?? vi.fn<PaddleHttp>(async () => ok([]))
  const scope = effectScope()
  const paddle = scope.run(() =>
    useChartPaddle<Row>({
      mode: opts.mode ?? 'api',
      data,
      api,
      columns,
      filterDefs,
      options: resolveSplendorOptions<Row>(opts.options),
      query,
      http,
      onError: opts.onError,
    }),
  )!
  return { query, data, api, http: http as ReturnType<typeof vi.fn<PaddleHttp>>, paddle, scope }
}

describe('local mode', () => {
  it('never calls http, even when an api is supplied and everything changes', async () => {
    const { http, paddle, query, scope } = setup({ mode: 'local', data: makeRows(30), api: { url: '/never' } })
    paddle.start()
    query.search.value = 'user 1'
    query.page.value = 2
    query.sort.value = [{ key: 'name', dir: 'desc' }]
    await flush()
    await paddle.refresh()
    expect(http).not.toHaveBeenCalled()
    expect(paddle.status.value).toBe('success')
    scope.stop()
  })

  it('searches, filters, sorts and paginates; changing a filter resets the page', async () => {
    const { paddle, query } = setup({ mode: 'local', data: makeRows(45) })
    paddle.start()
    expect(paddle.total.value).toBe(45)
    expect(paddle.totalPages.value).toBe(5)
    expect(paddle.rows.value).toHaveLength(10)

    query.page.value = 5
    await flush()
    expect(paddle.rows.value.map((r) => r.id)).toEqual([41, 42, 43, 44, 45])

    query.filters.value = { role: 'admin' }
    await flush()
    expect(query.page.value).toBe(1)
    expect(paddle.total.value).toBe(23)

    query.search.value = 'user 4'
    await flush()
    expect(paddle.rows.value.map((r) => r.id)).toEqual([41, 43, 45]) // 'user 4…' ∩ role=admin (odd ids)

    query.sort.value = [{ key: 'id', dir: 'desc' }]
    await flush()
    expect(paddle.rows.value[0]!.id).toBeGreaterThan(paddle.rows.value.at(-1)!.id)
  })

  it('changing page size resets to page 1', async () => {
    const { paddle, query } = setup({ mode: 'local', data: makeRows(45) })
    query.page.value = 3
    await flush()
    query.pageSize.value = 25
    await flush()
    expect(query.page.value).toBe(1)
    expect(paddle.totalPages.value).toBe(2)
  })

  it('reacts to parent data changes and clamps the page when the data shrinks', async () => {
    const { paddle, query, data } = setup({ mode: 'local', data: makeRows(45) })
    query.page.value = 5
    await flush()
    data.value = makeRows(12)
    await flush()
    expect(query.page.value).toBe(2)
    expect(paddle.rows.value).toHaveLength(2)
    data.value = undefined
    await flush()
    expect(paddle.rows.value).toEqual([])
    expect(query.page.value).toBe(1)
  })

  it('does not paginate when paginated is false', () => {
    const { paddle } = setup({ mode: 'local', data: makeRows(45), options: { paginated: false } })
    expect(paddle.rows.value).toHaveLength(45)
    expect(paddle.totalPages.value).toBe(1)
  })
})

describe('API mode', () => {
  it('does nothing until started (SSR-safe), then sends one request with the full query', async () => {
    const http = vi.fn<PaddleHttp>(async () => ok({ Items: makeRows(10), Total: 95 }))
    const { paddle, query } = setup({ http, api: { url: '/users', filter: { tenant: 1 } } })
    query.search.value = 'x'
    await flush()
    expect(http).not.toHaveBeenCalled()

    paddle.start()
    await flush()
    expect(http).toHaveBeenCalledTimes(1)
    const [url, o] = http.mock.calls[0]!
    expect(url).toBe('/users')
    expect(o).toMatchObject({ method: 'GET', params: { page: 1, page_size: 10, search: 'x', filter: '{"tenant":1}' } })
    expect(o!.signal).toBeInstanceOf(AbortSignal)
    expect(paddle.rows.value).toHaveLength(10)
    expect(paddle.total.value).toBe(95)
    expect(paddle.totalPages.value).toBe(10)
    expect(paddle.totalKnown.value).toBe(true)
    expect(paddle.status.value).toBe('success')
  })

  it('does not paginate / filter / sort client-side', async () => {
    const server = [{ id: 9, name: 'Z', role: 'x' }, { id: 1, name: 'A', role: 'y' }]
    const http = vi.fn<PaddleHttp>(async () => ok({ Items: server, Total: 2 }))
    const { paddle, query } = setup({ http, api: { url: '/u' } })
    paddle.start()
    await flush()
    query.sort.value = [{ key: 'id', dir: 'asc' }]
    query.filters.value = { role: 'nope' }
    await flush()
    expect(paddle.rows.value).toEqual(server) // exactly what the server returned, same order
  })

  it('coalesces a filter change + page reset into one request, with page 1', async () => {
    const http = vi.fn<PaddleHttp>(async () => ok({ Items: [], Total: 0 }))
    const { paddle, query } = setup({ http, api: { url: '/u' } })
    query.page.value = 4
    paddle.start()
    await flush()
    http.mockClear()
    query.filters.value = { role: 'admin' }
    await flush()
    expect(http).toHaveBeenCalledTimes(1)
    expect(http.mock.calls[0]![1]).toMatchObject({ params: { page: 1, role: 'admin' } })
  })

  it('ignores stale responses and aborts the superseded request', async () => {
    const first = deferred<any>()
    const second = deferred<any>()
    const queue = [first, second]
    const http = vi.fn<PaddleHttp>(() => queue.shift()!.promise)
    const { paddle, query } = setup({ http, api: { url: '/u' } })
    paddle.start()
    await flush()
    query.search.value = 'new'
    await flush()
    expect(http).toHaveBeenCalledTimes(2)
    expect(http.mock.calls[0]![1]!.signal.aborted).toBe(true)

    second.resolve(ok({ Items: [{ id: 2, name: 'fresh', role: 'a' }], Total: 1 }))
    await flush()
    first.resolve(ok({ Items: [{ id: 1, name: 'OLD', role: 'a' }], Total: 1 })) // late arrival
    await flush()
    expect(paddle.rows.value.map((r) => r.name)).toEqual(['fresh'])
    expect(paddle.status.value).toBe('success')
  })

  it('a stale failure cannot overwrite newer data either', async () => {
    const first = deferred<any>()
    const second = deferred<any>()
    const queue = [first, second]
    const { paddle, query } = setup({ http: vi.fn<PaddleHttp>(() => queue.shift()!.promise), api: { url: '/u' } })
    paddle.start()
    await flush()
    query.page.value = 2
    await flush()
    second.resolve(ok({ Items: makeRows(2), Total: 12 }))
    await flush()
    first.resolve(failed({ Message: 'late' }, 500))
    await flush()
    expect(paddle.status.value).toBe('success')
    expect(paddle.error.value).toBeNull()
  })

  it('retries retryable failures with backoff, but not 4xx', async () => {
    vi.useFakeTimers()
    try {
      const retried = vi.fn<PaddleHttp>()
        .mockResolvedValueOnce(failed({ Message: 'down' }, 503))
        .mockResolvedValueOnce(failed(undefined))
        .mockResolvedValueOnce(ok({ Items: makeRows(1), Total: 1 }))
      const a = setup({ http: retried, api: { url: '/u', retry: 2 }, options: { retryDelay: 100 } })
      a.paddle.start()
      await vi.advanceTimersByTimeAsync(0)
      expect(retried).toHaveBeenCalledTimes(1)
      await vi.advanceTimersByTimeAsync(100)
      expect(retried).toHaveBeenCalledTimes(2)
      await vi.advanceTimersByTimeAsync(200)
      expect(retried).toHaveBeenCalledTimes(3)
      expect(a.paddle.status.value).toBe('success')

      const bad = vi.fn<PaddleHttp>(async () => failed({ Message: 'nope' }, 422))
      const b = setup({ http: bad, api: { url: '/u', retry: 3 } })
      b.paddle.start()
      await vi.advanceTimersByTimeAsync(5000)
      expect(bad).toHaveBeenCalledTimes(1)
      expect(b.paddle.error.value).toMatchObject({ kind: 'http', status: 422, message: 'nope' })
    } finally {
      vi.useRealTimers()
    }
  })

  it('reports errors (keeping the previous rows) and refresh() recovers', async () => {
    const onError = vi.fn()
    const http = vi.fn<PaddleHttp>()
      .mockResolvedValueOnce(ok({ Items: makeRows(3), Total: 3 }))
      .mockResolvedValueOnce(failed({ Message: 'Server exploded' }, 500))
      .mockResolvedValueOnce(ok({ Items: makeRows(4), Total: 4 }))
    const { paddle } = setup({ http, onError, api: { url: '/u' } })
    paddle.start()
    await flush()
    await paddle.refresh()
    expect(paddle.status.value).toBe('error')
    expect(paddle.error.value?.message).toBe('Server exploded')
    expect(paddle.rows.value).toHaveLength(3)
    expect(onError).toHaveBeenCalledTimes(1)
    await paddle.refresh()
    expect(paddle.status.value).toBe('success')
    expect(paddle.error.value).toBeNull()
    expect(paddle.rows.value).toHaveLength(4)
  })

  it('treats the silent 401 from useHttp as an unauthorized error', async () => {
    const { paddle } = setup({ http: vi.fn<PaddleHttp>(async () => ({ data: { value: null }, error: { value: null }, status: 401 })), api: { url: '/u' } })
    paddle.start()
    await flush()
    expect(paddle.error.value).toMatchObject({ kind: 'unauthorized', status: 401 })
  })

  it('flags unrecognised responses and a missing api.url', async () => {
    const a = setup({ http: vi.fn<PaddleHttp>(async () => ok({ weird: 1 })), api: { url: '/u' } })
    a.paddle.start()
    await flush()
    expect(a.paddle.error.value?.kind).toBe('mapping')
    const b = setup({ api: undefined })
    b.paddle.start()
    await flush()
    expect(b.paddle.error.value?.kind).toBe('config')
    expect(b.http).not.toHaveBeenCalled()
  })

  it('falls back to prev/next when the response has no total', async () => {
    const http = vi.fn<PaddleHttp>(async () => ok(makeRows(10)))
    const { paddle, query } = setup({ http, api: { url: '/u' } })
    paddle.start()
    await flush()
    expect(paddle.totalKnown.value).toBe(false)
    expect(paddle.hasNext.value).toBe(true)
    query.page.value = 2
    http.mockResolvedValueOnce(ok(makeRows(4)))
    await flush()
    expect(paddle.hasNext.value).toBe(false)
    expect(paddle.total.value).toBe(14)
  })

  it('jumps back to the last real page when the requested page is empty', async () => {
    const http = vi.fn<PaddleHttp>(async (_u, o) =>
      o!.params.page > 2 ? ok({ Items: [], Total: 15 }) : ok({ Items: makeRows(10), Total: 15 }),
    )
    const { paddle, query } = setup({ http, api: { url: '/u' } })
    query.page.value = 5
    paddle.start()
    await flush()
    expect(query.page.value).toBe(2)
    expect(http.mock.calls.at(-1)![1]!.params.page).toBe(2)
    expect(paddle.rows.value).toHaveLength(10)
    expect(paddle.status.value).toBe('success')
  })

  it('stop() aborts in-flight work and nothing is applied afterwards', async () => {
    const d = deferred<any>()
    const { paddle, http } = setup({ http: vi.fn<PaddleHttp>(() => d.promise), api: { url: '/u' } })
    paddle.start()
    await flush()
    paddle.stop()
    expect(http.mock.calls[0]![1]!.signal.aborted).toBe(true)
    d.resolve(ok({ Items: makeRows(3), Total: 3 }))
    await flush()
    expect(paddle.rows.value).toEqual([])
  })

  it('uses POST bodies for non-GET methods', async () => {
    const http = vi.fn<PaddleHttp>(async () => ok({ Items: [], Total: 0 }))
    const { paddle } = setup({ http, api: { url: '/search', method: 'POST', where: { a: 1 } } })
    paddle.start()
    await flush()
    expect(http.mock.calls[0]![1]).toMatchObject({ method: 'POST', body: { where: { a: 1 }, page: 1, page_size: 10 } })
    expect(http.mock.calls[0]![1]).not.toHaveProperty('params')
  })
})
