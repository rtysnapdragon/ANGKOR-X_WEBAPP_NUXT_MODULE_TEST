
<template>
  <!-- <header class="r-table-header" role="toolbar" aria-label="Table controls"> -->
    <div
      class="r-table-header"
      :class="[
        !screen.isMobile
          ? 'r-table-header__pc'
           : 'r-table-header__mobile grid gap-2.5',
      ]"
    >
      <div v-if="!screen.isMobile" class="r-table-header__pc-left">

        <RInputSearch
          v-if="options?.searchable"
          :class="options?.classSearch"
          :autofocus="false"
          :placeholder="t('search')"
          v-model.trim="searching"
          class="r-table-header__search"
          @on-input="(s) => emits('searchTable', s)"
          @on-cancel="(s) => emits('clearSearch', s)"
          @search="onSearchClick"
          @clear="onClearSearch"
          @keydown.enter.prevent="onSearchClick"
        />

        <RBtnReload @onClick="emits('reload')" v-if="options.reload ?? true" />

        <!-- Left slot: title, action buttons, etc. -->
        <div class="r-table-header__headerLeft">
          <slot name="headerLeft" />
        </div>

        <!-- Center slot: extra filters, tabs, etc. -->
        <div class="r-table-header__center" v-if="$slots.headerCenter">
          <slot name="headerCenter" />
        </div>

        <slot name="headerApplyFilter" />

        <!-- Column filter popover -->
        <!-- <RTableFilter
          v-if="options.columnFilter ?? true"
          :columns="columns"
          :model-value="columnFilters"
          @update:model-value="$emits('update:columnFilters', $event)"
          @apply="$emits('filter', $event)"
        /> -->

        <!-- Export dropdown -->
        <!-- <UDropdownMenu
          v-if="showExport !== false"
          :items="exportItems"
          :ui="{ content: 'min-w-[160px]' }"
        >
          <UButton
            :icon="exporting ? 'i-ri-loader-4-line' : 'i-ri-download-2-line'"
            color="neutral"
            variant="ghost"
            size="sm"
            :loading="exporting"
            :aria-label="t('export')"
          >
            <span class="r-table-header__btn-label">{{ t('export') }}</span>
          </UButton>
        </UDropdownMenu> -->
      </div>

      <div class="r-table-header__pc-right" v-if="!screen.isMobile && $slots.headerRight">
        <slot name="headerRight" />
      </div>

      <!-- mobile only -->
      <div
        v-if="screen.isMobile"
        class="top"
        :class="
          options.reload &&
          options.searching &&
          !$slots.headerLeft &&
          !$slots.headerRight
            ? 'search-fill'
            : ''
        "
      >
        <div v-if="$slots.headerLeft">
          <slot name="headerLeft" />
        </div>
        <RBtnReload @click="emits('reload')" v-if="options.reload" />
        <div class="search">
          <RInputSearch
            v-model.trim="searching"
            @on-input="(s) => emits('searchTable', s)"
            @on-cancel="(s) => emits('clearSearch', s)"
            @search="onSearchClick"
            @clear="onClearSearch"
            @keydown.enter.prevent="onSearchClick"
            v-if="options.searching"
          />
        </div>
        <div v-if="screen.isMobile && $slots.headerRight">
          <slot name="headerRight" />
        </div>
      </div>

      <div v-if="screen.isMobile && $slots.headerCenter">
        <slot name="headerCenter" />
      </div>

      <div v-if="screen.isMobile && $slots.headerApplyFilter">
        <slot name="headerApplyFilter" />
      </div>
    </div>
  <!-- </header> -->
</template>

// ─── RTableHeader.vue ─────────────────────────────────────────────────────────

<script setup>
defineOptions({ name: 'RTableHeader' })

const props = defineProps([
  'options',
  'modelValue',     // search searching — two-way via v-model
  'loading',
  'exporting',
  'exportColumns',
  'exportRows',      // full dataSrc for export (all pages)
  'exportFilename',
  // filter
  'columns',
  'columnFilters',
])

