<template>
  <div
    ref="refWrapper"
    class="r-table"
    :class="{
      'r-table__bordered': hasBorder,
      'r-table__scroll':   hasScroll,
    }"
    :style="{
      '--rtbl-height':      tableHeight ? `${tableHeight}px` : null,
      '--rtbl-body-height': bodyHeight ? `${bodyHeight}px`  : null,
      '--rtbl-row-height':  rowHeight  ? `${rowHeight}px`   : null,
    }"
  >
    <div ref="toolbarRef" class="r-table__toolbar">
      <!-- ── Outer slot (above header) ─────────────────────────────── -->
      <slot name="headerTable" v-if="$slots.headerTable" />
      <!-- ── Header Toolbar────────────────────────────────────────────────── -->
      <RTableHeader
        v-model:search="searching"
        :loading="loading"
        :options="options"
        :export-columns="exportCols"
        :export-rows="exportRows"
        :export-filename="exportFilename"
        :columns="orderedColumns"
        :column-filters="columnFilters"
        @searchTable="onSearch(searching)"
        @clearSearch="clearSearch"
        @reload="fnReload"
        @filter="onFilterApply"
      >
        <template v-if="$slots.headerLeft"        #headerLeft>        <slot name="headerLeft" />        </template>
        <template v-if="$slots.headerCenter"      #headerCenter>      <slot name="headerCenter" />      </template>
        <template v-if="$slots.headerApplyFilter" #headerApplyFilter> <slot name="headerApplyFilter" /> </template>
        <template v-if="$slots.headerRight"       #headerRight>       <slot name="headerRight" />       </template>
      </RTableHeader>

      <!-- ── Middle slot (rendered once, above either branch below) ── -->
      <slot name="middleTable" v-if="$slots.middleTable" />
    </div>

    <div class="r-table__content">
      <!-- ── Show Template (card/custom layout override) ───────────── -->
      <template v-if="showTemplate">
        <div class="r-table__template-wrap">
          <template v-if="loading">
            <slot v-if="$slots.loading" name="loading" v-bind="{ data: resultDataList }" />
            <div v-else class="r-table__loader" aria-live="polite" aria-busy="true">
              <i class="ri-loader-4-line r-table__spinner" />
            </div>
          </template>
          <div v-else class="r-table__template-scroll">
            <slot name="template" v-bind="{ data: resultDataList }" />
          </div>
          <div
            v-if="!loading && !(resultDataList?.length ?? 0) && options.showNoData !== false"
            class="r-table__empty"
            role="status"
          >
            <template v-if="!searching">
              <i class="ri-database-2-line" />
              <span>{{ t('data_not_found') }}</span>
            </template>
            <template v-else>
              <i class="ri-search-2-line" />
              <span>{{ t('no_results_for') }} "{{ searching }}"</span>
            </template>
          </div>
        </div>
      </template>

      <!-- ── Main Table area ───────────────────────────────────────── -->
      <div v-else ref="tableContainerRef" class="main-r-tbl-wrapper">
        <!-- Multi-select action bar (OCTable: Selected / select page / select all / clear) -->
        <div
          v-if="showSelectionBar"
          class="r-table__select-bar"
          role="toolbar"
          :aria-label="t('selection_actions')"
        >
          <button
            type="button"
            class="r-table__select-btn"
            :class="{ 'is-active': isShowSelected }"
            @click="isShowSelected = !isShowSelected"
          >
            <i class="ri-function-fill" /><span>{{ t('selected') }}: {{ selected.length }}</span>
          </button>
          <button
            v-if="isApi"
            type="button"
            class="r-table__select-btn"
            @click="selectAllThisPage"
          >
            <i class="ri-checkbox-circle-fill" /><span>{{ t('select_all_this_page') }}</span>
          </button>
          <button
            v-if="selectAllPkMode || !isApi"
            type="button"
            class="r-table__select-btn"
            @click="selectAllTotal"
          >
            <i class="ri-checkbox-circle-fill" /><span>{{ t('select_all') }}: {{ total }}</span>
          </button>
          <button type="button" class="r-table__select-btn" @click="clearAll">
            <i class="ri-close-circle-fill" /><span>{{ t('clear_all') }}</span>
          </button>
        </div>

        <!-- MOBILE + #card ────────────────────────────────────────────── -->
        <template v-if="isMobile && $slots.card">
          <RTableMobileCard :rows="displayRows" :columns="orderedColumns" :loading="loading">
            <template #card="sp">          <slot name="card"    v-bind="sp" /> </template>
            <template v-for="col in orderedColumns" :key="`mc-${col.key}`" #[col.key]="sp">
              <slot :name="col.key" v-bind="{ rowData: sp?.row, value: sp?.value, index: sp?.index }" />
            </template>
            <template v-if="$slots.actions" #actions="sp"> <slot name="actions" v-bind="sp" /> </template>
          </RTableMobileCard>
        </template>

        <!-- <div v-else ref="tableContainerRef" class="r-table__scroll-wrap"> -->
        <UTable
          v-else
          :key="tableKey"
          ref="refTable"
          v-model:row-selection="rowSelection"
          v-model:column-pinning="columnPinning"
          v-model:expanded="expandedRowState"
          v-model:sorting="sorting"
          :data="displayRows"
          :columns="columnsRender"
          :loading="loading"
          :sticky="options.sticky ?? true"
          :virtualize="options.virtualize ?? false"
          :empty="t('no_data_found')"
          :get-row-id="getRowId"
          :on-select="options.rowSelect ? onTableRowSelect : undefined"
          :class="[color ? `r-table__utable--${color}` : null, variant ? `r-table__utable--${variant}` : null]"
          class="r-table__utable"
          :ui="uiTbl"
        >
          <template
            v-for="entry in cellSlots"
            :key="entry.target"
            #[entry.target]="slotProps"
          >
            <slot :name="entry.source" v-bind="cellSlotProps(slotProps)" />
          </template>
          <template
            v-for="name in headerSlotNames"
            :key="name"
            #[name]="slotProps"
          >
            <slot :name="name" v-bind="headerSlotProps(slotProps)" />
          </template>

          <!-- Expanded sub-row: shows all expandedColumns for this row -->
          <template v-if="hasExpandedCols" #expanded="{ row }">
            <div class="r-table__expanded">
              <div class="r-table__expanded-bar"></div>
              <div
                v-for="col in expandedColumns"
                :key="col.key"
                class="r-table__expanded-content"
              >
                <div class="r-table__expanded-label" :class="`dot-${col.key}`">
                  <span>{{ col.label ?? col.key }}</span>
                  <span class="dot"></span>
                </div>
                <div class="r-table__expanded-value">
                  <!--
                    Use the same slot resolution as the table cell.
                    Parent slots like #Status="{ rowData }" work here too.
                  -->
                  <component :is="() => renderCellContent(col, row.original, row.original[col.key], row.index)" />
                </div>
              </div>
            </div>
          </template>
          <template #loading>
            <div class="r-table__loader" aria-live="polite" aria-busy="true">
              <div class="r-table__loader-icon">
                <UIcon :name="loadingTypeIcon" class="r-table__spinner" aria-hidden="true" />
              </div>
              <div class="r-table__loader-text"> {{ loadingText }} </div>
              <span class="sr-only">{{ t('loading') }}</span>
            </div>
          </template>
          <template #empty>
            <div class="r-table__empty" role="status">
              <UIcon :name="searching || columnFilters.length ? 'i-ri-search-2-line'  : 'i-ri-database-2-line'" aria-hidden="true" class="r-table__empty-icon" />
              <h3 class="r-table__empty-title"> {{ searching || columnFilters.length ? t('no_results_found') : t('no_data_found') }} </h3>
              <p class="r-table__empty-description"> {{ searching || columnFilters.length ? `${t('no_results_for',{ value: searching })}` : t('there_is_no_data_to_display') }} </p>
            </div>
          </template>
        </UTable>
        <!-- </div> -->
      </div>
    </div>

    <!-- ── Totals row + trailing detail slots (OCTable contract) ──────── -->
    <div v-if="$slots.totalDetail" ref="refTotalDetail" class="r-table__total-detail">
      <slot name="totalDetail" :total="total" />
    </div>
    <div v-if="$slots.ShowDetailAfterTableOne" ref="refShowDetailAfterTBL1">
      <slot name="ShowDetailAfterTableOne" />
    </div>
    <div v-if="$slots.ShowDetailAfterTableTwo" ref="refShowDetailAfterTBL2">
      <slot name="ShowDetailAfterTableTwo" />
    </div>

    <!-- ── Footer / Pagination ───────────────────────────────────── -->
    <div v-if="!isTotalDetail" ref="footerRef" class="r-table-footer-pagination r-table__footer">
      <RPagination
        v-if="options?.paging !== false"
        v-model:selected="record"
        v-model:page="page"
        :total="total"
        :items-per-page="record"
        :items="options.lengthMenu"
        :loading="loading"
        :options="options"
        @update:page="changePagination"
        @select-records="fnSelectRecord"
        mode="nuxtui"
        />
    </div>
  </div>
  <!-- ── Clamp full-text Modal ──────────────────────────────────── -->
  <RModal v-model="clampModal.open" :no-header="true">
    <p class="r-table__modal-text">{{ clampModal.text }}</p>
  </RModal>
</template>

