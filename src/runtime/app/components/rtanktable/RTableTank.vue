<template>
  <div class="rt-wrapper" ref="refWrap">
    <slot name="headerTable" v-if="$slots.headerTable" />

    <OCTableHeader :options="o" v-model:selected="record" v-model:searching="searching"
      @search-table="searchTable(searching)" @clear-search="clearSearch" @reload="fnReload">
      <template v-for="s in HEADER_SLOTS?.filter((k) => $slots[k])" :key="s" #[s]>
        <slot :name="s" />
      </template>
    </OCTableHeader>

    <slot name="middleTable" v-if="$slots.middleTable" />

    <!-- card template -->
    <div class="rt-card" ref="refCard" v-if="showTemplate">
      <slot name="loading" v-if="$slots.loading && loading" />
      <div class="rt-loader flex justify-center items-center" v-if="!$slots.loading && loading">
        <OCLoading :loading="true" />
      </div>
      <div class="rt-card-scroll" v-if="!$slots.loading || !loading">
        <slot name="template" v-bind="[dataTemplate]" />
      </div>
      <div class="flex justify-center items-center absolute top-0 w-full h-full"
        v-if="!dataTemplate?.length && !loading && opts.showNoData">
        <div class="flex items-center color-w-b-2 font-normal gap-1 text-[14px]" v-if="!query">
          <i class="ri-database-2-fill"></i><span>{{ $t("data_not_found") }}</span>
        </div>
        <div class="flex items-center color-w-b-2 font-normal gap-1 text-[14px]" v-else>
          <i class="ri-search-2-line"></i><span>{{ $t("no_results_for") }} " {{ query }} "</span>
        </div>
      </div>
    </div>

    <!-- selection buttons -->
    <div class="flex flex-wrap gap-1.5 pt-2.5 sticky" v-if="hasBtns">
      <div class="rt-btn" :class="{ active: isShowSelected }" @click="isShowSelected = !isShowSelected">
        <i class="ri-function-fill"></i><span>{{ $t("selected") }}: {{ sel?.length }}</span>
      </div>
      <div class="rt-btn" v-if="api" @click="pageSelect(true)">
        <i class="ri-checkbox-circle-fill"></i><span>{{ $t("select_all_this_page") }}</span>
      </div>
      <div class="rt-btn" @click="listAll">
        <i class="ri-checkbox-circle-fill"></i><span>{{ $t("select_all") }}: {{ total }}</span>
      </div>
      <div class="rt-btn" @click="select = []">
        <i class="ri-close-circle-fill"></i><span>{{ $t("clear_all") }}</span>
      </div>
    </div>

    <!-- table -->
    <div class="rt-container" ref="refContainer" v-show="!showTemplate"
      :class="{ 'have-border': haveBorder, 'is-not-check': !hasCheck, 'no-scroll-table': !o?.isScroll }">
      <div class="rt-scroll" ref="refScroll">
        <table class="rt-table" :class="{ collapsed: collapsed?.length, measuring }">
          <thead>
            <tr>
              <th v-for="(h, i) in heads" :key="h.id" :data-col="h.id" :class="thCls(h)" :style="pin(i)"
                :aria-sort="ARIA[h.column.getIsSorted()]"
                @click="h.column?.getCanSort() && h.column.toggleSorting()">
                <input v-if="h.id === SEL" type="checkbox" class="oc-checkbox tbl-checkbox" :checked="nSel > 0"
                  :class="{ minus: nSel > 0 && nSel < rows?.length }" @click.stop @change="pageSelect(nSel === 0)" />
                <template v-else>
                  <span v-html="mt(h.column).title" />
                  <span v-if="h.column?.getCanSort()" class="rt-order" :class="h.column.getIsSorted()">
                    <i class="ri-arrow-up-s-fill"></i><i class="ri-arrow-down-s-fill"></i>
                  </span>
                  <RTooltip v-if="mt(h.column).sortData" class="inline-flex align-middle ml-1.5" :text="t('sort')">
                    <span class="multi-sort-wrapper" @click.stop="msOpen = msOpen === h.id ? null : h.id">
                      <i class="ri-filter-3-fill"></i>
                    </span>
                  </RTooltip>
                  <div v-if="msOpen === h.id" class="popover-multi-sort-contain" @click.stop>
                    <div v-for="e in mt(h.column).sortData" :key="e.data" class="sort-detail"
                      :class="sortCls(e.data)" @click="sortBy(e.data)">
                      <div class="title">{{ e.title }}</div><span class="icon-order"></span>
                    </div>
                  </div>
                </template>
              </th>
            </tr>
          </thead>

          <tbody>
            <template v-for="row in rows" :key="row.id">
              <tr :class="{ selected: row.getIsSelected(), 'dtr-expanded': row.getIsExpanded() }">
                <td v-for="(cell, ci) in row.getVisibleCells()" :key="cell.id" :style="pin(ci)"
                  :class="[mt(cell.column).className, { 'dtr-control': ci === 0 && collapsed?.length }]">
                  <RTooltip v-if="ci === 0 && collapsed?.length" class="inline-flex align-middle mr-1.5"
                    :text="row.getIsExpanded() ? t('collapse') : t('expand')">
                    <button type="button" class="rt-expand" :aria-expanded="row.getIsExpanded()"
                      @click="row.toggleExpanded()">
                      <i :class="row.getIsExpanded() ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'"></i>
                    </button>
                  </RTooltip>

                  <template v-if="cell.column.id === SEL">
                    <slot name="checkbox" v-bind="sp(cell, row)" />
                    <input type="checkbox" class="oc-checkbox" :checked="row.getIsSelected()"
                      @change="onRowCheck(row, $event.target.checked)" />
                  </template>
                <!-- drag handle -->
                  <RTooltip v-else-if="colMeta(cell.column)?.kind === 'drag'" :text="t('reorder_row')">
                    <span class="oc-drag-handle" :class="{ disabled: !canReorderNow }" :draggable="canReorderNow" role="button" :aria-label="t('reorder_row')"
                      @dragstart="onDragStart(row, $event)"
                      @dragend="dragFrom = null"
                    >
                      <i class="ri-draggable" aria-hidden="true"></i>
                    </span>
                  </RTooltip>
                  
                  <slot v-else-if="cell.column.id === ACT" name="actions" v-bind="sp(cell, row)" />
                  <slot v-else-if="cell.column.id === CTL" name="tdNull" v-bind="sp(cell, row)" />
                  <div v-else-if="mt(cell.column).isLineClamp && isNotEmpty(cell.getValue())"
                    class="rt-clamp line-clamp-2" @mouseenter="hoverClamp" @click="openDetail($event, cell.getValue())">
                    {{ cell.getValue() }}
                  </div>
                  <slot v-else-if="mt(cell.column).slot" :name="mt(cell.column).slot" v-bind="sp(cell, row)" />
                  <span v-else-if="mt(cell.column).fn" v-html="html(cell, row)" />
                <!-- legacy render(): returns HTML, caller must escape user input -->
                  <!-- eslint-disable-next-line vue/no-v-html -->
                  <span v-else-if="colMeta(cell.column)?.renderHtml" v-html="renderHtml(cell, row, ci)"></span>
                  <template v-else>{{ cell.getValue() ?? "" }}</template>
                </td>
              </tr>

              <!-- collapsed columns (DataTables Responsive child row) -->
              <tr v-if="collapsed?.length && row.getIsExpanded()" class="child">
                <td class="child" :colspan="heads?.length">
                  <ul class="dtr-details">
                    <template v-for="cell in row.getAllCells()" :key="cell.id">
                      <li v-if="collapsed.includes(cell.column.id)">
                        <span class="dtr-title" v-html="mt(cell.column).title" />
                        <span class="dtr-data">
                          <div v-if="mt(cell.column).isLineClamp && isNotEmpty(cell.getValue())"
                            class="rt-clamp line-clamp-2" @mouseenter="hoverClamp"
                            @click="openDetail($event, cell.getValue())">{{ cell.getValue() }}</div>
                          <slot v-else-if="mt(cell.column).slot" :name="mt(cell.column).slot" v-bind="sp(cell, row)" />
                          <span v-else-if="mt(cell.column).fn" v-html="html(cell, row)" />
                          <template v-else>{{ cell.getValue() ?? "" }}</template>
                        </span>
                      </li>
                    </template>
                  </ul>
                </td>
              </tr>
            </template>

            <tr v-if="!rows?.length" class="rt-empty">
              <td :colspan="heads?.length || 1">{{ emptyText }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="rt-loader" v-if="loading" />
      <div class="transition-all absolute top-[1px] left-0 z-10 w-full px-1" v-if="loading">
        <UProgress size="xs" animation="carousel" />
      </div>

      <div ref="refTotal" class="oc-tbl-total-detail" v-if="$slots.totalDetail">
        <slot name="totalDetail" :total="total" />
      </div>
    </div>

    <div ref="refAfter1" v-if="$slots.ShowDetailAfterTableOne"><slot name="ShowDetailAfterTableOne" /></div>
    <div ref="refAfter2" v-if="$slots.ShowDetailAfterTableTwo"><slot name="ShowDetailAfterTableTwo" /></div>

    <OCTableFooter class="rt-footer" :class="{ 'rt-sticky': !o?.isScroll }" :options="o" v-if="!isTotalDetail"
      :page-count="record" :total="total" v-model:page="page" @change-pagination="changePagination"
      v-model:selected="record" @select-records="fnSelectRecord(record)" :loading="loading" />

    <RModal v-model="isLineClamp">
      <div class="detail-container">
        <div class="btn-close-detail" @click="isLineClamp = false"><i class="ri-close-large-fill"></i></div>
        <div>{{ dataDetail }}</div>
      </div>
    </RModal>
  </div>
</template>

<script setup>
import { createAtom } from "@tanstack/vue-store";

import { useTable,  tableFeatures,  sortFns, filterFns,
  rowSortingFeature, rowPaginationFeature, rowSelectionFeature, rowExpandingFeature,  globalFilteringFeature, columnFilteringFeature, columnVisibilityFeature,
  createSortedRowModel,
  createFilteredRowModel,
  createPaginatedRowModel,
} from "@tanstack/vue-table";
import { debounce, get, isEqual, sum } from "lodash-es";

const SEL = "_sel", CTL = "_ctl", ACT = "_act";
const CTL_W = 36; // width the expand control adds once columns collapse
const BP = [["mobile-p", 320], ["mobile-l", 480], ["tablet-p", 768], ["tablet-l", 1024], ["desktop", Infinity]];
const HEADER_SLOTS = ["headerLeft", "headerCenter", "headerApplyFilter", "headerRight"];
const ARIA = { asc: "ascending", desc: "descending" };

const props = defineProps({
  api: [String, Object], data: Array, columns: Array, keyTable: null, options: { type: Object, default: () => ({}) },
  showTemplate: Boolean, selectedPk: String, isTotalDetail: Boolean, haveBorder: Boolean,
  minWidth: { type: Number, default: 768 }, stateKey: String, autoload: { type: Boolean, default: true },
  selectAllPk: String, hideGroupBtnSelect: Boolean,
});
const emits = defineEmits([
  "update:data", "update:dataSrc", "actionCheck", "reloadByFixedData", "onOrder",
  "onSaveState", "onChangePagination", "onSelectRecord", "onSearching",
]);
const select = defineModel();
const loading = defineModel("loading", { default: false });

const { t, locale } = useI18n();
const toast = useToast();
const slots = useSlots();
const store = useRTableDataStore();
const off = [];
onBeforeUnmount(() => off.forEach((fn) => fn()));

// ───────────── config ─────────────
const SELECT_ID = '__r_select'
const ACTIONS_ID = '__r_actions'
const DRAG_ID = '__r_drag'
const EXPAND_ID = '__r_expand'

const opts = computed(() => ({
  isScroll: true, scrollX: false, info: true, searching: true, paging: true, reload: true,
  order: { idx: 0, dir: "" }, lengthMenu: [10, 25, 50, 100], showNoData: true, ...props.options,
}));

const api = computed(() => {
  if (!props.api) return;
  const a = typeof props.api === "string" ? { url: props.api, method: "get" } : props.api;
  return { url: getUrl(a.url), method: a.method, filter: a.filter };
});
const hasCheck = computed(() => !!props.selectedPk);
const hasRowRecord = computed(() => !!opts.value?.rowReorder);
const pkOnly = computed(() => !!props.selectAllPk && !!api.value); // select holds pks, not records
const hasBtns = computed(() => !props.hideGroupBtnSelect && (!!props.selectAllPk || (hasCheck.value && !api.value)));

// ───────────── columns (DataTables-style config → ColumnDef) ─────────────
const cols = computed(() => {
  const special = (id, header, meta) =>
    ({ id, header, enableSorting: false, enableGlobalFilter: false, enableHiding: false, meta })
  const fixed = !!opts.value.fixedColumns;
  const base = props.columns?.length
    ? props.columns
    : (props.data?.[0] ? Object.keys(props.data[0]).map((k) => ({ title: k, data: k })) : []);
  const fixedCol = (c) => ({ data: null, orderable: false, className: "min-width all", ...c });
  const list = [
    ...(hasCheck.value && !fixed ? [fixedCol({ id: CTL, className: "min-width all td-collapse" })] : []),
    ...(hasCheck.value ? [fixedCol({ id: SEL, className: "min-width all oc-checkbox-col" })] : []),
    ...(hasRowRecord.value ? [special(DRAG_ID, '', { kind: 'drag', className: 'min-width all oc-drag-col', field: null })] : []),
    ...base,
    ...(slots.actions ? [fixedCol({ id: ACT, title: t("action") })] : []),
  ];
  return list.map((c, i) => ({
    ...c,
    idx: i,
    slot: typeof c.render === "string" && c.render[0] === "#" ? c.render.slice(1) : "",
    fn: typeof c.render === "function" ? c.render : null,
    className: [
      c.className,
      c.alignRight && (c.orderable !== false ? "have-orderable" : "no-orderable"),
      c.sortData && "multi-sort-pr",
      fixed && "fixed-columns",
      c.isLineClamp && "isLineClamp",
    ].filter(Boolean).join(" "),
  }));
});

const colDefs = computed(() => {
  const used = new Set();
  return cols.value.map((c) => {
    let id = String(c.id ?? c.data ?? `c${c.idx}`);
    if (used.has(id)) id += `_${c.idx}`; // TanStack ids must be unique
    used.add(id);
    return {
      id,
      accessorFn: (r) => (c.data == null ? r : get(r, c.data)),
      enableSorting: c.orderable !== false && c.data != null,
      enableGlobalFilter: c.data != null, // never search the whole-row accessor of action/checkbox cols
      meta: c,
    };
  });
});

const classes = (d) => d.meta.className.split(" ");
const cfgHidden = computed(() => Object.fromEntries(
  colDefs.value.filter((d) => d.meta.hidden || classes(d).includes("never")).map((d) => [d.id, false]),
));
const initSort = () => {
  const { idx, dir } = opts.value.order ?? {};
  const d = colDefs.value[idx];
  return d?.enableSorting && dir ? [{ id: d.id, desc: dir.toUpperCase() === "DESC" }] : [];
};

// ───────────── state ─────────────
const searching = ref(""); // header input (live)
const query = ref(""); // committed search
const isShowSelected = ref(false);
const apiTotal = ref(0);
const collapsed = ref([]);
const measuring = ref(false);
const colW = ref({});
const msOpen = ref(null);
const isLineClamp = ref(false);
const dataDetail = ref();
const resultData = shallowRef([]); // replaced immutably so TanStack's memoized row models see the change
let listAllSelect = [];
let ready = false, booting = false, ctl, lastSig = "", selNow = [];

// slices the app owns → external atoms (mirrored into Vue refs for reads)
const own = (init) => {
  const atom = createAtom(init);
  const state = shallowRef(init);
  const sub = atom.subscribe(() => (state.value = atom.get()));
  off.push(() => (typeof sub === "function" ? sub() : sub.unsubscribe()));
  return [atom, state, (v) => { atom.set(v); state.value = v; }];
};
const size0 = api.value ? opts.value.lengthMenu[0] : (opts.value.pageLength ?? opts.value.lengthMenu[0]);
const [pagAtom, pag, setPag] = own({ pageIndex: 0, pageSize: size0 });
const [sortAtom, sorting, setSorting] = own(initSort());
const [selAtom, selMap, setSelMap] = own({});

const page = computed({ get: () => pag.value.pageIndex + 1, set: (v) => setPag({ ...pag.value, pageIndex: v - 1 }) });
const record = computed({ get: () => pag.value.pageSize, set: (v) => setPag({ ...pag.value, pageSize: v }) });

const sel = computed(() => select.value ?? []);
const sid = (s) => String(pkOnly.value ? s : s?.[props.selectedPk]);
const tableData = computed(() => {
  if (!isShowSelected.value) return resultData.value;
  if (api.value && !pkOnly.value) return sel.value; // records of every page
  return resultData.value.filter((r) => selMap.value[String(r?.[props.selectedPk])]);
});

// ───────────── table (headless) ─────────────
const _features = tableFeatures({
  rowSortingFeature, rowPaginationFeature, rowSelectionFeature, rowExpandingFeature,
  globalFilteringFeature, columnVisibilityFeature,
});

const features = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  rowExpandingFeature,
  globalFilteringFeature,
  columnFilteringFeature,
  columnVisibilityFeature,

  sortedRowModel: createSortedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),

  sortFns,
  filterFns,
});
const table = useTable({
  features,

  atoms: {
    sorting: sortAtom,
    pagination: pagAtom,
    rowSelection: selAtom,
  },

  initialState: {
    columnVisibility: cfgHidden.value,
  },

  get data() {
    return tableData.value;
  },

  get columns() {
    return colDefs.value;
  },

  get manualSorting() {
    return !!api.value;
  },

  get manualFiltering() {
    return !!api.value;
  },

  get manualPagination() {
    return !!api.value;
  },

  getRowId: (row, i) =>
    String(row?.[props.selectedPk] ?? i),

  getRowCanExpand: () => true,

  getColumnCanGlobalFilter: (c) =>
    c.columnDef.enableGlobalFilter !== false,

  globalFilterFn: "includesString",

  enableMultiSort: false,
  enableSortingRemoval: false,
  sortDescFirst: false,
  autoResetPageIndex: false,
});

