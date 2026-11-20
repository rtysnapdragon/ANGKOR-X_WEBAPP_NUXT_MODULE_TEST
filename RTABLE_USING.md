# RTable Usage

`RTable` is the Nuxt UI 4 table component used by this module. It supports local/client-side data and server/API data, OCTable-compatible columns and options, row selection, sorting, pagination, row reorder, fixed columns, mobile cards, and custom templates.

Source: `src/runtime/app/components/table/RTable.vue`

## Basic usage

`RTable` is normally auto-imported by the module.

```vue
<script setup>
const rows = ref([
  { Id: 1, Name: 'Novel A', Status: 1 },
  { Id: 2, Name: 'Novel B', Status: 0 }
])

const columns = [
  { key: 'Name', label: 'Name', sortable: true },
  { key: 'Status', label: 'Status', width: 120 }
]

const options = {
  searchable: true,
  paging: true,
  lengthMenu: [10, 25, 50]
}
</script>

<template>
  <RTable
    :data="rows"
    :columns="columns"
    :options="options"
  />
</template>
```

In local mode, search, column filters, sorting, and pagination are applied to `data` automatically.

## Props and models

| Prop | Type / shape | Default | Purpose |
| --- | --- | --- | --- |
| `data` | `any[]` | `[]` | Local rows. Ignored when `api` is set. |
| `api` | `string \| { url, method, filter, where }` | — | Server data source. String URLs become `GET` requests. |
| `columns` | `RTableColumn[] \| OCTableColumn[]` | `[]` | Column definitions. |
| `options` | `object` | see below | Toolbar, pagination, sorting, selection, pinning, and row behavior. |
| `selectedPk` | `string` | — | Primary-key field. Enables checkbox selection and stable row identity. |
| `selectAllPk` | `string` | — | Response field containing all selectable primary keys for server-side select-all. |
| `v-model` / `selected` | `any[]` | `[]` | Selected rows, or primary-key scalars in `selectAllPk` mode. |
| `v-model:loading` | `boolean` | `false` | Controlled loading state. Server requests also update it. |
| `showTemplate` | `boolean` | `false` | Replaces the main table with the `#template` slot. |
| `keyTable` | `string \| number` | — | Remount/reset key for `UTable`; changes reset page, search, filters, order, and column order. |
| `waitFilter` | `boolean` | `false` | Truthy value skips the first API load until `filter()` is called. |
| `autoload` | `boolean` | `true` | `false` skips the first API request. |
| `isTotalDetail` | `boolean` | `false` | Hides the built-in pagination/footer row. |
| `minWidth` | `number` | — | Declared for compatibility; current compact layout uses column widths and measured container width. |
| `storeId` | `string` | — | Persists page/page size and selection through `useRTableDataStore()`. |
| `stateKey` | `string` | — | Store key used to restore and save full table state. |
| `haveBorder` | `boolean \| string` | `false` | OCTable-compatible alias for border styling. |
| `hasBorder` | `boolean` | `false` | Adds border styling; wins over `haveBorder`. |
| `hasScroll` | `boolean` | `false` | Lets the page scroll instead of fitting the table to the viewport. |
| `hideGroupBtnSelect` | `boolean \| string` | `false` | Hides the bulk-selection action bar. |
| `filterState` | `object` | — | Declared for compatibility; current code emits `update:filterState` but does not consume this prop as initial state. |
| `isClamp` | `boolean` | `false` | Enables truncated text for all cells. |
| `exportFilename` | `string` | `'data'` | Passed to the header export helper. |
| `color` | `string` | `'primary'` | Adds `r-table__utable--{color}` to `UTable`. |
| `variant` | `string` | `'outline'` | Adds `r-table__utable--{variant}` to `UTable`. |

## Column definitions

Two column shapes are accepted.

### RTable shape

