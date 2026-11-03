<template>
  <div class="r-wrapper-popover">
    <!-- use = nuxtui -->
    <UPopover v-model:open="model" :closeDelay="closeDelay" :mode="mode" :reference="reference" :dismissible="noClose" :open-delay="openDelay" :close-delay="closeDelay" :arrow="arrow" :content="contentCus"
      :ui="upopverUI"  @pointer-down-outside.prevent
      v-if="use == 'nuxtui'">
      <slot name="trigger" v-if="$slots.trigger"></slot>
      <div class="btn-leading" v-else><i class="ri-more-2-fill"></i></div>
      <template #content>
        <div class="dialog" :class="nClass" @pointerdown.stop @mousedown.stop @click.stop >
          <slot></slot>
        </div>
      </template>
      <slot name="anchor" v-if="$slots.anchor">
        <RInput placeholder="Frus to open" @frus="open = true" @blur="open = false" />
      </slot>
    </UPopover>

    <!-- use = flowbite -->
    <fwb-dropdown :placement="placement ?? 'right'" closeInside="closeInside" class="popup-flowbite" v-else-if="use == 'flowbite'">
      <template #trigger>
        <slot name="trigger" v-if="$slots.trigger"></slot>
        <div class="btn-leading" v-else @click.stop><i class="ri-more-2-fill"></i></div>
      </template>
      <div @click.stop>
        <slot></slot>
      </div>
    </fwb-dropdown>

    <!-- use = headless -->
    <Popover v-slot="{ open }" class="relative popup-headless" v-else-if="use == 'headless'" >
      <PopoverButton as="div" class="popover-trigger">
        <slot name="trigger" v-if="$slots.trigger"></slot>
        <div class="btn-leading" v-else><i class="ri-more-2-fill"></i></div>
      </PopoverButton>
      <PopoverPanel class="absolute  right-0 top-full z-50 mt-2" v-slot="{ close }">
        <slot :close="close"></slot>
      </PopoverPanel>
    </Popover>
  </div>
</template>

<script setup>
//  :content="{ side: side,align:'',sideOffset: sideOffset}" :alignOffset="1"
// import { FwbDropdown } from 'flowbite-vue'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue'
const props = defineProps(['ui','mode', 'closeDelay', 'use', 'placement', 'class', 'closeInside', 'closeDelay', 'openDelay','arrow','noClose','reference', // cutom ref by parent use for uipopup use:"nuxtui"
'content' // content:{ side: string 'top|bottom|left|right|top-start|top-end|bottom-start|bottom-end|left-start|left-end|right-start|right-end',remak
]) // use : nuxtui , flowbite , headless
const model = defineModel()
const mode = computed(() => props.mode ?? 'click') // 'hover', 'click'
const closeDelay = computed(() => props.closeDelay)
const use = computed(() => props.use ?? 'nuxtui')
const placement = computed(() => props.placement)
const nClass = computed(() => props.class)
const closeInside = computed(() => props.closeInside)
const openDelay = computed(() => props.openDelay)
const reference = computed(() => props.reference)
const content = computed(() => props.content)
const side = computed(() => props.content?.side)
const sideOffset = computed(() => props.content?.sideOffset ?? 8)
const noClose = computed(() => props.noClose)
const arrow = computed(() => props.arrow ?? false)
const emit = defineEmits(['click'])

const contentCus1 = computed(() => {
  const content = {
    side: side.value ?? 'right',
    sideOffset: sideOffset.value ?? 8,
    // alignOffset: props.alignOffset.value ?? 1,
  }
  if(content.value){
    Object.assign(content,content.value)
  }
  return content
})

const contentCus = computed(() => {
  const result = {
    side: 'right',
    sideOffset: 8,
  }

  // support placement: bottom-start, bottom-end, left-start...
  if (props.placement) {
    const [side, align] = props.placement.split('-')

    result.side = side

    if (align) {
      result.align = align
    }
  }

  // allow parent content override
  return {
    ...result,
    ...props.content
  }
})

const upopverUI = computed(() => ({
  content: 'ui-rpopover-content flex', arrow: 'ui-rpopover-arrow', background: '',
  arrow: 'ui-rpopover-arrow',
  padding: 'padding-0',
  ...props.ui
}))
</script>

<style lang="scss" scoped>
.popup-headless {
  position: relative;

  .popover-panel {
    position: absolute;
    top: 100%;
    right: 0;
    z-index: 9999;

    background: var(--c-surface);
    border-radius: 10px;
    padding: 10px;
  }
}

.r-wrapper-popover ::v-deep {
  // nuxtui
  .btn-leading {
    width: 100% !important;
    height:  100% !important;
    font-size: 13px;
    cursor: pointer;
  }

  .dialog {
    background: var(--bg-wrapper);
    padding: 10px;
    border-radius: 10px;
  }

  //flowbiy 
  .popup-flowbite {
    width: 100%;
    .absolute {
      width: fit-content;
      background: var(--bg-wrapper) !important;
      border-radius: 10px;
      padding: 10px;
      animation: ani_show 0.25s ease-in-out;
      transform: translateY(0px);

      @keyframes ani_show {
        from {
          transform: translateY(6px);
          opacity: 0;
        }

        to {
          transform: translateY(0px);
          opacity: 1;
        }
      }

    }
  }

  //headless
  .popup-headless {
    button {
      outline: none;
    }

    .absolute {
      right: 14px;
      background: var(--bg-wrapper);
      border-radius: 10px;
      padding: 10px;
      animation: ani_show 0.25s ease-in-out;
      transform: translateY(0px);

      @keyframes ani_show {
        from {
          transform: translateY(6px);
          opacity: 0;
        }

        to {
          transform: translateY(0px);
          opacity: 1;
        }
      }
    }
  }
}
</style>

<style lang="scss">
.ui-rpopover-arrow{
  background: var(--bg-wrapper);
  padding: 20px;
}
.ui-rpopover-content{
  background: var(--bg-wrapper);
  padding: 10px;
  border-radius: 10px;
  overflow: hidden !important;
}
// style="--tw-ring-offset-color: var(--color-w-b-1); --tw-ring-color: var(--color-w-b-1);"
</style>