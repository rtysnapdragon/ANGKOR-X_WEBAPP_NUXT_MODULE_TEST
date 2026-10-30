<template>
  <USlideover v-model:open="isOpen" :side="sliderScreenMode" :ui="ui" :transition="transition" :overlay="overlay"
    :dismissible="dismissible" :prevent-close="preventClose" :appear="appear"
    :close="{
      icon: 'ri-close-line',
      color: 'neutral',
      variant: 'ghost'
    }"
    :class="['r-slider-container', `r-slider-${sliderScreenMode}-mobile`]"
    >
      <template #header>
        <div class="r-slider-header flex items-center justify-between w-full">
          <slot name="header">
            <div>
              <div class="flex items-center gap-2">
                <div v-if="icon" v-html="`<i class='${icon} text-[16px]'></i>`"></div>
                <h3 v-if="title" class="text-base font-semibold" > {{ title }} </h3>
              </div>
              <p v-if="description" class="text-sm text-muted" > {{ description }} </p>
            </div>
            <i class="ri-close-line text-[16px] cursor-pointer" @click="closed"></i>
          </slot>
        </div>
      </template>
      
      <template #body>
        <div ref="refRDrawerBody" class="r-slider-body "
          :class="hasScroll ? 'r-slider-has-scroll isScroll' : ''">
          <slot />
        </div>
      </template>

      <template #footer>
        <div v-if="$slots.footer" class="r-slider-footer flex justify-end gap-2 w-full">
          <slot name="footer">
            <!-- <RBtn
              icon="close"
              color="neutral"
              :label="$t('close')"
              @click="handleClose(false)"
            />

            <RBtn
              icon="save"
              color="primary"
              :label="$t('save')"
              @click="handleSubmit"
            /> -->
          </slot>
        </div>
      </template>
  </USlideover>
</template>

<script setup>
import { useScreenStore } from '../stores/screen'

const screen = useScreenStore()
const isOpen = defineModel();
const props = defineProps([
  "title",
  "description",
  "icon",
  "ui",
  "transition",
  "overlay",
  "preventClose",
  "side",
  "appear",
  "isScroll",
  "class",
  "dismissible",
  "closeIcon",
  "transition",
]);
const emit = defineEmits(["closed"]);

const title = computed(() => props.title)
const description = computed(() => props.description)
const icon = computed(() => props.icon)
const transition = computed(() => props.transition);
const overlay = computed(() => props.overlay);
const preventClose = computed(() => props.preventClose);
const side = computed(() => props.side);
const appear = computed(() => props.appear);
const dismissible = computed(() => props.dismissible);
const isScroll = computed(() => props.isScroll);

const refWrapperOCDrawer = ref();

const refRDrawerBody = ref();
const hasScroll = ref(false);

/* -----------------------------
   UI Helpers
----------------------------- */
console.log("Screen mobile =========> ", screen.isMobile)

const sliderScreenMode = computed(() => {
  return screen.isMobile ? 'bottom' : side.value
})

const ui = computed(() => {
  const defaultUI = {
    // content: 'r-slider-content',
    content: [
      'r-slider-content',
      {
        'max-w-full rounded-t-xl': screen.isMobile
      }
    ],
    header:[
      'r-slider-header',
      {
        'flex items-center justify-between w-full': screen.isMobile
      }
    ],
    wrapper: `r-wrapper-container relative flex-1 flex flex-col w-full focus:outline-none ${props.class}`,
    overlay:'',
    body: 'r-slider-body',
    footer:{
      class:'w-full'
    }
    // width: `w-full max-w-md max-w-sm ${props.class}`,
  }
  const resultUI = {
    ...defaultUI,
    ...props.ui,

    transition: {
      ...defaultUI.transition,
      ...props.ui?.transition,
    },
    translate: {
      ...defaultUI.translate,
      ...props.ui?.translate,
    },
    overlay: {
      ...defaultUI.overlay,
      ...props.ui?.overlay,
      transition: {
        ...defaultUI.overlay.transition,
        ...props.ui?.overlay?.transition,
      },
    },
  };

  return resultUI;
});

onMounted(async () => {
  await nextTick(); // Ensure DOM is fully rendered
  observeBody(); // Initial check
});

onUnmounted(() => {
  window.removeEventListener('resize', checkScroll);
});


