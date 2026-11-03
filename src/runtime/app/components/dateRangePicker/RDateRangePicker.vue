<template>
  <div  class="oc-date-range-picker-container" :style="{'--oc-min-width' : minwidth}">
    <RDatePicker v-model="date" date-range-picker :attributes="attributes" :min-date="minDate" :max-date="maxDate"
      :columns="props.columns" :placeholder="placeholder" v-if="!predefined" />

    <UPopover v-else ref="refPopover" v-model:open="isOpen" :popper="{ placement: 'bottom-start' }" :ui="{
      background: 'color-bg-content',
      rounded: 'ocs-rounded border-color-input',
      shadow: '',
      ring: ''
    }">
      <UInput v-if="date?.start && date?.end" readonly :placeholder="placeholder" :ui="defaultUI" size="xs"
        :modelValue="`${ocdate(date.start).format()} - ${ocdate(date.end).format()}`" icon="ri-calendar-schedule-line"
        trailing autocomplete="off" inputClass="ocs-input-date cursor-pointer" />

      <UInput v-else readonly :placeholder="placeholder" :ui="defaultUI" size="xs" icon="ri-calendar-schedule-line"
        trailing autocomplete="off" inputClass="ocs-input-date cursor-pointer" />

      <template #panel="{ close }">
        <div class="flex items-center sm:divide-y-0 divide-y sm:divide-x predefined-container divide-custom-color">
          <div class="flex flex-col py-4" v-if="predefined">
            <div class="whitespace-nowrap min-w-fit" v-for="(range, index) in ranges" :key="index">
              <UButton :key="index" :label="$t(range.label)" color="gray" variant="ghost" class="rounded-none px-6 w-full"
                :class="['button-predefined',
                  isRangeSelected(range.duration, range.isLast) ? 'color-primary' : ' ',
                ]" truncate @click="selectRange(range.duration, range.isLast)" />
            </div>
          </div>

          <div class="grid items-center divide-y divide-custom-color">
            <RDatePicker ref="refDatePicker" v-model="tempDate" date-range-picker :attributes="attributes" :min-date="minDate"
              :max-date="maxDate" :columns="props.columns" :predefined="predefined" />
            <RBtns :data="listBtns" @click="(type) => fnClickListBtn(type)" class="p-1.5 justify-end" />
          </div>
        </div>

      </template>
    </UPopover>
  </div>
</template>
<script setup>
import { sub, format, isSameDay, add } from "date-fns";
const { t } = useI18n();
const isOpen = ref(false);

const props = defineProps({
  range: null,
  predefined: Boolean,
  format: String,
  attributes: Object,
  minwidth: String,
  ui: null,
  label: null,
  minDate: null,
  maxDate: null,
  columns: null,
  placeholder: null,
});

const date = defineModel({ default: { start: null, end: null } });

const defaultRange = [
  { label: "todal", duration: { day: 0 }, isLast: false },
  { label: "yesterday", duration: { days: 1 }, isLast: true },
  { label: "tomorrow", duration: { days: 1 }, isLast: false },
  { label: "last_7_days", duration: { days: 7 }, isLast: true },
  { label: "next_7_days", duration: { days: 7 }, isLast: false },
  { label: "last_30_days", duration: { days: 30 }, isLast: true },
  { label: "next_30_days", duration: { days: 30 }, isLast: false },
  // { label: "custom", duration: { }, isLast: 'custom' },
];

const ranges = computed(() => {
  if (props.range && props.range.length) {
    return [...defaultRange, ...props.range];
  } else {
    return defaultRange;
  }
});

const predefined = computed(() => props.predefined);

const formatDate = computed(() => props.format);

const ui = computed(() => {
  const defaultUI = {
    base: `color-bg-content color-w-b-1 border-color-input !ring-0 ring-inset w-full !justify-between `,
    rounded: "ocs-rounded-m",
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
  wrapper: 'relative w-full',
  placeholder: "placeholder:text-xs",
  base: "color-w-b-1 text-left ",
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

const label = computed(() => props.label);

const minDate = computed(() => props.minDate);

const maxDate = computed(() => props.maxDate);

const attributes = computed(() => props.attributes);

const refPopover = ref()

const listBtns = [
  { type: "cancel", label: t("cancel"), color: "cancel", icon: "cancel", noIcon: true },
  { type: "create", label: t("ok"), color: "create", icon: "create", noIcon: true },
]

const tempDate = ref({ start: null, end: null })

const refDatePicker = ref()
mounted(() => {
  tempDate.value = copyWith(date.value)
});

watch(()=>date.value,(n)=>{
  if (n) {
    tempDate.value = copyWith(n)
  }
},{deep:true})

watch(isOpen, (n) => {
  tempDate.value = copyWith(date.value)
})


function fnClickListBtn(type) {
  if (type == 'create') {
    date.value = copyWith(tempDate.value)
  } else if (type == 'cancel') {
    tempDate.value = copyWith(date.value)
  }
  isOpen.value = false
}

function isRangeSelected(duration, isLast) {
  if (isLast == true) {
    return (
      isSameDay(tempDate.value?.start, sub(new Date(), duration)) &&
      isSameDay(tempDate.value?.end, new Date())
    );
  } else if(isLast == false) {
    return (
      isSameDay(tempDate.value?.start, new Date()) &&
      isSameDay(tempDate.value?.end, add(new Date(), duration))
    );
  }
  // else if(isLast == 'custom'){
  //   // return true
  //   return !!tempDate.value.start && !!tempDate.value.end;
  // }
}

function selectRange(duration, isLast) {
  if (isLast == true) {
    tempDate.value = { start: sub(new Date(), duration), end: new Date() };
  } else if(isLast == false) {
    tempDate.value = { start: new Date(), end: add(new Date(), duration) };
  } 
  // else if(isLast == 'custom'){
  //   //  tempDate.value = { start: null, end: null };
  // }
  setTimeout(async() => {
    // console.log(isLast,'---->>>>',tempDate.value)
    await refDatePicker.value?.datePicker()?.move(tempDate.value?.start);
  }, 100);
}

</script>

<style lang="scss" scoped>
.oc-date-range-picker-container {
  min-width: var(--oc-min-width) !important;
}


.divide-custom-color> :not([hidden])~ :not([hidden]) {
  border-color: var(--color-w-b-4) !important;
}

.predefined-container {
  .button-predefined {
    &:hover {
      background-color: #f9f9f9 !important;
    }
  }
}

.dark {
  .predefined-container {
    .button-predefined {
      &:hover {
        background-color: #292929 !important;
      }
    }
  }
}

.date-range-picker-container {
  border-radius: 10px;
  position: absolute;
  transform: translate(0px, 10px);
  z-index: 30;
}

.vc-light {
  .vc-attr {
    --vc-highlight-light-bg: var(--vc-accent-400); // override
    --vc-highlight-light-content-color: var(--vc-accent-100); // override
    --vc-highlight-solid-bg: var(--vc-accent-500); // override
  }
}

.vc-day-content.vc-primary {
  &:hover {
    background-color: hsla(211, 25%, 84%, 0.3);
  }
}
</style>
