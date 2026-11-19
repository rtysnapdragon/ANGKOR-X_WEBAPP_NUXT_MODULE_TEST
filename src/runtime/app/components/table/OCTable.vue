<template>
  <div class="ocs-wrapper-table" ref="ref_oc_table_h">
    <!-- header label -->
    <slot name="headerTable" v-if="$slots.headerTable" />
    <!-- Header -->
    <OCTableHeader :options="options" v-model:selected="record" v-model:searching="searching"
      @search-table="searchTable(searching)" @clear-search="clearSearch" @reload="fnReload">
      <template #headerLeft v-if="$slots.headerLeft">
        <slot name="headerLeft" />
      </template>
      <template #headerCenter v-if="$slots.headerCenter">
        <slot name="headerCenter" />
      </template>
      <template #headerApplyFilter v-if="$slots.headerApplyFilter">
        <slot name="headerApplyFilter" />
      </template>
      <template #headerRight v-if="$slots.headerRight">
        <slot name="headerRight" />
      </template>
    </OCTableHeader>

    <slot name="middleTable" v-if="$slots.middleTable"></slot>

    <!-- show template -->
    <div class="oc-wrapper-card" ref="ref_oc_wrapper_card" v-if="showTemplate">
      <slot name="loading" v-if="$slots.loading && loading"></slot>

      <div :class="`w-full h-full min-h-[100px] flex justify-center items-center oc-loader ${loading ? '' : 'oc-hide-loader'
        }`" v-if="!$slots.loading && loading && showTemplate">
        <OCLoading :loading="true" />
      </div>

      <div class="oc-nav-card-scroll" ref="refShowTemplate" v-if="!$slots.loading || !loading">
        <slot name="template" v-bind="[dataTemplate]"></slot>
      </div>

      <div class="flex justify-center items-center absolute top-0 w-full h-full"
        v-if="!dataTemplate.length && !loading && options.showNoData">
        <div class="flex items-center color-w-b-2 font-normal gap-1 text-[14px]"
          v-if="!dataTemplate.length && !searching">
          <i class="ri-database-2-fill"></i><span>{{ $t("data_not_found") }}</span>
        </div>
        <div class="flex items-center color-w-b-2 font-normal gap-1 text-[14px]" v-else>
          <i class="ri-search-2-line"></i><span>{{ $t("no_results_for") }} " {{ searching }} "</span>
        </div>
      </div>
    </div>
    <!-- Table -->
    <div class="flex flex-wrap gap-1.5 pt-2.5 sticky"
      v-if="!hideGroupBtnSelect && (isNotEmpty(selectAllPk) || (columnRefs.includes('checkbox') && isEmpty(api)))">
      <div class="btn" @click="fnShowSelected" :class="isShowSelected ? 'active' : ''">
        <i class="ri-function-fill"></i><span>{{ $t("selected") }}: {{ select?.length }}</span>
      </div>
      <div class="btn" @click="fnSelectAllOnePage" v-if="isNotEmpty(api)">
        <i class="ri-checkbox-circle-fill"></i>
        <span>{{ $t("select_all_this_page") }}</span>
      </div>
      <div class="btn" @click="fnListAllSelect"
        v-if="isNotEmpty(selectAllPk) || (columnRefs.includes('checkbox') && isEmpty(api))">
        <i class="ri-checkbox-circle-fill"></i>
        <span>{{ $t("select_all") }}: {{ total }}</span>
      </div>
      <div class="btn" @click="fnClearAll">
        <i class="ri-close-circle-fill"></i><span>{{ $t("clear_all") }}</span>
      </div>
    </div>

    <div class="container-table" ref="ref_container_table" v-show="!showTemplate" :class="[
      haveBorder ? 'have-border' : '',
      isHasCheck ? '' : 'is-not-check',
      options.isScroll ? '' : 'no-scroll-table',
    ]">
      <DataTable :key="keyTable" ref="ocTable" :columns="columns" :options="options" :data="resultData"
        class="display nowrap has-collapse" width="100%" @row-reorder="onRowReorder">
        <template v-for="col in columnRefs" :key="col" #[col]="props">
          <slot :name="col" v-bind="props" class="w-full"></slot>
          <input v-if="col == 'checkbox' && selectedPk" type="checkbox" :checked="setInitChecked(props.cellData)"
            :select-key="props.cellData[selectedPk]" @change="(e) => onSelected(e, props.cellData)"
            class="oc-checkbox" />
        </template>
      </DataTable>

      <div class="w-full h-full min-h-[100px] flex justify-center items-center oc-loader rounded-[10px]"
        :class="[showSelectedLoading ? 'show-selected-loading' : '']"
        v-if="showSelectedLoading || (!showTemplate && loading)">
        <!-- <OCLoading :loading="true" /> -->
      </div>

      <div class="transition-all absolute top-[1px] left-0 z-10 w-full px-1" v-if="!showTemplate && loading">
        <UProgress size="xs" animation="carousel" />
      </div>

      <div ref="refTotalDetail" class="oc-tbl-total-detail" v-if="$slots.totalDetail">
        <slot name="totalDetail" :total="total" />
      </div>
    </div>
    <div ref="refShowDetailAfterTBL1" v-if="$slots.ShowDetailAfterTableOne">
      <slot name="ShowDetailAfterTableOne" />
    </div>
    <div ref="refShowDetailAfterTBL2" v-if="$slots.ShowDetailAfterTableTwo">
      <slot name="ShowDetailAfterTableTwo" />
    </div>
    <!-- Footer  -->
    <OCTableFooter :options="options" v-if="!isTotalDetail" :page-count="page_count" :total="total" v-model:page="page"
      @change-pagination="changePagination" v-model:selected="record" @select-records="fnSelectRecord(record)"
      :loading="loading" />

    <OCModal v-model="isLineClamp">
      <div class="detail-container">
        <div class="btn-close-detail" @click="isLineClamp = false">
          <i class="ri-close-large-fill"></i>
        </div>
        <div> {{ dataDetail }}</div>
      </div>
    </OCModal>
  </div>
</template>

<script setup>
import DataTable from "datatables.net-vue3";
import DataTablesCore from "datatables.net";
import "datatables.net-responsive-dt";
import "datatables.net-responsive";
import "datatables.net-fixedheader-dt";
import "datatables.net-fixedcolumns-dt";
import "datatables.net-rowreorder-dt";

// init dataTable
DataTable.use(DataTablesCore);

const { t, locale } = useI18n();
const toast = useToast();
const {
  actions,
  totalDetail,
  ShowDetailAfterTableOne,
  ShowDetailAfterTableTwo,
} = useSlots();
const ocTable = ref();

defineExpose({ dt, filter, reload, responsive, setListData, addRowData, updateRowData });

const props = defineProps([
  "api",
  "data",
  "columns",
  "keyTable",
  "options",
  "showTemplate",
  "selectedPk",
  "waitFilter",
  "isTotalDetail",
  "haveBorder",
  "minWidth",
  "stateKey",
  "autoload",
  "selectAllPk",
  "hideGroupBtnSelect",
]);
const isTotalDetail = computed(() => props?.isTotalDetail ?? false);
const autoload = computed(() => props?.autoload ?? true);

const emits = defineEmits([
  "update:data",
  "update:dataSrc",
  "actionCheck",
  "reloadByFixedData",
  "onOrder",
  "onSaveState",
  "onChangePagination",
  "onSelectRecord",
  "onSearching",
  "onRowReorder"
]);

const select = defineModel();

const ref_container_table = ref();

const refTotalDetail = ref();
const refShowDetailAfterTBL1 = ref();
const refShowDetailAfterTBL2 = ref();
const isHasCheck = ref(false);

const selectedPk = computed(() => props.selectedPk);
const selectAllPk = computed(() => props.selectAllPk);
const hideGroupBtnSelect = computed(() => isNotEmpty(props.hideGroupBtnSelect));
const listAllSelect = ref();

const keyTable = computed(() => props.keyTable);
const haveBorder = computed(() => isNotEmpty(props.haveBorder));
const minWidth = computed(() => props.minWidth ?? 768);
const data = computed(() => {
  if (props.api) return null;
  return props.data || [];
});

const api = computed(() => {
  if (props.api) {
    let newApi;

    if (typeof props.api == "string") {
      newApi = { url: getUrl(props.api), method: "get" };
    } else {
      newApi = {
        url: getUrl(props.api?.url),
        method: props.api?.method,
        filter: props.api?.filter,
      };
    }

    return { ...newApi };
  }
  return undefined;
});

const columns = computed(() => {
  const tdNull = [{
    title: ``,
    data: null,
    orderable: false,
    className: "min-width all td-collapse",
    render: "#tdNull",
  }];

  const checkboxes = [{
    title: `<input type="checkbox" value="false" class="oc-checkbox tbl-checkbox"/>`,
    data: null,
    orderable: false,
    className: "min-width all oc-checkbox-col",
    render: "#checkbox",
  }];

  const actionBTNs = [{
    title: t("action"),
    data: null,
    className: "min-width all",
    render: "#actions",
    orderable: false,
  }];

  // enhance column config
  const enhanceColumns = (cols) => cols.map((col, i) => {
    let className = col.className || "";
    let render = col.render

    if (col.alignRight) {
      className = `${className} ${col.orderable !== false ? "have-orderable" : "no-orderable"}`;
    }

    if (isNotEmpty(col.sortData)) {
      className = `${className} multi-sort-pr`;
      const title = col.title;
      col.title = `
        <span>${title}</span>
        <span column-sort-multi="${i}" class="multi-sort-wrapper cursor-pointer flex items-center" onclick="ClickMultiSort()"><i class="ri-filter-3-fill"></i></span>
      `;
    }

    if (isNotEmpty(props.options?.fixedColumns)) {
      className = `${className} fixed-columns`;
    }

    if (isNotEmpty(col.isLineClamp)) {
      className = `${className} isLineClamp`;
      if (col.render !== "string") {
        render = (a, s, r, i,) => {
          if (isEmpty(r[col.data])) return r[col.data]
          return `<div row-index="${i?.row}" col-index="${i.col}" class="has-modal-detail line-clamp-2" onclick="fnOpenDetail()">
                    <span>${tBy({ en: r[col.data], km: r[col.data], })}</span>
                  </div>`
        }
      }
    }

    return { ...col, className, render };
  });

  let baseCols = [];

  if (props.selectedPk && actions) {
    isHasCheck.value = true;
    baseCols = [
      ...(isNotEmpty(props.options?.fixedColumns) ? [] : tdNull),
      ...checkboxes,
      ...props.columns,
      ...actionBTNs,
    ];
  }
  else if (props.selectedPk) {
    isHasCheck.value = true;
    baseCols = [
      ...(isNotEmpty(props.options?.fixedColumns) ? [] : tdNull),
      ...checkboxes,
      ...props.columns,
    ];
  }
  else if (actions) {
    baseCols = [...props.columns, ...actionBTNs];
  }
  else if (props.columns) {
    baseCols = props.columns;
  }
  else if (props.data && props.data.length) {
    const dataKeys = Object.keys(props.data[0]);
    return dataKeys.map((key) => ({ title: key, data: key }));
  }
  else {
    return {};
  }

  return enhanceColumns(baseCols);
});


const columnRefs = computed(() =>
  (columns.value || [])
    .filter((e) => e.render)
    .map((e) =>
      typeof e.render === "string" ? e.render.replace(/#/g, "") : e.render
    )
);

const options = computed(() => {
  let optionDefault = {
    isScroll: true,
    scrollY: 400,
    scrollX: false,
    info: true,
    destroy: true,
    retrieve: true,
    searching: true,
    paging: true,
    reload: true,
    order: { idx: 0, dir: "" },
    responsive: {
      details: {
        renderer: DataTablesCore.Responsive.renderer.listHiddenNodes(),
      },
    },
    lengthMenu: [10, 25, 50, 100],
    pageLength: isNotEmpty(props.api) ? 1000 : 10,
    layout: {
      topStart: null,
      topEnd: null,
      bottomStart: null,
      bottomEnd: null,
    },
    showNoData: true,
  };

  return { ...optionDefault, ...props.options };
});

const showTemplate = computed(() => props.showTemplate);

let table;
const loading = defineModel("loading", { default: false });

const record = ref(options.value?.lengthMenu[0]);
const searching = ref("");
const page = ref(1);
const tempPage = ref(1);
const total = ref(0);
const page_count = ref(options.value?.lengthMenu[0]);
const dataTemplate = ref([]);
const resultData = ref([]);
const tempResultData = ref([]);

// ref variable for multi sort
const isOnOrderByTable = ref(false);
const positionXY = ref();
const idxCol = ref();
const step = ref(1);
const keyOrder = ref("");

const isMounted = ref(true);
const isShowSelected = ref(false);
const showSelectedLoading = ref(false);

const ocTableStore = useOCTableDataStore();
const orderDir = ref(haveOrder("Dir"));
const orderBy = ref(haveOrder("By"));

const isLineClamp = ref(false)
mounted(async () => {
  isMounted.value = true;
  table = ocTable.value?.dt;
  await setTextWhenDataEmpty();

  await checkStateData();

  await eventOrderTable();

  select.value ??= [];

  if (ref_container_table.value?.closest(".oc-modal-container"))
    isTableModal.value = true;

  columns.value?.forEach((col, index) => {
    if (col?.hidden) {
      table?.column(index)?.visible(false); // Hide the column
    }
  });

  if (columns.value.some((e) => isNotEmpty(e.sortData))) {
    window.ClickMultiSort = ClickMultiSort;
    window.sortOrder = sortOrder;

    // Find the parent datatable element
    const dataTable = table?.containers()[0].closest(".datatable");

    if (dataTable) {
      // Find all elements with the 'multiSort' class inside the datatable
      const multiSortElements = dataTable.querySelectorAll(
        ".multi-sort-wrapper"
      );

      // Add event listeners to each multiSort element
      multiSortElements.forEach((multi) => {
        multi.addEventListener("click", (event) =>
          window.ClickMultiSort(event, ocTable.value?.dt, columns.value)
        );
      });
    }
  }

  if (showTemplate.value) {
    ocTable.value?.dt.containers()[0].classList.add("hidden");
  }


  responsive();

  // if (columns.value.some(e => isNotEmpty(e.isLineClamp))) {
  //   window.fnOpenDetail = fnOpenDetail
  //   const hasModalDetail = ocTable.value?.dt
  //     .containers()[0]
  //     .querySelectorAll(".has-modal-detail");

  //     console.log('====== mounted ',hasModalDetail)
  //     hasModalDetail.forEach((detail) => {
  //       console.log('--------',detail)
  //     if (detail.scrollWidth > detail.clientWidth) {
  //       detail.addEventListener("click", (event) => {
  //         window.fnOpenDetail(event, ocTable.value?.dt, columns.value)
  //       }); // prevent multiple bindings on redraw
  //     }
  //   });
  // }

  // select all checkbox
  if (selectedPk.value) {
    ocTable.value?.dt
      .containers()[0]
      .querySelector(".tbl-checkbox")
      .addEventListener("click", checkedAll);
  }

  // table have scrollY and api
  if (options.value?.scrollY && api.value) {
    const container = ocTable.value?.dt.containers()[0].closest(".datatable");
    container
      ?.querySelector(".dt-processing")
      ?.style.setProperty("margin", "0", "important");
  }

  await nextTick(); // Ensure DOM is fully rendered

  checkScrollTBL();
  calScrollModal();
  checkScrollCard();

  // data for show template
  ocTable.value?.dt
    .rows({ page: "current" })
    .data()
    .map((e) => {
      dataTemplate.value.push(e);
    });

  if (!isNotEmpty(api.value)) {
    record.value = ocTable.value?.dt.page.len();
    page_count.value = ocTable.value?.dt.page.len();
    total.value = ocTable.value?.dt.page.info().recordsDisplay;

    // on record filter dataTable
    ocTable.value?.dt.on("length.dt", (e, settings, len) => {
      page.value = 1;
      page_count.value = len;
      record.value = len;
    });

    // on pagination dataTable
    ocTable.value?.dt.on("page", () => {
      page.value = ocTable.value?.dt.page.info().page + 1;
    });

    // on search dataTable
    ocTable.value?.dt.on("search.dt", () => {
      page.value = 1;
      searching.value = ocTable.value?.dt.search();
    });

    // on draw table done dataTable
    ocTable.value?.dt.on("draw", async () => {
      responsive();
    });
  }

  ocTable.value?.dt.on("draw.dt", () => {
    dataTemplate.value = [];

    if (api.value) {
      ocTable.value?.dt
        .rows()
        .data()
        .map((e) => {
          dataTemplate.value.push(e);
        });
    } else {
      ocTable.value?.dt
        .rows({ page: "current" })
        .data()
        .map((e) => {
          dataTemplate.value.push(e);
        });
      let info = ocTable.value?.dt.page.info();
      total.value = info.recordsDisplay;
    }

    setTimeout(() => {
      // on checkbox
      if (selectedPk.value) {
        const inputAll = ocTable.value?.dt
          .containers()[0]
          .querySelectorAll("tbody input[select-key]");
        const inputChecked = ocTable.value?.dt
          .containers()[0]
          .querySelectorAll("tbody input[select-key]:checked");
        const titleCheckbox = ocTable.value?.dt
          .containers()[0]
          .querySelector(".tbl-checkbox");

        if (isNotEmpty(inputAll)) {
          if (inputChecked.length == inputAll.length) {
            titleCheckbox.classList.remove("minus");
            titleCheckbox.checked = true;
          } else if (inputChecked.length < inputAll.length) {
            titleCheckbox.checked = true;
            titleCheckbox.classList.add("minus");
          } else {
            titleCheckbox.classList.remove("minus");
          }

          // inputChecked no data
          if (!inputChecked.length) {
            titleCheckbox.checked = false;
          }
        }

        setTextWhenDataEmpty();
      }
    }, 100);
  });

  window.addEventListener("resize", responsive);

  isMounted.value = false;
});

const dataDetail = ref()
async function fnOpenDetail(e, refTable, column) {
  if (e) {
    const rowIndex = e.currentTarget.getAttribute('row-index')
    const colIndex = e.currentTarget.getAttribute('col-index')
    const dataField = column[colIndex].data
    isLineClamp.value = true;
    dataDetail.value = resultData.value[rowIndex][dataField]
  }
}

async function checkStateData() {
  if (isNotEmpty(props.stateKey)) {
    const tblData = ocTableStore.data[props.stateKey];
    if (isNotEmpty(ocTableStore.data && tblData?.data)) {

      record.value = tblData?.Records;
      page_count.value = tblData?.Records;
      searching.value = tblData?.Search;

      if (isNotEmpty(tblData?.Pages)) {
        page.value = tblData?.Pages;

        if (isNotEmpty(tblData?.OrderBy)) {
          ocTable.value?.dt
            .order([
              columns.value.findIndex((e) => e.data == tblData?.OrderBy),
              tblData?.OrderDir?.toLowerCase(),
            ])
            .draw();
        } else {
          table.order([0, ""]).draw();
        }
      }

      if (isNotEmpty(tblData?.data)) {
        if (!isNotEmpty(api.value)) {
          ocTable.value?.dt
            .page(tblData?.Pages - 1)
            .search(tblData?.Search)
            .page.len(tblData?.Records)
            .draw("page");
        }
        resultData.value = copyWith(tblData.data);

        setTimeout(() => {
          const dataTable = ocTable.value?.dt?.containers()[0].closest(".datatable");
          if (isNotEmpty(options.value?.fixedColumns)) {

            if (dataTable) {
              const thElemFixeds = dataTable.querySelectorAll(
                ".dt-scroll .dt-scroll-head th.dtfc-fixed-end"
              );

              if (thElemFixeds.length > 0) {
                thElemFixeds.forEach((th) => {
                  // Prefer computed style, because sometimes inline is empty
                  const computedRight = window.getComputedStyle(th).right;

                  // Parse px value into number
                  const rightNum = parseFloat(computedRight);

                  if (!isNaN(rightNum)) {
                    const newRight = rightNum - 9;
                    th.style.setProperty("right", `${newRight}px`);
                  }
                });
              }
            }
            return
          }

          // If no fixed th found, adjust scroll head
          const dtScrollHead = dataTable.querySelector(".dt-scroll .dt-scroll-head");

          if (dtScrollHead) {
            const width = dtScrollHead.getBoundingClientRect().width
            const dtScrollHeadInner = dtScrollHead.querySelector(".dt-scroll-headInner");

            if (dtScrollHeadInner) {
              dtScrollHeadInner.style.setProperty("padding-right", `0px`);
              dtScrollHeadInner.style.setProperty("width", `${width}px`);

              const table = dtScrollHeadInner.querySelector("table.nowrap.has-collapse");

              if (table) {
                table.style.setProperty("width", `${width}px`);
              }
            }
          }

        }, 100);


      } else {
        fnGetDataSaveStateOrNot();
      }
    } else {
      fnGetDataSaveStateOrNot();
    }
  } else {
    fnGetDataSaveStateOrNot();
  }
}

async function eventOrderTable() {
  ocTable.value?.dt?.on("order", (e) => {
    if (!options.value?.order) return
    const order = ocTable.value?.dt?.order();

    if (columns.value[order[0][0]]?.data) {
      if (isMounted.value) return;
      orderBy.value = columns.value[order[0][0]].data;
      orderDir.value = order[0][1].toUpperCase();

    } else if (columns.value[order[0]]?.data) {
      if (isMounted.value) return;
      orderBy.value = columns.value[order[0]].data;
      orderDir.value = order[1].toUpperCase();
    }

    if (isNotEmpty(api.value)) {

    } else {
      ocTable.value?.dt
        .page(page.value - 1)
        .search(searching.value)
        .page.len(record.value)
        .draw("page");
    }
    emits("onOrder", order);
    isOnOrderByTable.value = true;
  });
}

function haveOrder(type) {
  if (columns.value[0]?.orderable == false && options.value?.order?.idx == 0) return "";

  if (type == "Dir") {
    if (isNotEmpty(options.value?.order)) {
      return options.value?.order?.dir?.toUpperCase();
    }
    return "";
  } else if (type == "By") {
    if (isNotEmpty(options.value?.order)) {
      return columns.value[options.value?.order?.idx]?.data;
    }
    return "";
  }
}

let controller

async function getData() {
  if (controller) {
    controller.abort();
  }
  loading.value = true;
  try {
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

    const { data, error } = await useHttp(api.value.url, {
      method: api.value.method,
      signal: controller.signal,
      data: typeof api.value == "string" ? {} : dataSender,
    });

    if (error.value) throw error.value;
    if (isNotEmpty(selectAllPk.value) && isNotEmpty(api.value)) {
      listAllSelect.value = data.value[selectAllPk.value] || [];
    }

    if (isNotEmpty(props.api?.where)) data.value = data.value[props.api.where];

    emits("update:dataSrc", data.value);
    if (isNotEmpty(data.value?.dataSrc)) data.value = data.value.dataSrc;

    if (isNotEmpty(props.stateKey)) {
      // 1. Get the previous state for this table
      const prevState = ocTableStore.data[props.stateKey] ?? {};

      // 2. Build new state payload
      const newState = {
        ...prevState,
        ...dataSender,             // keep paging/search/order info
        data: data.value ?? [],    // update data
        columns: prevState.columns ?? [], // keep existing columns if not updated
      };

      // 3. Merge into store root
      const state = {
        ...ocTableStore.data,
        [props.stateKey]: newState,
      };

      emits("onSaveState", state);
      ocTableStore.setData(state);
    }

    return data.value || [];
  } catch (error) {
    toast.add({
      color: "red",
      title: `${isNotEmpty(error?.Message) ? error.Message : error}`,
    });
    return []
  } finally {
    loading.value = false;
  }
}

async function fnGetDataSaveStateOrNot() {
  if (isNotEmpty(api.value)) {
    if (!autoload.value) return;
    resultData.value = copyWith(await getData());
  } else {
    resultData.value = copyWith(data.value);
  }

  setTimeout(async () => {
    await setTotal(resultData.value);
  }, 50);
}

watch(orderDir, async (n) => {
  if (isNotEmpty(api.value)) {
    console.log('watch orderDir', n)
    resultData.value = copyWith(await getData());
  }
});

watch(orderBy, async (n) => {
  if (isNotEmpty(api.value)) {
    console.log('watch orderBy', n)
    resultData.value = copyWith(await getData());
  }
});

watch(data, (n) => {
  if (isNotEmpty(props.stateKey)) {
    if (isMounted.value) return;
    ocTable.value?.dt
      .page(page.value)
      .search(searching.value)
      .page.len(record.value)
      .draw("page");
    resultData.value = copyWith(n);
    fnSetDataToState()
  } else {
    resultData.value = copyWith(n);
  }
  setTextWhenDataEmpty();
});

watch(resultData, async (n) => {
  if (!isShowSelected.value) {
    await setTotal(n);
  }

  if (isNotEmpty(n)) {
    if (columns.value.some(e => isNotEmpty(e.isLineClamp))) {
      fnInitModalDetail()
    }

  } else {
    if (columns.value.some((e) => isNotEmpty(e.isLineClamp))) {
      delete window.fnOpenDetail;
    }
  }

  responsive();
  setTextWhenDataEmpty();
}, { deep: true });

function fnInitModalDetail() {
  // const hasLineClamp = columns.value.some(e => isNotEmpty(e.isLineClamp));

  // // Remove fnOpenDetail if no line-clamp columns exist
  // if (!hasLineClamp) {
  // //  return; // No need to proceed
  // }
  delete window.fnOpenDetail;

  // Delay to ensure DOM is ready after DataTables render
  setTimeout(() => {
    // Re-check after delay
    if (!columns.value.some(e => isNotEmpty(e.isLineClamp))) return;

    window.fnOpenDetail = fnOpenDetail;

    const hasModalDetail = ocTable.value?.dt
      ?.containers()[0]
      ?.querySelectorAll("tbody .has-modal-detail");

    if (!hasModalDetail?.length) return;

    hasModalDetail.forEach((detail) => {
      const isHeightOverflowing = detail.scrollHeight > detail.clientHeight;
      const hasMoreEl = detail.querySelector(".has-more");

      if (isHeightOverflowing) {
        detail.classList.add("cursor-pointer");

        // Optional: show the "more" icon if exists
        hasMoreEl?.classList.add("show");

        // Avoid multiple click bindings
        if (!detail.dataset.clickBound) {
          detail.addEventListener("click", (event) => {
            window?.fnOpenDetail(event, ocTable.value?.dt, columns.value);
          });
          detail.dataset.clickBound = "true";
        }
      } else {
        detail.classList.remove("cursor-pointer");
        hasMoreEl?.classList.remove("show");
      }
    });
  }, 100);
}


watch(
  keyTable,
  (n) => {
    console.log('watch keyTable')
    resultData.value = [];
    if (selectedPk.value) {
      setTimeout(() => {
        ocTable.value?.dt
          ?.containers()[0]
          ?.querySelector(".tbl-checkbox")
          ?.addEventListener("click", checkedAll);
      }, 50);
    }

    if (columns.value.some((e) => isNotEmpty(e.sortData))) {
      delete window.ClickMultiSort;
    }

    // data.value = []
    setTimeout(async () => {
      columns.value?.forEach((col, index) => {
        if (col.hidden) {
          ocTable.value?.dt?.column(index).visible(false); // Hide the column
        }
      });

      if (columns.value.some((e) => isNotEmpty(e.sortData))) {
        window.ClickMultiSort = ClickMultiSort;
        window.sortOrder = sortOrder;
        // Find the parent datatable element
        const dataTable = ocTable.value?.dt
          ?.containers()[0]
          ?.closest(".datatable");

        if (dataTable) {
          // Find all elements with the 'multiSort' class inside the datatable
          const multiSortElements = dataTable?.querySelectorAll(
            ".multi-sort-wrapper"
          );

          // Add event listeners to each multiSort element
          multiSortElements?.forEach((multi) => {
            multi?.addEventListener("click", (event) =>
              window?.ClickMultiSort(event, ocTable.value?.dt, columns.value)
            );
          });
        }
      }



      await setTextWhenDataEmpty();

      await checkStateData();

      orderDir.value = haveOrder("Dir");
      orderBy.value = haveOrder("By");
      await eventOrderTable();

      await setTotal(resultData.value);
      responsive();
      checkScrollTBL();
      calScrollModal();
      checkScrollCard();
      setTextWhenDataEmpty();
      window.addEventListener("resize", responsive);
    }, 10);
  },
  { deep: true }
);

async function setTextWhenDataEmpty() {
  const emptyElement = ocTable.value?.dt
    ?.containers()[0]
    .closest(".datatable")
    ?.querySelector(".dt-empty");
  if (emptyElement) {
    if (locale.value == "en") {
      if (isShowSelected.value) {
        emptyElement.innerHTML = "No selected available in the table";
      } else {
        emptyElement.innerHTML = "No data available in the table";
      }
    } else if (locale.value == "km") {
      if (isShowSelected.value) {
        emptyElement.innerHTML = "មិនមានទិន្នន័យជ្រើសរើសនៅក្នុងតារាងទេ";
      } else {
        emptyElement.innerHTML = "មិនមានទិន្នន័យនៅក្នុងតារាងទេ";
      }
    }
  }
}

const isShowMultiSort = ref(false)
async function ClickMultiSort(e, refTable, column) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
    const thElement = e.target.closest("th");
    if (thElement) {
      // Get the 'data-dt-column' attribute from the closest <th> element
      idxCol.value = thElement.dataset.dtColumn;

      if (idxCol.value != -1) {
        // Locate the <th> element for the column
        const navbarWidth = document
          .querySelector(".navbar-left")
          .getBoundingClientRect();

        // const table = refTable;

        const tableRect = refTable?.containers()[0]?.getBoundingClientRect();
        const rectXY = refTable
          ?.containers()[0]
          .querySelector(
            `.multi-sort-wrapper[column-sort-multi='${idxCol.value}']`
          )
          ?.getBoundingClientRect();

        positionXY.value = {
          x: Math.round(tableRect?.right) - (Math.round(rectXY?.right) - 16), // X relative to the table
          y:
            Math.round(rectXY?.top) +
            (window.innerWidth > 540 ? 46 : 36) -
            Math.round(tableRect?.top), // Y relative to the table
        };

        // Check if the popover already exists
        const existingPopover = refTable
          ?.containers()[0]
          ?.querySelector(
            `.popover-multi-sort-contain[column-index="${idxCol.value}"]`
          );
        if (existingPopover) {
          // Remove the existing popover
          existingPopover.remove();
          document.removeEventListener("click", handleOutsideClick);
        } else {
          // Remove any existing popovers before adding a new one
          const currentPopover = refTable
            ?.containers()[0]
            ?.querySelector(".popover-multi-sort-contain");
          if (currentPopover) currentPopover.remove();

          let getOrder =
            isOnOrderByTable.value == true && isEmpty(api.value)
              ? refTable?.order()[0]
              : refTable?.order();

          setTimeout(() => {
            window.dataTableInstance = refTable;
            window.columnDataTableInstance = column;
            let orderingClass = "";
            let list = column[idxCol.value]?.sortData
              ?.map((e) => {
                if (isNotEmpty(column[getOrder[0]])) {
                  if (column[getOrder[0]]?.data == e.data) {
                    keyOrder.value = e.data;

                    if (getOrder[1] == "asc") {
                      orderingClass = "icon-ordering-asc";
                      step.value = 2;
                    } else if (getOrder[1] == "desc") {
                      orderingClass = "icon-ordering-desc";
                      step.value = 3;
                    } else {
                      orderingClass = "";
                      step.value = 4;
                    }
                  } else {
                    orderingClass = "";
                    if (!isNotEmpty(keyOrder.value)) step.value = 4;
                  }
                }
                return `<div class="sort-detail ${orderingClass}" onClick="window.sortOrder(event,'${e.data}')">
                        <div class="title">${e.title}</div><span class="icon-order"></span>
                        </div>`;
              })
              .join("");

            refTable?.containers()[0]?.insertAdjacentHTML(
              "beforeend",
              `<div column-index="${idxCol.value}" style="top:${positionXY.value?.y}px;right:${positionXY.value?.x}px;" class="popover-multi-sort-contain hide">
                ${list}
              </div>`
            );
            isShowMultiSort.value = true
          }, 50);

          // Attach global click handler to detect clicks outside the popover
          setTimeout(() => {
            const containMultiSort = refTable
              ?.containers()[0]
              .querySelector(
                `.popover-multi-sort-contain[column-index="${idxCol.value}"]`
              );
            const rectMultiSort = containMultiSort?.getBoundingClientRect();

            const positionX =
              Math.round(navbarWidth.width) > 0
                ? Math.round(rectXY?.right) - Math.round(navbarWidth?.width)
                : Math.round(rectXY?.right);

            if (positionX > Math.round(rectMultiSort?.width)) {
              positionXY.value = {
                x:
                  Math.round(tableRect?.right) -
                  (Math.round(rectMultiSort?.right) - 16), // X relative to the table
                y:
                  Math.round(rectXY?.top) +
                  (window.innerWidth > 540 ? 46 : 36) -
                  Math.round(tableRect?.top), // Y relative to the table
              };
            } else {
              positionXY.value = {
                x:
                  Math.round(tableRect?.right) -
                  (Math.round(rectMultiSort?.right) + 16), // X relative to the table
                y:
                  Math.round(rectXY?.top) +
                  (window.innerWidth > 540 ? 42 : 36) -
                  Math.round(tableRect?.top), // Y relative to the table
              };
            }

            containMultiSort?.style?.setProperty(
              "right",
              `${positionXY.value?.x}px`
            );
            containMultiSort?.style?.setProperty(
              "top",
              `${positionXY.value?.y}px`
            );
            document.addEventListener("click", handleOutsideClick);
            containMultiSort?.classList?.remove("hide");
          }, 75);
        }
      }
    }
  }
}

// Function to handle clicks outside the popover
function handleOutsideClick(event) {
  event.preventDefault();
  event.stopPropagation();
  const popover = document.querySelector(".popover-multi-sort-contain");
  if (popover && !popover.contains(event.target)) {
    // Remove the popover if the click is outside it
    popover.remove();
    document.removeEventListener("click", handleOutsideClick); // Clean up event listenerS
  } else {
    isShowMultiSort.value = false
  }
}

function sortOrder(event, key) {
  event.preventDefault();
  event.stopPropagation();

  // Remove existing ordering classes from all sort-detail items
  document.querySelectorAll(".sort-detail").forEach((item) => {
    item.classList.remove("icon-ordering-asc", "icon-ordering-desc");
  });

  // Reset step if it's at 4 or if the key has changed
  if (step.value === 4 || keyOrder.value !== key) {
    step.value = 1;
  }

  const idx = window?.columnDataTableInstance?.findIndex((e) => e.data === key);
  const direct = step.value === 1 ? "asc" : step.value === 2 ? "desc" : "";
  const currentClass =
    step.value === 1
      ? "icon-ordering-asc"
      : step.value === 2
        ? "icon-ordering-desc"
        : "icon-ordering";

  setTimeout(() => {
    // Update table order and redraw
    window?.dataTableInstance?.order([idx, direct]).draw();

    // Add the appropriate ordering class to the clicked item
    const ordering = event.target.closest(".sort-detail");
    ordering.classList.add(currentClass);

    // Update the state
    isOnOrderByTable.value = false;
    keyOrder.value = key;
    step.value++;
  }, 50);
}

let timeout;
function responsive() {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    // Add your logic here, e.g., making an API call
    ocTable.value?.dt?.responsive.recalc();

    const popover = document.querySelector(".popover-multi-sort-contain");
    if (popover) {
      // Remove the popover if the click is outside it
      if (!isShowMultiSort.value) {
        console.log('responsive >>>', loading.value)
        popover.remove();
      }
    }

    checkScrollTBL();
    calScrollModal();
    checkScrollCard();
    if (columns.value.some(e => isNotEmpty(e.isLineClamp))) {
      fnInitModalDetail()
    }
  }, 200);
}

onBeforeUnmount(() => {
  if (resizeObserverTable.value) {
    resizeObserverTable.value.disconnect();
    resizeObserverTable.value = null;
  }
  if (resizeObserverCard.value) {
    resizeObserverCard.value.disconnect();
    resizeObserverCard.value = null;
  }
});

const resizeObserverTable = ref(null);
const resizeObserverCard = ref(null);

function checkScrollTBL() {
  if (ref_container_table.value) {
    calScroll();
  }
}

function checkScrollCard() {
  if (ref_oc_wrapper_card.value) {
    calScrollCard();
  }
}

const oldHeightTbl = ref(0);

function calScroll() {
  const container = ocTable.value?.dt?.containers()[0].closest(".datatable");
  const scrollBody = container?.querySelector(".dt-scroll-body");

  if (!options.value.isScroll) {
    scrollBody?.style.setProperty("overflow", `unset`);
    return;
  }

  if (isTableModal.value) return;

  const spaceTBL = ocTable.value?.dt?.containers()[0].closest(".oc-content") ? 38 : 18;
  if (!scrollBody) return;

  const scrollBodyRect = scrollBody.getBoundingClientRect();

  const heightTotalDetail = refTotalDetail.value?.offsetHeight || 0;
  const heightDetailAfterOne = refShowDetailAfterTBL1.value?.offsetHeight || 0;
  const heightDetailAfterTwo = refShowDetailAfterTBL2.value?.offsetHeight || 0;

  const hasAnyDetail = totalDetail || ShowDetailAfterTableOne || ShowDetailAfterTableTwo;

  let extraHeight = 0;

  if (hasAnyDetail) {
    extraHeight = heightTotalDetail + heightDetailAfterOne + heightDetailAfterTwo;
    if (options.value.paging || options.value.info) {
      extraHeight += 60;
    }
  } else {
    extraHeight = (options.value.paging || options.value.info) ? 60 : 10;
  }

  const heightTbl = window.innerHeight - (scrollBodyRect.top + spaceTBL + extraHeight + 15);

  if (window.innerWidth > minWidth.value) {
    scrollBody.style.setProperty("height", `${heightTbl}px`);
    scrollBody.style.setProperty("max-height", `${heightTbl}px`);
    scrollBody.style.setProperty("min-height", `400px`);
  } else {
    scrollBody.style.setProperty("height", `100%`);
    scrollBody.style.setProperty("max-height", `100%`);
    scrollBody.style.setProperty("min-height", `400px`);
  }
}

const isTableModal = ref(false);
function calScrollModal() {
  if (!options.value.isScroll) return;
  const targetNode = ref_container_table.value?.closest(".oc-modal-container");

  if (targetNode) {
    const containerRect = targetNode.getBoundingClientRect();
    const scrollBody = targetNode.querySelector(".dt-scroll-body");
    const heightScrollBody = scrollBody.getBoundingClientRect();
    const heightFooter =
      targetNode.querySelector(".oc-modal-footer")?.offsetHeight ?? 0;

    const heightTBL =
      containerRect.height - (heightScrollBody.top + heightFooter + 80);

    scrollBody.style.setProperty("height", `${heightTBL}px`);
    scrollBody.style.setProperty("max-height", `${heightTBL}px`);
  }
}

//s for scroll card only
const ref_oc_table_h = ref();
const ref_oc_wrapper_card = ref();
const refShowTemplate = ref();

function calScrollCard() {
  if (!options.value.isScroll) return;
  if (ref_oc_wrapper_card.value) {
    let container = ref_oc_wrapper_card.value.closest(".ocs-wrapper-table");
    const scrollBody = container.querySelector(".oc-wrapper-card");
    let heightTbl;
    let spaceTBL;
    if (ocTable.value?.dt?.containers()[0].closest(".oc-content")) {
      spaceTBL = isNotEmpty(isHasCheck.value) ? 46 : 44;
    } else {
      spaceTBL = isNotEmpty(isHasCheck.value) ? 12 : 10;
    }

    if (container) {
      if (scrollBody) {
        const scrollBodyRect = scrollBody.getBoundingClientRect();

        if (options.value.paging || options.value.info) {
          heightTbl = window.innerHeight - (scrollBodyRect.top + spaceTBL + 60);
        } else if (totalDetail) {
          heightTbl =
            window.innerHeight -
            (scrollBodyRect.top +
              spaceTBL +
              refTotalDetail.value?.offsetHeight);
        } else if (ShowDetailAfterTableOne) {
          heightTbl =
            window.innerHeight -
            (scrollBodyRect.top +
              spaceTBL +
              refShowDetailAfterTBL1.value?.offsetHeight);
        } else if (ShowDetailAfterTableTwo) {
          heightTbl =
            window.innerHeight -
            (scrollBodyRect.top +
              spaceTBL +
              refShowDetailAfterTBL2.value?.offsetHeight);
        } else if (
          totalDetail &&
          ShowDetailAfterTableOne &&
          ShowDetailAfterTableTwo
        ) {
          heightTbl =
            window.innerHeight -
            (scrollBodyRect.top +
              spaceTBL +
              refTotalDetail.value?.offsetHeight +
              refShowDetailAfterTBL1.value?.offsetHeight +
              refShowDetailAfterTBL2.value?.offsetHeight);
        } else {
          heightTbl = window.innerHeight - (scrollBodyRect.top + spaceTBL);
        }

        if (window.innerWidth > minWidth.value) {
          scrollBody.style.setProperty("height", `${heightTbl}px`);
          scrollBody.style.setProperty("max-height", `${heightTbl}px`);
          scrollBody.style.setProperty("min-height", `400px`);
        } else {
          scrollBody.style.setProperty("height", `100%`);
          scrollBody.style.setProperty("max-height", `100%`);
          scrollBody.style.setProperty("min-height", `100%`);
        }
      }
    }
  }
}
//e for scroll card only

// watch
watch(showTemplate, (a, b) => {
  if (showTemplate.value) {
    ocTable.value?.dt.containers()[0].classList.add("hidden");
  } else {
    ocTable.value?.dt.containers()[0].classList.remove("hidden");
  }
});

watch(select, (a, b) => {
  if (select.value) {
    // Unselect
    setTimeout(() => {
      const selectors = ocTable.value?.dt
        ?.containers()[0]
        ?.querySelectorAll("tbody input[select-key]:not(.disabled)");
      if (isEmpty(a)) {
        const inputTheads = ocTable.value?.dt
          .containers()[0]
          .querySelector(".tbl-checkbox");

        if (inputTheads) {
          inputTheads.checked = false;
        }
      }

      if (!isNotEmpty(selectors)) return;
      for (const e of selectors) e.checked = false;

      // Select
      for (const s of select.value) {
        const elm = ocTable.value?.dt
          ?.containers()[0]
          ?.querySelector(
            `tbody input[select-key='${isNotEmpty(selectAllPk.value) && isNotEmpty(api.value)
              ? s
              : s[selectedPk.value]
            }']:not(.disabled)`
          );

        if (elm) elm.checked = true;
      }
    }, 50);
  }
}, { deep: true });

