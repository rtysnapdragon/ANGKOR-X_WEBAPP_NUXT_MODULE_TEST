<template>
    <!-- Tabs: each panel is mounted with v-if, so switching remounts the table and `state-key` restores it. -->
    <div class="demo-tabs" role="tablist" aria-label="RTankTable demos" @keydown.left.prevent="tab = 'local'" @keydown.right.prevent="tab = 'api'">
      <button
        id="tab-local"
        type="button"
        role="tab"
        aria-controls="panel-local"
        :aria-selected="tab === 'local'"
        :tabindex="tab === 'local' ? 0 : -1"
        :class="{ active: tab === 'local' }"
        @click="tab = 'local'"
      >
        1. Local data
      </button>
      <button
        id="tab-api"
        type="button"
        role="tab"
        aria-controls="panel-api"
        :aria-selected="tab === 'api'"
        :tabindex="tab === 'api' ? 0 : -1"
        :class="{ active: tab === 'api' }"
        @click="tab = 'api'"
      >
        2. API
      </button>
    </div>

    <!-- ===================================================================== -->
    <!-- USAGE 1: local data (`data` prop)                                     -->
    <!-- ===================================================================== -->
    <section v-if="tab === 'local'" id="panel-local" role="tabpanel" aria-labelledby="tab-local">
      <RTankTable
        ref="localTable"
        v-model="localSelected"
        :data="localData"
        :columns="compact ? compactColumns : fullColumns"
        :key-table="compact ? 'compact' : 'full'"
        :options="localOptions"
        :show-template="cards"
        :hide-group-btn-select="hideSelectButtons"
        :is-total-detail="totalOnly"
        selected-pk="id"
        state-key="demo-local-users"
        have-border
        @on-order="(order) => log(localLines, `onOrder ${JSON.stringify(order)}`)"
        @on-searching="(s) => log(localLines, `onSearching '${s}'`)"
        @on-change-pagination="(p, size) => log(localLines, `onChangePagination page=${p} size=${size}`)"
        @on-select-record="(size, p) => log(localLines, `onSelectRecord size=${size} page=${p}`)"
        @action-check="(payload) => log(localLines, `actionCheck ${describeCheck(payload)}`)"
        @on-row-reorder="onRowReorder"
        @reload-by-fixed-data="onReloadByFixedData"
      >
        <!-- label above the toolbar -->
        <template #headerTable>
          <h2 class="demo-title">Local data <small>— the <code>data</code> prop, searched/sorted/paged in the browser</small></h2>
        </template>

        <!-- toolbar -->
        <template #headerLeft>
          <button type="button" class="demo-btn" @click="addUser">Add user</button>
          <button type="button" class="demo-btn" @click="toggleFirstStatus">Update first row</button>
          <button type="button" class="demo-btn" @click="localTable?.setListData(createUsers(40, ++seed))">Replace with 40 users</button>
        </template>
        <template #headerCenter>
          <label class="demo-field">
            <span class="sr-only">Department</span>
            <select v-model="department">
              <option value="">All departments</option>
              <option v-for="d in DEPARTMENTS" :key="d" :value="d">{{ d }}</option>
            </select>
          </label>
        </template>
        <template #headerApplyFilter>
          <button v-if="department" type="button" class="demo-chip" @click="department = ''">
            Department: {{ department }} <span aria-hidden="true">✕</span><span class="sr-only">clear</span>
          </button>
        </template>
        <template #headerRight>
          <label class="demo-toggle"><input v-model="cards" type="checkbox" /> Cards (show-template)</label>
          <label class="demo-toggle"><input v-model="compact" type="checkbox" /> Compact (key-table)</label>
          <label class="demo-toggle"><input v-model="scroll" type="checkbox" /> Inner scroll (isScroll)</label>
          <label class="demo-toggle"><input v-model="hideSelectButtons" type="checkbox" /> Hide select buttons</label>
          <label class="demo-toggle"><input v-model="totalOnly" type="checkbox" /> Total only (is-total-detail)</label>
        </template>

        <!-- between toolbar and table -->
        <template #middleTable>
          <p class="demo-hint">
            Drag the handle to reorder (disabled while searching/sorting). Suspended users cannot be selected
            (<code>options.enableRowSelection</code>). Shrink the window to see columns collapse into the expand/collapse child row.
          </p>
        </template>

        <!-- column slots: render: '#user' etc. -->
        <template #user="{ rowData }"><DemoUserCell kind="user" :row="rowData" /></template>
        <template #contact="{ rowData }"><DemoUserCell kind="contact" :row="rowData" /></template>
        <template #status="{ rowData }"><DemoUserCell kind="status" :row="rowData" /></template>

        <!-- actions column (adds the pinned-looking action column automatically) -->
        <template #actions="{ rowData }">
          <button type="button" class="demo-btn" @click="toggleStatus(rowData)">
            {{ rowData.status === 'Active' ? 'Set away' : 'Set active' }}
          </button>
          <button type="button" class="demo-btn danger" @click="removeUser(rowData.id)">Remove</button>
        </template>

        <!-- inside the table container, below the rows -->
        <template #totalDetail="{ total }">
          <p class="demo-total">{{ total }} users · {{ localSelected.length }} selected</p>
        </template>

        <!-- below the table, before the footer -->
        <template #ShowDetailAfterTableOne>
          <ul class="demo-log" aria-live="polite" aria-label="Event log">
            <li v-if="!localLines.length">Events from RTankTable appear here (search, sort, page, select, reorder…).</li>
            <li v-for="(line, i) in localLines" :key="i">{{ line }}</li>
          </ul>
        </template>
        <template #ShowDetailAfterTableTwo>
          <p class="demo-hint">
            Selected: {{ localSelected.map((u) => u.name).slice(0, 5).join(', ') }}<span v-if="localSelected.length > 5">…</span>
            <button type="button" class="demo-btn" @click="localTable?.responsive()">Re-measure (responsive())</button>
          </p>
        </template>

        <!-- card mode (show-template): slot props[0] is the rows of the current page -->
        <template #template="props">
          <div class="demo-cards">
            <article v-for="u in props[0]" :key="u.id" class="demo-card">
              <DemoUserCell kind="user" :row="u" />
              <DemoUserCell kind="status" :row="u" />
              <p class="du-sub">{{ u.department }} · {{ u.email }}</p>
            </article>
          </div>
        </template>
        <template #loading><p class="demo-hint">Loading cards…</p></template>
      </RTankTable>
    </section>

    <!-- ===================================================================== -->
    <!-- USAGE 2: API (`api` prop)                                             -->
    <!-- ===================================================================== -->
    <section v-else id="panel-api" role="tabpanel" aria-labelledby="tab-api">
      <RTankTable
        :key="apiMountKey"
        ref="apiTable"
        v-model="apiSelected"
        v-model:loading="apiLoading"
        :api="apiConfig"
        :columns="fullColumns"
        :options="apiOptions"
        :autoload="apiAutoload"
        :min-width="1024"
        selected-pk="id"
        select-all-pk="SelectAllIds"
        state-key="demo-api-users"
        @update:data="onParams"
        @update:data-src="(payload) => log(apiLines, `update:dataSrc ${(payload as any)?.dataSrc?.length ?? 0} rows`)"
        @on-save-state="(state) => log(apiLines, `onSaveState keys=${Object.keys(state).join(',')}`)"
        @on-order="(order) => log(apiLines, `onOrder ${JSON.stringify(order)}`)"
        @on-searching="(s) => log(apiLines, `onSearching '${s}'`)"
        @on-change-pagination="(p, size) => log(apiLines, `onChangePagination page=${p} size=${size}`)"
        @on-select-record="(size, p) => log(apiLines, `onSelectRecord size=${size} page=${p}`)"
        @action-check="(payload) => log(apiLines, `actionCheck ${describeCheck(payload)}`)"
      >
        <template #headerTable>
          <h2 class="demo-title">API <small>— the <code>api</code> prop, searched/sorted/paged by the server</small></h2>
        </template>

        <template #headerLeft>
          <button type="button" class="demo-btn" @click="apiTable?.reload()">Reload (current page)</button>
          <button type="button" class="demo-btn" @click="apiTable?.reload(false)">Reload (page 1)</button>
        </template>
        <template #headerApplyFilter>
          <label class="demo-field">
            <span class="sr-only">Department filter</span>
            <select v-model="apiDepartment" @change="applyApiFilter">
              <option value="">All departments</option>
              <option v-for="d in DEPARTMENTS" :key="d" :value="d">{{ d }}</option>
            </select>
          </label>
        </template>
        <template #headerRight>
          <span v-if="apiLoading" class="demo-chip" role="status">Loading…</span>
          <label class="demo-toggle"><input v-model="apiAutoload" type="checkbox" /> Autoload on mount</label>
        </template>

        <template #middleTable>
          <p class="demo-hint">
            <template v-if="apiAutoload">
              Requests go to <code>/api/demo/users</code>. "Select all" returns every matching id from the server
              (<code>select-all-pk</code>), so the selection survives paging. Columns 1–2 and the actions column are pinned
              (<code>fixedColumns</code>).
            </template>
            <template v-else>Autoload is off: nothing is fetched until you press Reload (or search/sort/page).</template>
          </p>
        </template>

        <template #user="{ rowData }"><DemoUserCell kind="user" :row="rowData" /></template>
        <template #contact="{ rowData }"><DemoUserCell kind="contact" :row="rowData" /></template>
        <template #status="{ rowData }"><DemoUserCell kind="status" :row="rowData" /></template>

        <template #actions="{ rowData }">
          <button type="button" class="demo-btn" @click="toast.add({ title: `Viewing ${rowData.name}` })">View</button>
        </template>

        <template #totalDetail="{ total }">
          <p class="demo-total">{{ total }} matching users · {{ apiSelected.length }} selected (ids)</p>
        </template>

        <template #ShowDetailAfterTableOne>
          <ul class="demo-log" aria-live="polite" aria-label="Event log">
            <li v-if="!apiLines.length">Events from RTankTable appear here.</li>
            <li v-for="(line, i) in apiLines" :key="i">{{ line }}</li>
          </ul>
        </template>
        <template #ShowDetailAfterTableTwo>
          <p class="demo-hint">Last request params: <code>{{ lastParams }}</code></p>
        </template>
      </RTankTable>
    </section>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import type { OCApiConfig, OCColumn, OCLegacyRender, OCReorderDiff, RTankTableOptions } from '../../../rtanktable/RTankTable.vue'
