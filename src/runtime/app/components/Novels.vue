<template>
  <div class="pace">
    <RWrapperPage>
      <RContent>
        <RTable
          :columns="tableColumns"
          :data="tableData"
          :loading="loading"
          :options="{ searchable: true, pageSize: 10 }"
          @update:data="onTableData"
          @reload-by-fixed-data="load"
        >
          <template #headerLeft>
            <RTblFilter @on-click="onApplyFilter">
              <RForm class="grid gap-3.5 w-[350px]" :state="dataFilter">
                <RFormGroup name="Status" :label="t('status')">
                  <RCheckboxes v-model="dataFilter.Status" :options="statusOptions" />
                </RFormGroup>
              </RForm>
            </RTblFilter>
          </template>

          <template #headerRight>
            <RBtn type="add" icon="ri-add-line" :label="t('create')" @click="openCreate" />
          </template>

          <template #Name="scope">
            <div class="item-cell">
              <div class="item-icon"><i class="ri-megaphone-line" /></div>
              <div class="item-text">
                <div class="item-name">{{ rowOf(scope).Name || '?' }}</div>
                <div class="item-code">{{ rowOf(scope).Code }}</div>
              </div>
            </div>
          </template>

          <template #Code="scope">
            <span class="item-mono">{{ rowOf(scope).Code }}</span>
          </template>

          <template #Status="scope">
            <span class="item-badge" :class="statusClass(rowOf(scope).Status)">
              {{ statusLabel(rowOf(scope).Status) }}
            </span>
          </template>

          <template #actions="scope">
            <RTblBtns :items="actionItems(rowOf(scope))" />
          </template>
        </RTable>
      </RContent>

      <!-- Create / Edit drawer -->
      <!-- <RFormBuilderDrawer
        v-model:show="drawerVisible"
        :icon="editId ? 'ri-edit-box-line' : 'ri-add-circle-line'"
        :title="editId ? 'update_form' : 'create_form'"
        :description="editId ? 'edit_hint' : 'create_hint'"
        :width="640"
        :inputs="formInputs"
        :form="formConfig"
        @submitted="onFormSubmitted"
      /> -->
      <RFormBuilderDrawer v-model:show="drawerVisible" :title="editId ? 'update_form' : 'create_form'"  :description="editId ? 'edit_hint' : 'create_hint'" :icon="editId ? 'ri-edit-box-line' : 'ri-add-circle-line'"
        v-model:data="dataModel" :form="{
          showReset: showReset,
          api: {
            create: api.novels.create,
            update: api.novels.update,
          },
          confirmUpdate: textConfirmUpdate,
        }" :inputs="formInputs" :isUpdate="isCreate" @onSuccess="reloadTable" />
    </RWrapperPage>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useConfirm } from '../composables/useConfirm'
import { useToast } from '../composables/useToast'
import { useHttp } from '../composables/https'

const { api } = helper();
const { t } = useI18n()
const toast = useToast()
const rbac = usePermissionConfig()
console.log("RBac ================ ", rbac)
// const canWrite = computed(() => rbac.isSuperuser.value || rbac.hasRole('ADMIN'))
const { confirmDestructive } = useConfirm()
const textConfirmUpdate = ref('')
const isCreate = ref(false)
const showReset = ref(false)
const openDrawer = ref(false)
const dataModel = ref({})
// ---------- table state ----------
const items = ref([])
const loading = ref(false)
let loadToken = 0

function rowOf (scope) {
  return scope?.rowData ?? scope ?? {}
}

async function load () {
  const token = ++loadToken
  loading.value = true
  try {
    const { data } = await useHttp(api.novels.list, {
      method: 'POST',
      data: { Action: 'list', Pages: 1, Records: 0, Search: '' }
    })
    if (token !== loadToken) return
    // RTable already normalises Items/Data, but we keep a fallback:
    items.value = (data.value?.Items ?? data.value?.Data ?? [])
  } finally {
    if (token === loadToken) loading.value = false
  }
}

watch(load, () => { /* initial load */ }, { immediate: true })

const tableData = computed(() => items.value ?? [])
const tableColumns = computed(() => [
  { key: 'Name', label: t('name'), sortable: true },
  { key: 'Code', label: t('code'), sortable: true },
  { key: 'Status', label: t('status'), width: 120 },
  { key: 'actions', label: t('actions'), width: 120 }
])

// filter state
const dataFilter = reactive({ Status: [] })
const statusOptions = computed(() => [
  { value: 1, label: t('active') },
  { value: 0, label: t('inactive') }
])
function statusLabel (status) {
  const match = statusOptions.value.find((o) => Number(o.value) === Number(status))
  return match ? t(match.key) : t('inactive')
}
function statusClass (status) {
  return status === 1 ? 'is-active' : 'is-inactive'
}

