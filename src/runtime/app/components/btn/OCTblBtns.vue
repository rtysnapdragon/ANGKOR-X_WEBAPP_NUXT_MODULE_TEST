<template>
  <div>
    <div class="group-btn-icons">
      <RTooltip :is-popper="true" v-if="actionsDefault.length > 0" v-for="action in copyWith(actionsDefault)"
        :text="action?.label" :is-global="action?.disabled" :placement="action?.placement">
        <button v-if="
          showIfAllowed(
            action?.showIfAllowed,
            dataMenu.getActionPermission(action?.permission)
          )
        " class="ocs-btn-icon relative" @click="
          click(action?.type, action?.permission, action?.label, action)
          " :class="[
            action?.isRotate ? `rotateButton` : ``,
            typeof action?.color === 'string' ? action.color.toLowerCase() : '',
            action?.disabled ? 'disabled' : '',
            action?.fill ? 'fill' : '',
          ]" type="button">
          <div class="icon tooltip">
            <i :class="generateIcon(action?.icon)"></i>
          </div>
        </button>
      </RTooltip>


      <fwb-dropdown placement="left" class="popup-wrapper z-50" v-if="actionsMore.length > 0" :close-inside="close">
        <template #trigger>
          <button class="ocs-btn-icon more" @click="clickShow">
            <div class="icon"><i class="ri-more-2-fill"></i></div>
          </button>
        </template>

        <!-- <FwbListGroup class="dialog-group-actions z-50" :class="showTop" ref="popupElement">
          <div class="item-action" v-for="action in copyWith(actionsMore)" v-if="
            showIfAllowed(
              action?.showIfAllowed,
              dataMenu.getActionPermission(action?.permission)
            )
          " @click="
            click(action?.type, action?.permission, action?.label, action)
            " :class="`${action?.color?.toLowerCase()} ${action?.disabled || action?.loading ? 'disabled' : ''
              }`">
            <div class="icon" :class="action?.color?.toLowerCase()">
              <div class="loader" v-if="action?.loading"></div>
              <i :class="generateIcon(action?.icon)" v-else></i>
            </div>
            <div class="btn-label">{{ action?.label }}</div>
          </div>
        </FwbListGroup> -->

        <FwbListGroup class="dialog-group-actions z-50" :class="showTop" ref="popupElement">
          <FwbListGroupItem v-for="(action, idx) in copyWith(actionsMore)" :key="idx" v-if="showIfAllowed(
            action?.showIfAllowed,
            dataMenu.getActionPermission(action?.permission)
          )" class="item-action" @click="click(action?.type, action?.permission, action?.label, action)"
            :class="`${action?.color?.toLowerCase()} ${action?.disabled || action?.loading ? 'disabled' : ''}`">
            <div class="icon" :class="action?.color?.toLowerCase()">
              <div class="loader" v-if="action?.loading"></div>
              <i :class="generateIcon(action?.icon)" v-else></i>
            </div>
            <div class="btn-label">{{ action?.label }}</div>
          </FwbListGroupItem>
        </FwbListGroup>
      </fwb-dropdown>
    </div>
  </div>
</template>

<script setup>
import { FwbDropdown, FwbListGroup, FwbListGroupItem } from "flowbite-vue";
const props = defineProps(["items", "closeInside"]);
const close = computed(() => props.closeInside);
const dataMenu = useMenuStore();
const toast = useToastStore();
const model = computed(() => {
  return props.items;
});
const emit = defineEmits(["actionClick"]);
function showIfAllowed(ifAllow = true, per) {
  return per == 1 || ifAllow;
}

function generateIcon(icon) {
  let classIcon = icon;
  if (icon?.toLowerCase() == "add") classIcon = "ri-add-circle-line";
  if (icon?.toLowerCase() == "view") classIcon = "ri-eye-line";
  if (icon?.toLowerCase() == "edit") classIcon = "ri-pencil-line";
  if (icon?.toLowerCase() == "delete") classIcon = "ri-delete-bin-3-line";
  if (icon?.toLowerCase() == "approve") classIcon = "ri-checkbox-circle-line";
  if (icon?.toLowerCase() == "setting") classIcon = "ri-settings-4-line";
  if (icon?.toLowerCase() == "print") classIcon = "ri-printer-line";
  if (icon?.toLowerCase() == "more") classIcon = "ri-more-2-fill";
  if (icon?.toLowerCase() == "review") classIcon = "ri-file-search-line";
  if (icon?.toLowerCase() == "release") classIcon = "ri-corner-up-right-line";
  if (icon?.toLowerCase() == "clone" || icon?.toLowerCase() == "copy")
    classIcon = "ri-file-copy-line";
  if (icon?.toLowerCase() == "unuser") classIcon = "ri-user-unfollow-fill";
  if (icon?.toLowerCase() == "chat") classIcon = "ri-chat-3-line";
  if (icon?.toLowerCase() == "adduser") classIcon = "ri-user-add-fill";
  if (icon?.toLowerCase() == "send") classIcon = "ri-telegram-2-fill";
  if (icon?.toLowerCase() == "run") classIcon = "ri-play-line";
  if (icon?.toLowerCase() == "phone") classIcon = "ri-phone-fill";
  if (icon?.toLowerCase() == "split") classIcon = "ri-file-reduce-line";
  if (icon?.toLowerCase() == "merge") classIcon = "ri-merge-cells-horizontal";
  if (icon?.toLowerCase() == "change") classIcon = "ri-exchange-2-line";
  if (icon?.toLowerCase() == "folder") classIcon = "ri-folder-2-line";
  if (icon?.toLowerCase() == "void") classIcon = "ri-file-close-line";
  if (icon?.toLowerCase() == "return") classIcon = "ri-arrow-go-back-line";
  if (icon?.toLowerCase() == 'message') classIcon = 'ri-message-3-line'
  return classIcon;
}