// on select checkbox
function onSelected(e, val) {
  const checked = e.target.checked;
  console.log('check >>>', val)
  if (checked) {
    if (isNotEmpty(selectAllPk.value) && isNotEmpty(api.value)) {
      const currItems = select.value.filter((e) => e === val[selectedPk.value]);
      if (!currItems.length) select.value.push(val[selectedPk.value]);
    } else {
      const currItems = select.value.filter(
        (e) => e[selectedPk.value] === val[selectedPk.value]
      );
      if (!currItems.length) select.value.push(val);
    }

    emits("actionCheck", val);
  } else {
    let data = [];
    if (isNotEmpty(selectAllPk.value) && isNotEmpty(api.value)) {
      data = select.value.filter((e) => e !== val[selectedPk.value]);
      select.value = select.value.filter((e) => e !== val[selectedPk.value]);
    } else {
      data = select.value.filter(
        (e) => e[selectedPk.value] !== val[selectedPk.value]
      );
      select.value = select.value.filter(
        (e) => e[selectedPk.value] !== val[selectedPk.value]
      );
    }
    emits("actionCheck", data);
  }

  const ele = ocTable.value?.dt.containers()[0].querySelector(".tbl-checkbox");
  const inputUnChecks = ocTable.value?.dt
    .containers()[0]
    .querySelectorAll("tbody input[select-key]:not(.disabled)");
  const inputChecked = ocTable.value?.dt
    .containers()[0]
    .querySelectorAll("tbody input[select-key]:checked:not(.disabled)");

  if (inputChecked.length < inputUnChecks.length) {
    ele.checked = true;
    ele.classList.add("minus");
  } else {
    ele.checked = true;
    ele.classList.remove("minus");
  }

  if (inputChecked.length === 0) {
    ele.checked = false;
  }
}

