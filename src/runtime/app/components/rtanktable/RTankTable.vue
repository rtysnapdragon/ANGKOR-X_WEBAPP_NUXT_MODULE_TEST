<template>
  <div
    ref="wrapperRef"
    class="ocs-wrapper-table"
    :class="{ 'is-page-scroll': opts?.isScroll === false }"
    :style="{ '--oc-head-h': `${headHeight}px` }"
  >
    <!-- header label -->
    <slot v-if="$slots.headerTable" name="headerTable" />

    <!-- Header (toolbar). Sticky under the topbar when the page scrolls (isScroll=false). -->
    <div ref="headWrapRef" class="oc-head-sticky">
      <OCTableHeader
        :options="opts"
        v-model:selected="record"
        v-model:searching="searching"
        @search-table="applySearch(searching)"
        @clear-search="applySearch('')"
        @reload="fnReload"
      >
        <template v-if="$slots.headerLeft" #headerLeft><slot name="headerLeft" /></template>
        <template v-if="$slots.headerCenter" #headerCenter><slot name="headerCenter" /></template>
        <template v-if="$slots.headerApplyFilter" #headerApplyFilter><slot name="headerApplyFilter" /></template>
        <template v-if="$slots.headerRight" #headerRight><slot name="headerRight" /></template>
      </OCTableHeader>
    </div>

    <slot v-if="$slots.middleTable" name="middleTable" />

    <!-- Template (card) mode -->
    <div v-if="showTemplate" ref="cardRef" class="oc-wrapper-card">
      <slot v-if="$slots.loading && loading" name="loading" />

      <div v-if="!$slots.loading && loading" class="w-full h-full min-h-[100px] flex justify-center items-center oc-loader">
        <OCLoading :loading="true" />
      </div>

      <div v-if="!$slots.loading || !loading" class="oc-nav-card-scroll">
        <slot name="template" v-bind="{ 0: dataTemplate }" />
      </div>

      <div
        v-if="!dataTemplate?.length && !loading && opts.showNoData"
        class="flex justify-center items-center absolute top-0 w-full h-full"
      >
        <div v-if="!searching" class="flex items-center color-w-b-2 font-normal gap-1 text-[14px]">
          <i class="ri-database-2-fill"></i><span>{{ t('data_not_found') }}</span>
        </div>
        <div v-else class="flex items-center color-w-b-2 font-normal gap-1 text-[14px]">
          <i class="ri-search-2-line"></i><span>{{ t('no_results_for') }} " {{ searching }} "</span>
        </div>
      </div>
    </div>

    <!-- Selection toolbar -->
    <div v-if="showGroupButtons" class="flex flex-wrap gap-1.5 pt-2.5 sticky">
      <button type="button" class="btn" :class="{ active: isShowSelected }" :aria-pressed="isShowSelected" @click="isShowSelected = !isShowSelected">
        <i class="ri-function-fill"></i><span>{{ t('selected') }}: {{ selection?.length }}</span>
      </button>
      <button v-if="isServer" type="button" class="btn" @click="table.toggleAllPageRowsSelected(true)">
        <i class="ri-checkbox-circle-fill"></i><span>{{ t('select_all_this_page') }}</span>
      </button>
      <button v-if="showSelectAllBtn" type="button" class="btn" @click="fnListAllSelect">
        <i class="ri-checkbox-circle-fill"></i><span>{{ t('select_all') }}: {{ total }}</span>
      </button>
      <button type="button" class="btn" @click="fnClearAll">
        <i class="ri-close-circle-fill"></i><span>{{ t('clear_all') }}</span>
      </button>
    </div>

    <!-- Table -->
    <div
      v-if="!showTemplate"
      class="container-table"
      :class="[haveBorder ? 'have-border' : '', isHasCheck ? '' : 'is-not-check', opts?.isScroll ? '' : 'no-scroll-table']"
    >
      <div ref="scrollBodyRef" class="oc-scroll-body">
        <table
          class="oc-table"
          :class="{ 'is-collapsed': isCollapsed, 'is-measuring': measuring }"
          :aria-busy="loading"
        >
          <thead ref="headRef">
            <tr v-for="group in table?.getHeaderGroups()" :key="group.id">
              <th
                v-for="header in group.headers"
                :key="header.id"
                scope="col"
                :data-col-id="header.column.id"
                :class="[colMeta(header.column)?.className, pinClass(header.column)]"
                :style="pinStyle(header.column)"
                :aria-sort="ariaSort(header.column)"
              >
                <span v-if="colMeta(header.column)?.kind === 'expand'" class="sr-only">{{ t('expand') }}</span>

                <input
                  v-else-if="colMeta(header.column)?.kind === 'select'"
                  type="checkbox"
                  class="oc-checkbox tbl-checkbox"
                  :class="{ minus: somePageSelected && !allPageSelected }"
                  :checked="allPageSelected || somePageSelected"
                  :aria-label="t('select_all_this_page')"
                  @change="onToggleAllPage"
                />

                <div v-else class="oc-th-inner">
                  <button
                    v-if="header.column.getCanSort()"
                    type="button"
                    class="oc-th-sort"
                    @click="header.column.toggleSorting()"
                  >
                    <FlexRender :header="header" />
                    <span class="oc-sort-icon" :data-dir="header.column.getIsSorted() || undefined" aria-hidden="true"></span>
                  </button>
                  <span v-else class="oc-th-label"><FlexRender :header="header" /></span>

                  <RTooltip v-if="colMeta(header.column)?.sortData?.length" :text="t('sort')">
                    <button
                      type="button"
                      class="oc-sort-menu__trigger multi-sort-wrapper"
                      aria-haspopup="menu"
                      :aria-expanded="sortMenu?.colId === header.column.id"
                      :aria-label="`${t('sort')}: ${colTitle(header.column)}`"
                      @click.stop="toggleSortMenu(header.column, $event)"
                    >
                      <i class="ri-filter-3-fill" aria-hidden="true"></i>
                    </button>
                  </RTooltip>
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            <template v-for="row in displayRows" :key="row.id">
              <tr
                :class="{ selected: row.getIsSelected(), 'oc-expanded': isCollapsed && row.getIsExpanded() }"
                @dragover.prevent
                @drop="onDrop(row, $event)"
              >
                <td
                  v-for="(cell, ci) in row.getVisibleCells()"
                  :key="cell.id"
                  :class="[
                    colMeta(cell.column)?.className,
                    pinClass(cell.column),
                    { 'oc-has-control': showControl(cell, ci) && colMeta(cell.column)?.kind !== 'expand' },
                  ]"
                  :style="pinStyle(cell.column)"
                >
                  <!-- expand / collapse control (child row with the columns that do not fit) -->
                  <span v-if="showControl(cell, ci)" class="oc-expand-wrap">
                    <RTooltip :text="row.getIsExpanded() ? t('collapse') : t('expand')">
                      <button
                        type="button"
                        class="oc-expand-btn"
                        :class="{ expanded: row.getIsExpanded() }"
                        :aria-expanded="row.getIsExpanded()"
                        :aria-label="row.getIsExpanded() ? t('collapse') : t('expand')"
                        @click.stop="row.toggleExpanded()"
                      ></button>
                    </RTooltip>
                  </span>

                  <!-- dedicated control column has no other content -->
                  <template v-if="colMeta(cell.column)?.kind === 'expand'"></template>

                  <!-- checkbox -->
                  <template v-else-if="colMeta(cell.column)?.kind === 'select'">
                    <slot v-if="$slots.checkbox" name="checkbox" v-bind="slotProps(cell, row, ci)" />
                    <input
                      type="checkbox"
                      class="oc-checkbox"
                      :class="{ disabled: !row.getCanSelect() }"
                      :select-key="row.id"
                      :checked="row.getIsSelected()"
                      :disabled="!row.getCanSelect()"
                      :aria-label="`${t('selected')} ${row.id}`"
                      @change="onRowCheck(row, $event)"
                    />
                  </template>

                  <!-- drag handle -->
                  <RTooltip v-else-if="colMeta(cell.column)?.kind === 'drag'" :text="t('reorder_row')">
                    <span
                      class="oc-drag-handle"
                      :class="{ disabled: !canReorderNow }"
                      :draggable="canReorderNow"
                      role="button"
                      :aria-label="t('reorder_row')"
                      @dragstart="onDragStart(row, $event)"
                      @dragend="dragFrom = null"
                    >
                      <i class="ri-draggable" aria-hidden="true"></i>
                    </span>
                  </RTooltip>

                  <!-- clamped text, full value in a modal -->
                  <template v-else-if="colMeta(cell.column)?.isLineClamp">
                    <div
                      v-if="cell.getValue() != null && cell.getValue() !== ''"
                      class="has-modal-detail line-clamp-2 cursor-pointer"
                      role="button"
                      tabindex="0"
                      @click="openDetail(cell.getValue())"
                      @keydown.enter.prevent="openDetail(cell.getValue())"
                    >
                      <span>{{ cell.getValue() }}</span>
                    </div>
                  </template>

                  <!-- named slot: render: '#slotName' -->
                  <slot
                    v-else-if="colMeta(cell.column)?.slot"
                    :name="colMeta(cell.column)!.slot"
                    v-bind="slotProps(cell, row, ci)"
                  >
                    {{ cell.getValue() }}
                  </slot>

                  <!-- legacy render(): returns HTML, caller must escape user input -->
                  <!-- eslint-disable-next-line vue/no-v-html -->
                  <span v-else-if="colMeta(cell.column)?.renderHtml" v-html="renderHtml(cell, row, ci)"></span>

                  <template v-else>{{ cell.getValue() }}</template>
                </td>
              </tr>

              <!-- child row: columns hidden by the responsive layout -->
              <tr v-if="isCollapsed && row.getIsExpanded()" class="child">
                <td class="child" :colspan="table?.getVisibleLeafColumns()?.length || 1">
                  <ul class="dtr-details">
                    <li v-for="(cell, ci) in hiddenCells(row)" :key="cell.id">
                      <span class="dtr-title">{{ colTitle(cell.column) }}</span>
                      <span class="dtr-data">
                        <template v-if="colMeta(cell.column)?.isLineClamp">
                          <div
                            v-if="cell.getValue() != null && cell.getValue() !== ''"
                            class="has-modal-detail line-clamp-2 cursor-pointer"
                            role="button"
                            tabindex="0"
                            @click="openDetail(cell.getValue())"
                            @keydown.enter.prevent="openDetail(cell.getValue())"
                          >
                            <span>{{ cell.getValue() }}</span>
                          </div>
                        </template>
                        <slot
                          v-else-if="colMeta(cell.column)?.slot"
                          :name="colMeta(cell.column)!.slot"
                          v-bind="slotProps(cell, row, ci)"
                        >
                          {{ cell.getValue() }}
                        </slot>
                        <!-- eslint-disable-next-line vue/no-v-html -->
                        <span v-else-if="colMeta(cell.column)?.renderHtml" v-html="renderHtml(cell, row, ci)"></span>
                        <template v-else>{{ cell.getValue() }}</template>
                      </span>
                    </li>
                  </ul>
                </td>
              </tr>
            </template>

            <tr v-if="!displayRows?.length && !loading">
              <td class="oc-empty" :colspan="table?.getVisibleLeafColumns()?.length || 1">{{ emptyText }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="loading" class="w-full h-full min-h-[100px] flex justify-center items-center oc-loader rounded-[10px]"></div>
      <div v-if="loading" class="transition-all absolute top-[1px] left-0 z-10 w-full px-1">
        <UProgress size="xs" animation="carousel" />
      </div>

      <div v-if="$slots.totalDetail" ref="totalDetailRef" class="oc-tbl-total-detail">
        <slot name="totalDetail" :total="total" />
      </div>
    </div>

    <div v-if="$slots.ShowDetailAfterTableOne" ref="detailOneRef"><slot name="ShowDetailAfterTableOne" /></div>
    <div v-if="$slots.ShowDetailAfterTableTwo" ref="detailTwoRef"><slot name="ShowDetailAfterTableTwo" /></div>

    <!-- Footer: stays visible (sticky bottom) whether the table or the page scrolls -->
    <div v-if="!isTotalDetail" ref="footerRef" class="oc-footer-sticky">
      <OCTableFooter
        :options="opts"
        :page-count="pageSize"
        :total="total"
        v-model:page="page"
        v-model:selected="record"
        :loading="loading"
        @change-pagination="(p: number) => emit('onChangePagination', p, pageSize)"
        @select-records="fnSelectRecord"
      />
    </div>

    <RModal v-model="isDetailOpen" :no-header="true">
      <div class="detail-container">
        <button type="button" class="btn-close-detail" :aria-label="t('close')" @click="isDetailOpen = false">
          <i class="ri-close-large-fill"></i>
        </button>
        <div>{{ detailText }}</div>
      </div>
    </RModal>

    <!-- Multi-field sort menu (one shared instance) -->
    <Teleport to="body">
      <div
        v-if="sortMenu"
        ref="sortMenuRef"
        class="popover-multi-sort-contain"
        role="menu"
        :style="{ top: `${sortMenu.top}px`, right: `${sortMenu.right}px` }"
        @keydown.esc.stop="closeSortMenu"
      >
        <button
          v-for="item in sortMenuItems"
          :key="item.data"
          type="button"
          role="menuitem"
          class="sort-detail"
          :class="sortStateClass(item.data)"
          @click="cycleSort(item.data)"
        >
          <span class="title">{{ item.title }}</span>
          <span class="icon-order" aria-hidden="true"></span>
        </button>
      </div>
    </Teleport>
  </div>
</template>

<!-- ========================================================================= -->
<!-- Module scope: types, stable feature registry, pure helpers, small hooks   -->
<!-- ========================================================================= -->
<script lang="ts">
import { computed, onBeforeUnmount, onMounted, watch, type Ref } from 'vue'
import {
  useTable,
  columnFilteringFeature,
  columnPinningFeature,
  columnVisibilityFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  metaHelper,
  rowExpandingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
  type ColumnDef,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type Updater,
} from '@tanstack/vue-table'
/* ---------------------------------- Types --------------------------------- */

export type OCRow = Record<string, any>

export interface OCSortDataItem {
  /** Field (column id) the item sorts by. */
  data: string
  title: string
}

/** Legacy DataTables-style render. The returned string is injected as HTML: escape user input. */
export type OCLegacyRender = (
  value: unknown,
  type: 'display',
  row: OCRow,
  meta: { row: number; col: number },
) => string

export interface OCColumn {
  id?: string
  /** Header text, rendered as text (not HTML). */
  title?: string
  /** Field path on the row; null for display-only columns. */
  data?: string | null
  /** `'#slotName'` renders that slot; a function renders legacy HTML. */
  render?: string | OCLegacyRender
  orderable?: boolean
  /** Token `all` keeps the column visible when the layout collapses. */
  className?: string
  hidden?: boolean
  alignRight?: boolean
  sortData?: OCSortDataItem[]
  isLineClamp?: boolean
}

export interface OCApiConfig {
  url: string
  method?: string
  filter?: Record<string, unknown>
  where?: string
}

export type OCFixedColumns =
  | boolean
  | { start?: number; end?: number; left?: number; right?: number }

export interface OCTableOptions {
  /** true: table body scrolls inside a viewport-fitted box. false: the page scrolls. */
  isScroll?: boolean
  info?: boolean
  searching?: boolean
  paging?: boolean
  reload?: boolean
  showNoData?: boolean
  lengthMenu?: number[]
  pageLength?: number
  /** `idx` is relative to the legacy column list (control/checkbox/action columns included). */
  order?: { idx: number; dir?: string }
  fixedColumns?: OCFixedColumns
  rowReorder?: boolean
  classSearch?: string
  /** Replaces the old `.disabled` checkbox convention. Return false to lock a row. */
  enableRowSelection?: (row: OCRow) => boolean
  [legacyOption: string]: unknown
}

export interface OCColumnMeta {
  kind: 'data' | 'select' | 'actions' | 'drag' | 'expand'
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
  oldData: OCRow
  newData: OCRow
}

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

/* ------------------------ Stable TanStack feature set ---------------------- */

/**
 * One module-level object shared by every OCTable. Client mode uses the row models; server
 * mode registers the same ones but bypasses them via manualFiltering/Sorting/Pagination.
 * Only the functions that 'auto' resolves to are registered, not the whole built-in registry.
 */
export const ocTableFeatures = tableFeatures({
  columnFilteringFeature, // prerequisite of globalFilteringFeature (no per-column filter UI)
  globalFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowExpandingFeature, // child rows for responsive collapse (no sub-row model needed)
  columnVisibilityFeature,
  columnPinningFeature,

  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),

  filterFns: { includesString: filterFn_includesString },
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    text: sortFn_text,
    basic: sortFn_basic,
    datetime: sortFn_datetime,
  },

  columnMeta: metaHelper<OCColumnMeta>(),
})

