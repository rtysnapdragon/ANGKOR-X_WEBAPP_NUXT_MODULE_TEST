<template>
  <UForm ref="refRTForm" :validate="validate" :schema="schema" :state="state" @submit="onSubmit" @error="onError">
    <slot />
  </UForm>
</template>
<script setup>
const props = defineProps(["schema", "validate", "state"])
const emit = defineEmits(["onSubmit", "onInput", "onError"]);
const schema = computed(() => props.schema);
const validate = computed(() => props.validate);
const state = computed(() => props.state);
const refRTForm = ref();

defineExpose({ RTForm, submit, clearValidate });

mounted(() => { });

async function onSubmit(event) {
  emit("onSubmit", event);
}

async function onError(event) {
  emit("onError", event);
}

function submit() {
  refRTForm.value.submit();
}
function clearValidate() {
  refRTForm.value.clear();
}
function RTForm() {
  return refRTForm.value
}
</script>
