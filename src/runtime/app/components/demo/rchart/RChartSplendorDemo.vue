<template>
    <RContent class="rsd">
      <h1 class="rsd__title">RChartSplendor</h1>

      <!-- ═══ 1 · Local mode ═══════════════════════════════════════════════ -->
      <RChartSplendor
        v-model:search="search"
        v-model:filters="filters"
        v-model:page="page"
        v-model:page-size="pageSize"
        v-model:sort="sort"
        v-model:selected="selected"
        v-model:view="view"
        mode="local"
        title="Team (local mode)"
        subtitle="Search, filter, sort and page in the browser — the parent owns the data"
        :data="people"
        :columns="columns"
        :filter-defs="filterDefs"
        :options="localOptions"
        @data:change="onDataChange"
        @data:filter-change="log('data:filterChange', JSON.stringify($event.filters) + ' · “' + $event.search + '”')"
        @data:sort-change="log('data:sortChange', JSON.stringify($event))"
        @data:page-change="log('data:pageChange', `${$event.page} / ${$event.pageSize}`)"
        @selection:change="log('selection:change', $event.keys.join(', '))"
        @row:action="onRowAction"
        @export="log('export', `${$event.format} · ${$event.rows.length} rows · ${$event.scope}`)"
        @error="onError"
      >
        <template #cell-status="{ value }">
          <UBadge :label="value ? 'Active' : 'Suspended'" :color="value ? 'success' : 'neutral'" variant="subtle" />
        </template>
        <template #cell-salary="{ value }">{{ money.format(value as number) }}</template>
        <template #bulk-actions="{ rows, clear }">
          <UButton size="xs" color="error" variant="soft" icon="i-lucide-trash-2" @click="removeMany(rows); clear()">Remove selected</UButton>
        </template>
      </RChartSplendor>

      <div class="rsd__row">
        <button type="button" @click="people = people.slice(0, -3)">Parent: remove 3 rows</button>
        <button type="button" @click="people = [...people, ...extra()]">Parent: add 3 rows</button>
        <button type="button" @click="search = 'a'; filters = { dept: 'Design' }">Parent: set search + filter (v-model)</button>
        <span class="rsd__muted">page {{ page }} · size {{ pageSize }} · sort {{ JSON.stringify(sort) }} · {{ selected.length }} selected</span>
      </div>

      <!-- ═══ 2 · API mode ═════════════════════════════════════════════════ -->
      <!--
        Server-side everything: search, filters, sort, page and page size are sent to the backend; rows are shown exactly as returned.
        Replace `api.dashboard.users` and the columns / filters with your own endpoint's fields.
      -->
      <RChartSplendor
        ref="apiTable"
        title="Users (API mode)"
        subtitle="Requests go through useHttp: auth, refresh-token retry and error shape come from composables/http.ts"
        :api="usersApi"
        :columns="apiColumns"
        :filter-defs="apiFilters"
        :options="{ retry: 2, columnToggle: true, export: { csv: true, excel: true, fileName: 'users', scope: 'page' }, rowActions: [{ key: 'view', label: 'View', icon: 'i-lucide-eye' }] }"
        @data:change="log('api data:change', `${$event.items.length} rows of ${$event.totalKnown ? $event.total : '?'}`)"
        @error="onError"
        @row:action="onRowAction"
      />

      <RCard class="rsd__log">
        <div class="rsd__log-head"><strong>Events</strong><button type="button" @click="events = []">Clear</button></div>
        <ol><li v-for="(e, i) in events" :key="i"><b>{{ e.name }}</b> {{ e.detail }}</li></ol>
      </RCard>
    </RContent>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import api from '~/helpers/apis'
import type { SplendorApi, SplendorColumn, SplendorDataChange, SplendorError, SplendorFilterDef, SplendorFilterValues, SplendorOptions, SplendorRowAction, SplendorSort } from '~/utils/chart/splendor.types'

// ═════════════════════════════════════════════════════════════════════════════
// Local mode
// ═════════════════════════════════════════════════════════════════════════════
interface Person { id: number; name: string; dept: string; salary: number; joined: string; status: boolean }
const DEPTS = ['Engineering', 'Design', 'Sales', 'Support']
const seed = (from: number, count: number): Person[] =>
  Array.from({ length: count }, (_, i) => {
    const n = from + i
    return { id: n, name: `${['Sokha', 'Dara', 'Vannak', 'Bopha', 'Rithy', 'Sophea'][n % 6]} ${n}`, dept: DEPTS[n % 4]!, salary: 900 + ((n * 137) % 1800), joined: `2025-${String((n % 12) + 1).padStart(2, '0')}-${String((n % 27) + 1).padStart(2, '0')}`, status: n % 5 !== 0 }
  })
const people = ref<Person[]>(seed(1, 47))
const extra = () => seed(people.value.length + 1, 3)

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

