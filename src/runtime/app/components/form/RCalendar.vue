<script setup lang="ts">
import type { CalendarDate,DateValue } from '@internationalized/date'
import { defu } from 'defu'
import { computed,onMounted ,ref} from 'vue'
interface Props {
  modelValue?: CalendarDate | null
  minValue?: CalendarDate
  maxValue?: CalendarDate
  ui?: null | Record<string, unknown>
  range?: boolean
  numberOfMonths?: number
  type?: 'date' | 'date-time' | 'week' | 'month' | 'year'
  monthControls?: boolean
  yearControls?: boolean
  viewControl?: boolean
  weekNumbers?: boolean
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral' | 'info' | 'danger' | 'cyan' | 'teal' | 'pink' | 'purple' | 'orange'
  variant?: 'soft' | 'solid' | 'outline' | 'link' | 'ghost' | 'subtle' | 'ringed'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  disabled?: boolean
  // isDateUnavailable?: boolean
  // isMonthDisabled?: boolean
  // isYearDisabled?: boolean
  // isMonthUnavailable?: boolean
  // isYearUnavailable?: boolean
  isDayChip?: boolean
  isDateUnavailable?: (date: DateValue) => boolean
  isMonthDisabled?: (date: DateValue) => boolean
  isYearDisabled?: (date: DateValue) => boolean
  isMonthUnavailable?: (date: DateValue) => boolean
  isYearUnavailable?: (date: DateValue) => boolean
  
}

const props = withDefaults(defineProps<Props>(), {
  ui: null,
  range: false,
  numberOfMonths: 1,
  monthControls: true,
  yearControls: true,
  type: 'date',
  viewControl: true,
  weekNumbers: false,
  color: 'primary',
  variant: 'soft',
  size: 'md',
  disabled: false,
  // isDateUnavailable: false,
  // isMonthDisabled: false,
  // isYearDisabled: false,
  // isMonthUnavailable: true,
  // isYearUnavailable: false,
  isDayChip: false,

  isDateUnavailable: undefined,
  isMonthDisabled: undefined,
  isYearDisabled: undefined,
  isMonthUnavailable: undefined,
  isYearUnavailable: undefined,
})

const emit = defineEmits<{
  'update:modelValue': [CalendarDate | null]
  'select':[CalendarDate | null]
  'update:month':[{ month: number, year: string }]
}>()

// Add month tracking
// Add month tracking
const currentMonth = ref<string>('')
const currentYear = ref<string>('')

const value = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})
// const isDateUnavailable = (date: DateValue) => {
//   return date.day >= 10 && date.day <= 16
// }
const isDateUnavailable = computed(() => props.isDateUnavailable ? props.isDateUnavailable : (date: DateValue) => false)
const isMonthDisabled = computed(() => props.isMonthDisabled ? props.isMonthDisabled : (date: DateValue) => false)
const isYearDisabled = computed(() => props.isYearDisabled ? props.isYearDisabled : (date: DateValue) => false)
const isMonthUnavailable = computed(() => props.isMonthUnavailable ? props.isMonthUnavailable : (date: DateValue) => false)
const isYearUnavailable = computed(() => props.isYearUnavailable ? props.isYearUnavailable : (date: DateValue) => false)

function onUpdate(value: CalendarDate) {
  emit('update:modelValue', value)
  emit('select', value)
}
function onMonthChange({ month, year }: { month: number, year: string }) {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December']
  currentMonth.value = monthNames[month - 1]
  currentYear.value = year
  emit('update:month', { month, year })
}

// Trigger navigation by finding and clicking the actual buttons
// ── Navigation methods ──────────────────────────────────────────────────
function triggerNav(direction: 'prev-year' | 'prev-month' | 'next-month' | 'next-year') {
  const calendarEl = document.querySelector('.rcalendar-wrapper')
  if (!calendarEl) return
  
  const buttons = calendarEl.querySelectorAll('button')
  const ariaLabels: Record<string, string> = {
    'prev-year': 'Previous year',
    'prev-month': 'Previous month', 
    'next-month': 'Next month',
    'next-year': 'Next year'
  }
  
  const targetLabel = ariaLabels[direction]
  for (const btn of buttons) {
    if (btn.getAttribute('aria-label') === targetLabel) {
      btn.click()
      break
    }
  }
}