// apply filter chips
const dataChips = ref([])
function onApplyFilter (close) {
  dataChips.value = dataFilter.Status.map((s) => ({
    icon: s === 1 ? 'ri-check-line' : 'ri-close-line',
    value: statusLabel(s)
  }))
  close()
}
function onRemoveChip (chip) {
  const match = statusOptions.value.find((o) => o.label === chip.value)
  if (match) {
    dataFilter.Status = dataFilter.Status.filter((v) => v !== match.value)
  }
  dataChips.value = dataChips.value.filter((c) => c.value !== chip.value)
}

// ---------- form state ----------
const drawerVisible = ref(false)
const editId = ref(null)

// form inputs – minimal set for novel CRUD
const formInputs = computed(() => [
  {
    name: 'Code',
    type: 'text',
    label: t('code'),
    placeholder: t('code'),
    required: true,
    disabled: !!editId.value,
    onInput: () => {}
  },
  {
    name: 'Name',
    type: 'text',
    label: t('name'),
    placeholder: t('name'),
    required: true,
    onInput: () => {}
  },
  {
    name: 'NameEn',
    type: 'text',
    label: t('name_en'),
    placeholder: t('name_en'),
    onInput: () => {}
  },
  {
    name: 'Status',
    type: 'select',
    label: t('status'),
    required: true,
    options: [{ value: 1, label: t('active') }, { value: 0, label: t('inactive') }],
    pk: 'value',
    title: 'label',
    onInput: () => {}
  },
  {
    name: 'SortOrder',
    type: 'number',
    label: t('sortOrder'),
    required: false,
    onInput: () => {}
  }
])

// form config for RFormBuilderDrawer
const formConfig = computed(() => ({
  showSubmit: false,
  showReset: false,
  showCancel: false
}))

// ---------- CRUD actions ----------
function openCreate () {
  editId.value = null
  drawerVisible.value = true
}
function openEdit (row) {
  editId.value = row.Id
  drawerVisible.value = true
}
function closeForm () {
  drawerVisible.value = false
  editId.value = null
}

// submit payload to backend
async function onFormSubmitted (state) {
  await confirmDestructive({
    title: t('discardTitle'),
    description: t('discardBody'),
    confirmLabel: t('discard'),
    cancelLabel: t('keepEditing'),
    color: 'warning'
  }) // placeholder – real guard would check dirty state

  const payload = {
    Action: editId.value ? 'update' : 'create',
    Id: editId.value ?? undefined,
    Code: state.Code,
    Name: state.Name,
    NameEn: state.NameEn,
    Status: Number(state.Status),
    SortOrder: state.SortOrder ?? 0
  }

  const { data, error } = await useHttp(api.novels.create, {
    method: 'POST',
    data: payload
  })
  if (error.value || !data.value) {
    toast.add({ color: 'error', title: editId.value ? 'update_failed' : 'create_failed', description: (error.value)?.Message ?? 'Unknown error' })
    return
  }
  const result = data.value
  toast.add({ color: 'success', title: result.Message || (editId.value ? 'updated' : 'created') })
  closeForm()
  await load()
}

// ---------- delete ----------
async function remove (row) {
  const ok = await confirmDestructive({
    title: t('delete'),
    description: t('delete_body', { name: row.Name }),
    confirmLabel: t('delete'),
    color: 'error'
  })
  if (!ok) return
  const { data, error } = await useHttp(`${api.novels.list}?Action=delete&Id=${row.Id}`, {
    method: 'GET'
  })
  if (error.value || !data.value) {
    toast.add({ color: 'error', title: 'delete_failed', description: (error.value)?.Message ?? 'Unknown error' })
    return
  }
  toast.add({ color: 'success', title: 'deleted' })
  await load()
}

// ---------- action bar items ----------
function actionItems (row) {
  const items = [
    { type: 'view', label: t('view'), icon: 'ri-eye-line', color: 'view', actionClick: () => {} }
  ]
  {
    items.push({
      type: 'update',
      label: t('edit'),
      icon: 'ri-pencil-line',
      color: 'edit',
      actionClick: () => openEdit(row)
    })
    items.push({
      type: 'delete',
      label: t('delete'),
      icon: 'ri-delete-bin-3-line',
      color: 'delete',
      actionClick: () => remove(row)
    })
  }
  return items
}
</script>

<style lang="scss" scoped>
/* minimal overrides if needed */
</style>