function setInitChecked(val) {
  if (isNotEmpty(selectAllPk.value) && isNotEmpty(api.value)) {
    const data = select.value?.filter((e) => e === val[selectedPk.value]);

    return data && data.length;
  } else {
    const data = select.value?.filter(
      (e) => e[selectedPk.value] === val[selectedPk.value]
    );

    return data && data.length;
  }
}

function checkedAll(elem) {
  const inputAll = ocTable.value?.dt
    .containers()[0]
    .querySelectorAll("tbody input[select-key]:not(.disabled)");
  const inputChecked = ocTable.value?.dt
    .containers()[0]
    .querySelectorAll("tbody input[select-key]:checked:not(.disabled)");

  setTimeout(() => {
    if (!inputChecked.length) {
      elem.target.classList.remove("minus");

      inputAll.forEach((v, i) => {
        const key = v.getAttribute("select-key");
        const checkboxes = ocTable?.value.dt
          .data()
          .filter((e) => key.includes(e[selectedPk.value]));
        if (isNotEmpty(selectAllPk.value) && isNotEmpty(api.value)) {
          select.value.push(checkboxes[0][selectedPk.value]);
        } else {
          select.value.push(checkboxes[0]);
        }
        // console.log('select >>>>',checkboxes[0])
        v.checked = true;
      });
      emits("actionCheck", select.value);
    } else {
      const pks = [...inputChecked].map((v) => v.getAttribute("select-key"));
      if (isNotEmpty(selectAllPk.value) && isNotEmpty(api.value)) {
        select.value = select.value.filter((e) => !pks.includes(`${e}`));
      } else {
        select.value = select.value.filter(
          (e) => !pks.includes(`${e[selectedPk.value]}`)
        );
      }
      emits("actionCheck", []);
    }
    console.log('==== >>>', inputAll)
    console.log('---- >>>', inputChecked)
    console.log('>>>>>>>>', select.value)
  }, 50);
}

