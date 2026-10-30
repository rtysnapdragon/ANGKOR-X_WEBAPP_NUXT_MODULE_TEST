<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'
import type { CalendarDate } from '@internationalized/date'
import { defu } from 'defu'
import { calendar } from '#build/ui'

type DateRange = {
  start?: CalendarDate | null
  end?: CalendarDate | null
}

interface Props {
  modelValue?: DateRange
  placeholder?: string
  disabled?: boolean
  required?: boolean
  error?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  ui?: Record<string, any>
  numberOfMonths?: number
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  placeholder: 'Select date range',
  numberOfMonths: 2
})

const emit = defineEmits<{
  'update:modelValue': [value: DateRange]
}>()

const inputDate = useTemplateRef('inputDate')

const model = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const defaultUi = {
  root: 'w-full',
  base: [
    'rdp-input', // bind with scss global
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
    'group relative inline-flex items-center rounded-md select-none',
    'transition-colors'
    // 'border-4 border-red-500 bg-yellow-100'
  ],
  // base: `
  //   rounded-xl
  //   border
  //   transition-all
  //   duration-200
  //   bg-[var(--c-surface)]
  //   border-[var(--c-border)]
  //   text-[var(--c-text)]
  //   shadow-sm
  //   hover:border-[var(--c-accent)]
  //   focus-within:border-[var(--c-accent)]
  //   focus-within:ring-2
  //   focus-within:ring-[var(--c-accent)]/15
  // `,

  trailing: 'pe-2',
    inputDate: {
      slots: {
        base: [
          'group relative inline-flex items-center rounded-md select-none',
          'transition-colors'
        ],
        leading: 'absolute inset-y-0 start-0 flex items-center',
        leadingIcon: 'shrink-0 text-dimmed',
        leadingAvatar: 'shrink-0',
        leadingAvatarSize: '',
        trailing: 'absolute inset-y-0 end-0 flex items-center',
        trailingIcon: 'shrink-0 text-dimmed',
        segment: [
          'rounded text-center outline-hidden data-placeholder:text-dimmed data-[segment=literal]:text-muted data-invalid:text-error data-disabled:cursor-not-allowed data-disabled:opacity-75',
          'transition-colors'
        ],
        separatorIcon: 'shrink-0 size-4 text-muted'
      },
      variants: {
        fieldGroup: {
          horizontal: 'not-only:first:rounded-e-none not-only:last:rounded-s-none not-last:not-first:rounded-none focus-visible:z-[1]',
          vertical: 'not-only:first:rounded-b-none not-only:last:rounded-t-none not-last:not-first:rounded-none focus-visible:z-[1]'
        },
        size: {
          xs: {
            base: [
              'px-2 py-1 text-sm/4 gap-1',
              'gap-0.25'
            ],
            leading: 'ps-2',
            trailing: 'pe-2',
            leadingIcon: 'size-4',
            leadingAvatarSize: '3xs',
            trailingIcon: 'size-4',
            segment: 'data-[segment=day]:w-2 data-[segment=month]:w-8 data-[segment=year]:w-10'
          },
          sm: {
            base: [
              'px-2.5 py-1.5 text-sm/4 gap-1.5',
              'gap-0.5'
            ],
            leading: 'ps-2.5',
            trailing: 'pe-2.5',
            leadingIcon: 'size-4',
            leadingAvatarSize: '3xs',
            trailingIcon: 'size-4',
            segment: 'data-[segment=day]:w-8 data-[segment=month]:w-8 data-[segment=year]:w-10'
          },
          md: {
            base: [
              'px-2.5 py-1.5 text-base/5 gap-1.5',
              'gap-0.5'
            ],
            leading: 'ps-2.5',
            trailing: 'pe-2.5',
            leadingIcon: 'size-5',
            leadingAvatarSize: '2xs',
            trailingIcon: 'size-5',
            segment: 'data-[segment=day]:w-9 data-[segment=month]:w-9 data-[segment=year]:w-11'
          },
          lg: {
            base: [
              'px-3 py-2 text-base/5 gap-2',
              'gap-0.75'
            ],
            leading: 'ps-3',
            trailing: 'pe-3',
            leadingIcon: 'size-5',
            leadingAvatarSize: '2xs',
            trailingIcon: 'size-5',
            segment: 'data-[segment=day]:w-9 data-[segment=month]:w-9 data-[segment=year]:w-11'
          },
          xl: {
            base: [
              'px-3 py-2 text-base gap-2',
              'gap-0.75'
            ],
            leading: 'ps-3',
            trailing: 'pe-3',
            leadingIcon: 'size-6',
            leadingAvatarSize: 'xs',
            trailingIcon: 'size-6',
            segment: 'data-[segment=day]:w-10 data-[segment=month]:w-10 data-[segment=year]:w-12'
          }
        },
        variant: {
          outline: 'text-highlighted bg-default ring ring-inset ring-accented',
          soft: 'text-highlighted bg-elevated/50 hover:bg-elevated focus:bg-elevated disabled:bg-elevated/50',
          subtle: 'text-highlighted bg-elevated ring ring-inset ring-accented',
          ghost: 'text-highlighted bg-transparent hover:bg-elevated focus:bg-elevated disabled:bg-transparent dark:disabled:bg-transparent',
          none: 'text-highlighted bg-transparent'
        },
        color: {
          primary: '',
          secondary: '',
          success: '',
          info: '',
          warning: '',
          error: '',
          neutral: ''
        },
        leading: {
          true: ''
        },
        trailing: {
          true: ''
        },
        loading: {
          true: ''
        },
        highlight: {
          true: ''
        },
        fixed: {
          false: ''
        },
        type: {
          file: 'file:me-1.5 file:font-medium file:text-muted file:outline-none'
        }
      },
      compoundVariants: [
        {
          variant: 'outline',
          class: {
            segment: 'focus:bg-elevated'
          }
        },
        {
          variant: 'soft',
          class: {
            segment: 'focus:bg-accented/50 group-hover:focus:bg-accented'
          }
        },
        {
          variant: 'subtle',
          class: {
            segment: 'focus:bg-accented'
          }
        },
        {
          variant: 'ghost',
          class: {
            segment: 'focus:bg-elevated group-hover:focus:bg-accented'
          }
        },
        {
          variant: 'none',
          class: {
            segment: 'focus:bg-elevated'
          }
        },
        {
          color: 'primary',
          variant: [
            'outline',
            'subtle'
          ],
          class: 'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary'
        },
        {
          color: 'primary',
          highlight: true,
          class: 'ring ring-inset ring-primary'
        },
        {
          color: 'neutral',
          variant: [
            'outline',
            'subtle'
          ],
          class: 'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-inverted'
        },
        {
          color: 'neutral',
          highlight: true,
          class: 'ring ring-inset ring-inverted'
        },
        {
          leading: true,
          size: 'xs',
          class: 'ps-7'
        },
        {
          leading: true,
          size: 'sm',
          class: 'ps-8'
        },
        {
          leading: true,
          size: 'md',
          class: 'ps-9'
        },
        {
          leading: true,
          size: 'lg',
          class: 'ps-10'
        },
        {
          leading: true,
          size: 'xl',
          class: 'ps-11'
        },
        {
          trailing: true,
          size: 'xs',
          class: 'pe-7'
        },
        {
          trailing: true,
          size: 'sm',
          class: 'pe-8'
        },
        {
          trailing: true,
          size: 'md',
          class: 'pe-9'
        },
        {
          trailing: true,
          size: 'lg',
          class: 'pe-10'
        },
        {
          trailing: true,
          size: 'xl',
          class: 'pe-11'
        },
        {
          loading: true,
          leading: true,
          class: {
            leadingIcon: 'animate-spin'
          }
        },
        {
          loading: true,
          leading: false,
          trailing: true,
          class: {
            trailingIcon: 'animate-spin'
          }
        },
        {
          fixed: false,
          size: 'xs',
          class: 'md:text-xs'
        },
        {
          fixed: false,
          size: 'sm',
          class: 'md:text-xs'
        },
        {
          fixed: false,
          size: 'md',
          class: 'md:text-sm'
        },
        {
          fixed: false,
          size: 'lg',
          class: 'md:text-sm'
        }
      ],
      defaultVariants: {
        size: 'md',
        color: 'primary',
        variant: 'outline'
      }
    }
  }

