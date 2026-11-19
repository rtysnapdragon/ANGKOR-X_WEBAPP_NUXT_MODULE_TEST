<template>
  <Teleport to="body">
    <transition name="fade" v-if="store.showReport">
      <RModal
        v-model="store.showReport"
        :ui="{
          width: 'modal-width-r-report',
        }"
        :preventClose="true"
        @onClose="
          () => {
            store.showReport = false;
          }
        "
      >
        <template #header> </template>
        <div
          class="flex items-center justify-center flex-col gap-1 py-5 select-none sticky"
        >
          <div class="text-[16px] font-bold">{{ store.title }}</div>
          <div class="text-[12px]">{{ store.description }}</div>
        </div>
        <div class="card-container-r-report overflow-auto">
          <div v-for="i in report" class="card" @click="onCardSelect(i)">
            <i class="ri-checkbox-circle-fill checked" v-if="i?.selected"></i>
            <div class="icon">
              <i class="ri-loader-line loading-spinner" v-if="i?.loading"></i>
              <i class="ri-printer-line text-[24px]" v-else></i>
            </div>
            <div class="text-[14px] font-[600]">{{ i?.Description }}</div>
          </div>
        </div>
      </RModal>
    </transition>
    <iframe
      ref="rtyReport"
      class="report-iframe-001"
      style="width: 0px; height: 0px"
      id="RREPORTPRINT"
      frameborder="0"
    ></iframe>
  </Teleport>
</template>

<script setup>
const store = useMyrtyReportStore();
const rtyReport = ref();
const report = computed(() => store.reportList);
const showReport = computed(() => store.showReport);
function onCardSelect(data) {
  data.loading = true;
  data.selected = true;

  store.printOrPreview({
    ...data,
    ...{
      data: store.dataSend.data,
      url: store.dataSend.url,
    },
  });
  store.checkSelected();
}
watch(showReport, (n) => {
  store.reportList = store.reportList.map((v) => {
    return { ...v, ...{ loading: false, selected: false } };
  });
});
mounted(() => {});
</script>

<style lang="scss">
.report-iframe-001 {
  visibility: hidden;
  pointer-events: none;
  user-select: none;
  display: fixed;
  z-index: -1;
}

.modal-width-r-report {
  min-width: 800px !important;
  max-height: 600px;
  min-height: fit-content;

  @media (min-width: 769px) {
    width: 80vw;
    height: 70vh;
  }

  @media (max-width: 768px) {
    width: 90vw;
    height: 80vh;
  }

  @media (max-width: 480px) {
    width: 100vw;
    height: 100vh;
  }
}

.card-container-r-report {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding-bottom: 20px;

  .card {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    height: 160px;
    background-color: var(--bg-wrapper);
    cursor: pointer;
    padding: 10px;
    border-radius: 16px;
    gap: 16px;
    user-select: none;

    .checked {
      position: absolute;
      top: 14px;
      right: 14px;
      color: #0c8ce9;
    }

    .icon {
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--bg-content);
      width: 50px;
      height: 50px;
      border-radius: 50%;

      .loading-spinner {
        display: inline-block;
        animation: spin 1s linear infinite;
        font-size: 24px;
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }

        to {
          transform: rotate(360deg);
        }
      }
    }
  }
}
</style>
