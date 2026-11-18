<template>
  <div>
    <div v-if="isPopper" ref="trigger" :class="ui.wrapper" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
      <slot :open="open"> Hover </slot>
      <Teleport :to="to">
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
      </Teleport>
    </div>

    <!-- Default Tooltip Fallback -->
    <UPopover v-else :prevent="prevent" :mode="mode" :dismissible="noClose" :modal="modal" :align="align" :disabled="disabled" :text="text" :openDelay="openDelay" :closeDelay="closeDelay" :content="{
      align: align,
      side: side,
      sideOffset: props.sideOffset ?? 8
    }" :popper="{ placement: placement ? placement : 'top'  }" :ui="ui">
      <slot />
      <template #content>
        <div class="rt-tooltip-animation" role="tooltip">
           <slot name="content">
            <span class="default-text-toolip block px-2 py-1 text-xs whitespace-nowrap">
              {{ text }}
            </span>
          </slot>
        </div>
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
  'isGlobal',
  'to',

  // UPopover
  'side',
  'align',
  'sideOffset',
  'disabled',
  'closeDelay',
  'openDelay',
  'modal',
  'noClose'
]);

const text = computed(() => props.text);
const placement = computed(() => props.placement ?? "bottom-start");
const content = computed(() => props.content)
const mode = computed(() => props.mode ?? 'hover')
const side = computed(() => props.side ?? "top") // top / bottom /right /left
const prevent = computed(() => props.prevent);
const isGlobal = computed(() => isNotEmpty(props.isGlobal));
const disabled = computed(() => props.disabled ?? false)
const openDelay = computed(() => props.openDelay ?? 200 )
const closeDelay = computed(() => props.closeDelay ?? 300 )
const align = computed(() => props.align ?? 'center') // start , center , end
const modal = computed(() => props.modal ?? false)
const noClose = computed(() => props.noClose ?? false)
const isPopper = computed(() => props.isPopper ?? false)
const to = computed(() => props.to ?? 'body')

const popper = computed(() => ({
    placement: props.placement ?? "bottom",
    arrow: true,
    offsetDistance: props.sideOffset ?? 8,
    strategy: "fixed",
}));
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
  container: "z-[999999] pointer-events-none group",//z-200
  width: "max-w-xs",
  background: "rtoopip-bg",
  color: "text-gray-900 dark:text-white",
  shadow: "shadow-xl",
  rounded: "rounded",
  ring: "ring-0",
  base: "[@media(pointer:coarse)]:hidden h-fit w-fit px-2 py-1 text-xs font-normal relative",
  content: [
    'rtoopip-bg',
    'shadow-lg',
    'rounded-md',
    'ring ring-default',
    'pointer-events-auto',
    'rt-popover-content'
  ].join(' '),
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
  z-index: 9999 !important;
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

// .rt-popover-content {
//   background: var(--bg-wrapper) !important;
//   // background-color: var(--bg-tertiary) !important;
// }

// Override the Nuxt UI Popover background using your custom class:
:global(.rt-popover-content) {
  display: block;
  background: var(--bg-tertiary);
  color: var(--color-tooltip-text);
  font-size: 0.75rem;
  font-weight: 500;
  padding: 6px 3px !important;
  border-radius: 8px;
  white-space: nowrap;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  letter-spacing: 0.01em;
  border: 1px solid var(--color-tooltip-border);
}

// .rt-tooltip-animation {
//   animation: rt-tooltip-enter 150ms ease-out both;
// }

// [data-side='top'] .rt-tooltip-animation {
//   --tooltip-y: 5px;
// }

// [data-side='bottom'] .rt-tooltip-animation {
//   --tooltip-y: -5px;
// }

// [data-side='left'] .rt-tooltip-animation {
//   --tooltip-x: 5px;
// }

// [data-side='right'] .rt-tooltip-animation {
//   --tooltip-x: -5px;
// }