type OCFeatures = typeof ocTableFeatures

/* ----------------------- Legacy column -> TanStack defs -------------------- */

const SELECT_ID = '__oc_select'
const ACTIONS_ID = '__oc_actions'
const DRAG_ID = '__oc_drag'
const EXPAND_ID = '__oc_expand'

function getByPath(row: OCRow, path: string): unknown {
  if (!path.includes('.')) return row?.[path]
  let current: any = row
  for (const key of path.split('.')) {
    if (current == null) return undefined
    current = current[key]
  }
  return current
}

function resolveFixed(fixed?: OCFixedColumns): { start: number; end: number } {
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

function inferColumns(rows: readonly OCRow[]): OCColumn[] {
  const first = rows[0]
  return first ? Object.keys(first).map((key) => ({ title: key, data: key })) : []
}

interface ColumnSpecInput {
  columns: readonly OCColumn[]
  selectedPk?: string
  hasActions: boolean
  rowReorder: boolean
  fixedColumns?: OCFixedColumns
  actionTitle: string
}

function buildColumnSpec<TRow extends OCRow>(input: ColumnSpecInput) {
  type Def = ColumnDef<OCFeatures, TRow>
  const fixedCounts = resolveFixed(input.fixedColumns)
  const hasFixed = fixedCounts.start + fixedCounts.end > 0
  const visibility: Record<string, boolean> = {}

  const dataDefs: Def[] = input.columns.map((col, index) => {
    const field = col.data ?? null
    const id = col.id ?? field ?? `__oc_col_${index}`
    const meta: OCColumnMeta = {
      kind: 'data',
      className: classNameFor(col, hasFixed),
      field,
      slot:
        typeof col.render === 'string' && col.render.includes('#')
          ? col.render.replace(/#/g, '')
          : undefined,
      renderHtml: typeof col.render === 'function' ? col.render : undefined,
      // Legacy rule: isLineClamp won unless render was the literal 'string'.
      isLineClamp: !!col.isLineClamp && col.render !== 'string',
      sortData: col.sortData,
    }
    if (col.hidden) visibility[id] = false

    return {
      id,
      header: col.title ?? '',
      enableSorting: field != null && col.orderable !== false,
      enableGlobalFilter: field != null,
      meta,
      ...(field != null ? { accessorFn: (row: TRow) => getByPath(row, field) } : {}),
    } as unknown as Def
  })

  const special = (id: string, header: string, meta: OCColumnMeta): Def =>
    ({ id, header, enableSorting: false, enableGlobalFilter: false, enableHiding: false, meta }) as unknown as Def

  // Legacy "tdNull" control column: present for checkbox tables without fixed columns.
  // Otherwise the first visible cell hosts the expand control.
  const hasControlColumn = !!input.selectedPk && !hasFixed

  const defs = [
    ...(input.rowReorder ? [special(DRAG_ID, '', { kind: 'drag', className: 'min-width all oc-drag-col', field: null })] : []),
    ...(hasControlColumn
      ? [special(EXPAND_ID, '', { kind: 'expand', className: 'min-width all td-collapse', field: null })]
      : []),
    ...(input.selectedPk
      ? [special(SELECT_ID, '', { kind: 'select', className: 'min-width all oc-checkbox-col', field: null, slot: 'checkbox' })]
      : []),
    ...dataDefs,
    ...(input.hasActions
      ? [special(ACTIONS_ID, input.actionTitle, { kind: 'actions', className: 'min-width all', field: null, slot: 'actions' })]
      : []),
  ]

  // Fixed columns are counted over the legacy list (checkbox, data..., actions).
  const pinnable = defs.filter((d) => d.id !== DRAG_ID && d.id !== EXPAND_ID).map((d) => d.id as string)
  return {
    defs,
    visibility,
    hasControlColumn,
    pinning: {
      start: pinnable.slice(0, fixedCounts.start),
      end: fixedCounts.end > 0 ? pinnable.slice(-fixedCounts.end) : [],
    },
    legacyOffset: input.selectedPk ? (hasFixed ? 1 : 2) : 0,
  }
}

/* ------------------------------ Request helpers ---------------------------- */

function buildParams(
  state: { pagination: PaginationState; search: string; sorting: SortingState },
  paging: boolean,
): OCRequestParams {
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

function normalizeResponse<TRow>(raw: any, cfg: { where?: string; selectAllPk?: string }) {
  const selectAllIds: unknown[] | undefined = cfg.selectAllPk ? (raw?.[cfg.selectAllPk] ?? []) : undefined
  const payload = cfg.where ? raw?.[cfg.where] : raw
  const unwrapped = payload && !Array.isArray(payload) && 'dataSrc' in payload ? payload.dataSrc : payload
  return { selectAllIds, payload, rows: (Array.isArray(unwrapped) ? unwrapped : []) as TRow[] }
}

function resolveTotal(list: readonly Record<string, any>[]): number {
  if (!list.length) return 0
  const first = list[0]
  return first?.RecordCount || first?.RecordsCount || first?.RecordCounts || first?.TotalRecord || list.length
}

const STALE = Symbol('oc-table-stale-request')

/** One request at a time: a new run aborts the previous and superseded responses resolve to STALE. */
function useAbortableRequest(loading: Ref<boolean>) {
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

/* ------------------------------ Selection bridge --------------------------- */

/**
 * The app owns the selection (the component v-model; it must survive pagination), so the
 * rowSelection slice is controlled via `state` + `onRowSelectionChange`.
 */
function useOCTableSelection<TRow extends OCRow>(opts: {
  model: Ref<unknown[]>
  pk: () => string | undefined
  /** selectAllPk + server mode: the model holds primary keys instead of row objects. */
  idsOnly: () => boolean
  rows: () => readonly TRow[]
}) {
  let latest: unknown[] = opts.model.value
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
    const next = typeof updater === 'function' ? updater(rowSelection.value) : updater
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
    /** A controlled defineModel only reflects a change after the parent re-renders; read it here. */
    latest: () => latest,
    set(next: unknown[]) {
      latest = next
      opts.model.value = next
    },
  }
}

/* ---------------------------------- Layout --------------------------------- */

type MaybeEl = HTMLElement | null | undefined

/**
 * Viewport-fit height (replaces calScroll / calScrollModal / calScrollCard).
 * Height = viewport - (target top + padding + everything below it), so the topbar and the toolbar
 * above are accounted for through the target's own bounding rect. One rAF-throttled run and a
 * window listener that is actually removed on unmount.
 */
function useTableLayout(opts: {
  enabled: () => boolean
  target: () => MaybeEl
  minWidth: () => number
  space: () => number
  extra: () => number
  onSync?: () => void
}) {
  let frame = 0

  const setHeight = (el: HTMLElement, height: string, min?: string) => {
    el.style.setProperty('height', height)
    el.style.setProperty('max-height', height)
    if (min) el.style.setProperty('min-height', min)
  }

  function apply(el: HTMLElement) {
    if (!opts.enabled()) {
      // isScroll=false: no inner scroll, the page scrolls with the table.
      for (const prop of ['height', 'max-height', 'min-height']) el.style.removeProperty(prop)
      return
    }

    const modal = el.closest<HTMLElement>('.oc-modal-container')
    if (modal) {
      const footer = modal.querySelector<HTMLElement>('.oc-modal-footer')?.offsetHeight ?? 0
      // Formula kept from the previous implementation.
      setHeight(el, `${modal.getBoundingClientRect().height - (el.getBoundingClientRect().top + footer + 80)}px`)
      return
    }

    if (window.innerWidth > opts.minWidth()) {
      const top = el.getBoundingClientRect().top
      setHeight(el, `${window.innerHeight - (top + opts.space() + opts.extra() + 15)}px`, '400px')
    } else {
      setHeight(el, '100%', '400px')
    }
  }

  function run() {
    frame = 0
    const el = opts.target()
    if (el) apply(el)
    opts.onSync?.()
  }

  function schedule() {
    if (frame) cancelAnimationFrame(frame)
    frame = requestAnimationFrame(run)
  }

  onMounted(() => {
    window.addEventListener('resize', schedule, { passive: true })
    schedule()
  })
  onBeforeUnmount(() => {
    window.removeEventListener('resize', schedule)
    if (frame) cancelAnimationFrame(frame)
  })

  return { sync: schedule }
}
</script>

<!-- ========================================================================= -->
<!-- Component                                                                 -->
<!-- ========================================================================= -->
<script setup lang="ts" generic="TRow extends OCRow">
const props = withDefaults(
  defineProps<{
    api?: string | OCApiConfig
    data?: TRow[]
    columns?: OCColumn[]
    keyTable?: string | number
    options?: OCTableOptions
    showTemplate?: boolean
    selectedPk?: string
    /** Accepted for compatibility; it was never read by the previous implementation. */
    waitFilter?: boolean
    isTotalDetail?: boolean
    haveBorder?: boolean | string
    minWidth?: number
    stateKey?: string
    autoload?: boolean
    selectAllPk?: string
    hideGroupBtnSelect?: boolean | string
  }>(),
  { autoload: true, minWidth: 768 },
)

const emit = defineEmits<{
  'update:data': [params: OCRequestParams]
  'update:dataSrc': [payload: unknown]
  actionCheck: [payload: unknown]
  reloadByFixedData: []
  onOrder: [order: Array<[number, 'asc' | 'desc']>]
  onSaveState: [state: Record<string, unknown>]
  onChangePagination: [page: number, size: number]
  onSelectRecord: [size: number, page: number]
  onSearching: [search: string]
  onRowReorder: [event: DragEvent, diff: OCReorderDiff[], edit: { row: TRow }]
}>()

const selection = defineModel<unknown[]>({ default: () => [] })
const loading = defineModel<boolean>('loading', { default: false })

const slots = useSlots()
const { t, locale } = useI18n()
const toast = useToast()
const store = useRTableDataStore()

const flag = (value: unknown) => value === '' || (!!value && value !== 'false')
const haveBorder = computed(() => flag(props.haveBorder))
const hideGroupBtnSelect = computed(() => flag(props.hideGroupBtnSelect))
const isHasCheck = computed(() => !!props.selectedPk)

/* ------------------------------- Config ----------------------------------- */

const api = computed(() => {
  const source = props.api
  if (!source) return undefined
  if (typeof source === 'string') return { url: getUrl(source), method: 'get' as string | undefined }
  return { url: getUrl(source.url), method: source.method, filter: source.filter, where: source.where }
})
const isServer = computed(() => !!api.value)

const opts = computed(() => ({
  isScroll: true,
  info: true,
  searching: true,
  paging: true,
  reload: true,
  showNoData: true,
  order: { idx: 0, dir: '' },
  lengthMenu: [10, 25, 50, 100],
  ...props.options,
}))

const dataset = shallowRef<TRow[]>([])
const serverTotal = ref(0)

const sourceColumns = computed<readonly OCColumn[]>(() =>
  props.columns?.length ? props.columns : inferColumns(dataset.value),
)

const spec = computed(() =>
  buildColumnSpec<TRow>({
    columns: sourceColumns.value,
    selectedPk: props.selectedPk,
    hasActions: !!slots.actions,
    rowReorder: !!opts.value.rowReorder && !isServer.value,
    fixedColumns: opts.value.fixedColumns,
    actionTitle: t('action'),
  }),
)

/* ----------------- Restore persisted view state (stateKey) ---------------- */

interface StoredState {
  Pages?: number
  Records?: number
  Search?: string
  OrderBy?: string
  OrderDir?: string
  data?: TRow[]
  columns?: unknown[]
}

const readStored = (): StoredState | undefined => {
  const state = props.stateKey ? (store.data?.[props.stateKey] as StoredState | undefined) : undefined
  return Array.isArray(state?.data) && state!.data!.length ? state : undefined
}

function defaultPageSize(): number {
  if (!isServer.value && opts.value.paging === false) return Number.MAX_SAFE_INTEGER
  return isServer.value ? (opts.value?.lengthMenu?.[0] ?? 10) : (opts.value.pageLength ?? 10)
}

function sortingFromStored(state: StoredState): SortingState {
  return state.OrderBy ? [{ id: state.OrderBy, desc: String(state.OrderDir).toLowerCase() === 'desc' }] : []
}

function sortingFromOptions(): SortingState {
  const order = opts.value.order
  const dir = String(order?.dir ?? '').toLowerCase()
  if (!order || (dir !== 'asc' && dir !== 'desc')) return []
  const target = sourceColumns.value[order.idx - spec.value.legacyOffset]
  const id = target ? (target.id ?? target.data) : undefined
  return id ? [{ id, desc: dir === 'desc' }] : []
}

const restored = readStored()
const searching = ref(restored?.Search ?? '')

// Same as the previous implementation: cached rows win on first paint when a saved state exists.
if (restored) {
  dataset.value = copyWith(restored.data)
  serverTotal.value = resolveTotal(dataset.value)
} else if (!isServer.value) {
  dataset.value = props.data ?? []
}

/* -------------------------------- Table ----------------------------------- */

const selectionApi = useOCTableSelection<TRow>({
  model: selection as Ref<unknown[]>,
  pk: () => props.selectedPk,
  idsOnly: () => !!props.selectAllPk && isServer.value,
  rows: () => dataset.value,
})

const table = useTable({
  features: ocTableFeatures,
  get columns() {
    return spec.value.defs
  },
  get data() {
    return dataset.value
  },
  getRowId: (row: TRow, index: number) =>
    props.selectedPk && row[props.selectedPk] != null ? String(row[props.selectedPk]) : String(index),

  initialState: {
    pagination: {
      pageIndex: restored?.Pages ? Math.max(0, restored.Pages - 1) : 0,
      pageSize: restored?.Records || defaultPageSize(),
    },
    sorting: restored ? sortingFromStored(restored) : sortingFromOptions(),
    globalFilter: restored?.Search ?? '',
    columnVisibility: spec.value.visibility,
    columnPinning: spec.value.pinning,
    expanded: {},
  },

  // Server mode: the backend already filtered/sorted/paged; bypass the row models.
  get manualPagination() {
    return isServer.value
  },
  get manualSorting() {
    return isServer.value
  },
  get manualFiltering() {
    return isServer.value
  },
  get rowCount() {
    return isServer.value ? serverTotal.value : undefined
  },

  globalFilterFn: 'includesString',

  // DataTables cycled asc <-> desc on header click and never returned to "unsorted".
  enableSortingRemoval: false,
  sortDescFirst: false,
  enableMultiSort: false,

  // Child rows host the columns that do not fit; every row may expand.
  getRowCanExpand: () => true,

  get enableRowSelection() {
    const guard = opts.value.enableRowSelection
    return guard ? (row: { original: TRow }) => guard(row.original) : true
  },
  enableRowRangeSelection: false,
  state: {
    get rowSelection() {
      return selectionApi.rowSelection.value
    },
  },
  onRowSelectionChange: selectionApi.onRowSelectionChange,
})

type HeaderGroup = ReturnType<typeof table.getHeaderGroups>[number]
type TableHeader = HeaderGroup['headers'][number]
type TableColumn = TableHeader['column']
type TableRow = ReturnType<typeof table.getRowModel>['rows'][number]
type TableCell = ReturnType<TableRow['getVisibleCells']>[number]

// Narrow atom reads inside computed: Vue tracks them (v9 Vue adapter).
const pagination = computed(() => table.atoms.pagination.get())
const sorting = computed(() => table.atoms.sorting.get())
const globalFilter = computed(() => (table.atoms.globalFilter.get() as string | undefined) ?? '')

const page = computed({
  get: () => pagination.value.pageIndex + 1,
  set: (value: number) => table.setPageIndex(Math.max(0, value - 1)),
})
const pageSize = computed(() => pagination.value.pageSize)
const record = computed({
  get: () => pageSize.value,
  set: (value: number) => {
    if (value) table.setPageSize(value)
  },
})

const total = computed(() => (isServer.value ? serverTotal.value : table.getFilteredRowModel()?.rows?.length))

const isShowSelected = ref(false)
const displayRows = computed(() => {
  const rows = table.getRowModel().rows
  return isShowSelected.value ? rows.filter((row) => row.getIsSelected()) : rows
})
const dataTemplate = computed(() => table.getRowModel().rows.map((row) => row.original))

const allPageSelected = computed(() => table.getIsAllPageRowsSelected())
// v9: "some" means at least one, so the indeterminate look is gated on "not all".
const somePageSelected = computed(() => table.getIsSomePageRowsSelected())

/* ------------------ Server data flow (one pipeline) ------------------------ */

const runner = useAbortableRequest(loading)
const listAllSelect = ref<unknown[]>([])

const currentParams = () =>
  buildParams(
    { pagination: pagination.value, search: globalFilter.value, sorting: sorting.value },
    opts.value.paging !== false,
  )

const queryKey = computed(() => JSON.stringify(currentParams()))
let lastKey = ''
let firstLoad = true
let ready = false

function persist(params: OCRequestParams = currentParams(), rows: readonly TRow[] = dataset.value) {
  const key = props.stateKey
  if (!key) return undefined
  const all = (store.data ?? {}) as Record<string, any>
  const previous = all[key] ?? {}
  const state = { ...all, [key]: { ...previous, ...params, data: rows, columns: previous.columns ?? [] } }
  store.setData(state)
  return state
}

async function load(): Promise<void> {
  const cfg = api.value
  if (!cfg) return

  let params: OCRequestParams = currentParams()
  emit('update:data', params) // parents may mutate params or attach `.data` as an override
  if ('filter' in cfg && cfg.filter) params = { ...params, ...cfg.filter }
  if (params.data && isNotEmpty(params.data)) params = copyWith(params.data) as OCRequestParams

  // Parent-supplied paging always wins; parent-supplied ordering only on the first load.
  if (typeof params.Pages === 'number' && typeof params.Records === 'number') {
    if (params.Pages - 1 !== pagination.value.pageIndex || params.Records !== pageSize.value) {
      table.setPagination({ pageIndex: Math.max(0, params.Pages - 1), pageSize: params.Records })
    }
  }
  if (firstLoad && params.OrderDir && params.OrderBy) {
    table.setSorting([{ id: String(params.OrderBy), desc: String(params.OrderDir).toUpperCase() === 'DESC' }])
  }
  firstLoad = false

  // From here the table state is the single source of truth for ordering/paging.
  const sort = sorting.value[0]
  if (sort) {
    params.OrderBy = sort.id
    params.OrderDir = sort.desc ? 'DESC' : 'ASC'
  } else {
    delete params.OrderBy
    delete params.OrderDir
  }
  if (opts.value.paging === false) {
    delete params.Pages
    delete params.Records
  }
  lastKey = queryKey.value // state may just have been synced; keep the watcher from refetching

  try {
    const raw = await runner.run(async (signal) => {
      const { data, error } = await useHttp(cfg.url, { method: cfg.method, signal, data: params })
      if (error.value) throw error.value
      return data.value
    })
    if (raw === STALE) return

    const result = normalizeResponse<TRow>(raw, {
      where: 'where' in cfg ? cfg.where : undefined,
      selectAllPk: props.selectAllPk,
    })
    if (result.selectAllIds) listAllSelect.value = result.selectAllIds
    emit('update:dataSrc', result.payload)

    const rows = copyWith(result.rows) as TRow[]
    dataset.value = rows
    serverTotal.value = resolveTotal(rows)

    const state = persist(params, rows)
    if (state) emit('onSaveState', state)
  } catch (error: any) {
    toast.add({ color: 'red', title: `${isNotEmpty(error?.Message) ? error.Message : error}` })
    dataset.value = []
    serverTotal.value = 0
  }
}

// Search, sort, page and page size all funnel through here.
watch(queryKey, (key) => {
  if (ready && isServer.value && key !== lastKey) void load()
})

// Local data: keep the persisted view state (and rows) in sync.
watch([pagination, globalFilter, sorting, dataset], () => {
  if (props.stateKey && !isServer.value) persist()
}, { flush: 'post' })

watch(() => props.data, (rows) => {
  if (!isServer.value) dataset.value = rows ?? []
})

watch(sorting, (value) => {
  emit(
    'onOrder',
    value.map((s): [number, 'asc' | 'desc'] => {
      const index = sourceColumns.value.findIndex((c) => (c.id ?? c.data) === s.id)
      return [spec.value.legacyOffset + index, s.desc ? 'desc' : 'asc']
    }),
  )
})

// A redraw closes every child row, like DataTables Responsive did.
watch([pagination, globalFilter, sorting, dataset], () => table.setExpanded({}))

watch(spec, (next) => {
  table.setColumnPinning(next.pinning)
  scheduleResponsive()
})

// keyTable replaces the old "re-init DataTables" behaviour.
watch(() => props.keyTable, async () => {
  runner.abort()
  loading.value = false
  dataset.value = []

  const stored = readStored()
  table.setSorting(stored ? sortingFromStored(stored) : sortingFromOptions())

  if (stored) {
    searching.value = stored.Search ?? ''
    table.setGlobalFilter(searching.value)
    table.setPagination({
      pageIndex: Math.max(0, (stored.Pages ?? 1) - 1),
      pageSize: stored.Records || pageSize.value,
    })
    dataset.value = copyWith(stored.data)
    serverTotal.value = resolveTotal(dataset.value)
    lastKey = queryKey.value
  } else if (!isServer.value) {
    dataset.value = props.data ?? []
  } else if (props.autoload) {
    await load()
  }
  scheduleResponsive()
})

onMounted(async () => {
  if (isServer.value) {
    if (restored) lastKey = queryKey.value
    else if (props.autoload) await load()
  }
  ready = true
  // A search/sort/page change made while the first request was in flight was ignored by the watcher.
  if (isServer.value && queryKey.value !== lastKey) await load()
  relayout()
})

/* ------------------------ Header / footer actions -------------------------- */

function applySearch(value: string) {
  searching.value = value
  emit('onSearching', value)
  table.setGlobalFilter(value)
  table.setPageIndex(0)
}

function fnSelectRecord(size: number) {
  table.setPagination({ pageIndex: 0, pageSize: size })
  emit('onSelectRecord', size, 1)
}

async function fnReload() {
  if (!isServer.value) return emit('reloadByFixedData')
  await load()
}

function cycleSort(field: string) {
  const current = sorting.value[0]
  if (!current || current.id !== field) table.setSorting([{ id: field, desc: false }])
  else if (!current.desc) table.setSorting([{ id: field, desc: true }])
  else table.setSorting([])
}

/* ---- multi-field sort menu (shared popover, teleported to body) ---- */
const sortMenu = ref<{ colId: string; top: number; right: number } | null>(null)
const sortMenuRef = ref<HTMLElement>()
let sortTrigger: HTMLElement | null = null

const sortMenuItems = computed(() => {
  const id = sortMenu.value?.colId
  const meta = id ? (table.getColumn(id)?.columnDef.meta as OCColumnMeta | undefined) : undefined
  return meta?.sortData ?? []
})

function sortStateClass(field: string) {
  const current = sorting.value[0]
  if (current?.id !== field) return ''
  return current.desc ? 'icon-ordering-desc' : 'icon-ordering-asc'
}

function onSortMenuOutside(event: PointerEvent) {
  const target = event.target as Element
  if (sortMenuRef.value?.contains(target) || target.closest?.('.oc-sort-menu__trigger')) return
  closeSortMenu()
}

function toggleSortMenu(column: TableColumn, event: MouseEvent) {
  if (sortMenu.value?.colId === column.id) return closeSortMenu()
  sortTrigger = event.currentTarget as HTMLElement
  const rect = sortTrigger.getBoundingClientRect()
  sortMenu.value = {
    colId: column.id,
    top: Math.round(rect.bottom + 6),
    right: Math.max(8, Math.round(window.innerWidth - rect.right)),
  }
  document.addEventListener('pointerdown', onSortMenuOutside, true)
  // A fixed menu would drift from its trigger on scroll/resize, so close it instead.
  window.addEventListener('resize', closeSortMenu, true)
  window.addEventListener('scroll', closeSortMenu, true)
  void nextTick(() => sortMenuRef.value?.querySelector<HTMLElement>('.sort-detail')?.focus())
}

function closeSortMenu() {
  if (!sortMenu.value) return
  sortMenu.value = null
  document.removeEventListener('pointerdown', onSortMenuOutside, true)
  window.removeEventListener('resize', closeSortMenu, true)
  window.removeEventListener('scroll', closeSortMenu, true)
  sortTrigger?.focus()
}

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onSortMenuOutside, true)
  window.removeEventListener('resize', closeSortMenu, true)
  window.removeEventListener('scroll', closeSortMenu, true)
})

