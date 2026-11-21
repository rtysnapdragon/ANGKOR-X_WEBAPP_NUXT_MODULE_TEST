<template>
  <div class="demo-page">
    <RTabs v-model="tab" :items="tabItems" :content="false" class="w-full" />

    <!-- ───────────── LOCAL ───────────── -->
    <section v-if="tab === 'local'">
      <div class="demo-panel">
        <!-- <div class="checkbox-list">
          <RCheckbox
            v-for="item in localFlagOptions"
            :key="item.value"
            v-model="localFlags"
            :label="item.label"
            :value="item.value"
            variant="list"
            size="sm"
          />
        </div> -->
        <RCheckboxes v-model="localFlags" :options="localFlagOptions"  
        />
        <!-- :ui="{ root: 'checkbox-list' }" -->
        <div class="demo-selects">
          <RSelect v-model="localResponsive" :required="true" :local-data="{ data: responsiveItems }" pk="value" />
          <RSelect v-model="localDept" :required="true" :local-data="{ data: deptItems }" pk="value" />
        </div>
      </div>

      <RTableTank
        ref="localTable"
        v-model="localSelected"
        :data="localRows"
        :columns="localColumns"
        :options="localOptions"
        :key-table="localKey"
        :show-template="has(localFlags, 'cards')"
        :hide-group-btn-select="has(localFlags, 'hideSelectButtons')"
        :is-total-detail="has(localFlags, 'totalOnly')"
        :have-border="has(localFlags, 'haveBorder')"
        selected-pk="Id"
        state-key="demo-local-v2"
        @on-row-reorder="(_e, diff) => log(localLog, `reorder ${diff.map(d => `${d.oldPosition}→${d.newPosition}`)}`)"
        @on-searching="(s) => log(localLog, `search '${s}'`)"
        @on-order="(o) => log(localLog, `order ${JSON.stringify(o)}`)"
        @on-change-pagination="(p, n) => log(localLog, `page ${p} size ${n}`)"
        @action-check="(p) => log(localLog, `check ${Array.isArray(p) ? p.length : p?.Id}`)"
        @reload-by-fixed-data="localRows = employees.map((r) => ({ ...r }))"
      >
        <template #headerTable><h2 class="demo-title">Local data</h2></template>

        <!-- cell-<data> slot convention: no `render` needed -->
        <template #cell-Name="{ rowData, value }">
          <div class="flex items-center gap-2">
            <RAvatar :src="rowData.Avatar" />
            <div class="flex flex-col leading-tight">
              <span class="font-semibold">{{ tBy({ en: rowData.NameEn, km: value }) }}</span>
              <span class="text-xs opacity-60">{{ rowData.Code }}</span>
            </div>
          </div>
        </template>
        <template #header-Status="{ title }"><b class="text-primary">{{ title }}</b></template>

        <template #actions="{ rowData }">
          <RTblBtns :items="actionItems" @actionClick="(type) => onAction(type, rowData)" />
        </template>

        <template #totalDetail="{ total }">
          <p class="demo-total">{{ total }} rows · {{ localSelected.length }} selected</p>
        </template>
        <template #ShowDetailAfterTableOne>
          <ul class="demo-log"><li v-for="(l, i) in localLog" :key="i">{{ l }}</li></ul>
        </template>

        <!-- card mode: drag cards with options.cardContainer / cardSelector -->
        <template #template="p">
          <div class="demo-cards">
            <article v-for="u in p[0]" :key="u.Id" class="demo-card">
              <b>{{ u.NameEn }}</b><span>{{ u.Position }} · {{ u.Department }}</span>
            </article>
          </div>
        </template>
      </RTableTank>
    </section>

    <!-- ───────────── API ───────────── -->
    <section v-else>
      <div class="demo-panel">
        <RCheckboxes v-model="apiFlags" :options="apiFlagOptions" />
        <div class="demo-selects">
          <RSelect v-model="apiResponsive" :required="true" :local-data="{ data: responsiveItems }" pk="value" />
          <RSelect v-model="apiType" :required="true" :local-data="{ data: typeItems }" pk="value" @selected="applyFilter" />
        </div>
      </div>

      <RTableTank
        ref="apiTable"
        v-model="apiSelected"
        v-model:loading="apiLoading"
        :api="apiConfig"
        :columns="apiColumns"
        :options="apiOptions"
        :key-table="apiKey"
        :autoload="has(apiFlags, 'autoload')"
        :have-border="has(apiFlags, 'haveBorder')"
        :select-all-pk="has(apiFlags, 'selectAll') ? 'SelectAllIds' : undefined"
        selected-pk="Id"
        state-key="demo-api-v2"
        @update:data="(p) => (lastParams = JSON.stringify(p))"
        @on-row-reorder="onApiReorder"
        @on-order="(o) => log(apiLog, `order ${JSON.stringify(o)}`)"
        @on-searching="(s) => log(apiLog, `search '${s}'`)"
      >
        <template #headerTable><h2 class="demo-title">API</h2></template>
        <template #headerLeft>
          <RBtn :label="t('reload')" @click="apiTable?.reload()" />
        </template>
        <template #headerRight>
          <span v-if="apiLoading" class="demo-chip">Loading…</span>
        </template>

        <template #cell-Username="{ rowData }">
          <div class="flex items-center gap-2">
            <RAvatar :src="rowData.AvatarUrl" />
            <div class="flex flex-col leading-tight">
              <span class="font-semibold">{{ rowData.Username }}</span>
              <span class="text-xs opacity-60">{{ rowData.Code }}</span>
            </div>
          </div>
        </template>
        <template #CreatedBy="data">
          <div>
            <RProfileInfo :src="data.rowData?.CreatedBy?.CreatedByAvatar ?? ''" :gender="data.rowData.CreatedBy?.Gender ?? ''" :title="tBy({
              km: data.rowData.CreatedBy?.FullName ?? '',
              en: data.rowData.CreatedBy?.FullName ?? '',
            })
              " :subTitle="`${formatDateDiff(data.rowData.CreatedAt,datetimeLong)}`" />
          </div>
        </template>
        <template #UpdatedBy="data">
          <div>
            <RProfileInfo :src="data.rowData?.UpdatedBy?.UpdatedByAvatar ?? ''" :title="tBy({
              km: data.rowData.UpdatedBy?.FullName ?? '',
              en: data.rowData.UpdatedBy?.FullName ?? '',
            })
              " :subTitle="`${formatDateDiff(data.rowData.UpdatedAt,datetimeLong)}`" />
          </div>
        </template>

        <template #actions="{ rowData }">
          <RTblBtns :items="actionItems" @actionClick="(type) => onAction(type, rowData)" />
        </template>

        <template #totalDetail="{ total }">
          <p class="demo-total">{{ total }} users · {{ apiSelected.length }} selected</p>
        </template>
        <template #ShowDetailAfterTableOne>
          <ul class="demo-log"><li v-for="(l, i) in apiLog" :key="i">{{ l }}</li></ul>
        </template>
        <template #ShowDetailAfterTableTwo>
          <p class="demo-hint">Last request: <code>{{ lastParams }}</code></p>
        </template>
      </RTableTank>
    </section>
  </div>