<script setup>
import { computed, h, toRaw, resolveComponent, ref, reactive, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { applyColumnFilters } from '~/composables/useRTableFilter'
import { useDebounceFn } from '@vueuse/core'

defineOptions({ name: 'RTable' })

// ─── Expose (parent ref API) ──────────────────────────────────────────────────
defineExpose({
  reload,
  filter,
  responsive,
  // OCTable exposes `dt()` (the DataTables instance). RTable renders with
  // `UTable`, so this returns the underlying table API when available and
  // `null` otherwise — callers that only probe for its presence keep working.
  dt: () => refTable.value?.tableApi ?? refTable.value?.dt ?? null,
  setListData,
  addRowData,
  updateRowData,
  // Selection API — `getSelected` is a deferred accessor so it can read the
  // model declared further down without hitting a temporal-dead-zone error.
  getSelected:    () => selected.value,
  clearAll,
  selectAllThisPage,
  selectAllTotal,
  toggleRow,
  toggleAll,
})

// defineExpose({ dt, filter, reload, responsive, setListData, addRowData, updateRowData });

// ─── Props ───────────────────────────────────────────────────────────────────
// The prop set mirrors `OCTable.vue` (so an OCTable caller can drop RTable in),
// plus the RTable-only extras (`hasBorder`/`hasScroll`/`color`/`variant`/...)
// that the existing CMS pages already pass.
const props = defineProps([
  // ── OCTable-compatible ───────────────────────────────────────────────────
  'api',
  'data',
  'columns',
  'options',
  'keyTable',
  'showTemplate',
  'selectedPk',
  'selectAllPk', // paged "select all" payload list, or `true` for the current rows
  'waitFilter', // truthy → do not auto-load until `filter()` is called
  'isTotalDetail', // truthy → the table renders its own footer slot
  'autoload', // false → skip the first API request
  'minWidth', // px width below which the compact/collapsed layout kicks in
  'storeId',
  'stateKey',
  'haveBorder',
  'hideGroupBtnSelect',
  // ── RTable extras ────────────────────────────────────────────────────────
  'filterState',
  'isClamp',
  'exportFilename',
  'hasBorder',
  'hasScroll',
  'color',
  'variant',
])


// ─── Emits ───────────────────────────────────────────────────────────────────
const emits  = defineEmits([
  'update:data',
  'update:dataSrc',
  'update:filterState',
  'actionCheck',
  'reloadByFixedData',
  'onSelectRecord',
  'onSaveState',
  'onChangePagination',
  'onSearching',
  'onSort',
  'onOrder',
  'onRowReorder',
])

// v-model for selected rows (array) — single source of truth for selection.
// (Previously there was a *second* local `selected` ref that the toggle/select
// helpers mutated while `isRowSelected()` read from this one instead — that
// mismatch is why the selected-row background wasn't applying reliably.)
const selected = defineModel({ default: () => [] })

// ─── Composables ─────────────────────────────────────────────────────────────
const { t } = useI18n()
const { width: screenWidth } = useWindowSize()
const toast = useToast?.() ?? { add: () => {} }
// const { width } = useWindowSize()
const slots = useSlots()
// const screenWidth = ref(window.innerWidth)
// const screenWidth = ref(0)

// ─── Refs ────────────────────────────────────────────────────────────────────
const refWrapper = ref()
const refTable = ref()

// Trailing detail blocks (OCTable `totalDetail` / `ShowDetailAfterTable*`).
const refTotalDetail = ref(null)
const refShowDetailAfterTBL1 = ref(null)
const refShowDetailAfterTBL2 = ref(null)

// Viewport-fit measurement refs/state (see syncHeights below).
const toolbarRef = ref(null)
const footerRef = ref(null)
const tableHeight = ref(0)
const bodyHeight = ref(0)
const rowHeight = ref(0)

// Core table state
const data = computed(() => {
  if (props.api) return null;
  return props.data || [];
});
const resultDataList = ref([])
const dataSrc = ref([])        // full filtered dataset (for export, select all)
const refreshToken = ref(0)
const tableContainerRef = ref(null)
const containerWidth = ref(0)
const columnFilters = ref([])
const columnOrder = ref([])  // Stores keys in display order; empty = use props.columns order (drag reorder)
const expandedRowState = ref({})
const clampModal = reactive({ open: false, text: '' })
const dragSrcKey = ref(null) //Column drag-reorder (HTML5 DnD, desktop only) 
const selectAllPk = computed(() => props.selectAllPk);
const rafId  = ref(null)
// const showSelectedLoading = ref(false);


// ─── Store ──────────────────────────────────────────────────────────────────
const rTableStore = useRTableDataStore()
const screen = useScreenStore()
// const rTableStore = props.storeId ? useRTableStore() : null

// ─── Computed ────────────────────────────────────────────────────────────────
const isMobile = computed(() => screen.isMobile)

/* ---------------- options ---------------- */
const options = computed(() => {
  const configuredLengths = Array.isArray(props.options?.lengthMenu) && props.options.lengthMenu.length
    ? props.options.lengthMenu
    : (Array.isArray(props.options?.pageSizes) && props.options.pageSizes.length ? props.options.pageSizes : [10, 25, 50, 100])
  const searchEnabled = props.options?.searchable ?? props.options?.searching ?? true
  const pageLength = Number(props.options?.pageLength ?? props.options?.pageSize ?? configuredLengths[0]) || 10

  return {
    showNoData: true,
    pageSize: pageLength,
    pageSizes: configuredLengths,
    maxRowHeight: 71,
    info: true,
    paging: true,
    searching: searchEnabled,
    searchable: searchEnabled,
    isScroll: true,
    scrollY: 400,
    scrollX: false,
    scrollHeight: 480,
    reload: true,
    sticky: true,
    rowSelect: false,
    rowReorder: false,
    virtualize: false,
    order: { idx: 0, dir: '' },
    isShowSelectedBtn: false,
    lengthMenu: configuredLengths,
    pageLength,
    ...(props.options || {}),
    searching: searchEnabled,
    searchable: searchEnabled,
    lengthMenu: configuredLengths,
  }
})

/* ---------------- state ---------------- */
const initialPageSize = Number(options.value.pageLength ?? options.value.lengthMenu[0]) || 10
const record = ref(initialPageSize)
const pageSize = ref(initialPageSize)

const page = ref(1)
const total = ref(0)
const page_count = ref(initialPageSize)

const searching = ref('')
const sorting = ref([])
// const orderBy = ref('')
// const orderDir = ref('')

const rowSelection = ref({})
const columnPinning = ref({ left: [], right: [] })
const reorderState = ref({ from: null, row: null })
const isShowSelected = ref(false)
const listAllSelect = ref([])
const isMounted = ref(true)
 
const selectedPk = computed(() => props.selectedPk ?? null)

// ─── Column Collapse Logic ──────────────────────────────────────────────────
/**
 * Determines the collapse type of a column based on its className
 * 'all'       → Always collapses on any width constraint
 * 'width'     → Fixed width, never collapses
 * 'min-width' → Collapses only when container is too narrow
 * null        → Normal column, never collapses
 */
const getCollapseType = (col) => {  //className: 'all' | 'min-width' | 'width' | null
  if (!col || !col.className) return null
  const cn = String(col.className).toLowerCase()
  // NOTE: 'min-width' must be checked BEFORE 'width' — 'min-width'.includes('width')
  // is true, so the old order misclassified every min-width column as a fixed one.
  if (cn.includes('all')) return 'all'
  if (cn.includes('min-width')) return 'min-width'
  if (cn.includes('width')) return 'width'
  return null
}

// ─── Column sizing ──────────────────────────────────────────────────────────
// Fallback widths applied when a column does not declare its own `width` /
// `minWidth`. A `number` is treated as pixels.
const DEFAULT_COL_WIDTH  = 180
const MIN_COL_WIDTH      = 120
const EXPAND_COL_WIDTH   = 40   // fits the collapse/expand button
const CHECKBOX_COL_WIDTH = 44   // fits the row checkbox

/**
 * Resolve the CSS width/min/max for a data column.
 * 'width'     → fixed (never collapses, min == max == width)
 * 'min-width' → shrinkable floor (collapses when the container is too narrow)
 * default     → preferred width with a minimum floor
 */
const getColStyle = (col) => {
  const ct = getCollapseType(col)
  const style = {}

  if (ct === 'width') {
    const w = Number(col.width) || DEFAULT_COL_WIDTH
    style.width = style.minWidth = style.maxWidth = `${w}px`
    style.flexShrink = '0'
  } else if (ct === 'min-width') {
    style.minWidth = `${Number(col.minWidth ?? col.width) || MIN_COL_WIDTH}px`
    style.flexShrink = '0'
  } else {
    style.width = `${Number(col.width) || DEFAULT_COL_WIDTH}px`
    style.minWidth = `${Number(col.minWidth) || MIN_COL_WIDTH}px`
  }

  return style
}

/** Exact box for the system columns (checkbox / expand) so their th & td match the control. */
const systemColStyle = (w) => ({
  width: `${w}px`,
  minWidth: `${w}px`,
  maxWidth: `${w}px`,
  flexShrink: '0',
})


// ─── Column normalisation ────────────────────────────────────────────────────
// RTable accepts two column shapes and folds both into one internal shape:
//   1. `OCTable`'s DataTables config — { title, data, render, className,
//      orderable, hidden, alignRight, sortData, isLineClamp }
//   2. RTable's own config — { key, label, slot, sortable, className, width,
//      minWidth, isClamp, sortData }
// Everything downstream (collapse logic, cell slots, export, drag reorder)
// therefore only ever sees `{ key, label, slot, sortable, ... }`.
const isOCTableColumn = (col) => !!col && ('data' in col || 'title' in col)

const normalizeColumn = (col) => {
  const oct = isOCTableColumn(col)
  const key = col.key ?? col.data ?? null
  const renderSlot = typeof col.render === 'string' ? col.render.replace(/^#/, '') : null
  const slot = (col.slot ?? renderSlot ?? null)?.replace(/^#/, '') ?? null
  // OCTable columns are sortable unless explicitly `orderable: false`; RTable
  // columns are opt-in. An explicit `sortable` always wins.
  const sortable = col.sortable != null
    ? col.sortable
    : (oct ? col.orderable !== false && key != null && key !== '' : false)

  return {
    ...col,
    key,
    label: col.label ?? col.title ?? key,
    slot,
    sortable: sortable || !!col.sortData,
    width: col.width,
    minWidth: col.minWidth,
    isClamp: col.isClamp ?? col.isLineClamp,
    hidden: col.hidden === true,
    alignRight: col.alignRight === true,
    sortData: col.sortData ?? null,
  }
}

const normalizedColumns = computed(() =>
  (props.columns || [])
    .map(normalizeColumn)
    .filter(col => col.key != null && col.hidden !== true),
)

function normalizeColumnPinning() {
  const fixed = props.options?.fixedColumns
  const keys = normalizedColumns.value.map(col => col.key)

  if (!fixed) {
    columnPinning.value = { left: [], right: [] }
    return
  }

  if (Array.isArray(fixed)) {
    columnPinning.value = {
      left: fixed.map(index => keys[Number(index)]).filter(Boolean),
      right: [],
    }
    return
  }

  if (typeof fixed === 'number') {
    columnPinning.value = { left: keys.slice(0, fixed), right: [] }
    return
  }

  if (fixed === true) {
    columnPinning.value = { left: keys.slice(0, 1), right: [] }
    return
  }

  const leftCount = Number(fixed.left ?? fixed.leftColumns ?? 0) || 0
  const rightCount = Number(fixed.right ?? fixed.rightColumns ?? 0) || 0
  columnPinning.value = {
    left: leftCount ? keys.slice(0, leftCount) : [],
    right: rightCount ? keys.slice(-rightCount) : [],
  }
}

watch(normalizedColumns, normalizeColumnPinning)
watch(() => props.options?.fixedColumns, normalizeColumnPinning, { deep: true })
normalizeColumnPinning()

const orderedColumns = computed(() => { // Ordered columns (respects drag reorder)
  let cols = normalizedColumns.value
  if (columnOrder.value.length !== 0) {
    cols = columnOrder.value.map(key => cols.find(c => c.key === key)).filter(Boolean)
  }
  // OCTable appends an actions column whenever the caller provides an
  // `#actions` slot — mirror that, unless a column already renders it.
  if (slots.actions && !cols.some(c => c.key === 'actions' || c.slot === 'actions')) {
    cols = [...cols, { key: 'actions', label: t('action'), slot: 'actions', sortable: false }]
  }
  return cols
})

/**
 * Columns that should be in the expanded sub-row
 */
const expandedColumns = computed(() =>
  orderedColumns.value.filter(col => {
    const type = getCollapseType(col)
    
    // 'all' → Always in expanded row
    if (type === 'all') return true
    
    // 'min-width' → In expanded row only when compact
    if (type === 'min-width') return isCompact.value
    
    // Others never in expanded row
    return false
  })
)
// Check if we have any expanded columns to show
const hasExpandedCols = computed(() => expandedColumns.value.length > 0)

const originalColumns = computed(() =>
  orderedColumns.value.filter(col => {
    const type = getCollapseType(col)
    
    // 'all' → Hide from main table, always in expanded row
    if (type === 'all') return false
    
    // 'min-width' → Show in main table unless compact
    if (type === 'min-width') return !isCompact.value
    
    // 'width' and undefined → Always show
    return true
  })
)

// ─── Cell render helper ───────────────────────────────────────────────────────
// Called for both the table cell AND the expanded-row field
const renderCellContent = (col, original, value, idx) => {
  const colKey = col.key
  const rowScope = original && typeof original === 'object' ? original : {}

  const slotName   = col.slot?.replace(/^#/, '') ?? colKey
  const parentSlot = slots[slotName] ?? slots[colKey] ?? slots[`${colKey}-cell`]
  if (parentSlot) {
    return h('div', { class: 'r-table__cell-slot' },
      parentSlot({
        ...rowScope,
        row: original,
        rowData: original,
        value,
        index: idx,
        column: col,
      })
    )
  }

  if (typeof col.render === 'function') {
    const rendered = col.render(value, 'display', original, { col: idx, row: idx })
    if (rendered != null && typeof rendered !== 'boolean') {
      if (typeof rendered === 'string') {
        return h('span', { class: 'r-table__cell-html', innerHTML: rendered })
      }
      return rendered
    }
  }

  if (col.isClamp ?? props.isClamp) {
    return h(resolveComponent('RTruncatedText'), {
      text:     String(value ?? ''),
      lines:    col.clampLines ?? props.clampLines,
      onExpand: () => openClampModal(String(value ?? '')),
    })
  }

  return h('span', {
    class: ['r-table__cell-text', col.alignRight && 'r-table__cell-text--right'],
    title: (typeof value === 'string' || typeof value === 'number') ? value : undefined,
  }, value != null ? String(value) : '—')
}


// ─── Columns Render ─────────────────────────────────────────────────────────
const columnsRender = computed(() => {
  const cols = []

  if (rowReorderEnabled.value) {
    cols.push({
      id: '__reorder',
      accessorKey: '__reorder',
      enableSorting: false,
      size: EXPAND_COL_WIDTH,
      minSize: EXPAND_COL_WIDTH,
      maxSize: EXPAND_COL_WIDTH,
      enableHiding: false,
      meta: {
        class: { th: 'r-table-col-reorder', td: 'r-table-col-reorder' },
        style: {
          th: systemColStyle(EXPAND_COL_WIDTH),
          td: systemColStyle(EXPAND_COL_WIDTH),
        },
      },
      header: () => h('span', { class: 'r-table__expand-placeholder' }),
      cell: ({ row }) => h('div', { class: 'r-table-reorder-cell' }, [
        h('button', {
          type: 'button',
          draggable: true,
          class: 'r-table__reorder-btn',
          'aria-label': t('reorder'),
          onDragstart: (event) => onRowDragStart(event, row),
          onDragover: (event) => onRowDragOver(event, row),
          onDrop: (event) => onRowDrop(event, row),
          onDragend: () => { reorderState.value = { from: null, row: null } },
        }, [
          h(resolveComponent('UIcon'), { name: 'i-ri-drag-line' }),
        ]),
      ]),
    })
  }

  // Auto prepend expand button column

  // ── Expand button column ────────────────────────────────────────────
  if (hasExpandedCols.value) {
    cols.push({
      id: '__expand',
      accessorKey: '__expand',
      enableSorting: false,
      size: EXPAND_COL_WIDTH,
      minSize: EXPAND_COL_WIDTH,
      maxSize: EXPAND_COL_WIDTH,
      enableHiding: false,
      meta: {
        class: { th: 'r-table-col-expand', td: 'r-table-col-expand' },
        style: {
          th: systemColStyle(EXPAND_COL_WIDTH),
          td: systemColStyle(EXPAND_COL_WIDTH),
        },
      },
      header: () => h('span', { class: 'r-table__expand-placeholder' }),
      // header: '',
      cell: ({ row }) => {
        if (!hasExpandedCols.value) {
          return h('span', { class: 'r-table__expand-placeholder' })
        }
        const isOpen = row.getIsExpanded()
          // Create the button with icon
          const button = h('button', {
            class: ['r-table__expand-btn', isOpen && 'r-table__expand-btn--open'],
            'aria-label': isOpen ? t('collapse') : t('expand'),
            'aria-expanded': String(isOpen),
            onClick: (e) => {
              e.stopPropagation()
              row.toggleExpanded()
            },
          }, [
            h(resolveComponent('UIcon'), {
              name: isOpen ? 'i-ri-arrow-down-s-fill' : 'i-ri-arrow-right-s-fill',
            })
          ])

         // Wrap with RTooltip
        return h('div', { class: 'r-table-expand-cell' }, [
          h(resolveComponent('RTooltip'), {
            text: isOpen ? t('collapse') : t('expand'),
            placement: 'top',
          }, {
            default: () => button
          })
        ])
      },
    })
  }

  // Checkbox column
  // ── Checkbox column ─────────────────────────────────────────────────
  if (selectedPk.value) {
    const RCheckbox = resolveComponent('RCheckbox')
    cols.push({
      id: 'rtable_checkbox',
      accessorKey: 'rtable_checkbox',
      size: CHECKBOX_COL_WIDTH,
      minSize: CHECKBOX_COL_WIDTH,
      maxSize: CHECKBOX_COL_WIDTH,
      enableSorting: false,
      meta: {
        class: { th: 'r-table-col-checkbox', td: 'r-table-col-checkbox' },
        style: {
          th: systemColStyle(CHECKBOX_COL_WIDTH),
          td: systemColStyle(CHECKBOX_COL_WIDTH),
        },
        rowClass: ({ row }) =>
          isRowSelected(row.original)
            ? 'r-table__row--selected'
            : ''
      },
      header: () => h(RCheckbox, {
        // Checked = every visible row selected; indeterminate = some but not all.
        modelValue:              isAllSelected.value,
        indeterminate:           isIndeterminate.value,
        'aria-label':            t('select_all'),
        'onUpdate:modelValue':   () => toggleAll(),
      }),
      cell: ({ row }) => h('div', { class: 'r-table-checkbox-cell'}, [
        h(RCheckbox, {
          // `modelValue` is what RCheckbox's v-model reads — using `value`
          // here left the checkbox uncontrolled so the tick never stuck.
          modelValue:              isRowSelected(row.original),
          'aria-label':            t('select_row'),
          'onUpdate:modelValue': () => toggleRow(row.original),
          onClick:               (e) => { e.stopPropagation() },
        }),
      ])
    })
  }

  // ── Data columns ────────────────────────────────────────────────────
  for (const col of originalColumns.value) {
    const colKey       = col.key
    const canSort      = col.sortable && col.sort !== false
    const ct = getCollapseType(col)

    // Determine column style — applied to both <th> and <td> through meta so
    // the fixed/min/default widths actually constrain the table columns
    // (Nuxt UI's UTable ignores TanStack `size` when rendering styles).
    const colStyle = getColStyle(col)

    cols.push({
      id:            colKey,
      accessorKey:   colKey,
      enableSorting: false,

      meta: {
        class: { th: 'r-table-col-data', td: 'r-table-col-data' },
        style: { th: colStyle, td: colStyle },
      },

      // ── Header render fn ──────────────────────────────────────────────────
      header: () => {
        const headerSlot = slots[`${colKey}-header`]
        if (headerSlot) return h('div', headerSlot({}))

        const multiSortFields = normalizeSortData(col)
        const sortField = multiSortFields.length ? orderBy.value : colKey
        const isSorted  = multiSortFields.length
          ? multiSortFields.includes(sortField) && !!orderDir.value
          : orderBy.value === colKey
        const isAsc     = orderDir.value === 'asc'
        const hasFilter = columnFilters.value.some(f => f.key === colKey && f.value != null && f.value !== '')

        return h('div', {
          class:    ['r-table__th-inner','font-bold', canSort && 'r-table__th-inner--sortable', col.alignRight && 'r-table__th-inner--right', dragSrcKey.value === colKey && 'r-table__th-inner--dragging'],
          role:     canSort ? 'button' : undefined,
          tabindex: canSort ? 0 : undefined,
          draggable: !isMobile.value || undefined,
          'aria-sort': canSort ? (isSorted ? (isAsc ? 'ascending' : 'descending') : 'none') : undefined,
          onClick:    canSort ? () => onSort(colKey) : undefined,
          onKeydown:  canSort ? (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSort(colKey) }
          } : undefined,
          onDragstart: !isMobile.value ? () => onDragStart(colKey) : undefined,
          onDragover:  !isMobile.value ? (e) => e.preventDefault() : undefined,
          onDrop:      !isMobile.value ? (e) => { e.preventDefault(); onDrop(colKey) } : undefined,
        }, [
          hasFilter ? h(resolveComponent('UIcon'), { name: 'i-ri-filter-fill', class: 'r-table__filter-icon' }) : null,
          h('span', { class: 'r-table__th-label' }, col.label ?? colKey),
          multiSortFields.length ? renderMultiSortTrigger(col) : null,
          canSort ? h(resolveComponent('UIcon'), {
            name:  sortIcon(sortField),
            class: ['r-table__sort-icon', isSorted && 'r-table__sort-icon--active'],
          }) : null,
        ])
      },
 
      // ── Cell render fn ────────────────────────────────────────────────────
      cell: ({ row }) => {
        const cellStyle = {}
        if (ct === 'width') {
          cellStyle.textOverflow = 'ellipsis'
          cellStyle.whiteSpace = 'nowrap'
        }

        const original = row.original
         const selected = isRowSelected(original)
        const value    = original?.[colKey]
        const idx      = row.index
        return h('div', { 
          class: ['r-table__cell-wrap',selected && 'r-table__cell-wrap--selected'],
          style: cellStyle,
          title: (ct === 'width' && typeof value === 'string') ? value : undefined
        },
          renderCellContent(col, original, value, idx)
        )
      },
    })
  }
  return cols
})


const initialOrderState = resolveInitialOrder()
const orderDir = ref(initialOrderState.dir)
const orderBy = ref(initialOrderState.by)

const tableKey = computed(() => props.keyTable || 'r-table')

watch(() => props.keyTable, () => {
  refreshToken.value += 1
  page.value = 1
  searching.value = ''
  columnFilters.value = []
  columnOrder.value = []
  const order = resolveInitialOrder()
  orderBy.value = order.by
  orderDir.value = order.dir
  normalizeColumnPinning()
  if (props.api && autoload.value) nextTick(fnReload)
})

const rowReorderEnabled = computed(() => {
  const value = options.value.rowReorder
  if (!value) return false
  if (typeof value === 'object') return value.enabled !== false
  return true
})
const hideGroupBtnSelect = computed(() => isNotEmpty(props.hideGroupBtnSelect))

// Stable row id — required so row-expansion state (auto-expand on compact)
// survives re-renders. Falls back to the row index when no primary key exists.
function getRowId(row, index) {
  if (props.selectedPk && row?.[props.selectedPk] != null) return String(row[props.selectedPk])
  if (row?.id != null) return String(row.id)
  return `row-${index ?? ''}`
}

const loadingTypeIcon = computed(() => {
  if (searching.value) return 'i-ri-refresh-line'
  return 'ri-loader-line'
})

const loadingText = computed(() => {
  if (searching.value) return t('searching_data')
  return t('loading_data')
})

const pk = computed(() => props.selectedPk)

const isIndeterminate = computed(() => selected.value.length > 0 && !isAllSelected.value)

const exportCols = computed(() =>
  normalizedColumns.value.map(c => ({ key: c.key, label: c.label ?? c.key }))
)

const exportRows = computed(() => toRaw(dataSrc.value))

// Every row on the current page is selected. Delegates to `isRowSelected` so
// the pk-comparison logic lives in exactly one place.
const isAllSelected = computed(() =>
  resultDataList.value.length > 0 && resultDataList.value.every(row => isRowSelected(row)),
)

const currentFilterState = computed(() => ({ // Filter state for parent
  search: searching.value,
  sort: { column: orderBy.value, direction: orderDir.value?.toLowerCase() },
  columnFilters: columnFilters.value,
  columnOrder: columnOrder.value,
  page: page.value,
  pageSize: pageSize.value,
}))


const api = computed(() => {
  if (!props.api) return null
  if (typeof props.api === 'string') {
    return { url: resolveApiUrl(props.api), method: 'get' }
  }
  return {
    ...props.api,
    url: resolveApiUrl(props.api.url),
    method: props.api.method || 'get',
  }
})

const storageKey = computed(() => props.storeId || 'r-table')

const showTemplate = computed(() => props.showTemplate ?? false)
const exportFilename = computed(() => props.exportFilename ?? 'data')
const hasBorder = computed(() => props.hasBorder ?? props.haveBorder ?? false)
const hasScroll = computed(() => props.hasScroll ?? false)
const color = computed(() => props.color ?? 'primary')
const variant = computed(() => props.variant ?? 'outline')
const loading = defineModel("loading", { default: false });

// ── OCTable-compatible option flags ─────────────────────────────────────────
const autoload = computed(() => (props.autoload ?? true) !== false)
const waitFilter = computed(() => isNotEmpty(props.waitFilter))
const isTotalDetail = computed(() => (props.isTotalDetail ?? false) === true)

/**
 * Client-mode data pipeline: filter → search → sort → paginate.
 * This used to be an imperative function (`applyClientPipeline()`) that every
 * action — mount, search, sort, filter, paginate — had to remember to call.
 * That's now a computed: it re-derives automatically from its dependencies
 * (props.data, columnFilters, searching, orderBy/orderDir, page, pageSize),
 * so there's a single reactive source of truth instead of ~8 call sites that
 * could drift out of sync.
 */
const clientPipelineResult = computed(() => {
  void refreshToken.value
  if (props.api) return null // server mode doesn't use this

  let src = [...(props.data || [])]

  // Column filters
  src = applyColumnFilters(src, columnFilters.value)

  // Global search
  if (searching.value) {
    const q = searching.value.toLowerCase()
    src = src.filter(row =>
      Object.values(row).some(v => String(v ?? '').toLowerCase().includes(q))
    )
  }

  // Sort (single source of truth: orderBy / orderDir)
  if (orderBy.value && orderDir.value) {
    const column = orderBy.value
    const direction = orderDir.value.toLowerCase()

    src = [...src].sort((a, b) => {
      const cmp = String(a[column] ?? '').localeCompare(
        String(b[column] ?? ''),
        undefined,
        { numeric: true }
      )
      return direction === 'asc' ? cmp : -cmp
    })
  }

  const start = (page.value - 1) * pageSize.value
  const pageData = options.value.rowCallback
    ? src.slice(start, start + pageSize.value).map(options.value.rowCallback)
    : src.slice(start, start + pageSize.value)

  return { total: src.length, dataSrc: src, resultDataList: pageData }
})

// Sync the computed result into the writable refs that the rest of the
// component (and setListData/addRowData/updateRowData, which need to keep
// mutating resultDataList directly) already relies on.
watch(clientPipelineResult, (result) => {
  if (!result) return
  total.value = result.total
  dataSrc.value = result.dataSrc
  resultDataList.value = result.resultDataList
}, { immediate: true })

onMounted(async () => {
  isMounted.value = true;

  // Restore persisted page/pageSize BEFORE fetching, so the first fetch
  // already uses the right page instead of fetching page 1 and then
  // silently swapping to the stored page without a refetch.
  const saved = localStorage.getItem(storageKey.value)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      if (parsed.page) page.value = parsed.page
      if (parsed.pageSize) pageSize.value = parsed.pageSize
    } catch {}
  }

  // `stateKey` restore (OCTable `checkStateData`): paging/search/order and the
  // rows themselves are re-applied before the first request so a table coming
  // back to a page keeps its place instead of jumping to page 1.
  if (isNotEmpty(props.stateKey)) {
    const savedState = rTableStore.data[props.stateKey]
    if (savedState) {
      if (isNotEmpty(savedState.Records)) {
        record.value = savedState.Records
        pageSize.value = savedState.Records
        page_count.value = savedState.Records
      }
      if (typeof savedState.Search === 'string') searching.value = savedState.Search
      if (isNotEmpty(savedState.Pages)) page.value = savedState.Pages
      if (isNotEmpty(savedState.OrderBy)) {
        orderBy.value = savedState.OrderBy
        orderDir.value = savedState.OrderDir ?? ''
      }
      if (Array.isArray(savedState.data) && savedState.data.length) {
        resultDataList.value = copyWith(savedState.data)
      }
    }
  }

  if (props.api && autoload.value && !waitFilter.value) {
    resultDataList.value = copyWith(await getData());
  }
  // else: nothing to do here — clientPipelineResult's immediate watcher
  // already populated resultDataList/dataSrc/total before this hook ran.

  if (props.storeId && rTableStore) {
    rTableStore.init(props.storeId, {
      columns: props.columns,
      options: options.value
    })
  }
  isMounted.value = false;
})

const cellSlots = computed(() => {
  const entries = []
  for (const col of orderedColumns.value) {
    for (const source of [col.slot, col.key, `${col.key}-cell`]) {
      if (!source || !slots[source]) continue
      const target = source.endsWith('-cell') ? source : `${source}-cell`
      if (!entries.some(e => e.target === target && e.source === source)) {
        entries.push({ source, target })
      }
    }
  }
  return entries
})

const headerSlotNames = computed(() =>
  orderedColumns.value
    .map(col => `${col.key}-header`)
    .filter(name => !!slots[name])
)

const cellSlotProps = (slotProps) => {
  const rowData = slotProps?.row?.original
  const rowScope = rowData && typeof rowData === 'object' ? rowData : {}
  return {
    ...rowScope,
    row: rowData,
    rowData,
    value: slotProps?.column?.id != null ? rowData?.[slotProps.column.id] : undefined,
    index: slotProps?.row?.index,
    cell: slotProps,
  }
}

const headerSlotProps = (slotProps) => ({
  column: slotProps?.column,
  header: slotProps?.header,
  table: slotProps?.table,
})

function onTableRowSelect(event, row) {
  if (!selectedPk.value || !row?.original) return
  toggleRow(row.original)
}

// change record filter
async function fnSelectRecord(records) {
  page.value = 1
  record.value = Number(records)
  pageSize.value = Number(records)
  page_count.value = Number(records)

  emits('onSelectRecord', record.value, page.value)

  if (props.api) {
    resultDataList.value = copyWith(await getData())
    return
  }
  // Local data: page/pageSize just changed above, so clientPipelineResult
  // (and its sync watcher) picks it up automatically — nothing to call here.
}
/**
 * Persist the current paging/search/sort state plus the rendered rows into the
 * `stateKey` slot of the shared store (OCTable's `fnSetDataToState`). Used after
 * any local mutation — `setListData` / `addRowData` / `updateRowData` — so a
 * remount can restore the table exactly where it was.
 */
function fnSetDataToState(override = {}) {
  if (isEmpty(props.stateKey)) return;
  const prevState = rTableStore.data[props.stateKey] ?? {};

  const dataSender = {
    ...{
      Pages: page.value,
      Records: record.value,
      Search: searching.value,
      OrderBy: orderBy.value,
      OrderDir: orderDir.value,
    },
    ...override,
  };

  rTableStore.setData({
    ...rTableStore.data,
    [props.stateKey]: {
      ...prevState,
      ...dataSender,
      data: resultDataList.value,
      columns: prevState.columns ?? [],
    },
  });
}

/* ---------------- data fetching (server mode) ---------------- */
let controller
async function getData() {
  if(!api.value) return;
  if (controller) {
    controller.abort();
  }
  try {
    loading.value = true;
    // OCTable's request contract: PascalCase paging/sort fields. A caller can
    // still reshape this through the `update:data` handler (that is how
    // CurrencyMain drops the unsupported OrderBy/OrderDir keys).
    let dataSender = {
      Pages: page.value,
      Records: record.value,
      Search: searching.value,
      OrderBy: orderBy.value,
      OrderDir: orderDir.value,
    };

    emits("update:data", dataSender);
    if (api.value?.filter) dataSender = { ...dataSender, ...api.value?.filter };
    if (isNotEmpty(dataSender?.data)) dataSender = copyWith(dataSender.data)

    page.value = dataSender.Pages
    record.value = dataSender.Records

    if (!options.value?.paging) {
      delete dataSender.Pages;
      delete dataSender.Records;
    }

    if (isMounted.value && isNotEmpty(dataSender.OrderDir)) {
      orderBy.value = dataSender.OrderBy;
      orderDir.value = dataSender.OrderDir;
    } else {
      if (!showTemplate.value) {
        dataSender.OrderBy = orderBy.value;
        dataSender.OrderDir = orderDir.value;
      }
    }

    if (!isNotEmpty(orderDir.value)) {
      delete dataSender.OrderBy;
      delete dataSender.OrderDir;
    }

    controller = new AbortController();

    const isStringApi = typeof api.value === 'string'
    const apiUrl    = isStringApi ? api.value : api.value.url
    const apiMethod = isStringApi ? 'get' : (api.value.method || 'get')

    const { data, error } = await useHttp(apiUrl, {
      method: apiMethod,
      signal: controller.signal,
      data: dataSender,
    });

    if (isNotEmpty(error.value)) throw error.value;
    if (isNotEmpty(selectAllPk.value) && isNotEmpty(api.value)) {
      listAllSelect.value = data.value[selectAllPk.value] || [];
    }

    if (isNotEmpty(props.api?.where)) data.value = data.value[props.api.where];

    emits("update:dataSrc", data.value);
    if (isNotEmpty(data.value?.dataSrc)) data.value = data.value.dataSrc;

    // Accept every envelope the CMS endpoints use: a bare array, `{ dataSrc }`,
    // `{ data }` or the RITHTHY `{ Data, Total }` shape. The reported total (if
    // any) is kept so the footer pages against the whole result set.
    const envelopeTotal =
      data.value?.Total ??
      data.value?.total ??
      data.value?.TotalRecord ??
      data.value?.totalRecords ??
      data.value?.RecordCount ??
      data.value?.recordCount
    if (Array.isArray(data.value?.Items)) {
      data.value = { Data: data.value.Items, Total: data.value.Total ?? envelopeTotal }
    } else if (Array.isArray(data.value?.Data)) {
      data.value = data.value.Data
    } else if (Array.isArray(data.value?.data)) {
      data.value = data.value.data
    }
    await setTotal(data.value, envelopeTotal)

    if (isNotEmpty(props.stateKey)) {
      // 1. Get the previous state for this table
      const prevState = rTableStore.data[props.stateKey] ?? {};

      // 2. Build new state payload
      const newState = {
        ...prevState,
        ...dataSender,             // keep paging/search/order info
        data: data.value ?? [],    // update data
        columns: prevState.columns ?? [], // keep existing columns if not updated
      };

      // 3. Merge into store root
      const state = {
        ...rTableStore.data,
        [props.stateKey]: newState,
      };

      emits("onSaveState", state);
      rTableStore.setData(state);
    }

    return data.value || [];
  } catch (error) {
    console.log("error ===============get list",error)
    toast.add({
      color: "error",
      title: `${isNotEmpty(error?.Message) || isNotEmpty(error?.message) || isNotEmpty(error?.detail) ? error.Message || error?.message || error?.detail : error}`,
    });
    return []
  } finally {
    loading.value = false;
  }
}

watch(resultDataList, async (n) => {
  // Server mode only: the row payload may carry the grand total. Local mode's
  // total is authoritative from `clientPipelineResult` (the whole filtered set),
  // so recomputing it from the current page would shrink it to the page size.
  if (!isShowSelected.value && isNotEmpty(api.value)) {
    await setTotal(n);
  }
}, { deep: true });


// change pagination
async function changePagination(pageNo) {
  page.value = pageNo
  emits("onChangePagination", pageNo, record.value);

  setTimeout(async () => {
    if (isNotEmpty(api.value)) {
      if (isMounted.value) return;
      resultDataList.value = copyWith(await getData());
    }
    // else: page.value already changed above, clientPipelineResult reacts automatically
  }, 100);
}

async function changePageSize(value) {
  record.value = Number(value)
  pageSize.value = Number(value)
  page.value = 1

  emits('onSelectRecord', record.value, page.value)

  if (props.api) {
    resultDataList.value = copyWith(await getData())
  }
  // else: pageSize/page already changed above, clientPipelineResult reacts automatically
}

async function setTotal(list, explicitTotal) {
  const rows = Array.isArray(list) ? list : []
  const first = rows[0] ?? {}
  // Some list endpoints put the count on the first row instead of the envelope.
  const reported =
    first.recordCount ??
    first.recordsCount ??
    first.recordCounts ??
    first.RecordCount ??
    first.RecordsCount ??
    first.RecordCounts ??
    first.totalRecord ??
    first.TotalRecord ??
    first.totalRecords ??
    first.totalRecords
  const resolved = explicitTotal ?? reported ?? rows.length
  total.value = Number(resolved) || 0
}

async function setTotal1(list) {
  total.value = isNotEmpty(list)
    ? list[0]?.RecordCount ||
    list[0]?.RecordsCount ||
    list[0]?.RecordCounts ||
    list[0]?.TotalRecord ||
    list.length
    : 0;
}

async function reload(currentPage = true) {
  if (!currentPage) page.value = 1;
  if (isMounted.value) return;
  if (isNotEmpty(api.value)) {
    resultDataList.value = copyWith(await getData());
  }
  // else: local data is already reactive — nothing to refetch/recompute here
}

const doSearch = async (search = '') => {
  page.value = 1
  searching.value = search

  emits('onSearching', search)

  if (api.value) {
    // Server-side
    resultDataList.value = copyWith(await getData())
  } else {
    // Local-side: searching.value already changed above, clientPipelineResult
    // reacts automatically
    fnSetDataToState()
  }
}

const onSearch = useDebounceFn((search) => {
  doSearch(search)
}, 300)

async function clearSearch() {
  await doSearch('')
}

async function fnReload() {
  if (!isNotEmpty(api.value)) {
    emits("reloadByFixedData");
    return; // local data is already reactive — nothing to recompute here
  }
  resultDataList.value = copyWith(await getData());
}

function _dt() {
  return refTable.value?.dt;
}

async function filter() {
  page.value = 1;
  if (isNotEmpty(api.value)) {
    resultDataList.value = copyWith(await getData());
  }
  // else: page reset above already triggers clientPipelineResult
}

function setListData(data) {
  resultDataList.value = copyWith(data)
  fnSetDataToState()
}

function addRowData(rowData) {
  resultDataList.value.unshift(copyWith(rowData))
  if (options.value?.lengthMenu.some(e => e == record.value)) {
    if (copyWith(resultDataList.value)?.length == (record.value + 1)) {
      resultDataList.value.splice(copyWith(resultDataList.value)?.length - 1)
    }
  }
  fnSetDataToState()
}

function updateRowData(rowData, pk) {
  const index = resultDataList.value.findIndex(e => e[pk] === rowData[pk])
  if (index >= 0) {
    resultDataList.value[index] = copyWith(rowData)
    fnSetDataToState()
  }
}

const onFilterApply = (filters) => { columnFilters.value = filters; page.value = 1; fnReload() }

// * ---------------- selection ---------------- */
// `selected` (the v-model) stores the raw row objects, or — when `selectAllPk`
// is set for a server table — just the primary keys. Row identity is always
// compared through `pk` (selectedPk) so the <tr> highlight, the checkbox state
// and `isRowSelected` all agree for both representations.
//
// `selectAllPk` + an `api` endpoint is OCTable's "select the whole result set"
// mode: the server returns the full list of keys under that field and the model
// then holds scalars instead of objects.
const selectAllPkMode = computed(() => isNotEmpty(selectAllPk.value) && isNotEmpty(api.value))

/** Identity of a selection entry — the pk value for rows, the scalar itself otherwise. */
function rowKey(item) {
  if (item == null) return undefined
  if (typeof item !== 'object') return item
  return pk.value ? item[pk.value] : item
}

function sameRow(a, b) {
  if (a == null || b == null) return a === b
  return rowKey(a) === rowKey(b)
}

function isRowSelected(row) {
  if (row == null || !pk.value) return false
  return selected.value.some((item) => sameRow(item, row))
}

function toggleRow(row) {
  if (row == null) return
  selected.value = isRowSelected(row)
    ? selected.value.filter((item) => !sameRow(item, row))
    : [...selected.value, selectAllPkMode.value ? row[pk.value] : row]
}

function toggleAll() {
  if (isAllSelected.value) {
    // Deselect every currently-visible row.
    selected.value = selected.value.filter(
      (item) => !resultDataList.value.some((row) => sameRow(item, row)),
    )
  } else {
    // Append the visible rows that aren't selected yet.
    const additions = selectAllPkMode.value
      ? resultDataList.value.filter((row) => !isRowSelected(row)).map((row) => row[pk.value])
      : resultDataList.value.filter((row) => !isRowSelected(row))
    selected.value = [...selected.value, ...additions]
  }
}

function clearAll() { selected.value = []; isShowSelected.value = false }

/** OCTable's "select all this page" — only the rows currently rendered. */
function selectAllThisPage() {
  const additions = selectAllPkMode.value
    ? resultDataList.value.filter((row) => !isRowSelected(row)).map((row) => row[pk.value])
    : resultDataList.value.filter((row) => !isRowSelected(row))
  selected.value = [...selected.value, ...additions]
}

/** OCTable's "select all" — the whole filtered set (or the server key list). */
function selectAllTotal() {
  if (selectAllPkMode.value) {
    selected.value = [...(listAllSelect.value || [])]
    return
  }
  const source = isNotEmpty(api.value) ? resultDataList.value : dataSrc.value
  selected.value = [...toRaw(source)]
}

// "Selected only" view: filter the rendered rows down to the current selection
// without disturbing the paging pipeline.
const displayRows = computed(() =>
  isShowSelected.value
    ? resultDataList.value.filter((row) => isRowSelected(row))
    : resultDataList.value,
)

const isApi = computed(() => isNotEmpty(api.value))

const showSelectionBar = computed(() => {
  if (hideGroupBtnSelect.value || !selectedPk.value) return false
  if (options.value.isShowSelectedBtn === true) return true
  return selectAllPkMode.value || !isApi.value
})

function findRowIndex(rows, row) {
  return rows.findIndex(item => sameRow(item, row))
}

function onRowDragStart(event, row) {
  if (isShowSelected.value) {
    event.preventDefault()
    return
  }
  reorderState.value = { from: findRowIndex(resultDataList.value, row.original), row: row.original }
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', String(reorderState.value.from))
}

function onRowDragOver(event) {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
}

function onRowDrop(event, row) {
  event.preventDefault()
  event.stopPropagation()

  const from = reorderState.value.from
  const sourceRow = reorderState.value.row
  const toRow = row?.original
  reorderState.value = { from: null, row: null }
  if (from == null || from < 0 || !sourceRow || !toRow) return

  const rows = [...resultDataList.value]
  const to = findRowIndex(rows, toRow)
  if (to < 0 || from === to) return

  const [moved] = rows.splice(from, 1)
  rows.splice(to, 0, moved)
  resultDataList.value = rows

  if (!props.api && Array.isArray(props.data)) {
    const source = [...props.data]
    const sourceFrom = findRowIndex(source, sourceRow)
    const sourceTo = findRowIndex(source, toRow)
    if (sourceFrom >= 0 && sourceTo >= 0) {
      const [sourceMoved] = source.splice(sourceFrom, 1)
      source.splice(sourceTo, 0, sourceMoved)
      emits('update:data', source)
      emits('update:dataSrc', source)
    }
  }

  const diff = [{
    oldPosition: from + 1,
    newPosition: to + 1,
    data: moved,
    node: null,
  }]
  emits('onRowReorder', event, diff, true)
  if (typeof options.value.rowReorder?.onReorder === 'function') {
    options.value.rowReorder.onReorder(diff, rows)
  }
  fnSetDataToState()
}

// Keep UTable's internal row-selection state in sync with our `selected` model
// so each selected <tr> receives data-selected="true" (the full-row highlight).
function syncRowSelection() {
  const map = {}
  resultDataList.value.forEach((row, index) => {
    if (isRowSelected(row)) map[getRowId(row, index)] = true
  })
  rowSelection.value = map
}

//AUTO SAVE (reactive persistence)
watch(
  () => rTableStore.tables,
  (tables) => {
    if (!import.meta.client) return

    Object.entries(tables).forEach(([id, table]) => {
      rTableStore.patch(id,{
        page: table.page,
        pageSize: table.pageSize,
        })
    })
  },
  { deep: true }
)

// ─── Watchers ─────────────────────────────────────────────────────────────
watch([data, dataSrc, total, loading, page, pageSize, searching, orderBy, orderDir, columnFilters], () => {
  if (!props.storeId || !rTableStore) return
  rTableStore.patch(props.storeId, {
    data:     data.value,
    dataSrc:  dataSrc.value,
    total:    total.value,
    loading:  loading.value,
    page:     page.value,
    pageSize: pageSize.value,
    search:   searching.value,
    sort:     { column: orderBy.value, direction: orderDir.value?.toLowerCase() },
    columnFilters: columnFilters.value,
  })
})

// Selected rows → store side-effect + actionCheck + <tr> highlight sync.
// `selected` is a defineModel() ref, so the parent's v-model stays in sync
// both ways automatically; `actionCheck` is the explicit event for parents
// that prefer to listen instead of binding v-model:selected.
watch(selected, (v) => {
  const rows = (v ?? []).map((item) => toRaw(item))
  if (props.storeId && rTableStore) rTableStore.setSelected(props.storeId, rows)
  emits('actionCheck', rows.length === 1 ? rows[0] : rows)
  syncRowSelection()
})

// Recompute the <tr> highlight whenever the visible rows change (e.g. paging,
// filtering) so already-selected rows stay highlighted on the new page.
// Immediate so a parent-provided v-model:selected highlights on first render.
watch(resultDataList, syncRowSelection, { immediate: true })

// ─── Emits → parent ───────────────────────────────────────────────────────────
// `update:data` (the PascalCase request payload) and `update:dataSrc` (the raw
// response) are emitted from `getData()` like OCTable does — re-emitting the
// row array here would clash with that contract.

// Emit filter state whenever anything changes
watch(currentFilterState, v => emits ('update:filterState', v), { deep: true })

// ─── Sort Methods ──────────────────────────────────────────────────────────

function normalizeSortData(colOrKey) {
  const col = typeof colOrKey === 'string'
    ? normalizedColumns.value.find(c => c.key === colOrKey)
    : colOrKey
  if (!col?.sortData) return []

  const values = Array.isArray(col.sortData) ? col.sortData : [col.sortData]
  return values.map((item) => {
    if (item == null) return null
    if (typeof item === 'string') return { data: item, title: item }
    const data = item.data ?? item.key ?? item.value ?? item.name
    if (!data) return null
    return { ...item, data, title: item.title ?? item.label ?? data }
  }).filter(Boolean)
}

function resolveApiUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  try {
    if (typeof getUrl === 'function') return getUrl(url)
  } catch {}
  return url
}

