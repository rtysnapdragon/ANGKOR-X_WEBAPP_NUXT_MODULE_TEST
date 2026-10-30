<template>
  <div class="relative">
    <UTextarea
      ref="textareaComponent"
      v-model="value"
      :model-modifiers="{ nullable: true }"
      :name="props.name"
      :size="props.size ?? 'md'"
      :rows="props.rows"
      :maxrows="props.maxRows"
      :autoresize="autoResize"
      :resize="resize"
      :placeholder="placeholder"
      :disabled="disabled"
      :autofocus="autofocus"
      :autofocus-delay="autofocusDelay"
      :highlight="highlight"
      :color="color"
      :icon="icon"
      :variant="variant"
      :trailingIcon="trailingIcon"
      :avatar="avatar"
      :loading="loading"
      :loadingIcon="loadingIcon"
      :ui="ui"
      :absolute="absolute"
      @blur="(v) => emits('onBlur', v)"
      @focus="(v) => emits('onFocus', v)"
      @input="(v) => emits('onInput', v)"
      @update:modelValue="updateModelValue"
      class="w-full"
    />
    <!-- variant="none" -->
    <div v-if="absolute" class="absolute">
      <slot></slot>
    </div>
    <div
      v-if="maxLength > 0"
      class="absolute right-2 bottom-2 text-[10px] text-gray-500 dark:text-gray-400"
    >
      {{ textLength }}/{{ maxLength }}
    </div>
  </div>
</template>

<script setup>
const value = defineModel();
const emits = defineEmits(["onFocus", "onBlur", "onInput"]);

const props = defineProps([
  "ui",
  "size",
  "name",
  "rows",
  "maxRows",
  "resize",
  "autoResize",
  "disabled",
  "placeholder",
  "textareaClass",
  "padded",
  "autofocus",
  "autofocusDelay",
  "absolute",
  "maxLength",
  "highlight",
  "color", // primary, secondary, success, error , info, warning , neutral
  "variant",
  "icon", //leading
  "trailingIcon",
  "iconClass",
  "trailingIconClass",
  "avatar",
  "loading",
  "loadingIcon"
]);
const textareaComponent = ref(null);
const nativeTextarea = ref(null);
// Wait for the DOM to be ready
onMounted(() => {
  // Grab the actual textarea from the inner UTextarea component
  // UTextarea might expose it via $el or $refs
  nativeTextarea.value = textareaComponent.value?.$el?.querySelector('textarea');
});
// Expose the raw native textarea
defineExpose({
  textarea: nativeTextarea
});
const placeholder = computed(() => props.placeholder ?? "Please enter");
const disabled = computed(() => props.disabled);
const autoResize = computed(() => props.autoResize);
const autofocus = computed(() => props.autofocus);
const autofocusDelay = computed(() => props.autofocusDelay);
const absolute = computed(() => props.absolute ?? false);
const resize = computed(() => props.resize);
const highlight = computed(() => props.highlight);
const color = computed(() => props.color ?? "primary"); 
const variant = computed(() => props.variant ?? "outline");
const icon = computed(() => props.icon ?? "");
const trailingIcon = computed(() => props.trailingIcon ?? "");
const avatar = computed(() => props.avatar ?? "");
const loading = computed(() => props.loading ?? false);
const loadingIcon = computed(() => props.loadingIcon ?? "");
const iconClass = computed(() => props.iconClass ?? "");
const trailingIconClass = computed(() => props.trailingIconClass ?? "");

const ui = computed(() => {
  const defaultUI = {
    wrapper: " relative w-full",
    root: "w-full",
    base: "ocs-input-area w-full",
    form: "form-textarea",
    rounded: "",
    placeholder: "",
    leadingIcon:"",
    leading:"",
    file: {
      base: "file:mr-1.5 file:font-medium file:text-gray-500 dark:file:text-gray-400 file:bg-transparent file:border-0 file:p-0 file:outline-none color-text text-[12px]",
    },
    size: {},
    gap: {},
    padding: {},
  };
  const resultUI = {
    ...defaultUI,
    ...props.ui,
    file: {
      ...defaultUI.file,
      ...props.ui?.file,
    },
    size: {
      ...defaultUI.size,
      ...props.ui?.size,
    },
    gap: {
      ...defaultUI.gap,
      ...props.ui?.gap,
    },
    padding: {
      ...defaultUI.padding,
      ...props.ui?.padding,
    },
  };
  return resultUI;
});
const maxLength = computed(() => props.maxLength ?? 0);
const textLength = ref(0);

function updateModelValue(v) {
  textLength.value = v.length;
}
</script>

<style lang="scss" scoped>
.input-wrapper{
  padding: 8px;
}
.ocs-input-area {
  color: var(--color-w-b-1) !important;
  box-shadow: none !important;
  background-color: unset !important;
  border: 1px solid var(--c-border) !important;
  border-radius: 8px !important;
  font-size: 14px !important;
  width: 100% !important;
  padding: 6px 12px !important;

  &:focus {
    border: 1px solid var(--color-primary) !important;
  }

  &:disabled {
    background: var(--bg-wrapper-50) !important;
  }

  &::placeholder {
    color: var(--color-w-b-3) !important;
    font-size: 14px !important;
  }
}

.form-textarea{
  padding: 8px;
  resize: none;
  &:focus {
    border: 1px solid var(--color-primary) !important;
  }

  &:disabled {
    background: var(--bg-wrapper-50) !important;
  }
}
.absolute{
  position: absolute;
  right: 0;
  bottom: 0;
  margin-right: 10px;
  margin-bottom: 6px;
  font-size: 10px !important;
}
</style>
