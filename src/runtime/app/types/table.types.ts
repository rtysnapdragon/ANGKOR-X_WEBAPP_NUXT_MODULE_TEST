// ============================================================
// Enterprise Table – Type Definitions
// ============================================================

import type { ColumnDef, SortingState, ColumnFiltersState, VisibilityState, RowSelectionState, GroupingState, ExpandedState } from '@tanstack/vue-table'

// ─── HTTP / API ──────────────────────────────────────────────

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface HttpConfig {
  /** Absolute or relative URL */
  url: string
  method?: HttpMethod
  headers?: Record<string, string>
  /** Static params merged into every request */
  params?: Record<string, unknown>
  /** Timeout in ms (default 30 000) */
  timeout?: number
  withCredentials?: boolean
}

export interface ApiResponse<T = unknown> {
  data: T
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ─── Data Source ─────────────────────────────────────────────

export interface TableDataSource<TData = unknown> {
  /** Remote API config. If provided, overrides `data`. */
  api?: HttpConfig
  /** Local static data. Used when `api` is absent. */
  data?: TData[]
}

// ─── Column Definition Extension ─────────────────────────────

export interface TableColumnMeta {
  /** Pin to left or right */
  pin?: 'left' | 'right'
  /** Clamp long text and open a modal on click */
  isClamp?: boolean
  /** Max chars before clamping */
  clampLength?: number
  /** Hide column for roles not in this list */
  allowedRoles?: string[]
  /** CSS min-width e.g. "120px" */
  minWidth?: string
  /** CSS width e.g. "200px" */
  width?: string
  /** CSS max-width */
  maxWidth?: string
  /** Badge config for enum values */
  badge?: Record<string, BadgeVariant>
  /** Render a custom slot name */
  slot?: string
  /** Mark column as exportable (default true) */
  exportable?: boolean
}

export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral'

export type TableColumn<TData = unknown> = ColumnDef<TData, unknown> & {
  meta?: TableColumnMeta
}

// ─── Row Actions ─────────────────────────────────────────────

export interface RowAction<TData = unknown> {
  label: string
  icon?: string
  variant?: 'default' | 'destructive' | 'outline'
  /** Hide action based on row data */
  hidden?: (row: TData) => boolean
  /** Disable action based on row data */
  disabled?: (row: TData) => boolean
  handler: (row: TData) => void | Promise<void>
}

// ─── Bulk Actions ─────────────────────────────────────────────

export interface BulkAction<TData = unknown> {
  label: string
  icon?: string
  variant?: 'default' | 'destructive' | 'outline'
  handler: (rows: TData[]) => void | Promise<void>
}

// ─── Filters ─────────────────────────────────────────────────

export type FilterType = 'text' | 'select' | 'date-range' | 'number-range' | 'boolean'

export interface FilterDefinition {
  id: string
  label: string
  type: FilterType
  /** For select filters */
  options?: { label: string; value: string | number | boolean }[]
  placeholder?: string
}

// ─── Server-Side Query Payload ────────────────────────────────

export interface TableQueryPayload {
  page: number
  pageSize: number
  sorting?: { id: string; desc: boolean }[]
  filters?: { id: string; value: unknown }[]
  groupBy?: string[]
  search?: string
}

// ─── Pagination ───────────────────────────────────────────────

export interface PaginationState {
  pageIndex: number
  pageSize: number
}

// ─── Main Table Props ─────────────────────────────────────────

export interface DataTableProps<TData = unknown> {
  /** Column definitions */
  columns: TableColumn<TData>[]
  /** Data source: local array or remote API */
  source: TableDataSource<TData>
  /** Unique row key field */
  rowKey?: keyof TData & string

  // ── Features ──
  /** Enable server-side mode (sorting/filter/page send to API) */
  serverSide?: boolean
  /** Enable row selection */
  selectable?: boolean
  /** Enable column visibility toggle */
  columnVisibility?: boolean
  /** Enable CSV export */
  exportCsv?: boolean
  /** Enable virtual scrolling */
  virtualize?: boolean
  /** Estimated row height for virtual scroll */
  rowHeight?: number
  /** Enable grouping */
  groupable?: boolean
  /** Enable sticky header */
  stickyHeader?: boolean
  /** Sync filters/sort/page with URL query params */
  syncUrl?: boolean
  /** Global search placeholder */
  searchPlaceholder?: string
  /** Filter definitions */
  filters?: FilterDefinition[]
  /** Row actions (dropdown per row) */
  rowActions?: RowAction<TData>[]
  /** Bulk actions (when rows are selected) */
  bulkActions?: BulkAction<TData>[]
  /** Allowed roles for permission-based columns */
  userRoles?: string[]
  /** Table height for virtual/sticky mode */
  height?: string
  /** Items per page options */
  pageSizeOptions?: number[]
  /** Default page size */
  defaultPageSize?: number
  /** Dense mode */
  dense?: boolean
  /** Loading override */
  loading?: boolean
}

// ─── Emits ────────────────────────────────────────────────────

export interface DataTableEmits<TData = unknown> {
  (e: 'row-click', row: TData): void
  (e: 'selection-change', rows: TData[]): void
  (e: 'query-change', payload: TableQueryPayload): void
  (e: 'export', rows: TData[]): void
}