// const _table = useTable({
//   _features,
//   _rowModels: {
//     sortedRowModel: createSortedRowModel(sortFns),
//     filteredRowModel: createFilteredRowModel(filterFns),
//     paginatedRowModel: createPaginatedRowModel(),
//   },
//   atoms: { sorting: sortAtom, pagination: pagAtom, rowSelection: selAtom },
//   initialState: { columnVisibility: cfgHidden.value },
//   get data() { return tableData.value; },
//   get columns() { return colDefs.value; },
//   get manualSorting() { return !!api.value; },
//   get manualFiltering() { return !!api.value; },
//   get manualPagination() { return !!api.value; },
//   getRowId: (row, i) => String(row?.[props.selectedPk] ?? i),
//   getRowCanExpand: () => true,
//   getColumnCanGlobalFilter: (c) => c.columnDef.enableGlobalFilter !== false,
//   globalFilterFn: "includesString",
//   enableMultiSort: false,
//   enableSortingRemoval: false, // DataTables header click: asc ⇄ desc
//   sortDescFirst: false,
//   autoResetPageIndex: false, // paging is reset explicitly (search / page size), like OCTable
// });

// reactive reads: store → Vue (the row models are memoized, so hand out fresh arrays)
const tick = shallowRef(0);
const storeSub = table.store.subscribe(() => tick.value++);
off.push(() => (typeof storeSub === "function" ? storeSub() : storeSub.unsubscribe()));