function fnClearAll() {
  const inputTheads = ocTable.value?.dt
    .containers()[0]
    .querySelector(".tbl-checkbox");
  inputTheads.checked = false;
  select.value = [];
}

async function fnShowSelected() {
  // to Default param for action change record , pagination , other
  isShowSelected.value = !isShowSelected.value;

  if (isShowSelected.value) {
    tempPage.value = page.value;
    tempResultData.value = [...resultData.value]; // assign for unShow to data like before show click selected

    if (isNotEmpty(selectAllPk.value) && isNotEmpty(api.value)) {
      resultData.value = [
        ...resultData.value?.filter((e) =>
          select.value?.includes(e[selectedPk.value])
        ),
      ];
    } else {
      const data = [];
      ocTable?.value.dt
        .rows({ page: "current" })
        .data()
        .map((v, i) => {
          data.push(v);
        });
      setTimeout(() => {
        resultData.value = [
          ...data?.filter((e) =>
            select.value?.some(
              (s) => s[selectedPk.value] == e[selectedPk.value]
            )
          ),
        ];
      }, 1);
    }
  } else {
    resultData.value = [...tempResultData.value];
    if (isEmpty(api.value)) {
      showSelectedLoading.value = true;
      setTimeout(() => {
        ocTable.value?.dt.page(tempPage.value - 1).draw("page");
        showSelectedLoading.value = false;
      }, 100);
    }
  }
  // await checkIsNoData();
}