watch(() => isOpen.value, (n) => {
  // console.log('====>>> watch', n)
  if (n) {
    setTimeout(() => {
      observeBody(); // Initial check
    }, 100);

  } else {
    window.removeEventListener('resize', checkScroll);
  }
})

function observeBody() {
  if (!refRDrawerBody.value) return;
  checkScroll()
  window.addEventListener('resize', checkScroll);
}


function checkScroll() {
  const wrapper = refWrapperOCDrawer.value;
  const body = refRDrawerBody.value;

  if (!wrapper || !body) return;

  const header = wrapper.querySelector('.r-drawer-header');
  const footer = wrapper.querySelector('.r-drawer-footer');

  const headerHeight = header?.getBoundingClientRect().height || 0;
  const footerHeight = footer?.getBoundingClientRect().height || 0;
  const bodyHeight = body.getBoundingClientRect().height;

  const availableHeight = window.innerHeight - headerHeight - footerHeight;

  hasScroll.value = bodyHeight > availableHeight || bodyHeight > 400;
  console.log('===>>>', hasScroll.value)
}

function closed() {
  isOpen.value = false;
  emit("closed");
}
</script>

<style lang="scss" scoped>
:deep(.r-slider-content) {
  background-color: var(--bg-wrapper);
  color: var(--c-text);
  width: 100%;
  min-width: v-bind("width ? `${width}px` : '400px'");
  max-width: 500px !important;
  --ui-radius: var(--r-xl);

  --ui-backdrop-filter: blur(8px);

  .r-slider-header {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 4px;
    min-height: 100px;
    // padding: 5px 15px;
    font-size: 14px;
    font-family: var(--font-500);
    width: 100%;
  }
  
  .r-slider-footer {
    display: flex;
    align-items: center;
    justify-content: end;
    // padding: 5px 15px !important;
    grid-gap: 6px;
  }
}

:deep(.r-slider-content){ //work all if no scoped
  &[data-slot="body"],&[data-slot="header"],&[data-slot="footer"]{
    padding: 0;
  }

  &[data-slot="body"]{
    .hasScroll{
      padding:40px;
    }
  }
}

:deep(.r-wrapper-container){
   max-width: 100%;
  &.r-slider-bottom-mobile{
    max-width: 100% !important;
    padding: 7px !important;
    border-radius: 20px 20px 0px 0px !important;
    min-height: 500px;
  }

}

:deep(.r-slider-body) {
  // overflow-y: auto !important;
  // overflow-x: hidden !important;
  // min-height: calc(100vh - 80px); // cause style padding body
  height: 100% !important;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
  padding: 0 !important;
  // padding:5px 15px ;
  &.isScroll {
    // this class add auto
    overflow-y: auto;
    &::-webkit-scrollbar-thumb {
      border: 1px solid var(--bg-content);
    }
    &:hover::-webkit-scrollbar-thumb {
      background-color: var(--color-w-b-3) !important;
    }
    &::-webkit-scrollbar-thumb:hover {
      background-color: var(--color-w-b-2) !important;
    }
  }
  &.r-slider-has-scroll {
    padding-right: 0 !important; // reduced from 15px
    overflow-y: auto;
  }
}

:deep([data-slot="body"]){
  padding: 0 !important;
}

.r-drawer-overlay {
  background: var(--bg-wrapper-50) !important;
}


:deep([data-slot="body"]) {
  padding: 0 !important;
}

:deep(.r-slider-content[data-slot="header"]) {
  padding: 0 !important;
}

:deep(.r-slider-content[data-slot="footer"]) {
  padding: 0 !important;
}

// .r-slider-bottom-mobile {
//   max-width: 100% !important;
//   padding: 7px !important;
//   border-radius: 20px 20px 0px 0px !important;
//   min-height: 500px;
// }
:deep(.r-slider-bottom-mobile) {
  max-width: 100% !important;
  padding: 7px !important;
  border-radius: 20px 20px 0px 0px !important;
  min-height: 500px;
}

:deep([data-slot="content"]) {
  background-color: var(--bg-wrapper);
  color: var(--c-text);
  max-width: 500px !important;
  border-radius: var(--r-xl);
}

:deep([data-slot="header"]) {
  padding: 0 !important;
  min-height: 100px;
}

:deep([data-slot="body"]) {
  padding: 0 !important;
  overflow-y: auto;
}

:deep([data-slot="footer"]) {
  padding: 0 !important;
}

</style>