const preRows = () => table.getPrePaginatedRowModel().rows;
const heads = computed(() => (tick.value, [...(table.getHeaderGroups()[0]?.headers ?? [])]));
const rows = computed(() => (tick.value, [...(opts.value.paging ? table.getRowModel().rows : preRows())]));
const total = computed(() => (api.value ? apiTotal.value : (tick.value, preRows()?.length)));
const nSel = computed(() => rows.value?.filter((r) => r.getIsSelected())?.length);
const dataTemplate = computed(() => rows.value.map((r) => r.original));
const emptyText = computed(() => {
  const m = { en: ["No data available in the table", "No selected available in the table"],
    km: ["មិនមានទិន្នន័យនៅក្នុងតារាងទេ", "មិនមានទិន្នន័យជ្រើសរើសនៅក្នុងតារាងទេ"] };
  return (m[locale.value] ?? m.en)[+isShowSelected.value];
});

// ───────────── cell helpers ─────────────
const mt = (column) => column.columnDef.meta;
const sp = (cell, row) => ({ cellData: cell.getValue(), rowData: row.original, rowIndex: row.index, colIndex: mt(cell.column).idx });
const html = (cell, row) => mt(cell.column).fn(cell.getValue(), "display", row.original, { row: row.index, col: mt(cell.column).idx });
const thCls = (h) => [mt(h.column).className, { "rt-sortable": h.column.getCanSort() }];
const isOver = (el) => el.scrollHeight > el.clientHeight;
const hoverClamp = (e) => e.currentTarget.classList.toggle("cursor-pointer", isOver(e.currentTarget));
function openDetail(e, v) {
  if (!isOver(e.currentTarget)) return;
  dataDetail.value = v;
  isLineClamp.value = true;
}
function pin(i) { // DataTables FixedColumns → sticky offsets from measured widths
  const f = opts.value.fixedColumns;
  if (!f) return;
  const w = heads.value.map((h) => colW.value[h.id] ?? 0);
  const start = f.start ?? f.left ?? 0, end = f.end ?? f.right ?? 0;
  if (i < start) return { position: "sticky", left: `${sum(w.slice(0, i))}px`, zIndex: 1 };
  if (i >= w?.length - end) return { position: "sticky", right: `${sum(w.slice(i + 1))}px`, zIndex: 1 };
}