function resolveInitialOrder() {
  const order = options.value.order
  const idx = Number(Array.isArray(order) ? order[0] : order?.idx ?? 0) || 0
  const dir = String(Array.isArray(order) ? order[1] : order?.dir ?? '').toLowerCase()
  const col = normalizedColumns.value[idx]

  if (order?.by) {
    return { by: order.by, dir: ['asc', 'desc'].includes(dir) ? dir : '' }
  }
  if (col?.orderable === false && idx === 0) return { by: '', dir: '' }

  const fields = normalizeSortData(col)
  return {
    by: fields.length ? fields[0].data : (col?.key ?? ''),
    dir: ['asc', 'desc'].includes(dir) ? dir : '',
  }
}

function renderMultiSortTrigger(col) {
  const fields = normalizeSortData(col)
  if (!fields.length) return null

  const items = fields.map((field) => {
    const active = orderBy.value === field.data
    return {
      label: field.title,
      value: field.data,
      icon: active
        ? (orderDir.value === 'asc' ? 'i-ri-arrow-drop-up-fill' : 'i-ri-arrow-drop-down-fill')
        : 'i-ri-checkbox-blank-circle-line',
      onSelect: () => onSort(col.key, field.data, true),
    }
  })

  return h('span', {
    class: 'r-table__multi-sort',
    onClick: event => event.stopPropagation(),
  }, [
    h(resolveComponent('UDropdownMenu'), {
      items,
      'aria-label': t('sort'),
      ui: { content: 'r-table__sort-dropdown' },
    }, {
      default: () => h(resolveComponent('UButton'), {
        icon: 'i-ri-filter-3-fill',
        color: 'neutral',
        variant: 'ghost',
        size: 'xs',
        onClick: event => event.stopPropagation(),
      }),
    }),
  ])
}

