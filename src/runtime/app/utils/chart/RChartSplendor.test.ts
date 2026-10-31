// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'

import RChartSplendor from '../app/components/RChartSplendor.vue'

// `useRHttp` stand-in with the same return shape as composables/http.ts
const useRHttp = vi.hoisted(() => vi.fn())
vi.mock('~/composables/http', () => ({ useRHttp }))
const downloads = vi.hoisted(() => ({ blobs: [] as Array<{ blob: Blob; name: string }> }))
vi.mock('~/utils/chart/export', async (orig) => ({
  ...(await orig<typeof import('~/utils/chart/export')>()),
  downloadBlob: (blob: Blob, name: string) => downloads.blobs.push({ blob, name }),
}))

// ── Nuxt UI stand-ins (the real ones are auto-imported inside Nuxt) ──────────
const UInput = defineComponent({
  props: { modelValue: { type: String, default: '' } },
  emits: ['update:modelValue'],
  setup: (p, { emit, slots }) => () => h('div', [h('input', { class: 'u-input', value: p.modelValue, onInput: (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).value) }), slots.trailing?.()]),
})
const UButton = defineComponent({
  props: { ariaLabel: String, label: String },
  emits: ['click'],
  setup: (p, { emit, slots, attrs }) => () => h('button', { type: 'button', 'aria-label': p.ariaLabel, disabled: (attrs as any).disabled, onClick: (e: Event) => emit('click', e) }, [p.label, slots.default?.()]),
})
const passthrough = (tag = 'span') => defineComponent({ setup: (_p, { slots }) => () => h(tag, [slots.default?.(), slots.content?.()]) })
const UPagination = defineComponent({
  props: { page: Number, total: Number, itemsPerPage: Number },
  emits: ['update:page'],
  setup: (p, { emit }) => () => h('button', { class: 'u-next', onClick: () => emit('update:page', (p.page ?? 1) + 1) }, 'next'),
})
const RChartStub = defineComponent({ props: ['type', 'categories', 'series', 'data'], setup: (p) => () => h('div', { class: 'rchart-stub', 'data-type': p.type }) })

const stubs = { UInput, UButton, UBadge: passthrough(), UIcon: passthrough('i'), UPopover: passthrough('div'), UDropdownMenu: passthrough('div'), UPagination, RChart: RChartStub }

interface User { id: number; name: string; age: number; role: string }
const people: User[] = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `Person ${String(i + 1).padStart(2, '0')}`, age: 20 + (i % 7), role: i % 2 ? 'user' : 'admin' }))
const columns = [{ key: 'id', label: 'ID', type: 'number' as const }, { key: 'name', label: 'Name' }, { key: 'age', label: 'Age', type: 'number' as const }]
const filterDefs = [{ key: 'role', label: 'Role', type: 'select' as const, options: [{ label: 'Admin', value: 'admin' }, { label: 'User', value: 'user' }] }]

const ok = (body: unknown) => ({ data: { value: body }, error: { value: null }, status: 200 })
const flush = async () => { for (let i = 0; i < 6; i++) { await nextTick(); await Promise.resolve() } }
const rows = (w: ReturnType<typeof mount>) => w.findAll('tbody tr').map((tr) => tr.findAll('td').map((td) => td.text()))

beforeEach(() => { vi.useFakeTimers(); useRHttp.mockReset(); downloads.blobs.length = 0 })
afterEach(() => vi.useRealTimers())

const mountIt = (props: Record<string, unknown>, extra: Record<string, unknown> = {}) =>
  mount(RChartSplendor as any, { props: { columns, ...props }, global: { stubs, components: stubs }, ...extra })

