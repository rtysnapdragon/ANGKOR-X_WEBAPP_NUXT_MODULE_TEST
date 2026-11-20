import { computed, watch, type Ref } from 'vue'
import type { RowSelectionState, Updater } from '@tanstack/vue-table'
import type { OCRow } from './types'

export interface OCSelectionOptions<TRow extends OCRow> {
  /** The component's v-model: row objects, or bare primary keys when `idsOnly()` is true. */
  model: Ref<unknown[]>
  pk: () => string | undefined
  /** `selectAllPk` + server mode: the model holds primary keys instead of row objects. */
  idsOnly: () => boolean
  /** Rows currently loaded in the table (used to resolve newly selected ids to objects). */
  rows: () => readonly TRow[]
}

/**
 * The app owns the selection (it is the component's v-model and must survive pagination),
 * so the `rowSelection` slice is controlled through `state` + `onRowSelectionChange`
 * rather than held internally by the table.
 */
export function useOCTableSelection<TRow extends OCRow>(opts: OCSelectionOptions<TRow>) {
  let latest: unknown[] = opts.model.value
  // Parent-driven changes (clear, programmatic select) must win over our cached copy.
  watch(opts.model, (value) => (latest = value), { flush: 'sync' })

  const idOf = (item: unknown): string | undefined => {
    const raw = opts.idsOnly() ? item : (item as OCRow | null | undefined)?.[opts.pk() ?? '']
    return raw == null ? undefined : String(raw)
  }

  const rowSelection = computed<RowSelectionState>(() => {
    const map: RowSelectionState = {}
    if (!opts.pk()) return map
    for (const item of opts.model.value) {
      const id = idOf(item)
      if (id !== undefined) map[id] = true
    }
    return map
  })

  function onRowSelectionChange(updater: Updater<RowSelectionState>) {
    const previous = rowSelection.value
    const next = typeof updater === 'function' ? updater(previous) : updater

    const kept = opts.model.value.filter((item) => {
      const id = idOf(item)
      return id !== undefined && !!next[id]
    })

    const pk = opts.pk()
    const added: unknown[] = []
    if (pk) {
      const keptIds = new Set(kept.map(idOf))
      let byId: Map<string, TRow> | undefined
      for (const id of Object.keys(next)) {
        if (!next[id] || keptIds.has(id)) continue
        byId ??= new Map(opts.rows().map((row) => [String(row[pk]), row]))
        const row = byId.get(id)
        if (row) added.push(opts.idsOnly() ? row[pk] : row)
      }
    }

    latest = [...kept, ...added]
    opts.model.value = latest
  }

  return {
    rowSelection,
    onRowSelectionChange,
    /**
     * Value just committed to the model. A controlled `defineModel` only reflects the new
     * array after the parent re-renders, so event payloads read it from here instead.
     */
    latest: () => latest,
    set(next: unknown[]) {
      latest = next
      opts.model.value = next
    },
  }
}