const mergedUi = computed(() =>({
  ...defaultUi,
  ...(props.ui ?? {})
}))
const calendarUI = {
  root: 'rcalendar rouned-xl p-2 border-4 border-red-500 bg-transparent',
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
  prevButton: 'rounded-xl border border-[var(--c-border)]',
  nextButton: 'rounded-xl border border-[var(--c-border)]',
  prev: 'rounded-xl bg-black-500 border',
  next: 'rounded-xl border'
}
</script>

<template>
  <UInputDate
    ref="inputDate"
    v-model="model"
    range
    :disabled="disabled"
    :required="required"
    :size="size"
    :ui="mergedUi"
    class="r-date-range-picker"
  >
    <template #trailing>
      <UPopover
        :reference="inputDate?.inputsRef?.[0]?.$el"
      >
        <!-- <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-lucide-calendar-range"
          aria-label="Select date range"
          class="r-date-range-picker__trigger"
        /> -->
       <button
          type="button"
          :disabled="disabled"
          :class="['rdp__cal-btn', { 'rdp__cal-btn--active': !!model }]"
          aria-label="Open calendar"
        >
          <i class="ri ri-calendar-line" />
        </button>

        <template #content>
          <div class="r-date-range-picker__popover">
            <UCalendar
              v-model="model"
              range
              :number-of-months="numberOfMonths"
              :ui="calendarUI"
            />
          </div>
        </template>
      </UPopover>
    </template>
  </UInputDate>