const onSort = (col, field = null, exact = false) => {
  const def = normalizedColumns.value.find(c => c.key === col)
  const fields = normalizeSortData(def)
  const items = fields.length ? fields.map(f => f.data) : [col]
  const pos = items.indexOf(orderBy.value)

  if (exact || field != null) {
    const target = field ?? col
    if (orderBy.value !== target) {
      orderBy.value = target
      orderDir.value = 'asc'
    } else if (orderDir.value === 'asc') {
      orderDir.value = 'desc'
    } else {
      orderBy.value = ''
      orderDir.value = ''
    }
  } else if (pos === -1) {
    orderBy.value = items[0]
    orderDir.value = 'asc'
  } else if (orderDir.value === 'asc') {
    orderDir.value = 'desc'
  } else if (orderDir.value === 'desc' && pos < items.length - 1) {
    orderBy.value = items[pos + 1]
    orderDir.value = 'asc'
  } else {
    orderBy.value = ''
    orderDir.value = ''
  }

  page.value = 1

  emits('onOrder', [orderBy.value, orderDir.value])
  emits('onSort', {
    column: orderBy.value,
    direction: orderDir.value || null,
    field,
    source: col,
  })
  if (props.api) { fnReload() }
}

const sortIcon = (col) => {
  if (orderBy.value !== col) {
    return 'ri-expand-up-down-fill'
  }

  return orderDir.value === 'asc'
    ? 'ri-arrow-drop-up-fill'
    : 'ri-arrow-drop-down-fill'
}

