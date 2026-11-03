<template>
  <VCalendarDatePicker v-model="date" v-bind="{ ...attrs, ...$attrs }" mode="time" :hide-time-header="true"
    :is24hr="is24hr" :update-on-input="false"
    :class="['input-time-picker']"
    :popover="popover"
  >

    <template v-slot="{ inputValue, inputEvents }">
      <UButton v-if="showClear" @click="emit('clear')">clear</UButton>
      <div class="relative">
        <input ref="input_time" :value="inputValue" v-on="inputEvents" @focus="onFocus" :autofocus="false" :class="['input-time', classInputPicker, ui]" :placeholder="placeholder"/>
        <span class="oc-time-picker-icon text-gray-400 dark:text-gray-500"><i class="ri-calendar-schedule-line"></i></span>
      </div>
    </template>

  </VCalendarDatePicker>
</template>

<script setup>
import { DatePicker as VCalendarDatePicker } from 'v-calendar'
import 'v-calendar/dist/style.css'
import { onBeforeMount } from 'vue'

const input_time = ref(null)
const date = defineModel()
const props = defineProps({
  modelValue: null,
  attrs: Object,
  hideTimeHeader: Boolean,
  format: String,
  is24hr: Boolean,
  showClear: Boolean,
  placeholder: String,
  minDate: null,
  maxDate: null,
  ui: null
})

const placeholder = computed(() => props.placeholder ?? '');
const ui = computed(() => props.ui ?? '');
const showClear = computed(() => props.showClear ?? true);
const emit = defineEmits(['update:model-value', 'close', 'clear']);

onBeforeMount(() => {
  if (
    typeof date.value == 'string' &&
    /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(date.value)
  ) {
    // valid 24-hour time format
    date.value = convertTimeToDate(date.value);
  }
})

const popover = ref({
  visibility: "focus",
  placement: "bottom",
  autoHide: true
});

const onFocus = () => {
  if (date.value == null || isNaN(date.value) || date.value == '') {
    date.value = new Date().setHours(0,0,0,0);
  }
}

function convertTimeToDate(timeStr) {
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);
  const now = new Date(); // today
  now.setHours(hours, minutes, seconds, 0);
  return now;
}

const attrs = computed(() => {
  const defaultAttrs = {
    transparent: true,
    borderless: true,
    color: 'primary',
    'is-dark': {
      selector: 'html',
      darkClass: 'dark'
    },
    'first-day-of-week': 2,
  }
  const resultAttrs = {
    ...defaultAttrs,
    ...props.attrs,
    'is-dark': {
      ...defaultAttrs['is-dark'],
      ...props.attrs?.['is-dark']
    }
  }
  return resultAttrs
})

const labelFormat = computed(() => props.format)
const is24hr = computed(() => props.is24hr)
const minDate = computed(() => props.minDate)
const maxDate = computed(() => props.maxDate)

watch(input_time, (n) => {

})

const classInputPicker = `text-sm dark:text-white`

defineExpose(input_time.value)

</script>

<style lang="scss" scoped>
.input-time {
  position: relative;
  display: block;
  width: 100%;
  font-size: 14px;
  padding: 8px 40px 8px 12px;
  border-radius: 8px;
  outline: 1px solid var(--color-w-b-4);
  height: 38px;
  background: transparent;

  &:focus-visible {
    outline: 1px solid var(--color-primary);
  }
}

.oc-time-picker-icon{
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  right: 12px;
  font-size: 16px;
}

.vc-popover-content {
  border-radius: 10px;
  padding: 0 !important;
}

.vc-bordered {
  border: 0;
  border-radius: 10px;
}

.vc-time-picker {
  background-color: var(--bg-wrapper);
  border: none !important;
  border-radius: 10px;
  padding: 0 !important;

  &.vc-attached {
    border-top-color: transparent !important;
  }
}


.vc-time-select-group {
  --icon-time: rgba(87, 87, 87, 1);
  padding: 4px 8px !important;
  background: transparent !important;
  border: none !important;
  border-radius: 10px;

  .vc-base-icon {
    width: 22px;
    height: 22px;
    color: var(--icon-time) !important;
    margin-right: 0;
  }

}



.vc-base-select {

  height: 34px;
  width: 45px;
  text-align: center;

  select {
    text-align: center !important;
    width: 100% !important;
    background-color: var(--bg-wrapper);
    height: 100%;
    color: var(--color-w-b-1) !important;

    &:hover {
      background-color: #e5e5e57d;
    }


    &::-webkit-scrollbar {
      width: 3px;
      height: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background-color: transparent;
      border: 0px solid var(--bg-content) !important;
      border-radius: 50px;
    }

  }
}

.vc-focus:focus-within {
  box-shadow: none;
}

.dark {
  .vc-time-select-group {
    --icon-time: rgba(229, 229, 229, 1);
    border: 1px solid rgb(var(--color-gray-700));
  }

  .vc-base-select select:hover {
    background-color: #3b3f46;
  }
}
</style>