/* ------------------------------- Selection --------------------------------- */

const showGroupButtons = computed(
  () => !hideGroupBtnSelect.value && !!props.selectedPk && (!!props.selectAllPk || !isServer.value),
)
const showSelectAllBtn = computed(() => !!props.selectAllPk || (!!props.selectedPk && !isServer.value))

function onToggleAllPage(event: Event) {
  const checked = (event.target as HTMLInputElement).checked
  table.toggleAllPageRowsSelected(checked)
  emit('actionCheck', checked ? selectionApi.latest() : [])
}

function onRowCheck(row: TableRow, event: Event) {
  const checked = (event.target as HTMLInputElement).checked
  row.toggleSelected(checked)
  emit('actionCheck', checked ? row.original : selectionApi.latest())
}

function fnListAllSelect() {
  selectionApi.set(isServer.value ? [...listAllSelect.value] : [...dataset.value])
}

function fnClearAll() {
  selectionApi.set([])
}

/* ------------------------- Cell rendering helpers -------------------------- */

const colMeta = (column: TableColumn) => column.columnDef.meta as OCColumnMeta | undefined
const colTitle = (column: TableColumn) => String(column.columnDef.header ?? '')

function slotProps(cell: TableCell, row: TableRow, colIndex: number) {
  return {
    // DataTables semantics: display columns (data: null) receive the whole row as cellData.
    cellData: colMeta(cell.column)?.field == null ? row.original : cell.getValue(),
    rowData: row.original,
    rowIndex: row.index,
    colIndex,
    value: cell.getValue(),
    row,
    cell,
  }
}

