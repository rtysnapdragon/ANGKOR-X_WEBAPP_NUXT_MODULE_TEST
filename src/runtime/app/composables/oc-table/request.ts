import { onBeforeUnmount, type Ref } from 'vue'
import type { PaginationState, SortingState } from '@tanstack/vue-table'

/** Wire format expected by the backend (unchanged from the DataTables implementation). */
export interface OCRequestParams {
  Pages?: number
  Records?: number
  Search: string
  OrderBy?: string
  OrderDir?: 'ASC' | 'DESC'
  /** Parent override channel: a parent may attach `data` to the object emitted by `update:data`. */
  data?: unknown
  [extra: string]: unknown
}

export interface OCRequestState {
  pagination: PaginationState
  search: string
  sorting: SortingState
}

export function buildParams(state: OCRequestState, paging: boolean): OCRequestParams {
  const params: OCRequestParams = { Search: state.search }
  if (paging) {
    params.Pages = state.pagination.pageIndex + 1
    params.Records = state.pagination.pageSize
  }
  const sort = state.sorting[0]
  if (sort) {
    params.OrderBy = sort.id
    params.OrderDir = sort.desc ? 'DESC' : 'ASC'
  }
  return params
}

export interface NormalizedResponse<TRow> {
  /** Ids returned for "select all", read before `where` is applied (legacy order). */
  selectAllIds?: unknown[]
  /** Payload after `where`, before `dataSrc` unwrapping (what `update:dataSrc` emits). */
  payload: unknown
  rows: TRow[]
}

export function normalizeResponse<TRow>(
  raw: any,
  cfg: { where?: string; selectAllPk?: string },
): NormalizedResponse<TRow> {
  const selectAllIds = cfg.selectAllPk ? (raw?.[cfg.selectAllPk] ?? []) : undefined
  const payload = cfg.where ? raw?.[cfg.where] : raw
  const unwrapped = payload && !Array.isArray(payload) && 'dataSrc' in payload ? payload.dataSrc : payload
  return { selectAllIds, payload, rows: Array.isArray(unwrapped) ? unwrapped : [] }
}

/** Total record count as reported by the backend on the first row, falling back to list length. */
export function resolveTotal(list: readonly Record<string, any>[]): number {
  if (!list.length) return 0
  const first = list[0]
  return (
    first?.RecordCount ||
    first?.RecordsCount ||
    first?.RecordCounts ||
    first?.TotalRecord ||
    list.length
  )
}

export const STALE = Symbol('oc-table-stale-request')

/**
 * Runs one request at a time. Starting a new one aborts the previous, and a superseded
 * request resolves to STALE so callers never apply out-of-order responses.
 */
export function useAbortableRequest(loading: Ref<boolean>) {
  let controller: AbortController | undefined
  let sequence = 0

  async function run<T>(exec: (signal: AbortSignal) => Promise<T>): Promise<T | typeof STALE> {
    controller?.abort()
    controller = new AbortController()
    const id = ++sequence
    loading.value = true
    try {
      const value = await exec(controller.signal)
      return id === sequence ? value : STALE
    } catch (error) {
      if (id !== sequence) return STALE
      throw error
    } finally {
      if (id === sequence) loading.value = false
    }
  }

  function abort() {
    controller?.abort()
    sequence++
  }

  onBeforeUnmount(abort)

  return { run, abort }
}