// ───────────── multi sort (sortData popover) ─────────────
const sortCls = (key) => { const s = table.getColumn(key)?.getIsSorted(); return s ? `icon-ordering-${s}` : ""; };
function sortBy(key) { // asc → desc → none
  const c = table.getColumn(key);
  if (!c) return;
  const s = c.getIsSorted();
  if (!s) c.toggleSorting(false);
  else if (s === "asc") c.toggleSorting(true);
  else c.clearSorting();
}

// ───────────── selection (select model ⇄ rowSelection atom) ─────────────
watch(selMap, (map) => { // table → model (sync so actionCheck can read the fresh value)
  const keep = sel.value?.filter((s) => map[sid(s)]);
  const have = new Set(keep.map(sid));
  const byId = new Map(rows.value.map((r) => [r.id, r.original]));
  const add = Object.keys(map).filter((k) => map[k] && !have.has(k)).map((k) => byId.get(k)).filter(Boolean)
    .map((r) => (pkOnly.value ? r[props.selectedPk] : r));
  if (!add?.length && keep?.length === sel.value?.length) return;
  select.value = selNow = [...keep, ...add];
}, { flush: "sync" });

watch(sel, (s) => { // model → table
  selNow = s;
  const map = Object.fromEntries(s.map((x) => [sid(x), true]));
  if (!isEqual(map, selMap.value)) setSelMap(map);
}, { immediate: true });