const openClampModal = (text) => { clampModal.text = text; clampModal.open = true }
 
// ─── Auto expand rows via className prop ─────────────────────────────
// ─── Collapsible (expand/collapse) ────────────────────────────────────────────
const expandedRows = ref(new Set())
// const isExpanded = (idx) => expandedRows.value.has(idx)
const expandKey    = (rowIdx, colKey) => `${rowIdx}:${colKey}`
const _isExpanded   = (rowIdx, colKey) => expandedRows.value.has(expandKey(rowIdx, colKey))
const _toggleExpand = (rowIdx, colKey) => {
  const k = expandKey(rowIdx, colKey)
  if (expandedRows.value.has(k)) expandedRows.value.delete(k); else expandedRows.value.add(k)
  expandedRows.value = new Set(expandedRows.value)
}

const hasClampColumn = computed(() =>
  // Check the SOURCE columns — the rendered column defs never carry `isClamp`
  // (it lives on the definition), so the old check was always false.
  normalizedColumns.value.some(col => col.isClamp || col.meta?.isClamp) || !!props.isClamp
)

const uiTbl = computed(() => {
  return {
    root: ['r-table__root relative', !hasScroll.value && 'r-table__scroll'],
    // root: 'r-table__root relative overflow-auto outline-primary/25 focus-visible:outline-3',
    base: hasClampColumn.value ? 'r-table__base table-fixed' : 'r-table__base table-auto min-w-full h-full border-collapse',
    caption: 'sr-only',
    tfoot: 'relative',
    thead: 'r-table__thead',
    tbody: 'r-table__tbody',
    tr:    'r-table__tr cursor-pointer',
    th:    'r-table__th',
    td:    'r-table__td',
    // separator: 'hidden absolute z-1 left-0 w-full h-px bg-(--ui-border-accented)',
    empty: 'py-6 text-center text-sm text-muted',
    loading: 'py-6 text-center',
  }
})

 // ─── Drag & Drop for Columns ──────────────────────────────────────────────
 // @ref https://stackoverflow.com/questions/73291308/table-header-columns-ordering-with-drag-and-drop
 const onDragStart = (key) => { dragSrcKey.value = key }