function renderHtml(cell: TableCell, row: TableRow, colIndex: number): string {
  const fn = colMeta(cell.column)?.renderHtml
  return fn ? fn(cell.getValue(), 'display', row.original, { row: row.index, col: colIndex }) : ''
}

function ariaSort(column: TableColumn) {
  if (!column.getCanSort()) return undefined
  const dir = column.getIsSorted()
  return dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none'
}

const emptyText = computed(() => {
  const km = locale.value === 'km'
  if (isShowSelected.value) return km ? 'មិនមានទិន្នន័យជ្រើសរើសនៅក្នុងតារាងទេ' : 'No selected available in the table'
  return km ? 'មិនមានទិន្នន័យនៅក្នុងតារាងទេ' : 'No data available in the table'
})

const isDetailOpen = ref(false)
const detailText = ref<unknown>('')
function openDetail(value: unknown) {
  detailText.value = value
  isDetailOpen.value = true
}

/* ----------------- Responsive collapse (expand / collapse) ----------------- */

/**
 * Port of DataTables Responsive:
 *  - columns whose className has the token `all` (checkbox, actions, control) never collapse;
 *  - the rest are hidden from the right when the table does not fit its container;
 *  - hidden columns are listed in a child row opened by the control button.
 * Control host: the dedicated column for checkbox tables, otherwise the first visible cell.
 */
