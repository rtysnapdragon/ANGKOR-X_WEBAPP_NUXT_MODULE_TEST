<template>
  <UPopover :popper="{
    placement: 'bottom-start',
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, 10], // Adjusts the popover position; [horizontal offset, vertical offset]
        },
      },
      {
        name: 'preventOverflow',
        options: {
          padding: 8, // Adds padding to prevent overflow
        },
      },
    ],
  }" class="w-full select-none" :disabled="disabled">
    <div class="customInput" >
      <input type="color" class="color-show rounded-full" v-model="dataColor" :disabled="disabled" />
      <input type="text" class="onInputCustom color-text text-[14px]" v-model="dataColor" :disabled="disabled"  />
    </div>
    <template #panel class="bg-transparent">
      <RColorPicker v-model="dataColor" @onChange="onChange" @onPicker="emit('onPicker')" />
    </template>
  </UPopover>
</template>

<script setup>
const dataColor = defineModel();
const { config } = helper();
const listColor = config.primaryColor.split(",").map(Number);
const primaryColor = convertColor({ r: listColor[0], g: listColor[1], b: listColor[2],})

mounted(() => {
  dataColor.value = isNotEmpty(dataColor.value) ? dataColor.value : primaryColor;
})

const prop = defineProps(["disabled"]);
const disabled = computed(() => prop.disabled);
const emit = defineEmits(["onChange", "onPicker"]);
function onChange(color) {
  emit("onChange", color);
}
</script>

<style scoped lang="scss">
.customInput {
  display: flex;
  align-items: center;
  border: 1px solid var(--border-input);
  height: 38px;
  padding: 8px 12px;
  border-radius: 8px !important;
  background-color: transparent !important;
  width: 100% !important;

  .onInputCustom {
    padding: unset !important;
    height: 100%;
    border: none;
    background-color: unset;
    width: 100%;

    &:focus {
      outline: none;
    }
  }

  // .color-show {
  //   padding: unset;
  //   width: 27px;
  //   height: 27px;
  //   /* Add this to ensure it's a perfect circle */
  //   cursor: pointer;
  //   margin-right: 10px;
  //   border-radius: 50%;
  //   border: none;
  //   /* Remove default border */
  //   appearance: none;
  //   /* Try to remove browser default styling */
  //   -webkit-appearance: none;
  //   /* For Safari */
  //   background-color: unset;
  // }

  .color-show {
    display: inline-block;
    width: 27px;
    height: 27px;
    border-radius: 50% !important;
    border: none;
    appearance: none;
    -webkit-appearance: none;
    background-color: unset;
    cursor: pointer;
    margin-right: 10px;
    padding: unset;
  }
}
</style>