const onDrop = (targetKey) => {
  if (!dragSrcKey.value || dragSrcKey.value === targetKey) return
  const order = columnOrder.value.length
    ? [...columnOrder.value]
    : normalizedColumns.value.map(c => c.key)
    // uColumnsMap.value.map(c => c.key)
  const from = order.indexOf(dragSrcKey.value)
  const to   = order.indexOf(targetKey)
  if (from === -1 || to === -1) return
  order.splice(to, 0, order.splice(from, 1)[0])
  columnOrder.value = order
  dragSrcKey.value  = null
}
 
// ─── Core computed properties ─────────────────────────────────────────────────

// Determine which columns are expandable
/**
 * Checks if any column is expandable (has 'all' or 'min-width' type)
 */
const anyExpandable   = computed(() =>
  orderedColumns.value.some(c => { const ct = getCollapseType(c); return ct === 'all' || ct === 'min-width' })
)

// Only used for the 'min-width' collapse decision
/**
 * Minimum width needed to show every column that can appear in the main table.
 * 'all' columns are always rendered in the expanded sub-row, so they never
 * consume horizontal room and are excluded from the budget.
 */
const minWidthRequired = computed(() => {
  let totalWidth = 0

  // System columns
  if (props.selectedPk) totalWidth += CHECKBOX_COL_WIDTH
  if (anyExpandable.value) totalWidth += EXPAND_COL_WIDTH

  // Data columns that stay in the main table
  for (const col of orderedColumns.value) {
    const ct = getCollapseType(col)
    if (ct === 'all') continue
    if (ct === 'width') {
      totalWidth += Number(col.width) || DEFAULT_COL_WIDTH
    } else if (ct === 'min-width') {
      totalWidth += Number(col.minWidth ?? col.width) || MIN_COL_WIDTH
    } else {
      totalWidth += Number(col.width) || DEFAULT_COL_WIDTH
    }
  }

  return totalWidth
})

// Measured container width, falling back to the viewport width before the
// ResizeObserver has reported (e.g. first paint inside a drawer/modal).
const effectiveWidth = computed(() => containerWidth.value || screenWidth.value || 0)

/**
 * Compact mode = the container is narrower than the width needed to show every
 * non-'all' column. In compact mode 'min-width' columns collapse into the
 * expanded sub-row; the user opens a row with the expand button to see them.
 */
const isCompact = computed(() =>
  effectiveWidth.value > 0 && effectiveWidth.value < minWidthRequired.value
)

// When the layout switches between compact and full (i.e. `min-width` columns
// move in/out of the expanded sub-row) clear any open rows so a stale or
// half-collapsed state is never shown. Rows stay CLOSED until the user clicks
// the expand button — nothing auto-opens.
watch(isCompact, () => {
  if (Object.keys(expandedRowState.value).length) expandedRowState.value = {}
})

// Track container width so column collapse logic (isCompact) reacts to the
// actual table element's size — works correctly inside drawers/modals too,
// unlike window.innerWidth. Re-observes if the wrapper is swapped out (e.g.
// when switching between card and table layouts).
const resizeObserver = ref(null)

function observeContainer() {
  const el = tableContainerRef.value
  if (!el) return

  containerWidth.value = el.offsetWidth || el.clientWidth || containerWidth.value

  resizeObserver.value?.disconnect()
  resizeObserver.value = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const w = entry.contentRect?.width ?? entry.target?.offsetWidth ?? 0
      if (w) containerWidth.value = w
    }
  })
  resizeObserver.value.observe(el)
}

/**
 * OCTable exposes `responsive()` (DataTables' recalc for fixed columns). RTable
 * renders with `UTable`, so this only re-measures the container — which is what
 * drives the compact-column layout — after a data/viewport change.
 */
function responsive() {
  observeContainer()
  nextTick(() => observeContainer())
}

onMounted(() => {
  nextTick(observeContainer)
})

// The wrapper is behind `v-else`, so it only exists once loading finished and
// the table (rather than the card/template branch) is the active layout.
watch([isMobile, showTemplate, loading], () => nextTick(observeContainer))

// ─── Fit table to the available viewport ──────────────────────────────────────
// Measures against the nearest scroll region (the layout's .r-app-layout__scroll,
// which sits BELOW the navbar and the global <RBreadCrumb class="py-2 px-2" />).
// Measuring that box — instead of the raw window — means the available height
// already accounts for the breadcrumb without hard-coding its size.
//
//   available = scrollRegion.bottom − table.top        (hasScroll: false)
//   available = scrollRegion.clientHeight              (hasScroll: true)
//   bodyHeight = available
//              − RTableHeader/toolbar
//              − <thead>
//              − RPagination footer
//              − selection bar + root padding
//   rowHeight  = clamp(bodyHeight / pageSize, MIN_ROW_HEIGHT, maxRowHeight)
//
// Row height is capped at the laptop value so large desktop screens do not
// stretch the rows.
//
// hasScroll:
//   false (default) → the table fills the remaining space and the PAGE does not
//                     scroll; the RPagination footer stays pinned to bottom-0.
//   true            → the table sizes to its content so the PAGE can scroll —
//                     used by pages that stack two RTableDev instances.
//
// The values are exposed to CSS as `--rtbl-height`, `--rtbl-body-height` and
// `--rtbl-row-height` on the `.r-table` root.
const _MIN_ROW_HEIGHT = 44
const _MAX_ROW_HEIGHT = Number(options.value?.maxRowHeight) || 56
function _getScrollParent(el) {
  if (!el) return null
  const layoutScroll = el.closest('.r-app-layout__scroll')
  if (layoutScroll) return layoutScroll
  let p = el.parentElement
  while (p && p !== document.body) {
    const oy = getComputedStyle(p).overflowY
    if (oy === 'auto' || oy === 'scroll') return p
    p = p.parentElement
  }
  return null
}

function syncHeights() {
  rafId.value = null
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  const root = refWrapper.value
  if (!root || props.showTemplate || isMobile.value) {
    tableHeight.value = 0
    bodyHeight.value = 0
    rowHeight.value = 0
    return
  }

  const rootRect = root.getBoundingClientRect()
  const scrollParent = _getScrollParent(root)
  let available = 0

  if (hasScroll.value) {
    available = scrollParent?.clientHeight || root.parentElement?.clientHeight || rootRect.height
  } else if (scrollParent) {
    available = scrollParent.getBoundingClientRect().bottom - rootRect.top
  } else {
    available = window.innerHeight - rootRect.top
  }

  const tableH = Math.max(0, Math.floor(available || 0))
  const toolbarH = toolbarRef.value?.offsetHeight || 0
  const footerH = footerRef.value?.offsetHeight || 0
  const selectionH = root.querySelector('.r-table__select-bar')?.offsetHeight || 0
  const headerH = refTable.value?.$el?.querySelector('thead')?.offsetHeight || 0
  const bodyH = Math.max(0, tableH - toolbarH - footerH - selectionH - headerH - 8)
  const rows = Math.max(1, Number(pageSize.value) || 10)
  const nextRowHeight = Math.min(_MAX_ROW_HEIGHT, Math.max(_MIN_ROW_HEIGHT, Math.floor(bodyH / rows)))

  if (Math.abs((tableHeight.value || 0) - tableH) > 1) tableHeight.value = tableH
  if (Math.abs((bodyHeight.value || 0) - bodyH) > 1) bodyHeight.value = bodyH
  if (Math.abs((rowHeight.value || 0) - nextRowHeight) > 1) rowHeight.value = nextRowHeight
}

