<template>
    <!-- Tabs: each panel is mounted with v-if, so switching remounts the table and `state-key` restores it. -->
    <div class="demo-tabs" role="tablist" aria-label="RTableTank demos" @keydown.left.prevent="tab = 'local'" @keydown.right.prevent="tab = 'api'">
      <RTabs v-model="activeTab" :items="tabItems" :content="false" class="w-full" />
    </div>

    <!-- ===================================================================== -->
    <!-- USAGE 1: local data (`data` prop)                                     -->
    <!-- ===================================================================== -->
    <section v-if="activeTab === 'local'" id="panel-local" role="tabpanel" aria-labelledby="tab-local">
      <RTableTank
        ref="localTable"
        v-model="localSelected"
        :data="localData"
        :columns="compact ? compactColumns : highbrid ? columns : fullColumns"
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
          <label class="demo-toggle"><input v-model="recordRow" type="checkbox" /> Record Row</label>
          <label class="demo-toggle"><input v-model="cards" type="checkbox" /> Cards (show-template)</label>
          <label class="demo-toggle"><input v-model="compact" type="checkbox" /> Compact (key-table)</label>
          <label class="demo-toggle"><input v-model="highbrid" type="checkbox" /> High Brid Columsn (Dynamic)</label>
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
          <RTblBtns :items="btnActionsList(rowData)" @actionClick="(type, action) => handleGuestAction(type, rowData, action)"/>
        </template>

        <!-- inside the table container, below the rows -->
        <template #totalDetail="{ total }">
          <p class="demo-total">{{ total }} users · {{ localSelected.length }} selected</p>
        </template>

        <!-- below the table, before the footer -->
        <template #ShowDetailAfterTableOne>
          <ul class="demo-log" aria-live="polite" aria-label="Event log">
            <li v-if="!localLines.length">Events from RTableTank appear here (search, sort, page, select, reorder…).</li>
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
      </RTableTank>
    </section>
    <!-- ===================================================================== -->
    <!-- USAGE 2: API (`api` prop)                                             -->
    <!-- ===================================================================== -->
    <section v-if="activeTab ==='api'" id="panel-api" role="tabpanel" aria-labelledby="tab-api">
      <RTableTank
        :key="apiMountKey"
        ref="apiTable"
        v-model="apiSelected"
        v-model:loading="apiLoading"
        :api="apiConfig"
        :columns="columnDrawerAPI"
        :options="apiOptions"
        :autoload="apiAutoload"
        :min-width="1024"
        selected-pk="Id"
        @on-row-reorder="onApiReorder"
        state-key="demo-api-users"
        @update:data="onParams"
        @update:data-src="(payload) => log(apiLines, `update:dataSrc ${(payload)?.dataSrc?.length ?? 0} rows`)"
        @on-save-state="(state) => log(apiLines, `onSaveState keys=${Object.keys(state).join(',')}`)"
        @on-order="(order) => log(apiLines, `onOrder ${JSON.stringify(order)}`)"
        @on-searching="(s) => log(apiLines, `onSearching '${s}'`)"
        @on-change-pagination="(p, size) => log(apiLines, `onChangePagination page=${p} size=${size}`)"
        @on-select-record="(size, p) => log(apiLines, `onSelectRecord size=${size} page=${p}`)"
        @action-check="(payload) => log(apiLines, `actionCheck ${describeCheck(payload)}`)"
      >
        <!-- select-all-pk="SelectAllIds" -->

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

        <template #Avatar="{ rowData }">
          <RPopover use="nuxtui" placement="bottom" :content="{ side: 'bottom-right'}" >
            <template #trigger>
              <div class="flex items-center gap-2 cursor-pointer">
                <RAvatar :src="rowData?.Avatar" class="cursor-pointer" />
                <div class="flex flex-col gap-0"> 
                  <span> {{ tBy({en: rowData.NameEn || '',km: rowData.Name || ''})}} </span>
                  <span> {{ rowData.Code}}</span>
                </div>
              </div>
            </template>
            <div class="employee-popover">
              <div class="flex items-center gap-3 mb-4">
                <img :src="rowData?.Avatar" class="w-14 h-14 rounded-full object-cover" />
                <div>
                  <div class="font-semibold text-base"> {{ rowData?.Name }} </div>
                  <div class="text-sm opacity-70"> {{ rowData?.Position }} </div>
                  <div class="text-xs opacity-60"> {{ rowData?.Department }} </div>
                </div>
              </div>
              <div class="space-y-2 text-sm">
                <div> <span class="font-medium">{{ $t('code')}}:</span> {{ rowData?.Code }} </div>
                <div> <span class="font-medium">{{ $t('email')}}:</span> {{ rowData?.Email }} </div>
                <div> <span class="font-medium">{{ $t('phone')}}:</span> {{ rowData?.Phone }} </div>
                <div> <span class="font-medium">{{ $t('manager')}}:</span> {{ rowData?.Manager }}
                </div>
                <div> <span class="font-medium">{{ $t('location')}}:</span> {{ rowData?.Location }} </div>
                <div>
                  <span class="font-medium">{{ $t('work_type')}}:</span>
                  {{ rowData?.WorkType }}
                </div>
                <div>
                  <span class="font-medium">{{ $t('status')}}:</span>
                  <span class="text-green-500">
                    {{ rowData?.Status }}
                  </span>
                </div>
              </div>
              <div class="mt-4">
                <div class="font-medium mb-1">{{ $t('skills') }}</div>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="skill in rowData?.Skills"
                    :key="skill"
                    class="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700"
                  >
                    {{ skill }}
                  </span>
                </div>
              </div>
              <div class="mt-4 text-xs opacity-70 line-clamp-3">
                {{ rowData?.Description }}
              </div>
            </div>
          </RPopover>
        </template>
        <template #contact="{ rowData }"></template>
        <template #status="{ rowData }"></template>
        <template #boolean="{ cellData }"><UBadge :color="cellData ? 'success' : 'neutral'" variant="subtle">{{ cellData ? 'Yes' : 'No' }}</UBadge></template>
        <template #link="{ cellData }"><a v-if="cellData" :href="cellData" target="_blank" rel="noopener noreferrer" class="text-primary underline">{{ cellData }}</a><span v-else>-</span></template>
        <template #avatar="{ cellData }"><UAvatar v-if="cellData" :src="cellData" size="sm" /><span v-else>-</span></template>
        <template #CreatedBy="data">
          <div>
            <RProfileInfo :src="data.rowData?.CreatedByAvatar" :title="tBy({
              km: data.rowData.CreatedBy,
              en: data.rowData.CreatedBy,
            })
              " :subTitle="`${formatDateDiff(data.rowData.CreatedAt,datetimeLong)}`" />
          </div>
        </template>
        <template #UpdatedBy="data">
          <div>
            <RProfileInfo :src="data.rowData?.UpdatedByAvatar" :title="tBy({
              km: data.rowData.UpdatedBy,
              en: data.rowData.UpdatedBy,
            })
              " :subTitle="`${formatDateDiff(data.rowData.UpdatedAt,datetimeLong)}`" />
          </div>
        </template>

        <template #actions="{ rowData }">
          <RTblBtns :items="btnActionsList(rowData)" @actionClick="(type, action) => handleGuestAction(type, rowData, action)"/>
        </template>

        <template #totalDetail="{ total }">
          <p class="demo-total">{{ total }} matching users · {{ apiSelected.length }} selected (ids)</p>
        </template>

        <template #ShowDetailAfterTableOne>
          <ul class="demo-log" aria-live="polite" aria-label="Event log">
            <li v-if="!apiLines.length">Events from RTableTank appear here.</li>
            <li v-for="(line, i) in apiLines" :key="i">{{ line }}</li>
          </ul>
        </template>
        <template #ShowDetailAfterTableTwo>
          <p class="demo-hint">Last request params: <code>{{ lastParams }}</code></p>
        </template>
      </RTableTank>
    </section>