const responsiveHidden = shallowRef<Set<string>>(new Set())
const isCollapsed = computed(() => responsiveHidden.value.size > 0)
const measuring = ref(false)
let recalculating = false
let recalcTimer = 0

const isAlwaysVisible = (column: TableColumn) => /(^|\s)all(\s|$)/.test(colMeta(column)?.className ?? '')

function showControl(cell: TableCell, index: number) {
  if (!isCollapsed.value) return false
  return colMeta(cell.column)?.kind === 'expand' || (!spec.value.hasControlColumn && index === 0)
}

const hiddenCells = (row: TableRow) =>
  row.getAllCells().filter((cell) => responsiveHidden.value.has(cell.column.id))

function applyVisibility(hide: ReadonlySet<string>) {
  table.setColumnVisibility({
    ...spec.value.visibility,
    ...Object.fromEntries([...hide].map((id) => [id, false])),
  })
}

async function recalcResponsive() {
  const body = scrollBodyRef.value
  if (!body || props.showTemplate || recalculating) return
  recalculating = true
  try {
    // 1) show every column at its natural (max-content) width and measure
    responsiveHidden.value = new Set()
    measuring.value = true
    applyVisibility(new Set())
    await nextTick()

    const widths = new Map<string, number>()
    headRef.value
      ?.querySelectorAll<HTMLElement>('th[data-col-id]')
      .forEach((th) => widths.set(th.dataset.colId!, th.offsetWidth))
    measuring.value = false

    // 2) keep columns left-to-right until the container is full
    const available = body.clientWidth
    const columns = table?.getVisibleLeafColumns()
    const total = columns.reduce((sum, column) => sum + (widths.get(column.id) ?? 0), 0)
    const hide = new Set<string>()

    if (total > available) {
      let used = spec.value.hasControlColumn ? 36 : 30 // room for the control
      const flexible: TableColumn[] = []
      for (const column of columns) {
        if (isAlwaysVisible(column)) used += widths.get(column.id) ?? 0
        else flexible.push(column)
      }
      let overflow = false
      flexible.forEach((column, index) => {
        const width = widths.get(column.id) ?? 0
        if (!overflow && (index === 0 || used + width <= available)) used += width // always keep one
        else {
          overflow = true
          hide.add(column.id)
        }
      })
    }

    responsiveHidden.value = hide
    applyVisibility(hide)
    if (!hide.size) table.setExpanded({})
  } finally {
    measuring.value = false
    recalculating = false
  }
  await nextTick()
  measurePins()
}