describe('local mode', () => {
  it('renders the parent data and never touches useRHttp', async () => {
    const w = mountIt({ mode: 'local', data: people, api: { url: '/should-not-be-called' } })
    await flush()
    expect(rows(w)).toHaveLength(10)
    expect(rows(w)[0]).toEqual(['1', 'Person 01', '20'])
    expect(w.text()).toContain('Showing 1–10 of 25')
    await w.find('.u-input').setValue('person 2')
    await vi.advanceTimersByTimeAsync(400)
    await flush()
    expect(rows(w).length).toBe(6) // 'person 2' matches Person 20–25 (not 'Person 02')
    expect(useRHttp).not.toHaveBeenCalled()
    w.unmount()
  })

  it('debounces search, then resets the page; clear restores everything', async () => {
    const w = mountIt({ mode: 'local', data: people })
    await flush()
    ;(w.vm as any).setPage(3)
    await flush()
    expect(rows(w)).toHaveLength(5)
    const input = w.find('.u-input')
    await input.setValue('Person 1')
    await vi.advanceTimersByTimeAsync(100)
    expect(w.emitted('update:search')).toBeUndefined() // still debouncing
    await vi.advanceTimersByTimeAsync(300)
    await flush()
    expect(w.emitted('update:search')!.at(-1)).toEqual(['Person 1'])
    expect(w.emitted('update:page')!.at(-1)).toEqual([1])
    await w.find('button[aria-label="Clear search"]').trigger('click')
    await flush()
    expect((w.vm as any).getState().search).toBe('')
    w.unmount()
  })

  it('sorts none → asc → desc → none from the header button', async () => {
    const w = mountIt({ mode: 'local', data: people })
    await flush()
    const nameBtn = () => w.findAll('thead button.r-splendor__sort')[1]!
    const firstName = () => rows(w)[0]![1]
    await nameBtn().trigger('click'); await flush()
    expect(firstName()).toBe('Person 01')
    expect(w.findAll('thead th')[1]!.attributes('aria-sort')).toBe('ascending')
    await nameBtn().trigger('click'); await flush()
    expect(firstName()).toBe('Person 25')
    expect(w.findAll('thead th')[1]!.attributes('aria-sort')).toBe('descending')
    await nameBtn().trigger('click'); await flush()
    expect(w.findAll('thead th')[1]!.attributes('aria-sort')).toBe('none')
    expect(w.emitted('update:sort')).toHaveLength(3)
    w.unmount()
  })

  it('reacts to parent data changes and exposes resetFilters / resetSearch', async () => {
    const w = mountIt({ mode: 'local', data: people, filterDefs, filters: { role: 'admin' } })
    await flush()
    expect((w.vm as any).getState().total).toBe(13)
    await w.setProps({ data: people.slice(0, 4) })
    await flush()
    expect(rows(w)).toHaveLength(2) // admins among the first 4
    ;(w.vm as any).resetFilters()
    await flush()
    expect(w.emitted('update:filters')!.at(-1)).toEqual([{}])
    w.unmount()
  })

  it('selection: select page, emits keys + rows, clear', async () => {
    const w = mountIt({ mode: 'local', data: people, options: { selectable: true, rowKey: 'id' } })
    await flush()
    await w.find('thead input[type="checkbox"]').setValue(true)
    const evt = w.emitted('selection:change')!.at(-1)![0] as { keys: number[]; rows: User[] }
    expect(evt.keys).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(evt.rows[0]!.name).toBe('Person 01')
    expect(w.text()).toContain('10 selected')
    await w.findAll('tbody input[type="checkbox"]')[0]!.setValue(false)
    expect((w.emitted('selection:change')!.at(-1)![0] as any).keys).toHaveLength(9)
    w.unmount()
  })

  it('shows loading-free empty / no-results states with a reset action', async () => {
    const w = mountIt({ mode: 'local', data: [] })
    await flush()
    expect(w.text()).toContain('Nothing here yet')
    const w2 = mountIt({ mode: 'local', data: people, search: 'zzz-nope' })
    await flush()
    expect(w2.text()).toContain('No results match')
    w.unmount(); w2.unmount()
  })

  it('exports CSV of the processed rows (scope all) with a UTF-8 BOM', async () => {
    const w = mountIt({ mode: 'local', data: people, title: 'People', options: { export: { csv: true, scope: 'all' } }, filterDefs, filters: { role: 'admin' } })
    await flush()
    await (w.vm as any).exportAs('csv')
    const { blob, name } = downloads.blobs[0]!
    expect(name).toBe('People.csv')
    const text = await blob.text()
    expect(text.charCodeAt(0)).toBe(0xfeff)
    const lines = text.slice(1).split('\r\n')
    expect(lines[0]).toBe('ID,Name,Age')
    expect(lines).toHaveLength(1 + 13) // header + 13 admins, not just the 10 on screen
    expect(w.emitted('export')![0]![0]).toMatchObject({ format: 'csv', scope: 'all', handled: false })
    w.unmount()
  })

  it('export handlers override the built-in export', async () => {
    const handler = vi.fn()
    const w = mountIt({ mode: 'local', data: people, options: { export: { excel: true, handlers: { excel: handler } } } })
    await flush()
    await (w.vm as any).exportAs('excel')
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ format: 'excel', rows: expect.any(Array) }))
    expect(downloads.blobs).toHaveLength(0)
    w.unmount()
  })
})

