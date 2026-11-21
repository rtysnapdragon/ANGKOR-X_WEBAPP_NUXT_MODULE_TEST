<template>
  <div class="rt-wrapper" ref="refWrap" :class="{ 'is-mobile': screen.isMobile }">
    <slot name="headerTable" v-if="$slots.headerTable" />

    <OCTableHeader :options="opts" v-model:selected="record" v-model:searching="searching"
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
        <RLoading :loading="true" />
      </div>
      <div class="rt-card-scroll" ref="refCardScroll" v-if="!$slots.loading || !loading">
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
      <div class="rt-btn"  v-if="selectAllPk || !api" @click="listAll">
        <i class="ri-checkbox-circle-fill"></i><span>{{ $t("select_all") }}: {{ total }}</span>
      </div>
      <div class="rt-btn" @click="select = []">
        <i class="ri-close-circle-fill"></i><span>{{ $t("clear_all") }}</span>
      </div>
    </div>

    <!-- table -->
    <div class="rt-container" ref="refContainer" v-show="!showTemplate"
      :class="{ 'have-border': haveBorder, 'is-not-check': !hasCheck, 'no-scroll-table': !opts?.isScroll }">
      <div class="rt-scroll" ref="refScroll">
        <table class="rt-table" :class="{ collapsed: collapsed?.length, measuring }" :aria-busy="loading">
          <thead>
            <tr>
              <th v-for="(h, i) in heads" :key="h.id" :data-col="h.id" :class="thCls(h)" :style="pin(i)"
                :aria-sort="ARIA[h.column.getIsSorted()]"
                @click="h.column?.getCanSort() && h.column.toggleSorting()">
                <label v-if="h.id === SEL" class="r-table-checkbox oc-checkbox  tbl-checkbox">
                  <input  type="checkbox" :checked="nSel > 0"
                    :class="{ minus: nSel > 0 && nSel < rows?.length }" @click.stop @change="pageSelect(nSel === 0)" />
                    <span class="r-table-checkbox__box"> <i class="ri-check-line" /> </span>
                </label>
                <template v-else>
                  <!-- <span v-html="mt(h.column).title" /> -->
                  <slot v-if="mt(h.column).headerSlot" :name="mt(h.column).headerSlot"
                  v-bind="{ column: h.column, title: mt(h.column).title }" />
                  <HeadFn v-else-if="mt(h.column).headerFn" :column="h.column" />
                  <span v-else v-html="mt(h.column).title" />
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

          <tbody ref="refBody">
            <template v-for="row in rows" :key="row.id">
              <tr class="rt-row"
               :class="{ selected: row.getIsSelected(), 'dtr-expanded': row.getIsExpanded() }">
                <td v-for="(cell, ci) in row.getVisibleCells()" :key="cell.id" :style="[pin(ci), colStyle(mt(cell.column))]"
                  :class="[mt(cell.column).className, cellCls(cell, row), { 'dtr-control': cell.column.id === ctlHost && collapsed?.length }]">
                  <RTooltip v-if="cell.column.id === ctlHost && collapsed?.length" class="rt-expand-wrap"
                    :text="row.getIsExpanded() ? t('collapse') : t('expand')">
                    <button type="button" class="rt-expand" :aria-expanded="row.getIsExpanded()"
                      @click="row.toggleExpanded()">
                      <i :class="row.getIsExpanded() ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'"></i>
                    </button>
                  </RTooltip>

                  <!-- checkbox handle -->
                  <!-- <template v-if="cell.column.id === SEL">
                    <slot name="checkbox" v-bind="sp(cell, row)" />
                    <input type="checkbox" class="oc-checkbox" :checked="row.getIsSelected()" :disabled="!row.getCanSelect()"
                      @change="onRowCheck(row, $event.target.checked)" />
                  </template> -->

                  <!-- Checkbox handle -->
                  <template v-if="cell.column.id === SEL">
                    <slot name="checkbox" v-bind="sp(cell, row)" />
                    <label class="r-table-checkbox oc-checkbox">
                      <input type="checkbox" :checked="row.getIsSelected()" :disabled="!row.getCanSelect()" @change="onRowCheck(row, $event.target.checked)" />
                      <span class="r-table-checkbox__box"> <i class="ri-check-line" /> </span>
                    </label>
                  </template>
                  <!-- drag handle -->
                  <RTooltip v-else-if="mt(cell.column).kind === 'drag'" class="inline-flex align-middle" :text="t('reorder_row')">
                    <span class="oc-drag-handle" :class="{ disabled: !canReorderNow }"
                      role="button" :aria-label="t('reorder_row')">
                      <i class="ri-draggable" aria-hidden="true"></i>
                    </span>
                  </RTooltip>

                  <slot v-else-if="cell.column.id === ACT" name="actions" v-bind="sp(cell, row)" />
                  <slot v-else-if="cell.column.id === CTL" name="tdNull" v-bind="sp(cell, row)" />
                  <div v-else-if="mt(cell.column).isLineClamp && isNotEmpty(cell.getValue())"
                    class="rt-clamp line-clamp-2" @mouseenter="hoverClamp" @click="openDetail($event, cell.getValue())">
                    {{ cell.getValue() }}
                  </div>
                  <!-- <slot v-else-if="mt(cell.column).slot" :name="mt(cell.column).slot" v-bind="sp(cell, row)" /> V1
                  <span v-else-if="mt(cell.column).fn" v-html="html(cell, row)" />
                  <template v-else>{{ cell.getValue() ?? "" }}</template> -->
                  <slot v-else-if="mt(cell.column).slot" :name="mt(cell.column).slot" v-bind="sp(cell, row)">{{ fmt(cell) }}</slot>
                  <CellFn v-else-if="mt(cell.column).fn" :cell="cell" :row="row" />
                  <template v-else>{{ fmt(cell) }}</template>
                </td>
              </tr>

              <!-- collapsed columns (DataTables Responsive child row) -->
              <tr v-if="collapsed?.length && row.getIsExpanded()" class="child">
                <td class="child" :colspan="heads?.length">
                  <ul class="dtr-details">
                    <template v-for="cell in row.getAllCells()" :key="cell.id">
                      <!-- <li v-if="collapsed.includes(cell.column.id)"> -->
                      <li v-if="collapsed.includes(cell.column.id) && mt(cell.column).title">
                        <span class="dtr-title" v-html="mt(cell.column).title" />
                        <span class="dtr-colon" aria-hidden="true">:</span>
                        <span class="dtr-data">
                          <div v-if="mt(cell.column).isLineClamp && isNotEmpty(cell.getValue())"
                            class="rt-clamp line-clamp-2" @mouseenter="hoverClamp"
                            @click="openDetail($event, cell.getValue())">{{ cell.getValue() }}</div>
                          <!-- <slot v-else-if="mt(cell.column).slot" :name="mt(cell.column).slot" v-bind="sp(cell, row)" /> V1
                          <span v-else-if="mt(cell.column).fn" v-html="html(cell, row)" />
                          <template v-else>{{ cell.getValue() ?? "" }}</template> -->
                          <slot v-else-if="mt(cell.column).slot" :name="mt(cell.column).slot" v-bind="sp(cell, row)">{{ fmt(cell) }}</slot>
                          <CellFn v-else-if="mt(cell.column).fn" :cell="cell" :row="row" />
                          <template v-else>{{ fmt(cell) }}</template>
                        </span>
                      </li>
                    </template>
                  </ul>
                </td>
              </tr>
            </template>

            <!-- <template v-if="showSkeleton">
              <tr v-for="n in skeletonCount" :key="`sk-${n}`" class="rt-skel-row" aria-hidden="true">
                <td v-for="(h, ci) in heads" :key="h.id" :style="pin(ci)" :class="mt(h.column).className">
                  <span v-if="h.id === SEL" class="rt-skel rt-skel-box" />
                  <span v-else-if="h.id === DRG" class="rt-skel rt-skel-dot" />
                  <span v-else-if="h.id === CTL" />
                  <span v-else-if="h.id === ACT" class="rt-skel rt-skel-pill" />
                  <span v-else class="rt-skel" :style="{ width: skelWidth(n, ci) }" />
                </td>
              </tr>
            </template> -->

            <template v-if="showSkeleton">
              <tr v-for="n in skeletonCount" :key="`sk-${n}`" class="rt-skel-row" aria-hidden="true">
                <td v-for="(h, ci) in heads" :key="h.id" :style="pin(ci)" :class="mt(h.column).className">
                  <RSkeleton v-if="h.id === SEL" class="h-4 w-4 rounded" />
                  <RSkeleton v-else-if="h.id === DRG" class="h-3.5 w-3.5 rounded-full" />
                  <span v-else-if="h.id === CTL" />
                  <RSkeleton v-else-if="h.id === ACT" class="h-6 w-16 rounded-lg" />
                  <RSkeleton v-else class="h-3 max-w-[220px] min-w-7" :style="{ width: skelWidth(n, ci) }" />
                </td>
              </tr>
            </template>
            <!-- <tr v-if="!rows?.length" class="rt-empty">
              <td :colspan="heads?.length || 1">{{ emptyText }}</td>
            </tr> -->
            <tr v-if="!rows?.length && !loading" class="rt-empty">
              <td :colspan="heads?.length || 1">
                <RTableEmpty :searching="query" :selected="isShowSelected" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- <div class="rt-loader" v-if="loading" /> -->
      <div class="rt-loader"  v-if="loading && !showSkeleton" role="status" aria-live="polite">
        <RLoading :loading="true" />
      </div>
      <div class="transition-all absolute top-[1px] left-0 z-10 w-full px-1" v-if="loading">
        <UProgress size="xs" animation="carousel" />
      </div>

      <div ref="refTotal" class="oc-tbl-total-detail" v-if="$slots.totalDetail">
        <slot name="totalDetail" :total="total" />
      </div>
    </div>

    <div ref="refAfter1" v-if="$slots.ShowDetailAfterTableOne"><slot name="ShowDetailAfterTableOne" /></div>
    <div ref="refAfter2" v-if="$slots.ShowDetailAfterTableTwo"><slot name="ShowDetailAfterTableTwo" /></div>

    <OCTableFooter class="rt-footer" :class="{ 'rt-sticky': !opts?.isScroll }" :options="opts" v-if="!isTotalDetail"
      :page-count="record" :total="total" v-model:page="page" @change-pagination="changePagination"
      v-model:selected="record" @select-records="fnSelectRecord(record)" :loading="loading" />

    <RModal v-model="isLineClamp" :for-table="true">
      <div class="detail-container">
        <div class="btn-close-detail" @click="isLineClamp = false"><i class="ri-close-large-fill"></i></div>
        <div>{{ dataDetail }}</div>
      </div>
    </RModal>
  </div>
</template>