function scheduleSync() {
  if (typeof window === 'undefined') return
  if (rafId.value) cancelAnimationFrame(rafId.value)
  rafId.value = requestAnimationFrame(syncHeights)
}

// Observe the three regions that define the available body height so the
// row height stays correct when the header/footer wrap or resize.
const layoutObserver = ref(null)

function observeLayout() {
  layoutObserver.value?.disconnect()
  if (typeof ResizeObserver === 'undefined') return
  layoutObserver.value = new ResizeObserver(() => scheduleSync())
  for (const el of [toolbarRef.value, footerRef.value, tableContainerRef.value]) {
    if (el) layoutObserver.value.observe(el)
  }
}

onMounted(() => {
  nextTick(() => {
    observeLayout()
  })
  window.addEventListener('resize', scheduleSync)
})

// Re-measure whenever the geometry inputs change: page size, number of rows,
// loading (thead → tbody swap), the responsive layout branch and hasScroll
// (which switches between fill-viewport and content-height sizing).
watch(
  [pageSize, () => resultDataList.value.length, loading, isMobile, showTemplate, hasScroll],
  () => nextTick(() => {
    observeLayout()
    scheduleSync()
  }),
)

onUnmounted(() => {
  resizeObserver.value?.disconnect()
  layoutObserver.value?.disconnect()
  window.removeEventListener('resize', scheduleSync)
  if (rafId.value) cancelAnimationFrame(rafId.value)
})


</script>

<style lang="scss">
// Global scrollbar CSS variables — kept in an UNscoped block on purpose:
// a `scoped` block can never match the real <html> element, so :root rules
// placed inside a scoped style tag silently do nothing.
:root {
  --scrollbar-bg: transparent;
  --scrollbar-thumb-bg: rgba(128, 128, 128, 0.4);
  --scrollbar-thumb-hover-bg: rgba(128, 128, 128, 0.6);
  --scrollbar-thumb-border: transparent;
}

// NOTE: intentionally NOT `scoped`. Most of this table's cell/header content
// (.r-table__cell-wrap, .r-table__expand-btn, .r-table-checkbox-cell, and the
// selection highlight itself) is created via h() inside TanStack column
// cell()/header() render functions. Those vnodes are produced during UTable's
// own render pass, not this component's compiled <template>, so Vue's scoped
// data-v-xxxx attribute never reaches them — `scoped` would silently break
// cell styling. Leakage risk is instead controlled by the unique `r-table__*`
// / `r-table-*` class prefix used throughout.
// ─────────────────────────────────────────────────────────────────────────────
// RTable1 SCSS – NuxtUI4 / Sass
// Fixed header + fixed footer pagination, body scrolls only
// ─────────────────────────────────────────────────────────────────────────────
// ─── Mixins ──────────────────────────────────────────────────────────────────
// ── Mixins (no $var mixins — only responsive + align) ───────────────────────
@mixin respond-to($bp) {
  @if $bp == mobile  { @media (max-width: 767px)                        { @content; } }
  @if $bp == tablet  { @media (min-width: 768px) and (max-width: 1023px) { @content; } }
  @if $bp == desktop { @media (min-width: 1024px)                       { @content; } }
}
@mixin flex-center  { display: flex; align-items: center; justify-content: center; }
@mixin flex-gap($g: 0.5rem) { display: flex; align-items: center; gap: $g; }
@mixin flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
@mixin ellipsis {
  // overflow: hidden; cuase 
  // text-overflow: ellipsis;
  white-space: nowrap;
  // min-width: 0;
}

// ─── Root ────────────────────────────────────────────────────────────────────
// Must have a bounded height from the parent for fixed header/footer to work.
// Common patterns: height: 100vh, height: 100%, or a fixed px value.
// Work with scoped
// ── Root wrapper ─────────────────────────────────────────────────────────────
.r-table__root{
  overflow-x: hidden !important;
  width: 100%;
  // overflow: scroll;
  border-top: none !important;
}