// Initialize month/year on mount
// ── Lifecycle ───────────────────────────────────────────────────────────
onMounted(() => {
  // Initialize with current date
  const now = new Date()
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December']
  currentMonth.value = monthNames[now.getMonth()]
  currentYear.value = String(now.getFullYear())
})

function getColorByDate(date: Date) {
  const isWeekend = date.getDay() % 6 == 0
  const isDayMeeting = date.getDay() % 3 == 0

  if (isWeekend) {
    return undefined
  }

  if (isDayMeeting) {
    return 'error'
  }

  return 'success'
}

const defaultUI = {
  root: 'rcalendar rdp-calendar p-2 border-4 border-red-500 bg-transparent',
  header: 'rcalendar-header mb-4 bg-yellow-200',
  heading: 'rcalendar-heading font-semibold text-[12px] text-red-500',
  grid: 'rcalendar-grid w-full border-collapse select-none space-y-1 focus:outline-none',
  gridRow: 'rcalendar-grid-row grid grid-cols-7 place-items-center',
  gridWeekDaysRow: 'rcalendar-grid-week-days-row mb-4 grid w-full grid-cols-7',
  gridBody: 'rcalendar-grid-body grid',
  headCellWeek: 'text-xs text-muted',
  cellWeek: 'relative text-center text-muted',
  cell: 'relative text-center',
  cellTrigger: [
    'rdp-calendar-day',
    'size-9',
    'rounded-full',
    'transition-all',
    'hover:bg-primary-50',
    'data-[selected]:bg-primary',
    'data-[selected]:text-white',
    'transition-colors'
  ],
  prevButton: 'hidden rounded-xl border border-[var(--c-border)]',
  nextButton: ' hiddenrounded-xl border border-[var(--c-border)]',
  prev: 'hidden rounded-xl bg-black-500 border',
  next: 'hidden rounded-xl border'
}

// const ui  = {
//   ...(props.ui) , ...defaultUI
// }
// const mergedUi = computed(() => ({
//   ...defaultUI,
//   ...(props.ui ?? {}),
// }))

const mergedUi = computed(() =>
  defu(props.ui ?? {}, defaultUI)
)


// Expose navigation methods to parent via slot
const calendarRef = ref(null)

// We need to access UCalendar's internal methods
// This will be passed to the slot
function getNavigationMethods() {
  // These will be overridden by the UCalendar instance
  return {
    prevYear: () => {},
    prevMonth: () => {},
    nextMonth: () => {},
    nextYear: () => {},
  }
}

const navMethods = ref({
  prevYear: () => {},
  prevMonth: () => {},
  nextMonth: () => {},
  nextYear: () => {},
})

// When UCalendar mounts, we need to capture its methods
// This is a workaround - ideally UCalendar would expose these
onMounted(() => {
  // Try to get the calendar instance
  const calendarEl = document.querySelector('.rcalendar')
  if (calendarEl) {
    // We'll use the prev/next buttons that UCalendar renders
    // But since we can't directly access methods, we'll use DOM events
  }
})
</script>

