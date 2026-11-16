import { describe, expect, it } from 'vitest'
import { SPLENDOR_PRESETS, buildRequest, classifyFailure, mapResponse, toQuery } from '../app/utils/chart/splendor.api'
import { activeFilterCount, clampPage, filterRows, getPath, paginate, processLocal, searchRows, sortRows } from '../app/utils/chart/splendor.local'
import { resolveSplendorOptions } from '../app/utils/chart/splendor.types'
import type { SplendorColumn, SplendorFilterDef } from '../app/utils/chart/splendor.types'
import { buildXlsx, safeSheetName } from '../app/utils/chart/xlsx'

interface User { id: number; name: string; age: number | null; active: boolean; joined: string; role: string; profile?: { city: string } }
const users: User[] = [
  { id: 1, name: 'Sokha', age: 31, active: true, joined: '2026-01-10', role: 'admin', profile: { city: 'Phnom Penh' } },
  { id: 2, name: 'Dara', age: 24, active: false, joined: '2026-03-02', role: 'user', profile: { city: 'Siem Reap' } },
  { id: 3, name: 'Vannak', age: null, active: true, joined: '2026-02-20', role: 'user' },
  { id: 4, name: 'Bopha', age: 45, active: true, joined: '2025-12-31', role: 'user', profile: { city: 'Phnom Penh' } },
  { id: 5, name: 'dara2', age: 9, active: false, joined: '2026-03-15', role: 'admin' },
]
const columns: SplendorColumn<User>[] = [
  { key: 'name', label: 'Name' },
  { key: 'age', label: 'Age', type: 'number' },
  { key: 'joined', label: 'Joined', type: 'date' },
  { key: 'active', label: 'Active', type: 'boolean' },
  { key: 'city', label: 'City', field: 'profile.city' },
]
const defs: SplendorFilterDef<User>[] = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'role', label: 'Role', type: 'select' },
  { key: 'active', label: 'Active', type: 'boolean' },
  { key: 'age', label: 'Age', type: 'number' },
  { key: 'joined', label: 'Joined', type: 'date', param: 'joined_at' },
]

describe('local helpers', () => {
  it('getPath is safe', () => {
    expect(getPath(users[0], 'profile.city')).toBe('Phnom Penh')
    expect(getPath(users[2], 'profile.city')).toBeUndefined()
    expect(getPath(users[0], '__proto__.x')).toBeUndefined()
    expect(getPath(null, 'a')).toBeUndefined()
  })

  it('searches case-insensitively across fields, ignoring objects', () => {
    expect(searchRows(users, 'DARA', ['name']).map((u) => u.id)).toEqual([2, 5])
    expect(searchRows(users, 'phnom', ['profile.city']).map((u) => u.id)).toEqual([1, 4])
    expect(searchRows(users, '  ', ['name'])).toHaveLength(5)
  })

  it('filters: text, select, boolean, number range, date range (inclusive end of day)', () => {
    const ids = (v: Record<string, any>) => filterRows(users, defs, v).map((u) => u.id)
    expect(ids({ name: 'ar' })).toEqual([2, 5])
    expect(ids({ role: 'admin' })).toEqual([1, 5])
    expect(ids({ active: false })).toEqual([2, 5])
    expect(ids({ active: true })).toEqual([1, 3, 4])
    expect(ids({ age: { from: 24, to: 40 } })).toEqual([1, 2])
    expect(ids({ age: { from: 40 } })).toEqual([4])
    expect(ids({ joined: { from: '2026-03-02', to: '2026-03-02' } })).toEqual([2])
    expect(ids({ joined: { to: '2026-01-10' } })).toEqual([1, 4])
    expect(ids({ role: '', age: { from: '', to: null } })).toHaveLength(5) // empties ignored
    expect(activeFilterCount({ role: '', age: { from: 1 }, active: false })).toBe(2)
  })

  it('custom filter predicate wins', () => {
    const d: SplendorFilterDef<User>[] = [{ key: 'adult', label: 'Adult', type: 'boolean', apply: (r, v) => ((r.age ?? 0) >= 18) === v }]
    expect(filterRows(users, d, { adult: true }).map((u) => u.id)).toEqual([1, 2, 4])
  })

  it('sorts: typed, desc, nulls last in both directions, stable, multi-column', () => {
    const names = (s: any[]) => sortRows(users, s, columns).map((u) => u.id)
    expect(names([{ key: 'age', dir: 'asc' }])).toEqual([5, 2, 1, 4, 3])
    expect(names([{ key: 'age', dir: 'desc' }])).toEqual([4, 1, 2, 5, 3]) // null (Vannak) stays last
    expect(names([{ key: 'name', dir: 'asc' }])).toEqual([4, 2, 5, 1, 3])
    expect(names([{ key: 'joined', dir: 'desc' }])).toEqual([5, 2, 3, 1, 4])
    expect(names([{ key: 'active', dir: 'desc' }, { key: 'age', dir: 'asc' }])).toEqual([1, 4, 3, 5, 2])
    expect(names([])).toEqual([1, 2, 3, 4, 5])
    expect(names([{ key: 'nope', dir: 'asc' }])).toEqual([1, 2, 3, 4, 5])
  })

  it('numeric-aware text sort and custom sortFn', () => {
    const rows = [{ n: 'item10' }, { n: 'item2' }, { n: 'Item1' }]
    const cols: SplendorColumn<{ n: string }>[] = [{ key: 'n', label: 'N' }]
    expect(sortRows(rows, [{ key: 'n', dir: 'asc' }], cols).map((r) => r.n)).toEqual(['Item1', 'item2', 'item10'])
    const custom: SplendorColumn<{ n: string }>[] = [{ key: 'n', label: 'N', sortFn: (a, b) => a.n.length - b.n.length }]
    expect(sortRows(rows, [{ key: 'n', dir: 'desc' }], custom).map((r) => r.n)).toEqual(['item10', 'item2', 'Item1'])
  })

  it('processLocal honours minSearchLength; paginate / clampPage are safe', () => {
    const base = { searchFields: ['name'], filters: {}, filterDefs: defs, sort: [], columns, minSearchLength: 3 }
    expect(processLocal(users, { ...base, search: 'da' })).toHaveLength(5) // too short → ignored
    expect(processLocal(users, { ...base, search: 'dar' })).toHaveLength(2)
    expect(paginate([1, 2, 3, 4, 5], 2, 2)).toEqual([3, 4])
    expect(paginate([1, 2, 3], 9, 2)).toEqual([])
    expect(paginate([1, 2, 3], 0, 0)).toEqual([1])
    expect(clampPage(9, 3)).toBe(3)
    expect(clampPage(-2, 3)).toBe(1)
    expect(clampPage(Number.NaN, 0)).toBe(1)
  })
})