</template>

<script setup>
import { createUser, createUsers, DEPARTMENTS } from './demo-users.js'
import MyCard from './MyCard.vue'
import MyAvatarComponent from './MyAvatarComponent.vue'
const toast = useToast()
const { t } = useI18n()
const activeTab = ref('local')
const target = ref()
const confirm = useConfirmStore()
const showDrawer = ref(false)
/* -------------------------------- columns --------------------------------- */
/* Shared by both tabs. Covers: slot render, legacy function render, alignRight,
   multi-field sort (sortData), line clamp, hidden column, `all` (never collapses). */

const money = (value) => `<span class="font-semibold">$${Number(value).toLocaleString('en-US')}</span>`
// const __shortDate = (value) =>
//   new Date(String(value)).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
const shortDate = (value) =>
  value
    ? new Date(String(value)).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '-';
  const tabItems = [
    { label: 'Local', value: 'local' },
    { label: 'Api', value: 'api' },
  ]
const colName = { title: 'User', data: 'name', render: '#user', className: 'all' }
const colContact = {
  title: 'Contact',
  data: 'email',
  render: '#contact',
  orderable: false, // the header button is off; the funnel menu sorts by Email or Phone
  sortData: [
    { data: 'email', title: 'Email' },
    { data: 'phone', title: 'Phone' },
  ],
}