const emits = defineEmits([
  'update:modelValue',
  'update:columnFilters',
  'reload',
  'filter',
  'searchTable',
  'clearSearch'
])

const _searchModel = ref(props.modelValue || '')

const { t } = useI18n()
const screen = useScreenStore();
const { exporting: _exporting, exportCsv, exportExcel, exportPdf } = useRTableExport()

const _exportColumns = computed(() => props.exportColumns)
const _exportRows = computed(() => props.exportRows)
const _exportFilename = computed(() => props.exportFilename)
const _columns = computed(() => props.columns)
const _columnFilters = computed(() => props.columnFilters)
const options = computed(() => props.options)
const searching = defineModel("search");

// ── Search ────────────────────────────────────────────────────────────────────
// Controlled input: reads from modelValue, writes via emits
// const searching = computed({
//   get: () => props.modelValue,
//   set: (v) => emits('update:modelValue', v),
// })
// Trigger immediate search (also fires via watch-debounce in parent)
const onSearchClick = () => emits('searchTable', searching.value)
const onClearSearch = () => { searching.value = ''; emits('clearSearch'); emits('update:modelValue', '') }

// ── Export menu ───────────────────────────────────────────────────────────────
const onExportCsv   = () => exportCsv(props.exportRows,   props.exportColumns, props.exportFilename)
const onExportExcel = () => exportExcel(props.exportRows, props.exportColumns, props.exportFilename)
const onExportPdf   = () => exportPdf(props.exportRows,   props.exportColumns, props.exportFilename)

const _exportItems = computed(() => [
  { label: t('export_csv'),   icon: 'i-ri-file-text-line',    onSelect: onExportCsv   },
  { label: t('export_excel'), icon: 'i-ri-file-excel-line',   onSelect: onExportExcel },
  { label: t('export_pdf'),   icon: 'i-ri-file-pdf-line',     onSelect: onExportPdf   },
])
</script>


<style lang="scss" scoped>
@mixin respond-to($bp) {
  @if $bp == mobile { @media (max-width: 767px) { @content; } }
}
@mixin flex-gap($g: 0.5rem) { display: flex; align-items: center; gap: $g; }

.r-table-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-bottom: var(--sp-4);
  background: var(--c-surface);
  border-bottom: 1px solid var(--c-border);
  flex-shrink: 0;       // never compressed by flex parent
  position: sticky;
  top: 0;
  z-index: 10;
  width: 100%;

  &__pc {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    // flex: 1 1 auto;
    // flex-wrap: nowrap;

    &-left{
      @include flex-gap(0.5rem);
      flex: 1 1 auto;
      flex-wrap: nowrap;
    }

    &-right{
      @include flex-gap(0.5rem);
      flex: 0 0 auto;
      margin-left: auto;
      flex-wrap: wrap;
    }
  }


  &__mobile {
    @include flex-gap(0.5rem);
    flex: 1 1 auto;
    flex-wrap: nowrap;
  }

  &__left {
    @include flex-gap(0.5rem);
    flex: 1 1 auto;
    flex-wrap: nowrap;
  }

  &__headerLeft {
    @include flex-gap(0.5rem);
    // flex: 1 1 auto;
    justify-content: center;
    // flex-wrap: wrap;
    padding: 5px 0;
  }

  &__center {
    @include flex-gap(0.5rem);
    flex: 0 0 auto;
  }

  &__right {
    @include flex-gap(0.5rem);
    flex: 0 0 auto;
    margin-left: auto;
    flex-wrap: wrap;
  }

  &__search {
    min-width: 180px;
    max-width: 260px;
  }

  @include respond-to(mobile) {
    flex-direction: column;
    align-items: stretch;

    &__left, &__center, &__right {
      width: 100%;
      margin-left: 0;
    }

    &__search {
      min-width: 100%;
      max-width: 100%;
    }
  }
}
</style>