```ts
const columns = [
  {
    key: 'Title',
    label: 'Title',
    slot: 'Title',
    sortable: true,
    width: 240,
    minWidth: 160,
    sortData: [
      { data: 'Title', title: 'Title A-Z' },
      { data: 'TitleDesc', title: 'Title Z-A' }
    ]
  }
]
```

### OCTable shape

```ts
const columns = [
  {
    title: 'Title',
    data: 'Title',
    render: 'Title',
    orderable: true,
    className: 'min-width',
    sortData: [{ data: 'Title', title: 'Title' }]
  }
]
```

| Field | Purpose |
| --- | --- |
| `key` / `data` | Row field name and internal column id. Required. |
| `label` / `title` | Header label. |
| `slot` / `render` string | Parent slot name. Leading `#` is removed. |
| `render` function | Fallback renderer called as `render(value, 'display', row, meta)`. |
| `sortable` / `orderable` | Enables click-to-sort. RTable columns are opt-in; OCTable columns are sortable unless `orderable: false`. |
| `sortData` | Enables a multi-field sort dropdown. Accepts strings or `{ data, title }` objects. |
| `width` / `minWidth` | Column sizing. Numbers are pixels. |
| `className` | `all`, `min-width`, or `width`; controls collapse behavior. |
| `hidden` | Hides the column. |
| `alignRight` | Right-aligns header and text cell content. |
| `isClamp` / `isLineClamp` | Renders truncated text and opens full text in a modal. |
| `clampLines` | Passed to truncated text rendering. |

Column slot name resolution is:

1. `column.slot`
2. `column.key`
3. `${column.key}-cell`

Header slot name: `${column.key}-header`.

## Options

```ts
const options = {
  searchable: true,
  paging: true,
  lengthMenu: [10, 25, 50, 100],
  pageLength: 25,
  reload: true,
  sticky: true,
  virtualize: false,
  rowSelect: false,
  rowReorder: false,
  fixedColumns: { left: 1, right: 0 },
  order: { idx: 0, dir: 'asc' }
}
```

| Option | Default | Purpose |
| --- | --- | --- |
| `searchable` / `searching` | `true` | Shows the search box. Either key enables it. |
| `classSearch` | — | Extra class for the search input. |
| `paging` | `true` | Shows pagination. When `false`, API payload omits `Pages` and `Records`. |
| `lengthMenu` / `pageSizes` | `[10, 25, 50, 100]` | Rows-per-page choices. |
| `pageLength` / `pageSize` | first length value | Initial page size. |
| `reload` | `true` | Shows the reload button. |
| `sticky` | `true` | Enables `UTable` sticky header. |
| `virtualize` | `false` | Enables `UTable` row virtualization. |
| `rowSelect` | `false` | Enables row-click selection through `UTable` `on-select`. |
| `rowReorder` | `false` | Enables the drag handle column. Object form: `{ enabled, onReorder(diff, rows) }`. |
| `fixedColumns` | — | Pins columns. Supports `true`, a count, an index array, or `{ left, right }` / `{ leftColumns, rightColumns }`. |
| `order` | `{ idx: 0, dir: '' }` | Initial order. Supports `[idx, dir]`, `{ idx, dir }`, or `{ by, dir }`. |
| `isShowSelectedBtn` | `false` | Forces the selection action bar to show. |
| `rowCallback` | — | Transforms each local page row before rendering. |
| `maxRowHeight` | `71` | Caps viewport-fit row height. |
| `showNoData` | `true` | Controls empty text in `showTemplate` mode. |
| `info`, `isScroll`, `scrollY`, `scrollX`, `scrollHeight` | legacy defaults | Accepted for compatibility. Use `hasScroll` for page-scroll behavior. |

## Server/API mode

