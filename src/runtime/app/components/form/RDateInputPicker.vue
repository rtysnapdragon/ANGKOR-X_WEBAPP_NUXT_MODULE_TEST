<script setup lang="ts">
/**
 * RDateInputPicker — SARIKA single date picker, NuxtUI 4.8.2
 *
 * ROOT CAUSE (confirmed from reka-ui source):
 *   DateFieldRoot calls: passive = props.modelValue === void 0
 *   When passive=true, vueuse useVModel does: const proxy = ref(defaultDate.copy())
 *   ref() deep-proxies CalendarDate → .set() returns undefined → crash.
 *
 * THE FIX:
 *   1. Always pass a real CalendarDate (never undefined/null) to :model-value
 *      on DateField.Root — use today() as the "empty" placeholder value.
 *   2. Track selected state separately with a boolean `hasValue`.
 *   3. toRaw() every CalendarDate before it crosses any component boundary.
 *   4. On @update:model-value from UInputDate, only update if it differs
 *      from the placeholder (so navigating months doesn't set a value).
 *
 * Usage:
 *   <RDateInputPicker v-model="date" label="Pick a date" />
 *   date: shallowRef<CalendarDate | null>(null)
 */
import { shallowRef, computed, watch, toRaw } from 'vue'
import { CalendarDate, today, getLocalTimeZone, parseDate, parseDateTime } from '@internationalized/date'
import type { DateValue } from '@internationalized/date'
import { useI18n } from 'vue-i18n'

// ── Props ─────────────────────────────────────────────────────────────────
const props = withDefaults(defineProps<{
  modelValue?:    DateValue | Date | string | null
  label?:         string
  labelKm?:       string
  placeholder?:   string
  placeholderKm?: string
  hint?:          string
  error?:         string
  size?:          'xs' | 'sm' | 'md' | 'lg' | 'xl'
  required?:      boolean
  disabled?:      boolean
  clearable?:     boolean
  readonly?:      boolean
  minValue?:      DateValue | Date | string
  maxValue?:      DateValue | Date | string
  ui?:            Record<string, unknown>
}>(), {
  size:      'sm',
  clearable: true,
})

const emit = defineEmits<{
  'update:modelValue': [val: CalendarDate | null]
  change:              [val: CalendarDate | null]
  clear:               []
  blur:                []
}>()

// ── Value coercion ────────────────────────────────────────────────────────
// reka-ui's getDefaultDate() calls `value.copy()` on whatever reaches
// DateFieldRoot/CalendarRoot. Strings, plain {year,month,day} objects, JS
// Dates, empty strings, etc. have no .copy → throw
// "defaultValue.copy is not a function". Normalise EVERY inbound value to a
// real DateValue (CalendarDate) or null (null/undefined/''/unparseable).
function isDateValue(v: unknown): v is DateValue {
  const d = v as Partial<DateValue> | null
  return !!d && typeof (d as { copy?: unknown }).copy === 'function'
    && typeof d.year === 'number' && typeof d.month === 'number' && typeof d.day === 'number'
}

function toCalendarDate(v: unknown): CalendarDate | null {
  if (v === null || v === undefined || v === '') return null
  if (isDateValue(v)) return toRaw(v) as CalendarDate
  if (v instanceof Date) {
    return Number.isNaN(v.getTime())
      ? null
      : new CalendarDate(v.getFullYear(), v.getMonth() + 1, v.getDate())
  }
  if (typeof v === 'string') {
    try {
      const parsed = v.includes('T') ? parseDateTime(v) : parseDate(v)
      return new CalendarDate(parsed.year, parsed.month, parsed.day)
    } catch {
      return null
    }
  }
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>
    if (typeof o.year === 'number' && typeof o.month === 'number' && typeof o.day === 'number')
      return new CalendarDate(o.year, o.month, o.day)
  }
  return null
}

const { locale } = useI18n()
const isOpen = ref(false)
// ── Internal state ────────────────────────────────────────────────────────
// shallowRef = no deep proxy on CalendarDate instances
const EMPTY = today(getLocalTimeZone()) // stable fallback placeholder
const selected  = shallowRef<CalendarDate | null>(
  toCalendarDate(props.modelValue)
)

// CRITICAL: The value fed into UInputDate must NEVER be undefined or null.
// Reka-UI goes into passive mode when modelValue===undefined and creates
// a deep ref() of the default date — breaking .set() on CalendarDate.
// Always give it a real CalendarDate. Use `selected ?? EMPTY`.
const inputValue = computed((): CalendarDate =>
  selected.value ? toRaw(selected.value) : toRaw(EMPTY)
)

