<!-- <template>
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
</script> -->

<template>
  <UForm
    ref="refRTForm"
    :validate="validate"
    :schema="schema"
    :state="state"
    @submit="onSubmit"
    @error="onError"
    @keydown.capture="onKeydown"
  >
    <slot />
  </UForm>
</template>

<script setup>
// const props = defineProps({
//   schema: {
//     type: [Object, Function],
//     default: undefined
//   },
//   validate: {
//     type: Function,
//     default: undefined
//   },
//   state: {
//     type: Object,
//     required: true
//   }
// })
const props = defineProps(["schema", "validate", "state"]);

const emit = defineEmits([
  'onSubmit',
  'onInput',
  'onError',
  'onCancel'
])

const refRTForm = ref()

const schema = computed(() => props.schema)
const validate = computed(() => props.validate)
const state = computed(() => props.state)

// Keyboard shortcuts
function onKeydown(event) {
  if (event.defaultPrevented || event.isComposing) return

  // ESC = Cancel
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('onCancel', event)
    return
  }

  // ENTER = Submit
  if (event.key !== 'Enter') return

  // Avoid modifier shortcuts
  if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) {
    return
  }

  const target = event.target

  if (!(target instanceof HTMLElement)) return

  // Ignore multiline and editable elements
  if (
    target instanceof HTMLTextAreaElement ||
    target.isContentEditable ||
    target.closest('[contenteditable="true"]')
  ) {
    return
  }

  // Only submit from normal input fields
  if (target instanceof HTMLInputElement) {
    const ignoredTypes = [
      'button',
      'submit',
      'reset',
      'checkbox',
      'radio',
      'file',
      'image'
    ]

    if (ignoredTypes.includes(target.type)) return
  } else {
    return
  }

  event.preventDefault()
  submit()
}

// Events
function onSubmit(event) {
  emit('onSubmit', event)
}

function onError(event) {
  emit('onError', event)
}

// Public methods
function submit() {
  return refRTForm.value?.submit()
}

function clearValidate() {
  return refRTForm.value?.clear()
}

function RTForm() {
  return refRTForm.value
}

function cancel() {
  emit('onCancel')
}

defineExpose({
  RTForm,
  submit,
  clearValidate,
  cancel
})
</script>
