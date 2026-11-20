// ─── RPagination.vue ──────────────────────────────────────────────────────────

<template>
  <div class="rty-pagination">
    <div class="pagination-left">
      <div class="flex gap-1.5 whitespace-nowrap">
        <span>{{ t('total_records') }}</span>
        <span>{{ Number(total) || 0 }}</span>
      </div>
    </div>

    <div class="flex gap-2">
      <RSelectRecord
        v-if="options.paging !== false"
        v-model="selected"
        :items="recordItems"
        :loading="Boolean(loading)"
        mode="nuxtui"
        @select="selectRecords"
      />

      <UPagination
        v-model:page="pageModel"
        :total="Number(total) || 0"
        :items-per-page="itemsPerPageValue"
        :disabled="Boolean(loading)"
        :show-edges="true"
        :sibling-count="1"
        size="xs"
        color="primary"
        active-color="primary"
        :ui="uiPagination"
        class="pagination-right"
      >
        <template #first="{ page: currentPage }">
          <slot name="first">
            <RTooltip :text="t('first')">
              <UButton
                icon="ri-arrow-left-double-fill"
                class="rtl:[&_span:first-child]:rotate-180 pagination justify-center"
                :disabled="currentPage <= 1 || loading"
                @click="pageModel = 1"
              />
            </RTooltip>
          </slot>
        </template>

        <template #prev="{ page: currentPage }">
          <slot name="prev">
            <RTooltip :text="t('previous')">
              <UButton
                icon="ri-arrow-left-s-line"
                class="rtl:[&_span:first-child]:rotate-180 pagination justify-center"
                :disabled="currentPage <= 1 || loading"
                @click="pageModel = currentPage - 1"
              />
            </RTooltip>
          </slot>
        </template>

        <template #item="{ item, page: currentPage }">
          <slot name="item" :item="item" :active="currentPage === item.value">
            <RTooltip :text="`${t('page')} ${String(item.value)}`">
              <UButton
                :label="String(item.value)"
                :variant="currentPage === item.value ? 'solid' : 'ghost'"
                class="pagination-page-btn"
                :disabled="loading"
                @click="pageModel = item.value"
              />
            </RTooltip>
          </slot>
        </template>

        <template #next="{ page: currentPage, pageCount: nextPageCount }">
          <slot name="next">
            <RTooltip :text="t('next')">
              <UButton
                icon="ri-arrow-right-s-line"
                class="rtl:[&_span:last-child]:rotate-180 pagination justify-center"
                :disabled="currentPage >= nextPageCount || loading"
                @click="pageModel = currentPage + 1"
              />
            </RTooltip>
          </slot>
        </template>

        <template #last="{ pageCount: lastPageCount }">
          <slot name="last">
            <RTooltip :text="t('last')">
              <UButton
                icon="ri-arrow-right-double-line"
                class="rtl:[&_span:last-child]:rotate-180 pagination justify-center"
                :disabled="page >= lastPageCount || loading"
                @click="pageModel = lastPageCount"
              />
            </RTooltip>
          </slot>
        </template>
      </UPagination>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'

const { t } = useI18n()
const selected = defineModel('selected')
const page = defineModel('page', { default: 1 })

const props = defineProps({
  total: { type: [Number, String], default: 0 },
  itemsPerPage: { type: [Number, String], default: 10 },
  items: { type: Array, default: () => [] },
  options: { type: Object, default: () => ({}) },
  loading: { type: Boolean, default: false },
})

const emits = defineEmits(['changePagination', 'selectRecords'])

const options = computed(() => props.options ?? {})
const total = computed(() => Number(props.total) || 0)
const itemsPerPageValue = computed(() => Math.max(1, Number(props.itemsPerPage) || 10))
const recordItems = computed(() => {
  const items = props.items?.length ? props.items : [10, 25, 50, 100]
  return items.map(item => Number(item) || 10)
})
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / itemsPerPageValue.value)))

const pageModel = computed({
  get: () => Math.min(Math.max(1, Number(page.value) || 1), pageCount.value),
  set: (value) => {
    page.value = Math.min(Math.max(1, Number(value) || 1), pageCount.value)
  },
})

watch(pageCount, (max) => {
  if ((Number(page.value) || 1) > max) page.value = max
})

watch(page, (value) => {
  if (value != null) emits('changePagination', value)
})

function selectRecords(value) {
  emits('selectRecords', value)
}

const uiPagination = {
  root: 'ui-rpagination-root',
  list: 'ui-rpagination-list flex items-center gap-1',
  label: 'ui-rpagination-label min-w-5 text-center',
  ellipsis: 'ui-rpagination-ellipsis h-[30px] w-[30px] flex justify-center items-center !pointer-events-none',
  item: 'ui-rpagination-item',
  prev: 'ui-rpagination-prev',
  next: 'ui-rpagination-next',
  first: 'ui-rpagination-first',
  last: 'ui-rpagination-last',
}
</script>

<style lang="scss">
// ── UInput override (goto field) ──────────────────────────────────────────
.rpag-input-root {
  width: 52px !important;
}
 