.r-table{
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  min-height: 0;
  background: var(--c-surface, #fff);
  border-radius: var(--ui-radius-lg, 0.5rem);
  overflow: hidden;
  font-family: var(--font-400) !important;
  height: var(--rtbl-height, calc(100vh - 58px - 36px));
  padding: 0 !important;
  // border:5px solid red;

  // hasBorder → single border drawn around the whole table
  &__bordered {
    border: 1px solid var(--c-border, #e5e7eb);
    border-radius: var(--ui-radius-lg, 0.5rem);
  }

  ::selection {
      background: var(--color-primary);
      color: #ffffff;
  }

  &__base { // work here , do at this section only with scoped for UTable style
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
  }

  &__thead {
    position: sticky;
    top: 0;
    z-index: 10;
    // tr {
    //   padding: 5px 0;
    // }
    th {
      // padding: 10px 2px;
      background: var(--c-surface, #fff);
      border-bottom: 0.5px solid var(--c-border, #e5e7eb);
      position: sticky;
      top: 0;
      z-index: 11;
      padding: 0;
      font-size: 0.75rem;
      font-family: var(--font-400) !important;
      font-weight: bold !important;
      // text-transform: capitalize !important;
      letter-spacing: 0.04em;
      color: var(--ui-text-muted);
      white-space: nowrap;
      // background: inherit;
      // background: var(--c-bg);
    }
  }

  &__tbody { //work
    flex: 1 1 auto;
    overflow: auto;
    min-height: var(--rtbl-body-height, 100%);
    tr[data-expanded="true"] {
      background: var(--ui-bg-elevated);
    }
    // Full-row highlight for selected rows. UTable sets data-selected from the
    // rowSelection model, which we keep in sync from `selected` (syncRowSelection).
    tr[data-selected="true"] {
      background: color-mix(in srgb, var(--ui-primary) 12%, transparent) !important;
      > td { background: transparent !important; }
    }
    tr {
      transition: background 0.1s ease;
      // &:hover { background: var(--c-hover-bg) !important; }
      // &:hover { background: color-mix(in srgb, var(--ui-bg-elevated) 70%, transparen t); }
    }
    td { // cell
      padding: 0 !important;
      // vertical-align: middle;
      font-size: 0.875rem;
      color: var(--c-text);
      vertical-align: middle;
      // border-bottom: 1px solid var(--ui-border-muted, var(--c-border)); // Can have border-bottom here
    }
    td.r-table-col-expand,
    td.r-table-col-checkbox {
      white-space: nowrap;
      padding-left: 0 !important;
      padding-right: 0 !important;
    }

    .r-table__cell-wrap {
      // min-height: 70px;
      display: flex;
      align-items: center;
      padding: 7px 8px;
      box-sizing: border-box;
    }
  }

  &__tr {
    // transition: background 0.15s ease;
    border-top: 12px solid var(--ui-border-muted, var(--c-border)); // new
    font-family: var(--font-400) !important;
    color: var(--c-text) !important;
    height: var(--rtbl-row-height, auto);
    &:hover {
      background: var(--c-hover-bg) !important;
      // background: var(--text-color-muted);
    }
    &[data-state="selected"] {
      background: color-mix(in srgb, var(--ui-primary) 8%, transparent) !important;
    }
    &[data-select="false"]{ 
      background: var(--ui-bg);
    }
  }

  &__td {
    max-width: 280px;
  }

  &__cell {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__empty{
    @include flex-center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 3rem 1rem;
    color: var(--ui-text-muted);
    font-size: 0.875rem;
    // min-height: calc(100vh - 500px) !important;
    // min-height: calc(100vh - 253px);

    &-icon {
      font-size: 30px !important;
    }

    &-title {
      font-size: 1rem;
      font-weight: 600;
      margin: 0;
    }

    &-description {
      margin: 0;
      opacity: 0.7;
    }

    :deep(.u-icon), i { font-size: 1.5rem; }
  }

  &__scroll {
    overflow-y: scroll !important;
    // overflow-y: v-bind('hasScroll === true ? `auto` : `hidden`') !important;
    overflow-x: hidden !important;
    
    // Firefox scrollbar
    scrollbar-width: thin;
    scrollbar-color: var(--scrollbar-thumb-bg, #888) var(--scrollbar-bg, transparent);

    &::-webkit-scrollbar {
      height: 0; // Hide horizontal scrollbar
    }

    &::-webkit-scrollbar:vertical {
      width: 6px; // Keep vertical scrollbar if desired
    }

    scrollbar-width: thin;
    scrollbar-color: var(--c-border,white) transparent;
    
    //    // Custom scrollbar for the body area
    &::-webkit-scrollbar       { width: 4px;  height: 40px;}
    &::-webkit-scrollbar-thumb { background: var(--c-border); border-radius: 2px; }
    &::-webkit-scrollbar-track { background: transparent; }
  }

  .r-table__toolbar {
    flex: 0 0 auto;
    position: sticky;
    top: 0;
    z-index: 20;
    background: var(--c-surface, #fff);
  }

  .r-table__content {
    flex: 1 1 auto;
    min-height: 0;
    max-height: 100%;
    overflow-y: auto;
    overflow-x: auto;
    position: relative;
  }
  
  // Header stays sticky at top
  .r-table__header-wrapper {
    flex: 0 0 95px; // toolbar + column header
    position: sticky;
    top: 0;
    z-index: 20;
    background: var(--c-surface, #fff);
  }

  // Footer stays sticky at bottom
  .r-table-footer-pagination {
    flex: 0 0 auto;
    position: sticky;
    bottom: 0;
    z-index: 20;
    background: var(--ui-bg);
    // border-top: 1px solid var(--ui-border);

    // position: sticky;
    // bottom: 0;
    // z-index: 20;
    // background: var(--c-surface, #fff);
    // border-top: 1px solid var(--c-border, #e5e7eb);
  }

  // ─── Default Mode: Body scrolls, header and footer fixed ──────────────────
  &:not(&__scroll) {
    .r-table__header-wrapper {
      flex-shrink: 0;
    }

    .r-table-footer-pagination {
      flex-shrink: 0;
    }

    // .r-table__scroll-wrap {
    //   flex: 1 1 auto;
    //   overflow-y: auto;
    //   overflow-x: hidden;
    // }
  }
}

.r-table__cell-fixed { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.r-table__cell-fixed-min-width {
  min-width: 180px;
  width: 100%;
}

.r-table__cell-fixed-min-width-text {
  overflow: hidden;
  text-overflow: ellipsis;  
  white-space: nowrap;
}

.r-table__cell-fixed-min-width--open {
  .r-table__cell-fixed-min-width-text {
    white-space: normal;
    overflow: visible;
    text-overflow: unset;
  }
}

// ── Template / showTemplate wrap ─────────────────────────────────────────────
.r-table__template-wrap {
  flex: 1 1 0;
  overflow-y: auto;
  min-height: 0;
  position: relative;
}

.r-table__template-scroll {
  padding: 0.75rem 1rem;
}

// ── Clamp modal text ─────────────────────────────────────────────────────────
.r-table__modal-text {
  font-size: 0.9375rem;
  line-height: 1.7;
  color: var(--c-text);
  white-space: pre-wrap;
  word-break: break-word;
}


// ─── Active filter chips ──────────────────────────────────────────────────────
.r-table__filter-chips {
  @include flex-gap(0.375rem);
  flex-wrap: wrap;
  padding: 0.375rem 0.75rem;
  background: color-mix(in srgb, var(--color-primary) 5%, var(--c-bg));
  border-bottom: 1px solid var(--c-border);
  flex-shrink: 0;
}

.r-table__filter-chip {
  @include flex-gap(0.25rem);
  font-size: 0.75rem;
  padding-right: 0.25rem;
}

// ─── Multi-select action bar ────────────────────────────────────────────────
.r-table__select-bar {
  @include flex-gap(0.375rem);
  flex-wrap: wrap;
  padding: 0.5rem 0;
  flex-shrink: 0;
}

.r-table__select-btn {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 24px;
  padding: 0 10px 0 8px;
  background: var(--c-surface, var(--bg-content, #fff));
  font-size: 12px;
  line-height: 12px;
  border-radius: 7px;
  cursor: pointer;
  user-select: none;
  color: var(--c-text);
  transition: 0.2s ease-in-out;

  &:hover {
    background: var(--c-hover-bg, #f1f1f1);
  }

  &.is-active {
    background: var(--color-primary, var(--ui-primary));
    color: #fff;
  }
}

.r-table__th-inner--right {
  justify-content: flex-end;
}

.r-table__cell-text--right {
  width: 100%;
  text-align: right;
}

.r-table-reorder-cell {
  @include flex-center;
}

.r-table__reorder-btn {
  @include flex-center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  color: var(--ui-text-muted);
  cursor: grab;

  &:hover {
    background: var(--c-hover-bg, #f1f1f1);
    color: var(--c-text);
  }

  &:active {
    cursor: grabbing;
  }
}

.r-table__multi-sort {
  @include flex-center;
  margin-left: 2px;
}

.r-table__sort-dropdown {
  z-index: 1000 !important;
}

// ─── totalDetail row (OCTable `totalDetail` slot) ───────────────────────────
.r-table__total-detail {
  flex: 0 0 auto;
  padding: 0.5rem 0;
  border-top: 1px solid var(--c-border, #e5e7eb);
  font-size: 0.8125rem;
  color: var(--c-text);
}

// ─── showTemplate wrap ────────────────────────────────────────────────────────
.r-table__template-wrap {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  position: relative;
}

.r-table__template-scroll { padding: 0.75rem; }

//============================= Formal Work direct to cell style =============================================
.r-table__filter-dot {
  width: 0.75rem;
  height: 0.75rem;
  color: var(--ui-primary);
  flex-shrink: 0;
}

// ─── Cell variants (new) ────────────────────────────────────────────────────────────
.r-table__cell-slot { display: contents;font-family: var(--font-400) !important; font-weight: 900 !important; }
.r-table__cell-text { 
  overflow: hidden; 
  // text-overflow: ellipsis; 
  white-space: nowrap; 
  display: block; 
  font-family: var(--font-400) !important;
  font-weight: bold !important;
}


.main-r-tbl-wrapper { //correct that help to sticky header
  width: 100%;
  height: 100%;
  // padding: 6px 0 !important;
  // overflow: auto;
  // flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
  gap: 0 !important;
  // height: calc(100vh - 300px) !important;
  // justify-content: space-between !important;
  // padding-bottom: 0;
  overflow: auto;
  flex: 1;
}

// ─── UTable ───────────────────────────────────────────────────────────────────
.r-table__utable {
  width: 100%;
  // overflow-x: auto;
  // height: 100%;
  table-layout: auto;
  // table-layout:fixed; // so columns respect width/minWidth and collapse
  // min-height: calc(100vh - 780px) !important;
  // max-height: 100vh !important;
  overflow-x: hidden !important;           // clips border-radius; footer/header sticky inside
  // padding-right: 5px;

  // table-layout: auto;

   /* Firefox */
  scrollbar-width: none;

  /* IE/Edge Legacy */
  -ms-overflow-style: none;

  /* Chrome, Safari, Edge */
  &::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }
}

// ─── Column Classes ──────────────────────────────────────────────────────────

/// ========================= Special class for RTable columns ================================
/* System columns are sized to fit their control. Widths mirror the
   EXPAND_COL_WIDTH / CHECKBOX_COL_WIDTH constants declared in the setup block
   and are also applied inline via the column meta so th and td always agree. */
.r-table-col-expand,
.r-table-col-checkbox {
  box-sizing: border-box;
  padding: 0 !important;
  text-align: center;
}

.r-table-col-expand {
  width: 40px;
  min-width: 40px;
  max-width: 40px;
}

.r-table-col-checkbox {
  width: 44px !important;
  min-width: 44px !important;
  max-width: 44px !important;
}

.r-table__expand-placeholder{
  display: inline-block;
  width: 24px;
  height: 24px;
}
.r-table-expand-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-family: var(--font-400) !important;
  margin-right: 0 !important;
  width: 100% !important;
  height: 100% !important;
  min-height: 40px;
}

.r-table-checkbox-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100% !important;
  height: 100% !important;
  min-height: 40px;
}

// ─── Sort / drag header internals ────────────────────────────────────────────
// Rendered by h() inside columnsRender — they ARE in the light DOM, scoped styles work
// ─── Header internals ────────────────────────────────────────────────────────
.r-table__th-inner {
  @include flex-gap(0.25rem);
  user-select: none;
  white-space: nowrap;
  align-items: flex-start;
  padding: 10px 2px 10px 7px !important;
  flex-direction: row;
  justify-content: start;
  width: 100%;
  font-family: var(--font-400) !important;
  font-weight: 900 !important;

  &--sortable {
    cursor: pointer;
    // Push the label and the sort icon to opposite ends of the header cell
    justify-content: space-between;
    &:hover, :focus-visible { color: var(--ui-primary) !important; }
    // &:focus-visible { outline: 2px solid var(--ui-primary); outline-offset: 2px; border-radius: 2px; }
  }

  // Label grows to fill the space so the sort icon sticks to the right edge
  .r-table__th-label {
    flex: 1 1 auto;
    min-width: 0;
  }

  &--dragging { opacity: 0.4; cursor: grabbing; }

  // Drag handle hint on non-mobile
  @include respond-to(desktop) {
    cursor: grab;
    &--sortable { cursor: pointer; }
  }
}

.r-table__sort-icon {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
  opacity: 0.3;
  transition: opacity 0.15s, color 0.15s;

  &--active { opacity: 1; color: var(--color-blue-500); }
}

.r-table__filter-icon {
  color: var(--ui-primary);
  flex-shrink: 0;
}

// ─── Cell styles ─────────────────────────────────────────────────────────────
.r-table__cell-wrap{
  min-height: var(--rtbl-row-height, 55px) !important;
  height: var(--rtbl-row-height, auto);
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  padding: 5px 10px 5px 5px !important;
  width: 100%;
  box-sizing: border-box;
  color: var(--c-text) !important;
  font-weight: bold !important;
}

/* Selected row — kept as a safety net in case UTable ever reads a
   row-level class/state (data-selected / data-state), but this is not
   guaranteed to be set by TanStack for an arbitrary column.meta value. */
.r-table__row--selected,
tr[data-selected="true"],
tr[data-state="selected"] {
  background: color-mix(in srgb, var(--ui-primary) 12%, transparent) !important;

  // > td {
  //   background: inherit !important;
  // }
}

/* Kept as a hook, but transparent: the highlight is now painted on the whole
   <tr> via tr[data-selected="true"] (see &__tbody above) so every cell —
   including the checkbox/expand system columns — shares one continuous tint.
   `selected` is still computed per-cell via isRowSelected(original) in
   columnsRender → cell(), so the class stays in sync with the `selected` model. */
.r-table__cell-wrap--selected {
  background: transparent !important;
}

// ─── Expand button ───────────────────────────────────────────────────────────
.r-table__expand-btn {
  @include flex-center;
  // display: flex;
  // align-items: center;
  // justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--ui-text-muted);
  cursor: pointer;
  transition: color 0.12s, background 0.12s;

  &:hover {
    color: var(--ui-primary);
    background: color-mix(in srgb, var(--ui-primary) 10%, transparent);
  }

  &--open {
    color: var(--ui-primary);
  }
}

// Placeholder when no rows are expanded (stable column width)
.r-table-expand-placeholder {
  display: inline-block;
  width: 24px;
  height: 24px;
}

// Expand
// ─── Expanded row ────────────────────────────────────────────────────────────
.r-table__expanded{
  position: relative;
  background-color: var(--c-surface) !important;
  border-bottom: 1px solid var(--c-border) !important;
  padding: 12px 16px;
  // background: color-mix(in srgb, var(--ui-primary) 3%, transparent);
  font-family: var(--font-400) !important;

  &-bar{
    position: absolute;
    top: 0;
    left: 0;
    // width: 10px;
    width: 4px;
    height: 100%;
    border-radius: 0 2px 2px 0;
    // background-color: var(--c-border);
    background: var(--ui-primary);
    // border-bottom: 1px solid var(--c-border);
  }

  &-content{
    display: flex;
    flex-direction: row;
    // padding-left: 5px !important;
    padding: 4px 0;
     gap: 8px;
     border-bottom: 1px solid var(--ui-border-muted);
     &:last-child {
      border-bottom: none;
    }
    &:hover{
      background-color: var(--color-secondary);
    }
  }

  &-label {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 100px !important;
    text-align: left;
    font-weight: 600;
    min-width: fit-content !important;

    .dot{
      padding-right: 5px;
      &::after{
        content: ":";
        padding-right: 5px;
      }
    }
  }

  &-value {
    width: 100%;
    text-align: left;
    font-weight: 600;
    flex: 1;
    min-width: 0;
    font-weight: 500;
    word-break: break-word;
    // min-width: fit-content !important;
    font-family: var(--font-400) !important;
  }
}

// ── Selection action bar ─────────────────────────────────────────────────────
.r-table__select-bar {
  @include flex-gap(0.375rem);
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-wrap: wrap;
  padding: 0.5rem 1rem;
  background: var(--ui-bg-elevated);
  border-bottom: 1px solid var(--ui-border);
  flex-shrink: 0;
}

// ─── Loader ──────────────────────────────────────────────────────────────────
.r-table__loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  gap: 10px;
  color: var(--ui-text-muted);
}

.r-table__loader-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}


.r-table__spinner {
  width: 56px;
  height: 56px;
  color: var(--ui-primary);
  animation: rtable-spin 1s linear infinite;
}

.r-table__loader-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--ui-text-secondary);
}

@keyframes rtable-spin { to { transform: rotate(360deg); } }

// ─── Empty state ─────────────────────────────────────────────────────────────
// 100vh = 1118px
// 100vh - 900px = 218px

.r-table__empty {
  // @include flex-center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  color: var(--ui-text-muted);
  font-size: 0.875rem;
  // min-height: calc(100vh - 900px) !important;
  min-height: 100%;
  height: 100%;

  &-icon {
    font-size: 30px !important;
  }

  &-title {
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
  }

  &-description {
    margin: 0;
    opacity: 0.7;
  }

  :deep(.u-icon), i { font-size: 1.5rem; }
}

// ============== Pagination side===================
// ─── Footer / Pagination ─────────────────────────────────────────────────────
// .r-table-footer-pagination {
//   flex-shrink: 0;
//   position: sticky;
//   bottom: 0;
//   z-index: 20;
//   background: var(--c-surface);
//   // border-top: 1px solid var(--c-border);
//   left: 0;
//   right: 0;
//   bottom: 0;
// }

// ── Utility: screen reader only ───────────────────────────────────────────────
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
</style>