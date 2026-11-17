<template>
  <div class="pace">
    <RWrapperPage>
      <RContent>
        <RTable
          ref="tableRef"
          :columns="tableColumns"
          :api="tableApi"
          :options="tableOptions"
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

          <template #Title="scope">
            <div class="item-cell">
              <div class="item-icon"><img :src="scope.CoverUrl"  /></div>
              <div class="item-text">
                <div class="item-name">{{ displayName(rowOf(scope)) }}</div>
                <div class="item-code">{{ rowOf(scope).Code }}</div>
              </div>
            </div>
          </template>

          <template #Code="scope">
            <span class="item-mono">{{ rowOf(scope).Code || '—' }}</span>
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
      <RFormBuilderDrawer
        v-model:show="drawerVisible"
        v-model:data="dataModel"
        :title="isUpdate ? 'update_form' : 'create_form'"
        :description="isUpdate ? 'edit_hint' : 'create_hint'"
        :icon="isUpdate ? 'ri-edit-box-line' : 'ri-add-circle-line'"
        :form="drawerForm"
        :inputs="formInputs"
        :is-update="isUpdate"
        :is-clone="isClone"
        @onSuccess="reloadTable"
        @onSubmitted="onFormSubmitted"
      />
    </RWrapperPage>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
definePageMeta({ layout: 'navbar', middleware:'auth'})
const { api } = helper()
const { t } = useI18n()
const toast = useToast()
const confirm = useConfirmStore()

const STATUS_ACTIVE = 1
const STATUS_INACTIVE = 0

// Stable references: inline object literals in the template are re-created on
// every render, which makes child components see a "changed" prop each time.
const tableApi = { url: api.novels.list, method: 'POST' }
const tableOptions = { searchable: true }

/* ============================================================================
 * Pure helpers
 * ========================================================================== */
const rowOf = (scope) => scope?.rowData ?? scope ?? {}
const displayName = (row) => row?.Name || row?.Title || row?.TitleEn || '?'