const actionsDefault = computed(() => {
  if (widthScreen.value <= 768) return [];
  else return model.value.length >= 4 ? model.value.slice(0, 2) : model.value;
});

const actionsMore = computed(() => {
  if (widthScreen.value <= 768)
    return model.value.length > 0 ? model.value : [];
  else return model.value.length >= 4 ? model.value.slice(2) : [];
});
function click(e, per, label, action) {
  if (dataMenu.getActionPermission(per) == 1) {
    emit("actionClick", e, action);
  } else {
    toast.add({
      title: `You don't have permission to ${label}.`,
      description: `Contact to administrator for permission.`,
      duration: 5000,
      type: "warning",
    });
  }
}

const showTop = ref("bottom");
const popupElement = ref(null);
let widthScreen = ref(window.innerWidth);

// Function to update the widthScreen value based on the current window width
const updateWidth = () => {
  // Function to update widthScreen on window resize
  widthScreen.value = window.innerWidth;
};
onMounted(() => {
  window.addEventListener("resize", updateWidth);
  const d_scroll = document.getElementsByClassName("dt-scroll-body");
  if (d_scroll.length > 0) d_scroll[0].addEventListener("scroll", runOnScroll);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateWidth);
});
function clickShow(event) {
  let t = getCurrentTop(event.target);
  let d_dt_scroll = document.getElementsByClassName("dt-scroll");
  if (d_dt_scroll.length > 0) {
    let h = d_dt_scroll[0].clientHeight - 40;
    showTop.value =
      t >= h - getHeightPopup() && t >= getHeightPopup() ? "bottom" : "bottom"; //t >= h - getHeightPopup() && t >= getHeightPopup() ? "top" : "bottom";
  }
}
function getHeightPopup() {
  return actionsMore.value.length * 35 + 12;
}
let scrollTimeout;
let isScrolling;
function runOnScroll() {
  window.clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    isScrolling = setTimeout(() => {
      if (popupElement.value) {
        let t = getCurrentTop(popupElement.value);
        let d_dt_scroll = document.getElementsByClassName("dt-scroll");
        if (d_dt_scroll.length > 0) {
          let h = d_dt_scroll[0].clientHeight - 40;
          showTop.value =
            t >= h - getHeightPopup() && t >= getHeightPopup()
              ? "top"
              : "bottom";
        }
      }
    }, 100);
  });
}

function getCurrentTop(child) {
  let d_dt_scroll = document.getElementsByClassName("dt-scroll");
  if (d_dt_scroll.length > 0) {
    const parentRect = d_dt_scroll[0].getBoundingClientRect();
    const childRect = child.getBoundingClientRect();
    return childRect.top - parentRect.top;
  }
}
</script>

<style lang="scss" scoped>
.tooltip::before {
  // position: absolute;
  // width: fit-content;
  // background-color: var(--bg-content);
  // color: var(--color-w-b-1);
  // content: attr(data-title);
  // display: none;
  // font-size: 10px;
  // padding: 2px 5px;
  // top: 30px;
  // left: -20px;
  z-index: 9999999 !important;
  // box-shadow: 0px 6px 20px #00000018;
  // outline: none;
  // border-radius: 5px;
}

// .tooltip:hover::before {
//   display: block;
// }

