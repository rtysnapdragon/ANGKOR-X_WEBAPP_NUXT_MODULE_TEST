<template>
  <div
    :class="[
      !screen.isMobile
        ? 'ocs-wrapper-filter-pc'
        : 'ocs-wrapper-filter-mobile grid gap-2.5',
    ]"
  >
    <!-- pc only -->
    <div class="left gap-2" v-if="!screen.isMobile">
      <slot name="headerLeft" />
      <RBtnReload @onClick="emit('reload')" v-if="options?.reload ?? true" />
      <RInputSearch
        v-model.trim="searching"
        @on-input="(s) => emit('searchTable', s)"
        @on-cancel="(s) => emit('clearSearch', s)"
        v-if="options?.searching"
        :class="options.classSearch"
        :autofocus="false"
      />
      <slot name="headerCenter" />
      <slot name="headerApplyFilter" />
    </div>
    <div class="right" v-if="!screen.isMobile && $slots.headerRight">
      <slot name="headerRight" />
    </div>

    <!-- mobile only -->
    <div
      v-if="screen.isMobile"
      class="top"
      :class="
        options?.reload &&
        options?.searching &&
        !$slots.headerLeft &&
        !$slots.headerRight
          ? 'search-fill'
          : ''
      "
    >
      <div v-if="$slots.headerLeft">
        <slot name="headerLeft" />
      </div>
      <!-- mobile reload: PC uses @onClick, mobile uses @click -->
      <RBtnReload @click="emit('reload')" v-if="options?.reload ?? true" />
      <div class="search">
        <RInputSearch
          v-model.trim="searching"
          @on-input="(s) => emit('searchTable', s)"
          @on-cancel="(s) => emit('clearSearch', s)"
          v-if="options?.searching"
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
</template>

<script setup>
const props = defineProps(["options"]);
const emit = defineEmits([
  "selectRecords",
  "searchTable",
  "clearSearch",
  "reload",
]);
const selected = defineModel("selected");
const searching = defineModel("searching");
const options = computed(() => props.options);
const screen = useScreenStore();

function selectRecords(selected) {
  emit("selectRecords");
}

function searchTable(search) {
  emit("searchTable");
}
</script>

<style lang="scss">
// .oc-table-header::v-deep {
//   .input-search {
//     &::placeholder {
//       color: var(--color-w-b-3) !important;
//     }

//     box-shadow: none !important;
//   }
// }
.ocs-wrapper-filter-pc,
.ocs-wrapper-filter-mobile {
  .input-search {
    box-shadow: none !important;
    &::placeholder { color: var(--color-w-b-3) !important; }
  }
}
.ocs-wrapper-filter-pc {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  .left {
    display: flex;
    align-items: center;
    grid-gap: 6px;
    flex-wrap: wrap;
  }
}

.ocs-wrapper-filter-mobile {
  display: flex;
  flex-direction: column;

  .top {
    width: 100%;
    display: grid;
    grid-template-columns: auto auto 1fr auto;
    grid-gap: 6px;

    &.search-fill {
      grid-template-columns: auto 1fr;
    }

    .search {
      width: 100%;

      .input-search {
        width: 100% !important;
      }
    }
  }
}
</style>
