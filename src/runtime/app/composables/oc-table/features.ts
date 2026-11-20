import {
  columnFilteringFeature,
  columnPinningFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  metaHelper,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
} from '@tanstack/vue-table'
import type { OCColumnMeta } from './types'

/**
 * Module-level on purpose: one stable features object shared by every OCTable instance.
 *
 * - Client mode  : filtered/sorted/paginated row models do the work in the browser.
 * - Server mode  : the same row models are registered but bypassed through the
 *                  `manualFiltering` / `manualSorting` / `manualPagination` options.
 *
 * Only the registries OCTable actually resolves are included, so the bundle does not
 * carry every built-in filter/sort function.
 */
export const ocTableFeatures = tableFeatures({
  // Features. Order matters: prerequisites first.
  columnFilteringFeature, // required by globalFilteringFeature (no per-column filter UI is exposed)
  globalFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  columnVisibilityFeature,
  columnPinningFeature,

  // Row model slots (must follow the feature they belong to).
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),

  // Function registries. 'auto' sorting resolves against these keys.
  filterFns: { includesString: filterFn_includesString },
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    text: sortFn_text,
    basic: sortFn_basic,
    datetime: sortFn_datetime,
  },

  // Per-table typed meta (no global declaration merging).
  columnMeta: metaHelper<OCColumnMeta>(),
})

export type OCFeatures = typeof ocTableFeatures
