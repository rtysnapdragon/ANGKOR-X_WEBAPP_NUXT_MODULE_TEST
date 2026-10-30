// ============================================================
// SARIKA — useApiData composable
// Typed data fetching with loading, error, refresh support
// ============================================================
import { ref, shallowRef } from 'vue'
import { useUIStore } from '@/stores/ui'

export function useApiData<T>(
  url: string | (() => string),
  options?: {
    immediate?: boolean
    transform?: (data: unknown) => T
    default?:   T
    loadingKey?: string
  }
) {
  const ui = useUIStore()

  const data    = shallowRef<T | null>(options?.default ?? null)
  const error   = ref<string | null>(null)
  const loading = ref(false)

  async function fetch(overrideUrl?: string) {
    const endpoint = overrideUrl ?? (typeof url === 'function' ? url() : url)
    loading.value = true
    error.value   = null

    const key = options?.loadingKey ?? endpoint
    ui.startLoading(key)

    try {
      const raw = await $fetch<unknown>(endpoint)
      data.value = options?.transform ? options.transform(raw) : raw as T
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to load data'
      ui.error('Load Error', error.value)
    } finally {
      loading.value = false
      ui.stopLoading(key)
    }

    return data.value
  }

  async function refresh() {
    return fetch()
  }

  if (options?.immediate !== false) {
    fetch()
  }

  return { data, error, loading, fetch, refresh }
}

// ── Convenience: paginated list ── //
export function useApiList<T>(
  url: string,
  params?: Record<string, unknown>
) {
  const items   = ref<T[]>([])
  const total   = ref(0)
  const page    = ref(1)
  const perPage = ref(20)
  const loading = ref(false)
  const error   = ref<string | null>(null)

  async function load(resetPage = false) {
    if (resetPage) page.value = 1
    loading.value = true
    error.value   = null
    try {
      const res = await $fetch<{ data: T[]; total: number }>(url, {
        params: { page: page.value, limit: perPage.value, ...params },
      })
      items.value = res.data
      total.value = res.total
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to load'
    } finally {
      loading.value = false
    }
  }

  function nextPage() { page.value++; load() }
  function prevPage() { if (page.value > 1) { page.value--; load() } }
  function setPage(p: number) { page.value = p; load() }

  load()

  return { items, total, page, perPage, loading, error, load, nextPage, prevPage, setPage }
}