describe('buildRequest', () => {
  const state = { search: ' sok ', filters: { role: 'admin', active: false, age: { from: 20, to: 30 }, joined: { from: '2026-01-01' }, name: '' }, sort: [{ key: 'name', dir: 'asc' as const }, { key: 'age', dir: 'desc' as const }], page: 3, pageSize: 25 }
  const base = { state, columns, filterDefs: defs, paginated: true, searchable: true, minSearchLength: 0 }

  it('GET: sends page, size, search, sort, flat filters with range suffixes and static filter/where', () => {
    const r = buildRequest({ ...base, api: { url: '/u', filter: { tenant: 7 }, where: 'deleted=0', params: { include: ['a', 'b'] } } })
    expect(r.method).toBe('GET')
    expect(r.payload).toEqual({
      include: 'a,b', filter: '{"tenant":7}', where: 'deleted=0', page: 3, page_size: 25, search: 'sok',
      sort: 'name:asc,age:desc', role: 'admin', active: false, age_from: 20, age_to: 30, joined_at_from: '2026-01-01',
    })
  })

  it('maps names, sort formats, zero-based pages and nested filters', () => {
    const prefix = buildRequest({ ...base, api: { url: '/u', sortFormat: 'prefix', pageBase: 0, paramMap: { page: 'p', pageSize: 'size', search: 'q', filters: 'f' } } })
    expect(prefix.payload).toMatchObject({ p: 2, size: 25, q: 'sok', sort: 'name,-age' })
    expect(JSON.parse(prefix.payload.f as string)).toEqual({ role: 'admin', active: false, age_from: 20, age_to: 30, joined_at_from: '2026-01-01' })
    const split = buildRequest({ ...base, api: { url: '/u', sortFormat: 'split' } })
    expect(split.payload).toMatchObject({ sort_by: 'name', sort_dir: 'asc' })
    expect(split.payload).not.toHaveProperty('sort')
  })

  it('uses column.sortKey, keeps objects in a POST body, and honours buildParams', () => {
    const cols: SplendorColumn<User>[] = [{ key: 'name', label: 'Name', sortKey: 'full_name' }]
    const post = buildRequest({ ...base, columns: cols, api: { url: '/u', method: 'POST', filter: { a: 1 } } })
    expect(post.method).toBe('POST')
    expect(post.payload.filter).toEqual({ a: 1 })
    expect(post.payload.sort).toBe('full_name:asc,age:desc') // keys without a column definition are sent as-is
    const custom = buildRequest({ ...base, api: { url: '/u', buildParams: (_s, d) => ({ q: d.search }) } })
    expect(custom.payload).toEqual({ q: 'sok' })
  })

  it('rtable preset sends Pages / Records / Search / OrderBy / OrderDir', () => {
    const r = buildRequest({ ...base, api: { url: '/u', ...SPLENDOR_PRESETS.rtable } })
    expect(r.payload).toMatchObject({ Pages: 3, Records: 25, Search: 'sok', OrderBy: 'name', OrderDir: 'asc' })
    expect(r.payload).not.toHaveProperty('page')
    expect(r.payload).not.toHaveProperty('sort')
  })

  it('omits paging when not paginated, and search below minSearchLength', () => {
    const r = buildRequest({ ...base, paginated: false, minSearchLength: 5, api: { url: '/u' } })
    expect(r.payload).not.toHaveProperty('page')
    expect(r.payload).not.toHaveProperty('page_size')
    expect(r.payload).not.toHaveProperty('search')
    expect(toQuery({ a: '', b: null, c: undefined, d: 0, e: false })).toEqual({ d: 0, e: false })
  })
})