</template>

<style scoped lang="scss">
.r-date-range-picker {
  width: 100%;

  :deep(input) {
    color: var(--c-text);
    height: 60px;
  }

  :deep(input::placeholder) {
    color: var(--c-muted);
  }

  :deep([data-invalid]) {
    border-color: var(--c-danger);
    height: 54px;
  }

// &__trigger {
//   color: var(--c-accent);

//   &:hover {
//     background: color-mix(
//       in srgb,
//       var(--c-accent) 12%,
//       transparent
//     );
//   }
// }

  &__popover {
    padding: 12px;
    border-radius: 15px;

    background: var(--glass-bg);
    backdrop-filter: var(--glass-blur);

    border: 1px solid var(--glass-border);
    box-shadow: var(--glass-shadow);
  }
}

// calendar btn inside
.rcalendar {
  background: var(--c-surface);
  // border-radius: 16px;
}
.rcalendar {
  :deep(button[aria-label*="Previous"]),
  :deep(button[aria-label*="Next"]) {
    width: 22px !important;
    height: 22px !important;
    min-width: 22px !important;
    // max-width: 22px !important;
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
}

//calendar btn

.rdp__cal-btn {
  width:         28px;
  height:        28px;
  margin-right: 10px;
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


/* Calendar Customization */
:deep(.ui-calendar) {
  color: var(--c-text);
}

:deep(button[data-selected]) {
  background: var(--c-accent) !important;
  color: white !important;
}

:deep(button[data-highlighted]) {
  background: rgba(255, 140, 66, 0.14);
}

:deep(button[data-today]) {
  border-color: var(--c-accent);
}

:deep(button:hover) {
  background: rgba(255, 140, 66, 0.08);
}
</style>



<style lang="scss">
// input
// can override the NuxtUI style but need css class to base of ui of NuxtUI but need as global without scoped
.rdp-input {
  height: 40px !important; //base
  width: 100% !important;
  padding: 0 2px 0 12px;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius-md) !important;

  [data-segment="day"],
  [data-segment="month"],
  [data-segment="year"] {
    width: fit-content !important;
    min-width: 0 !important;
    flex: none !important;
    padding-inline: 6px !important;
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
    padding-right: 2px !important;
    background: transparent !important;
    font-size: 14px !important;
  }
}

//    ─────────────────────────────────────────────
//      GLOBAL — targets NuxtUI portal / teleport
// ──────────────────────────────────────────────

// ── Popover shell ─────────────────────────────
.rdp-s-popover {
  padding:       0 !important;
  border-radius: var(--radius-xl) !important;
  border:        1px solid var(--c-border) !important;
  background:    var(--c-surface) !important;
  box-shadow:    var(--glass-shadow) !important;
  overflow:      hidden !important;
  min-width:     280px;
}

.rdp-s-popover__inner {
  display:        flex;
  flex-direction: column;
  font-family:    var(--font-fallback);
}

// ── Quick actions row ─────────────────────────
.rdp-s-popover__quick {
  display:     flex;
  align-items: center;
  gap:         var(--space-2);
  padding:     var(--space-3) var(--space-4);
  background:  var(--bg-tertiary);
}

.rdp-s-popover__quick-btn {
  display:       flex;
  align-items:   center;
  gap:           var(--space-1);
  padding:       var(--space-1) var(--space-3);
  border:        1px solid var(--c-border);
  border-radius: var(--radius-md);
  background:    var(--c-surface);
  color:         var(--c-text);
  font-size:     0.78rem;
  font-family:   var(--font-fallback);
  font-weight:   500;
  cursor:        pointer;
  transition:    var(--transition-fast);

  svg { font-size: 0.85rem; color: var(--c-accent); }

  &:hover {
    border-color: var(--c-accent);
    color:        var(--c-accent);
    background:   rgba(255,140,66,0.06);
  }

  &--danger {
    border-color: rgba(248,113,113,0.25);
    color:        var(--c-danger);

    svg { color: var(--c-danger); }

    &:hover {
      border-color: var(--c-danger);
      background:   rgba(248,113,113,0.07);
    }
  }
}

// ── Separator ─────────────────────────────────
.rdp-s-popover__sep {
  height:     1px;
  background: var(--c-border);
}

// ── Calendar ──────────────────────────────────
.rdp-s-popover__cal {
  padding: var(--space-3) var(--space-4) !important;

  // Day cells
  [data-type="day"] button,
  [data-type="day"] [role="gridcell"] {
    border-radius: var(--radius-md) !important;
    font-family:   var(--font-fallback) !important;
    font-size:     0.82rem !important;
    transition:    var(--transition-fast) !important;
    color:         var(--c-text) !important;

    &:hover:not([disabled]) {
      background: rgba(255,140,66,0.12) !important;
      color:      var(--c-accent) !important;
    }
  }

  // Today marker
  [data-today] button,
  [data-today] [role="gridcell"] {
    border:      1px solid var(--c-accent) !important;
    color:       var(--c-accent) !important;
    font-weight: 600 !important;
  }

  // Selected day
  [data-selected] button,
  [data-selected] [role="gridcell"] {
    background:  var(--c-accent) !important;
    color:       #fff !important;
    font-weight: 600 !important;
    box-shadow:  var(--glow-accent-sm) !important;
    border:      none !important;
  }

  // Disabled
  [data-disabled] button {
    opacity: 0.3 !important;
    cursor:  not-allowed !important;
  }

  // Month / year heading
  [data-type="month-header"],
  [data-type="year-header"] {
    font-family: var(--font-fallback) !important;
    font-weight: 600 !important;
    font-size:   0.88rem !important;
    color:       var(--c-text) !important;
  }

  // Weekday labels
  [data-type="weekday"] {
    font-size:      0.67rem !important;
    font-weight:    700 !important;
    color:          var(--c-muted) !important;
    text-transform: uppercase !important;
    letter-spacing: 0.06em !important;
  }

  // Prev / Next nav
  [data-type="prev"] button,
  [data-type="next"] button {
    color:         var(--c-muted) !important;
    border-radius: var(--radius-md) !important;
    transition:    var(--transition-fast) !important;

    &:hover {
      color:      var(--c-accent) !important;
      background: rgba(255,140,66,0.08) !important;
    }
  }
}

// ── Footer ────────────────────────────────────
.rdp-s-popover__footer {
  display:     flex;
  align-items: center;
  padding:     var(--space-2) var(--space-4);
  border-top:  1px solid var(--c-border);
  background:  var(--bg-tertiary);
  min-height:  36px;
}

.rdp-s-popover__selected {
  display:     flex;
  align-items: center;
  gap:         var(--space-2);
  font-size:   0.75rem;
  color:       var(--c-muted);
  font-family: var(--font-fallback);
}

.rdp-s-popover__selected-icon {
  font-size: 0.9rem;
  flex-shrink: 0;

  &--ok    { color: var(--c-success); }
  &--muted { color: var(--c-muted); }
}

// ── Dark mode ─────────────────────────────────
.dark {
  .rdp-s-popover {
    background: rgba(19, 19, 26, 0.97) !important;
  }

  .rdp-s-popover__quick,
  .rdp-s-popover__footer {
    background: rgba(255,255,255,0.025);
  }

  .rdp-s-popover__quick-btn {
    background: rgba(255,255,255,0.04);

    &:hover { background: rgba(255,140,66,0.08); }
    &--danger:hover { background: rgba(248,113,113,0.08); }
  }

  .rdp-s-popover__cal {
    [data-type="day"] button,
    [data-type="day"] [role="gridcell"] {
      color: var(--c-text) !important;
    }
  }
}



</style>