const KNOWN_COL = ["id", "title", "data", "render", "header", "orderable", "className", "hidden",
  "alignRight", "align", "sortData", "isLineClamp", "responsivePriority", "type", "format", "currency",
  "formatOptions", "emptyText", "width", "minWidth", "maxWidth", "cellClass", "headerClass", "ellipsis"];
// and in KNOWN_OPTS add: "responsive"

const colDepartment= { title: 'Department', data: 'department' }
const colStatus= { title: 'Status', data: 'status', render: '#status' }
const colSalary= { title: 'Salary', data: 'salary', render: money, alignRight: true }
const colJoined= { title: 'Joined', data: 'joinedAt', render: shortDate }
const colBio= { title: 'Bio', data: 'bio', className:"all", isLineClamp: true }
const colPhone= { title: 'Phone', data: 'phone', hidden: true } // exists for sorting, never shown

const fullColumns= [
  colName, colContact, colDepartment, { title: 'Role', data: 'role' }, colStatus, colSalary, colJoined, colBio, colPhone,
]

const compactColumns = [colName, colDepartment, colStatus, colSalary]

const columns = [
  { title: "User", data: "name", className: "all", render: "#user" },                   // slot, never collapses
  { title: "Salary", data: "salary", type: "currency", currency: "USD" },              // formatted, right-aligned
  { title: "Joined", data: "joinedAt", type: "date", width: 120 },                     // Intl date
  { title: "Active", data: "active", type: "boolean", align: "center" },
  { title: "Bio", data: "bio", ellipsis: true, className: "min-width all" }, // collapses below tablet-l
  // { title: "Bio", data: "bio", ellipsis: true, maxWidth: 220, className: "min-tablet-l" }, // collapses below tablet-l
  { title: "Status", data: "status",
    cellClass: (v) => (v === "Active" ? "text-green-600" : "text-gray-400"),
    render: (v, _t, row, _m, { h }) => h(UBadge, { color: v === "Active" ? "success" : "neutral" }, () => v) },   // VNode
  // { title: "Tags", data: "tags", render: (v, _t, _r, _m, { h }) => v.map((x) => h(UBadge, { key: x }, () => x)) }, // VNode[] //error
  { title: "Tags", data: "tags", render: (v, _t, _r, _m, { h }) =>  (v ?? []).map((x) => h(UBadge, { key: x }, () => x)) },
  { title: "Card", data: null, render: { component: MyCard, props: (v, row) => ({ user: row }) } },               // component
  { title: "Avatar", data: "avatar", render: MyAvatarComponent },                      // component: receives { value, row, meta }
  { title: "Name", data: "name", header: (_p, h) => h("b", "Name") },                  // custom header
  { title: "Notes", data: "notes", format: (v, row) => `${v} (${row.id})` },           // plain text formatter
];
// ─── Columns ──────────────────────────────────────────────────────────────────
const columnDrawerAPI = [
  { data: 'Id', title: t('id'),render:"#Avatar", hidden: true },
  { data: 'Code', title: t('code'), hidden: true },
  { data: 'Username', title: t('username'), hidden: false },
  { data: 'Email', title: t('email'), hidden: false },
  { data: 'Phone', title: t('phone'), hidden: false },

  { data: 'Status', title: t('status'), render: '#status', hidden: false },
  { data: 'UserType', title: t('user_type'), hidden: true },

  { data: 'FirstName', title: t('first_name'), hidden: false },
  { data: 'LastName', title: t('last_name'), hidden: false },
  { data: 'Bio', title: t('bio'), isLineClamp: true, hidden: false },

  { data: 'ProfilePhone', title: t('profile_phone'), hidden: true },
  { data: 'LocationKhmer', title: t('location_khmer'), hidden: true },
  { data: 'LocationEnglish', title: t('location_english'), hidden: true },

  { data: 'Website', title: t('website'), render: '#link', hidden: false },
  { data: 'Gender', title: t('gender'), hidden: false },
  { data: 'Birthdate', title: t('birthdate'), render: shortDate, hidden: false },

  { data: 'AuthProviderId', title: t('auth_provider_id'), hidden: true },
  { data: 'AuthProviderCode', title: t('auth_provider_code'), hidden: true },
  { data: 'AuthProviderName', title: t('auth_provider_name'), hidden: true },

  { data: 'IsActive', title: t('is_active'), render: '#IsActive', hidden: false },
  { data: 'IsStaff', title: t('is_staff'), render: '#IsStaff', hidden: false },
  { data: 'IsSuperuser', title: t('is_superuser'), render: '#IsSuperuser', hidden: false },
  { data: 'IsVerified', title: t('is_verified'), render: '#IsVerified', hidden: false },
  { data: 'IsDeleted', title: t('is_deleted'), render: '#IsDeleted', hidden: true },

  { data: 'LastLoginAt', title: t('last_login_at'), render: shortDate, hidden: false },
  { data: 'CreatedBy', title: t('created_by'), render: '#CreatedBy', hidden: true },
  { data: 'UpdatedBy', title: t('updated_by'), render: '#UpdatedBy', hidden: true },
];

