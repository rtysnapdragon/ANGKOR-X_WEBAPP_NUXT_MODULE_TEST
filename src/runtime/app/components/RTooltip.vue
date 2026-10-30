<template>
  <div>
    <div v-if="props.isPopper" ref="trigger" :class="ui.wrapper" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
      <slot :open="open"> Hover </slot>

      <div v-if="open && !prevent && isVisible && !isGlobal" ref="container" :class="[ui.container, ui.width, 'z-10']">
        <Transition appear v-bind="ui.transition">
          <div class="w-fit">
            <div v-if="popper.arrow" data-popper-arrow :class="ui.arrow" />
            <div :class="[
              ui.base,
              ui.color,
              ui.rounded,
              ui.shadow,
              ui.ring,
              ui.background,
            ]">
              <slot name="text">
                {{ text }}
              </slot>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Default Tooltip Fallback -->
    <UPopover v-else :prevent="prevent" mode="hover" :text="text" :content="{
      align: 'center',
      side: 'top',
      sideOffset: 8
    }" :popper="{ placement: placement ? placement : 'top'  }" :ui="ui">
      <slot />
      <template #content>
        <span class="default-text-toolip block px-2 py-1 text-xs whitespace-nowrap">
          {{ text }}
        </span>
      </template>
    </UPopover>
  </div>
</template>

<script setup>
import { ref, computed, useSlots } from "vue";
// import { usePopper } from "@vueuse/popper";
import { usePopper } from '../composables/usePopper'
const props = defineProps([
  "text",
  "placement",
  "mode",
  "content",
  "prevent",
  "locked",
  "isPopper",
  'isGlobal'
]);

const text = computed(() => props.text);
const placement = computed(() => props.placement ?? "bottom-start");
const content = computed(() => props.content)
const mode = computed(() => props.mode)
const prevent = computed(() => props.prevent);
const isGlobal = computed(() => isNotEmpty(props.isGlobal));

const popper = computed(() => {
  return {
    placement: props.placement ?? "bottom",
    arrow: true,
    offsetDistance: 10,
  };
});
const [trigger, container] = usePopper(popper.value);

const open = ref(false);

let openTimeout = null;
let closeTimeout = null;

const isVisible = computed(() => !!(useSlots().text || props.text));

const ui = {
  wrapper: "relative inline-flex w-full",
  // base: '[@media(pointer:coarse)]:hidden h-full px-2 py-1 text-xs font-normal relative',
  base:'default-text-toolip  py-2 px-4',
  // color: "text-gray-900 dark:text-white",
  // shadow: "shadow",
  // rounded: "rounded",
  // ring: "",
  // base: "[@media(pointer:coarse)]:hidden h-6 px-2 py-1 text-xs font-normal truncate relative",
  // shortcuts: "hidden md:inline-flex flex-shrink-0 gap-0.5",
  // middot: "mx-1 text-gray-700 dark:text-gray-200",
  container: "z-200 group",
  width: "max-w-xs",
  background: "color-bg-content",
  color: "text-gray-900 dark:text-white",
  shadow: "shadow-xl",
  rounded: "rounded",
  ring: "ring-0",
  base: "[@media(pointer:coarse)]:hidden h-full w-fit px-2 py-1 text-xs font-normal relative",
  shortcuts: "hidden md:inline-flex flex-shrink-0 gap-0.5",
  middot: "mx-1 text-gray-700 dark:text-gray-200",
  transition: {
    // enterActiveClass: "transition ease-out duration-200",
    // enterFromClass: "opacity-0 translate-y-1",
    // enterToClass: "opacity-100 translate-y-0",
    // leaveActiveClass: "transition ease-in duration-150",
    // leaveFromClass: "opacity-100 translate-y-0",
    // leaveToClass: "opacity-0 translate-y-1",
    enterActiveClass: "transition ease-out duration-200",
    enterFromClass: "opacity-0 translate-y-1",
    enterToClass: "opacity-100 translate-y-0",
    leaveActiveClass: "transition ease-in duration-150",
    leaveFromClass: "opacity-100 translate-y-0",
    leaveToClass: "opacity-0 translate-y-1",
  },
  popper: {
    // strategy: "fixed",
    strategy: "fixed",
  },
  default: {
    openDelay: 0,
    closeDelay: 0,
    // closeDelay: 0,
  },
  arrow: {
    base: "[@media(pointer:coarse)]:hidden invisible before:visible before:block before:rotate-45 before:z-[-1] before:w-2 before:h-2",
    ring: "before:ring-1 before:ring-gray-200 dark:before:ring-gray-800",
    rounded: "before:rounded-sm",
    background: "before:bg-gray-200 dark:before:bg-gray-800",
    shadow: "before:shadow",
    placement:
      "group-data-[popper-placement*='right']:-left-1 group-data-[popper-placement*='left']:-right-1 group-data-[popper-placement*='top']:-bottom-1 group-data-[popper-placement*='bottom']:-top-1",
  },
};

mounted(() => {
  // console.log('tooltip >>>', placement.value)
})

function onMouseEnter() {
  // cancel programmed closing
  if (closeTimeout) {
    // clearTimeout(closeTimeout);
    // closeTimeout = null;
    clearTimeout(closeTimeout);
    closeTimeout = null;
  }
  // dropdown already open
  if (open.value) {
    return;
  }
  // openTimeout =
  //   openTimeout ||
  //   setTimeout(() => {
  //     open.value = true;
  //     openTimeout = null;
  //   }, 0);
  openTimeout =
    openTimeout ||
    setTimeout(() => {
      open.value = true;
      openTimeout = null;
    }, 0);
}

function onMouseLeave() {
  // cancel programmed opening
  if (openTimeout) {
    // clearTimeout(openTimeout);
    // openTimeout = null;
    clearTimeout(openTimeout);
    openTimeout = null;
  }
  // dropdown already closed
  if (!open.value) {
    return;
  }
  // closeTimeout =
  //   closeTimeout ||
  //   setTimeout(() => {
  //     open.value = false;
  //     closeTimeout = null;
  //   }, 0);
  closeTimeout =
    closeTimeout ||
    setTimeout(() => {
      open.value = false;
      closeTimeout = null;
    }, 0);
}
</script>

<style lang="scss" scoped>
.w-fit{
  white-space: nowrap !important;
  font-family: var(--font-400) !important;
}
.shadow-tooltip {
  box-shadow: 0px 6px 20px rgba(0, 0, 0, 0.0941176471);
  z-index: 10000 !important;
}

::v-deep .truncate.relative {
  overflow: unset;
  text-overflow: unset;
  white-space: unset;
}

.default-text-toolip{
  white-space: nowrap !important;
  padding: 4px 10px !important;
}
</style>