<script setup>
import { camelize, getCurrentInstance, h, isVNode, onMounted, useAttrs } from "vue";
import { createAtom } from "@tanstack/vue-store";
import { useTable,  tableFeatures,  sortFns, filterFns,
  rowSortingFeature, rowPaginationFeature, rowSelectionFeature, rowExpandingFeature,  globalFilteringFeature, columnFilteringFeature, columnVisibilityFeature,
  createSortedRowModel,
  createFilteredRowModel,
  createPaginatedRowModel,
} from "@tanstack/vue-table";
import { debounce, get, isEqual, sum } from "lodash-es";

const screen = useScreenStore();

const SEL = "_sel", CTL = "_ctl", ACT = "_act", DRG = "_drg";
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
  "onSaveState", "onChangePagination", "onSelectRecord", "onSearching","onRowReorder",
]);
const select = defineModel();
const loading = defineModel("loading", { default: false });

const { t, locale } = useI18n();
const toast = useToast();
const slots = useSlots();
const store = useRTableDataStore();
const off = [];
// let alive = true;
// onBeforeUnmount(() => { alive = false; });
const refBody = ref();
onBeforeUnmount(() => off.forEach((fn) => fn()));

// ───────────── config ─────────────
const _opts = computed(() => ({
  isScroll: true, scrollX: false, info: true, searching: true, paging: true, reload: true,
  order: { idx: 0, dir: "" }, lengthMenu: [10, 25, 50, 100], showNoData: true, ...props.options,
}));
const opts = computed(() => ({
  isScroll: true, scrollY: 400, scrollX: false, info: true, destroy: true, retrieve: true,
  searching: true, paging: true, reload: true,
  order: { idx: 0, dir: "" },
  responsive: "auto",
  lengthMenu: [10, 25, 50, 100],
  pageLength: props.api ? 1000 : 10,
  layout: { topStart: null, topEnd: null, bottomStart: null, bottomEnd: null },
  showNoData: true,
  ...props.options,
}));
const api = computed(() => {
  if (!props.api) return;
  const a = typeof props.api === "string" ? { url: props.api, method: "get" } : props.api;
  return { url: getUrl(a.url), method: a.method, filter: a.filter };
});
const hasCheck = computed(() => !!props.selectedPk);
const pkOnly = computed(() => !!props.selectAllPk && !!api.value); // select holds pks, not records
// const hasBtns = computed(() => !props.hideGroupBtnSelect && (!!props.selectAllPk || (hasCheck.value && !api.value)));
const hasBtns = computed(() => !props.hideGroupBtnSelect && (!!props.selectAllPk || (hasCheck.value && !api.value)));
// const hasBtns = computed(() => !props.hideGroupBtnSelect && hasCheck.value );
// ───────────── columns (DataTables-style config → ColumnDef) ─────────────
const _cols = computed(() => {
  const fixed = !!opts.value.fixedColumns;
  const hasDrag = !!opts.value.rowReorder && !api.value;
  const dragOff = opts.value.rowReorder ? 1 : 0; // allow data api rowRecorder 
  const base = props.columns?.length
    ? props.columns
    : (props.data?.[0] ? Object.keys(props.data[0]).map((k) => ({ title: k, data: k })) : []);
  const fixedCol = (c) => ({ data: null, orderable: false, className: "min-width all", ...c });
  const list = [
    ...(hasCheck.value && !fixed ? [fixedCol({ id: CTL, className: "min-width all td-collapse" })] : []),
    ...(hasCheck.value ? [fixedCol({ id: SEL, className: "min-width all oc-checkbox-col" })] : []),
    ...base,
    ...(slots.actions ? [fixedCol({ id: ACT, title: t("action") })] : []),
  ];
  const mapped = list.map((c, i) => ({
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
   return hasDrag
    ? [{ ...fixedCol({ id: DRG, kind: "drag", className: "min-width all oc-drag-col" }), idx: -1, slot: "", fn: null }, ...mapped]
    : mapped;
});
const NUM = new Set(["number", "currency", "percent"]);
const isTpl = (s) => typeof s === "string" && s[0] === "#";
const compFn = (o) => (v, _t, row, m) => o.component
  ? { component: o.component, props: { value: v, row, ...(typeof o.props === "function" ? o.props(v, row) : o.props) } }
  : { component: o, props: { value: v, row, meta: m } };
const toFn = (r) => (typeof r === "function" ? r : r && typeof r === "object" ? compFn(r) : null);

const cols = computed(() => {
  const fixed = !!opts.value.fixedColumns;
  const hasDrag = !!opts.value.rowReorder;
  const base = props.columns?.length
    ? props.columns
    : (props.data?.[0] ? Object.keys(props.data[0]).map((k) => ({ title: k, data: k })) : []);
  const fixedCol = (c) => ({ data: null, orderable: false, className: "min-width all", ...c });
  const list = [
    ...(hasCheck.value && !fixed ? [fixedCol({ id: CTL, className: "min-width all td-collapse" })] : []),
    ...(hasCheck.value ? [fixedCol({ id: SEL, className: "min-width all oc-checkbox-col" })] : []),
    ...base,
    ...(slots.actions ? [fixedCol({ id: ACT, title: t("action") })] : []),
  ];
  const mapped = list.map((c, i) => {
    const key = String(c.id ?? c.data ?? "");
    return {
      ...c,
      idx: i,
      slot: isTpl(c.render) ? c.render.slice(1) : (key && slots[`cell-${key}`] ? `cell-${key}` : ""),
      fn: isTpl(c.render) ? null : toFn(c.render),
      headerSlot: isTpl(c.header) ? c.header.slice(1) : (key && slots[`header-${key}`] ? `header-${key}` : ""),
      headerFn: isTpl(c.header) ? null : toFn(c.header),
      align: c.align ?? (NUM.has(c.type) ? "right" : undefined),
      className: [
        c.className,
        c.alignRight && (c.orderable !== false ? "have-orderable" : "no-orderable"),
        c.sortData && "multi-sort-pr",
        fixed && "fixed-columns",
        c.isLineClamp && "isLineClamp",
      ].filter(Boolean).join(" "),
    };
  });
  return hasDrag
    ? [{ ...fixedCol({ id: DRG, kind: "drag", className: "min-width all oc-drag-col" }), idx: -1, slot: "", fn: null }, ...mapped]
    : mapped;
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
const __initSort = () => { //select the default sort by field name
  const { idx, dir } = opts.value.order ?? {};
  const d = colDefs.value.find((x) => x.meta.idx === idx);
  return d?.enableSorting && dir ? [{ id: d.id, desc: dir.toUpperCase() === "DESC" }] : [];
};
const initSort = () => { //Counting indexes is fragile, as this bug shows. Make initSort accept order.data:
  const { idx, dir, data } = opts.value.order ?? {};
  const d = data
    ? colDefs.value.find((x) => x.meta.data === data)
    : colDefs.value.find((x) => x.meta.idx === idx);
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

//skeleton
// ───────────── skeleton ─────────────
const showSkeleton = computed(() => loading.value && !rows.value.length && !props.showTemplate);
// const skeletonCount = computed(() => Math.min(record.value || 10, 10));
const skeletonCount = computed(() => Math.min(record.value || 10, 50));

// deterministic widths, so the skeleton doesn't flicker between renders
const SKEL_W = [72, 55, 88, 64, 46, 80, 58, 70];
const skelWidth = (r, c) => `${SKEL_W[(r * 3 + c) % SKEL_W.length]}%`;

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

const __features = tableFeatures({
  rowSortingFeature, rowPaginationFeature, rowSelectionFeature, rowExpandingFeature, globalFilteringFeature, columnFilteringFeature,
  columnVisibilityFeature, sortFns, filterFns,
});

const features = tableFeatures({
  rowSortingFeature, rowPaginationFeature, rowSelectionFeature, rowExpandingFeature,
  globalFilteringFeature, columnFilteringFeature, columnVisibilityFeature,
  sortedRowModel: createSortedRowModel(),
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns, filterFns,
});

const table = useTable({
  features,
  // _rowModels: {
  //   sortedRowModel: createSortedRowModel(),
  //   filteredRowModel: createFilteredRowModel(),
  //   paginatedRowModel: createPaginatedRowModel(),
  // },
  atoms: { sorting: sortAtom, pagination: pagAtom, rowSelection: selAtom },
  initialState: { columnVisibility: cfgHidden.value },
  get data() { return tableData.value; },
  get columns() { return colDefs.value; },
  get manualSorting() { return !!api.value; },
  get manualFiltering() { return !!api.value; },
  get manualPagination() { return !!api.value; },
  getRowId: (row, i) => String(row?.[props.selectedPk] ?? i),
  getRowCanExpand: () => true,
  getColumnCanGlobalFilter: (c) => c.columnDef.enableGlobalFilter !== false,
  globalFilterFn: "includesString",
  enableMultiSort: false,
  enableSortingRemoval: false,
  sortDescFirst: false,
  autoResetPageIndex: false,
});

// reactive reads: store → Vue (the row models are memoized, so hand out fresh arrays)
const tick = shallowRef(0);
const storeSub = table.store.subscribe(() => tick.value++);
off.push(() => (typeof storeSub === "function" ? storeSub() : storeSub.unsubscribe()));

const preRows = () => table.getPrePaginatedRowModel().rows;
// const heads = computed(() => (tick.value, [...(table.getHeaderGroups()[0]?.headers ?? [])]));
// const rows = computed(() => (tick.value, [...(opts.value.paging ? table.getRowModel().rows : preRows())]));
// const rows = computed(() => (tick.value, [...table.getRowModel().rows]));
// const rows = computed(() => (tick.value, [...(opts.value.paging ? table.getRowModel().rows : preRows())].filter(Boolean)));
// const nSel = computed(() => rows.value.filter((r) => r.getIsSelected()).length);
// const total = computed(() => (api.value ? apiTotal.value : (tick.value, preRows()?.length)));
// const heads = computed(() => (tick.value, colDefs.value, [...(table.getHeaderGroups()[0]?.headers ?? [])]));
// const rows = computed(() => (tick.value, tableData.value, [...(opts.value.paging ? table.getRowModel().rows : preRows())]));
// const total = computed(() => (api.value ? apiTotal.value : (tick.value, tableData.value, preRows()?.length)));
const heads = computed(() => (tick.value, colDefs.value, [...(table.getHeaderGroups()[0]?.headers ?? [])]));
const rows  = computed(() => (tick.value, tableData.value, [...(opts.value.paging ? table.getRowModel().rows : preRows())].filter(Boolean)));
const total = computed(() => (api.value ? apiTotal.value : (tick.value, tableData.value, preRows()?.length)));
const nSel = computed(() => rows.value?.filter((r) => r.getIsSelected())?.length);
const dataTemplate = computed(() => rows.value.map((r) => r.original)); //As a safety net, add a bump after the options have synced:
// watch([tableData, colDefs], () => nextTick(() => tick.value++), { flush: "post" });
watch(tableData, (d) => {
  table.setOptions((prev) => ({ ...prev, data: d }));
  tick.value++;
}, { flush: "post" });

const emptyText = computed(() => {
  const m = { en: ["No data available in the table", "No selected available in the table"],
    km: ["មិនមានទិន្នន័យនៅក្នុងតារាងទេ", "មិនមានទិន្នន័យជ្រើសរើសនៅក្នុងតារាងទេ"] };
  return (m[locale.value] ?? m.en)[+isShowSelected.value];
});

// ───────────── cell helpers ─────────────
// const mt = (column) => column.columnDef.meta;
const mt = (column) => {
  const m = column?.columnDef?.meta;
  if (!m && import.meta.dev) console.warn("[RTableTank] column without meta:", column?.id ?? column);
  return m ?? {};
};
// column that hosts the responsive expand button
// const ctlHost = computed(() => (hasCheck.value && !opts.value.fixedColumns ? CTL : cols.value[0]?.id ?? null));
const ctlHost = computed(() => (hasCheck.value && !opts.value.fixedColumns ? CTL : colDefs.value[0]?.id ?? null));
const _sp = (cell, row) => ({ cellData: cell.getValue(), rowData: row.original, rowIndex: row.index, colIndex: mt(cell.column).idx });
const html = (cell, row) => mt(cell.column).fn(cell.getValue(), "display", row.original, { row: row.index, col: mt(cell.column).idx });
const _thCls = (h) => [mt(h.column).className, { "rt-sortable": h.column.getCanSort() }];
const isOver = (el) => el.scrollHeight > el.clientHeight;
const hoverClamp = (e) => e.currentTarget.classList.toggle("cursor-pointer", isOver(e.currentTarget));
/*---------------------- New Start ----------------------- */
const sp = (cell, row) => ({
  cellData: cell.getValue(), rowData: row.original, rowIndex: row.index, colIndex: mt(cell.column).idx,
  value: cell.getValue(), row, cell, column: cell.column, table,
});
const thCls = (h) => [mt(h.column).className, mt(h.column).headerClass, { "rt-sortable": h.column.getCanSort() }];

const px = (v) => (typeof v === "number" ? `${v}px` : v);
const colStyle = (m) => ({ width: px(m.width), minWidth: px(m.minWidth), maxWidth: px(m.maxWidth), textAlign: m.align });
const cellCls = (cell, row) => {
  const m = mt(cell.column);
  return [typeof m.cellClass === "function" ? m.cellClass(cell.getValue(), row.original) : m.cellClass, m.ellipsis && "rt-ellipsis"];
};

// built-in formatting by column `type`
const FMT = {
  number: (v, c) => new Intl.NumberFormat(locale.value, c.formatOptions).format(v),
  currency: (v, c) => new Intl.NumberFormat(locale.value, { style: "currency", currency: c.currency ?? "USD", ...c.formatOptions }).format(v),
  percent: (v, c) => new Intl.NumberFormat(locale.value, { style: "percent", ...c.formatOptions }).format(v),
  date: (v, c) => new Intl.DateTimeFormat(locale.value, { dateStyle: "medium", ...c.formatOptions }).format(new Date(v)),
  datetime: (v, c) => new Intl.DateTimeFormat(locale.value, { dateStyle: "medium", timeStyle: "short", ...c.formatOptions }).format(new Date(v)),
  boolean: (v) => (v ? tBy({ en: "Yes", km: "បាទ/ចាស", zh: "是" }) : tBy({ en: "No", km: "ទេ", zh: "否" })),
};
function fmt(cell) {
  const m = mt(cell.column), v = cell.getValue();
  if (m.type === "boolean") return FMT.boolean(v);
  if (v == null || v === "") return m.emptyText ?? "";
  if (m.format) return m.format(v, cell.row.original);
  try { return FMT[m.type]?.(v, m) ?? v; } catch { return v; }
}

// render() may return: HTML string (legacy), VNode, VNode[], a component, or { component, props }
const toNode = (r) => {
  if (r == null || r === false) return null;
  if (typeof r === "string") return h("span", { innerHTML: r }); // legacy: caller must escape user input
  if (Array.isArray(r) || isVNode(r)) return r;
  if (r.component) return h(r.component, r.props);
  return typeof r === "object" ? h(r) : String(r);
};
const CellFn = (p) => {
  const m = mt(p.cell.column);
  return toNode(m.fn(p.cell.getValue(), "display", p.row.original, { row: p.row.index, col: m.idx }, { h, cell: p.cell, row: p.row }));
};
CellFn.props = ["cell", "row"];
const HeadFn = (p) => {
  const m = mt(p.column);
  return toNode(m.headerFn({ column: p.column, title: m.title }, h));
};
HeadFn.props = ["column"];
/*---------------------- New Start ----------------------- */

function openDetail(e, v) {
  if (!isOver(e.currentTarget)) return;
  dataDetail.value = v;
  isLineClamp.value = true;
}
function __pin(i) { // DataTables FixedColumns → sticky offsets from measured widths
  const f = opts.value.fixedColumns;
  const dragOff = opts.value.rowReorder && !api.value ? 1 : 0; // name clashes with `off[]`; call it dragOff
  const s0 = f.start ?? f.left ?? 0;
  if (!f) return;
  const w = heads.value.map((h) => colW.value[h.id] ?? 0);
  const start = s0 ? s0 + dragOff : 0, end = f.end ?? f.right ?? 0;
  // const start = f.start ?? f.left ?? 0, end = f.end ?? f.right ?? 0;
  if (i < start) return { position: "sticky", left: `${sum(w.slice(0, i))}px`, zIndex: 1 };
  if (i >= w?.length - end) return { position: "sticky", right: `${sum(w.slice(i + 1))}px`, zIndex: 1 };
}

function pin(i) {  // DataTables FixedColumns → sticky offsets from measured widths
  const f = opts.value.fixedColumns;
  const dragOff = opts.value.rowReorder ? 1 : 0; //// allow data api rowRecorder 
  if (!f) return;
  // const dragOff = opts.value.rowReorder && !api.value ? 1 : 0; // not allow data api rowRecorder  
  const w = heads.value.map((h) => colW.value[h.id] ?? 0);
  const s0 = f.start ?? f.left ?? 0;
  const start = s0 ? s0 + dragOff : 0, end = f.end ?? f.right ?? 0;
  if (i < start) return { position: "sticky", left: `${sum(w.slice(0, i))}px`, zIndex: 1 };
  if (i >= w.length - end) return { position: "sticky", right: `${sum(w.slice(i + 1))}px`, zIndex: 1 };
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
    // if (!alive) return null;
    if (error.value) throw error.value;
    let res = data.value;
    console.log("res data in table ------------- ", res)
    console.log("[RTableTank] api", { rows: Array.isArray(res) ? res.length : typeof res });
    // if (pkOnly.value) listAllSelect = res?.[props.selectAllPk] ?? [];
    // if (pkOnly.value) {
    //   listAllSelect = res?.[props.selectAllPk] ?? [];
    //     if (!Array.isArray(res?.[props.selectAllPk])) warnOnce(tBy({
    //       km: `រកមិនឃើញ \`selectAllPk\` "${props.selectAllPk}" (ជា array) នៅក្នុង API response ទេ។`,
    //       en: `\`selectAllPk\` "${props.selectAllPk}" was not found (as an array) in the API response.`,
    //       zh: `在 API 响应中未找到（数组类型的）\`selectAllPk\` "${props.selectAllPk}"。`,
    //     }));
    // }
    if (pkOnly.value) {
      const ids = res?.[props.selectAllPk];

      if (Array.isArray(ids)) {
        listAllSelect = ids;
      } else {
        listAllSelect = [];
        warnOnce(tBy({
          km: `រកមិនឃើញ "${props.selectAllPk}" ជា array នៅក្នុង API response ទេ។`,
          en: `"${props.selectAllPk}" was not found as an array in the API response.`,
          zh: `API 响应中未找到数组类型的 "${props.selectAllPk}"。`,
        }));
      }
    } else {
      listAllSelect = [];
    }
    // if (isNotEmpty(props.api?.where)) res = res?.[props.api.where];
    if (isNotEmpty(props.api?.where)) res = res?.[props.api.where] ?? res;
    emits("update:dataSrc", res);
    if (isNotEmpty(res?.dataSrc)) res = res.dataSrc;
    if (props.stateKey) emits("onSaveState", save(body, res ?? []));
    return res ?? [];
  } catch (e) {
    // !alive ||
    if ( mine.signal.aborted) return null;
    if (mine.signal.aborted) return null; // superseded by a newer request: stay silent
    lastSig = "";
    toast.add({ color: "red", title: `${isNotEmpty(e?.Message) ? e.Message : e}` });
    return [];
  } finally {
    // alive && 
    if (ctl === mine) loading.value = false;
  }
}

async function __headload(force = false) {
  const res = await getData(force);
  if (res) resultData.value = Array.isArray(res) ? copyWith(res) : [];
}
onErrorCaptured((err, _inst, info) => {
  console.error("[RTableTank] render error:", info, err);
  warnOnce(tBy({
    km: `មានកំហុសពេលបង្ហាញទិន្នន័យ (${info}): ${err?.message ?? err}`,
    en: `Render error (${info}): ${err?.message ?? err}`,
    zh: `渲染出错（${info}）：${err?.message ?? err}`,
  }));
  return false;
});
async function load(force = false) {
  const res = await getData(force);
  // if (!alive || !res) return;
  // if (!res) return;
  if (!Array.isArray(res)) warnOnce(tBy({
    km: "API response មិនមែនជា array ទេ។ សូមពិនិត្យ `api.where` ឬទម្រង់ response (`dataSrc`)។",
    en: "API response is not an array. Check `api.where` or the response shape (`dataSrc`).",
    zh: "API 响应不是数组。请检查 `api.where` 或响应结构（`dataSrc`）。",
  }));
  resultData.value = Array.isArray(res) ? copyWith(res) : [];
  console.log("[RTableTank] assigned", { got: Array.isArray(res) ? res.length : typeof res, now: resultData.value.length });
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
  // if (!alive) return;
  booting = false;
  ready = true;
}

// ───────────── events (same names as OCTable) ─────────────
async function searchTable(s) {
  runSearch.cancel();
  emits("onSearching", s);
  query.value = s ?? "";
  setPag({ ...pag.value, pageIndex: 0 });
  if (api.value) await load();
  else { table.setGlobalFilter(query.value || undefined); save(); }
}
// function clearSearch() { searching.value = ""; searchTable(""); }
// live search: debounced, no Enter needed
const runSearch = debounce((s) => {
  if ((s ?? "") !== query.value) searchTable(s);
}, 300);
off.push(() => runSearch.cancel());

watch(searching, (s) => {
  if (ready) runSearch(s);
});

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

  const _hide = new Set();
  // if (!opts.value.fixedColumns && !opts.value.scrollX) { //V1
  //   const cur = BP.findIndex(([, max]) => window.innerWidth <= max);
  //   const forced = (d) => classes(d).includes("none") || classes(d).some((k) => {
  //     const [, kind, name] = k.match(/^(min|max|not)-(.+)$/) ?? [];
  //     const i = BP.findIndex(([n]) => n === name);
  //     return kind && i > -1 && (kind === "min" ? cur < i : kind === "max" ? cur > i : cur === i);
  //   });
  //   const shown = colDefs.value.filter((d) => !(d.id in cfgHidden.value));
  //   shown.filter(forced).forEach((d) => hide.add(d.id));
  //   let width = sum(shown.filter((d) => !hide.has(d.id)).map((d) => w[d.id] ?? 0));
  //   const avail = el.clientWidth;
  //   if (hide.size || width > avail) {
  //     width += CTL_W;
  //     shown.filter((d) => !hide.has(d.id) && !classes(d).includes("all"))
  //       .sort((a, b) => (b.meta.responsivePriority ?? 1e4) - (a.meta.responsivePriority ?? 1e4) || b.meta.idx - a.meta.idx)
  //       .forEach((d) => { if (width > avail) { hide.add(d.id); width -= w[d.id] ?? 0; } });
  //   }
  // }
  const hide = new Set();
  const _mode = opts.value.responsive ?? "class"; // 'class' | 'auto' | false
  const __mode = opts.value.responsive ?? "auto"; // 'auto' (OCTable behavior) | 'class' (tokens only) | false
  const r = opts.value.responsive;
  const mode = r === false ? false : r === "class" ? "class" : "auto"; // object/true/'auto' → auto
  if (mode !== false && !opts.value.fixedColumns && !opts.value.scrollX) {
    const cur = BP.findIndex(([, max]) => window.innerWidth <= max);
    const forced = (d) => classes(d).includes("none") || classes(d).some((k) => {
      const [, kind, name] = k.match(/^(min|max|not)-(.+)$/) ?? [];
      const i = BP.findIndex(([n]) => n === name);
      return kind && i > -1 && (kind === "min" ? cur < i : kind === "max" ? cur > i : cur === i);
    });
    const shown = colDefs.value.filter((d) => !(d.id in cfgHidden.value));
    shown.filter((d) => forced(d) && !classes(d).includes("all")).forEach((d) => hide.add(d.id));

    if (mode === "auto") { // opt-in: also collapse by priority when it overflows
      let width = sum(shown.filter((d) => !hide.has(d.id)).map((d) => w[d.id] ?? 0));
      const _avail = el.clientWidth;
      const avail = el.clientWidth - 2;
      if (hide.size || width > avail) {
        width += CTL_W;
        shown.filter((d) => !hide.has(d.id) && !classes(d).includes("all")) //I added && !classes(d).includes("all") to the forced filter, so all always wins, as in DataTables.
          .sort((a, b) => (b.meta.responsivePriority ?? 1e4) - (a.meta.responsivePriority ?? 1e4) || b.meta.idx - a.meta.idx)
          .forEach((d) => { if (width > avail) { hide.add(d.id); width -= w[d.id] ?? 0; } });
      }
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
  const minH = `${opts.value.scrollY ?? 400}px`;
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

const _refit = async () => { await recalc(); fit(); };
const refit = async () => { if (dragging) return; await recalc(); fit(); };
const layout = debounce(refit, 200);

watch([tableData, colDefs, () => props.showTemplate, hasBtns], refit, { flush: "post" });
watch(() => screen.isMobile, () => refit());

let lastW = 0;
onMounted(async () => {
  select.value ??= [];
  fit();            // lock the original height before the first request
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
  console.log("[RTableTank] after boot", {
    resultData: resultData.value.length, tableRows: table.getRowModel().rows.length, total: total.value,
  });
  validate();
  refit();
});


/* ── Row reorder (local data) ── */
const canReorderNow = computed(() => { //// allow data api rowRecorder 
  if (!opts.value.rowReorder || isShowSelected.value) return false;
  if (api.value) return !loading.value;
  return !sorting.value.length && !query.value;
});

// const canReorderNow = computed(() =>
//   !!opts.value.rowReorder && !api.value && !isShowSelected.value
//   && !sorting.value.length && !query.value);


  let sortable, startNext = null;

function __moveRow(from, to, e) { // /// don't allow data api rowRecorder 
  const before = resultData.value;
  const after = [...before];
  const [moved] = after.splice(from, 1);
  after.splice(to, 0, moved);

  const lo = Math.min(from, to), hi = Math.max(from, to);
  const diff = after.slice(lo, hi + 1).map((newData, k) => ({
    oldPosition: before.indexOf(newData), newPosition: lo + k, oldData: before[lo + k], newData,
  }));

  resultData.value = after;
  save();
  emits("onRowReorder", e, diff, { row: moved });
}


function moveRow(from, to, e) {/// allow data api rowRecorder 
  const before = resultData.value;
  const after = [...before];
  const [moved] = after.splice(from, 1);
  after.splice(to, 0, moved);

  const offset = api.value && opts.value.paging ? pag.value.pageIndex * pag.value.pageSize : 0;
  const lo = Math.min(from, to), hi = Math.max(from, to);
  const diff = after.slice(lo, hi + 1).map((newData, k) => ({
    oldPosition: offset + before.indexOf(newData),
    newPosition: offset + lo + k,
    oldData: before[lo + k],
    newData,
  }));

  resultData.value = after;
  save();
  emits("onRowReorder", e, diff, { row: moved, offset, page: page.value, pageSize: record.value });
}

// onMounted(async () => { // with local data only
//   console.log("[RTableTank] reorder-------------------", {
//   rowReorder: opts.value.rowReorder, api: !!api.value, can: canReorderNow.value,
//   sorting: sorting.value, query: query.value, hasSortable: !!sortable,
//   grips: refBody.value?.querySelectorAll(".oc-drag-handle").length,
// });
//   const { default: Sortable } = await import("sortablejs"); // client only, SSR-safe
//   // if (!refBody.value) return;
//   if (!opts.value.rowReorder || api.value) return;
//   // let Sortable;
//   // try { ({ default: Sortable } = await import("sortablejs")); }
//   // catch { return warnOnce(tBy({
//   //   km: "`rowReorder` ត្រូវការ package `sortablejs`: npm i sortablejs",
//   //   en: "`rowReorder` needs the `sortablejs` package: npm i sortablejs",
//   //   zh: "`rowReorder` 需要 `sortablejs` 包：npm i sortablejs",
//   // })); } //The early return also stops Sortable from loading on tables that don’t use reordering. That means canReorderNow can’t toggle it later, which is fine because rowReorder and api are static in practice.
//   // if (!refBody.value) return;
//   sortable = Sortable.create(refBody.value, {
//     draggable: "tr.rt-row",          // child rows are not draggable
//     filter: "input, button, a, textarea, select",
//     handle: ".oc-drag-handle",   // replaces filter / preventOnFilter
//     // preventOnFilter: false,          // checkboxes and buttons still work
//     animation: 200,
//     easing: "cubic-bezier(0.2, 0, 0, 1)",
//     ghostClass: "rt-ghost",          // the slot where the row will land
//     chosenClass: "rt-chosen",
//     disabled: !canReorderNow.value,
//     onStart: (e) => { startNext = e.item.nextSibling; },
//     onEnd: (e) => {
//       // Sortable moved the DOM node itself. Put it back so Vue's vdom stays in sync,
//       // then let Vue re-render from the data.
//       e.from.insertBefore(e.item, startNext);
//       const a = e.oldDraggableIndex, b = e.newDraggableIndex;
//       if (a == null || b == null || a === b) return;
//       const from = rows.value[a]?.index, to = rows.value[b]?.index;
//       if (from != null && to != null) moveRow(from, to, e);
//     },
//   });
//   off.push(() => sortable?.destroy());
// });

// let Sortable;
async function __initSortable() {
  // const want = !!opts.value.rowReorder && !api.value; // ///don't  allow data api rowRecorder 
  // const want = !!opts.value.rowReorder;   // was: && !api.value ///// allow data api rowRecorder 
  // if (!want) { sortable?.destroy(); sortable = null; return; }
  const want = !!opts.value.rowReorder;
  if (!want || !refBody.value) { sortable?.destroy(); sortable = null; return; }
  if (sortable && sortable.el !== refBody.value) { sortable.destroy(); sortable = null; } // tbody was re-created
  if (sortable) return;
  if (sortable || !refBody.value) return;
  const { default: Sortable } = await import("sortablejs"); // client only, SSR-safe
  if (!refBody.value) return;
  // if (!Sortable) {
  //   try { ({ default: Sortable } = await import("sortablejs"));
  //   // if (!alive) return; 
  // }
  //   catch { return warnOnce(tBy({
  //     km: "`rowReorder` ត្រូវការ package `sortablejs`: npm i sortablejs",
  //     en: "`rowReorder` needs the `sortablejs` package: npm i sortablejs",
  //     zh: "`rowReorder` 需要 `sortablejs` 包：npm i sortablejs",
  //   })); }
  // }
  sortable = Sortable.create(refBody.value, {
    draggable: "tr.rt-row",
    // handle: ".oc-drag-handle",  This is don't allow hand corsor move row recorder      // filter removed: handle is enough
    animation: 200,
    easing: "cubic-bezier(0.2, 0, 0, 1)",
    ghostClass: "rt-ghost",
    chosenClass: "rt-chosen",
    disabled: !canReorderNow.value,
    // onStart: (e) => { startNext = e.item.nextSibling; },
    // onEnd: (e) => {
    //   e.from.insertBefore(e.item, startNext);
    //   const a = e.oldDraggableIndex, b = e.newDraggableIndex;
    //   if (a == null || b == null || a === b) return;
    //   const from = rows.value[a]?.index, to = rows.value[b]?.index;
    //   if (from != null && to != null) moveRow(from, to, e);
    // },
    onStart: (e) => { startNext = e.item.nextSibling; },
    onEnd: (e) => {
      const parent = e.from;
      if (parent?.isConnected && e.item?.isConnected) {
        // put the node back so Vue's vdom stays in sync
        parent.insertBefore(e.item, startNext?.parentNode === parent ? startNext : null);
      }
      startNext = null;
      const a = e.oldDraggableIndex, b = e.newDraggableIndex;
      if (a == null || b == null || a === b) return;
      const from = rows.value[a]?.index, to = rows.value[b]?.index;
      if (from != null && to != null) moveRow(from, to, e);
    },
  });
}

// onMounted(initSortable);
// watch(() => opts.value.rowReorder, () => nextTick(initSortable)); /// allow data api rowRecorder 
// // watch(() => [opts.value.rowReorder, !!api.value], () => nextTick(initSortable)); ///don't  allow data api rowRecorder 
// onBeforeUnmount(() => { sortable?.destroy(); sortable = null; });
// watch(canReorderNow, (v) => sortable?.option("disabled", !v));

let Sortable, initing = false, dragging = false;

function destroySortable() {
  try { sortable?.destroy(); } catch {}
  sortable = null;
}
async function initSortable() {
  if (!opts.value.rowReorder || !refBody.value) return destroySortable();
  if (sortable && sortable.el !== refBody.value) destroySortable(); // tbody was re-created
  if (sortable || initing) return;
  initing = true;
  try {
    Sortable ??= (await import("sortablejs")).default;
    if (sortable || !refBody.value || !opts.value.rowReorder) return; // re-check after the await
    sortable = Sortable.create(refBody.value, {
      draggable: "tr.rt-row",
      animation: 200,
      easing: "cubic-bezier(0.2, 0, 0, 1)",
      ghostClass: "rt-ghost",
      chosenClass: "rt-chosen",
      disabled: !canReorderNow.value,
      onStart: (e) => { dragging = true; startNext = e.item.nextSibling; },
      onEnd: (e) => {
        dragging = false;
        const parent = e.from;
        if (parent?.isConnected && e.item?.isConnected)
          parent.insertBefore(e.item, startNext?.parentNode === parent ? startNext : null);
        startNext = null;
        const a = e.oldDraggableIndex, b = e.newDraggableIndex;
        if (a == null || b == null || a === b) return;
        const from = rows.value[a]?.index, to = rows.value[b]?.index;
        if (from != null && to != null) moveRow(from, to, e);
      },
    });
  } finally {
    initing = false;
  }
}
onMounted(initSortable);
watch(() => opts.value.rowReorder, () => nextTick(initSortable));
watch(canReorderNow, (v) => sortable?.option("disabled", !v));
onBeforeUnmount(destroySortable);

/* ── Row reorder (card template) ── */
const refCardScroll = ref();
let cardSortable = null;

async function initCardSortable() {
  const want = !!opts.value.rowReorder && props.showTemplate;
  const root = refCardScroll.value;
  // container = options.cardContainer (selector) or the first element the slot renders
  const el = want && root ? (opts.value.cardContainer ? root.querySelector(opts.value.cardContainer) : root.firstElementChild) : null;
  if (!el) { cardSortable?.destroy(); cardSortable = null; return; }
  if (cardSortable && cardSortable.el !== el) { cardSortable.destroy(); cardSortable = null; } // re-created by v-if / slot
  if (cardSortable) return;

  const { default: Sortable } = await import("sortablejs");
  if (!el.isConnected) return;
  el.classList.add("rt-card-sortable");
  let next = null;
  cardSortable = Sortable.create(el, {
    ...(opts.value.cardSelector ? { draggable: opts.value.cardSelector } : {}),
    ...(opts.value.cardHandle ? { handle: opts.value.cardHandle } : {}),
    animation: 200,
    easing: "cubic-bezier(0.2, 0, 0, 1)",
    ghostClass: "rt-ghost",
    chosenClass: "rt-chosen",
    disabled: !canReorderNow.value,
    onStart: (e) => { next = e.item.nextSibling; },
    onEnd: (e) => {
      if (e.from?.isConnected && e.item?.isConnected) // give the DOM back to Vue, then re-render from data
        e.from.insertBefore(e.item, next?.parentNode === e.from ? next : null);
      next = null;
      const a = e.oldDraggableIndex ?? e.oldIndex, b = e.newDraggableIndex ?? e.newIndex;
      if (a == null || b == null || a === b) return;
      const from = rows.value[a]?.index, to = rows.value[b]?.index;
      if (from != null && to != null) moveRow(from, to, e);
    },
  });
}

watch([() => props.showTemplate, () => opts.value.rowReorder, loading, rows],
  () => nextTick(initCardSortable), { flush: "post" });
watch(canReorderNow, (v) => cardSortable?.option("disabled", !v));
onMounted(initCardSortable);
onBeforeUnmount(() => { cardSortable?.destroy(); cardSortable = null; });

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


// ───────────── usage checks (dev only) ─────────────
const CHECK = import.meta.dev && import.meta.client;
const warned = new Set();
const attrs = useAttrs();
const inst = getCurrentInstance();

const _KNOWN_OPTS = ["isScroll", "scrollX", "info", "searching", "paging", "reload", "order",
  "lengthMenu", "pageLength", "showNoData", "fixedColumns", "rowReorder"];
const KNOWN_OPTS = ["isScroll", "scrollY", "scrollX", "info", "destroy", "retrieve", "searching",
  "paging", "reload", "order", "responsive", "lengthMenu", "pageLength", "layout", "showNoData",
  "fixedColumns", "rowReorder", "classSearch", "enableRowSelection","cardContainer", "cardSelector", "cardHandle"];
const _KNOWN_COL = ["id", "title", "data", "render", "orderable", "className", "hidden",
  "alignRight", "sortData", "isLineClamp", "responsivePriority"];
const KNOWN_COL = ["id", "title", "data", "render", "header", "orderable", "className", "hidden",
  "alignRight", "align", "sortData", "isLineClamp", "responsivePriority", "type", "format", "currency",
  "formatOptions", "emptyText", "width", "minWidth", "maxWidth", "cellClass", "headerClass", "ellipsis"];
// and in KNOWN_OPTS add: "responsive"
const IGNORED_PROPS = ["waitFilter"]; // accepted by RTankTable only

// the message is already translated, so each language dedupes on its own text
function warnOnce(msg) {
  if (!CHECK || warned.has(msg)) return;
  warned.add(msg);
  console.warn(`[RTableTank] ${msg}`);
  toast.add({ color: "warning", title: "RTableTank", description: msg, duration: 8000 });
}

// "did you mean" helper (edit distance <= 2)
const dist = (a, b) => {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
};
const suggest = (key, list) => {
  const k = key.toLowerCase();
  const best = list.map((n) => [n, dist(k, n.toLowerCase())]).sort((x, y) => x[1] - y[1])[0];
  return best && best[1] <= 2 ? best[0] : null;
};
const hint = (key, list) => {
  const s = suggest(key, list);
  return s ? tBy({
    km: ` តើអ្នកចង់ប្រើ \`${s}\` មែនទេ?`,
    en: ` Did you mean \`${s}\`?`,
    zh: ` 您是想用 \`${s}\` 吗？`,
  }) : "";
};

function checkProps() {
  const p = props, raw = p.api;

  // unknown / misspelled props and listeners
  const known = Object.keys(p);
  const events = Object.keys(inst?.emitsOptions ?? {});
  for (const key of Object.keys(attrs)) {
    if (["class", "style", "id"].includes(key) || /^(data|aria)-/.test(key)) continue;
    if (/^on[A-Z]/.test(key)) {
      const ev = key[2].toLowerCase() + key.slice(3); // onOnRowReorder → onRowReorder
      const s = events.includes(ev) ? null : suggest(ev, events);
      if (s) warnOnce(tBy({
        km: `Listener \`${key}\` មិនមែនជា event របស់ component នេះទេ។${hint(ev, events)}`,
        en: `Listener \`${key}\` is not an event of this component.${hint(ev, events)}`,
        zh: `监听器 \`${key}\` 不是此组件的事件。${hint(ev, events)}`,
      }));
      continue;
    }
    const name = camelize(key);
    if (IGNORED_PROPS.includes(name)) warnOnce(tBy({
      km: `Prop \`${name}\` ប្រើបានតែនៅក្នុង RTankTable ប៉ុណ្ណោះ ហើយត្រូវបានមិនអើពើនៅទីនេះ។`,
      en: `Prop \`${name}\` is accepted by RTankTable only and is ignored here.`,
      zh: `属性 \`${name}\` 仅 RTankTable 支持，在此被忽略。`,
    }));
    else if (suggest(name, known)) warnOnce(tBy({
      km: `មិនស្គាល់ prop \`${key}\`។${hint(name, known)}`,
      en: `Unknown prop \`${key}\`.${hint(name, known)}`,
      zh: `未知属性 \`${key}\`。${hint(name, known)}`,
    }));
  }

  // data source
  if (!api.value && !p.data && !p.stateKey) warnOnce(tBy({
    km: "ត្រូវផ្តល់ `api` ឬ `data` យ៉ាងហោចណាស់មួយ។",
    en: "Provide either `api` or `data`.",
    zh: "请提供 `api` 或 `data`。",
  }));
  if (api.value && p.data?.length) warnOnce(tBy({
    km: "បានកំណត់ទាំង `api` និង `data`។ `data` ត្រូវបានមិនអើពើក្នុងរបៀប API។",
    en: "Both `api` and `data` are set. `data` is ignored in API mode.",
    zh: "同时设置了 `api` 和 `data`。API 模式下 `data` 会被忽略。",
  }));
  if (p.data != null && !Array.isArray(p.data)) warnOnce(tBy({
    km: "`data` ត្រូវតែជា array។",
    en: "`data` must be an array.",
    zh: "`data` 必须是数组。",
  }));
  if (p.columns != null && !Array.isArray(p.columns)) warnOnce(tBy({
    km: "`columns` ត្រូវតែជា array។",
    en: "`columns` must be an array.",
    zh: "`columns` 必须是数组。",
  }));
  if (!p.columns?.length && !p.data?.length && !api.value) warnOnce(tBy({
    km: "មិនមាន `columns` និង `data` ទេ ដូច្នេះគ្មានអ្វីត្រូវបង្ហាញ។",
    en: "No `columns` and no `data`: nothing to render.",
    zh: "没有 `columns` 也没有 `data`：无内容可渲染。",
  }));

  // api shape
  if (raw && typeof raw === "object" && (typeof raw.url !== "string" || !raw.url)) warnOnce(tBy({
    km: "object `api` ត្រូវការ `url` ជា string។",
    en: "`api` object needs a string `url`.",
    zh: "`api` 对象需要字符串类型的 `url`。",
  }));
  if (raw?.method && !/^(get|post|put|patch|delete)$/i.test(raw.method)) warnOnce(tBy({
    km: `api.method "${raw.method}" មិនមែនជា HTTP method ត្រឹមត្រូវទេ។`,
    en: `api.method "${raw.method}" is not a valid HTTP method.`,
    zh: `api.method "${raw.method}" 不是有效的 HTTP 方法。`,
  }));
  if (raw?.filter != null && (typeof raw.filter !== "object" || Array.isArray(raw.filter))) warnOnce(tBy({
    km: "`api.filter` ត្រូវតែជា plain object។",
    en: "`api.filter` must be a plain object.",
    zh: "`api.filter` 必须是普通对象。",
  }));
  if (raw?.where != null && typeof raw.where !== "string") warnOnce(tBy({
    km: "`api.where` ត្រូវតែជា string key នៃ response។",
    en: "`api.where` must be a string key of the response.",
    zh: "`api.where` 必须是响应中的字符串键。",
  }));

  // selection
  if (p.selectAllPk && !p.selectedPk) warnOnce(tBy({
    km: "`selectAllPk` ត្រូវការ `selectedPk`។",
    en: "`selectAllPk` requires `selectedPk`.",
    zh: "`selectAllPk` 需要同时设置 `selectedPk`。",
  }));
  if (p.hideGroupBtnSelect && !p.selectedPk) warnOnce(tBy({
    km: "`hideGroupBtnSelect` គ្មានប្រសិទ្ធភាពទេ ប្រសិនបើគ្មាន `selectedPk`។",
    en: "`hideGroupBtnSelect` has no effect without `selectedPk`.",
    zh: "没有 `selectedPk` 时，`hideGroupBtnSelect` 不起作用。",
  }));
  if (p.selectedPk && select.value != null && !Array.isArray(select.value)) warnOnce(tBy({
    km: "នៅពេលមាន `selectedPk` v-model ត្រូវតែជា array។",
    en: "v-model must be an array when `selectedPk` is set.",
    zh: "设置 `selectedPk` 时，v-model 必须是数组。",
  }));
  if (pkOnly.value && sel.value.some((x) => x && typeof x === "object")) warnOnce(tBy({
    km: "ពេលប្រើ `api` + `selectAllPk` v-model ផ្ទុក primary key មិនមែន row object ទេ។",
    en: "With `api` + `selectAllPk`, v-model holds primary keys, not row objects.",
    zh: "使用 `api` + `selectAllPk` 时，v-model 保存的是主键，而不是行对象。",
  }));

  // misc
  if (p.showTemplate && !slots.template) warnOnce(tBy({
    km: "`showTemplate` ជា true ប៉ុន្តែគ្មាន slot `template` ទេ។",
    en: "`showTemplate` is true but the `template` slot is missing.",
    zh: "`showTemplate` 为 true，但缺少 `template` 插槽。",
  }));
  if (p.isTotalDetail && !slots.totalDetail) warnOnce(tBy({
    km: "`isTotalDetail` លាក់ footer ហើយជាទូទៅប្រើជាមួយ slot `totalDetail`។",
    en: "`isTotalDetail` hides the footer and is usually paired with the `totalDetail` slot.",
    zh: "`isTotalDetail` 会隐藏页脚，通常需要配合 `totalDetail` 插槽使用。",
  }));
  if (!(p.minWidth > 0)) warnOnce(tBy({
    km: "`minWidth` ត្រូវតែជាលេខវិជ្ជមាន។",
    en: "`minWidth` must be a positive number.",
    zh: "`minWidth` 必须是正数。",
  }));
  if (p.stateKey != null && !String(p.stateKey).trim()) warnOnce(tBy({
    km: "`stateKey` ត្រូវតែជា string មិនទទេ។",
    en: "`stateKey` must be a non-empty string.",
    zh: "`stateKey` 必须是非空字符串。",
  }));
}

function checkOptions() {
  const o = props.options ?? {};
  for (const k of Object.keys(o)) {
    if (!KNOWN_OPTS.includes(k) && suggest(k, KNOWN_OPTS)) warnOnce(tBy({
      km: `មិនស្គាល់ option \`${k}\`។${hint(k, KNOWN_OPTS)}`,
      en: `Unknown option \`${k}\`.${hint(k, KNOWN_OPTS)}`,
      zh: `未知选项 \`${k}\`。${hint(k, KNOWN_OPTS)}`,
    }));
  }

  const lm = opts.value.lengthMenu;
  if (!Array.isArray(lm) || !lm.length || lm.some((n) => !Number.isFinite(n) || n <= 0)) warnOnce(tBy({
    km: "`options.lengthMenu` ត្រូវតែជា array មិនទទេនៃលេខវិជ្ជមាន។",
    en: "`options.lengthMenu` must be a non-empty array of positive numbers.",
    zh: "`options.lengthMenu` 必须是由正数组成的非空数组。",
  }));
  if (o.pageLength != null) {
    if (!Number.isFinite(o.pageLength) || o.pageLength <= 0) warnOnce(tBy({
      km: "`options.pageLength` ត្រូវតែជាលេខវិជ្ជមាន។",
      en: "`options.pageLength` must be a positive number.",
      zh: "`options.pageLength` 必须是正数。",
    }));
    else if (api.value) warnOnce(tBy({
      km: "`options.pageLength` ត្រូវបានមិនអើពើក្នុងរបៀប API ហើយប្រើតម្លៃដំបូងនៃ `lengthMenu` ជំនួស។",
      en: "`options.pageLength` is ignored in API mode; the first `lengthMenu` value is used.",
      zh: "API 模式下会忽略 `options.pageLength`，改用 `lengthMenu` 的第一个值。",
    }));
    else if (Array.isArray(lm) && !lm.includes(o.pageLength)) warnOnce(tBy({
      km: `pageLength ${o.pageLength} មិនមានក្នុង lengthMenu ទេ ដូច្នេះ select ទំហំទំព័រនឹងមិនបង្ហាញវា។`,
      en: `pageLength ${o.pageLength} is not in lengthMenu, so the page-size select won't show it.`,
      zh: `pageLength ${o.pageLength} 不在 lengthMenu 中，因此每页条数选择器不会显示它。`,
    }));
  }

  const { order, fixedColumns: fc } = o;
  if (order) {
    if (!Number.isInteger(order.idx)) warnOnce(tBy({
      km: "`options.order.idx` ត្រូវតែជាចំនួនគត់។",
      en: "`options.order.idx` must be an integer.",
      zh: "`options.order.idx` 必须是整数。",
    }));
    if (order.dir && !/^(asc|desc)$/i.test(order.dir)) warnOnce(tBy({
      km: `options.order.dir "${order.dir}" ត្រូវតែជា "asc" ឬ "desc"។`,
      en: `options.order.dir "${order.dir}" must be "asc" or "desc".`,
      zh: `options.order.dir "${order.dir}" 必须是 "asc" 或 "desc"。`,
    }));
    else if (order.dir) {
      const target = colDefs.value.find((d) => d.meta.idx === order.idx);
      if (!target) warnOnce(tBy({
        km: `options.order.idx (${order.idx}) មិនត្រូវនឹងជួរឈរណាមួយទេ។ index រាប់បញ្ចូលជួរ control, checkbox និង action។`,
        en: `options.order.idx (${order.idx}) does not match any column. The index counts the control, checkbox and action columns.`,
        zh: `options.order.idx (${order.idx}) 没有匹配任何列。该索引包含控制列、复选框列和操作列。`,
      }));
      else if (!target.enableSorting) warnOnce(tBy({
        km: `options.order.idx (${order.idx}) ចង្អុលទៅជួរឈរដែលមិនអាចតម្រៀបបាន។`,
        en: `options.order.idx (${order.idx}) points to a non-sortable column.`,
        zh: `options.order.idx (${order.idx}) 指向了不可排序的列。`,
      }));
      else if (target.meta.hidden) warnOnce(tBy({
        km: `options.order.idx (${order.idx}) ចង្អុលទៅជួរឈរដែលលាក់ ("${target.meta.data}")។ ការតម្រៀបនឹងមិនអាចមើលឃើញ។`,
        en: `options.order.idx (${order.idx}) points to a hidden column ("${target.meta.data}"). The sort will be invisible.`,
        zh: `options.order.idx (${order.idx}) 指向了隐藏列 ("${target.meta.data}")，该排序将不可见。`,
      }));
    }
  }

  if (fc === true) warnOnce(tBy({
    km: "`options.fixedColumns: true` មិនត្រូវបានគាំទ្រនៅទីនេះទេ។ សូមប្រើ `{ start: n, end: n }`។",
    en: "`options.fixedColumns: true` is not supported here. Use `{ start: n, end: n }`.",
    zh: "此处不支持 `options.fixedColumns: true`，请使用 `{ start: n, end: n }`。",
  }));
  else if (fc && (typeof fc !== "object" || [fc.start, fc.end, fc.left, fc.right].some((n) => n != null && (!Number.isInteger(n) || n < 0)))) warnOnce(tBy({
    km: "`options.fixedColumns` ត្រូវតែជា `{ start, end }` ដែលជាចំនួនគត់មិនអវិជ្ជមាន។",
    en: "`options.fixedColumns` must be `{ start, end }` with non-negative integers.",
    zh: "`options.fixedColumns` 必须是 `{ start, end }`，且为非负整数。",
  }));

  if (o.rowReorder) {
    if (api.value) warnOnce(tBy({
      km: "`options.rowReorder` ដំណើរការតែជាមួយ `data` ក្នុងមូលដ្ឋាន មិនមែន `api` ទេ។",
      en: "`options.rowReorder` only works with local `data`, not `api`.",
      zh: "`options.rowReorder` 仅适用于本地 `data`，不适用于 `api`。",
    }));
    if (o.rowReorder && !inst?.vnode.props?.onOnRowReorder && (api.value || !props.stateKey)) warnOnce(tBy({ ///// allow data api rowRecorder 
      km: "`rowReorder` បានបើក ប៉ុន្តែគ្មាន listener `@on-row-reorder` ទេ។ លំដាប់ថ្មីនឹងមិនត្រូវបានរក្សាទុកទេ។",
      en: "`rowReorder` is on but there is no `@on-row-reorder` listener. The new order will not be saved.",
      zh: "已启用 `rowReorder`，但没有 `@on-row-reorder` 监听器，新的顺序不会被保存。",
    }));
    else if (!props.stateKey && !inst?.vnode.props?.onOnRowReorder) warnOnce(tBy({
      km: "`rowReorder` បានបើក ប៉ុន្តែគ្មាន listener `@on-row-reorder` និងគ្មាន `stateKey` ទេ។ លំដាប់ថ្មីនឹងមិនត្រូវបានរក្សាទុកនៅកន្លែងណាទេ។",
      en: "`rowReorder` is on but there is no `@on-row-reorder` listener and no `stateKey`. The new order will not be saved anywhere.",
      zh: "已启用 `rowReorder`，但没有 `@on-row-reorder` 监听器，也没有 `stateKey`。新的顺序不会被保存。",
    }));
  }
  if (o.responsive != null && typeof o.responsive !== "boolean" && typeof o.responsive !== "object"
    && !["class", "auto"].includes(o.responsive)) warnOnce(tBy({
    km: "`options.responsive` ត្រូវតែជា 'auto', 'class', boolean ឬ object។",
    en: "`options.responsive` must be 'auto', 'class', a boolean or an object.",
    zh: "`options.responsive` 必须是 'auto'、'class'、布尔值或对象。",
  }));
}

function checkColumns() {
  const list = props.columns;
  if (!Array.isArray(list)) return;
  const row0 = resultData.value[0];
  const seen = new Set();

  list.forEach((c, i) => {
    const at = `columns[${i}]${c?.title ? ` ("${c.title}")` : ""}`;
    if (!c || typeof c !== "object") return warnOnce(tBy({
      km: `${at} ត្រូវតែជា object។`,
      en: `${at} must be an object.`,
      zh: `${at} 必须是对象。`,
    }));

    for (const k of Object.keys(c)) {
      if (!KNOWN_COL.includes(k) && suggest(k, KNOWN_COL)) warnOnce(tBy({
        km: `${at}: មិនស្គាល់ key \`${k}\`។${hint(k, KNOWN_COL)}`,
        en: `${at}: unknown key \`${k}\`.${hint(k, KNOWN_COL)}`,
        zh: `${at}：未知键 \`${k}\`。${hint(k, KNOWN_COL)}`,
      }));
    }

    const key = c.id ?? c.data;
    if (key != null) {
      if (seen.has(String(key))) warnOnce(tBy({
        km: `id/data ជួរឈរ "${key}" ស្ទួន។`,
        en: `Duplicate column id/data "${key}".`,
        zh: `列 id/data "${key}" 重复。`,
      }));
      seen.add(String(key));
    }

    if (c.title == null) warnOnce(tBy({
      km: `${at}: ខ្វះ \`title\`។`,
      en: `${at}: missing \`title\`.`,
      zh: `${at}：缺少 \`title\`。`,
    }));
    if (c.data == null && c.render == null) warnOnce(tBy({
      km: `${at}: គ្មានទាំង \`data\` និង \`render\` ដូច្នេះវានឹងបោះពុម្ពទាំង row object។`,
      en: `${at}: has no \`data\` and no \`render\`, so it would print the whole row object.`,
      zh: `${at}：既没有 \`data\` 也没有 \`render\`，将会输出整个行对象。`,
    }));

    if (typeof c.render === "string") {
      if (c.render[0] !== "#") warnOnce(tBy({
        km: `${at}: \`render\` ជា string ត្រូវចាប់ផ្តើមដោយ "#" (ឈ្មោះ slot) ប៉ុន្តែទទួលបាន "${c.render}"។`,
        en: `${at}: string \`render\` must start with "#" (a slot name), got "${c.render}".`,
        zh: `${at}：字符串类型的 \`render\` 必须以 "#"（插槽名）开头，当前为 "${c.render}"。`,
      }));
      else if (!slots[c.render.slice(1)]) warnOnce(tBy({
        km: `${at}: ប្រើ render "${c.render}" ប៉ុន្តែគ្មាន slot នោះទេ។`,
        en: `${at}: uses render "${c.render}" but that slot is missing.`,
        zh: `${at}：使用了 render "${c.render}"，但缺少该插槽。`,
      }));
      // } else if (c.render != null && typeof c.render !== "function") warnOnce(tBy({
      //   km: `${at}: \`render\` ត្រូវតែជា "#slotName" ឬ function។`,
      //   en: `${at}: \`render\` must be "#slotName" or a function.`,
      //   zh: `${at}：\`render\` 必须是 "#slotName" 或函数。`,
      // }));
      } else if (c.render != null && typeof c.render !== "function" && typeof c.render !== "object") warnOnce(tBy({
        km: `${at}: \`render\` ត្រូវតែជា "#slotName", function, component ឬ { component, props }។`,
        en: `${at}: \`render\` must be "#slotName", a function, a component or { component, props }.`,
        zh: `${at}：\`render\` 必须是 "#slotName"、函数、组件或 { component, props }。`,
      }));

    if (c.orderable != null && typeof c.orderable !== "boolean") warnOnce(tBy({
      km: `${at}: \`orderable\` ត្រូវតែជា boolean។`,
      en: `${at}: \`orderable\` must be a boolean.`,
      zh: `${at}：\`orderable\` 必须是布尔值。`,
    }));
    if (c.isLineClamp && c.render != null) warnOnce(tBy({
      km: `${at}: \`isLineClamp\` មានអាទិភាពជាង ដូច្នេះ \`render\` ត្រូវបានមិនអើពើសម្រាប់តម្លៃមិនទទេ។`,
      en: `${at}: \`isLineClamp\` takes precedence, so \`render\` is ignored for non-empty values.`,
      zh: `${at}：\`isLineClamp\` 优先生效，因此非空值会忽略 \`render\`。`,
    }));
    if (c.responsivePriority != null && !Number.isFinite(c.responsivePriority)) warnOnce(tBy({
      km: `${at}: \`responsivePriority\` ត្រូវតែជាលេខ។`,
      en: `${at}: \`responsivePriority\` must be a number.`,
      zh: `${at}：\`responsivePriority\` 必须是数字。`,
    }));
    if (c.type && !(c.type in FMT)) warnOnce(tBy({
      km: `${at}: type "${c.type}" មិនត្រឹមត្រូវ។ ប្រើ ${Object.keys(FMT).join(", ")}។`,
      en: `${at}: unknown type "${c.type}". Use ${Object.keys(FMT).join(", ")}.`,
      zh: `${at}：未知类型 "${c.type}"，可用：${Object.keys(FMT).join(", ")}。`,
    }));

    if (c.sortData != null) {
      if (!Array.isArray(c.sortData)) warnOnce(tBy({
        km: `${at}: \`sortData\` ត្រូវតែជា array នៃ { data, title }។`,
        en: `${at}: \`sortData\` must be an array of { data, title }.`,
        zh: `${at}：\`sortData\` 必须是 { data, title } 数组。`,
      }));
      else c.sortData.forEach((e) => {
        if (!e?.data || !e?.title) warnOnce(tBy({
          km: `${at}: រាល់ item នៃ \`sortData\` ត្រូវមាន \`data\` និង \`title\`។`,
          en: `${at}: each \`sortData\` item needs \`data\` and \`title\`.`,
          zh: `${at}：每个 \`sortData\` 项都需要 \`data\` 和 \`title\`。`,
        }));
        else if (!colDefs.value.some((d) => d.id === e.data)) warnOnce(tBy({
          km: `${at}: sortData "${e.data}" មិនត្រូវនឹង id ជួរឈរណាមួយទេ។`,
          en: `${at}: sortData "${e.data}" does not match any column id.`,
          zh: `${at}：sortData "${e.data}" 没有匹配任何列 id。`,
        }));
      });
    }

    if (c.data && row0 && typeof row0 === "object" && get(row0, c.data) === undefined) warnOnce(tBy({
      km: `${at}: រកមិនឃើញ \`data\` "${c.data}" នៅលើជួរដេកទីមួយទេ។`,
      en: `${at}: \`data\` "${c.data}" was not found on the first row.`,
      zh: `${at}：在第一行中未找到 \`data\` "${c.data}"。`,
    }));
  });
}

function checkSlots() {
  if (slots.checkbox && !props.selectedPk) warnOnce(tBy({
    km: "slot `checkbox` ត្រូវការ `selectedPk`។",
    en: "The `checkbox` slot needs `selectedPk`.",
    zh: "`checkbox` 插槽需要设置 `selectedPk`。",
  }));
  if (slots.tdNull && !(hasCheck.value && !opts.value.fixedColumns)) warnOnce(tBy({
    km: "slot `tdNull` បង្ហាញតែនៅពេលមាន `selectedPk` ហើយ `fixedColumns` បិទ។",
    en: "The `tdNull` slot only renders when `selectedPk` is set and `fixedColumns` is off.",
    zh: "`tdNull` 插槽仅在设置了 `selectedPk` 且未启用 `fixedColumns` 时才会渲染。",
  }));
  if (slots.template && !props.showTemplate) warnOnce(tBy({
    km: "slot `template` ត្រូវបានមិនអើពើ លុះត្រាតែ `showTemplate` ជា true។",
    en: "The `template` slot is ignored unless `showTemplate` is true.",
    zh: "除非 `showTemplate` 为 true，否则 `template` 插槽会被忽略。",
  }));
}

function checkData() {
  const rows = resultData.value, pk = props.selectedPk;
  if (!rows.length) return;
  if (rows.some((r) => r == null || typeof r !== "object")) warnOnce(tBy({
    km: "ជួរដេកត្រូវតែជា object។",
    en: "Rows must be objects.",
    zh: "行数据必须是对象。",
  }));
  if (!pk) return;
  const vals = rows.map((r) => r?.[pk]);
  if (vals.some((v) => v == null)) warnOnce(tBy({
    km: `ជួរដេកខ្លះគ្មាន "${pk}" ទេ។ ការជ្រើសរើសនឹងប្រើ index ជួរដេកជំនួស ហើយនឹងខុសនៅពេលប្តូរទំព័រ។`,
    en: `Some rows have no "${pk}". Selection falls back to the row index and will break across pages.`,
    zh: `部分行没有 "${pk}"。选择功能会退回使用行索引，翻页后将出错。`,
  }));
  else if (new Set(vals).size !== vals.length) warnOnce(tBy({
    km: `តម្លៃ "${pk}" ស្ទួនគ្នាក្នុងជួរដេក។ id ជួរដេកជាន់គ្នា ដូច្នេះការជ្រើសរើស និងការបង្ហាញនឹងមានបញ្ហា។`,
    en: `Duplicate "${pk}" values in rows. Row ids collide, so selection and rendering will misbehave.`,
    zh: `行中 "${pk}" 的值重复。行 id 冲突，选择和渲染将出现异常。`,
  }));
}

function validate() {
  if (!CHECK) return;
  checkProps(); checkOptions(); checkColumns(); checkSlots(); checkData();
}

if (CHECK) watch(
  [() => props.columns, () => props.options, () => props.api, () => props.selectedPk, () => props.selectAllPk, resultData],
  validate, { flush: "post" },
);

//Short tips
/*
With server-side select all
With server-side select all
<RTableTank
  :api="apiConfig"
  selected-pk="Id"
  select-all-pk="SelectAllIds"
/>
 Without server-side select all
 <RTableTank
  :api="apiConfig"
  selected-pk="Id"
/>

- If your API doesn't support select all
remove: select-all-pk="SelectAllIds"

++ If you need Select All across every API page, keep select-all-pk="SelectAllIds" and implement that array in your backend.
++ If you only need Select All on the current page, remove select-all-pk and use selected-pk="Id".




V2 implement -> 
Two conventions for slots, with no render needed:

A parent slot named cell-<id> becomes the cell renderer for the column with that id or data.
A parent slot named header-<id> becomes its header.

Slot props now include value, row, cell, column, table, and the old cellData, rowData, rowIndex, colIndex. Unprovided #slot renders fall back to the formatted value.

Notes
Existing tables: columns that relied on auto-collapse now scroll horizontally instead. To restore the old behavior per table, set options: { responsive: 'auto' }. Otherwise add none or min-* tokens to the columns you want collapsed.
Escaping: a render function that returns a plain string is injected as HTML (legacy behavior). Return a VNode (h("span", v)) for user-supplied text.
Not included: per-type sorting functions. ISO date strings and numbers already sort correctly with the default sorter.


Columns use:
const columns = [
  { title: "User", data: "name", className: "all", render: "#user" },                   // slot, never collapses
  { title: "Salary", data: "salary", type: "currency", currency: "USD" },              // formatted, right-aligned
  { title: "Joined", data: "joinedAt", type: "date", width: 120 },                     // Intl date
  { title: "Active", data: "active", type: "boolean", align: "center" },
  { title: "Bio", data: "bio", ellipsis: true, maxWidth: 220, className: "min-tablet-l" }, // collapses below tablet-l
  { title: "Status", data: "status",
    cellClass: (v) => (v === "Active" ? "text-green-600" : "text-gray-400"),
    render: (v, _t, row, _m, { h }) => h(UBadge, { color: v === "Active" ? "success" : "neutral" }, () => v) },   // VNode
  { title: "Tags", data: "tags", render: (v, _t, _r, _m, { h }) => v.map((x) => h(UBadge, { key: x }, () => x)) }, // VNode[]
  { title: "Card", data: null, render: { component: MyCard, props: (v, row) => ({ user: row }) } },               // component
  { title: "Avatar", data: "avatar", render: MyAvatarComponent },                      // component: receives { value, row, meta }
  { title: "Name", data: "name", header: (_p, h) => h("b", "Name") },                  // custom header
  { title: "Notes", data: "notes", format: (v, row) => `${v} (${row.id})` },           // plain text formatter
];

Behavior (same as OCTable)
className	            Effect
all	never             collapses into the child row
min-width	            shrinks the column to its content (width: 1px, nowrap)
min-width             all	both
none	                always collapsed
never	                never shown (hidden from the table and the child row)
min-*, max-*, not-*	  collapse by breakpoint, e.g. min-tablet-l

Collapsing is now class-driven by default, so without a token nothing collapses on its own and the table scrolls horizontally. 
The old overflow behavior is opt-in with options.responsive: 'auto'. The values are 'class' (default), 'auto' and false (off).



How it behaves
Desktop and tablet: columns collapse until what remains fits. Nothing scrolls sideways. If the all columns alone are wider than the container, the overflow is clipped.
Mobile (< 768px): the same collapse runs first, and the remaining all and min-width columns scroll sideways only if they still don't fit.
options.responsive: 'class': collapse uses tokens only. This is the opt-in value from my last message.
options.responsive: false: nothing collapses.

I assumed screen.setSize is already called somewhere in your app, because OCTableHeader depends on the same store. 
If it isn't, screen.isMobile stays false (width 0 is < 768, so it would actually stay true), so check that it updates on resize.
*/
</script>

<style lang="scss">
$bd: 1px solid var(--border-table);
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

.rt-wrapper {
  --rt-bg: var(--r-table-bg);
  --rt-page: var(--bg-wrapper);
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;

  .oc-drag-handle {
    display: inline-flex;
    cursor: grab;
    &.disabled { cursor: not-allowed; opacity: 0.4; }
  }
  // .rt-table td.oc-drag-col {
  //   white-space: nowrap;
  //   width: 1px;
  //   padding: 8px 10px;

  //   .rt-expand { margin-right: 4px; }
  // }

  // .rt-table tbody tr.rt-draggable { cursor: grab; 
  //   // user-select: none; 
  // }
  // .rt-table tbody tr.rt-chosen { cursor: grabbing; }
  // .rt-table tbody tr.rt-ghost > td {
  //   background: color-mix(in srgb, var(--color-primary) 12%, transparent) !important;
  //   opacity: 0.7;
  // }

  .rt-table tbody tr.rt-draggable { cursor: grab; }
  .rt-table tbody tr.rt-draggable button,
  .rt-table tbody tr.rt-draggable a,
  .rt-table tbody tr.rt-draggable input { cursor: pointer; }   // controls keep the normal pointer
  .rt-table tbody tr.rt-chosen,
  .rt-table tbody tr.rt-chosen * { cursor: grabbing !important; }

  .rt-table td.rt-ellipsis { overflow: hidden; text-overflow: ellipsis; } // Allow auto isLineClamp to open if until truncated happen

  .rt-card-sortable > * { cursor: grab; } // card recorder
  .rt-card-sortable > .rt-chosen,
  .rt-card-sortable > .rt-chosen * { cursor: grabbing !important; }
  .rt-card-sortable > .rt-ghost { opacity: 0.5; outline: 2px dashed var(--color-primary); }

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

  // new
  .rt-scroll { overflow-x: hidden; overflow-y: auto; }        // never scroll sideways...
  &.is-mobile .rt-scroll { overflow-x: auto; }                // ...except on mobile
  .no-scroll-table .rt-scroll { overflow: visible; height: auto; } // keep this rule after the two above
  //----
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
    // .oc-checkbox-col { padding: 8px 10px !important; input { margin: 0 !important; } }
    .td-collapse { padding: 4px 8px !important; }
    &:not(.collapsed) .td-collapse { padding: 0 !important; }
    tr.rt-empty td { text-align: center; padding: 20px 10px; }
    .rt-clamp { cursor: default; }

    // inside .rt-table
    tr.rt-empty td { padding: 0; border-bottom: 0; text-align: center; }
    tr.rt-empty td { padding: 0; border-bottom: 0; text-align: center; }
    // tbody tr.rt-empty:hover > td { background: transparent; }
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

  // // expand / collapse control
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

  .rt-table td.dtr-control:not(.td-collapse) {
    position: relative;
    padding-left: 34px;
  }
  .rt-expand-wrap {
    position: absolute;
    top: 50%;
    left: 6px;
    transform: translateY(-50%);
    display: inline-flex;
  }
  // dedicated control column (checkbox tables) keeps the inline layout
  .rt-table td.td-collapse .rt-expand-wrap {
    position: static;
    transform: none;
  }

  // child row (collapsed columns)
  .rt-table tr.child td.child {
    padding: 0 10px;
    white-space: normal;

    ul.dtr-details {
      position: relative;
      display: grid;
      grid-template-columns: max-content max-content minmax(0, 1fr); // title | colon | data
      column-gap: 10px;
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
        display: grid;
        grid-template-columns: subgrid;   // every row shares the same column widths
        grid-column: 1 / -1;
        align-items: center;
        padding: 4px 0;
      }

      // .dtr-title {
      //   font-weight: 400;
      //   color: var(--color-w-b-2);
      //   white-space: nowrap;
      //   .multi-sort-wrapper { display: none; }

      //   // &::after { content: ":"; position: absolute; right: -4px; }
      // }
      .dtr-title {
        position: static;
        min-width: 0;
        padding: 0;
        font-weight: 400;
        color: var(--color-w-b-2);
        white-space: nowrap;

        &::before,
        &::after { content: none !important; }   // blocks the legacy ":" from any stylesheet

        .multi-sort-wrapper { display: none; }
      }

      .dtr-colon { color: var(--color-w-b-2); }
      .dtr-data { 
         min-width: 0;
        color: var(--color-w-b-1);
        white-space: normal;
        overflow-wrap: anywhere;
      }
    }

    .rt-loader {
      position: absolute;
      inset: 0;
      z-index: 10;
      min-height: 100px;
      overflow: hidden;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: color-mix(in srgb, var(--rt-bg) 70%, transparent);
      backdrop-filter: blur(1px);
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
// ── skeleton ──
  // .rt-skel { // old
  //   display: block;
  //   height: 12px;
  //   max-width: 220px;
  //   min-width: 28px;
  //   border-radius: 6px;
  //   background: linear-gradient(
  //     90deg,
  //     color-mix(in srgb, currentColor 8%, transparent) 25%,
  //     color-mix(in srgb, currentColor 16%, transparent) 37%,
  //     color-mix(in srgb, currentColor 8%, transparent) 63%
  //   );
  //   background-size: 400% 100%;
  //   animation: rt-shimmer 1.4s ease infinite;

  //   &.rt-skel-box { width: 15px; min-width: 15px; height: 15px; border-radius: 4px; }
  //   &.rt-skel-dot { width: 14px; min-width: 14px; height: 14px; border-radius: 50%; }
  //   &.rt-skel-pill { width: 64px; height: 24px; border-radius: 8px; }
  // }

  .rt-table tbody tr.rt-skel-row {
    pointer-events: none;
    td { padding-top: 12px; padding-bottom: 12px; border-bottom-color: transparent;}
  }
  .rt-table tbody tr.rt-skel-row:hover > td { background: transparent; }

  .rt-scroll:has(.rt-skel-row) { overflow: hidden; } /* Stops a scrollbar flashing while the skeleton rows overflow the fixed height: */
  .rt-table.is-skeleton thead th { border-bottom-color: transparent; }

  @keyframes rt-shimmer {
    0% { background-position: 100% 50%; }
    100% { background-position: 0 50%; }
  }

  @media (prefers-reduced-motion: reduce) {
    .rt-skel { animation: none; }
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
  .rt-table tbody tr.rt-empty:hover > td { background: transparent; }
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


.r-table-checkbox {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  line-height: 1;

  input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;

    &:checked + .r-table-checkbox__box {
      border-color: var(--c-accent);
      background: color-mix(in srgb, var(--c-accent) 10%, var(--c-surface));

      i {
        opacity: 1;
        transform: scale(1);
      }
    }

    &:focus-visible + .r-table-checkbox__box {
      outline: 2px solid color-mix(in srgb, var(--c-accent) 35%, transparent);
      outline-offset: 3px;
    }

    &:disabled + .r-table-checkbox__box {
      opacity: .45;
      cursor: not-allowed;
    }
  }

  &__box {
    display: grid;
    width: 16px;
    height: 16px;
    place-items: center;
    border: 1.5px solid var(--color-w-b-3);
    border-radius: 4px;
    background: var(--c-surface);
    transition: all var(--t-fast) var(--ease-out);

    i {
      color: var(--c-accent);
      font-size: 11px;
      font-weight: 700;
      opacity: 0;
      transform: scale(.5);
      transition: all var(--t-fast) var(--ease-out);
    }
  }

  &:hover input:not(:disabled) + &__box {
    border-color: var(--c-accent);
  }
}
</style>