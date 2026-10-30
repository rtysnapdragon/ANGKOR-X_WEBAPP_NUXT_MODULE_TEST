<template>
  <div>
    <div
      class="rty-nav-function"
      :class="
        isEmpty(props.data.subLabel) || isEmpty(props.data.breadcrumb)
          ? 'items-center'
          : 'items-start'
      "
      v-if="isNotEmpty(props.data)"
    >
      <RTooltip
        :text="props.data.toolTip ?? $t('back')"
        v-if="props.data.hasBack"
      >
        <div class="rty-btn-back" @click="fnBack">
          <i class="ri-arrow-left-wide-fill"></i>
        </div>
      </RTooltip>
      <div class="flex flex-col">
        <div class="rty-name-function">{{ props.data.label }}</div>
        <div
          v-if="isNotEmpty(props.data.subLabel)"
          class="text-[13px] color-sub-text whitespace-nowrap"
        >
          {{ props.data.subLabel }}
        </div>
        <div v-if="isNotEmpty(props.data.breadcrumb)">
          <OCBreadcrumb
            :items="props.data.breadcrumb.items"
            @click="(item) => props.data.breadcrumb.onClick(item.to)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const toast = useToast();
const props = useBreadCrumb();
// color-sub-text
function fnBack() {
  try {
    props.data.fnBack();
  } catch (error) {
    toast.add({
      color: "red",
      title: error,
    });
  }
}

// ***Note how to use breadcrumb
// const breadcrumbItems = [
//   { label: "Home", to: "/demo/demoBreadcrumb" },
//   { label: "Page1", to: "/demo/demoBreadcrumb/page1" },
//   { label: "Page2", to: "/demo/demoBreadcrumb/page2" }, // current page
// ];

// function onBreadcrumbClick(item, index) {
//   console.log("Breadcrumb clicked:", item, index);
// }
</script>

<style lang="scss">
.rty-nav-function {
  user-select: none;
  display: flex;
  height: 34px;
  min-height: 34px;

  .rty-btn-back {
    display: flex;
    align-items: center;
    width: 30px;
    height: 100%;
    font-size: 16px;
    line-height: 16px;
    font-weight: bold;
    color: var(--color-w-b-1);
    margin-left: -4px;
    cursor: pointer;

    i {
      pointer-events: none;
    }
  }

  .rty-name-function {
    font-size: 15px;
    line-height: 20px;
    font-family: var(--font-500);
    white-space: nowrap;
  }
}
</style>