```vue
<script setup>
const tableRef = ref()
const api = helper().api

const tableApi = reactive({
  url: api.novels.list,
  method: 'POST',
  filter: {}
})

const tableColumns = [
  { key: 'Title', label: 'Title', sortable: true },
  { key: 'Code', label: 'Code', sortable: true },
  { key: 'Status', label: 'Status', width: 120 }
]

const tableOptions = {
  searchable: true,
  lengthMenu: [10, 25, 50],
  order: { idx: 0, dir: 'asc' }
}

function reloadTable() {
  return tableRef.value?.reload()
}

function applyFilter(close) {
  tableApi.filter = { Status: [1] }
  reloadTable()
  close?.()
}

function reshapeRequest(payload) {
  payload.FilterSearch = payload.Search
  delete payload.Search
}
</script>

<template>
  <RTable
    ref="tableRef"
    :api="tableApi"
    :columns="tableColumns"
    :options="tableOptions"
    @update:data="reshapeRequest"
  >
    <template #headerLeft>
      <button @click="applyFilter">Filter active</button>
    </template>

    <template #headerRight>
      <button @click="reloadTable">Reload</button>
    </template>

    <template #Title="{ rowData, value }">
      {{ rowData?.Title ?? value }}
    </template>

    <template #actions="{ rowData }">
      <button @click="console.log(rowData)">Open</button>
    </template>
  </RTable>
</template>
```

### Request payload

`RTable` sends:

```ts
{
  Pages: 1,
  Records: 10,
  Search: '',
  OrderBy: 'Title',
  OrderDir: 'asc',
  ...api.filter
}
```

- `OrderBy` and `OrderDir` are omitted when no direction is active.
- `Pages` and `Records` are omitted when `options.paging === false`.
- `@update:data` receives this request object before the request is sent and may mutate it.

### Accepted response shapes

`RTable` accepts:

- a bare array;
- `{ dataSrc: [...] }`;
- `{ data: [...] }`;
- `{ Data: [...], Total: 100 }`;
- `{ Items: [...], Total: 100 }`;
- a nested object selected by `api.where`.

Total is read from `Total`, `total`, `TotalRecord`, `totalRecords`, `RecordCount`, `recordCount`, or common count fields on the first row.

`@update:dataSrc` emits the raw response after `api.where` is applied and before envelope unwrapping.

## Cell slots and actions

```vue
<RTable :data="rows" :columns="columns">
  <template #Status="{ rowData, value }">
    <span :class="value === 1 ? 'active' : 'inactive'">
      {{ rowData?.StatusLabel ?? value }}
    </span>
  </template>

  <template #Title-header="{ column }">
    {{ column.label }}*
  </template>

  <template #actions="{ rowData, index }">
    <button @click="edit(rowData, index)">Edit</button>
  </template>
</RTable>
```

Cell slot scope contains the spread row fields plus:

```ts
{
  row,
  rowData,
  value,
  index,
  column,
  cell
}
```

Header slot scope contains `{ column, header, table }`.

Providing an `#actions` slot automatically appends an `actions` column unless one already exists.

## Toolbar and layout slots

| Slot | Scope | Use |
| --- | --- | --- |
| `headerTable` | — | Content above the built-in header. |
| `headerLeft` | — | Title, filters, filter popover. |
| `headerCenter` | — | Tabs or secondary controls. |
| `headerApplyFilter` | — | Apply-filter button. |
| `headerRight` | — | Create/export/top-right actions. |
| `middleTable` | — | Content between toolbar and table. |
| `loading` | `{ data }` | Loading UI in `showTemplate` mode only. |
| `template` | `{ data }` | Fully custom card/list layout when `showTemplate` is true. |
| `card` | `{ row, index }` | Full mobile card override. |
| `totalDetail` | `{ total }` | Totals row when `isTotalDetail` is true. |
| `ShowDetailAfterTableOne` | — | Extra content after the table. |
| `ShowDetailAfterTableTwo` | — | Extra second content block after the table. |

Dynamic column slots and `#actions` also work inside mobile cards.

## Custom template mode

```vue
<script setup>
const showTemplate = ref(true)
</script>

<template>
  <RTable
    :data="rows"
    :columns="columns"
    :show-template="true"
  >
    <template #loading>
      Loading records...
    </template>

    <template #template="{ data }">
      <div v-for="row in data" :key="row.Id">
        {{ row.Name }}
      </div>
    </template>
  </RTable>
</template>
```

