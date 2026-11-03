<template>
  <UModal
    v-model:open="isOpen"
    :ui="ui"
    :transition="transition"
    :overlay="overlay"
    :prevent-close="preventClose"
    :noClose="noClose"
    :appear="appear"
    :fullscreen="fullscreen"
    v-if="!forTable"
  >
    <div class="oc-modal-header" v-if="$slots.header">
      <div class="title">
        <slot name="header" />
      </div>
      <div
        :class="['btn-close', noClose ? '!hidden' : '']"
        @click="
          () => {
            onCloseModal();
          }
        "
      >
        <i class="ri-close-large-fill"></i>
      </div>
       <slot name="headerCenter" /> 
      <slot name="headerRight" />
    </div>
    <div class="sub-title" v-if="$slots.subTitle">
      <slot name="subTitle"></slot>
    </div>

    <div
      class="oc-modal-body min-h-full"
      ref="ref_body_h"
      :class="[
        body_h > content_h - 133 ? 'isScroll' : '',
        props.height,
        overflowAuto ? 'overflow-auto' : '',
      ]"
    >
      <slot />
    </div>

    <div class="oc-modal-footer" v-if="$slots.footer">
      <slot name="footer" />
    </div>
  </UModal>
  <Teleport to="body" v-else>
    <div
      class="ocs-wrapper-modal"
      :class="isOpen ? 'modal-ani-show' : ''"
      v-show="isOpen"
    >
      <div class="overlay" @click.self="fnOverlayClose()">
        <div class="ocs-modal" :class="props.height">
          <div class="oc-modal-header" v-if="$slots.header">
            <div class="title">
              <slot name="header" />
            </div>
            <div
              :class="['btn-close', noClose ? '!hidden' : '']"
              @click="isOpen = false"
            >
              <i class="ri-close-large-fill"></i>
            </div>
          </div>

          <div class="oc-modal-body" ref="ref_body_h">
            <slot />
          </div>

          <div class="oc-modal-footer" v-if="$slots.footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
const isOpen = defineModel();
const props = defineProps([
  "ui",
  "transition",
  "overlay",
  "preventClose",
  "fullscreen",
  "appear",
  "width",
  "height",
  "forTable",
  "noClose",
  "overflowAuto",
]);
const forTable = computed(() => props.forTable ?? false);
const emit = defineEmits(["onClose"]);

const ui = computed(() => {
  const defaultUI = {
    wrapper: "relative z-50",
    // inner: "fixed inset-0 overflow-y-auto oc-modal-container",
    inner: "fixed inset-0 oc-modal-container",
    container:
      "flex min-h-full items-center sm:items-center justify-center text-center",
    padding: "p-0 sm:p-0",
    overlay: {
      base: "fixed inset-0 transition-opacity",
      background: "bg-overlay",
    },
    base: "relative text-left rtl:text-right flex flex-col oc-modal ref_content_h", // this class "ref_content_h" use in table for calculate scroll also
    background: "color-bg-content",
    margin: "sm:my-0",
    ring: "",
    rounded: "ocs-modal-rounded",
    shadow: "shadow-none",
    width: "w-full",
    height:
      "sm:max-h-[calc(100vh-2.5rem)] max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)]",
    fullscreen: "w-screen h-screen",
  };

  const resultUI = {
    ...defaultUI,
    ...props.ui,

    transition: {
      ...defaultUI.transition,
      ...props.ui?.transition,
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
const transition = computed(() => props.transition);
const overlay = computed(() => props.overlay);
const preventClose = computed(() => props.preventClose);
const fullscreen = computed(() => props.fullscreen);
const appear = computed(() => props.appear);
const noClose = computed(() => props.noClose);
const overflowAuto = computed(() => props.overflowAuto ?? true);

onMounted(async () => {
  await getAllHeight();
});
const content_h = ref();

const ref_body_h = ref();
const body_h = ref();

async function getAllHeight() {
  setTimeout(() => {
    let content_h_c = document.getElementsByClassName("ref_content_h");
    if (content_h_c.length > 0) content_h.value = content_h_c[0].offsetHeight;
    body_h.value = ref_body_h.value?.offsetHeight;
  }, 100);
}
function fnOverlayClose() {
  if (props.preventClose || props.preventClose == "") return;
  isOpen.value = false;
}
const onCloseModal = () => {
  isOpen.value = false;
  emit("onClose");
};
</script>

<style lang="scss" scoped>
.ocs-modal-rounded {
  border-radius: 14px !important;
}

.ocs-wrapper-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 100000;

  .overlay {
    width: 100%;
    height: 100%;
    background: #0000004e;
    padding: 60px;
    display: flex;
    justify-content: center;
    align-items: center;

    .oc-modals {
      position: relative;
      display: flex;
      flex-direction: column;
      background: var(--bg-content);
      width: 100%;
      box-sizing: border-box;
      border-radius: 14px;
    }
  }

  &.modal-ani-show {
    .overlay {
      animation: show_overlay 0.25s ease-in-out;
      opacity: 1;

      @keyframes show_overlay {
        from {
          opacity: 0;
        }

        to {
          opacity: 1;
        }
      }

      .oc-modal {
        animation: show_modal 0.25s ease-in-out;
        opacity: 1;
        transform: scale(1);

        @keyframes show_modal {
          from {
            opacity: 0;
            transform: scale(0.9);
          }

          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      }
    }
  }
}

.oc-modal-header {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 4px;
  height: 60px;
  min-height: 60px;
  padding: 0 20px;
  letter-spacing: 0px;
  user-select: none;

  .title {
    font-size: 14px;
    line-height: 14px;
    font-family: var(--font-500);
    letter-spacing: 0px;
    color: var(--color-w-b-1);
  }

  .btn-close {
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-w-b-1);
    cursor: pointer;
    margin-right: -8px;

    i {
      font-size: 13px;
      line-height: 13px;
      pointer-events: none;
    }
  }
}

.sub-title {
  padding: 0px 20px 12px 20px;
  margin-top: -14px;
  font-size: 12px;
  line-height: 12px;
  font-family: var(--font-400);
  color: var(--color-w-b-2);
}

.oc-modal-body {
  display: flex;
  flex-direction: column;
  max-height: 100%;
  padding: 0px 20px 0px 20px;
  &.is-padding-bottom{
    margin-bottom: 20px;
  }

  &.isScroll {
    overflow-y: auto;

    &::-webkit-scrollbar-thumb {
      border: 3px solid var(--bg-content);
    }
  }
}

.oc-modal-footer {
  display: flex;
  align-items: center;
  justify-content: end;
  grid-gap: 6px;
  padding: 20px 20px 20px 20px;
}
// .sm\:max-w-lg {
//     max-width: 80% !important;
// }
</style>