</template>

<script setup>
import { employees } from './demo-employees'

const { t } = useI18n()
const toast = useToast()
const UBadge = resolveComponent('UBadge')

definePageMeta({ layout: 'navbar', middleware: ['auth'] })
useHead({ title: 'RTableTank Demo' })

const tab = ref('local')
const tabItems = [{ label: 'Local', value: 'local' }, { label: 'Api', value: 'api' }]

/* ───────── helpers ───────── */
const has = (flags, k) => flags.includes(k)
const item = (value, en, km = en) => ({ value, NameEnglish: en, Name: km })
// const log = (target, msg) => { target.value = [`${new Date().toLocaleTimeString()} ${msg}`, ...target.value].slice(0, 5) }
const log = (target, msg) => {
  const logs = isRef(target) ? target.value : target

  const next = [
    `${new Date().toLocaleTimeString()} ${msg}`,
    ...(Array.isArray(logs) ? logs : [])
  ].slice(0, 5)

  if (isRef(target)) target.value = next
  else target.splice(0, target.length, ...next)
}

const responsiveItems = [
  item('auto', 'Responsive: auto (RTable behavior)'),
  item('class', 'Responsive: className tokens only'),
  item('off', 'Responsive: off'),
]
const respValue = (s) => (s?.value === 'off' ? false : s?.value ?? 'auto')

const _actionItems = [
  { type: 'view', label: t('view'), icon: 'ri-external-link-line', color: 'view' },
  { type: 'edit', label: t('edit'), icon: 'ri-edit-line', color: 'edit' },
  { type: 'delete', label: t('delete'), icon: 'ri-delete-bin-line', color: 'delete' },
]
const actionItems = [
  { type: 'view', label: t('view_invitation'), icon: 'ri-external-link-line',color:'view' },
  { type: 'edit', label: t('edit'), icon: 'ri-edit-line',color:'edit' },
  { type: 'copy', label: t('copy_link'), icon: 'ri-file-copy-line',color:'copy'},
  { type: 'telegram', label: t('send_via_telegram'), icon: 'ri-telegram-line',color:'blue' },
  { type: 'email', label: t('send_via_mail'), icon: 'ri-mail-send-line',color: 'green' },
  { type: 'whatsapp', label: t('send_via_whatsapp'), icon: 'ri-whatsapp-line' ,color:'send'},
  { type: 'delete', label: t('delete'), icon: 'ri-delete-bin-line',color: 'delete' },
];
function onAction(type, row) {
  toast.add({ color: 'green', title: `${type} → ${row.Username ?? row.NameEn}` })
}

