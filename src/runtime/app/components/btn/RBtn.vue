<template>
  <button v-if="showIfAllowed" :type="typeButton" class="r-btn-action" :class="[
    variant,
    type,
    size,
    noIcon,
    isIconRight,
    disabled || loading ? 'disabled' : '',
    color,
  ]" @click="actionClick">
    <!-- Icon section -->
    <!-- <slot :name="`${type}icon`">
      <div class="icon" v-if="!noIcon">
        <i v-if="!loading" :class="[icon]"></i>
        <div v-else class="loader"></div>
      </div>
    </slot> -->
    <!-- Icon -->
    <slot :name="`${type}icon`">
      <div v-if="!noIcon" class="icon">
        <div v-if="loading" class="loader" />

        <!-- RemixIcon class: ri-arrow-right-up-line -->
        <i
          v-else-if="iconType === 'remix-class'"
          :class="normalizedIcon"
          aria-hidden="true"
        />

        <!-- RemixIcon HTML: <i class="ri-arrow-right-up-line"></i> -->
        <span
          v-else-if="iconType === 'html'"
          v-html="normalizedIcon"
          aria-hidden="true"
        />

        <!-- Nuxt UI / Nuxt Icon -->
        <UIcon
          v-else-if="iconType === 'nuxt'"
          :name="normalizedIcon"
          aria-hidden="true"
        />
      </div>
    </slot>
    <!-- Slot -->
    <span v-if="$slots.default" class="r-btn__label">
      <slot />
    </span>
    <!-- Label section -->
    <div class="btn-label" :class="{ 'text-bold': isLabelBold }">
      {{ label }}
    </div>
  </button>
</template>
<script setup>
import { computed } from "vue";

const toast = useToast();
const emit = defineEmits(["click"]);
const props = defineProps([
  "variant",
  "type",
  "label",
  "icon",
  "isLabelBold",
  "size",
  "loading",
  "iconRight",
  "disabled",
  "noIcon",
  "isIconRight",
  "typeButton",
  "color",
  "permission",
  "showIfAllowed",
]);

