import type { ColumnDef } from '@tanstack/vue-table'
import type { OCFeatures } from './features'
import type {
  OCColumn,
  OCColumnMeta,
  OCFixedColumns,
  OCRow,
} from './types'

export const SELECT_ID = '__oc_select'
export const ACTIONS_ID = '__oc_actions'
export const DRAG_ID = '__oc_drag'

export interface ColumnSpecInput {
  columns: readonly OCColumn[]
  selectedPk?: string
  hasActions: boolean
  rowReorder: boolean
  fixedColumns?: OCFixedColumns
  actionTitle: string
}

export interface ColumnSpec<TRow extends OCRow> {
  defs: ColumnDef<OCFeatures, TRow>[]
  visibility: Record<string, boolean>
  pinning: { start: string[]; end: string[] }
  /**
   * Number of columns the legacy implementation injected before the consumer's
   * columns. `options.order.idx` is relative to that legacy list.
   */
  legacyOffset: number
}

export function getByPath(row: OCRow, path: string): unknown {
  if (!path.includes('.')) return row?.[path]
  let current: any = row
  for (const key of path.split('.')) {
    if (current == null) return undefined
    current = current[key]
  }
  return current
}

export function resolveFixed(fixed?: OCFixedColumns): { start: number; end: number } {
  if (!fixed) return { start: 0, end: 0 }
  if (fixed === true) return { start: 1, end: 0 }
  return { start: fixed.start ?? fixed.left ?? 0, end: fixed.end ?? fixed.right ?? 0 }
}

function classNameFor(col: OCColumn, fixed: boolean): string {
  const parts = [col.className ?? '']
  if (col.alignRight) parts.push(col.orderable !== false ? 'have-orderable' : 'no-orderable')
  if (col.sortData?.length) parts.push('multi-sort-pr')
  if (fixed) parts.push('fixed-columns')
  if (col.isLineClamp) parts.push('isLineClamp')
  return parts.filter(Boolean).join(' ')
}

export function buildColumnSpec<TRow extends OCRow>(input: ColumnSpecInput): ColumnSpec<TRow> {
  type Def = ColumnDef<OCFeatures, TRow>
  const fixedCounts = resolveFixed(input.fixedColumns)
  const hasFixed = fixedCounts.start + fixedCounts.end > 0
  const visibility: Record<string, boolean> = {}

  const dataDefs: Def[] = input.columns.map((col, index) => {
    const field = col.data ?? null
    const id = col.id ?? field ?? `__oc_col_${index}`
    const slot =
      typeof col.render === 'string' && col.render.includes('#')
        ? col.render.replace(/#/g, '')
        : undefined

    const meta: OCColumnMeta = {
      kind: 'data',
      className: classNameFor(col, hasFixed),
      field,
      slot,
      renderHtml: typeof col.render === 'function' ? col.render : undefined,
      // The legacy implementation let isLineClamp win unless render was the literal 'string'.
      isLineClamp: !!col.isLineClamp && col.render !== 'string',
      sortData: col.sortData,
    }

    if (col.hidden) visibility[id] = false

    const def = {
      id,
      header: col.title ?? '',
      enableSorting: field != null && col.orderable !== false,
      enableGlobalFilter: field != null,
      meta,
      ...(field != null ? { accessorFn: (row: TRow) => getByPath(row, field) } : {}),
    }
    return def as unknown as Def
  })

  const special = (id: string, header: string, meta: OCColumnMeta): Def =>
    ({
      id,
      header,
      enableSorting: false,
      enableGlobalFilter: false,
      enableHiding: false,
      meta,
    }) as unknown as Def

  const select = input.selectedPk
    ? [
        special(SELECT_ID, '', {
          kind: 'select',
          className: 'min-width all oc-checkbox-col',
          field: null,
          slot: 'checkbox',
        }),
      ]
    : []

  const actions = input.hasActions
    ? [
        special(ACTIONS_ID, input.actionTitle, {
          kind: 'actions',
          className: 'min-width all',
          field: null,
          slot: 'actions',
        }),
      ]
    : []

  const drag = input.rowReorder
    ? [special(DRAG_ID, '', { kind: 'drag', className: 'min-width all oc-drag-col', field: null })]
    : []

  const defs = [...drag, ...select, ...dataDefs, ...actions]

  // Fixed columns are counted over the legacy list (checkbox, data..., actions); the drag handle is excluded.
  const pinnable = defs.filter((d) => d.id !== DRAG_ID).map((d) => d.id as string)
  const pinning = {
    start: pinnable.slice(0, fixedCounts.start),
    end: fixedCounts.end > 0 ? pinnable.slice(-fixedCounts.end) : [],
  }

  return {
    defs,
    visibility,
    pinning,
    legacyOffset: input.selectedPk ? (hasFixed ? 1 : 2) : 0,
  }
}

/** Fallback used when no columns are supplied: one column per key of the first row. */
export function inferColumns(rows: readonly OCRow[]): OCColumn[] {
  const first = rows[0]
  return first ? Object.keys(first).map((key) => ({ title: key, data: key })) : []
}