const columns: SplendorColumn<Person>[] = [
  { key: 'id', label: 'ID', type: 'number', width: '4rem' },
  { key: 'name', label: 'Name' },
  { key: 'dept', label: 'Department' },
  { key: 'salary', label: 'Salary', type: 'number', align: 'end' },
  { key: 'joined', label: 'Joined', type: 'date' },
  { key: 'status', label: 'Status', type: 'boolean', sortable: true },
]
const filterDefs: SplendorFilterDef<Person>[] = [
  { key: 'dept', label: 'Department', type: 'select', options: DEPTS.map((d) => ({ label: d, value: d })) },
  { key: 'status', label: 'Active', type: 'boolean' },
  { key: 'salary', label: 'Salary', type: 'number' },
  { key: 'joined', label: 'Joined', type: 'date' },
]

const localOptions: SplendorOptions<Person> = {
  searchable: true,
  searchPlaceholder: 'Search name or department…',
  searchFields: ['name', 'dept'],
  paginated: true,
  pageSizeOptions: [5, 10, 25],
  defaultPageSize: 10,
  multiSort: true, // Shift+click a header to add a sort column
  selectable: 'multiple',
  rowKey: 'id',
  columnToggle: true,
  striped: true,
  rowActions: [
    { key: 'edit', label: 'Edit', icon: 'i-lucide-pencil' },
    { key: 'delete', label: 'Delete', icon: 'i-lucide-trash-2', color: 'error' },
  ],
  export: { csv: true, excel: true, svg: true, fileName: 'team', scope: 'all' },
  chart: { type: 'bar', categoryKey: 'name', title: 'Salary', series: [{ key: 'salary', label: 'Salary' }], props: { currency: 'USD' } },
}

// Every piece of query state is controllable (v-model); leave any of them out and it is managed internally.
const search = ref('')
const filters = ref<SplendorFilterValues>({})
const page = ref(1)
const pageSize = ref(10)
const sort = ref<SplendorSort[]>([])
const selected = ref<Array<string | number>>([])
const view = ref<'table' | 'chart'>('table')

const removeMany = (rows: Person[]) => {
  const ids = new Set(rows.map((r) => r.id))
  people.value = people.value.filter((p) => !ids.has(p.id))
}
function onRowAction({ action, row }: { action: SplendorRowAction; row: Record<string, any> }) {
  log('row:action', `${action.key} #${row.id ?? row.Id ?? '?'}`)
  if (action.key === 'delete') people.value = people.value.filter((p) => p.id !== row.id)
}

// ═════════════════════════════════════════════════════════════════════════════
// API mode
// ═════════════════════════════════════════════════════════════════════════════
// `api.dashboard.users` is the endpoint the dashboard already pages with `page` / `page_size` and reads `Items` from.
const usersApi = computed<SplendorApi>(() => ({
  url: api.dashboard.users,
  method: 'GET',
  // filter: { tenant: 1 },        // static filter, always sent as `filter`
  // where: { deleted: false },    // static where-clause, always sent as `where`
  // paramMap: { pageSize: 'limit' }, sortFormat: 'prefix',   // adapt names / formats to the backend
  // responseMap: { items: 'data.rows', total: 'data.count' }, // only when auto-detection is not enough
}))
// Assumption: adjust to the fields your users endpoint really returns.
const apiColumns: SplendorColumn[] = [
  { key: 'Username', label: 'Username' },
  { key: 'Email', label: 'Email' },
]
const apiFilters: SplendorFilterDef[] = []
const apiTable = ref<{ refresh: () => void } | null>(null)

// ═════════════════════════════════════════════════════════════════════════════
// Log
// ═════════════════════════════════════════════════════════════════════════════
const events = ref<Array<{ name: string; detail: string }>>([])
const log = (name: string, detail = '') => { events.value = [{ name, detail }, ...events.value].slice(0, 14) }
const onDataChange = (e: SplendorDataChange<Person>) => log('data:change', `${e.items.length} rows of ${e.total} (page ${e.page}/${e.totalPages}, ${e.source})`)
const onError = (e: SplendorError) => log('error', `${e.kind}: ${e.message}`)
</script>

<style lang="scss">
.rsd {
  display: flex;
  flex-direction: column;
  gap: var(--sp-5, 1.25rem);
  padding: 0;

  &__title { margin: 0; font-size: 1.5rem; font-weight: 700; color: var(--c-text); }
  &__muted { font-size: 0.8125rem; color: var(--c-muted); }
  &__row { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
  &__row button, &__log-head button {
    padding: 0.25rem 0.625rem; font: inherit; font-size: 0.75rem; border: 1px solid var(--c-border); border-radius: var(--r-sm, 8px); color: var(--c-text); background: var(--c-surface); cursor: pointer;
    &:hover { border-color: var(--c-accent); color: var(--c-accent); }
    &:focus-visible { outline: 2px solid var(--c-accent); }
  }
  &__log { font-size: 0.8125rem; ol { margin: 0.5rem 0 0; padding: 0; list-style: none; max-height: 12rem; overflow: auto; color: var(--c-muted); } b { color: var(--c-accent); } }
  &__log-head { display: flex; align-items: center; justify-content: space-between; }
}
</style>