function fnSelectAllOnePage() {
  const inputThead = ocTable.value?.dt
    .containers()[0]
    .querySelector(".tbl-checkbox");
  if (!inputThead.checked) {
    inputThead.checked = true;
    inputThead.classList.remove("minus");
    if (isNotEmpty(api.value)) {
      if (isNotEmpty(selectAllPk.value) && isNotEmpty(api.value)) {
        select.value = [
          ...(select.value || []),
          ...(resultData.value?.map((e) => e[selectedPk.value]) || []),
        ];
      } else {
        select.value = [...(select.value || []), ...(resultData.value || [])];
      }
    } else {
      const data = [];
      ocTable?.value.dt
        .rows({ page: "current" })
        .data()
        .map((v, i) => {
          data.push(v);
        });
      setTimeout(() => {
        select.value = [...(select.value || []), ...(data || [])];
      }, 1);
    }
  }
}

function fnListAllSelect() {
  const inputTheads = ocTable.value?.dt
    .containers()[0]
    .querySelector(".tbl-checkbox");
  inputTheads.checked = true;
  inputTheads.classList.remove("minus");
  if (isNotEmpty(api.value)) select.value = listAllSelect.value;
  else select.value = resultData.value;
}

// event on OCTable
// change record filter
async function fnSelectRecord(records) {
  page.value = 1;
  record.value = records;
  page_count.value = records;
  emits("onSelectRecord", record.value, page.value);
  setTimeout(async () => {
    if (isNotEmpty(api.value)) {
      resultData.value = copyWith(await getData());
    } else {
      ocTable.value?.dt.page.len(records).draw("page");
      fnSetDataToState()
    }
  }, 100);
}