// Keep in sync with parent
watch(() => props.modelValue, v => {
  selected.value = toCalendarDate(v)
})

// Emit up
watch(selected, v => {
  emit('update:modelValue', v)
  emit('change', v)
})

// ── Handlers ──────────────────────────────────────────────────────────────
function onInputUpdate(raw: unknown) {
  // UInputDate emits the new CalendarDate — coerce + strip proxy before storing
  const v = toCalendarDate(raw)
  if (!v) return
  selected.value = v
}

function onCalendarUpdate(raw: unknown) {
  const v = toCalendarDate(raw)
  if (!v) return
  selected.value = v
}

function setToday() {
  selected.value = toRaw(today(getLocalTimeZone()))
}

function clearValue() {
  selected.value = null
  emit('clear')
}

// ── Display helpers ────────────────────────────────────────────────────────
const displayLabel = computed(() =>
  locale.value === 'km' && props.labelKm ? props.labelKm : props.label,
)

const displayPlaceholder = computed(() =>
  locale.value === 'km' && props.placeholderKm
    ? props.placeholderKm
    : (props.placeholder ?? 'Select a date'),
)

const formattedDate = computed(() => {
  if (!selected.value) return null
  const d = selected.value
  return new Date(d.year, d.month - 1, d.day).toLocaleDateString(
    locale.value === 'km' ? 'km-KH' : 'en-US',
    { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' },
  )
})

const inputDate = useTemplateRef('inputDate')
// Raw min/max — must also be coerced + stripped of proxy
const rawMin = computed(() => props.minValue ? toCalendarDate(props.minValue) ?? undefined : undefined)
const rawMax = computed(() => props.maxValue ? toCalendarDate(props.maxValue) ?? undefined : undefined)
const sizeClasses = computed(() => ({
  xs: '32px',
  sm: '38px',
  md: '44px',
  lg: '48px',
  xl: '56px'
}))

const inputHeight = computed(() => {
  return sizeClasses.value[props.size] || '38px'
})

watch(selected, (newVal, oldVal) => {
  if (newVal && newVal !== oldVal) {
    isOpen.value = false
  }
})

const defaultUI = {
  base: [
    'rdp-input-base', // bind with scss global
    'w-full',
    'rounded-[14px]',  // 15px not work bz of not in tailwind
    'border',
    'bg-[var(--c-surface)]',
    'border-[var(--c-border)]',
    'text-[var(--c-text)]',
    'transition-all duration-200',
    'focus-within:border-[var(--c-accent)]',
    'focus-within:ring-2',
    'focus-within:ring-[var(--c-accent)]/20',
    // 'border-4 border-red-500 bg-yellow-100'
  ],
  // size: {
  //   md: {
  //     base: [
  //       'px-2.5 py-1.5 text-base/5'
  //     ]
  //   }
  // },
  // segment: [
  //   'rounded',
  //   'text-center',
  //   'outline-none',
  //   'transition-colors',
  //   'data-placeholder:text-[var(--c-muted)]',
  //   'data-invalid:text-red-500',
  //   'data-disabled:opacity-50',
  //   'flex items-center justify-center',
  //   'h-full',
  // ],

  leading: 'absolute inset-y-0 start-0 flex items-center',

  trailing: 'rdp-input-trailing',
  // trailing: 'hidden',
  separatorIcon: 'shrink-0 text-[var(--c-muted)]'
}
// const mergedUi = computed(() => ({
//   ...defaultUI,
//   ...(props.ui ?? {}),
// }))

import { defu } from 'defu'

const mergedUi = computed(() =>
  defu(props.ui || {}, defaultUI)
)
// const calendarUI = {
//   root: 'rdp-calendar border-4 border-red-500 bg-transparent',
//   header: 'mb-4 bg-yellow-200',
//   heading: 'font-semibold text-[12px] text-red-500 text-xl',
//   grid: 'w-full border-collapse select-none space-y-1 focus:outline-none',
//   gridRow: 'grid grid-cols-7 place-items-center',
//   gridWeekDaysRow: 'mb-4 grid w-full grid-cols-7',
//   gridBody: 'grid',
//   headCellWeek: 'text-xs text-muted',
//   cellWeek: 'relative text-center text-muted',
//   cell: 'relative text-center',
//   cellTrigger: [
//     'rdp-calendar-day',
//     'size-9',
//     'rounded-xl',
//     'transition-all',
//     'hover:bg-primary-50',
//     'data-[selected]:bg-primary',
//     'data-[selected]:text-white'
//   ],
//   prevButton: 'rounded-xl border border-[var(--c-border)]',
//   nextButton: 'rounded-xl border border-[var(--c-border)]',
//   prev: 'rounded-xl bg-black-500 border',
//   next: 'rounded-xl border'
// }
</script>

<template>
  <div
    :class="[
      'rdp',
      `rdp--${size}`,
      {
        'rdp--disabled': disabled,
        'rdp--error':    !!error,
        'rdp--readonly': readonly,
        'rdp--filled':   !!selected,
      },
    ]"
  >
    <!-- Label row -->
    <div v-if="displayLabel || (hint && !error)" class="rdp__label-row">
      <label v-if="displayLabel" class="rdp__label">
        {{ displayLabel }}
        <span v-if="required" class="rdp__required" aria-hidden="true">*</span>
      </label>
      <span v-if="hint && !error" class="rdp__hint">{{ hint }}</span>
    </div>

    <!-- Input -->
    <div class="rdp__field">
      <UInputDate
        :model-value="inputValue"
        :disabled="disabled"
        :readonly="readonly"
        :min-value="rawMin"
        :max-value="rawMax"
        :ui="mergedUi"
        class="rdp__input"
        @update:model-value="onInputUpdate"
        @blur="emit('blur')"
      >
        <template #leading v-if="$slots.leading">
          <slot name="leading" />
        </template>

        <template #trailing>
          <div class="rdp__trailing">
            <!-- Clear -->
            <Transition name="rdp-fade">
              <button
                v-if="clearable && selected"
                type="button"
                class="rdp__clear"
                aria-label="Clear date"
                tabindex="-1"
                @click.stop="clearValue"
              >
                <UIcon name="i-lucide-x" />
              </button>
            </Transition>

            <!-- Calendar popover -->
            <UPopover v-model:open="isOpen" :ui="{ content: 'rdp-pop' }" :reference="inputDate?.inputsRef[3]?.$el">
              <button
                type="button"
                :disabled="disabled || readonly"
                :class="['rdp__cal-btn', { 'rdp__cal-btn--active': !!selected }]"
                aria-label="Open calendar"
              >
                <i class="ri ri-calendar-line" />
              </button>

              <template #content>
                <div class="rdp-pop__inner">
                  <!-- Quick actions -->
                  <div class="rdp-pop__quick">
                    <button type="button" class="rdp-pop__chip" @click="setToday">
                      <i class="ri ri-calendar-check-line" />
                      {{ locale === 'km' ? 'ថ្ងៃនេះ' : 'Today' }}
                    </button>
                    <button
                      v-if="selected"
                      type="button"
                      class="rdp-pop__chip rdp-pop__chip--danger"
                      @click="clearValue"
                    >
                      <i class="ri ri-trash-2-line" />
                      {{ locale === 'km' ? 'លុបចោល' : 'Clear' }}
                    </button>
                  </div>

                  <div class="rdp-pop__sep" />

                  <!-- Calendar — same fix: pass raw computed value -->
                  <!-- <UCalendar
                    :model-value="inputValue"
                    :min-value="rawMin"
                    :max-value="rawMax"
                    :ui="calendarUI"
                    class="rdp-pop__cal p-2"
                    @update:model-value="onCalendarUpdate"
                  >
       
                  </UCalendar> -->
                  
                  <RCalendar
                   v-model="selected"
                   :min-value="rawMin"
                   :max-value="rawMax"
                   @update:model-value="onCalendarUpdate"
                   @select="isOpen = false"
                   />
                  <!-- Footer -->
                  <div class="rdp-pop__footer">
                    <UIcon
                      :name="selected ? 'i-lucide-check-circle-2' : 'i-lucide-calendar'"
                      :class="selected ? 'text-[--c-success]' : 'text-[--c-muted]'"
                    />
                    <span class="rdp-pop__date-label">
                      {{ formattedDate ?? (locale === 'km' ? 'មិនទាន់ជ្រើស' : 'No date selected') }}
                    </span>
                  </div>
                </div>
              </template>
            </UPopover>
          </div>
        </template>
      </UInputDate>
    </div>

    <!-- Error -->
    <Transition name="rdp-fade">
      <p v-if="error" class="rdp__error" role="alert">
        <UIcon name="i-lucide-alert-circle" />
        {{ error }}
      </p>
    </Transition>
  </div>
