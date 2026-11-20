<template>
  <div class="ocs-footer-wrapper" v-if="options?.info || options?.paging">
    <div class="left">
      <slot name="footerLeft" />
      <div class="total-record" v-if="options?.info">
        <span class="text-nowrap">{{ $t('total_record') }}: </span>
        <span class="font-bold">{{ total }}</span>
      </div>
      <div class="other">
        <slot name="footerCenter" />
      </div>
    </div>

    <div class="right" ref="paginationTBL">
      <div class="record">
        <OCSelectRecord v-if="options?.paging" v-model="selected" @select="selectRecords(selected)" />
      </div>
      <div class="nav-pagination" v-if="options?.paging">
        <!-- {{console.log('===>>> ',)}} -->
        <!-- v-if="options.paging && pageCount < total" -->
        <!-- {{ page }} {{ pageCount }} {{ total }} -->
        <!-- <UPagination size="xs" :max="5" v-model="page" :page-count="pageCount" :total="total" :ui="ui" :disabled="loading" show-first show-last /> -->
        <UPagination size="xs" :max="5" v-model="page" :page-count="pageCount" :total="total" :ui="ui"
          :disabled="loading">
          <template #prev="{ onClick, canGoPrev }">
            <UButton size="xs" icon="i-heroicons-chevron-left-20-solid" :ui="{ rounded: 'rounded-[10px]' }"
              class="rtl:[&_span:first-child]:rotate-180 pagination bg-default dark:text-white text-gray-900 justify-center"
              :class="[!canGoPrev ? 'opacity-low' : '']" :disabled="!canGoPrev || loading" @click="onClick" />
          </template>

          <template #next="{ onClick, canGoNext }">
            <UButton size="xs" icon="i-heroicons-chevron-right-20-solid" :ui="{ rounded: 'rounded-[10px]' }"
              class="rtl:[&_span:last-child]:rotate-180 pagination bg-default dark:text-white text-gray-900 justify-center"
              :class="[!canGoNext ? 'opacity-low' : '']" :disabled="!canGoNext || loading" @click="onClick" />
          </template>

          <template #first="{ onClick, canGoFirst }">
            <UButton size="xs" icon="i-heroicons-chevron-double-left-20-solid" :ui="{ rounded: 'rounded-[10px]' }"
              class="rtl:[&_span:first-child]:rotate-180 pagination bg-default dark:text-white text-gray-900 justify-center"
              :class="[!canGoFirst ? 'opacity-low' : '']" :disabled="!canGoFirst || loading" @click="onClick" />
          </template>

          <template #last="{ onClick, canGoLast }">
            <UButton size="xs" icon="i-heroicons-chevron-double-right-20-solid" :ui="{ rounded: 'rounded-[10px]' }"
              class="rtl:[&_span:last-child]:rotate-180 pagination bg-default dark:text-white text-gray-900 justify-center"
              :class="[!canGoLast ? 'opacity-low' : '']" :disabled="!canGoLast || loading" @click="onClick" />
          </template>
        </UPagination>
      </div>
    </div>

  </div>
</template>

<script setup>
const props = defineProps(['pageCount', 'total', 'options', 'totalPages', 'loading'])
const emit = defineEmits(['changePagination', 'selectRecords'])
const page = defineModel('page')
const selected = defineModel('selected')
const pageCount = computed(() => props.pageCount)
const total = computed(() => props.total)
const options = computed(() => props.options)
const totalPages = computed(() => props.totalPages)
const loading = computed(() => props.loading)

const paginationTBL = ref()
useScroll(paginationTBL, { behavior: 'smooth' })
useOnScroll(paginationTBL)

//s responsive for chip apply
const widthScreen = ref(window.innerWidth)
const isMobile = ref(false)

onMounted(() => {
  window.addEventListener('resize', updateWidth)
  isMobile.value = widthScreen.value < 768
})

const updateWidth = () => { // Function to update widthScreen on window resize
  widthScreen.value = window.innerWidth
  isMobile.value = widthScreen.value < 768
}
//e responsive for chip apply

const ui = {
  wrapper: 'gap-1.5',
  base: `w-9 justify-center pagination select-none`,
  rounded: 'rounded-[10px] first-of-type:rounded-[10px] last-of-type:rounded-[10px]',
}
mounted(() => {

})

watch(page, (n) => {
  if (isNotEmpty(n)) {
    emit('changePagination',n)
  }
})

// function changePagination() {
//   emit('changePagination')
// }

function selectRecords(selected) {
  emit("selectRecords",selected)
}

</script>

<style lang="scss">
.ocs-footer-wrapper {
  width: 100%;
  display: grid;
  grid-template-columns: auto auto;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0px;

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    grid-gap: 12px;
  }

  .left {
    display: flex;
    align-items: center;
    grid-gap: 6px;

    .total-record {
      font-size: 13px;
    }
  }

  .right {
    width: 100%;
    display: flex;
    align-items: center;
    grid-gap: 6px;

    // overflow: hidden;
    @media (max-width: 768px) {
      justify-content: space-between;
    }

    .nav-pagination {
      overflow: hidden;

      @media (max-width: 768px) {
        overflow: scroll;

        &::-webkit-scrollbar {
          display: none;
        }
      }
    }

    // -ms-overflow-style: none;
    // /* IE and Edge */
    // scrollbar-width: none;
    // /* Firefox */


    .select-records {
      box-shadow: none !important;
    }

    .pagination {
      width: 33px !important;
      height: 32px !important;
      box-shadow: none !important;
      opacity: 1;
      background: var(--bg-content);

      &.opacity-low {
        opacity: .5;
      }

      &.bg-primary-500 {
        background-color: var(--color-primary) !important;
        color: var(--color-text-in-primary-500) !important;

        &.bg-default {
          background: var(--bg-content);
        }
      }


    }
  }
}

.oc-content,
.oc-modal {
  .pagination {
    background: var(--bg-wrapper) !important;

    &.bg-primary-500 {
      color: white !important;

      &.bg-default {
        background: var(--bg-content);
      }
    }
  }
}
</style>