// searching
async function searchTable(search) {
  emits("onSearching", search);
  page.value = 1;
  searching.value = search;
  if (api.value) {
    resultData.value = copyWith(await getData());
  } else {
    ocTable.value?.dt?.search(search)?.draw();
    fnSetDataToState()
  }
}

// clear search
async function clearSearch() {
  searching.value = "";
  page.value = 1;
  emits("onSearching", "");
  if (isNotEmpty(api.value)) {
    resultData.value = copyWith(await getData());
  } else {
    ocTable.value?.dt?.search(searching.value)?.draw("page");
    fnSetDataToState()
  }
}

async function fnReload() {
  if (!isNotEmpty(api.value)) emits("reloadByFixedData");
  if (isNotEmpty(api.value)) {
    resultData.value = copyWith(await getData());
  } else {
    ocTable.value?.dt.draw("page");
  }
}

// change pagination
async function changePagination(pages) {
  emits("onChangePagination", pages, record.value);

  page.value = pages;
  setTimeout(async () => {
    if (isNotEmpty(api.value)) {
      if (isMounted.value) return;

      const tblData = ocTableStore.data[props.stateKey];
      if (isNotEmpty(tblData?.data) && (pages === tblData?.Pages)) return

      resultData.value = copyWith(await getData());
    } else {
      ocTable.value?.dt.page(pages - 1).draw("page");
      fnSetDataToState()
    }

    if (isEmpty(api.value)) {
      const inputAll = ocTable.value?.dt
        .containers()[0]
        .querySelectorAll("tbody input[select-key]:not(.disabled)");

      ocTable?.value.dt
        .rows({ page: "current" })
        .data()
        .map((v, i) => {
          inputAll[i].checked = setInitChecked(v);
        });
    }
  }, 100);
}

async function setTotal(list) {
  total.value = isNotEmpty(list)
    ? list[0]?.RecordCount ||
    list[0]?.RecordsCount ||
    list[0]?.RecordCounts ||
    list[0]?.TotalRecord ||
    list.length
    : 0;
}

// defineExpose
function dt() {
  return ocTable.value?.dt;
}

async function filter() {
  page.value = 1;
  resultData.value = copyWith(await getData());
}

async function reload(currentPage = true) {
  if (!currentPage) page.value = 1;
  if (isMounted.value) return;
  resultData.value = copyWith(await getData());
}

function setListData(data) {
  resultData.value = copyWith(data)
  fnSetDataToState()
}

function addRowData(rowData) {
  resultData.value.unshift(copyWith(rowData))
  if (options.value?.lengthMenu.some(e => e == record.value)) {
    if (copyWith(resultData.value)?.length == (record.value + 1)) {
      resultData.value.splice(copyWith(resultData.value)?.length - 1)
    }
  }
  fnSetDataToState()
}

function updateRowData(rowData, pk) {
  const index = resultData.value.findIndex(e => e[pk] === rowData[pk])
  if (index) {
    resultData.value[index] = copyWith(rowData)
    fnSetDataToState()
  }
}

function fnSetDataToState(override = {}) {
  if (isEmpty(props.stateKey)) return;
  // 1. Get the previous state for this table
  const prevState = ocTableStore.data[props.stateKey] ?? {};

  const defaults = {
    Pages: page.value,
    Records: record.value,
    Search: searching.value,
    OrderBy: orderBy.value,
    OrderDir: orderDir.value,
  };

  // merge default values with overrides
  const dataSender = { ...defaults, ...override };

  // 2. Build new state payload
  const newState = {
    ...prevState,
    ...dataSender,             // keep paging/search/order info
    data: resultData.value,    // update data
    columns: prevState.columns ?? [], // keep existing columns if not updated
  };

  // 3. Merge into store root
  const state = {
    ...ocTableStore.data,
    [props.stateKey]: newState,
  };

  ocTableStore.setData(state);
}

// handle reorder callback
function onRowReorder(e, diff, edit) {
  emits('onRowReorder', e, diff, edit)
}
</script>

<style lang="scss">
@use "datatables.net-dt" as dt;
@use "datatables.net-responsive-dt" as responsive;
@use "datatables.net-fixedheader-dt" as fixedheader;
@use "datatables.net-fixedcolumns-dt" as fixedcolumns;
@use "datatables.net-rowreorder-dt" as rowreorder;

.dark {
  .popover-multi-sort-contain {
    box-shadow: rgba(0, 0, 0, 0.5) 0px 7px 29px 0px;
  }
}

.ocs-wrapper-table {
  .btn {
    display: flex;
    align-items: center;
    grid-gap: 2px;
    height: 24px;
    padding: 0px 10px 0px 8px;
    background: var(--bg-content);
    font-size: 12px;
    line-height: 12px;
    border-radius: 7px;
    cursor: pointer;
    -webkit-user-select: none;
    -moz-user-select: none;
    user-select: none;
    transition: 0.2s ease-in-out;

    &.active {
      background: var(--color-primary);
      color: #fff;
    }
  }
}