<template>
   <!-- Wrap UCalendar to capture navigation events -->
  <div class="rcalendar-wrapper">
   <!-- Navigation slot - will be rendered above the calendar -->
    <!-- <slot 
      name="navigation" 
      :prev-year="() => triggerNav('prev-year')"
      :prev-month="() => triggerNav('prev-month')"
      :next-month="() => triggerNav('next-month')"
      :next-year="() => triggerNav('next-year')"
      :month="currentMonth"
      :year="currentYear"
    >
      Default navigation (no tooltips) if no slot provided
      <div class="default-nav">
        <RTooltip :text="tBy({ en: 'Previous year', km: 'ឆ្នាំមុន' })">
          <button @click="triggerNav('prev-year')">«</button>
        </RTooltip>
        <RTooltip :text="tBy({ en: 'Previous month', km: 'ខែមុន' })">
          <button @click="triggerNav('prev-month')">‹</button>
        </RTooltip>
        <span>{{ currentMonth }} {{ currentYear }}</span>
        <RTooltip :text="tBy({ en: 'Next month', km: 'ខែបន្ទាប់' })">
          <button @click="triggerNav('next-month')">›</button>
        </RTooltip>
        <RTooltip :text="tBy({ en: 'Next year', km: 'ឆ្នាំបន្ទាប់' })">
          <button @click="triggerNav('next-year')">»</button>
        </RTooltip>
      </div>
    </slot> -->

    <!-- UCalendar component -->
    <UCalendar
      v-model="value"
      mode="date"
      show-month-dropdown
      show-year-dropdown
      :min-value="minValue"
      :max-value="maxValue"
      :range="range"
      :number-of-months="numberOfMonths"
      :type="type"
      :month-controls="monthControls"
      :year-controls="yearControls"
      :view-control="viewControl"
      :week-numbers="weekNumbers"
      :color="color"
      :variant="variant"
      :size="size"
      :disabled="disabled"
      :is-month-unavailable="isMonthUnavailable"
      :is-year-unavailable="isYearUnavailable"
      :is-month-disabled="isMonthDisabled"
      :is-year-disabled="isYearDisabled"
      :ui="mergedUi"
      @update:model-value="onUpdate"
      @update:month="onMonthChange"

      :prev-year="{
        icon: 'ri-arrow-left-double-line',
        color: 'primary',
        variant: 'soft',
        class: 'cursor-pointer h-7 w-7 flex justify-center items-center hover:dark:bg-red-500 hover:bg-red-500',
        size:'sm'
      }"
      :next-year="{
        icon: 'ri-arrow-right-double-line',
        color: 'primary',
        variant: 'soft',
        class: 'cursor-pointer h-7 w-7 flex justify-center items-center ',
        size:'sm'
      }"
      
      :prev-month="{
        icon: 'ri-arrow-left-s-line',
        color: 'primary',
        variant: 'soft',
        class: 'cursor-pointer h-7 w-7 flex justify-center items-center',
        size:'sm',
      }"
      :next-month="{
        icon: 'ri-arrow-right-s-line',
        color: 'primary',
        variant: 'soft',
        class: 'cursor-pointer h-7 w-7 flex justify-center items-center',
        size:'sm'
      }"
    >
      <!-- :is-date-unavailable="isDateUnavailable" -->
    <template v-if="$slots.heading" #heading="{ month }">
      <slot name="heading" :month="month">
        <div class="">
        <div>{{ console.log("Month slot ==========> ", month) }}</div>
      </div>
    </slot>
    </template>

    <template #day="{ day }">
      <slot name="day" :day="day">
        <UChip v-if="isDayChip" :inset="false" position="top-right" :show="!!getColorByDate(day.toDate('UTC'))" :color="getColorByDate(day.toDate('UTC'))" size="2xs" 
        class="calendar-chip"
        >
          <span class="text-[var(--c-text)]">{{ day.day }}</span>
        </UChip>
        <span v-else>{{ day.day }}</span>
      </slot>
    </template>

    <template v-if="$slots['week-day']" #week-day="{day}">
      <slot name="week-day" :day="day">
        <span class="">{{ day }}</span>
      </slot>
    </template>

    <template v-if="$slots['month-cell']" #month-cell="{month,selected,disabled}">
      <slot name="month-cell" :month="month" :selected="selected" :disabled="disabled">
        <span v-if="disabled" class="opacity-50">{{ month }}</span>
        <UChip v-else-if="selected" :show="!!selected" :color="color" size="2xs">
          {{ month.value }}
        </UChip>
        <span v-else>{{ month.value }}</span>
      </slot>
    </template>

    <template v-if="$slots['year-cell']" #year-cell="{year,selected,disabled}">
      <slot name="year-cell" :year="year" :selected="selected" :disabled="disabled">
        <span v-if="disabled" class="">{{ year }}</span>
        <UChip v-else-if="selected" :show="!!selected" :color="color" size="2xs">
          {{ year.value }}
        </UChip>
        <span v-else>{{ year.value }}</span>
      </slot>
    </template>

    <template v-if="$slots['prev-year']" #prev-year="{isDisabled}">
      <slot name="prev-year" :isDisabled="isDisabled">
        <div>Prev Year></div>
      </slot>
    </template>
    <template v-if="$slots['next-year']" #next-year="{isDisabled}">
      <slot name="next-year" :isDisabled="isDisabled">
        <div>Next Year></div>
      </slot>
    </template>
  </UCalendar>