## Mobile card mode

```vue
<RTable :data="rows" :columns="columns">
  <template #card="{ row, index }">
    <article>
      <h3>{{ row.Title }}</h3>
      <span>#{{ index + 1 }}</span>
    </article>
  </template>

  <template #Status="{ rowData }">
    {{ rowData?.Status }}
  </template>
</RTable>
```

Without `#card`, `RTableMobileCard` renders one card per row using the column labels and values.

## Row selection

```vue
<script setup>
const selected = ref([])

const options = {
  rowSelect: true
}

function bulkDelete() {
  const ids = selected.value.map(row => row.Id)
}
</script>

<template>
  <RTable
    :data="rows"
    :columns="columns"
    selected-pk="Id"
    v-model="selected"
    :options="options"
    @actionCheck="onSelectionChange"
  >
    <template #headerLeft>
      <button :disabled="!selected.length" @click="bulkDelete">
        Delete selected
      </button>
    </template>
  </RTable>
</template>
```

- `selected-pk` enables checkboxes and compares selection by that field.
- `options.rowSelect` makes row clicks toggle selection.
- `actionCheck` emits one row when exactly one item is selected, otherwise an array.
- `selectAllThisPage()` and `selectAllTotal()` are exposed for custom bulk controls.
- `clearAll()` clears selection and exits the selected-only view.

### Server-side select all

```vue
<RTable
  :api="tableApi"
  :columns="columns"
  selected-pk="Id"
  select-all-pk="AllIds"
  v-model="selected"
/>
```

The API response must provide `AllIds` as an array of primary keys. In this mode, `selected` contains scalar ids instead of row objects.

## Sorting and filtering

Columns with `sortable`, `orderable`, or `sortData` are sortable.

```ts
const columns = [
  {
    key: 'Title',
    label: 'Title',
    sortData: [
      { data: 'Title', title: 'Title A-Z' },
      { data: 'TitleDesc', title: 'Title Z-A' }
    ]
  }
]
```

Initial order:

```ts
const options = {
  order: { idx: 0, dir: 'desc' }
}
```

Events:

```vue
<RTable
  :data="rows"
  :columns="columns"
  @onSort="onSort"
  @onOrder="onOrder"
  @update:filterState="onFilterState"
/>
```

```ts
function onSort(payload) {
  console.log(payload.column, payload.direction, payload.field, payload.source)
}

function onOrder(payload) {
  console.log(payload[0], payload[1])
}

function onFilterState(state) {
  console.log(state.search, state.sort, state.columnFilters)
}
```

The built-in header column-filter menu is currently commented out in `RTableHeader.vue`. Use `#headerApplyFilter` with `RTableFilter`, `RTblFilter`, or custom filter UI. In local mode, filters must be supplied through the internal filter flow; in server mode, update `api.filter` and call `reload()`.

## Row reorder

```ts
const options = {
  rowReorder: {
    enabled: true,
    onReorder(diff, rows) {
      console.log(diff, rows)
    }
  }
}
```

```vue
<RTable
  :data="rows"
  :columns="columns"
  :options="options"
  @onRowReorder="(event, diff, edit) => saveOrder(diff)"
/>
```

Local data mode emits `update:data` and `update:dataSrc` with the reordered array. Server mode emits `onRowReorder` and calls `options.rowReorder.onReorder` when provided.

## Fixed, collapsible, and draggable columns

```ts
const options = {
  fixedColumns: { left: 1, right: 0 }
}

const columns = [
  { key: 'Title', label: 'Title', className: 'min-width', minWidth: 220 },
  { key: 'Description', label: 'Description', className: 'all' },
  { key: 'Code', label: 'Code', className: 'width', width: 140 }
]
```

