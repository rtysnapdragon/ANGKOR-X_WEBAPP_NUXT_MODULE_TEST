<template>
  <div class="w-full">
    <!-- date range picker -->
    <VDatePicker v-if="dateRangePicker" ref="refDatePicker" v-model="date" :columns="columns" is-range
      v-bind="{ ...attrs, ...$attrs }" :attributes="attributes" :min-date="minDate" :max-date="maxDate" :masks="masks"
      :popover="popover">
      <template #default="{ togglePopover, inputValue, inputEvents }" v-if="!predefined">
        <UInput ref="refInput" readonly @click="togglePopover"
          :modelValue="isNotEmpty(inputValue?.start) && isNotEmpty(inputValue?.end) ? `${inputValue.start} - ${inputValue.end}` : ''"
          v-on="inputEvents" :disabled="disabled" :placeholder="placeholder" :ui="defaultUI" size="xs"
          icon="ri-calendar-schedule-line" trailing autocomplete="off" inputClass="ocs-input-date cursor-pointer" />
      </template>
    </VDatePicker>

    <VDatePicker ref="refDatePicker" v-model="date" v-bind="{ ...attrs, ...$attrs }" :mode="mode"
      :hide-time-header="false" :attributes="attributes" :min-date="minDate" :max-date="maxDate" v-if="!dateRangePicker"
      :masks="masks" :popover="popover" class="custom-scrollbar" :is24hr="is24hr" :isRequired="true">
      <template #default="{ inputValue, inputEvents }">
        <!-- <input ref="refInput" :value="inputValue" v-on="inputEvents" @focus="onFocus" @input="onInput"
          :disabled="disabled" :placeholder="placeholder"  
          trailing autocomplete="off" /> -->
        <UInput ref="refInput" :modelValue="inputValue" v-on="inputEvents" @focus="onFocus" @input="onInput"
          :disabled="disabled" :placeholder="placeholder" :ui="defaultUI" size="xs" icon="ri-calendar-schedule-line"
          trailing autocomplete="off" inputClass="ocs-input-date" />
      </template>
    </VDatePicker>
  </div>
</template>
<script setup>
// import { format } from 'date-fns'
import { DatePicker as VDatePicker } from "v-calendar";
import "v-calendar/dist/style.css";
import { computed } from "vue";
import { useScreens } from "vue-screen-utils";

const isOpen = ref(false);
const refDatePicker = ref();
const refInput = ref()

onClickOutside(refDatePicker, (e) => {
  refDatePicker.value?.hidePopover();
});

let timeout
// Handle input blur
function onInput(e) {
  const val = e?.target?.value;

  if (val == '' || val == null || val == undefined) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      // refDatePicker.value?.updateValue(getZeroTimeDate())
      fnReset()
    }, 1000);
  }

}

// Optional: Handle input to re-show popover
// function onInput(e) {
//   if (!e?.target?.value && mode.value === 'time') {
//     refDatePicker.value?.showPopover?.()
//   }
// }

// Optional: On focus, set time if empty
function onFocus() {
  if (date.value == null || date.value == '') {
    if (mode.value === 'time') {
      date.value = getZeroTimeDate()
    }
  }
}

function getZeroTimeDate() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

const popover = ref({
  visibility: "click",
  placement: "bottom",
});

const props = defineProps({
  modelValue: null,
  attrs: Object,
  mode: String,
  hideTimeHeader: Boolean,
  attributes: Object,
  format: String,
  label: null,
  placeholder: null,
  dateRangePicker: Boolean,
  minDate: null,
  maxDate: null,
  masks: null,
  ui: null,
  variant: String, // variants:outline,solid,none
  class: String,
  disabled: Boolean,
  is24hr: Boolean,
  columns: null,
  predefined: Boolean
});

const emit = defineEmits(["update:model-value", "close"]);

const date = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit("update:model-value", value);
    emit("close");
  },
});

const attrs = computed(() => ({
  ...{
    transparent: true,
    borderless: true,
    color: "primary",
    "is-dark": { selector: "html", darkClass: "dark" },
    "first-day-of-week": 2,
  },
  ...props.attrs,
}));
const predefined = computed(() => props.predefined);
const mode = computed(() => props.mode);
const hide = computed(() => props.hideTimeHeader);
const attributes = computed(() => props.attributes);
const labelFormat = computed(() => props.format);
const label = computed(() => props.label);
const minDate = computed(() => props.minDate);
const maxDate = computed(() => props.maxDate);
const variantClass = computed(() => props.variant ?? "outline");
const nClass = computed(() => props.class ?? "");
const is24hr = computed(() => props.is24hr);

// const masks = computed(() => props.masks ?? { input: 'MMM DD,YYYY' })
// const masks = ref({
//   input: 'MMM DD,YYYY',
// });

const masks = computed(() => {
  //by RTY
  switch (props.mode) {
    case "time":
      return { input: "HH:mm:ss" }; // 12-hour time
    case "dateTime":
      return { input: "MMM dd, yyyy HH:mm:ss" };
    default:
      return { input: "MMM DD, YYYY" };
  }
});

const disabled = computed(() => props.disabled);
const placeholder = computed(() => props.placeholder);

// date range picker
const { mapCurrent } = useScreens({
  xs: "0px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
});
const columns = mapCurrent(
  isNotEmpty(props.columns) ? props.columns : { lg: 2, md: 2, sm: 2 },
  1
);