<!-- 
  <UCalendar
  :model-value="modelValue"
  :min-value="minValue"
  :max-value="maxValue"
  :range="range"
  :number-of-months="numberOfMonths"
  :ui="mergedUi"
  @update:model-value="onUpdate"
/> -->

</div>
</template>


<style scoped lang="scss">
.calendar-chip {
  :deep([data-slot="base"]) {
    position: absolute;
    top: -7px;
    right: -17px;
    width: 10px !important;
    height: 10px !important;
    min-width: 10px !important;
    padding: 0 !important;
    border-radius: 9999px !important;
  }
}

.rcalendar-wrapper {
  width: 100%;
}

.default-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px 12px;
  gap: 4px;
  
  button {
    width: 32px;
    height: 32px;
    border: 1px solid var(--c-border);
    border-radius: 8px;
    background: transparent;
    color: var(--c-text);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    
    &:hover {
      border-color: var(--c-accent);
      color: var(--c-accent);
      background: rgba(255, 140, 66, 0.08);
    }
  }
  
  span {
    font-weight: 500;
    font-size: 0.9rem;
    color: var(--c-text);
    flex: 1;
    text-align: center;
  }
}

.rcalendar {
  background: var(--bg-content);
  :deep([data-slot="prev-button"]),

  :deep([data-slot="next-button"]) {
    width: 22px !important;
    height: 22px !important;
  // }
  // :deep(button[aria-label*="Previous"]),
  // :deep(button[aria-label*="Next"]) {
    // width: 22px !important;
    // height: 22px !important;
    min-width: 22px !important;
    padding: 0 !important;
    display:flex;
    justify-content: center;
    align-items: center;
    gap:4px;

    margin: 10px 0 !important;
    border-radius: 8px;
    background: var(--c-surface);
    // border: 0.5px solid var(--c-border);
  }

  :deep(button[aria-label*="Previous"]:hover),
  :deep(button[aria-label*="Next"]:hover) {
    background: var(--c-primary-50);
  }

  //override cell day
  :deep([data-slot="cellTrigger"]){
    width: 36px !important;
    height: 36px !important;
    border-radius: 100%; 
    display: flex;
    justify-content: center;
    align-items: center;
    // background-color: var(--color-primary-300) !important;
    color: var(--c-text) !important;
  }
  // :deep([data-slot="cellTrigger"]):hover{
  //   background-color: var(--c-content-hover) !important;
  //   color: var(--c-text-hover) !important;
  // }

  :deep([data-slot="heading"]){
    color: var(--c-text) !important;
  }
}


// .calendar-nav-btn {
//   width: 32px;
//   height: 32px;
//   padding: 0;
// }

// .calendar-header {
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   gap: 4px;
// }


.rdp-calendar {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 16px;
  padding: 15px;
  margin: 10px;
  // margin: 4px;
}

// .rdp-calendar-day {
//   width: 36px;
//   height: 36px;
//   border-radius: 100%;
//   display: flex;
//   justify-content: center;
//   align-items: center;
//   background-color: black !important;
//   color: white !important;
// }
</style>