</template>

<style lang="scss" scoped>

.rdp {
  display:        flex;
  flex-direction: column;
  gap:            6px;
  font-family:    var(--font-400) !important;

  &--xs  { --rdp-fs: 0.72rem;  }
  &--sm  { --rdp-fs: 0.8rem;   }
  &--md  { --rdp-fs: 0.875rem; }
  &--lg  { --rdp-fs: 0.95rem;  }
  &--xl  { --rdp-fs: 1rem;     }

  &--disabled { opacity: 0.5; pointer-events: none; }
  &--readonly { cursor: default; }

  &--error .rdp__input :deep([data-slot="base"]) { //:deep() This is correct only inside a scoped style block:
    --tw-ring-color: var(--c-danger) !important;
    border-color: var(--c-danger) !important;
  }
}

// ── Label ──────────────────────────────────────────────────────────────────
.rdp__label-row {
  display:         flex;
  align-items:     baseline;
  justify-content: space-between;
}

.rdp__label {
  font-size:   0.82rem;
  font-weight: 500;
  color:       var(--c-text);
  display:     flex;
  gap:         3px;
  white-space: nowrap !important;
}

.rdp__required { color: var(--c-danger); }
.rdp__hint     { font-size: 0.72rem; color: var(--c-muted); }

// ── Error ──────────────────────────────────────────────────────────────────
.rdp__error {
  display:     flex;
  align-items: center;
  gap:         4px;
  font-size:   0.75rem;
  color:       var(--c-danger);
  margin:      0;
}
// .rdp-input-base {
//   :deep([data-segment="day"]),
//   :deep([data-segment="month"]),
//   :deep([data-segment="year"]) {
//     width: fit-content !important;
//     min-width: 0 !important;
//     flex: none !important;
//     padding-inline: 2px;
//   }
// }

