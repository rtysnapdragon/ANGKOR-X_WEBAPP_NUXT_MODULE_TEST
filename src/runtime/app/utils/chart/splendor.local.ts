import type {
  SplendorColumn,
  SplendorFilterDef,
  SplendorFilterValue,
  SplendorFilterValues,
  SplendorRange,
  SplendorSort,
} from './splendor.types'

const UNSAFE = new Set(['__proto__', 'constructor', 'prototype'])

/** `getPath(row, 'user.address.city')`. Never throws, never walks the prototype chain keys above. */
export function getPath(source: unknown, path: string): unknown {
  if (!path) return undefined
  let current: any = source
  for (const part of path.split('.')) {
    if (current === null || current === undefined || UNSAFE.has(part)) return undefined
    current = current[part]
  }
  return current
}

export const isEmptyValue = (v: unknown) => v === null || v === undefined || v === ''

export function isRange(v: unknown): v is SplendorRange {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** A filter value that should be ignored (cleared). */
export function isFilterEmpty(value: SplendorFilterValue): boolean {
  if (isEmptyValue(value)) return true
  if (isRange(value)) return isEmptyValue(value.from) && isEmptyValue(value.to)
  return false
}

export function activeFilterCount(values: SplendorFilterValues): number {
  return Object.values(values).filter((v) => !isFilterEmpty(v)).length
}

// ─────────────────────────────────────────────────────────────────────────────
// Filtering
// ─────────────────────────────────────────────────────────────────────────────
function toTime(value: unknown, endOfDay = false): number | null {
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'number') return value
  if (typeof value !== 'string' || !value) return null
  const t = Date.parse(value)
  if (Number.isNaN(t)) return null
  // `YYYY-MM-DD` upper bound should include the whole day
  return endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value) ? t + 86_399_999 : t
}

function matchFilter<T>(row: T, def: SplendorFilterDef<T>, value: SplendorFilterValue): boolean {
  if (def.apply) return def.apply(row, value)
  const raw = getPath(row, def.field ?? def.key)

  switch (def.type) {
    case 'text':
      return String(raw ?? '').toLocaleLowerCase().includes(String(value).trim().toLocaleLowerCase())
    case 'select':
      return String(raw ?? '') === String(value)
    case 'boolean':
      return Boolean(raw) === (value === true || value === 'true')
    case 'number': {
      if (!isRange(value)) return Number(raw) === Number(value)
      const n = typeof raw === 'number' ? raw : Number(raw)
      if (raw === null || raw === undefined || Number.isNaN(n)) return false
      if (!isEmptyValue(value.from) && n < Number(value.from)) return false
      if (!isEmptyValue(value.to) && n > Number(value.to)) return false
      return true
    }
    case 'date': {
      if (!isRange(value)) return false
      const t = toTime(raw)
      if (t === null) return false
      const from = toTime(value.from)
      const to = toTime(value.to, true)
      if (from !== null && t < from) return false
      if (to !== null && t > to) return false
      return true
    }
    default:
      return true
  }
}

export function filterRows<T>(rows: readonly T[], defs: readonly SplendorFilterDef<T>[], values: SplendorFilterValues): T[] {
  const active = defs.filter((d) => !isFilterEmpty(values[d.key]))
  if (!active.length) return rows.slice()
  return rows.filter((row) => active.every((d) => matchFilter(row, d, values[d.key])))
}

export function searchRows<T>(rows: readonly T[], term: string, fields: readonly string[]): T[] {
  const needle = term.trim().toLocaleLowerCase()
  if (!needle || !fields.length) return rows.slice()
  return rows.filter((row) =>
    fields.some((f) => {
      const v = getPath(row, f)
      return v !== null && v !== undefined && typeof v !== 'object' && String(v).toLocaleLowerCase().includes(needle)
    }),
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sorting
// ─────────────────────────────────────────────────────────────────────────────
function compareValues(a: unknown, b: unknown, type: SplendorColumn['type'], locale?: string): number {
  switch (type) {
    case 'number':
      return Number(a) - Number(b)
    case 'date':
      return (toTime(a) ?? 0) - (toTime(b) ?? 0)
    case 'boolean':
      return Number(Boolean(a)) - Number(Boolean(b))
    default:
      return String(a).localeCompare(String(b), locale, { numeric: true, sensitivity: 'base' })
  }
}

/** Stable multi-column sort. Empty values always sort last, whatever the direction. */
export function sortRows<T>(rows: readonly T[], sort: readonly SplendorSort[], columns: readonly SplendorColumn<T>[], locale?: string): T[] {
  const byKey = new Map(columns.map((c) => [c.key, c]))
  const specs = sort.map((s) => ({ s, col: byKey.get(s.key) })).filter((x): x is { s: SplendorSort; col: SplendorColumn<T> } => Boolean(x.col))
  if (!specs.length) return rows.slice()

  return rows
    .map((row, index) => ({ row, index }))
    .sort((x, y) => {
      for (const { s, col } of specs) {
        const sign = s.dir === 'desc' ? -1 : 1
        if (col.sortFn) {
          const r = col.sortFn(x.row, y.row)
          if (r) return r * sign
          continue
        }
        const a = getPath(x.row, col.field ?? col.key)
        const b = getPath(y.row, col.field ?? col.key)
        const aEmpty = isEmptyValue(a)
        const bEmpty = isEmptyValue(b)
        if (aEmpty || bEmpty) {
          if (aEmpty && bEmpty) continue
          return aEmpty ? 1 : -1
        }
        const r = compareValues(a, b, col.type, locale)
        if (r) return r * sign
      }
      return x.index - y.index
    })
    .map((x) => x.row)
}

// ─────────────────────────────────────────────────────────────────────────────
// Everything for local mode
// ─────────────────────────────────────────────────────────────────────────────
export interface LocalQuery<T> {
  search: string
  minSearchLength: number
  searchFields: readonly string[]
  filters: SplendorFilterValues
  filterDefs: readonly SplendorFilterDef<T>[]
  sort: readonly SplendorSort[]
  columns: readonly SplendorColumn<T>[]
  locale?: string
}

/** search → filter → sort (no pagination). */
export function processLocal<T>(data: readonly T[], q: LocalQuery<T>): T[] {
  let rows: readonly T[] = data
  if (q.search.trim().length >= Math.max(1, q.minSearchLength)) rows = searchRows(rows, q.search, q.searchFields)
  rows = filterRows(rows, q.filterDefs, q.filters)
  return sortRows(rows, q.sort, q.columns, q.locale)
}

export function paginate<T>(rows: readonly T[], page: number, pageSize: number): T[] {
  const size = Math.max(1, Math.floor(pageSize) || 1)
  const start = (Math.max(1, Math.floor(page) || 1) - 1) * size
  return rows.slice(start, start + size)
}

export const clampPage = (page: number, totalPages: number) => Math.min(Math.max(1, Math.floor(page) || 1), Math.max(1, totalPages))