function scheduleResponsive() {
  window.clearTimeout(recalcTimer)
  recalcTimer = window.setTimeout(recalcResponsive, 200)
}

/* -------------------------- Row reorder (local data) ----------------------- */

const dragFrom = ref<number | null>(null)
const canReorderNow = computed(
  () => !!opts.value.rowReorder && !isServer.value && sorting.value.length === 0 && !globalFilter.value,
)

function onDragStart(row: TableRow, event: DragEvent) {
  if (!canReorderNow.value) return event.preventDefault()
  dragFrom.value = row.index
  event.dataTransfer?.setData('text/plain', String(row.index))
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

function onDrop(target: TableRow, event: DragEvent) {
  const from = dragFrom.value
  dragFrom.value = null
  if (from === null || from === target.index) return
  event.preventDefault()

  const before = dataset.value
  const after = [...before]
  const [moved] = after.splice(from, 1)
  after.splice(target.index, 0, moved)

  const diff: OCReorderDiff[] = []
  for (let i = Math.min(from, target.index); i <= Math.max(from, target.index); i++) {
    diff.push({ oldPosition: before.indexOf(after[i]), newPosition: i, oldData: before[i], newData: after[i] })
  }
  dataset.value = after
  emit('onRowReorder', event, diff, { row: moved })
}

/* ------------- Layout: viewport-fit scroll, sticky head/footer, pins -------- */

const wrapperRef = ref<HTMLElement>()
const headWrapRef = ref<HTMLElement>()
const scrollBodyRef = ref<HTMLElement>()
const cardRef = ref<HTMLElement>()
const headRef = ref<HTMLElement>()
const footerRef = ref<HTMLElement>()
const totalDetailRef = ref<HTMLElement>()
const detailOneRef = ref<HTMLElement>()
const detailTwoRef = ref<HTMLElement>()

const headHeight = ref(0)
const pinOffsets = ref<Record<string, number>>({})

function measurePins() {
  headHeight.value = headWrapRef.value?.offsetHeight ?? 0
  const head = headRef.value
  if (!head) return
  const widths = new Map<string, number>()
  head.querySelectorAll<HTMLElement>('th[data-col-id]').forEach((th) => widths.set(th.dataset.colId!, th.offsetWidth))

  const { start, end } = table.atoms.columnPinning.get()
  const next: Record<string, number> = {}
  let offset = 0
  for (const id of start) {
    next[id] = offset
    offset += widths.get(id) ?? 0
  }
  offset = 0
  for (const id of [...end].reverse()) {
    next[id] = offset
    offset += widths.get(id) ?? 0
  }
  pinOffsets.value = next
}

const pinClass = (column: TableColumn) => (column.getIsPinned() ? 'oc-pinned' : undefined)

function pinStyle(column: TableColumn) {
  const pin = column.getIsPinned()
  if (!pin) return undefined
  const offset = `${pinOffsets.value[column.id] ?? 0}px`
  return pin === 'start' ? { insetInlineStart: offset } : { insetInlineEnd: offset }
}

const layout = useTableLayout({
  enabled: () => opts.value?.isScroll !== false,
  target: () => (props.showTemplate ? cardRef.value : scrollBodyRef.value),
  minWidth: () => props.minWidth,
  space: () => {
    const inContent = !!wrapperRef.value?.closest('.oc-content')
    if (props.showTemplate) return inContent ? (isHasCheck.value ? 46 : 44) : isHasCheck.value ? 12 : 10
    return inContent ? 38 : 18
  },
  extra: () => {
    const details =
      (totalDetailRef.value?.offsetHeight ?? 0) +
      (detailOneRef.value?.offsetHeight ?? 0) +
      (detailTwoRef.value?.offsetHeight ?? 0)
    const hasFooter = !props.isTotalDetail && (opts.value.paging || opts.value.info)
    const footer = footerRef.value?.offsetHeight || (hasFooter ? 60 : 0)
    return details + footer + (details === 0 && footer === 0 ? 10 : 0)
  },
  onSync: measurePins,
})

function relayout() {
  void nextTick(() => {
    layout.sync()
    scheduleResponsive()
  })
}

watch([displayRows, loading, () => props.showTemplate], relayout, { flush: 'post' })

// Container width changes (sidebar toggle, modal resize) also change what fits.
let resizeObserver: ResizeObserver | undefined
onMounted(() => {
  resizeObserver = new ResizeObserver(() => scheduleResponsive())
  watch(scrollBodyRef, (el, previous) => {
    if (previous) resizeObserver?.unobserve(previous)
    if (el) resizeObserver?.observe(el)
  }, { immediate: true })
})
onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  window.clearTimeout(recalcTimer)
})

