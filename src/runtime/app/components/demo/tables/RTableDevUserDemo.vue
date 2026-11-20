<template>
  <RHead :title="tBy({en: 'RTable Sever API Developing', km:'កំពុងអភិវឌ្ឍ RTable Sever API'})"/>
  <RWrapperPage>
    <h1 class="flex items-center justify-center p-4 text-2xl">{{ tBy({en: 'RTable Sever API Developing', km:'កំពុងអភិវឌ្ឍ RTable Sever API'}) }}</h1>
    <RTable
      ref="tableRef"
      :api="apiConfig"
      :columns="columns"
      :options="tableOptions"
      :loading="loading"
      :selected-pk="'id'"
      :checkbox="true"
      :store-id="'users-api-table'"
      @update:filterState="handleFilterChange"
      @onSelectRecord="handleRecordSelection"
    >
      <!-- Same column slots as above -->
      <template #name="{ rowData, value }">
        <div class="user-name-cell">
          <UAvatar :src="rowData.avatar" size="sm" />
          <span>{{ value }}</span>
        </div>
      </template>

      <template #status="{ rowData, value }">
        <UBadge :color="getStatusColor(value)">
          {{ value }}
        </UBadge>
      </template>

      <template #actions="{ rowData }">
        <div class="action-buttons">
          <UButton color="primary" variant="ghost" size="sm" @click="editUser(rowData)">
            <UIcon name="i-ri-edit-line" />
          </UButton>
          <UButton color="error" variant="ghost" size="sm" @click="deleteUser(rowData)">
            <UIcon name="i-ri-delete-bin-line" />
          </UButton>
        </div>
      </template>
    </RTable>
  </RWrapperPage>
</template>

<script setup>
import { ref, computed } from 'vue'
definePageMeta({layout: 'navbar'})
// useHead({ title: 'RTable Sever API Developing'})

// ─── State ────────────────────────────────────────────────────────────────────
const loading = ref(false)
const tableRef = ref(null)
const selectedUsers = ref([])

// ─── API Configuration ──────────────────────────────────────────────────────
const apiConfig = {
  url: 'api/v1/users/list',
  method: 'POST',
  // Static parameters sent with every request
  // data: {
  //   tenantId: 'company-123',
  //   includeDeleted: false
  // }
}

// ─── Columns ──────────────────────────────────────────────────────────────────
const columns = [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    className: 'min-width',
    minWidth: 150
  },
  {
    key: 'email',
    label: 'Email',
    sortable: true,
    className: 'width',
    width: 200
  },
  {
    key: 'role',
    label: 'Role',
    sortable: true,
    className: 'all',
    minWidth: 120
  },
  {
    key: 'department',
    label: 'Department',
    sortable: true,
    className: 'min-width',
    minWidth: 140
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    className: 'width',
    width: 120
  },
  {
    key: 'actions',
    label: 'Actions',
    sortable: false,
    className: 'width',
    width: 100,
    slot: '#actions'
  }
]

const tableOptions = {
  showNoData: true,
  info: true,
  paging: true
}

// ─── Handlers ─────────────────────────────────────────────────────────────────
const handleFilterChange = (filterState) => {
  console.log('Filter state changed:', filterState)
  // You can use this to trigger external side effects
  // The table will automatically reload with the new filter state
}

const handleRecordSelection = (records, page) => {
  console.log('Records per page changed to:', records)
  console.log('Current page:', page)
}

const getStatusColor = (status) => {
  const colors = {
    active: 'success',
    inactive: 'error',
    pending: 'warning',
    archived: 'neutral'
  }
  return colors[status] || 'neutral'
}

// ─── CRUD Operations ─────────────────────────────────────────────────────────
const editUser = (user) => {
  console.log('Edit user:', user)
  // Navigate to edit page or open modal
}

const deleteUser = async (user) => {
  if (!confirm(`Delete user "${user.name}"?`)) return
  
  try {
    // Call your API
    await $fetch(`/api/users/${user.id}`, { method: 'DELETE' })
    // Reload the table to reflect changes
    tableRef.value?.reload()
  } catch (error) {
    console.error('Error deleting user:', error)
  }
}

// ─── Expose ──────────────────────────────────────────────────────────────────
defineExpose({
  reloadTable: () => tableRef.value?.reload(),
  clearSelection: () => tableRef.value?.clearAll(),
  getSelected: () => tableRef.value?.getSelected?.() ?? [],
})
</script>