- `fixedColumns` pins columns through `UTable` `columnPinning`.
- `className: 'all'` always moves a column into the expandable sub-row.
- `className: 'min-width'` moves a column into the sub-row only when the container is too narrow.
- `className: 'width'` keeps a fixed width and truncates cell text.
- Column headers can be drag-reordered on desktop. Changing `keyTable` resets this internal order.

## Events

| Event | Payload | When |
| --- | --- | --- |
| `update:data` | request payload | Before an API request; the payload can be mutated to reshape it. |
| `update:dataSrc` | raw response | After an API response is received. |
| `update:filterState` | filter-state object | Search, sort, filter, order, page, or page size changes. |
| `actionCheck` | row or row array | Selection changes. |
| `reloadByFixedData` | — | Reload button clicked in local mode. |
| `onSelectRecord` | `(pageSize, page)` | Rows-per-page changes. |
| `onSaveState` | full store state object | API state is saved to `stateKey`. |
| `onChangePagination` | `(page, pageSize)` | Page changes. |
| `onSearching` | `search` | Search changes. |
| `onSort` | `{ column, direction, field, source }` | Sort changes. |
| `onOrder` | `[orderBy, orderDir]` | Sort changes, legacy payload. |
| `onRowReorder` | `(event, diff, true)` | Row drag completes. |
| `update:selected` | selected array | Selection v-model updates. |
| `update:loading` | boolean | Loading v-model updates. |

## Exposed ref API

```vue
<script setup>
const tableRef = ref()

function reload() {
  tableRef.value?.reload()
}

function loadRows(rows) {
  tableRef.value?.setListData(rows)
}

function addRow(row) {
  tableRef.value?.addRowData(row)
}

function updateRow(row) {
  tableRef.value?.updateRowData(row, 'Id')
}

function selectAll() {
  tableRef.value?.selectAllTotal()
}
</script>

<template>
  <RTable ref="tableRef" :data="rows" :columns="columns" selected-pk="Id" />
</template>
```

| Method | Purpose |
| --- | --- |
| `reload(currentPage = true)` | Refetches API data. Passing `false` resets to page 1 first. Local data is already reactive. |
| `filter()` | Resets to page 1 and refetches API data. |
| `responsive()` | Re-measures the table container. |
| `dt()` | Returns the underlying `UTable` API when available, otherwise `null`. Not a DataTables instance. |
| `setListData(data)` | Replaces rendered rows. |
| `addRowData(row)` | Inserts a row at the top and re-syncs state. |
| `updateRowData(row, pkFieldName)` | Replaces the row whose `pkFieldName` matches. |
| `getSelected()` | Returns the current selection array. |
| `clearAll()` | Clears selection and selected-only view. |
| `selectAllThisPage()` | Selects visible rows. |
| `selectAllTotal()` | Selects all local rows, or the `selectAllPk` key list. |
| `toggleRow(row)` | Toggles one row. |
| `toggleAll()` | Toggles all visible rows. |

## State persistence

`storeId` and `stateKey` use the host-provided `useRTableDataStore()` auto-import.

```vue
<RTable
  :api="tableApi"
  :columns="columns"
  store-id="novel-table"
  state-key="novelTableState"
/>
```

- `storeId` persists page and page size to the shared store/localStorage and stores selection.
- `stateKey` restores paging, search, order, and rows on mount and saves state after fetches and local mutations.
- `onSaveState` emits the full state object before it is written.

## Caveats

- `dt()` is compatibility-only; `RTable` uses `UTable`, not DataTables.
- `filterState` is emitted but not currently applied as initial state.
- `minWidth` is accepted for compatibility but not currently used by the compact-layout calculation.
- `clampLines` is read by the renderer but is not declared in the props list.
- The header export/column-filter menus in `RTableHeader.vue` are currently commented out; supply custom toolbar UI for those actions.
- `options.showNoData` affects `showTemplate` empty output; the normal table has its own built-in empty state.
- In `selectAllPk` mode, selected values are primary-key scalars, not full row objects.
- `keyTable` changes reset page, search, filters, order, and internal column order.