const btnActionsList = (g) => [
  { type: 'view', label: t('view_invitation'), icon: 'ri-external-link-line',color:'view' },
  { type: 'edit', label: t('edit'), icon: 'ri-edit-line',color:'edit' },
  { type: 'copy', label: t('copy_link'), icon: 'ri-file-copy-line',color:'copy'},
  { type: 'telegram', label: t('send_via_telegram'), icon: 'ri-telegram-line',color:'blue' },
  { type: 'email', label: t('send_via_mail'), icon: 'ri-mail-send-line',color: 'green' },
  { type: 'whatsapp', label: t('send_via_whatsapp'), icon: 'ri-whatsapp-line' ,color:'send'},
  { type: 'delete', label: t('delete'), icon: 'ri-delete-bin-line',color: 'delete' },
];
async function handleGuestAction(type, guest) {
  if(type==='view') return onView(guest)
  if(type==='edit') return openEdit(guest)
  if(type==='copy') {
    toast.add({ color: 'green', title: tBy({en:`Copied ${guest.name}`, km:`បានចម្លង ${guest.name} រួចហើយ`}), icon: "ri-copy-fill"})
  }
  if(type==='telegram') return console.log('telegram')
  if(type==='email') return console.log('email')
  if(type==='whatsapp') return console.log('whatsapp')
  if(type==='delete') return confirmDelete(guest)
}
const onView = (item) => {
  console.log('item ===> ', item)
}
const openEdit = (lang) => {
  showDrawer.value = true
  editing.value = lang
  Object.assign(form, { code: lang.code, name: lang.name, active: lang.active })
  initialForm.value = cloneDeep(form)
}

const confirmDelete = (lang) => {
  deletingItem.value = lang
  confirm.show({
    type: 'delete',
    title: tBy({en:'Delete language', km:'លុបភាសា'}),
    message: tBy({en:`Delete <strong>${lang?.name} (${lang?.code})</strong>? This cannot be undone.`, km:`លុប <strong>${lang?.name} (${lang?.code})</strong>? This cannot be undone.`}),
    onConfirm: async () => {await doDelete(lang); await reloadTable()}
  })
}

const doDelete = async (type,lang) => {
  deleting.value = true
  try {
    // const result = await langStore.deleteLanguage(deletingItem.value.Id)
    // if (result.success) toast.add({title: 'Language deleted', type: 'success'})
    // else toast.add({title: result.error ?? 'Failed to delete', type: 'error'})
    // deletingItem.value = null
  } finally {
    deleting.value = false
  }
}

/* ------------------------------ shared helpers ----------------------------- */

// function log(target, message) {
//   target.value = [`${new Date().toLocaleTimeString()},...target.value,  ${message}`].slice(0, 5)
// }
function __log(target, message) {
  if (!Array.isArray(target.value)) {
    target.value = []
  }

  target.value = [
    `${new Date().toLocaleTimeString()} ${message}`,
    ...target.value,
  ].slice(0, 5)
}

function log(target, message, limit = 5) {
  if (!target || !Array.isArray(target.value)) {
    return
  }

  target.value.unshift(
    `${new Date().toLocaleTimeString()} ${message}`
  )

  target.value = target.value.slice(0, limit)
}
function describeCheck(payload) {
  if (Array.isArray(payload)) return `-> ${payload.length} selected`
  return `row #${(payload)?.id ?? '?'}`
}

/* ============================ USAGE 1: local data ========================== */