:deep(.rdp-input-base) {
  [data-segment="day"],
  [data-segment="month"],
  [data-segment="year"] {
    width: fit-content !important;
    min-width: 0 !important;
    flex: none !important;
    padding-inline: 2px !important;
    // padding: 1px 2px !important;

    // background-color: var(--color-w-b-6);
  }
  [data-segment="day"]:focus,
  [data-segment="month"]:focus,
  [data-segment="year"]:focus {
    background-color: var(--color-w-b-6) !important;
  }

  [data-slot="trailing"] {  // not in this for padding-right, use outside instead;
    right: 0 !important;
    padding-right: 5px !important;
    background: transparent !important;
    font-size: 14px !important;
  }
}
// :deep(.rdp-input-base) { // work with clean
//   [data-segment] {
//     width: fit-content !important;
//     min-width: 0 !important;
//     flex: none !important;
//     padding-inline: 2px !important;

//     background-color: blue;
//   }

//   [data-segment]:focus {
//     background-color: green !important;
//   }
// }

// .rdp__input {
//   :deep([data-slot="trailing"]) {
//     display: none !important;
//   }
// }

// ── Input override ─────────────────────────────────────────────────────────
.rdp__input {
  width: 100%;
  font-size: var(--rdp-fs, 0.875rem);

  // Focus ring in accent color
  :deep([data-slot="base"]) {
    transition: border-color 0.18s, box-shadow 0.18s;

    &:focus-within {
      border-color: var(--c-accent) !important;
      box-shadow:   0 0 0 3px rgba(255,140,66,0.14) !important;
    }
  }

  // Segment highlight
  :deep([data-slot="segment"]) {
    padding: 4px !important;
    
    // [data-segment="day"],
    // [data-segment="month"],
    // [data-segment="year"] {
    //   // width: 400px !important;
    //   width: fit-content;
    //   min-width: fit-content;
    //   flex: 0 0 auto;
    // }
    &:focus, &[data-focused=""] {
      background:    var(--c-surface) !important;
      color:         var(--c-accent) !important;
      border-radius: 300px;
      outline:       none;
    }
  }
}

// ── Trailing ───────────────────────────────────────────────────────────────
.rdp__trailing {
  display:     flex;
  align-items: center;
  gap:         2px;
}

.rdp-input-trailing {
  // right: 0 !important;
  min-height: 100%;
  margin-right: 8px;
}

.rdp__clear {
  width:         20px;
  height:        20px;
  border:        none;
  border-radius: 50%;
  background:    rgba(248,113,113,0.1);
  color:         var(--c-danger);
  cursor:        pointer;
  display:       flex;
  align-items:   center;
  justify-content: center;
  padding:       0;
  font-size:     0.7rem;
  transition:    background 0.15s;

  &:hover { background: rgba(248,113,113,0.22); }
}

.rdp__cal-btn {
  width:         28px;
  height:        28px;
  // margin-right: 10px;
  border:        1px solid var(--c-border);
  border-radius: 8px;
  background:    transparent;
  color:         var(--c-muted);
  cursor:        pointer;
  display:       flex;
  align-items:   center;
  justify-content: center;
  padding:       0;
  transition:    border-color 0.15s, background 0.15s, color 0.15s;

  &:hover, &--active {
    border-color: var(--c-accent);
    background:   rgba(255,140,66,0.08);
    color:        var(--c-accent);
  }

  &:disabled { opacity: 0.4; cursor: not-allowed; }
}