/* ---------------------------- Imperative API ------------------------------- */

async function filter() {
  table.setPageIndex(0)
  await load()
}

async function reload(currentPage = true) {
  if (!currentPage) table.setPageIndex(0)
  await load()
}

function setListData(rows: TRow[]) {
  dataset.value = copyWith(rows)
  serverTotal.value = resolveTotal(dataset.value)
  persist()
}

function addRowData(row: TRow) {
  const next = [copyWith(row) as TRow, ...dataset.value]
  if (isServer.value) {
    // The page is server-sized: keep it at one page and count the new row.
    dataset.value = next.slice(0, pageSize.value)
    serverTotal.value += 1
  } else {
    dataset.value = next
  }
  persist()
}

function updateRowData(row: TRow, pk: string) {
  const index = dataset.value.findIndex((item) => item[pk] === row[pk])
  if (index < 0) return
  const next = [...dataset.value]
  next[index] = copyWith(row) as TRow
  dataset.value = next
  persist()
}

defineExpose({
  /** The TanStack table instance (replaces the DataTables `dt()` API). */
  table,
  filter,
  reload,
  /** Re-measures height, pinned offsets and the responsive collapse. */
  responsive: () => relayout(),
  setListData,
  addRowData,
  updateRowData,
})
</script>

<style lang="scss">
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.dark {
  .oc-table tbody tr:hover > td {
    background-color: #292929;
  }

  .oc-expand-btn {
    color: #dee2e6;
  }

  .popover-multi-sort-contain {
    box-shadow: rgba(0, 0, 0, 0.5) 0 7px 29px 0;
  }
}

.ocs-wrapper-table {
  --oc-sticky-bg: var(--bg-wrapper); /* page background behind the sticky toolbar/footer */
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: 100% !important;

  .btn {
    display: flex;
    align-items: center;
    grid-gap: 2px;
    height: 24px;
    padding: 0 10px 0 8px;
    border: 0;
    background: var(--bg-content);
    color: inherit;
    font: inherit;
    font-size: 12px;
    line-height: 12px;
    border-radius: 7px;
    cursor: pointer;
    user-select: none;
    transition: 0.2s ease-in-out;

    &.active {
      background: var(--color-primary);
      color: #fff;
    }

    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }
  }

  /* Footer never scrolls out of view: table scroll (isScroll) or page scroll (!isScroll). */
  .oc-footer-sticky {
    position: sticky;
    bottom: 0;
    z-index: 5;
    flex: none;
    background: var(--oc-sticky-bg);
  }

  /* Page scrolls: toolbar and table head stick under the topbar. Set --oc-topbar-height on :root. */
  &.is-page-scroll {
    height: auto !important;

    .oc-head-sticky {
      position: sticky;
      top: var(--oc-topbar-height, 0px);
      z-index: 6;
      background: var(--oc-sticky-bg);
    }

    .oc-table thead th {
      top: calc(var(--oc-topbar-height, 0px) + var(--oc-head-h, 0px));
    }
  }

  .oc-wrapper-card {
    position: relative;
    margin-top: 14px;
    height: 100% !important;
    overflow: auto;

    .oc-nav-card-scroll {
      overflow: auto;

      &::-webkit-scrollbar-thumb {
        border: 3px solid var(--bg-wrapper);
      }
    }
  }

  .container-table {
    --oc-table-bg: var(--bg-content);
    position: relative;
    box-sizing: border-box;
    width: 100% !important;
    height: 100% !important;
    margin-top: 14px;
    padding: 0 10px;
    background: var(--oc-table-bg);
    border-radius: 10px;

    @media (max-width: 540px) {
      padding: 0 0 8px;
    }

    &.have-border {
      border: 1px solid var(--border-table) !important;

      .oc-table tbody tr:last-child td {
        border-bottom-color: transparent !important;
      }
    }

    &.no-scroll-table {
      height: auto !important;

      .oc-scroll-body {
        overflow: visible;
      }
    }
  }
}