const localTable = ref()
const localLines = ref([])
const localSelected = ref([])

let seed = 1
let nextId = 1000
const localUsers = ref(createUsers(120, seed))
const department = ref('')
// Parent-side filtering: changing the `data` prop replaces the table's rows.
const localData = computed(() =>
  department.value ? localUsers.value.filter((u) => u.department === department.value) : localUsers.value,
)

const cards = ref(false)
const compact = ref(false)
const highbrid = ref(false)
const scroll = ref(true)
const hideSelectButtons = ref(false)
const totalOnly = ref(false)
const recordRow = ref(false)

const localOptions = computed(() => ({
  isScroll: scroll.value,
  searching: true,
  reload: true,
  paging: true,
  info: true,
  showNoData: false,
  lengthMenu: [10, 20, 50, 100],
  pageLength: 10,
  order: { idx: 25, dir: 'desc' },   // newest login first
  // order: { idx: 0, dir: '' }, // no default sort, so row reordering is available
  rowReorder: recordRow.value,
  classSearch: 'w-[260px]',
  // all optional:
  cardContainer: ".demo-cards",   // default: first element rendered by the template slot
  cardSelector: ".demo-card",     // default: every child of the container
  cardHandle: ".du-grip",         // default: the whole card
  enableRowSelection: (row) => row.status !== 'Suspended',
}))

function addUser() {
  // addRowData only touches the table's rows; `localUsers` (the data prop) is unchanged on purpose.
  localTable.value?.addRowData(createUser(++nextId, nextId))
}

function toggleStatus(user) {
  localTable.value?.updateRowData({ ...user, status: user.status === 'Active' ? 'Away' : 'Active' }, 'id')
}

function toggleFirstStatus() {
  const first = localData.value[0]
  if (first) toggleStatus(first)
}

function removeUser(id) {
  localUsers.value = localUsers.value.filter((u) => u.id !== id)
}

function onReloadByFixedData() {
  // Local tables have no server: the reload button asks the parent for fresh data.
  localUsers.value = createUsers(120, ++seed)
  log(localLines, 'reloadByFixedData -> parent regenerated 120 users')
}

function onRowReorder(_event, diff) {
  log(localLines, `onRowReorder ${diff.map((d) => `${d.oldPosition}→${d.newPosition}`).join(', ')}`)
}

/* ============================== USAGE 2: API =============================== */
async function onApiReorder(_e, diff, { offset }) {
  console.log("on API recorder ----------- ", diff,)
  log(apiLines, `reorder ${diff.map((d) => `${d.oldPosition}→${d.newPosition}`).join(', ')}`);
  // persist, then reload so the server order and the UI agree:
  // await useHttp('/api/v1/users/reorder', { method: 'post', data: { items: diff.map(d => ({ id: d.newData.Id, position: d.newPosition })) } });
  // await apiTable.value?.reload();
}

const apiTable = ref()
const apiLines = ref([])
const apiSelected = ref([]) // select-all-pk: the model holds ids, not rows
const apiLoading = ref(false)
const apiDepartment = ref('')
const apiAutoload = ref(true)
const apiMountKey = ref(0) // `autoload` is read on mount, so toggling it remounts the table
const lastParams = ref('(none yet)')

watch(apiAutoload, () => apiMountKey.value++)

const apiConfig = computed(() => ({
  url: '/api/v1/users/list',
  method: 'post',
  // where: 'Result', // unwrap response.Result (then response.Result.dataSrc)
  // filter: { department: apiDepartment.value }, // merged into every request
}))

const apiOptions = {
  isScroll: true,
  searching: true,
  reload: true,
  paging: true,
  info: true,
  lengthMenu: [10, 20, 50, 100],
  rowReorder: true,
  // fixedColumns + selected-pk: legacy column list is [checkbox, ...columns, actions], so
  // joinedAt (index 6 in fullColumns) is idx 7. Default order: newest first.
  order: { idx: 7, dir: 'desc' },
  fixedColumns: { start: 2, end: 1 }, // pins checkbox + User, and the actions column
}

function onParams(params) {
  // `update:data` fires before every request. A parent could mutate `params` (or attach `.data`) to override it.
  lastParams.value = JSON.stringify({ ...params, department: apiDepartment.value })
  log(apiLines, `update:data page=${params.Pages} size=${params.Records} order=${params.OrderBy ?? '-'}`)
}

async function applyApiFilter() {
  await nextTick() // let the new `api.filter` reach RTableTank before it reads the prop
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