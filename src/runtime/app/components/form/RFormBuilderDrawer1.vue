<template>
  <RSlider
    v-model="show"
    :ui="{
      base: isNotEmpty(inForm?.width)
        ? `max-w-[${inForm.width}px]`
        : `max-w-[320px]`,
    }"
    :class="inForm.width"
    @closed="closeForm"
    prevent-close
  >
    <template #header>
      {{
        isNotEmpty(title)
          ? title
          : isUpdate
          ? $t("update_form")
          : $t("create_form")
      }}
    </template>
    <RFormBuilder
      v-model:data="dataUpdate"
      :inputs="inputs"
      :tabs="tabs"
      :form="{
        ...inForm,
        ...{
          showSubmit: false,
          showReset: false,
          showCancel: false,
          isClone: isClone,
        },
      }"
      ref="refForm"
      @onSubmitted="submitForm"
      @onCancel="cancelForm"
      @onReset="resetForm"
      @onLoading="loadingForm"
      @onError="errorForm"
      @onSuccess="successForm"
    />

    <template #footer>
      <RBtn
        type="cancel"
        :label="$t('cancel')"
        size="s"
        variant="solid"
        @click="refForm.clearForm()"
        :disabled="loading || disabledUpdate"
        v-if="conditionShowBtn(inForm?.showCancel)"
      />
      <RBtn
        type="reset"
        :label="$t('reset')"
        size="s"
        variant="solid"
        v-if="conditionShowBtn(inForm?.showReset)"
        @click="refForm.resetForm()"
        :disabled="loading"
      />
      <RBtn
        v-if="conditionShowBtn(inForm?.showSubmit)"
        :type="isUpdate ? 'save-update' : isClone ? 'copy' : 'save'"
        :label="isUpdate ? $t('update') : isClone ? $t('clone') : $t('save')"
        size="s"
        variant="solid"
        @click="refForm.onsubmit()"
        :loading="loading"
        :disabled="disabledUpdate"
      />
    </template>
  </RSlider>
</template>

<script setup>
const props = defineProps(["form", "inputs", "title", "tabs", "isClone","disabledUpdate"]);
const dataUpdate = defineModel("data");
const isClone = computed(() => props.isClone ?? false);
const disabledUpdate = computed(() => props.disabledUpdate ?? false);
const isUpdate = computed(() =>
  isClone.value === true ? false : isNotEmpty(dataUpdate.value)
);
const show = defineModel("show");
const loading = ref(false);
const inForm = computed(() => props.form);
const title = computed(() => props.title);
const inputs = computed(() => props.inputs);
const tabs = computed(() => props.tabs);
const emit = defineEmits([
  "onSubmitted",
  "onCancel",
  "onReset",
  "onLoading",
  "onError",
  "onSuccess",
]);
const refForm = ref();
defineExpose({
  jumpTo: (v) => refForm.value.jumpTo(v),
  disabledTab: (i, disabled) => refForm.value.disabledTab(i, disabled),
  refInput: () => refForm.value.refInput(),
});
function submitForm(a) {
  console.log("Data to update ==>", a);
  emit("onSubmitted", a);
}
function cancelForm(a) {
  emit("onCancel", a);
  show.value = false;
}
function resetForm(a) {
  emit("onReset", a);
}
function loadingForm(a) {
  loading.value = a;
  emit("onLoading", a);
}
function errorForm(a) {
  emit("onError", a);
}
function successForm(a) {
  console.log("AAAAAB=>", a);
  cancelForm();
  emit("onSuccess", a);
}
function closeForm() {
  cancelForm();
}

function conditionShowBtn(v) {
  return v === undefined || v === null || v === "" ? true : v;
}
onMounted(() => {
  console.log(inForm.value);
});
</script>

<style lang="scss" scoped></style>