describe('mapResponse', () => {
  it('auto-detects common shapes', () => {
    expect(mapResponse([1, 2], {})).toEqual({ items: [1, 2], total: undefined, totalPages: undefined, page: undefined, pageSize: undefined })
    expect(mapResponse({ Items: [1], Total: 40, Page: 2, PageSize: 10 }, {})).toMatchObject({ items: [1], total: 40, page: 2, pageSize: 10 })
    expect(mapResponse({ results: [1], count: '12' }, {})).toMatchObject({ total: 12 })
    expect(mapResponse({ data: { items: [1, 2], total: 9 } }, {})).toMatchObject({ items: [1, 2], total: 9 })
    expect(mapResponse({ items: [], meta: { total: 0, last_page: 4 } }, {})).toMatchObject({ total: 0, totalPages: 4 })
  })

  it('supports dot paths, functions and transform; rejects unknown shapes', () => {
    expect(mapResponse({ payload: { list: [7] }, n: 3 }, { responseMap: { items: 'payload.list', total: 'n' } })).toMatchObject({ items: [7], total: 3 })
    expect(mapResponse({ x: [1] }, { responseMap: { items: (r) => r.x, total: () => 99 } })).toMatchObject({ items: [1], total: 99 })
    expect(mapResponse('raw', { transform: () => ({ items: [1], total: 1 }) })).toEqual({ items: [1], total: 1 })
    expect(mapResponse({ nothing: true }, {})).toBeNull()
    expect(mapResponse(null, {})).toBeNull()
    expect(mapResponse({ Items: [1], Total: -4 }, {})?.total).toBeUndefined()
  })
})

describe('classifyFailure (shapes returned by useHttp)', () => {
  const res = (error: unknown, status?: number) => ({ data: { value: null }, error: { value: error }, status })
  it('maps every useHttp outcome', () => {
    expect(classifyFailure({ data: { value: [] }, error: { value: null }, status: 200 })).toBeNull()
    expect(classifyFailure(res(null, 401))).toMatchObject({ kind: 'unauthorized', retryable: false })
    expect(classifyFailure(res(true))).toMatchObject({ kind: 'config', retryable: false })
    expect(classifyFailure(res({ Message: 'No internet connection', StatusCode: 1001 }))).toMatchObject({ kind: 'offline', retryable: true })
    expect(classifyFailure(res(undefined))).toMatchObject({ kind: 'network', retryable: true })
    expect(classifyFailure(res({ Message: 'Boom' }, 500))).toMatchObject({ kind: 'http', status: 500, message: 'Boom', retryable: true })
    expect(classifyFailure(res({ Message: 'Bad' }, 422))).toMatchObject({ retryable: false })
    expect(classifyFailure(res({}, 429))).toMatchObject({ retryable: true, message: 'Request failed (429)' })
  })
})

describe('resolveSplendorOptions', () => {
  it('applies defaults, normalises selectable and export', () => {
    const o = resolveSplendorOptions({ selectable: true, pageSizeOptions: [5, 20], export: { csv: true } })
    expect(o).toMatchObject({ selectable: 'multiple', defaultPageSize: 5, searchable: true, paginated: true, rowKey: 'id' })
    expect(o.export).toMatchObject({ csv: true, scope: 'page' })
    expect(resolveSplendorOptions({ searchable: undefined }).searchable).toBe(true)
    expect(resolveSplendorOptions({ export: false }).export).toMatchObject({ csv: false, excel: false, svg: false })
    expect(resolveSplendorOptions(undefined).selectable).toBe(false)
  })
})

describe('buildXlsx', () => {
  it('produces a zip with the expected parts and escaped text', async () => {
    const blob = buildXlsx('Users: 2026/Q1?', ['Name', 'Age', 'Active'], [['A & <B>', 3, true], [null, 'x', false]])
    const bytes = new Uint8Array(await blob.arrayBuffer())
    expect([...bytes.slice(0, 4)]).toEqual([0x50, 0x4b, 0x03, 0x04])
    const text = new TextDecoder().decode(bytes)
    for (const part of ['[Content_Types].xml', 'xl/workbook.xml', 'xl/worksheets/sheet1.xml']) expect(text).toContain(part)
    expect(text).toContain('A &amp; &lt;B&gt;')
    expect(text).toContain('<sheet name="Users  2026 Q1"')
    expect(safeSheetName('x'.repeat(50))).toHaveLength(31)
    expect(safeSheetName('   ')).toBe('Sheet1')
  })
})
