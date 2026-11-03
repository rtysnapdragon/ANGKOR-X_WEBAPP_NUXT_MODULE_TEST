<!-- <RCheckbox
  v-model="selected"
  label="Accept Terms"
  help="You must agree before continuing"
  required
/>

<RCheckbox v-model="selected">
  <template #label>
    <span>
      I agree to the <a href="#">Terms & Conditions</a>
    </span>
  </template>
</RCheckbox> -->

<template>
  <div class="r-checkbox-wrapper">
    <div class="r-checkbox-root">
      <div class="r-checkbox-container">
        <input
          :id="id"
          v-model="model"
          type="checkbox"
          class="oc-checkbox"
          :class="[
            disabled || disabled === '' ? '!cursor-not-allowed' : '',
            indeterminate && 'minus'
          ]"
          :name="name"
          :value="value"
          :disabled="disabled"
          v-bind="$attrs"
          ref="checkboxRef"
        />

        <label v-if="label || $slots.label" :for="id" class="r-checkbox-label" >
          <slot name="label"> {{ label }} </slot>
          <span  v-if="required" class="r-checkbox-required" > * </span>
        </label>
      </div>

      <p v-if="help" class="r-checkbox-help"> {{ help }} </p>
    </div>
  </div>
</template>

<script setup>
const model = defineModel()

const props = defineProps({
  label: String,
  name: String,
  help: String,
  required: Boolean,
  value: null,
  disabled: Boolean,
  id: String,
  indeterminate: Boolean
})

const checkboxRef = ref()

watchEffect(() => {
  if (checkboxRef.value) {
    checkboxRef.value.indeterminate = props.indeterminate
  }
})
</script>

<style lang="scss">
$oc-checkbox-padding: 6px;

.r-checkbox-wrapper {
  width: 100%;
}

.r-checkbox-root {
  display: flex;
  flex-direction: column;
  min-width: fit-content !important;
}

.r-checkbox-container {
  display: flex;
  align-items: center;
  // gap: 6px;
  min-width: fit-content;
}

.r-checkbox-label {
  display: block;
  font-size: 12px;
  font-weight: 400;
  cursor: pointer;
  line-height: 1.4;
}

.r-checkbox-required {
  color: red;
  margin-left: 2px;
}

.r-checkbox-help {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
  margin-left: 21px;
}

input[type='checkbox'].oc-checkbox {
  all: unset;
  position: relative;
  display: inline-flex;
  align-items: center;
  box-sizing: border-box;
  border: 2px solid #c3c3c3;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 15px;
  height: 15px;
  flex-shrink: 0;

  // &:focus::after {
  //   content: '';
  //   position: absolute;
  //   top: -$oc-checkbox-padding;
  //   bottom: -$oc-checkbox-padding;
  //   left: -$oc-checkbox-padding;
  //   right: -$oc-checkbox-padding;
  //   border: 2px solid var(--color-primary);
  //   border-radius: 9px;
  //   box-sizing: content-box;
  // }

  &:checked {
    background-color: transparent;
    border-color: var(--color-primary) !important;
    color: var(--color-primary);
  }

  &:checked::before {
    opacity: 1;
    transform: scale(1.1);
  }

  &::before {
    content: '\eb7a';
    font-family: 'remixicon';
    font-size: 9px;
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transform: scale(0);
    transition: all 0.2s ease;
    color: var(--color-primary);
    font-weight: bold;
  }

  &.minus::before {
    content: '\f1ae';
    opacity: 1;
    transform: scale(1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
</style>