/* ═════════════ LOCAL ═════════════ */
const localTable = ref()
const localLog = ref([])
const localSelected = ref([])
const localRows = ref(employees.map((r) => ({ ...r })))

const localFlagOptions = [
  { label: 'rowReorder', value: 'rowReorder' },
  { label: 'cards (showTemplate)', value: 'cards' },
  { label: 'isScroll', value: 'isScroll' },
  { label: 'haveBorder', value: 'haveBorder' },
  { label: 'searching', value: 'searching' },
  { label: 'reload', value: 'reload' },
  { label: 'paging', value: 'paging' },
  { label: 'info', value: 'info' },
  { label: 'fixedColumns', value: 'fixedColumns' },
  { label: 'hide select buttons', value: 'hideSelectButtons' },
  { label: 'total only', value: 'totalOnly' },
]
const localFlags = ref(['rowReorder', 'isScroll', 'haveBorder', 'searching', 'reload', 'paging', 'info'])
const localResponsive = ref(responsiveItems[0])

const deptItems = [item('', 'All departments'),
  ...[...new Set(employees.map((e) => e.Department))].map((d) => item(d, d))]
const localDept = ref(deptItems[0])

// parent-side filter: changing the `data` prop replaces the rows
const filteredRows = computed(() =>
  localDept.value?.value ? localRows.value.filter((r) => r.Department === localDept.value.value) : localRows.value)
watch(localDept, () => localTable.value?.setListData(filteredRows.value))

const localOptions = computed(() => ({
  isScroll: has(localFlags.value, 'isScroll'),
  searching: has(localFlags.value, 'searching'),
  reload: has(localFlags.value, 'reload'),
  paging: has(localFlags.value, 'paging'),
  info: has(localFlags.value, 'info'),
  rowReorder: has(localFlags.value, 'rowReorder'),
  fixedColumns: has(localFlags.value, 'fixedColumns') ? { start: 1, end: 1 } : undefined,
  responsive: respValue(localResponsive.value),
  lengthMenu: [10, 20, 50, 100],
  pageLength: 10,
  order: { idx: 0, dir: '' },
  classSearch: 'w-[260px]',
  cardContainer: '.demo-cards',
  cardSelector: '.demo-card',
}))
// remount when structural options change
const localKey = computed(() => [localFlags.value.includes('fixedColumns'), localResponsive.value?.value, has(localFlags.value, 'cards')].join('|'))

const localColumns = [
  { data: 'Name', title: t('name'), className: 'all', orderable: true },                 // slot: #cell-Name
  { data: 'Position', title: t('position'), className: 'min-tablet-p', ellipsis: true, maxWidth: 200 },
  { data: 'Department', title: t('department'), className: 'min-tablet-l' },
  { data: 'Email', title: t('email'), className: 'min-tablet-l' },
  { data: 'Phone', title: t('phone'), className: 'min-desktop' },
  { data: 'Gender', title: t('gender'), className: 'none' },                            // always in the child row
  { data: 'JoinDate', title: t('joined_date'), type: 'date', className: 'min-tablet-l' },
  { data: 'BirthDate', title: t('birth_date'), type: 'date', className: 'none' },
  { data: 'Description', title: t('description'), isLineClamp: true, className: 'none' },
  {
    data: 'Status', title: t('status'), className: 'all', header: '#header-Status',
    cellClass: (v) => (v === 'Active' ? 'text-green-900' : 'text-gray-400'),
    render: (v, _t, _r, _m, { h }) => h(UBadge, { color: v === 'Active' ? 'success' : 'neutral', variant: 'subtle' }, () => v),
  },
  {
    data: 'Salary', title: t('salary'), className: 'min-desktop', alignRight: true,
    format: (v) => v, // already formatted text; use type: 'currency' for numbers
  },
  {
    data: 'CreatedBy', title: t('created_by'), className: 'none',
    render: (v, _t, row, _m, { h }) =>
      h('div', { class: 'flex flex-col' }, [h('span', v), h('span', { class: 'text-xs opacity-60' }, row.CreatedAt)]),
  },
]

/* ═════════════ API ═════════════ */
const apiTable = ref()
const apiLog = ref([])
const apiSelected = ref([])
const apiLoading = ref(false)
const lastParams = ref('(none)')

