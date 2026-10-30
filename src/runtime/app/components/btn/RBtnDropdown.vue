<template>
  <RPopover :use="use" :placement="placement">
    <template #trigger v-if="$slots.trigger">
      <slot name="trigger"></slot>
    </template>
    <div
      v-for="action in actions"
      @click="fnClickItem(action.type, action.permission, action.label)"
    >
      <div
        v-if="
          showIfAllowed(
            action?.showIfAllowed,
            dataMenu.getActionPermission(action?.permission)
          )
        "
        class="item-action"
        :class="`${action.color} ${action.disabled ? 'disabled' : ''}`"
      >
        <div class="icon" :class="action.color">
          <i :class="action.icon"></i>
        </div>
        <div class="btn-label">{{ action.label }}</div>
      </div>
    </div>
  </RPopover>
</template>

<script setup>
const dataMenu = useMenuStore();
const toast = useToast();
const props = defineProps(["items", "use", "placement"]);
const items = computed(() => props.items);
const use = computed(() => props.use ?? "nuxtui");
const placement = computed(() => props.placement ?? "left-start");
const emit = defineEmits(["click"]);
const actions = computed(() => {
  return items.value.map((e) => {
    if (e.icon.toLowerCase() == "add") {
      e.icon = "ri-add-circle-line";
      e.color = "add";
    }
    if (e.icon.toLowerCase() == "completed") {
      e.icon = "ri-checkbox-circle-line";
      e.color = "completed";
    }
    if (e.icon.toLowerCase() == "incompleted") {
      e.icon = "ri-arrow-go-back-line";
      e.color = "incompleted";
    }
    if (e.icon.toLowerCase() == "view") {
      e.icon = "ri-eye-line";
      e.color = "view";
    }
    if (e.icon.toLowerCase() == "edit") {
      e.icon = "ri-pencil-line";
      e.color = "edit";
    }
    if (e.icon.toLowerCase() == "delete") {
      e.icon = "ri-delete-bin-3-line";
      e.color = "delete";
    }
    if (e.icon.toLowerCase() == "approve") {
      e.icon = "ri-checkbox-circle-line";
      e.color = "approve";
    }
    if (e.icon.toLowerCase() == "setting") {
      e.icon = "ri-settings-4-line";
      e.color = "setting";
    }
    if (e.icon.toLowerCase() == "print") {
      e.icon = "ri-printer-line";
      e.color = "print";
    }
    if (e.icon.toLowerCase() == "more") {
      e.icon = "ri-more-2-fill";
      e.color = "more";
    }
    if (e.icon.toLowerCase() == "release") {
      e.icon = "ri-corner-up-right-line";
      e.color = "release";
    }
    if (e.icon.toLowerCase() == "upload") {
      e.icon = "ri-upload-cloud-line";
      e.color = "upload";
    }
    return e;
  });
});
function fnClickItem(type, per, label) {
  if (dataMenu.getActionPermission(per) == 1) {
    emit("click", type);
  } else {
    toast.add({
      color: "yellow",
      title: `You don't have permission to ${label}.`,
      description: "Contact to administrator for permission.",
    });
  }
}
function showIfAllowed(ifAllow = true, per) {
  return per == 1 || ifAllow;
}
</script>

<style lang="scss" scoped>
.item-action {
  height: 32px;
  padding: 0px 10px;
  display: flex;
  align-items: center;
  border-radius: 8px;
  transition: 0.15s ease-in-out;
  cursor: pointer;
  user-select: none;

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  &:hover {
    background: var(--bg-content);
  }

  .icon {
    width: 22px;
    font-size: 15px;
    line-height: 15px;

    &.add,
    &.view,
    &.upload {
      color: var(--r-c-nenoBlue);
    }

    &.edit {
      color: var(--r-c-capture);
    }
    &.completed {
      color: var(--r-c-green);
    }
    &.incompleted {
      color: var(--r-c-blue);
    }

    &.delete {
      color: var(--r-c-red);
    }

    &.approve {
      color: var(--r-c-green);
    }

    &.setting {
      color: var(--r-c-purple);
    }

    &.print {
      color: var(--r-c-orange);
    }

    &.more {
      color: var(--r-c-gray);
    }

    &.release {
      color: var(--r-c-capture);
    }

    &.employee {
      color: #659277 !important;
    }

    &.clone {
      color: #7c72ff;
    }

    &.change-en {
      color: #4395f1;
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
</style>