// const columns = computed(() => {
//   if(isNotEmpty(props.columns)) {
//     return mapCurrent(props.columns, 1)
//   } else return mapCurrent({ lg: 2, md: 2, sm: 2 }, 1)
// })

// if(isNotEmpty(props.columns)) {
//     return mapCurrent(props.columns, 1)
//   } else return mapCurrent({ lg: 2, md: 2, sm: 2 }, 1)

const dateRangePicker = computed(() => isNotEmpty(props.dateRangePicker));

const ui = computed(() => {
  const defaultUI = {
    base: `color-w-b-1 ring-1 ring-inset w-full !justify-between ${isOpen.value
      ? "ring-primary dark:ring-primary"
      : "ring-gray-300 dark:ring-gray-700"
      }`,
    rounded: "ocs-rounded-input",
    shadow: "shadow-none",
    font: "font-normal",
    icon: {
      base: "text-lg flex justify-center items-center",
    },
  };
  const resultUI = { ...defaultUI, ...props.ui };
  return resultUI;
});

const defaultUI = {
  root:'ui-rinput-root relative w-full',
  placeholder: "placeholder:text-xs",
  base: "ui-rinput-base color-w-b-1 w-full text-left",
  file: {
    base: "file:hidden",
  },
  gap: {
    xs: "gap-x-2",
  },
  padding: {
    xs: "px-3 py-2.5",
  },
  leading: {
    padding: {
      xs: "ps-10",
    },
  },
  trailing: {
    padding: {
      xs: "pe-10",
    },
  },
  icon: {
    base: "flex justify-center items-center",
  },
};

watch(() => date.value, (n) => {
  if (dateRangePicker.value) {
    if (n?.end) {
      refDatePicker.value?.updateValue(n);
      refInput.value?.onBlur();
    }
  } else {
    if (n) {
      refInput.value?.onBlur();
    }
  }

  if (n == null || n == undefined || n == '') {
    if (!dateRangePicker.value) {
      refDatePicker.value?.updateValue(n)
    }
  }

  console.log('--->>>', n)
}, { deep: true })

function datePicker() {
  return refDatePicker.value;
}

function fnReset(){
  date.value = ''
  refDatePicker.value?.updateValue('')
  setTimeout(() => {
    refInput.value.input.value = ''
  }, 100);
  
}

defineExpose({ datePicker ,fnReset});
</script>

<style lang="scss">
.date-picker-container {
  border-radius: 10px;
  position: absolute;
  transform: translate(0px, 10px);
  z-index: 30;
}

.vc-popover-content-wrapper {
  z-index: 999 !important;
}

.vc-header .vc-arrow:hover {
  background: var(--vc-day-content-hover-bg) !important;
}

//by RTY start
.vc-time-picker {
  padding: 8px 9px;

  .vc-time-header {
    font-size: var(--vc-text-xs) !important;
    font-weight: var(--vc-font-semibold) !important;
    line-height: 17px;
    display: none !important;
  }
}

.vc-time-picker>*+* {
  margin-top: 0px !important;
}

.vc-time-select-group {
  background: var(--bg-content) !important;
  padding: 0 5px;

  svg {
    width: 25px;
    height: 30px;
  }
}

.vc-time-select-group select {
  background: transparent;
  padding: 0px 7px;
}

.vc-base-select select.vc-align-right {
  text-align: center;
}

.vc-base-select {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 40px;
  font-size: 10px;
  font-weight: 10px;
}

.vc-base-select .vc-focus {
  // select dropdown
  font-size: 15px;
}

.vc-time-select-group select {
  background: var(--bg-content) !important;
  padding: 0px 9px;
}

//by RTY end

.vc-date-picker-content {
  background-color: var(--bg-content) !important;
  border: 1px solid var(--color-w-b-4) !important;
}

.vc-popover-content {
  background-color: var(--bg-content) !important;
  border: 1px solid var(--color-w-b-4) !important;
}

.vc-nav-title:hover,
.vc-nav-arrow:hover,
.vc-nav-item:hover {
  background-color: var(--vc-day-content-hover-bg);
}

.vc-focus:focus-within {
  outline: 0;
  box-shadow: none !important;
}

.vc-pane-layout> :not([hidden])~ :not([hidden]) {
  --tw-divide-x-reverse: 0;
  border-right-width: calc(1px * var(--tw-divide-x-reverse));
  border-left-width: calc(1px * calc(1 - var(--tw-divide-x-reverse)));
  border-color: var(--color-w-b-4) !important;
}

// .dark {
//   .vc-pane-layout> :not([hidden])~ :not([hidden]) {
//     border-color: rgb(31 41 55);
//   }
// }

[type="text"] {
  &::placeholder {
    color: var(--color-w-b-3) !important;
  }
}

.ui-rinput-base {
  font-family: var(--font-400);
  font-size: 12px;
  color: var(--color-w-b-1);
  font-weight: var(--font-medium);
  line-height: 18px;
  height: 38px !important;
  letter-spacing: 0.5px;
  border-radius: 11px !important;
  width: 100% !important;
}

.ocs-input-date {
  box-shadow: none !important;
  border: 1px solid var(--color-w-b-4) !important;
  border-radius: 8px !important;
  background-color: transparent !important;

  &:focus {
    border: 1px solid var(--color-primary) !important;
  }

  &:disabled {
    background: var(--bg-wrapper-50) !important;
  }

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none !important;
    margin: 0 !important;
  }
}
</style>