function generateSlug(value = '') {
  return String(value ?? '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Khmer/CJK titles slugify to '' — fall back to the English title.
const autoSlug = (m) => generateSlug(m?.Title) || generateSlug(m?.TitleEn)

// The select can hold either the option object or the raw value.
const normalizeStatus = (s) =>
  Number(s !== null && typeof s === 'object' ? s.Value : s) === STATUS_ACTIVE
    ? STATUS_ACTIVE
    : STATUS_INACTIVE

function toastError(titleKey, err) {
  toast.add({
    color: 'error',
    title: t(titleKey),
    description: err?.Message ?? err?.message ?? 'Unknown error'
  })
}

/* ============================================================================
 * Status options — single source of truth (form select, filter, table badge)
 * ========================================================================== */
const statusData = computed(() => [
  { Value: STATUS_ACTIVE, Name: t('active'), NameEnglish: 'Active' },
  { Value: STATUS_INACTIVE, Name: t('inactive'), NameEnglish: 'Inactive' }
])
const statusOptions = computed(() =>
  statusData.value.map((s) => ({ value: s.Value, label: s.Name }))
)
const statusOption = (value) => {
  const v = normalizeStatus(value)
  return { ...statusData.value.find((s) => s.Value === v) }
}
const statusLabel = (status) => statusOption(status).Name
const statusClass = (status) =>
  normalizeStatus(status) === STATUS_ACTIVE ? 'is-active' : 'is-inactive'

/* ============================================================================
 * State
 * ========================================================================== */
const tableRef = ref()
const busy = ref(false) // table overlay (delete / reload)
const drawerVisible = ref(false)
const editId = ref(null)
// const isUpdate = computed(() => editId.value !== null)
const isUpdate = ref(false)
const isClone = ref(false)

const lastAutoSlug = ref('')

const contentGuard = {
  state: { pending: false, dirty: false },
  beforeClose: async () => {
    if (contentGuard.state.pending) return false
    if (!contentGuard.state.dirty) return true
    confirm.show({
      title: t('discardTitle'),
      description: t('discardBody'),
      confirmLabel: t('discard'),
      cancelLabel: t('keepEditing'),
      color: 'warning',
      onConfirm: () => {}
    })
  }
}

const emptyModel = () => ({
  Code: '',
  Title: '',
  TitleEn: '',
  Slug: '',
  Status: statusOption(STATUS_ACTIVE),
  SortOrder: 0
})
const dataModel = ref(emptyModel())
const dataFilter = reactive({ Status: [] })

const reload = async () => tableRef.value?.reload()

/* ============================================================================
 * Table
 * ========================================================================== */
const tableColumns = computed(() => [
  { key: 'Title', label: t('name'), sortable: true },
  { key: 'Code', label: t('code'), sortable: true },
  { key: 'Status', label: t('status'), width: 120 }
])

/**
 * NOTE: `dataFilter` is currently NOT sent to the server — it was not in the
 * original page either. RTable needs to receive it as request params
 * (prop name depends on RTable's API) before this filter has any effect.
 */
function onApplyFilter(close) {
  reload()
  close?.()
}

/* ============================================================================
 * Form
 * ========================================================================== */
const showReset = ref(false)
const textConfirmUpdate = ref('')

// Drawer owns the request (create/update endpoints). Computed so the object
// identity is stable between renders instead of a new literal on every render.
const drawerForm = computed(() => ({
  showReset: showReset.value,
  api: {
    create: api.novels.create,
    update: api.novels.update
  },
  confirmUpdate: textConfirmUpdate.value
}))

const formInputs = computed(() => [
  {
    name: 'Code',
    type: 'text',
    label: t('code'),
    placeholder: t('code'),
    required: true,
    disabled: editId.value
  },
  { name: 'Title', type: 'text', label: t('name'), placeholder: t('name'), required: true },
  { name: 'TitleEn', type: 'text', label: t('name_en'), placeholder: t('name_en') },
  { name: 'Slug', type: 'text', label: 'Slug', placeholder: 'my-first-novel', required: true },
  {
    name: 'Status',
    type: 'select',
    label: t('status'),
    required: true,
    options: { data: statusData.value },
    pk: 'Value',
    title: 'Name'
  },
  { name: 'SortOrder', type: 'number', label: t('sortOrder'), required: false }
])

// Auto-slug while creating. Never rewrites a slug the user edited by hand, and
// never touches the slug of an existing record (URL stability).
watch(
  () => [dataModel.value.Title, dataModel.value.TitleEn],
  () => {
    // if (isUpdate.value) return
    const next = autoSlug(dataModel.value)
    const current = dataModel.value.Slug
    if (!current || current === lastAutoSlug.value) dataModel.value.Slug = next
    lastAutoSlug.value = next
  }
)

/* ============================================================================
 * CRUD
 * ========================================================================== */
function openCreate() {
  isUpdate.value = false
  editId.value = null
  lastAutoSlug.value = ''
  dataModel.value = emptyModel()
  drawerVisible.value = true
}

function openEdit(row) {
  if (row?.Id === undefined || row?.Id === null) return
  editId.value = row.Id // set first: disables the auto-slug watcher
  dataModel.value = {
    ...row,
    Title: row.Title ?? '',
    TitleEn: row.TitleEn ?? '',
    Slug: row.Slug || autoSlug(row),
    Status: statusOption(row.Status)
  }
  drawerVisible.value = true
}

function openClone(row) {
  isUpdate.value = false
  isClone.value = true
  editId.value = null

  dataModel.value = {
    ...row,
    Id: undefined,
    Code: '',
    Slug: '',
    Title: `${row.Title || ''} Copy`,
    Status: statusOption(row.Status)
  }

  lastAutoSlug.value = ''
  drawerVisible.value = true
}

function closeForm() {
  drawerVisible.value = false
  editId.value = null
  isUpdate.value = false
}

// Drawer finished create/update successfully (it performs the request itself).
async function reloadTable() {
  closeForm()
  reload()
}

// Fired with the form state on submit. No request here (the drawer owns it) —
// only normalizes the state in place so the payload is clean.
function onFormSubmitted(state) {
  if (!state) return
  state.Slug = generateSlug(state.Slug) || autoSlug(state)
  state.Status = normalizeStatus(state.Status)
  state.SortOrder = Number(state.SortOrder) || 0
}

async function onContentCreated (payload) {
  const param = queryParams('novel', { Id: payload.Id})
  await navigateTo(localePath(`content/novels/create${param}`))
}

async function remove(row) {
  if (busy.value) return
  confirm.show({
    type:'delete',
    title: t('delete'),
    description: t('delete_body', { name: displayName(row) }),
    confirmLabel: t('delete'),
    color: 'error',
    onConfirm: async () => {
      try {
        busy.value = true
        const { data, error } = await useHttp(`${api.novels.list}Id?=${String(row.Id)}`, { method: 'GET' })
        if (error.value || !data.value) throw error.value
        toast.add({ color: 'success', title: t('deleted') })
        reload()
      } catch (e) {
        toastError('delete_failed', e)
      } finally {
        busy.value = false
      }
    }
  })
}

/* ============================================================================
 * Row actions
 * ========================================================================== */
function actionItems(row) {
  return [
    // TODO: no view handler existed in the original page
    { type: 'view', label: t('view'), icon: 'ri-eye-line', color: 'view', actionClick: () => onContentCreated(row) },
    {
      type: 'update',
      label: t('edit'),
      icon: 'ri-pencil-line',
      color: 'edit',
      actionClick: () => openEdit(row)
    },
    {
      type: 'create',
      label: t('create_nevel_content'),
      icon: 'ri-pencil-line',
      color: 'create',
      actionClick: () => onContentCreated(row)
    },
    {
      type: 'delete',
      label: t('delete'),
      icon: 'ri-delete-bin-3-line',
      color: 'delete',
      actionClick: () => remove(row)
    },
    {
      type: 'clone',
      label: t('clone'),
      icon: 'ri-file-copy-line',
      color: 'copy',
      actionClick: () => openClone(row)
    }
  ]
}
</script>

<style lang="scss" scoped>
.item-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.item-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  font-size: 18px;
  color: var(--c-accent, #ff8c42);
  border-radius: var(--radius-md, 10px);
  background: color-mix(in srgb, var(--c-accent, #ff8c42) 12%, transparent);
}

.item-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.3;
}

.item-name {
  font-weight: 600;
  color: var(--c-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-code {
  font-size: 12px;
  color: var(--c-muted);
}

.item-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12.5px;
  color: var(--c-text);
}

.item-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 600;
  border-radius: var(--radius-full, 9999px);

  &::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  &.is-active {
    color: var(--r-c-success, #5ec47a);
    background: var(--r-c-success-bg, rgba(94, 196, 122, 0.12));
  }

  &.is-inactive {
    color: var(--r-c-disabled, #858585);
    background: var(--r-b-disabled, #efefef);
  }
}
</style>