function onRowCheck(row, checked) {
  row.toggleSelected(checked);
  emits("actionCheck", checked ? row.original : selNow);
}
function pageSelect(on) {
  table.setRowSelection((prev) => {
    const next = { ...prev };
    rows.value.forEach((r) => (on ? (next[r.id] = true) : delete next[r.id]));
    return next;
  });
  emits("actionCheck", on ? selNow : []);
}
const listAll = () => (select.value = (api.value ? listAllSelect : resultData.value) ?? []);

// ───────────── persisted state (stateKey) ─────────────
const order = () => {
  const s = sorting.value[0];
  const c = s && colDefs.value.find((d) => d.id === s.id)?.meta;
  return { OrderBy: c?.data ?? "", OrderDir: c ? (s.desc ? "DESC" : "ASC") : "" };
};
function save(body = { Pages: page.value, Records: record.value, Search: query.value, ...order() }, data = resultData.value) {
  if (isEmpty(props.stateKey)) return;
  const prev = store.data[props.stateKey] ?? {};
  const state = { ...store.data, [props.stateKey]: { ...prev, ...body, data, columns: prev.columns ?? [] } };
  store.setData(state);
  return state;
}

// ───────────── data (api / local) ─────────────
async function getData(force = false) {
  let body = { Pages: page.value, Records: record.value, Search: query.value, ...order() };
  emits("update:data", body); // parent may mutate the payload
  if (api.value.filter) body = { ...body, ...api.value.filter };
  if (isNotEmpty(body.data)) body = copyWith(body.data);

  setPag({ pageIndex: (body.Pages ?? page.value) - 1, pageSize: body.Records ?? record.value });
  if (!opts.value.paging) { delete body.Pages; delete body.Records; }

  if (booting && isNotEmpty(body.OrderDir)) {
    const d = colDefs.value.find((x) => x.meta.data === body.OrderBy);
    if (d) setSorting([{ id: d.id, desc: body.OrderDir.toUpperCase() === "DESC" }]);
  } else if (!props.showTemplate) Object.assign(body, order());
  if (isEmpty(body.OrderDir)) { delete body.OrderBy; delete body.OrderDir; }

  const sig = JSON.stringify(body); // identical request already sent → skip (search/page watchers overlap)
  if (!force && sig === lastSig) return null;
  lastSig = sig;

  ctl?.abort();
  const mine = (ctl = new AbortController());
  loading.value = true;
  try {
    const { data, error } = await useHttp(api.value.url, { method: api.value.method, signal: mine.signal, data: body });
    if (error.value) throw error.value;
    let res = data.value;
    if (pkOnly.value) listAllSelect = res?.[props.selectAllPk] ?? [];
    if (isNotEmpty(props.api?.where)) res = res?.[props.api.where];
    emits("update:dataSrc", res);
    if (isNotEmpty(res?.dataSrc)) res = res.dataSrc;
    if (props.stateKey) emits("onSaveState", save(body, res ?? []));
    return res ?? [];
  } catch (e) {
    if (mine.signal.aborted) return null; // superseded by a newer request: stay silent
    lastSig = "";
    toast.add({ color: "red", title: `${isNotEmpty(e?.Message) ? e.Message : e}` });
    return [];
  } finally {
    if (ctl === mine) loading.value = false;
  }
}

async function load(force = false) {
  const res = await getData(force);
  if (res) resultData.value = Array.isArray(res) ? copyWith(res) : [];
}

async function boot() {
  booting = true;
  ready = false;
  const st = props.stateKey && store.data?.[props.stateKey];
  if (isNotEmpty(st?.data)) { // restore saved paging / search / order / rows
    setPag({ pageIndex: (st.Pages ?? 1) - 1, pageSize: st.Records ?? size0 });
    searching.value = query.value = st.Search ?? "";
    table.setGlobalFilter(query.value || undefined);
    const d = st.OrderBy && colDefs.value.find((x) => x.meta.data === st.OrderBy);
    setSorting(d ? [{ id: d.id, desc: st.OrderDir?.toUpperCase() === "DESC" }] : []);
    resultData.value = copyWith(st.data);
  } else if (api.value) {
    if (props.autoload) await load(true);
  } else resultData.value = copyWith(props.data ?? []);
  await nextTick();
  booting = false;
  ready = true;
}