.popover-multi-sort-contain {
  &.hide {
    visibility: hidden;
    opacity: 0;
  }

  visibility: visible;
  opacity: 1;
  display: grid;
  align-items: center;
  gap: 6px;
  padding: 10px;
  min-width: 120px;
  transition: 0.2s all ease-in-out;
  box-shadow: rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;
  font-size: 13px;
  font-weight: bold;
  background: var(--bg-wrapper) !important;
  border-radius: 0.75rem;
  position: absolute;
  z-index: 15;

  .sort-detail {
    &.icon-ordering-asc {
      span.icon-order {
        &:before {
          opacity: 0.6;
        }
      }
    }

    &.icon-ordering-desc {
      span.icon-order {
        &:after {
          opacity: 0.6;
        }
      }
    }

    position: relative;
    height: 100%;
    padding-right: 12px;
    cursor: pointer;

    span.icon-order {
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 12px;

      &:after,
      &:before {
        left: 0;
        line-height: 4px;
        font-size: 14px;
        opacity: 0.125;
      }

      &:after {
        content: "\ea4f";
        font-family: remixicon;
        position: absolute;
        display: block;
        top: 50%;
        margin-top: 1px;
      }

      &:before {
        content: "\ea55";
        font-family: remixicon;
        position: absolute;
        display: block;
        bottom: 50%;
        margin-bottom: 1px;
      }
    }
  }
}

svg {
  width: 45px;
  height: 45px;
}

.oc-loader {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 10;

  &.show-selected-loading {
    background-color: var(--bg-content);
  }

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

.container-table {
  &.have-border {
    border: 1px solid var(--border-table) !important;

    table {
      tbody {
        tr {
          &:last-child {
            td {
              border-bottom: 1px solid transparent !important;
            }
          }
        }
      }
    }
  }

  position: relative;
  padding: 0px 10px 0px 10px;
  margin-top: 14px;
  background: var(--bg-content);
  border-radius: 10px;

  @media (max-width: 540px) {
    padding: 0px 0px 8px 0px;
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
    &.have-border {
      border: 1px solid var(--border-table) !important;
      background-color: transparent !important;

      table.dataTable thead tr>.dtfc-fixed-start,
      table.dataTable thead tr>.dtfc-fixed-end,
      table.dataTable tfoot tr>.dtfc-fixed-start,
      table.dataTable tfoot tr>.dtfc-fixed-end,
      table.dataTable tbody tr>.dtfc-fixed-start,
      table.dataTable tbody tr>.dtfc-fixed-en {
        background-color: var(--bg-content);
      }
    }

    padding: 0px 14px 0px 14px !important;
    padding-right: 8px !important;
    background: var(--bg-wrapper) !important;

    table {
      background: transparent !important;
    }

    .datatable {
      background: transparent !important;

      thead tr>.dtfc-fixed-start,
      thead tr>.dtfc-fixed-end,
      tfoot tr>.dtfc-fixed-start,
      tfoot tr>.dtfc-fixed-end,
      tbody tr>.dtfc-fixed-start,
      tbody tr>.dtfc-fixed-en {
        background-color: var(--bg-wrapper);
      }
    }
  }
}

.oc-modal {
  .container-table {
    table {
      background: transparent !important;
    }

    .datatable {
      background: transparent !important;
    }
  }

  .oc-loader {
    &.show-selected-loading {
      background-color: var(--bg-wrapper);
    }
  }
}

table {
  background: var(--bg-content);

  thead,
  tbody {
    tr {
      td {
        box-shadow: none !important;
        border-bottom: 1px solid var(--border-table) !important;
        white-space: nowrap;
      }

      th {
        outline: none !important;
        outline-offset: 0 !important;
        border-bottom: 1px solid var(--border-table) !important;
        text-align: left !important;
        white-space: nowrap;
      }

      &:last-child {
        td {
          border-bottom: 1px solid transparent !important;
        }
      }
    }
  }

  thead {
    tr {
      th {
        &.fixed-columns {
          line-height: 1.51;
        }

        font-size: 12px;
      }
    }
  }

  tbody {
    tr {
      td {
        &.fixed-columns {
          line-height: 1.51;
        }

        font-size: 13px;
      }
    }
  }
}

.datatable {
  padding: 12px 0px 10px 0px;
  background: var(--bg-content);
  border-radius: 10px;

  @media (max-width: 768px) {
    padding: 8px 0px 10px 0px;
  }

  .dt-layout-cell {
    padding: 0px 0px !important;
  }
}

div.dt-container div.dt-layout-row {
  margin: 0px !important;
}

.container-table {
  &.is-not-check {
    .datatable {
      padding: 10px 0px 10px 0px !important;

      @media (max-width: 540px) {
        padding: 0px 0px 0px 0px !important;
      }
    }

    div.dt-container div.dt-layout-row {
      @media (max-width: 540px) {
        padding: 6px;
      }
    }
  }
}

table.dataTable.hover>tbody>tr:hover>*,
table.dataTable.display>tbody>tr:hover>* {
  &.isLineClamp {
    .has-modal-detail {
      .has-more {
        background-color: #f9f9f9;

      }
    }
  }

  background-color: #f9f9f9 !important;
}

table.dataTable.dtr-inline.collapsed>tbody>tr>td.dtr-control,
table.dataTable.dtr-inline.collapsed>tbody>tr>th.dtr-control {
  position: relative;
  padding-left: 30px;
}

table.dataTable.dtr-inline.collapsed>tbody>tr>td.oc-checkbox-col.dtr-control:before {
  margin-top: -2px !important;
}

table.dataTable.dtr-inline.collapsed>tbody>tr {
  >td.dtr-control:before {
    border: none !important;
    position: absolute;
    content: "\ea4e";
    height: 14px;
    width: 14px;
    position: absolute;
    top: 50%;
    left: 5px;
    z-index: 1;
    font-family: remixicon !important;
    color: #00000080 !important;
    background-color: transparent !important;
    box-shadow: unset !important;
    font-size: 20px;
    margin-top: 0px !important;
    transform: translate(0, -50%);
    border: unset !important;
    display: block;
    box-sizing: content-box;
    text-align: center;
    text-indent: 0 !important;
    line-height: 14px;
  }

  &.dtr-expanded {
    >td.dtr-control:before {
      content: "\ea78";
    }
  }
}

table.dataTable thead>tr>th.dt-orderable-asc,
table.dataTable thead>tr>th.dt-orderable-desc,
table.dataTable thead>tr>th.dt-ordering-asc,
table.dataTable thead>tr>th.dt-ordering-desc,
table.dataTable thead>tr>td.dt-orderable-asc,
table.dataTable thead>tr>td.dt-orderable-desc,
table.dataTable thead>tr>td.dt-ordering-asc,
table.dataTable thead>tr>td.dt-ordering-desc {
  position: relative;
  padding-right: 30px;
  padding-bottom: 14px;
}

table.dataTable thead>tr>th.dt-orderable-none {
  &.multi-sort-pr {
    padding-right: 20px !important;

    span.multi-sort-wrapper {
      position: absolute;
      z-index: 10;
      right: 6px;
      top: -4px;
      bottom: 0;
      width: 12px;
      height: auto;
    }
  }

  &.oc-checkbox-col {
    padding-right: 10px !important;
  }

  padding-right: 10px !important;
  position: relative;
  padding-bottom: 14px;
}

table.dataTable thead>tr>th.dt-orderable-asc span.dt-column-order,
table.dataTable thead>tr>th.dt-orderable-desc span.dt-column-order,
table.dataTable thead>tr>th.dt-ordering-asc span.dt-column-order,
table.dataTable thead>tr>th.dt-ordering-desc span.dt-column-order,
table.dataTable thead>tr>td.dt-orderable-asc span.dt-column-order,
table.dataTable thead>tr>td.dt-orderable-desc span.dt-column-order,
table.dataTable thead>tr>td.dt-ordering-asc span.dt-column-order,
table.dataTable thead>tr>td.dt-ordering-desc span.dt-column-order {
  position: absolute;
  right: 12px;
  top: -4px;
  bottom: 0;
  width: 12px;
  height: auto;
}

table.dataTable thead>tr>th.dt-orderable-asc span.dt-column-order:before,
table.dataTable thead>tr>th.dt-orderable-asc span.dt-column-order:after,
table.dataTable thead>tr>th.dt-orderable-desc span.dt-column-order:before,
table.dataTable thead>tr>th.dt-orderable-desc span.dt-column-order:after,
table.dataTable thead>tr>th.dt-ordering-asc span.dt-column-order:before,
table.dataTable thead>tr>th.dt-ordering-asc span.dt-column-order:after,
table.dataTable thead>tr>th.dt-ordering-desc span.dt-column-order:before,
table.dataTable thead>tr>th.dt-ordering-desc span.dt-column-order:after,
table.dataTable thead>tr>td.dt-orderable-asc span.dt-column-order:before,
table.dataTable thead>tr>td.dt-orderable-asc span.dt-column-order:after,
table.dataTable thead>tr>td.dt-orderable-desc span.dt-column-order:before,
table.dataTable thead>tr>td.dt-orderable-desc span.dt-column-order:after,
table.dataTable thead>tr>td.dt-ordering-asc span.dt-column-order:before,
table.dataTable thead>tr>td.dt-ordering-asc span.dt-column-order:after,
table.dataTable thead>tr>td.dt-ordering-desc span.dt-column-order:before,
table.dataTable thead>tr>td.dt-ordering-desc span.dt-column-order:after {
  left: 0;
  line-height: 4px;
  font-size: 14px !important;
}

table.dataTable thead>tr>th.dt-orderable-asc span.dt-column-order:before,
table.dataTable thead>tr>th.dt-ordering-asc span.dt-column-order:before,
table.dataTable thead>tr>td.dt-orderable-asc span.dt-column-order:before,
table.dataTable thead>tr>td.dt-ordering-asc span.dt-column-order:before {
  content: "\ea55";
  font-family: remixicon !important;
}

table.dataTable thead>tr>th.dt-orderable-desc span.dt-column-order:after,
table.dataTable thead>tr>th.dt-ordering-desc span.dt-column-order:after,
table.dataTable thead>tr>td.dt-orderable-desc span.dt-column-order:after,
table.dataTable thead>tr>td.dt-ordering-desc span.dt-column-order:after {
  content: "\ea4f";
  font-family: remixicon !important;
}

table.dataTable {
  thead {
    tr {
      th {
        &.no-orderable {
          padding-right: 10px !important;
        }
      }
    }
  }

  tbody {
    tr {
      td {
        &.td-collapse {
          padding: 4px 8px !important;
        }

        &.td-null-collapse {
          padding: 4px 8px !important;
        }

        &.have-orderable {
          text-align: right !important;
          padding-right: 30px;
        }

        &.no-orderable {
          text-align: right !important;
        }

        &.dt-type-numeric {
          text-align: unset;
        }
      }
    }
  }

  .isCurrency {
    text-align: right !important;
  }
}

table.dataTable.dtr-inline.collapsed {
  letter-spacing: 0.2px !important;

  tbody {
    tr.child {
      td.child {
        padding: 0px 10px !important;
      }

      ul {
        padding: 12px 10px !important;

        li {
          .dtr-title {
            font-weight: 400 !important;
            color: var(--color-w-b-2);
            position: relative;

            &::after {
              position: absolute;
              right: 0px;
              content: ":";
            }
          }

          .dtr-data {
            color: var(--color-w-b-1);
          }
        }
      }

      ul.dtr-details {
        position: relative;
        width: 100%;

        &::before {
          content: "";
          position: absolute;
          top: 0;
          left: -10px;
          height: 100%;
          width: 2px;
          background-color: var(--color-primary);
          border-radius: 4px;
        }

        li {
          border-bottom: none;
          padding: 4px 0px;
          width: 100% !important;
          display: flex;
          align-items: center;
          gap: 10px;

          span.dtr-title {
            min-width: fit-content;

            &::after {
              right: -4px;
            }

            .multi-sort-wrapper {
              display: none;
            }
          }
        }
      }
    }
  }
}

.oc-checkbox-col {
  padding: 8px 10px !important;

  div {
    div {
      height: 15px !important;
    }
  }

  input {
    margin: 0px !important;
  }
}

div.dt-container {
  position: unset;
  width: 100% !important;
}

div.dt-scroll,
div.dtfh-floatingparent {
  position: unset;
}

div.dt-processing {
  display: none !important;
}

div.dt-container div.dt-layout-cell {
  padding: 0 !important;
}

div.dt-container.dt-empty-footer .dt-scroll-body {
  border-bottom: none;
}

//s style scroll for data table only
.container-table {
  .dt-scroll-body::-webkit-scrollbar {
    width: 9px;
    height: 9px;

    @media (max-width: 540px) {
      display: none;
    }
  }

  .dt-scroll-body::-webkit-scrollbar-track {
    background: transparent;
  }

  .dt-scroll-body::-webkit-scrollbar-thumb {
    background-color: transparent;
    border: 3px solid var(--bg-content) !important;
    border-radius: 50px;
  }

  // hover
  .dt-scroll-body:hover::-webkit-scrollbar-thumb {
    background-color: var(--color-w-b-4) !important;
  }

  .dt-scroll-body::-webkit-scrollbar-thumb:hover {
    background-color: var(--color-w-b-3) !important;
  }
}

table.dataTable.stripe>tbody>tr:nth-child(odd).selected>*,
table.dataTable.display>tbody>tr:nth-child(odd).selected>* {
  box-shadow: inset 0 0 0 9999px rgba(0, 0, 0, 0.05) !important;
}

table.dataTable>tbody>tr.selected>* {
  box-shadow: inset 0 0 0 9999px rgba(0, 0, 0, 0.05) !important;
}

table.dataTable.hover>tbody>tr.selected:hover>*,
table.dataTable.display>tbody>tr.selected:hover>* {
  box-shadow: inset 0 0 0 9999px rgba(0, 0, 0, 0.05) !important;
}

table.dataTable.has-collapse:not(.collapsed)>tbody>tr>td:first-child:not(.dataTables_empty).td-collapse,
table.dataTable.has-collapse:not(.collapsed)>thead>tr>th:first-child.td-collapse {
  padding: 0 !important;
}

html .container-table table.dataTable thead tr>.dtfc-fixed-start,
html .container-table table.dataTable thead tr>.dtfc-fixed-end,
html .container-table table.dataTable tfoot tr>.dtfc-fixed-start,
html .container-table table.dataTable tfoot tr>.dtfc-fixed-end,
html .container-table table.dataTable tbody tr>.dtfc-fixed-start,
html .container-table table.dataTable tbody tr>.dtfc-fixed-end {
  background-color: var(--bg-content);
}

.dark {

  table.dataTable.stripe>tbody>tr:nth-child(odd).selected>*,
  table.dataTable.display>tbody>tr:nth-child(odd).selected>* {
    box-shadow: inset 0 0 0 9999px rgba(255, 255, 255, 0.05) !important;
  }

  table.dataTable>tbody>tr.selected>* {
    box-shadow: inset 0 0 0 9999px rgba(0, 0, 0, 0.05) !important;
  }

  table.dataTable.hover>tbody>tr:hover>*,
  table.dataTable.display>tbody>tr:hover>* {
    &.isLineClamp {
      .has-modal-detail {
        .has-more {
          background-color: #292929;

        }
      }
    }

    background-color: #292929 !important;
  }

  table.dataTable.hover>tbody>tr.selected:hover>*,
  table.dataTable.display>tbody>tr.selected:hover>* {
    box-shadow: inset 0 0 0 9999px rgba(0, 0, 0, 0.05) !important;
  }

  table.dataTable.dtr-inline.collapsed>tbody>tr>td.dtr-control:before {
    color: #dee2e6 !important;
  }

  .dt-processing {
    background: #f6f7f91a;
  }
}

input[type="checkbox"].oc-checkbox {
  &.disabled {
    pointer-events: none;
    opacity: 0.5;
  }

  &:focus::after {
    border: none !important;
  }
}

.ocs-wrapper-table {
  height: 100% !important; //old
  display: flex;
  flex-direction: column;
  box-sizing: border-box;

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
    width: 100% !important;
    height: 100% !important;
    box-sizing: border-box !important;

    &.no-scroll-table {
      height: auto !important;
    }
  }
}

