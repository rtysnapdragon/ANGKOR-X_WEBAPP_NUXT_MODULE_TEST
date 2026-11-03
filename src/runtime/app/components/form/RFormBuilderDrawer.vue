<template>
  <RSlider
    :model-value="show"
    :title="resolvedTitle"
    :description="description"
    :icon="icon"
    :ui="{ base: widthClass }"
    prevent-close
    @update:model-value="onShowUpdate"
    @closed="requestClose"
  >
    <RFormBuilder
      ref="refForm"
      v-model:data="dataUpdate"
      :inputs="inputs"
      :tabs="tabs"
      :form="builderForm"
      @onSubmitted="submitForm"
      @onCancel="cancelForm"
      @onReset="resetForm"
      @onLoading="loadingForm"
      @onError="errorForm"
      @onSuccess="successForm"
    />

    <template #footer>
      <RBtn
        v-if="conditionShowBtn(inForm?.showCancel)"
        type="cancel"
        :label="t('cancel')"
        size="s"
        variant="solid"
        :disabled="busy"
        @click="requestClose"
      />
      <RBtn
        v-if="conditionShowBtn(inForm?.showReset)"
        type="reset"
        :label="t('reset')"
        size="s"
        variant="solid"
        :disabled="busy"
        @click="refForm?.resetForm()"
      />
      <RBtn
        v-if="conditionShowBtn(inForm?.showSubmit)"
        :type="isUpdate ? 'save-update' : isClone ? 'copy' : 'save'"
        :label="isUpdate ? t('update') : isClone ? t('clone') : t('save')"
        size="s"
        variant="solid"
        :loading="busy"
        :disabled="disabledUpdate || busy"
        @click="refForm?.onsubmit()"
      />
    </template>
  </RSlider>
</template>

<script setup>
const props = defineProps({
  form: { type: Object, default: () => ({}) },
  inputs: { type: Array, default: () => [] },
  tabs: { type: Object, default: () => ({}) },
  title: { type: String, default: "" },
  description: { type: String, default: "" },
  icon: { type: String, default: "" },
  /** drawer max width in px — snapped to the nearest supported size */
  width: { type: [Number, String], default: null },
  isClone: { type: Boolean, default: false },
  disabledUpdate: { type: Boolean, default: false },
  /** external pending flag (parent is saving through its own request) */
  loading: { type: Boolean, default: false },
  /** ask before discarding unsaved changes */
  guardDirty: { type: Boolean, default: true },
});

const dataUpdate = defineModel("data");
const show = defineModel("show");

const emit = defineEmits([
  "onSubmitted",
  "onCancel",
  "onReset",
  "onLoading",
  "onError",
  "onSuccess",
]);

const { t } = useI18n();
const { confirmDestructive } = useConfirm();

const refForm = ref();
const innerLoading = ref(false);
const busy = computed(() => innerLoading.value || props.loading);

const inForm = computed(() => props.form);
const isUpdate = computed(() => (props.isClone ? false : isNotEmpty(dataUpdate.value)));
const resolvedTitle = computed(() =>
  isNotEmpty(props.title) ? props.title : isUpdate.value ? t("update_form") : t("create_form")
);

// The footer owns Save / Cancel / Reset; the inner builder never renders its own.
const builderForm = computed(() => ({
  ...inForm.value,
  width: props.width ?? inForm.value?.width,
  showSubmit: false,
  showReset: false,
  showCancel: false,
  isClone: props.isClone,
}));

// FIX: `max-w-[${width}px]` was an interpolated class — Tailwind can't generate those at
// build time, so the drawer width never applied. Every class below is a literal.
const WIDTH_CLASSES = [
  [320, "w-full max-w-[320px]"],
  [420, "w-full max-w-[420px]"],
  [520, "w-full max-w-[520px]"],
  [640, "w-full max-w-[640px]"],
  [760, "w-full max-w-[760px]"],
  [920, "w-full max-w-[920px]"],
];
const widthClass = computed(() => {
  const w = Number(props.width ?? inForm.value?.width) || 320;
  return (WIDTH_CLASSES.find(([size]) => w <= size) ?? WIDTH_CLASSES.at(-1))[1];
});

// ─── Close guard ─────────────────────────────────────────────────────────────
const isDirty = () => !!refForm.value?.isDirty?.();
let asking = false; // the slider can fire both update:modelValue and closed for one click

/** Close immediately — used after a successful save / for confirmed discards. */
function closeNow() {
  show.value = false;
}

/** User-initiated close (X, Cancel, backdrop, Esc). Asks first when there are unsaved changes. */
async function requestClose() {
  if (busy.value || asking) return false;
  asking = true;
  try {
    if (props.guardDirty && isDirty()) {
      const ok = await confirmDestructive({
        title: t("discardTitle"),
        description: t("discardBody"),
        confirmLabel: t("discard"),
        cancelLabel: t("keepEditing"),
        color: "warning",
      });
      if (!ok) return false;
    }
    closeNow();
    return true;
  } finally {
    asking = false;
  }
}

function onShowUpdate(value) {
  if (value) show.value = true;
  else requestClose();
}

// Rebuild the form every time the drawer opens so a previously discarded edit of the
// same row (or an abandoned "create") can never leak into the next session.
watch(show, async (open) => {
  if (!open) return;
  await nextTick();
  refForm.value?.hydrate?.();
});

// Browser tab close / reload and in-app navigation while dirty.
function onBeforeUnload(e) {
  if (show.value && isDirty()) {
    e.preventDefault();
    e.returnValue = "";
  }
}
onMounted(() => window.addEventListener("beforeunload", onBeforeUnload));
onBeforeUnmount(() => window.removeEventListener("beforeunload", onBeforeUnload));

onBeforeRouteLeave(async () => {
  if (!show.value) return true;
  return await requestClose();
});

// ─── Builder events ──────────────────────────────────────────────────────────
function submitForm(payload) {
  emit("onSubmitted", payload);
}
// Builder already cleared itself (its own Cancel / successful api save) → nothing to ask.
function cancelForm(payload) {
  emit("onCancel", payload);
  closeNow();
}
function resetForm(payload) {
  emit("onReset", payload);
}
function loadingForm(value) {
  innerLoading.value = value;
  emit("onLoading", value);
}
function errorForm(error) {
  emit("onError", error);
}
function successForm(data) {
  closeNow();
  emit("onSuccess", data);
}

function conditionShowBtn(v) {
  return v === undefined || v === null || v === "" ? true : v;
}

defineExpose({
  /** close without asking (call after a successful save) */
  close: closeNow,
  /** close the way the user would — asks when dirty */
  requestClose,
  isDirty,
  markPristine: () => refForm.value?.markPristine?.(),
  jumpTo: (v) => refForm.value?.jumpTo(v),
  disabledTab: (i, disabled) => refForm.value?.disabledTab(i, disabled),
  refInput: () => refForm.value?.refInput(),
  resetForm
});
</script>

<style lang="scss" scoped></style>