const icon = computed(() => {
  if (!props.icon) return "";
  if (
    props.type?.toLowerCase() == "create" ||
    props.icon?.toLowerCase() == "create"
  )
    return "ri-add-circle-line";
  else if (
    props.type?.toLowerCase() == "view" ||
    props.icon?.toLowerCase() == "view"
  )
    return "ri-eye-line";
  else if (
    props.type?.toLowerCase() == "print" ||
    props.icon?.toLowerCase() == "print"
  )
    return "ri-printer-line";
  else if (
    props.type?.toLowerCase() == "upload" ||
    props.icon?.toLowerCase() == "upload"
  )
    return "ri-macbook-line";
  else if (
    props.type?.toLowerCase() == "camera" ||
    props.icon?.toLowerCase() == "camera"
  )
    return "ri-camera-3-line";
  else if (
    props.type?.toLowerCase() == "change" ||
    props.icon?.toLowerCase() == "change"
  )
    return "ri-exchange-2-line";
  else if (
    props.type?.toLowerCase() == "run" ||
    props.icon?.toLowerCase() == "run"
  )
    return "ri-play-line";
  else if (
    props.type?.toLowerCase() == "scan" ||
    props.icon?.toLowerCase() == "scan"
  )
    return "ri-qr-code-line";
  else if (
    props.type?.toLowerCase() == "void" ||
    props.icon?.toLowerCase() == "void"
  )
    return "ri-forbid-2-line";
  else if (
    props.type?.toLowerCase() == "void1" ||
    props.icon?.toLowerCase() == "void1"
  )
    return "ri-file-close-line";
  else if (
    props.type?.toLowerCase() == "delete" ||
    props.icon?.toLowerCase() == "delete"
  )
    return "ri-delete-bin-3-line";
  else if (
    props.type?.toLowerCase() == "approve" ||
    props.icon?.toLowerCase() == "approve"
  )
    return "ri-check-line";
  else if (
    props.type?.toLowerCase() == "release" ||
    props.icon?.toLowerCase() == "release"
  )
    return "ri-corner-up-right-line";
  else if (
    props.type?.toLowerCase() == "hold" ||
    props.icon?.toLowerCase() == "hold"
  )
    return "ri-hand";
  else if (
    props.type?.toLowerCase() == "close" ||
    props.icon?.toLowerCase() == "close"
  )
    return "ri-close-line";
  else if (
    props.type?.toLowerCase() == "share" ||
    props.icon?.toLowerCase() == "share"
  )
    return "ri-share-line";
  else if (
    props.type?.toLowerCase() == "setting" ||
    props.icon?.toLowerCase() == "setting"
  )
    return "ri-settings-4-line";
  else if (
    props.type?.toLowerCase() == "copy" ||
    props.icon?.toLowerCase() == "copy"
  )
    return "ri-file-copy-line";
  else if (
    props.type?.toLowerCase() == "cancel" ||
    props.icon?.toLowerCase() == "cancel"
  )
    return "ri-close-line";
  else if (
    props.type?.toLowerCase() == "apply" ||
    props.icon?.toLowerCase() == "apply"
  )
    return "ri-check-line";
  else if (
    props.type?.toLowerCase() == "update" ||
    props.icon?.toLowerCase() == "update"
  )
    return "ri-pencil-line";
  else if (
    props.type?.toLowerCase() == "edit" ||
    props.icon?.toLowerCase() == "edit"
  )
    return "ri-edit-box-line";
  else if (
    props.type?.toLowerCase() == "save" ||
    props.icon?.toLowerCase() == "save"
  )
    return "ri-save-3-line";
  else if (
    props.type?.toLowerCase() == "save-update" ||
    props.icon?.toLowerCase() == "save-update"
  )
    return "ri-check-line";
  else if (
    props.type?.toLowerCase() == "helper" ||
    props.icon?.toLowerCase() == "helper"
  )
    return "ri-customer-service-2-fill";
  else if (
    props.type?.toLowerCase() == "reset" ||
    props.icon?.toLowerCase() == "reset"
  )
    return "ri-refresh-line";
  else if (
    props.type?.toLowerCase() == "next" ||
    props.icon?.toLowerCase() == "next"
  )
    return "ri-arrow-right-s-line";
  else if (
    props.type?.toLowerCase() == "back" ||
    props.icon?.toLowerCase() == "back"
  )
    return "ri-arrow-left-s-line";
  else if (
    props.type?.toLowerCase() == "send" ||
    props.icon?.toLowerCase() == "send"
  )
    return "ri-send-plane-line";
  else if (
    props.type?.toLowerCase() == "email" ||
    props.icon?.toLowerCase() == "email"
  )
    return "ri-mail-line";
  else if (
    props.type?.toLowerCase() == "key" ||
    props.icon?.toLowerCase() == "key"
  )
    return "ri-key-2-line";
  else if (
    props.type?.toLowerCase() == "phone" ||
    props.icon?.toLowerCase() == "phone"
  )
    return "ri-phone-line";
  else if (
    props.type?.toLowerCase() == "draft" ||
    props.icon?.toLowerCase() == "draft"
  )
    return "ri-draft-line";
  else if (
    props.type?.toLowerCase() == "review" ||
    props.icon?.toLowerCase() == "review"
  )
    return "ri-file-search-line";
  else if (
    props.type?.toLowerCase() == "addStudent" ||
    props.icon?.toLowerCase() == "addStudent"
  )
    return "ri-user-add-line";
  else if (
    props.type?.toLowerCase() == "deposit" ||
    props.icon?.toLowerCase() == "deposit"
  )
    return "fi fi-rr-disk";
  else if (
    props.type?.toLowerCase() == "withdraw" ||
    props.icon?.toLowerCase() == "withdraw"
  )
    return "fi fi-rr-disk";
  else if (
    props.type?.toLowerCase() == "return" ||
    props.icon?.toLowerCase() == "return"
  )
    return "ri-arrow-go-back-line";
  else if (
    props.type?.toLowerCase() == "cash" ||
    props.icon?.toLowerCase() == "cash"
  )
    return "ri-cash-line";
  else if (
    props.type?.toLowerCase() == "closeModal" ||
    props.icon?.toLowerCase() == "closeModal"
  )
    return "ri-close-line";
  else if (
    props.type?.toLowerCase() == "next" ||
    props.icon?.toLowerCase() == "next"
  )
    return "ri-arrow-right-s-line";
  else if (
    props.type?.toLowerCase() == "previous" ||
    props.icon?.toLowerCase() == "previous"
  )
    return "ri-arrow-left-s-line";
  else if (
    props.type?.toLowerCase() == "import" ||
    props.icon?.toLowerCase() == "import"
  )
    return "ri-upload-2-line";
  else if (
    props.type?.toLowerCase() == "export" ||
    props.icon?.toLowerCase() == "export"
  )
    return "ri-download-2-line";
  else if (
    props.type?.toLowerCase() == "add" ||
    props.icon?.toLowerCase() == "add"
  )
    return "ri-add-line";
  else if (
    props.type?.toLowerCase() == "key" ||
    props.icon?.toLowerCase() == "key"
  )
    return "ri-key-2-line";
  else return props.icon;
});