const apiFlagOptions = [
  { label: 'rowReorder', value: 'rowReorder' },
  { label: 'haveBorder', value: 'haveBorder' },
  { label: 'fixedColumns', value: 'fixedColumns' },
  { label: 'autoload', value: 'autoload' },
  { label: 'select-all-pk (needs SelectAllIds in response)', value: 'selectAll' },
]
const apiFlags = ref(['haveBorder', 'autoload'])
const apiResponsive = ref(responsiveItems[0])

const typeItems = [item('', 'All user types'), item(3, 'Member'), item(6, 'User')]
const apiType = ref(typeItems[0])

const apiConfig = computed(() => ({
  url: '/api/v1/users/list',
  method: 'post',
  filter: apiType.value?.value ? { UserType: apiType.value.value } : {},
}))
async function applyFilter() {
  await nextTick() // let the new api.filter reach RTableTank
  apiTable.value?.filter()
}

const apiOptions = computed(() => ({
  isScroll: true,
  lengthMenu: [10, 20, 50, 100],
  order: { data: 'LastLoginAt', dir: 'desc' },      // by field name, not by column index
  rowReorder: has(apiFlags.value, 'rowReorder'),
  fixedColumns: has(apiFlags.value, 'fixedColumns') ? { start: 2, end: 1 } : undefined,
  responsive: respValue(apiResponsive.value),
}))
const apiKey = computed(() => [apiFlags.value.includes('fixedColumns'), apiFlags.value.includes('selectAll'), apiResponsive.value?.value].join('|'))

const apiColumns = [
  { data: 'Id', title: t('id'), hidden: true },
  { data: 'Code', title: t('code'), hidden: true },
  { data: 'Username', title: t('username'), className: 'all' },                          // slot: #cell-Username
  { data: 'Email', title: t('email'), className: 'min-tablet-p', ellipsis: true, maxWidth: 220 },
  { data: 'Phone', title: t('phone'), className: 'min-tablet-p' },
  {
    data: 'StatusName', title: t('status'), className: 'all',
    render: (v, _t, row, _m, { h }) => h(UBadge, { color: row.IsActive ? 'success' : 'neutral', variant: 'subtle' }, () => v ?? '-'),
  },
  { data: 'UserTypeName', title: t('user_type'), className: 'min-tablet-l' },
  { data: 'AuthProviderName', title: t('auth_provider_name'), className: 'min-tablet-l', emptyText: '-' },
  { data: 'IsVerified', title: t('is_verified'), type: 'boolean', align: 'center', className: 'min-desktop' },
  { data: 'IsStaff', title: t('is_staff'), type: 'boolean', align: 'center', className: 'none' },
  { data: 'IsSuperuser', title: t('is_superuser'), type: 'boolean', align: 'center', className: 'none' },
  { data: 'Birthdate', title: t('birthdate'), type: 'date', emptyText: '-', className: 'none' },
  { data: 'LastLoginAt', title: t('last_login_at'), type: 'datetime', className: 'min-tablet-l' },
  { data: 'CreatedAt', title: t('created_at'), type: 'datetime', className: 'none' },
  { data: 'Bio', title: t('bio'), isLineClamp: true, className: 'none' },
  { data: 'UpdatedBy', title: t('updated_by'), render: "#UpdatedBy", className: 'none' },
  { data: 'CreatedBy', title: t('created_by'), render: "#CreatedBy", className: 'none' },
]

function onApiReorder(_e, diff, { offset, page }) {
  log(apiLog, `reorder page ${page} (offset ${offset}): ${diff.map((d) => `${d.oldPosition}→${d.newPosition}`)}`)
  // persist here, then: await apiTable.value?.reload()
}
</script>

<style lang="scss">
.demo-page { display: flex; flex-direction: column; gap: 12px; padding: 16px; }
.demo-panel { display: grid; gap: 10px; margin-bottom: 8px; }
.demo-selects { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 10px; }
.demo-title { margin: 0 0 8px; font-size: 16px; font-weight: 700; }
.demo-chip { padding: 4px 10px; border-radius: 10px; background: var(--bg-content); font-size: 12px; }
.demo-total, .demo-hint { margin: 8px 0 0; font-size: 12px; color: var(--color-w-b-2); }
.demo-log { margin: 8px 0 0; padding: 8px 10px; list-style: none; font: 11px/1.5 ui-monospace, monospace; border-radius: 10px; background: var(--bg-content); }
.demo-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
.demo-card { display: grid; gap: 4px; padding: 12px; border-radius: 12px; background: var(--bg-content); }


.checkbox-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  width: 100%;
}

.checkbox-list {//If you want columns to fit content naturally instead of equally stretching:
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(max-content, 1fr));
  gap: 12px;
} //
</style>