// ───────────── events (same names as OCTable) ─────────────
async function searchTable(s) {
  emits("onSearching", s);
  query.value = s ?? "";
  setPag({ ...pag.value, pageIndex: 0 });
  if (api.value) await load();
  else { table.setGlobalFilter(query.value || undefined); save(); }
}
function clearSearch() { searching.value = ""; searchTable(""); }

function fnSelectRecord(r) {
  setPag({ pageIndex: 0, pageSize: r });
  emits("onSelectRecord", r, 1);
  api.value ? load() : save();
}

function changePagination(p) {
  emits("onChangePagination", p, record.value);
  if (!ready) return;
  api.value ? load() : save();
}

function fnReload() {
  if (!api.value) return emits("reloadByFixedData");
  return load(true);
}

watch(sorting, (s) => {
  if (!ready) return;
  const idx = (x) => colDefs.value.find((d) => d.id === x.id)?.meta.idx;
  emits("onOrder", s.map((x) => [idx(x), x.desc ? "desc" : "asc"]));
  api.value ? load() : save();
});

watch(() => props.data, (n) => {
  if (api.value || (props.stateKey && !ready)) return;
  resultData.value = copyWith(n ?? []);
  save();
});

watch(() => props.keyTable, async () => {
  resultData.value = [];
  setSorting(initSort());
  lastSig = "";
  await boot();
}, { deep: true });

watch(resultData, (l) => {
  if (isShowSelected.value) return;
  const r = l?.[0];
  apiTotal.value = r ? (r.RecordCount || r.RecordsCount || r.RecordCounts || r.TotalRecord || l?.length) : 0;
});

watch([total, record], () => { // keep the local page index in range after filter / add / remove
  if (api.value) return;
  const max = Math.max(0, Math.ceil(total.value / record.value) - 1);
  if (pag.value.pageIndex > max) setPag({ ...pag.value, pageIndex: max });
});

// ───────────── responsive collapse (className: all / none / never / min-* / max-* / not-*) ─────────────
let seq = 0;
const setVis = (extra = {}) => table.setColumnVisibility({ ...cfgHidden.value, ...extra });

async function recalc() {
  const el = refScroll.value;
  if (!el?.offsetWidth || props.showTemplate) return;
  const me = ++seq;
  measuring.value = true;
  collapsed.value = [];
  setVis();
  await nextTick();
  if (me !== seq) return;

  const w = {};
  el.querySelectorAll("thead th[data-col]").forEach((th) => (w[th.dataset.col] = th.offsetWidth));
  colW.value = w;

  const hide = new Set();
  if (!opts.value.fixedColumns && !opts.value.scrollX) {
    const cur = BP.findIndex(([, max]) => window.innerWidth <= max);
    const forced = (d) => classes(d).includes("none") || classes(d).some((k) => {
      const [, kind, name] = k.match(/^(min|max|not)-(.+)$/) ?? [];
      const i = BP.findIndex(([n]) => n === name);
      return kind && i > -1 && (kind === "min" ? cur < i : kind === "max" ? cur > i : cur === i);
    });
    const shown = colDefs.value.filter((d) => !(d.id in cfgHidden.value));
    shown.filter(forced).forEach((d) => hide.add(d.id));
    let width = sum(shown.filter((d) => !hide.has(d.id)).map((d) => w[d.id] ?? 0));
    const avail = el.clientWidth;
    if (hide.size || width > avail) {
      width += CTL_W;
      shown.filter((d) => !hide.has(d.id) && !classes(d).includes("all"))
        .sort((a, b) => (b.meta.responsivePriority ?? 1e4) - (a.meta.responsivePriority ?? 1e4) || b.meta.idx - a.meta.idx)
        .forEach((d) => { if (width > avail) { hide.add(d.id); width -= w[d.id] ?? 0; } });
    }
  }
  collapsed.value = [...hide];
  setVis(Object.fromEntries([...hide].map((id) => [id, false])));
  measuring.value = false;
}

// ───────────── height (topbar / details / modal) ─────────────
const refWrap = ref(), refCard = ref(), refContainer = ref(), refScroll = ref();
const refTotal = ref(), refAfter1 = ref(), refAfter2 = ref();

function fit() {
  const wrap = refWrap.value;
  if (!wrap || !opts.value.isScroll) return; // isScroll=false → page scrolls with the table
  const desk = window.innerWidth > props.minWidth;
  const paged = opts.value.paging || opts.value.info;
  const det = sum([refTotal, refAfter1, refAfter2].map((r) => r.value?.offsetHeight || 0));
  const inContent = !!wrap.closest(".oc-content");
  const set = (el, h, min, minMobile = min) => {
    const v = desk ? `${h}px` : "100%";
    Object.assign(el.style, { height: v, maxHeight: v, minHeight: desk ? min : minMobile });
  };

  if (refCard.value) {
    const space = inContent ? (hasCheck.value ? 46 : 44) : (hasCheck.value ? 12 : 10);
    set(refCard.value, window.innerHeight - (refCard.value.getBoundingClientRect().top + space + (paged ? 60 : det)), "400px", "100%");
  }
  const body = refScroll.value;
  if (!body || props.showTemplate) return;
  const modal = wrap.closest(".oc-modal-container");
  if (modal) {
    const h = modal.getBoundingClientRect().bottom - (body.getBoundingClientRect().top + (modal.querySelector(".oc-modal-footer")?.offsetHeight ?? 0) + 80);
    Object.assign(body.style, { height: `${h}px`, maxHeight: `${h}px` });
    return;
  }
  const extra = det || slots.totalDetail || slots.ShowDetailAfterTableOne || slots.ShowDetailAfterTableTwo
    ? det + (paged ? 60 : 0) : (paged ? 60 : 10);
  set(body, window.innerHeight - (body.getBoundingClientRect().top + (inContent ? 38 : 18) + extra + 15), "400px");
}