describe('API mode', () => {
  const page1 = ok({ Items: people.slice(0, 10), Total: 25 })

  it('fetches on mount with page / size and renders exactly what the server sent', async () => {
    useRHttp.mockResolvedValue(page1)
    const w = mountIt({ api: { url: '/users', filter: { tenant: 1 } } })
    expect(w.find('.r-splendor__skeleton').exists()).toBe(true) // skeleton until the first response
    await flush()
    expect(useRHttp).toHaveBeenCalledTimes(1)
    expect(useRHttp.mock.calls[0]![0]).toBe('/users')
    expect(useRHttp.mock.calls[0]![1]).toMatchObject({ method: 'GET', params: { page: 1, page_size: 10, filter: '{"tenant":1}' } })
    expect(rows(w)).toHaveLength(10)
    expect(w.text()).toContain('Showing 1–10 of 25')
    w.unmount()
  })

  it('sends search / sort / filter to the server (no client-side processing) and resets the page', async () => {
    useRHttp.mockResolvedValue(page1)
    const w = mountIt({ api: { url: '/users' }, filterDefs })
    await flush()
    ;(w.vm as any).setPage(2)
    await flush()
    useRHttp.mockClear()

    await w.find('.u-input').setValue('sok')
    await vi.advanceTimersByTimeAsync(400)
    await flush()
    expect(useRHttp).toHaveBeenCalledTimes(1)
    expect(useRHttp.mock.calls[0]![1].params).toMatchObject({ page: 1, search: 'sok' })

    await w.findAll('thead button.r-splendor__sort')[1]!.trigger('click')
    await flush()
    expect(useRHttp.mock.calls.at(-1)![1].params).toMatchObject({ sort: 'name:asc', search: 'sok', page: 1 })
    expect(rows(w)[0]![1]).toBe('Person 01') // order untouched: server order is authoritative
    w.unmount()
  })

  it('immediate=false defers the first request until refresh()', async () => {
    useRHttp.mockResolvedValue(page1)
    const w = mountIt({ api: { url: '/users' }, immediate: false })
    await flush()
    expect(useRHttp).not.toHaveBeenCalled()
    await (w.vm as any).refresh()
    expect(useRHttp).toHaveBeenCalledTimes(1)
    expect(w.emitted('refresh')).toHaveLength(1)
    w.unmount()
  })

  it('shows the error state, emits @error, and Try again re-requests', async () => {
    useRHttp.mockResolvedValueOnce({ data: { value: null }, error: { value: { Message: 'Database offline' } }, status: 500 }).mockResolvedValue(page1)
    const w = mountIt({ api: { url: '/users' } })
    await flush()
    expect(w.text()).toContain('Could not load the data')
    expect(w.text()).toContain('Database offline')
    expect((w.emitted('error')![0]![0] as any)).toMatchObject({ kind: 'http', status: 500 })
    await w.findAll('button').find((b) => b.text() === 'Try again')!.trigger('click')
    await flush()
    expect(rows(w)).toHaveLength(10)
    w.unmount()
  })

  it('emits data:change / data:filterChange / data:pageChange / data:sortChange', async () => {
    useRHttp.mockResolvedValue(page1)
    const w = mountIt({ api: { url: '/users' } })
    await flush()
    expect(w.emitted('data:change')!.at(-1)![0]).toMatchObject({ total: 25, totalPages: 3, source: 'api', page: 1 })
    ;(w.vm as any).setPage(2)
    await flush()
    expect(w.emitted('data:pageChange')!.at(-1)![0]).toEqual({ page: 2, pageSize: 10 })
    await w.find('.u-input').setValue('x')
    await vi.advanceTimersByTimeAsync(400)
    await flush()
    expect(w.emitted('data:filterChange')!.at(-1)![0]).toMatchObject({ search: 'x' })
    w.unmount()
  })

  it('aborts the in-flight request on unmount and ignores it afterwards', async () => {
    let resolve!: (v: unknown) => void
    useRHttp.mockImplementation(() => new Promise((r) => (resolve = r)))
    const w = mountIt({ api: { url: '/users' } })
    await flush()
    const signal = useRHttp.mock.calls[0]![1].signal as AbortSignal
    w.unmount()
    expect(signal.aborted).toBe(true)
    resolve(page1) // late response must not throw or update anything
    await flush()
  })

  it('renders the chart view from the current rows (RChart reuse)', async () => {
    useRHttp.mockResolvedValue(page1)
    const w = mountIt({ api: { url: '/users' }, view: 'chart', options: { chart: { type: 'bar', categoryKey: 'name', series: [{ key: 'age' }] } } })
    await flush()
    expect(w.find('.rchart-stub').attributes('data-type')).toBe('bar')
    w.unmount()
  })
})

describe('template listeners (event names from the spec)', () => {
  it('@data:filterChange, @data:filter-change and @data:change reach a parent template', async () => {
    useRHttp.mockResolvedValue(ok({ Items: people.slice(0, 3), Total: 3 }))
    const camel = vi.fn(); const kebab = vi.fn(); const change = vi.fn(); const onErr = vi.fn()
    const Parent = defineComponent({
      components: { RChartSplendor },
      setup: () => ({ columns, camel, kebab, change, onErr }),
      template: `<div>
        <RChartSplendor class="a" :api="{ url: '/a' }" :columns="columns" @data:filterChange="camel" @data:change="change" @error="onErr" />
        <RChartSplendor class="b" mode="local" :data="[]" :columns="columns" @data:filter-change="kebab" />
      </div>`,
    })
    const w = mount(Parent, { global: { stubs, components: stubs } })
    await flush()
    expect(change).toHaveBeenCalledTimes(1)
    const inputs = w.findAll('.u-input')
    await inputs[0]!.setValue('abc'); await inputs[1]!.setValue('xyz')
    await vi.advanceTimersByTimeAsync(400); await flush()
    expect(camel).toHaveBeenCalledWith(expect.objectContaining({ search: 'abc' }))
    expect(kebab).toHaveBeenCalledWith(expect.objectContaining({ search: 'xyz' }))
    w.unmount()
  })
})