// ── Transitions ────────────────────────────────────────────────────────────
.rdp-fade-enter-active, .rdp-fade-leave-active { transition: opacity 0.15s; }
.rdp-fade-enter-from,   .rdp-fade-leave-to     { opacity: 0; }

</style>

<!-- Popover teleports outside scoped — must be global -->
<style lang="scss">
// .rdp-input-base {
//   [data-slot="segment"] {
//     width: fit-content !important;
//     min-width: unset !important;
//     flex: 0 0 auto !important;
//     padding-inline: 2px;
//   }
// }

// .rdp-input-base {
//   [data-segment="day"],
//   [data-segment="month"],
//   [data-segment="year"] {
//     width: fit-content !important;
//     min-width: unset !important;
//     flex: 0 0 auto !important;
//   }
// }
// can override the NuxtUI style but need css class to base of ui of NuxtUI but need as global without scoped
.rdp-input-base {
  // min-height: 22px !important ; //base
  min-height: v-bind('inputHeight ?? "38px"') !important ; //base
  padding: 0 12px;
  background: var(--bg-content);
  border: 1px solid var(--c-border);
  border-radius: 12px;


  //   [data-slot="segment"] {
  //   width: fit-content !important;
  //   min-width: unset !important;
  //   flex: 0 0 auto !important;
  //   padding-inline: 2px;
  // }
  // [data-slot="segments"] {
  //   padding: 4px !important;
  //   [data-segment="day"] {
  //     min-width: 80px !important;
  //   }
  // }
  // [data-slot="segments"] {
  //   padding: 4px !important;

  //   [data-segment="day"],
  //   [data-segment="month"],
  //   [data-segment="year"] {
  //     width: 400px !important;
  //     // width: fit-content;
  //     // min-width: fit-content;
  //     // flex: 0 0 auto;
  //   }
  // }
}
// .rdp-input-base {  //f the component library is applying a larger min-width, you may need:
//   [data-segment="day"],
//   [data-segment="month"],
//   [data-segment="year"] {
//     min-width: unset !important;
//     width: fit-content !important;
//     flex: 0 0 auto !important;
//   }
// }
.rdp-pop {
  padding:       0 !important;
  overflow:      hidden;
  border:        1px solid var(--c-border) !important;
  // background:    var(--c-surface) !important;
  border-radius: 14px !important;
  box-shadow:    var(--glass-shadow) !important;
  min-width:     264px;
}

// .rdp-calendar {
//   background: var(--c-surface);
//   border: 1px solid var(--c-border);
//   border-radius: 16px;
// }

// .rdp-calendar-day {
//   width: 36px;
//   height: 36px;
//   border-radius: 10px;
// }

// ::deep(.rdp-input) {
//   height: 44px !important;
// }
.rdp-pop__inner {
  display:        flex;
  flex-direction: column;
  background-color: var(--bg-wrapper-cardBorder);
}

.rdp-pop__quick {
  display: flex;
  gap:     6px;
  padding: 10px 12px 8px;
}

// chip button action clear&today
.rdp-pop__chip {
  display:       flex;
  align-items:   center;
  gap:           5px;
  padding:       4px 10px;
  border:        1px solid var(--c-border);
  border-radius: 20px;
  background:    transparent;
  font-size:     0.73rem;
  color:         var(--c-text);
  cursor:        pointer;
  font-family:   var(--font-400) !important;
  transition:    all 0.15s;

  &:hover         { border-color: var(--c-accent); color: var(--c-accent); background: rgba(255,140,66,0.07); }
  &--danger:hover { border-color: var(--c-danger);  color: var(--c-danger);  background: rgba(248,113,113,0.07); }
}

.rdp-pop__sep {
  height: 1px;
  background: var(--c-border);
  margin: 0 12px;
}

// .rdp-pop__cal { padding: 10px 12px; }

.rdp-pop__cal {
  :deep([data-slot="prev-button"]),
  :deep([data-slot="next-button"]) {
    width: 10px !important;
    height: 10px !important;
    min-width: 32px !important;
    padding: 0 !important;
    border-radius: 8px;
  }
}

.rdp-pop__footer {
  border-top: 1px solid var(--c-border);
  padding:    8px 12px;
  display:    flex;
  align-items: center;
  gap:        6px;
}

.rdp-pop__date-label {
  font-size: 0.75rem;
  color:     var(--c-muted);
  font-family: var(--font-400) !important;
}
</style>