// Add more
const iconType = computed(() => {
  const value = icon.value?.trim();

  if (!value) return "none";

  // HTML markup, such as <i class="ri-arrow-right-up-line"></i>
  if (value.startsWith("<")) return "html";

  // RemixIcon CSS class
  if (value.startsWith("ri-") || value.startsWith("fi ")) {
    return "remix-class";
  }

  // Nuxt UI / Nuxt Icon name
  return "nuxt";
});

// Add more
const normalizedIcon = computed(() => {
  const value = icon.value?.trim();

  if (iconType.value !== "html") return value;

  // Restrict raw HTML to an icon-only element with a class attribute.
  // For arbitrary custom markup, prefer a component slot instead.
  const match = value.match(
    /^<i\s+class=["']([^"'<>]+)["']\s*><\/i>$/
  );

  return match ? match[1] : "";
});


const typeButton = computed(() => props.typeButton ?? "button");
const variant = computed(() => props.variant ?? "solid");
const type = computed(() => props.type ?? "");
const size = computed(() => props.size ?? "");
const noIcon = computed(() => (isNotEmpty(props.noIcon) ? "noIcon" : ""));
const isIconRight = computed(() =>
  isNotEmpty(props.isIconRight) ? "isIconRight" : ""
);
const disabled = computed(() => props.disabled);
const loading = computed(() => props.loading);
const label = computed(() => props.label);
const permission = computed(() => props.permission);
const dataMenu = useMenuStore();
const per = dataMenu.getActionPermission(permission.value);
const showIfAllowed = computed(() => per == 1 || (props.showIfAllowed ?? true));
function actionClick(e) {
  if (per == 1) {
    emit("click",e);
  } else {
    toast.add({
      color: "yellow",
      title: `You don't have permission to ${label.value}.`,
      description: "Contact to administrator for permission.",
    });
    return;
  }
}
</script>