.oc-content {
  .btn {
    background: var(--bg-wrapper);

    &.active {
      background: var(--color-primary);
      color: #fff;
    }
  }

  .container-table {
    --oc-table-bg: var(--bg-wrapper);
    padding: 0 8px 0 14px !important;

    &.have-border {
      background: transparent !important;
    }
  }
}

.oc-modal .container-table {
  --oc-table-bg: transparent;
}

/* Scroll viewport. Head is sticky inside it (isScroll) or against the page (!isScroll). */
.oc-scroll-body {
  overflow: auto;
  padding: 12px 0 10px;
  border-radius: 10px;

  @media (max-width: 768px) {
    padding: 8px 0 10px;
  }

  &::-webkit-scrollbar {
    width: 9px;
    height: 9px;

    @media (max-width: 540px) {
      display: none;
    }
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: transparent;
    border: 3px solid var(--oc-table-bg, var(--bg-content));
    border-radius: 50px;
  }

  &:hover::-webkit-scrollbar-thumb {
    background-color: var(--color-w-b-4);
  }

  &::-webkit-scrollbar-thumb:hover {
    background-color: var(--color-w-b-3);
  }
}

.container-table.is-not-check .oc-scroll-body {
  padding: 10px 0;

  @media (max-width: 540px) {
    padding: 0;
  }
}

/* Semantic table */
.oc-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: var(--oc-table-bg, var(--bg-content));

  /* natural widths while measuring what fits */
  &.is-measuring {
    width: max-content;
  }

  th,
  td {
    padding: 8px 10px;
    text-align: left;
    white-space: nowrap;
    border-bottom: 1px solid var(--border-table);
  }

  thead th {
    position: sticky;
    top: 0;
    z-index: 2;
    font-size: 12px;
    background: var(--oc-table-bg, var(--bg-content));
  }

  tbody td {
    font-size: 13px;
  }

  tbody tr:last-child td {
    border-bottom-color: transparent;
  }

  tbody tr:hover > td {
    background-color: #f9f9f9;
  }

  tbody tr.selected > td {
    box-shadow: inset 0 0 0 9999px rgba(0, 0, 0, 0.05);
  }

  .min-width {
    width: 1px;
    white-space: nowrap;
  }

  .oc-checkbox-col {
    padding: 8px 10px;

    input {
      margin: 0;
    }
  }

  td.isLineClamp {
    width: auto;
    max-width: 250px;
    white-space: normal;
  }

  td.have-orderable {
    text-align: right;
    padding-right: 30px;
  }

  td.no-orderable {
    text-align: right;
  }

  td.oc-empty {
    padding: 24px 10px;
    text-align: center;
    color: var(--color-w-b-2);
  }

  .oc-pinned {
    position: sticky;
    z-index: 1;
    background: var(--oc-table-bg, var(--bg-content));
  }

  thead .oc-pinned {
    z-index: 3;
  }

  /* dedicated control column: zero width until something collapses */
  .td-collapse {
    padding: 0;
  }

  &.is-collapsed .td-collapse {
    padding: 4px 8px;
  }

  /* child row (hidden columns) */
  tbody tr.child > td.child {
    padding: 0 10px;
    white-space: normal;
  }

  tbody tr.oc-expanded > td {
    border-bottom-color: transparent;
  }
}

.dtr-details {
  position: relative;
  width: 100%;
  margin: 0;
  padding: 12px 10px;
  list-style: none;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -10px;
    width: 2px;
    height: 100%;
    background-color: var(--color-primary);
    border-radius: 4px;
  }

  li {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 4px 0;
  }

  .dtr-title {
    position: relative;
    min-width: fit-content;
    font-weight: 400;
    color: var(--color-w-b-2);

    &::after {
      content: ':';
      position: absolute;
      right: -4px;
    }
  }

  .dtr-data {
    color: var(--color-w-b-1);
  }
}

/* Expand / collapse control (same glyphs as the DataTables Responsive control) */
.oc-expand-wrap {
  display: inline-flex;
}

td.oc-has-control {
  position: relative;
  padding-left: 30px;

  > .oc-expand-wrap {
    position: absolute;
    top: 50%;
    left: 5px;
    transform: translateY(-50%);
  }
}

.oc-expand-btn {
  display: inline-block;
  width: 20px;
  height: 20px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #00000080;
  cursor: pointer;

  &::before {
    content: '\ea4e';
    display: block;
    font-family: remixicon;
    font-size: 20px;
    line-height: 20px;
    text-align: center;
  }

  &.expanded::before {
    content: '\ea78';
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
    border-radius: 4px;
  }
}

/* Header cell: sort button + optional multi-sort trigger */
.oc-th-inner {
  display: flex;
  align-items: center;
  gap: 6px;
}

.oc-th-sort {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
    border-radius: 4px;
  }
}

.oc-sort-icon {
  position: relative;
  display: inline-block;
  width: 12px;
  height: 14px;

  &::before,
  &::after {
    position: absolute;
    left: 0;
    font-family: remixicon;
    font-size: 14px;
    line-height: 4px;
    opacity: 0.125;
  }

  &::before {
    content: '\ea55';
    bottom: 50%;
    margin-bottom: 1px;
  }

  &::after {
    content: '\ea4f';
    top: 50%;
    margin-top: 1px;
  }

  &[data-dir='asc']::before,
  &[data-dir='desc']::after {
    opacity: 0.6;
  }
}

.oc-sort-menu__trigger {
  display: inline-flex;
  align-items: center;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
    border-radius: 4px;
  }
}

.popover-multi-sort-contain {
  position: fixed;
  z-index: 50;
  display: grid;
  gap: 6px;
  min-width: 120px;
  padding: 10px;
  font-size: 13px;
  font-weight: bold;
  background: var(--bg-wrapper);
  border-radius: 0.75rem;
  box-shadow: rgba(100, 100, 111, 0.2) 0 7px 29px 0;

  .sort-detail {
    position: relative;
    width: 100%;
    padding: 0 12px 0 0;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;

    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
      border-radius: 4px;
    }

    .icon-order {
      position: absolute;
      inset: 0 0 0 auto;
      width: 12px;

      &::before,
      &::after {
        position: absolute;
        left: 0;
        display: block;
        font-family: remixicon;
        font-size: 14px;
        line-height: 4px;
        opacity: 0.125;
      }

      &::before {
        content: '\ea55';
        bottom: 50%;
        margin-bottom: 1px;
      }

      &::after {
        content: '\ea4f';
        top: 50%;
        margin-top: 1px;
      }
    }

    &.icon-ordering-asc .icon-order::before,
    &.icon-ordering-desc .icon-order::after {
      opacity: 0.6;
    }
  }
}

.oc-drag-handle {
  display: inline-flex;
  cursor: grab;

  &.disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }
}

input[type='checkbox'].oc-checkbox {
  &.disabled {
    pointer-events: none;
    opacity: 0.5;
  }

  &:focus::after {
    border: none !important;
  }
}

/* Loading overlay */
.oc-loader {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 10;

  &.oc-hide-loader {
    pointer-events: none !important;
    background-color: transparent;
    visibility: hidden;
    z-index: -1;
  }

  &.oc-loader-fullscreen {
    position: fixed;
    width: 100vw;
    height: 100vh;
  }
}

/* Line-clamp modal */
.detail-container {
  position: relative;
  padding: 30px 0 20px;

  .btn-close-detail {
    position: absolute;
    top: 8px;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    margin-right: -8px;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--color-w-b-1);
    cursor: pointer;

    i {
      font-size: 13px;
      line-height: 13px;
      pointer-events: none;
    }
  }
}
</style>