//all apply style scroll
.oc-content,
.oc-modal {
  .dt-scroll-body::-webkit-scrollbar-thumb {
    border: 3px solid var(--bg-wrapper) !important;
  }

  .oc-nav-card-scroll {
    &::-webkit-scrollbar-thumb {
      border: 3px solid var(--bg-content) !important;
    }
  }

  div.dt-scroll div.dtfc-top-blocker,
  div.dt-scroll div.dtfc-bottom-blocker,
  div.dtfh-floatingparent div.dtfc-top-blocker,
  div.dtfh-floatingparent div.dtfc-bottom-blocker {
    background-color: transparent;
  }
}

div.dt-scroll div.dtfc-top-blocker,
div.dt-scroll div.dtfc-bottom-blocker,
div.dtfh-floatingparent div.dtfc-top-blocker,
div.dtfh-floatingparent div.dtfc-bottom-blocker {
  background-color: transparent;
  border-top-right-radius: 10px;
}

html.dark div.dtfc-top-blocker,
html.dark div.dtfc-bottom-blocker {
  background-color: transparent;
}

.min-width,
.minWidth {
  width: 1px !important;
  white-space: nowrap !important;
}

table.dataTable>tbody>tr>td {

  &.isLineClamp {
    width: auto !important;
    max-width: 250px;
    white-space: unset !important;

    // .has-modal-detail {
    //   position: relative;
    //   width: 100%;
    //   overflow-x: hidden;
    //   white-space: nowrap;

    //   .has-more {
    //     &.show {
    //       visibility: visible;
    //     }

    //     visibility: hidden;
    //     position: absolute;
    //     top: 0;
    //     right: 0;
    //     height: 100%;
    //     background-color: var(--bg-content);

    //   }
    // }
  }
}

.detail-container {
  position: relative;
  padding: 30px 0 20px 0;

  .btn-close-detail {
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-w-b-1);
    cursor: pointer;
    margin-right: -8px;
    position: absolute;
    top: 8px;
    right: 0px;

    i {
      font-size: 13px;
      line-height: 13px;
      pointer-events: none;
    }
  }
}
</style>