const refit = async () => { await recalc(); fit(); };
const layout = debounce(refit, 200);

watch([tableData, colDefs, () => props.showTemplate, hasBtns], refit, { flush: "post" });

let lastW = 0;
onMounted(async () => {
  select.value ??= [];
  const ro = new ResizeObserver(([e]) => { // container width only → no height feedback loop
    const w = Math.round(e.contentRect.width);
    if (w !== lastW) { lastW = w; layout(); }
  });
//   ro.observe(refContainer.value);
    const target = refContainer.value;
    if (target instanceof Element) { ro.observe(target); }
  const close = () => (msOpen.value = null);
  document.addEventListener("click", close);
  window.addEventListener("resize", layout);
  off.push(() => {
    ro.disconnect();
    document.removeEventListener("click", close);
    window.removeEventListener("resize", layout);
    layout.cancel();
    ctl?.abort();
  });
  await boot();
  refit();
});


/* ------------------------- Cell rendering helpers -------------------------- */

const colMeta = (column) => column.columnDef.meta
const colTitle = (column) => String(column.columnDef.header ?? '')

function slotProps(cell, row, colIndex) {
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

function renderHtml(cell, row, colIndex) {
  const fn = colMeta(cell.column)?.renderHtml
  return fn ? fn(cell.getValue(), 'display', row.original, { row: row.index, col: colIndex }) : ''
}


/* -------------------------- Row reorder (local data) ----------------------- */

const dragFrom = ref(null)
const canReorderNow = computed(
  () => !!opts.value.rowReorder && !isServer.value && sorting.value.length === 0 && !globalFilter.value,
)

function onDragStart(row, event) {
  if (!canReorderNow.value) return event.preventDefault()
  dragFrom.value = row.index
  event.dataTransfer?.setData('text/plain', String(row.index))
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

function onDrop(target, event) {
  const from = dragFrom.value
  dragFrom.value = null
  if (from === null || from === target.index) return
  event.preventDefault()

  const before = dataset.value
  const after = [...before]
  const [moved] = after.splice(from, 1)
  after.splice(target.index, 0, moved)

  const diff = []
  for (let i = Math.min(from, target.index); i <= Math.max(from, target.index); i++) {
    diff.push({ oldPosition: before.indexOf(after[i]), newPosition: i, oldData: before[i], newData: after[i] })
  }
  dataset.value = after
  emit('onRowReorder', event, diff, { row: moved })
}

// ───────────── public api ─────────────
const filter = () => { if (!api.value) return; setPag({ ...pag.value, pageIndex: 0 }); return load(true); };
const reload = (currentPage = true) => {
  if (!api.value || booting) return;
  if (!currentPage) setPag({ ...pag.value, pageIndex: 0 });
  return load(true);
};
function setListData(data) { resultData.value = copyWith(data); save(); }
function addRowData(row) {
  let next = [copyWith(row), ...resultData.value];
  if (api.value && opts.value.lengthMenu.includes(record.value)) next = next.slice(0, record.value); // keep page size
  resultData.value = next;
  save();
}
function updateRowData(row, pk) {
  const i = resultData.value.findIndex((e) => e[pk] === row[pk]);
  if (i < 0) return;
  resultData.value = resultData.value.map((e, k) => (k === i ? copyWith(row) : e));
  save();
}

defineExpose({ table, filter, reload, responsive: refit, setListData, addRowData, updateRowData });
</script>

<style lang="scss">
$bd: 1px solid var(--border-table);

.rt-wrapper {
  --rt-bg: var(--bg-content);
  --rt-page: var(--bg-wrapper);
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;

  .rt-btn {
    display: flex;
    align-items: center;
    gap: 2px;
    height: 24px;
    padding: 0 10px 0 8px;
    background: var(--rt-bg);
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
  }

  .rt-card {
    position: relative;
    margin-top: 14px;
    height: 100%;
    overflow: auto;

    .rt-card-scroll {
      overflow: auto;
    }
  }

  .rt-loader {
    position: absolute;
    inset: 0;
    z-index: 10;
    min-height: 100px;
    overflow: hidden;
    border-radius: 10px;
  }

  .rt-footer.rt-sticky {
    position: sticky;
    bottom: 0;
    z-index: 5;
    background: var(--rt-page);
  }

  // ── container ──
  .rt-container {
    position: relative;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    margin-top: 14px;
    padding: 12px 10px 10px;
    background: var(--rt-bg);
    border-radius: 10px;

    &.is-not-check { padding-top: 10px; }
    &.no-scroll-table { height: auto; }
    &.have-border {
      border: $bd;

      tbody tr:last-child td { border-bottom-color: transparent; }
    }

    @media (max-width: 540px) {
      padding: 8px 0 10px;
    }
  }

  .rt-scroll {
    height: 100%;
    overflow: auto;

    &::-webkit-scrollbar { width: 9px; height: 9px; @media (max-width: 540px) { display: none; } }
    &::-webkit-scrollbar-track { background: transparent; }
    &::-webkit-scrollbar-thumb { background: transparent; border: 3px solid var(--rt-bg); border-radius: 50px; }
    &:hover::-webkit-scrollbar-thumb { background: var(--color-w-b-4); }
    &::-webkit-scrollbar-thumb:hover { background: var(--color-w-b-3); }
  }

  .no-scroll-table .rt-scroll { overflow: visible; height: auto; } // sticky header follows the page

  // ── table ──
  .rt-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    background: transparent;

    &.measuring { width: auto !important; }

    th, td {
      box-sizing: border-box;
      text-align: left;
      white-space: nowrap;
      border-bottom: $bd;
    }

    th {
      position: sticky;
      top: 0;
      z-index: 2;
      padding: 10px 10px 14px;
      font-size: 12px;
      font-weight: 600;
      background: var(--rt-bg);
      user-select: none;

      &.rt-sortable { cursor: pointer; padding-right: 30px; }
      &.multi-sort-pr { padding-right: 20px !important; }
      &.no-orderable { padding-right: 10px; }
    }

    td {
      padding: 8px 10px;
      font-size: 13px;

      &.have-orderable { text-align: right; padding-right: 30px; }
      &.no-orderable { text-align: right; }
      &.isLineClamp { width: auto !important; max-width: 250px; white-space: unset; }
    }

    tbody tr:last-child td { border-bottom-color: transparent; }
    tbody tr:hover > td { background: #f9f9f9; }
    tbody tr.selected > td { box-shadow: inset 0 0 0 9999px rgba(0, 0, 0, 0.05); }
    td[style*="sticky"], th[style*="sticky"] { background: var(--rt-bg); }
    th[style*="sticky"] { z-index: 3; }

    .min-width { width: 1px !important; white-space: nowrap; }
    .oc-checkbox-col { padding: 8px 10px !important; input { margin: 0 !important; } }
    .td-collapse { padding: 4px 8px !important; }
    &:not(.collapsed) .td-collapse { padding: 0 !important; }
    tr.rt-empty td { text-align: center; padding: 20px 10px; }
    .rt-clamp { cursor: default; }
  }

  // sort arrows
  .rt-order {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    flex-direction: column;
    font-size: 14px;
    line-height: 7px;

    i { opacity: 0.125; }
    &.asc i:first-child, &.desc i:last-child { opacity: 0.9; }
  }

  // expand / collapse control
  .rt-expand {
    display: inline-flex;
    align-items: center;
    padding: 0;
    border: 0;
    background: transparent;
    color: #00000080;
    font-size: 20px;
    line-height: 14px;
    cursor: pointer;
  }

  // child row (collapsed columns)
  .rt-table tr.child td.child {
    padding: 0 10px;
    white-space: normal;

    ul.dtr-details {
      position: relative;
      width: 100%;
      margin: 0;
      padding: 12px 10px;
      list-style: none;

      &::before {
        content: "";
        position: absolute;
        top: 0;
        left: -10px;
        height: 100%;
        width: 2px;
        background: var(--color-primary);
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
        padding-right: 4px;
        font-weight: 400;
        color: var(--color-w-b-2);

        &::after { content: ":"; position: absolute; right: -4px; }
        .multi-sort-wrapper { display: none; }
      }

      .dtr-data { color: var(--color-w-b-1); }
    }
  }

  // multi sort
  .multi-sort-wrapper {
    display: inline-flex;
    align-items: center;
    cursor: pointer;
  }

  .popover-multi-sort-contain {
    position: absolute;
    top: 100%;
    right: 6px;
    z-index: 15;
    display: grid;
    gap: 6px;
    min-width: 120px;
    padding: 10px;
    font-size: 13px;
    font-weight: bold;
    background: var(--bg-wrapper) !important;
    border-radius: 0.75rem;
    box-shadow: rgba(100, 100, 111, 0.2) 0 7px 29px 0;

    .sort-detail {
      position: relative;
      padding-right: 12px;
      cursor: pointer;

      .icon-order {
        position: absolute;
        right: 0;
        top: 0;
        bottom: 0;
        width: 12px;

        &::before, &::after {
          position: absolute;
          left: 0;
          display: block;
          font-family: remixicon;
          font-size: 14px;
          line-height: 4px;
          opacity: 0.125;
        }
        &::after { content: "\ea4f"; top: 50%; margin-top: 1px; }
        &::before { content: "\ea55"; bottom: 50%; margin-bottom: 1px; }
      }

      &.icon-ordering-asc .icon-order::before,
      &.icon-ordering-desc .icon-order::after { opacity: 0.6; }
    }
  }

}

.oc-content .rt-wrapper,
.oc-modal .rt-wrapper {
  --rt-bg: var(--bg-wrapper);
  --rt-page: var(--bg-content);
}

.oc-content .rt-wrapper .rt-container {
  padding: 12px 8px 10px 14px;

  &.have-border { background: transparent; }
}

.dark .rt-wrapper {
  .rt-table tbody tr:hover > td { background: #292929; }
  .rt-expand { color: #dee2e6; }
  .popover-multi-sort-contain { box-shadow: rgba(0, 0, 0, 0.5) 0 7px 29px 0; }
}

.detail-container {
  position: relative;
  padding: 30px 0 20px;

  .btn-close-detail {
    position: absolute;
    top: 8px;
    right: 0;
    width: 30px;
    height: 30px;
    margin-right: -8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-w-b-1);
    cursor: pointer;

    i { font-size: 13px; line-height: 13px; pointer-events: none; }
  }
}
</style>