.rpag-input-base {
  height:       32px !important;
  width:        32px !important;
  padding:      0 8px !important;
  font-size:    13px !important;
  text-align:   center !important;
  font-family:  var(--font-fallback, 'Inter', system-ui, sans-serif) !important;
  color:        var(--c-text, #1a1510) !important;
  background:   var(--c-surface, #fff) !important;
  border:       1px solid var(--c-border, rgba(0,0,0,0.12)) !important;
  border-radius: 8px !important;
  box-shadow:   none !important;
  outline:      none !important;
  transition:   border-color 0.15s ease !important;
 
  &:focus {
    border-color: var(--c-accent, #ff8c42) !important;
    box-shadow:   0 0 0 2px rgba(255, 140, 66, 0.15) !important;
  }
 
  // Hide browser number spinners
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button { display: none; }
  -moz-appearance: textfield;
}

.rty-pagination {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;

  flex-shrink: 0;

  position: sticky;
  bottom: 0;
  z-index: 20;

  background: var(--c-surface);
  border-top: 1px solid var(--c-border);

  padding: 12px 16px;

  .pagination-center,
  .pagination-right {
    display: flex;
    align-items: center;
    gap: 5px;
    white-space: nowrap;
  }

  .pagination-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .pagination-left ::deep(button) {
    min-width: 50px !important;
  }

  .page-numbers {
    display: flex;
    flex-wrap: wrap;
    // gap: 0.25rem;
  }

  // Mobile
  @media (max-width: 768px) {
    > .flex {
      flex-direction: column;
      align-items: stretch;
    }

    .pagination-left {
      justify-content: center;
      margin-right: 0;
      order: 1;
    }

    .pagination-center {
      justify-content: center;
      text-align: center;
      order: 3;
      font-size: 0.875rem;
    }

    .pagination-right {
      justify-content: center;
      flex-wrap: wrap;
      margin-left: 0;
      order: 2;
    }

    .page-numbers {
      justify-content: center;
      flex-wrap: wrap;
      max-width: 100%;
    }

    .nav-btn,
    .page-btn {
      min-width: 36px;
      height: 36px;
    }
  }


  // Extra small phones
  @media (max-width: 480px) {
    .pagination-center {
      font-size: 12px;
      line-height: 1.4;
    }

    .label {
      font-size: 12px;
    }

    .page-numbers {
      gap: 2px;
    }

    .nav-btn,
    .page-btn {
      min-width: 32px;
      height: 32px;
    }
  }
}

.ui-rpagination-root {
  display: flex;
  justify-content: center;
  color: var(--c-text);
  // flow: wrap onto multiple rows instead of overflowing/scrolling
  ul {
    display: flex;
    flex-flow: row wrap;
    align-items: center;
    justify-content: center;
    row-gap: var(--sp-2, 8px);
    column-gap: var(--sp-2, 8px);
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  /* Every pagination button (page numbers, prev/next/first/last) is a circle */
  button {
    width: 36px !important;
    height: 36px !important;
    min-width: 36px !important;
    aspect-ratio: 1 / 1;
    border-radius: var(--r-full, 9999px) !important;

    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0 !important;

    background: var(--c-bg);
    color: var(--c-text);
    border: 1px solid var(--c-border);
    box-shadow: 0 1px 2px rgb(0 0 0 / .04);

    transition: all var(--t-fast, .2s) var(--ease-in-out, cubic-bezier(.4, 0, .2, 1));

    &:hover:not(:disabled) {
      background: var(--bg-tertiary, var(--c-muted)) !important;
      color: var(--c-text) !important;
      transform: translateY(-1px) !important;
    }

    &:active:not(:disabled) {
      transform: scale(.94);
    }
  }
  
  /* Active page — soft filled circle, no border */
  /* Active page (Nuxt UI usually uses aria-current) */
  [aria-current="page"] {
    border-color: transparent;
    color: var(--c-text);
    font-weight: 600;
    animation: page-active .25s ease;
    transform: scale(1.05);
    box-shadow: none;
    border-radius: 50%;
    button{
      color: #fff !important;
      background: var(--c-accent) !important;
      &:hover:not(:disabled){
        background: var(--c-hover-bg) !important;
      }
    }
  }

  .ui-rpagination-item {
    transition: 0.2s;
    gap: 0 !important;
  }

  /* Prev/next/first/last chevrons — same circle, no border by default */
  .ui-rpagination-prev,
  .ui-rpagination-next,
  .ui-rpagination-first,
  .ui-rpagination-last {
    button {
      border-color: transparent;
      // background: transparent;
      box-shadow: none;
      background: var(--c-bg) !important;

      &:hover:not(:disabled) {
        background: var(--c-surface) !important;
        border-color: var(--c-border) !important;
        color: var(--c-text) !important;
      }
    }
  }

  /* Disabled buttons (prev/next/first/last) */
  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    background: var(--bg-tertiary, var(--c-muted)) !important;
    color: var(--c-text) !important;
  }

  /* Ellipsis (...) — flat, no circle background */
  .ui-rpagination-ellipsis {
    width: 36px !important;
    height: 36px !important;
    border-radius: 50% !important;
    pointer-events: none;
    height: inherit;
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0.5;
    letter-spacing: 1px;
  }
}

@keyframes page-active {
  0% {
    transform: scale(.8);
    opacity: .7;
  }
  60% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1.08);
    opacity: 1;
  }
}


// select

.r-select-field-base {
  display: flex;
  align-items: center;
  justify-content: space-between !important;
  gap: 5px;
  width: 100%;
  padding: 4px 8px;
  border-radius: 8px;
  min-width: 40px !important; 
  width: 60px !important; 
}

.r-select-trailing{
  padding: 0 !important;
  margin: 0 !important;
  gap: 0 !important;
}


// [data-slot="base"] {
//   justify-content: space-between !important;
//   gap: 60px;
// }

.r-select-field-content {
  display: flex;
  flex-direction: column;
  padding: 5px !important;
  min-width: fit-content !important;
}

.pagination-goto {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap !important;
  span{
    white-space: nowrap !important;
  }
}
</style>