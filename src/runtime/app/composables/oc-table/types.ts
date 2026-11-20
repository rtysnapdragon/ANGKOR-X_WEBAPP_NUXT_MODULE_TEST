/**
 * Public contracts for OCTable.
 *
 * The column/option shapes intentionally mirror the previous DataTables-based
 * component so existing pages keep working without edits. Anything that was
 * DataTables-only (responsive, layout, destroy, retrieve, ...) is simply ignored.
 */

export type OCRow = Record<string, any>

export interface OCSortDataItem {
  /** Field (column id) that the item sorts by. */
  data: string
  title: string
}

/**
 * Legacy DataTables-style render function. The returned string is injected as HTML,
 * so the caller is responsible for escaping any user-controlled value.
 */
export type OCLegacyRender = (
  value: unknown,
  type: 'display',
  row: OCRow,
  meta: { row: number; col: number },
) => string

export interface OCColumn {
  /** Optional explicit column id. Defaults to `data`, then a positional id. */
  id?: string
  /** Header text. Rendered as text (not HTML). */
  title?: string
  /** Field path on the row. `null` for display-only columns (actions, custom cells). */
  data?: string | null
  /** `'#slotName'` renders the named slot; a function renders legacy HTML. */
  render?: string | OCLegacyRender
  orderable?: boolean
  className?: string
  hidden?: boolean
  alignRight?: boolean
  /** Adds a header menu that sorts by one of several fields. */
  sortData?: OCSortDataItem[]
  /** Clamp to two lines and open the full text in a modal on click. */
  isLineClamp?: boolean
}

export interface OCApiConfig {
  url: string
  method?: string
  filter?: Record<string, unknown>
  /** Key to unwrap from the response before reading rows. */
  where?: string
}

export type OCFixedColumns =
  | boolean
  | { start?: number; end?: number; left?: number; right?: number }

export interface OCTableOptions {
  isScroll?: boolean
  info?: boolean
  searching?: boolean
  paging?: boolean
  reload?: boolean
  showNoData?: boolean
  lengthMenu?: number[]
  pageLength?: number
  /** `idx` is relative to the legacy column list (checkbox/action columns included). */
  order?: { idx: number; dir?: string }
  fixedColumns?: OCFixedColumns
  /** Native drag-and-drop row reordering (client-side data only). */
  rowReorder?: boolean
  classSearch?: string
  /** Replaces the old `.disabled` checkbox convention. Return false to lock a row. */
  enableRowSelection?: (row: OCRow) => boolean
  [legacyOption: string]: unknown
}

/** Per-column metadata stored on the TanStack column definition. */
export interface OCColumnMeta {
  kind: 'data' | 'select' | 'actions' | 'drag'
  className: string
  field: string | null
  slot?: string
  renderHtml?: OCLegacyRender
  isLineClamp?: boolean
  sortData?: OCSortDataItem[]
}

export interface OCReorderDiff {
  oldPosition: number
  newPosition: number
  /** Row that occupied `newPosition` before the move. */
  oldData: OCRow
  /** Row that occupies `newPosition` after the move. */
  newData: OCRow
}
