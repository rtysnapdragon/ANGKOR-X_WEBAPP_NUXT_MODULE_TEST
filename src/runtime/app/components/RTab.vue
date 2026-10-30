<template>
  <UTabs ref="refRTab" v-model="model" :items="items" :orientation="orientation" :default-index="defaultIndex" :ui="ui" :content="content"
    :variant="props.variant" @change="onChangeTab">
    <template #default="{ item, index, selected, disabled }">
      <slot name="default" v-bind="{ item, index, selected, disabled }" />
    </template>

    <template #item="{ item, index, selected, disabled }">
      <Transition name="rtab-content" mode="out-in">
        <div :key="String(model) + '-' + index" class="rtab-content">
          <slot name="item" v-bind="{ item, index, selected, disabled }" />
        </div>
      </Transition>
    </template>

    <template v-for="r in templateRender" :key="r" #[r]="{ item, index, selected }" class="">
      <slot :name="r" v-bind="{ item, index, selected }"></slot>
    </template>
  </UTabs>
</template>

<script setup>
//for clear route
// const fullPath = useRoute().fullPath;
// const parameter = fullPath?.split("?")[1];
// const router = useRouter();
// if (parameter) {
//   router.replace(fullPath?.split("?")[0]);
// }
/////////////////////////////////

const model = defineModel();
const props = defineProps([
  "ui",
  "orientation",
  "defaultIndex",
  "items",
  "isObject",
  "NotClearRoute",
  "variant",
  "content"
]);
const NotClearRoute = computed(() => props.NotClearRoute ?? false);
const emits = defineEmits(["onChange"]);

watch(
  () => NotClearRoute.value,
  (n, o) => {
    if (!n) {
      const fullPath = useRoute().fullPath;
      const parameter = fullPath?.split("?")[1];
      const router = useRouter();
      if (parameter) {
        router.replace(fullPath?.split("?")[0]);
      }
    }
  },
  { deep: true, immediate: true }
);

const ui = computed(() => {
  const vertical = props.orientation;

  const defaultUI = {
    wrapper: "relative space-y-4 ",
    // list: 'relative flex p-1 group',
    // root: 'flex items-center gap-2',
    // content: 'w-full rounded-md focus-visible:outline-3',
    // leadingIcon: 'shrink-0',
    // leadingAvatar: 'shrink-0',
    // leadingAvatarSize: '',
    // label: 'truncate',
    // trailingBadge: 'shrink-0',
    // trailingBadgeSize: 'sm',
    trigger:content.value ? '' : 'grow flex-col gap-1',
    list: {
      trigger: [
        'r-trigger py-1 group relative inline-flex items-center min-w-0 data-[state=inactive]:text-muted hover:data-[state=inactive]:not-disabled:text-default font-medium rounded-md disabled:cursor-not-allowed disabled:opacity-75',
        'transition-colors'
      ],
      base: `${vertical === "vertical" ? "space-y-1.5 " : "!flex gap-1.5 nav-oc-tab"
        }`,
      background: "bg-transparent dark:bg-transparent",
      padding: "p-0",
      width: "",
      height: "h-full",
      rounded: "",
      tab: {
        base: `relative ${vertical === "vertical" ? "" : "w-fit"} ease-in-out`,
        background: "",
        active: "tab-bg-active text-white",
        inactive: "color-sub-text",
        rounded: "ocs-rounded",
        height: "!h-8",
        font: "font-normal !tracking-normal",
      },
      marker: {
        wrapper:
          "focus-visible:!outline-0 focus-visible:!border-0 ease-in-out !h-8 transition-all duration-300 transition-all duration-300" ,
        base: "focus-visible:!outline-0 focus-visible:!border-0",
        background: "tab-bg-active-marker",
        rounded: "ocs-rounded",
        shadow: "!shadow-none",
      },
    },
  };

  return {
    ...defaultUI,
    ...props.ui,
    list: {
      ...defaultUI.list,
      ...props.ui?.list,
      tab: {
        ...defaultUI.list.tab,
        ...props.ui?.list?.tab,
      },
    },
  };
});

const isObject = computed(() =>
  isNotEmpty(props.isObject) ? props.isObject : false
);

const orientation = computed(() => props.orientation);
const defaultIndex = computed(() => props.defaultIndex);
const items = computed(() => props.items);
const content = computed(() => props.content ?? true)
const templateRender = computed(() =>
  items.value.filter((e) => e.slot).map((e) => e.slot)
);
const onChangeTab = (index) => {
  if (isObject.value) emits("onChange", items.value[index]);
  else emits("onChange", index);
};
const refRTab = ref();

function RTab() {
  return refRTab.value;
}
defineExpose({
  RTab,
  jumpTo: (index) => {
    model.value = index;
  },
  disabled: (index, disabled) => {
    items.value.filter((v, i) =>
      i == index ? (v.disabled = disabled) : (v.disabled = false)
    );
  },
});
</script>

<style lang="scss">
.r-trigger{
  height: 50px !important;
}
.tab-bg-default {
  background-color: var(--bg-wrapper);
  letter-spacing: 0px !important;
}

.tab-bg-active-marker {
  background-color: var(--color-primary) !important;
}

.nav-oc-tab {
  display: flex !important;
  gap: 0.375rem !important; // 1.5 in Tailwind is 0.375rem
  overflow-x: auto; // Maintain scrollability
  overflow-y: hidden;

  // &::-webkit-scrollbar {
  //   display: none !important; // Hide scrollbar on mobile
  // }

  @media (max-width: 540px) {
    &::-webkit-scrollbar {
      display: none !important; // Hide scrollbar on mobile
    }
  }
}

/* Tab panel transition */
.rtab-content {
  width: 100%;
  min-width: 0;
  will-change: opacity, transform;
}

.rtab-content-enter-active,
.rtab-content-leave-active {
  transition:
    opacity 180ms ease,
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
}

.rtab-content-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.rtab-content-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Smooth tab interactions */
.nav-oc-tab {
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

/* Respect reduced-motion preferences */
@media (prefers-reduced-motion: reduce) {
  .rtab-content-enter-active,
  .rtab-content-leave-active {
    transition: none !important;
  }

  .rtab-content-enter-from,
  .rtab-content-leave-to {
    transform: none;
  }
}
</style>