// @keyframes rt-tooltip-enter {
//   from {
//     opacity: 0;
//     transform: translate(
//       var(--tooltip-x, 0),
//       var(--tooltip-y, 5px)
//     ) scale(0.98);
//   }

//   to {
//     opacity: 1;
//     transform: translate(0, 0) scale(1);
//   }
// }



// make the animation automatically follow the Popover's actual placement (top, bottom, left, right) using Nuxt UI / Reka UI's data-side attribute.
// .rt-popover-content {
//   overflow: visible !important;
//   transform-origin: var(--reka-popover-content-transform-origin);
// }

// .rt-tooltip-animation {
//   animation: rt-tooltip-enter 160ms ease-out both;
//   will-change: transform, opacity;
// }

// /* Top */
// .rt-popover-content[data-side='top'] {
//   --tooltip-x: 0px;
//   --tooltip-y: 6px;
// }

// /* Bottom */
// .rt-popover-content[data-side='bottom'] {
//   --tooltip-x: 0px;
//   --tooltip-y: -6px;
// }

// /* Left */
// .rt-popover-content[data-side='left'] {
//   --tooltip-x: 6px;
//   --tooltip-y: 0px;
// }

// /* Right */
// .rt-popover-content[data-side='right'] {
//   --tooltip-x: -6px;
//   --tooltip-y: 0px;
// }

// @keyframes rt-tooltip-enter {
//   from {
//     opacity: 0;
//     transform: translate3d(
//       var(--tooltip-x, 0px),
//       var(--tooltip-y, 6px),
//       0
//     ) scale(0.98);
//   }

//   to {
//     opacity: 1;
//     transform: translate3d(0, 0, 0) scale(1);
//   }
// }


:global(.rt-popover-content) {
  overflow: visible !important;
  transform-origin: var(--reka-popover-content-transform-origin);
}

:global(.rt-tooltip-animation) {
  animation: rt-tooltip-enter 160ms ease-out both;
  will-change: transform, opacity;
}

:global(.rt-popover-content[data-side='top']) {
  --tooltip-x: 0px;
  --tooltip-y: 6px;
}

:global(.rt-popover-content[data-side='bottom']) {
  --tooltip-x: 0px;
  --tooltip-y: -6px;
}

:global(.rt-popover-content[data-side='left']) {
  --tooltip-x: 6px;
  --tooltip-y: 0px;
}

:global(.rt-popover-content[data-side='right']) {
  --tooltip-x: -6px;
  --tooltip-y: 0px;
}

@keyframes rt-tooltip-enter {
  from {
    opacity: 0;
    transform: translate3d(
      var(--tooltip-x, 0px),
      var(--tooltip-y, 6px),
      0
    ) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }
}

//closing animation
:global([data-state='closed'] .rt-tooltip-animation) {
  animation: rt-tooltip-leave 120ms ease-in both;
}

@keyframes rt-tooltip-leave {
  from {
    opacity: 1;
    transform: translate3d(0, 0, 0) scale(1);
  }

  to {
    opacity: 0;
    transform: translate3d(
      var(--tooltip-x, 0px),
      var(--tooltip-y, 6px),
      0
    ) scale(0.98);
  }
}

// //closing animation
// [data-state='closed'] .rt-tooltip-animation {
//   animation: rt-tooltip-leave 120ms ease-in both;
// }

// @keyframes rt-tooltip-leave {
//   from {
//     opacity: 1;
//     transform: translate3d(0, 0, 0) scale(1);
//   }

//   to {
//     opacity: 0;
//     transform: translate3d(
//       var(--tooltip-x, 0px),
//       var(--tooltip-y, 6px),
//       0
//     ) scale(0.98);
//   }
// }
// .tooltip-enter-active,
// .tooltip-leave-active {
//   transition: opacity 0.15s ease, transform 0.15s ease;
// }

// .tooltip-enter-from {
//   opacity: 0;
//   transform: translateY(-50%) translateX(-6px) !important;
// }

// .tooltip-leave-to {
//   opacity: 0;
//   transform: translateY(-50%) translateX(-6px) !important;
// }


</style>