import { createUser, createUsers, DEPARTMENTS, type DemoUser } from './demo-users.js'

/** The subset of RTankTable's exposed API used here. */
interface RTankTableApi {
  reload(currentPage?: boolean): Promise<void>
  filter(): Promise<void>
  setListData(rows: DemoUser[]): void
  addRowData(row: DemoUser): void
  updateRowData(row: DemoUser, pk: string): void
  responsive(): void
}

const toast = useToast()
const tab = ref<'local' | 'api'>('local')
const target = ref()
/* -------------------------------- columns --------------------------------- */
/* Shared by both tabs. Covers: slot render, legacy function render, alignRight,
   multi-field sort (sortData), line clamp, hidden column, `all` (never collapses). */

const money: OCLegacyRender = (value) => `<span class="font-semibold">$${Number(value).toLocaleString('en-US')}</span>`
const shortDate: OCLegacyRender = (value) =>
  new Date(String(value)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

const colName: OCColumn = { title: 'User', data: 'name', render: '#user', className: 'all' }
const colContact: OCColumn = {
  title: 'Contact',
  data: 'email',
  render: '#contact',
  orderable: false, // the header button is off; the funnel menu sorts by Email or Phone
  sortData: [
    { data: 'email', title: 'Email' },
    { data: 'phone', title: 'Phone' },
  ],
}
const colDepartment: OCColumn = { title: 'Department', data: 'department' }
const colStatus: OCColumn = { title: 'Status', data: 'status', render: '#status' }
const colSalary: OCColumn = { title: 'Salary', data: 'salary', render: money, alignRight: true }
const colJoined: OCColumn = { title: 'Joined', data: 'joinedAt', render: shortDate }
const colBio: OCColumn = { title: 'Bio', data: 'bio', isLineClamp: true }
const colPhone: OCColumn = { title: 'Phone', data: 'phone', hidden: true } // exists for sorting, never shown

const fullColumns: OCColumn[] = [
  colName, colContact, colDepartment, { title: 'Role', data: 'role' }, colStatus, colSalary, colJoined, colBio, colPhone,
]
const compactColumns: OCColumn[] = [colName, colDepartment, colStatus, colSalary]

/* ------------------------------ shared helpers ----------------------------- */

// function log(target: Ref<string[]>, message: string) {
//   target.value = [`${new Date().toLocaleTimeString()}  ${message}`, ...target.value].slice(0, 5)
// }
function log(target, message, limit = 5) {
  if (!target || !Array.isArray(target.value)) {
    return
  }

  target.value.unshift(
    `${new Date().toLocaleTimeString()} ${message}`
  )

  target.value = target.value.slice(0, limit)
}
function describeCheck(payload: unknown) {
  if (Array.isArray(payload)) return `-> ${payload.length} selected`
  return `row #${(payload as DemoUser | undefined)?.id ?? '?'}`
}

/* ============================ USAGE 1: local data ========================== */

const localTable = ref<RTankTableApi>()
const localLines = ref<string[]>([])
const localSelected = ref<DemoUser[]>([])

let seed = 1
let nextId = 1000
const localUsers = ref<DemoUser[]>(createUsers(120, seed))
const department = ref('')
// Parent-side filtering: changing the `data` prop replaces the table's rows.
const localData = computed(() =>
  department.value ? localUsers.value.filter((u) => u.department === department.value) : localUsers.value,
)

const cards = ref(false)
const compact = ref(false)
const scroll = ref(true)
const hideSelectButtons = ref(false)
const totalOnly = ref(false)

const localOptions = computed<RTankTableOptions>(() => ({
  isScroll: scroll.value,
  searching: true,
  reload: true,
  paging: true,
  info: true,
  showNoData: true,
  lengthMenu: [10, 20, 50, 100],
  pageLength: 10,
  order: { idx: 0, dir: '' }, // no default sort, so row reordering is available
  rowReorder: true,
  classSearch: 'w-[260px]',
  enableRowSelection: (row) => row.status !== 'Suspended',
}))

function addUser() {
  // addRowData only touches the table's rows; `localUsers` (the data prop) is unchanged on purpose.
  localTable.value?.addRowData(createUser(++nextId, nextId))
}

function toggleStatus(user: DemoUser) {
  localTable.value?.updateRowData({ ...user, status: user.status === 'Active' ? 'Away' : 'Active' }, 'id')
}

function toggleFirstStatus() {
  const first = localData.value[0]
  if (first) toggleStatus(first)
}

function removeUser(id: number) {
  localUsers.value = localUsers.value.filter((u) => u.id !== id)
}

function onReloadByFixedData() {
  // Local tables have no server: the reload button asks the parent for fresh data.
  localUsers.value = createUsers(120, ++seed)
  log(localLines, 'reloadByFixedData -> parent regenerated 120 users')
}

function onRowReorder(_event: DragEvent, diff: OCReorderDiff[]) {
  log(localLines, `onRowReorder ${diff.map((d) => `${d.oldPosition}→${d.newPosition}`).join(', ')}`)
}

/* ============================== USAGE 2: API =============================== */

const apiTable = ref<RTankTableApi>()
const apiLines = ref<string[]>([])
const apiSelected = ref<number[]>([]) // select-all-pk: the model holds ids, not rows
const apiLoading = ref(false)
const apiDepartment = ref('')
const apiAutoload = ref(true)
const apiMountKey = ref(0) // `autoload` is read on mount, so toggling it remounts the table
const lastParams = ref('(none yet)')

watch(apiAutoload, () => apiMountKey.value++)

const apiConfig = computed<OCApiConfig>(() => ({
  url: '/api/v1/users/list',
  method: 'post',
  // where: 'Result', // unwrap response.Result (then response.Result.dataSrc)
  // filter: { department: apiDepartment.value }, // merged into every request
}))

const apiOptions: RTankTableOptions = {
  isScroll: true,
  searching: true,
  reload: true,
  paging: true,
  info: true,
  lengthMenu: [10, 20, 50, 100],
  // fixedColumns + selected-pk: legacy column list is [checkbox, ...columns, actions], so
  // joinedAt (index 6 in fullColumns) is idx 7. Default order: newest first.
  order: { idx: 7, dir: 'desc' },
  fixedColumns: { start: 2, end: 1 }, // pins checkbox + User, and the actions column
}

function onParams(params: Record<string, unknown>) {
  // `update:data` fires before every request. A parent could mutate `params` (or attach `.data`) to override it.
  lastParams.value = JSON.stringify({ ...params, department: apiDepartment.value })
  log(apiLines, `update:data page=${params.Pages} size=${params.Records} order=${params.OrderBy ?? '-'}`)
}

async function applyApiFilter() {
  await nextTick() // let the new `api.filter` reach RTankTable before it reads the prop
  await apiTable.value?.filter()
}
</script>

<style lang="scss">
.demo-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

.demo-tabs {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  align-self: flex-start;
  background: var(--bg-content);
  border-radius: 12px;

  button {
    padding: 6px 14px;
    border: 0;
    border-radius: 9px;
    background: transparent;
    color: var(--color-w-b-1);
    font: inherit;
    font-size: 13px;
    cursor: pointer;

    &.active {
      background: var(--color-primary);
      color: #fff;
    }

    &:focus-visible {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }
  }
}

.demo-title {
  margin: 0 0 10px;
  font-size: 16px;
  font-weight: 700;

  small {
    font-size: 12px;
    font-weight: 400;
    color: var(--color-w-b-2);
  }
}

.demo-btn,
.demo-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 36px;
  padding: 0 12px;
  border: 0;
  border-radius: 10px;
  background: var(--bg-content);
  color: var(--color-w-b-1);
  font: inherit;
  font-size: 13px;
  cursor: pointer;

  &.danger {
    color: #b91c1c;
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
}

.demo-chip {
  cursor: default;
}

button.demo-chip {
  cursor: pointer;
}

.demo-field select {
  height: 36px;
  padding: 0 10px;
  border: 0;
  border-radius: 10px;
  background: var(--bg-content);
  color: var(--color-w-b-1);
  font: inherit;
  font-size: 13px;
}

.demo-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-inline-start: 10px;
  font-size: 12px;
  color: var(--color-w-b-1);
  white-space: nowrap;
}

.demo-hint,
.demo-total {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--color-w-b-2);

  code {
    padding: 1px 4px;
    border-radius: 4px;
    background: var(--bg-content);
  }
}

.demo-total {
  padding: 8px 4px;
}

.demo-log {
  margin: 8px 0 0;
  padding: 8px 10px;
  max-height: 96px;
  overflow: auto;
  list-style: none;
  border-radius: 10px;
  background: var(--bg-content);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  line-height: 1.5;
  color: var(--color-w-b-2);
}

.demo-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 10px;
  padding: 4px 0;
}

.demo-card {
  display: grid;
  gap: 6px;
  padding: 12px;
  border-radius: 12px;
  background: var(--bg-content);
}
</style>