.loader {
  width: 14px;
  height: 14px;
  border: 2px solid #ffffff4b;
  border-bottom-color: var(--bg-content);
  border-radius: 50%;
  display: inline-block;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.group-btn-icons {
  display: flex;
  justify-content: center;
  grid-gap: 4px;
}

.ocs-btn-icon-size {
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.ocs-btn-icon {
  width: 25px;
  height: 25px;
  border-radius: 7px;
  border: 1px solid var(--ocs-c-gray);
  color: var(--ocs-c-gray);
  display: flex;
  justify-content: center;
  align-items: center;
  transition: 0.3s ease-in-out;
  box-shadow: 0px 0px 0px;
  cursor: pointer;
  // &.disabled {
  //     opacity: 0.5;
  //     pointer-events: none;
  // }

  &.disabled {
    cursor: not-allowed;
    pointer-events: none;
    color: var(--color-w-b-4) !important;
    border: 1px solid var(--color-w-b-4) !important;
  }

  .icon {
    font-size: 13px;
    line-height: 13px;
  }

  &.change {
    border: 1px solid var(--ocs-c-blue);
    color: var(--ocs-c-blue);

    &.fill {
      background: var(--ocs-c-blue);
      color: #fff;
    }

    &:hover {
      background: var(--ocs-c-blue);
      color: #fff;
    }
  }

  &:hover {
    background: var(--ocs-c-gray);
    color: #fff;
  }

  &.return,
  &.add,
  &.view {
    border: 1px solid var(--ocs-c-nenoBlue);
    color: var(--ocs-c-nenoBlue);

    &.fill {
      background: var(--ocs-c-nenoBlue);
      color: #fff;
    }

    &:hover {
      background: var(--ocs-c-nenoBlue);
      color: #fff;
    }
  }

  &.edit {
    border: 1px solid var(--ocs-c-green);
    color: var(--ocs-c-green);

    &.fill {
      background: var(--ocs-c-green);
      color: #fff;
    }

    &:hover {
      background: var(--ocs-c-green);
      color: #fff;
    }
  }

  &.helper {
    border: 1px solid #a7a7a7;
    color: #a7a7a7;

    &.fill {
      background: #a7a7a7;
      color: #fff;
    }

    &:hover {
      background: #a7a7a7;
      color: #fff;
    }
  }

  &.void {
    border: 1px solid #e26666;
    color: var(--ocs-c-red);

    &.fill {
      background: #aa4b4b;
      color: #fff;
    }

    &:hover {
      background: #f39999;
      color: #fff;
    }
  }

  &.run {
    border: 1px solid var(--ocs-c-orangeRed);
    color: var(--ocs-c-orangeRed);

    &.fill {
      background: var(--ocs-c-orangeRed);
      color: #fff;
    }

    &:hover {
      background: var(--ocs-c-orangeRed);
      color: #fff;
    }
  }

  &.delete {
    border: 1px solid var(--ocs-c-red);
    color: var(--ocs-c-red);

    &.fill {
      background: var(--ocs-c-red);
      color: #fff;
    }

    &:hover {
      background: var(--ocs-c-red);
      color: #fff;
    }
  }

  &.approve {
    border: 1px solid var(--ocs-c-green);
    color: var(--ocs-c-green);

    &.fill {
      background: var(--ocs-c-green);
      color: #fff;
    }

    &:hover {
      background: var(--ocs-c-green);
      color: #fff;
    }
  }

  &.setting {
    border: 1px solid var(--ocs-c-purple);
    color: var(--ocs-c-purple);

    &.fill {
      background: var(--ocs-c-purple);
      color: #fff;
    }

    &:hover {
      background: var(--ocs-c-purple);
      color: #fff;
    }
  }

  &.print {
    border: 1px solid var(--ocs-c-orange);
    color: var(--ocs-c-orange);

    &.fill {
      background: var(--ocs-c-orange);
      color: #fff;
    }

    &:hover {
      background: var(--ocs-c-orange);
      color: #fff;
    }
  }

  &.more {
    border: 1px solid var(--color-w-b-3);
    color: var(--color-w-b-3);

    &:hover {
      background: var(--color-w-b-3);
      color: #fff;
    }
  }

  &.release {
    border: 1px solid var(--ocs-c-capture);
    color: var(--ocs-c-capture);

    &.fill {
      background: var(--ocs-c-capture);
      color: #fff;
    }

    &:hover {
      background: var(--ocs-c-capture);
      color: #fff;
    }
  }

  &.copy,
  &.clone {
    border: 1px solid var(--ocs-c-purple);
    color: var(--ocs-c-purple);

    &.fill {
      background: var(--ocs-c-purple);
      color: #fff;
    }

    &:hover {
      background: var(--ocs-c-purple);
      color: #fff;
    }
  }

  &.employee,
  &.folder {
    border: 1px solid #659277;
    color: #659277;

    &.fill {
      background: #659277;
      color: #fff;
    }

    &:hover {
      background: #659277;
      color: #fff;
    }
  }

  &.change-en {
    border: 1px solid #4395f1;
    color: #4395f1;

    &.fill {
      background: #4395f1;
      color: #fff;
    }

    &:hover {
      background: #4395f1;
      color: #fff;
    }
  }

  &.formula {
    border: 1px solid #9cba54;
    color: #9cba54;

    &.fill {
      background: #9cba54;
      color: #fff;
    }

    &:hover {
      background: #9cba54;
      color: #fff;
    }
  }

  &.resume {
    border: 1px solid #007aff;
    color: #007aff;

    &.fill {
      background: #007aff;
      color: #fff;
    }

    &:hover {
      background: #007aff;
      color: #fff;
    }
  }

  &.chat {
    border: 1px solid var(--ocs-c-orange);
    color: var(--ocs-c-orange);

    &.fill {
      background: var(--ocs-c-orange);
      color: #fff;
    }

    &:hover {
      background: var(--ocs-c-orange);
      color: #fff;
    }
  }

  &.split {
    border: 1px solid #db34a1;
    color: #db34a1;

    &.fill {
      background: #db34a1;
      color: #fff;
    }

    &:hover {
      background: #db34a1;
      color: #fff;
    }
  }

  &.merge {
    border: 1px solid #3455db;
    color: #3455db;

    &.fill {
      background: #3455db;
      color: #fff;
    }

    &:hover {
      background: #3455db;
      color: #fff;
    }
  }

  &.message {
    border: 1px solid #4caf50;
    color: #4caf50;

    &.fill {
      background: #4caf50;
      color: #fff;
    }

    &:hover {
      background: #4caf50;
      color: #fff;
    }
  }
}

.popup-wrapper {
  position: relative;
}

.rotateButton {
  transform: rotate(-180deg) !important;
}

.dialog-group-actions {
  position: absolute;
  z-index: 999 !important;
  right: -6px;
  padding: 8px 8px;
  background: var(--bg-wrapper);
  border-radius: 10px;
  box-shadow: 0px 6px 20px #0000002d;
  border: none;
  width: fit-content;

  &.top {
    bottom: -4px;
    top: unset;
    animation: ani-top 0.25s ease-in-out;
    transform: translateY(0px);
    opacity: 1;
  }

  @keyframes ani-top {
    from {
      transform: translateY(6px);
      opacity: 0;
    }

    to {
      transform: translateY(0px);
      opacity: 1;
    }
  }

  &.bottom {
    bottom: unset;
    top: 20px;
    animation: ani-bottom 0.25s ease-in-out;
    transform: translateY(0px);
    opacity: 1;
  }

  @keyframes ani-bottom {
    from {
      transform: translateY(-6px);
      opacity: 0;
    }

    to {
      transform: translateY(0px);
      opacity: 1;
    }
  }

  .item-action {
    height: 32px;
    padding: 0px 10px;
    display: flex;
    align-items: center;
    border-radius: 8px;
    transition: 0.15s ease-in-out;
    cursor: pointer;
    user-select: none;
    border: none;

    // &.disabled {
    //     opacity: 0.5;
    //     pointer-events: none;
    // }

    &.disabled {
      cursor: default;
      pointer-events: none;
      background: transparent !important;

      .icon {
        i {
          color: var(--color-w-b-4) !important;
        }
      }

      .btn-label {
        color: var(--color-w-b-4) !important;
      }
    }

    &:hover {
      background: var(--bg-content);
    }

    .icon {
      display: flex;
      width: 22px;
      font-size: 15px;
      line-height: 15px;

      &.return,
      &.add,
      &.view {
        color: var(--ocs-c-nenoBlue);
      }

      &.edit {
        color: var(--ocs-c-capture);
      }

      &.run {
        color: var(--ocs-c-orangeRed);
      }

      &.delete {
        color: var(--ocs-c-red);
      }

      &.approve {
        color: var(--ocs-c-green);
      }

      &.setting {
        color: var(--ocs-c-purple);
      }

      &.print {
        color: var(--ocs-c-orange);
      }

      &.more {
        color: var(--ocs-c-gray);
      }

      &.release {
        color: var(--ocs-c-capture);
      }

      &.copy,
      &.clone {
        color: var(--ocs-c-purple);
      }

      &.employee,
      &.folder {
        color: #659277;
      }

      &.formula {
        color: #9cba54;
      }

      &.change-en {
        color: #4395f1;
      }

      &.resume {
        color: #007aff;
      }

      &.chat {
        color: var(--ocs-c-orange);
      }

      &.split {
        color: #db34a1;
      }

      &.merge {
        color: #3455db;
      }

      &.helper {
        color: #a7a7a7;
      }

      &.void {
        color: #d14949;
      }

      &.message {
        color: #4caf50;
      }
    }

    .btn-label {
      font-size: 14px;
      font-family: var(--font-400);
      line-height: 14px;
      color: var(--color-w-b-2);
      white-space: nowrap;
    }
  }
}
</style>