<style scoped lang="scss">
.r-btn-action {
  // &:focus-visible {
  //   outline: 1px solid var(--color-primary); 
  // }
  display: flex;
  align-items: center;
  height: 36px;
  border-radius: 10px;
  padding: 0px 14px 0px 13px;
  grid-gap: 4px;
  font-size: 14px;
  color: #fff;
  font-family: var(--font-400);
  user-select: none;
  transition: 0.25s all ease-in-out;
  letter-spacing: 0px;
  cursor: pointer;
  outline: none;

  &.disabled {
    cursor: not-allowed;
    // opacity: 0.2;
    pointer-events: none !important;
    color: var(--color-w-b-3) !important;
    // background: var(--r-b-disabled) !important;
    background: var(--color-w-b-4) !important;
  }

  // &.disabled {
  //     pointer-events: none;
  //     opacity: 0.6;
  // }

  &.noIcon {
    padding: 0px 14px 0px 16px;
  }

  &.isIconRight {
    flex-direction: row-reverse;
    padding: 0px 10px 0px 16px;
    grid-gap: 2px;
  }

  .icon {
    display: flex;
    align-items: center;

    i {
      font-size: 14px;
      line-height: 14px;
    }
  }

  .loader {
    width: 14px;
    height: 14px;
    border: 2px solid #ffffff4b;
    border-bottom-color: var(--bg-bg);
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

  .btn-label {
    font-size: 12px;
    line-height: 12px;
    font-family: var(--font-400);
    white-space: nowrap;

    &.text-bold {
      font-family: var(--font-500);
    }
  }

  &.s {
    height: 33px !important;
    padding: 0px 12px 0px 10px;
    border-radius: 9px;
  }

  &.xs {
    height: 30px !important;
    padding: 0px 10px 0px 12px !important;
    border-radius: 8px !important;

    &.btn-label {
      font-size: 12px !important;
      line-height: 12px !important;
    }
  }

  &.noIcon {
    padding: 0px 14px 0px 16px;
  }

  &.rightIcon {
    padding: 0px 8px 0px 16px;
  }

  &:hover {
    opacity: 0.8;
  }

  &:active {
    opacity: 1;
  }
}

.solid {
  &.create,
  &.add,
  &.apply,
  &.next,
  &.cash,
  &.view,
  &.import,
  &.export,
  &.send {
    background: var(--r-c-nenoBlue);
  }

  &.dark-green {
    background: var(--r-c-dark-green);
  }

  &.print,
  &.deposit {
    background: var(--r-c-orange);
  }

  &.change {
    background: var(--r-c-blue);
  }

  &.run {
    background: var(--r-c-orangeRed);
  }

  &.scan,
  &.cancel,
  &.back {
    background: var(--color-w-b-3) !important;
    color: var(--color-w-b-4) !important;

    i {
      color: var(--color-w-b-4) !important;
    }
  }

  &.hold {
    background: var(--color-w-b-3);
  }

  &.approve,
  &.update,
  &.edit,
  &.save,
  &.save-update {
    background: var(--r-c-green);
  }

  &.setting,
  &.copy,
  &.key {
    background: var(--r-c-purple);
  }

  &.email {
    background: var(--r-c-orangeRed);
  }

  &.phone,
  &.release {
    background: var(--r-c-capture);
  }

  &.void,
  &.delete,
  &.withdraw {
    background: var(--r-c-red);
  }

  &.return,
  &.share {
    background: var(--r-c-blue);
  }

  &.reset {
    background: var(--r-c-purpleBlack);
  }

  &.helper {
    background: #a7a7a7;
  }
}

.outline {
  background: none;

  &.dark-green {
    border: 1px solid var(--r-c-dark-green);
    color: var(--r-c-dark-green);

    .loader {
      border: 2px solid var(--color-w-b-6);
      border-bottom-color: var(--r-c-dark-green);
    }

    &:hover {
      background: var(--r-c-dark-green);
      color: #fff;
    }
  }

  &.create,
  &.add,
  &.apply,
  &.next,
  &.cash,
  &.import,
  &.export,
  &.send {
    border: 1px solid var(--r-c-nenoBlue);
    color: var(--r-c-nenoBlue);

    .loader {
      border: 2px solid var(--color-w-b-6);
      border-bottom-color: var(--r-c-nenoBlue);
    }

    &:hover {
      background: var(--r-c-nenoBlue);
      color: #fff;
    }
  }

  &.scan,
  &.cancel,
  &.back {
    border: 1px solid var(--color-w-b-4) !important;
    color: var(--color-w-b-1) !important;

    .loader {
      border: 2px solid var(--color-w-b-6);
      border-bottom-color: var(--r-c-gray);
    }

    &:hover {
      background: var(--color-w-b-4);
      color: #fff;
    }
  }

  &.hold {
    border: 1px solid var(--r-c-gray);
    color: var(--r-c-gray);

    .loader {
      border: 2px solid var(--color-w-b-6);
      border-bottom-color: var(--r-c-gray);
    }

    &:hover {
      background: var(--r-c-gray);
      color: #fff;
    }
  }

  &.void,
  &.delete {
    border: 1px solid var(--r-c-red);
    color: var(--r-c-red);

    .loader {
      border: 2px solid var(--color-w-b-6);
      border-bottom-color: var(--r-c-red);
    }

    &:hover {
      background: var(--r-c-red);
      color: #fff;
    }
  }

  &.approve,
  &.update,
  &.save,
  &.edit,
  &.save-update {
    border: 1px solid var(--r-c-green);
    color: var(--c-text);

    .loader {
      border: 2px solid var(--color-w-b-6);
      border-bottom-color: var(--r-c-green);
    }

    &:hover {
      background: var(--r-c-green);
      color: #fff;
    }
  }

  &.setting,
  &.copy,
  &.key {
    border: 1px solid var(--r-c-purple);
    color: var(--r-c-purple);

    .loader {
      border: 2px solid var(--color-w-b-6);
      border-bottom-color: var(--r-c-purple);
    }

    &:hover {
      background: var(--r-c-purple);
      color: #fff;
    }
  }

  &.review,
  &.view,
  &.email {
    border: 1px solid var(--r-c-orangeRed);
    color: var(--r-c-orangeRed);

    .loader {
      border: 2px solid var(--color-w-b-6);
      border-bottom-color: var(--r-c-orangeRed);
    }

    &:hover {
      background: var(--r-c-orangeRed);
      color: #ffffff;
    }
  }

  &.phone,
  &.release {
    border: 1px solid var(--r-c-capture);
    color: var(--r-c-capture);

    .loader {
      border: 2px solid var(--color-w-b-6);
      border-bottom-color: var(--r-c-capture);
    }

    &:hover {
      background: var(--r-c-capture);
      color: #ffffff;
    }
  }

  &.print {
    border: 1px solid var(--r-c-orange);
    color: var(--r-c-orange);

    .loader {
      border: 2px solid var(--color-w-b-6);
      border-bottom-color: var(--r-c-orange);
    }

    &:hover {
      background: var(--r-c-orange);
      color: #fff;
    }
  }

  &.change {
    border: 1px solid var(--r-c-orangeRed);
    color: var(--r-c-orangeRed);

    .loader {
      border: 2px solid var(--color-w-b-6);
      border-bottom-color: var(--r-c-orangeRed);
    }

    &:hover {
      background: var(--r-c-orangeRed);
      color: #fff;
    }
  }

  &.run {
    border: 1px solid var(--r-c-blue);
    color: var(--r-c-blue);

    .loader {
      border: 2px solid var(--color-w-b-6);
      border-bottom-color: var(--r-c-blue);
    }

    &:hover {
      background: var(--r-c-blue);
      color: #fff;
    }
  }

  &.return,
  &.share {
    border: 1px solid var(--r-c-blue);
    color: var(--r-c-blue);

    .loader {
      border: 2px solid var(--color-w-b-6);
      border-bottom-color: var(--r-c-blue);
    }

    &:hover {
      background: var(--r-c-blue);
      color: #fff;
    }
  }

  &.reset {
    border: 1px solid var(--r-c-purpleBlack);
    color: var(--r-c-purpleBlack);

    .loader {
      border: 2px solid var(--color-w-b-6);
      border-bottom-color: var(--r-c-purpleBlack);
    }

    &:hover {
      background: var(--r-c-purpleBlack);
      color: #ffffff;
    }
  }

  &:hover {
    background-color: transparent;
  }
}
</style>
