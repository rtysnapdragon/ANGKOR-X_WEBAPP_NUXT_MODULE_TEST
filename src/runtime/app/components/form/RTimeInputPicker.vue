<script setup>
/**
 * RTimeInputPicker — SARIKA
 * NuxtUI v4 UInputTime + drum-scroll popover picker
 *
 * Fixes applied vs original:
 *   1. minuteItems was broken — used props.minuteStep (undefined) instead of
 *      the local computed, making Math.ceil(60/undefined)=NaN → empty array.
 *      Fixed: hardcoded step=1, generate all 60 minutes [0..59].
 *   2. Removed minuteStep / secondStep props entirely (no longer needed).
 *   3. Removed granularity='second' drum column — only hour, minute, AM/PM.
 *   4. Removed dead `internal1` computed.
 *   5. v-model watch loop: internal is now shallowRef so Time objects are
 *      never deep-proxied. isSameTime guard prevents redundant re-emits.
 *   6. scrollAllDrums: minute index now uses indexOf (exact match on 0-59).
 *   7. Drum grid always 2 columns (h + m) or 3 (h + m + ampm) — no sec column.
 *   8. All granularity==='second' references removed from template/script.
 */
import { shallowRef, ref, computed, watch, nextTick, onMounted, onBeforeUnmount, useSlots, toRaw } from 'vue'
import { Time } from '@internationalized/date'
import { useI18n } from 'vue-i18n'
import RPopover from '../RPopover.vue'

// ── Props ─────────────────────────────────────────────────────────────────
const props = defineProps([
  'modelValue',
  'range',
  // granularity: only 'hour' | 'minute' supported now (second removed)
  'granularity',
  'hourCycle',
  'label',
  'labelKm',
  'hint',
  'error',
  'required',
  'disabled',
  'readonly',
  'clearable',
  'size',
  'ui',
  'placeholder',
  'separatorIcon',
  'autoOpen',
  'leading',
  'trailing',
  'class',
  'color',
  'leadingIcon',
  'trailingIcon',
  'loading',
])

const slots = useSlots()

// ── Computed prop accessors ───────────────────────────────────────────────
const range       = computed(() => props.range      ?? false)
// granularity capped at 'minute' — 'second' no longer supported
const granularity = computed(() => props.granularity === 'hour' ? 'hour' : 'minute')
const hourCycle   = computed(() => props.hourCycle  ?? 12)
const label       = computed(() => props.label      ?? null)
const labelKm     = computed(() => props.labelKm    ?? null)
const hint        = computed(() => props.hint       ?? null)
const error       = computed(() => props.error      ?? null)
const required    = computed(() => props.required   ?? false)
const disabled    = computed(() => props.disabled   ?? false)
const readonly    = computed(() => props.readonly   ?? false)
const clearable   = computed(() => props.clearable  ?? true)
const size        = computed(() => props.size       ?? 'md')
const autoOpen    = computed(() => props.autoOpen   ?? true)
const placeholder = computed(() => props.placeholder ?? 'Select time')
const separatorIcon = computed(() => props.separatorIcon ?? '<i class="ri-arrow-drop-right-line w-8 text-center" />')
const _class      = computed(() => props.class      ?? null)
const color       = computed(() => props.color      ?? null)
const leadingIcon = computed(() => props.leadingIcon ?? null)
const trailingIcon = computed(() => props.trailingIcon ?? null)
const loading     = computed(() => props.loading    ?? false)

// ── Emits ─────────────────────────────────────────────────────────────────
const emit = defineEmits({
  'update:modelValue': null,
  'change':            null,
  'clear':             null,
  'blur':              null,
  'focus':             null,
})

const { locale } = useI18n()

// ── Type coercions ────────────────────────────────────────────────────────
function toTime(v) {
  if (!v) return null
  const raw = toRaw(v)        // strip proxy — Time methods break under proxy
  if (raw instanceof Time)    return raw
  if (raw instanceof Date)    return new Time(raw.getHours(), raw.getMinutes(), 0)
  if (typeof raw === 'string') {
    const [h = 0, m = 0] = raw.split(':').map(Number)
    return new Time(h, m, 0)
  }
  return null
}

function toTimeValue(v) {
  if (!v) return null
  if (props.range && typeof v === 'object' && 'start' in v && 'end' in v) {
    return { start: toTime(v.start), end: toTime(v.end) }
  }
  return toTime(v)
}

// ── Equality guards (prevent emit loops) ──────────────────────────────────
function sameTime(a, b) {
  if (a === b) return true
  if (!a || !b) return false
  return a.hour === b.hour && a.minute === b.minute
}

function sameValue(a, b) {
  if (a === b) return true
  if (!a || !b) return a === b
  if (props.range) {
    return sameTime(a.start, b.start) && sameTime(a.end, b.end)
  }
  return sameTime(a, b)
}

// ── Internal state — MUST be shallowRef ───────────────────────────────────
// Time is an immutable value-object. ref() deep-proxies it and breaks
// methods. shallowRef holds the reference as-is.
const internal = shallowRef(toTimeValue(props.modelValue))

// Sync parent → internal (only when actually different)
watch(
  () => props.modelValue,
  (v) => {
    const next = toTimeValue(v)
    if (!sameValue(internal.value, next)) {
      internal.value = next
    }
  },
)

// Sync internal → parent (only when actually different)
watch(
  internal,
  (v, old) => {
    if (sameValue(v, old)) return
    emit('update:modelValue', v)
    emit('change', v)
  },
)

// ── Popover state ─────────────────────────────────────────────────────────
const open       = ref(false)
const popRef     = ref(null)
const triggerRef = ref(null)
const rangeStep  = ref('start')   // range two-phase: 'start' | 'end'

function openPicker() {
  if (disabled.value || readonly.value) return
  if (props.range) rangeStep.value = 'start'
  open.value = !open.value
  if (open.value) nextTick(() => scrollAllDrums(true))
}

function closePicker() {
  open.value = false
  emit('blur')
}

function onOutside(e) {
  const t = e.target
  if (popRef.value?.contains(t) || triggerRef.value?.contains(t)) return
  closePicker()
}

onMounted(()    => document.addEventListener('mousedown', onOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', onOutside))

function clearValue() {
  internal.value = null
  emit('clear')
  closePicker()
}

const hasValue = computed(() => !!internal.value)

// ── Drum item lists ───────────────────────────────────────────────────────
const ITEM_H = 44   // px — must match CSS $item-h

const hourItems = computed(() =>
  hourCycle.value === 12
    ? Array.from({ length: 12 }, (_, i) => i + 1)   // 1–12
    : Array.from({ length: 24 }, (_, i) => i)        // 0–23
)

// Fixed step=1 → all 60 minutes [0, 1, 2, … 59]
// Original bug: used props.minuteStep (undefined) → NaN length → empty array
const minuteItems = computed(() =>
  Array.from({ length: 60 }, (_, i) => i)
)

// ── Current editing time ──────────────────────────────────────────────────
const editingTime = computed(() => {
  const fallback = new Time(0, 0, 0)
  if (!internal.value) return fallback
  if (props.range) {
    const r = internal.value
    return (rangeStep.value === 'start' ? r.start : r.end) ?? fallback
  }
  return internal.value ?? fallback
})

function to12h(h) { return h === 0 ? 12 : h > 12 ? h - 12 : h }

// ── Drum refs ─────────────────────────────────────────────────────────────
const hourDrum   = ref(null)
const minuteDrum = ref(null)
const ampmDrum   = ref(null)

// Suppress scroll-select while we scroll a drum programmatically, so the
// debounced handler can't re-pick a mid-animation value. Per-column so
// scrolling one wheel never mutes another.
const suppress = { h: false, m: false, ap: false }
const suppressTimers = { h: null, m: null, ap: null }
function colOf(el) {
  if (el === hourDrum.value) return 'h'
  if (el === minuteDrum.value) return 'm'
  if (el === ampmDrum.value) return 'ap'
  return null
}
function suppressCol(col) {
  if (!col) return
  suppress[col] = true
  clearTimeout(suppressTimers[col])
  suppressTimers[col] = setTimeout(() => { suppress[col] = false }, 500)
}

function scrollDrumTo(el, idx, instant = false) {
  if (!el || idx < 0) return
  suppressCol(colOf(el))
  el.scrollTo({ top: idx * ITEM_H, behavior: instant ? 'instant' : 'smooth' })
}

function scrollAllDrums(instant = true) {
  const t = editingTime.value
  const hDisplay = hourCycle.value === 12 ? to12h(t.hour) : t.hour

  scrollDrumTo(hourDrum.value,
    hourItems.value.indexOf(hDisplay), instant)

  // minuteItems is [0..59] so indexOf(minute) === minute
  scrollDrumTo(minuteDrum.value, t.minute, instant)

  if (hourCycle.value === 12)
    scrollDrumTo(ampmDrum.value, t.hour >= 12 ? 1 : 0, instant)
}

// ── Mouse-wheel / touch scroll selection ──────────────────────────────────
const scrollTimers = { h: null, m: null, ap: null }
function onDrumScroll(e, col) {
  if (suppress[col]) return
  const el = e.currentTarget
  if (scrollTimers[col]) clearTimeout(scrollTimers[col])
  scrollTimers[col] = setTimeout(() => {
    const idx = Math.round(el.scrollTop / ITEM_H)
    if (col === 'h') {
      const h = hourItems.value[idx]
      if (h != null && !isHourActive(h)) pickHour(h)
    } else if (col === 'm') {
      const m = Math.min(Math.max(idx, 0), 59)
      if (!isMinActive(m)) pickMinute(m)
    } else {
      const pm = idx >= 1
      if (!isAmPmActive(pm)) pickAmPm(pm)
    }
  }, 140)
}

// ── Drum item pick handlers ───────────────────────────────────────────────
function pickHour(h) {
  let realH = h
  if (hourCycle.value === 12) {
    const isPm = editingTime.value.hour >= 12
    realH = isPm ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h)
  }
  applyTime(new Time(realH, editingTime.value.minute, 0))
  scrollDrumTo(hourDrum.value, hourItems.value.indexOf(h))
}

function pickMinute(m) {
  applyTime(new Time(editingTime.value.hour, m, 0))
  // minuteItems is [0..59], so index === value
  scrollDrumTo(minuteDrum.value, m)
}

function pickAmPm(pm) {
  const h = editingTime.value.hour
  let newH = h
  if (pm  && h < 12) newH = h + 12
  if (!pm && h >= 12) newH = h - 12
  applyTime(new Time(newH, editingTime.value.minute, 0))
  scrollDrumTo(ampmDrum.value, pm ? 1 : 0)
}

function applyTime(t) {
  if (!props.range) {
    internal.value = t
    return
  }
  const prev = internal.value ?? { start: new Time(0, 0, 0), end: new Time(0, 0, 0) }
  internal.value = rangeStep.value === 'start'
    ? { start: t, end: prev.end }
    : { start: prev.start, end: t }
}

function onFocus(e) {
  emit('focus', e)
  if (autoOpen.value && !disabled.value && !readonly.value) {
    open.value = true
    nextTick(() => scrollAllDrums(true))
  }
}

function advancePhase() {
  if (!props.range) { closePicker(); return }
  if (rangeStep.value === 'start') {
    rangeStep.value = 'end'
    nextTick(() => scrollAllDrums(true))
  } else {
    closePicker()
  }
}

// ── Keyboard on drums ─────────────────────────────────────────────────────
function onDrumKey(e, col) {
  if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
  e.preventDefault()
  const dir = e.key === 'ArrowUp' ? -1 : 1
  if (col === 'h') {
    const list = hourItems.value
    const cur  = list.indexOf(hourCycle.value === 12 ? to12h(editingTime.value.hour) : editingTime.value.hour)
    pickHour(list[(cur + dir + list.length) % list.length])
  } else if (col === 'ap') {
    const cur = editingTime.value.hour >= 12 ? 1 : 0
    pickAmPm(((cur + dir + 2) % 2) === 1)
  } else {
    // minute: wrap 0–59
    const cur = editingTime.value.minute
    pickMinute((cur + dir + 60) % 60)
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, '0')

function fmtTime(t) {
  if (!t) return '—'
  if (granularity.value === 'hour') return `${pad(t.hour)}:00`
  return `${pad(t.hour)}:${pad(t.minute)}`
}

const summaryText = computed(() => {
  if (!internal.value) return null
  if (props.range) {
    const r = internal.value
    return `${fmtTime(r.start)}  →  ${fmtTime(r.end)}`
  }
  return fmtTime(internal.value)
})

const duration = computed(() => {
  if (!props.range || !internal.value) return null
  const r = internal.value
  if (!r.start || !r.end) return null
  const diff = (r.end.hour * 60 + r.end.minute) - (r.start.hour * 60 + r.start.minute)
  if (diff <= 0) return null
  const h = Math.floor(diff / 60), m = diff % 60
  return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`
})

// ── Active checks ─────────────────────────────────────────────────────────
function isHourActive(h) {
  return (hourCycle.value === 12
    ? to12h(editingTime.value.hour)
    : editingTime.value.hour) === h
}
function isMinActive(m)    { return editingTime.value.minute === m }
function isAmPmActive(pm)  { return pm ? editingTime.value.hour >= 12 : editingTime.value.hour < 12 }

// ── NuxtUI ui merge ───────────────────────────────────────────────────────
const mergedUi = computed(() => ({
  root:     'rti__ui-root',
  base:     'rti__ui-base pe-12',
  leading:  'rti__leading',
  trailing: 'rti__trailing',
  segment:  'rti__segment',
  ...(props.ui ?? {}),
}))

const displayLabel = computed(() =>
  locale.value === 'km' && props.labelKm ? props.labelKm : props.label
)

const lbl = computed(() =>
  locale.value === 'km'
    ? { h: 'ម៉ោង', m: 'នាទី', am: 'ព្រឹក', pm: 'ល្ងាច' }
    : { h: 'Hour',  m: 'Min',  am: 'AM',    pm: 'PM'    }
)

const stepLabel = computed(() => {
  if (!props.range) return null
  return rangeStep.value === 'start'
    ? (locale.value === 'km' ? '✦ ចាប់ផ្ដើម' : '✦ Start')
    : (locale.value === 'km' ? '✦ បញ្ចប់'    : '✦ End')
})

// Drum grid class: 2 cols (h+m) or 3 cols (h+m+ampm)
const drumsClass = computed(() =>
  hourCycle.value === 12 ? 'rti__drums--ampm' : ''
)
const labelsClass = computed(() =>
  hourCycle.value === 12 ? 'rti__drum-labels--ampm' : ''
)
</script>

<template>
  <div
    :class="[
      'rti', `rti--${size}`,
      {
        'rti--range':    range,
        'rti--disabled': disabled,
        'rti--readonly': readonly,
        'rti--error':    !!error,
        'rti--filled':   hasValue,
        'rti--open':     open,
      },
      _class,
    ]"
  >
    <!-- ── Field ─────────────────────────────────────────── -->
    <div class="rti__field">
      <!-- Single mode -->
      <template v-if="!range">
        <UInputTime
          v-model="internal"
          :granularity="granularity"
          :hour-cycle="hourCycle"
          :disabled="disabled"
          :readonly="readonly"
          :ui="mergedUi"
          class="rti__input"
          v-bind="$attrs"
          @blur="emit('blur', $event)"
          @focus="onFocus"
        >
          <template #trailing>
            <div class="rti__trail">
              <Transition name="rti-fade">
                <button
                  v-if="clearable && hasValue && !disabled && !readonly"
                  type="button" class="rti__clear" tabindex="-1"
                  aria-label="Clear" @click.stop="clearValue"
                >
                  <UIcon name="i-lucide-x" />
                </button>
              </Transition>
              <button
                ref="triggerRef" type="button"
                :disabled="disabled || readonly"
                :class="['rti__trigger', { 'rti__trigger--active': open }]"
                aria-label="Open time picker"
                @click.stop="openPicker"
              >
                <UIcon name="i-lucide-clock" />
              </button>
            </div>
          </template>
        </UInputTime>
      </template>

      <!-- Range mode -->
      <template v-if="range">
        <UInputTime
          v-model="internal"
          range
          :separator-icon="separatorIcon"
          :granularity="granularity"
          :hour-cycle="hourCycle"
          :disabled="disabled"
          :readonly="readonly"
          :ui="mergedUi"
          class="rti__input"
          v-bind="$attrs"
          @blur="emit('blur', $event)"
          @focus="onFocus"
        >
          <template #trailing>
            <div class="rti__trail">
              <Transition name="rti-fade">
                <button
                  v-if="clearable && hasValue && !disabled && !readonly"
                  type="button" class="rti__clear" tabindex="-1"
                  aria-label="Clear" @click.stop="clearValue"
                >
                  <UIcon name="i-lucide-x" />
                </button>
              </Transition>
              <button
                ref="triggerRef" type="button"
                :disabled="disabled || readonly"
                :class="['rti__trigger', { 'rti__trigger--active': open }]"
                aria-label="Open time picker"
                @click.stop="openPicker"
              >
                <UIcon name="i-lucide-clock" />
              </button>
            </div>
          </template>
        </UInputTime>
      </template>

    </div><!-- /field -->

    <!-- Summary chip -->
    <!-- <div v-if="hasValue && summaryText" class="rti__summary">
      <UIcon name="i-lucide-clock" />
      <span class="rti__summary-val">{{ summaryText }}</span>
      <span v-if="duration" class="rti__summary-dur">({{ duration }})</span>
    </div> -->

    <!-- Error -->
    <Transition name="rti-fade">
      <p v-if="error" class="rti__error" role="alert">
        <UIcon name="i-lucide-alert-circle" />{{ error }}
      </p>
    </Transition>

    <!-- ══════════════════════════════════════════════
         DRUM PICKER POPOVER
    ══════════════════════════════════════════════ -->
    <RPopover
      v-model="open"
      :reference="triggerRef"
      class="rti__pop"
      use="nuxtui"
      :content="{ side: 'bottom-end' }"
    >
      <template #trigger />
      <!-- Header: live time + range step badge -->
      <div class="rti__pop-head">
        <div class="rti__pop-live">
          <span class="rti__pop-live-time">
            {{ hourCycle === 12
              ? `${pad(to12h(editingTime.hour))}:${pad(editingTime.minute)}`
              : fmtTime(editingTime) }}
          </span>
          <span v-if="hourCycle === 12" class="rti__pop-live-ampm">
            {{ editingTime.hour >= 12 ? lbl.pm : lbl.am }}
          </span>
          <span
            v-if="range"
            :class="['rti__step-badge', `rti__step-badge--${rangeStep}`]"
          >{{ stepLabel }}</span>
        </div>
      </div>

      <!-- Column header labels: Hour | Min | AM/PM -->
      <div class="rti__drum-labels" :class="labelsClass">
        <span>{{ lbl.h }}</span>
        <span v-if="granularity !== 'hour'">{{ lbl.m }}</span>
        <span v-if="hourCycle === 12">AM/PM</span>
      </div>

      <!-- ══ Drum columns ══ -->
      <div class="rti__drums" :class="drumsClass">
        <!-- Selection highlight bar -->
        <div class="rti__selector" aria-hidden="true" />
        <!-- Hour drum -->
        <div
          ref="hourDrum"
          class="rti__drum"
          tabindex="0"
          role="listbox"
          :aria-label="lbl.h"
          @keydown="onDrumKey($event, 'h')"
          @scroll.passive="onDrumScroll($event, 'h')"
        >
          <div class="rti__drum-pad" />
          <div
            v-for="h in hourItems" :key="h"
            :class="['rti__drum-item', { 'rti__drum-item--active': isHourActive(h) }]"
            role="option" :aria-selected="isHourActive(h)"
            @click="pickHour(h)"
          >{{ pad(h) }}</div>
          <div class="rti__drum-pad" />
        </div>

        <!-- Minute drum — always visible when granularity !== 'hour' -->
        <div
          v-if="granularity !== 'hour'"
          ref="minuteDrum"
          class="rti__drum"
          tabindex="0"
          role="listbox"
          :aria-label="lbl.m"
          @keydown="onDrumKey($event, 'm')"
          @scroll.passive="onDrumScroll($event, 'm')"
        >
          <div class="rti__drum-pad" />
          <div
            v-for="m in minuteItems" :key="m"
            :class="['rti__drum-item', { 'rti__drum-item--active': isMinActive(m) }]"
            role="option" :aria-selected="isMinActive(m)"
            @click="pickMinute(m)"
          >{{ pad(m) }}</div>
          <div class="rti__drum-pad" />
        </div>

        <!-- AM/PM drum — same scroll wheel as Hour / Min -->
        <div
          v-if="hourCycle === 12"
          ref="ampmDrum"
          class="rti__drum rti__drum--ampm"
          tabindex="0"
          role="listbox"
          aria-label="AM/PM"
          @keydown="onDrumKey($event, 'ap')"
          @scroll.passive="onDrumScroll($event, 'ap')"
        >
          <div class="rti__drum-pad" />
          <div
            :class="['rti__drum-item', { 'rti__drum-item--active': isAmPmActive(false) }]"
            role="option" :aria-selected="isAmPmActive(false)"
            @click="pickAmPm(false)"
          >{{ lbl.am }}</div>
          <div
            :class="['rti__drum-item', { 'rti__drum-item--active': isAmPmActive(true) }]"
            role="option" :aria-selected="isAmPmActive(true)"
            @click="pickAmPm(true)"
          >{{ lbl.pm }}</div>
          <div class="rti__drum-pad" />
        </div>

      </div><!-- /drums -->

      <!-- Range progress strip -->
      <div v-if="range" class="rti__range-strip">
        <div
          :class="[
            'rti__range-seg',
            { 'rti__range-seg--done': !!internal?.start, 'rti__range-seg--active': rangeStep === 'start' }
          ]"
        >
          <UIcon :name="internal?.start ? 'i-lucide-check-circle-2' : 'i-lucide-circle-dashed'" />
          <span>{{ locale === 'km' ? 'ចាប់ផ្ដើម' : 'Start' }}</span>
          <code v-if="internal?.start">{{ fmtTime(internal.start) }}</code>
        </div>
        <UIcon name="i-lucide-arrow-right" class="rti__range-arrow" />
        <div
          :class="[
            'rti__range-seg',
            { 'rti__range-seg--done': !!internal?.end, 'rti__range-seg--active': rangeStep === 'end' }
          ]"
        >
          <UIcon :name="internal?.end ? 'i-lucide-check-circle-2' : 'i-lucide-circle-dashed'" />
          <span>{{ locale === 'km' ? 'បញ្ចប់' : 'End' }}</span>
          <code v-if="internal?.end">{{ fmtTime(internal.end) }}</code>
        </div>
      </div>

      <!-- Footer -->
      <div class="rti__pop-footer">
        <button type="button" class="rti__btn rti__btn--ghost" @click="closePicker">
          {{ locale === 'km' ? 'បោះបង់' : 'Cancel' }}
        </button>
        <button type="button" class="rti__btn rti__btn--solid" @click="advancePhase">
          <UIcon :name="range && rangeStep === 'start' ? 'i-lucide-arrow-right' : 'i-lucide-check'" />
          {{ range && rangeStep === 'start'
            ? (locale === 'km' ? 'បន្ទាប់' : 'Next')
            : (locale === 'km' ? 'យល់ព្រម' : 'Done') }}
        </button>
      </div>
    </RPopover>
  </div><!-- /rti -->
</template>

<style lang="scss" scoped>

$item-h: 44px;
$vis:    3;       // visible items in viewport

// ─────────────────────────────────────────────
// HOST
// ─────────────────────────────────────────────
.rti {
  display:        flex;
  flex-direction: column;
  gap:            var(--space-2);
  font-family:    var(--font-fallback);
  position:       relative;

  &--xs  { font-size: 0.72rem; }
  &--sm  { font-size: 0.8rem;  }
  &--md  { font-size: 0.875rem;}
  &--lg  { font-size: 0.95rem; }
  &--xl  { font-size: 1rem;    }

  &--disabled { opacity: 0.5; pointer-events: none; }
  &--readonly { pointer-events: none; }

  &--error .rti__input :deep([role="group"]) {
    border-color: var(--c-danger) !important;
  }
}

// ─────────────────────────────────────────────
// FIELD
// ─────────────────────────────────────────────
.rti__field { position: relative; }

.rti__input {
  flex: 1;
  width: 100%;

  :deep([role="group"]) {
    width:         100%;
    height:        38px !important;
    min-height:    38px !important;
    padding-left:  12px !important;
    padding-right: 12px !important;
    padding-top:   1px !important;
    padding-bottom: 1px !important;
    font-family:   var(--font-fallback) !important;
    background:    var(--c-surface) !important;
    border:        1px solid var(--c-border) !important;
    border-radius: var(--radius-md) !important;
    transition:    border-color 0.18s, box-shadow 0.18s;

    &:focus-within {
      border-color: var(--c-accent) !important;
      box-shadow:   0 0 0 3px rgba(255,140,66,0.12) !important;
    }
  }

  :deep([data-type]:not([data-type="literal"])) {
    font-family:          var(--font-fallback) !important;
    font-variant-numeric: tabular-nums;
    color:                var(--c-muted) !important;
    border-radius:        var(--radius-sm) !important;
    transition:           background 0.15s, color 0.15s;

    &[data-focused], &:focus {
      background: rgba(255,140,66,0.12) !important;
      color:      var(--c-accent) !important;
      outline:    none !important;
    }
  }

  .rti--filled & :deep([data-type]:not([data-type="literal"])) {
    color: var(--c-text) !important;
  }

  :deep([data-type="literal"]) { color: var(--c-muted) !important; user-select: none; }
}

:deep([data-slot="base"]) {
  height:        38px !important;
  width:         100%;
  border-radius: var(--rounded, var(--radius-md)) !important;
}
:deep([data-slot="leading"])  { padding-left:  5px !important; }
:deep([data-slot="trailing"]) { padding-right: 5px !important; }

// ─────────────────────────────────────────────
// TRAILING (absolute-positioned button group)
// ─────────────────────────────────────────────
.rti__trail {
  position:   absolute;
  top:        50%;
  right:      8px;
  transform:  translateY(-50%);
  display:    flex;
  align-items: center;
  gap:        4px;
  z-index:    2;
}

.rti__clear {
  width: 24px; height: 24px; border: none; border-radius: 50%;
  background: rgba(248,113,113,0.1); color: var(--c-danger);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: background 0.15s; font-size: 0.72rem; padding: 0;
  &:hover { background: rgba(248,113,113,0.22); }
}

.rti__trigger {
  width: 32px; height: 32px;
  border: 1px solid var(--c-border); border-radius: var(--radius-md);
  background: transparent; color: var(--c-muted);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.15s; padding: 0;

  &:hover, &--active {
    border-color: var(--c-accent); color: var(--c-accent);
    background: rgba(255,140,66,0.07); box-shadow: var(--glow-accent-sm);
  }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
}

// ─────────────────────────────────────────────
// SUMMARY CHIP
// ─────────────────────────────────────────────
.rti__summary {
  display: inline-flex; align-items: center; gap: var(--space-2);
  padding: 3px 10px;
  background: rgba(255,140,66,0.07); border: 1px solid rgba(255,140,66,0.18);
  border-radius: var(--radius-full); width: fit-content; font-size: 0.75rem;

  svg            { color: var(--c-accent); font-size: 0.82rem; }
  &-val          { font-weight: 600; color: var(--c-text); font-variant-numeric: tabular-nums; }
  &-dur          { color: var(--c-muted); }
}

// ─────────────────────────────────────────────
// POPOVER SHELL
// ─────────────────────────────────────────────
.rti__pop {
  position:      absolute;
  top:           calc(100% + 8px);
  left:          0;
  z-index:       300;
  background:    var(--bg-content) !important;
  border:        1px solid var(--c-border);
  border-radius: var(--radius-xl);
  box-shadow:    var(--glass-shadow);
  overflow:      hidden;
  width:         max-content;
  min-width:     220px;

  // @include mobile-only {
  //   width:     calc(100vw - 2rem);
  //   left:      50%;
  //   transform: translateX(-50%);
  // }
}

// ── Popover header ─────────────────────
.rti__pop-head {
  padding:       var(--space-3) var(--space-4);
  background:    var(--bg-tertiary);
  border-bottom: 1px solid var(--c-border);
}

.rti__pop-live {
  display: flex; align-items: center; gap: var(--space-2);
}

.rti__pop-live-time {
  font-size:   1.5rem;
  font-weight: 800;
  color:       var(--c-accent);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.03em;
  text-shadow: var(--glow-text);
  line-height: 1;
}

.rti__pop-live-ampm {
  font-size:   0.78rem;
  font-weight: 700;
  color:       var(--c-muted);
  align-self:  flex-end;
  margin-bottom: 3px;
}

.rti__step-badge {
  font-size:     0.65rem;
  font-weight:   700;
  padding:       2px 10px;
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: 0.07em;

  &--start { background: rgba(255,140,66,0.12); color: var(--c-accent); border: 1px solid rgba(255,140,66,0.25); }
  &--end   { background: rgba(96,165,250,0.12);  color: var(--c-info);   border: 1px solid rgba(96,165,250,0.25); }
}

// ── Column header labels ───────────────────
// Default: 2 cols (Hour + Min)
// --ampm:  3 cols (Hour + Min + AM/PM)
.rti__drum-labels {
  display:               grid;
  grid-template-columns: 1fr 1fr;        // Hour : Min
  gap:                   var(--space-1);
  padding:               var(--space-2) var(--space-4) var(--space-1);
  font-size:             0.62rem;
  font-weight:           700;
  color:                 var(--c-muted);
  text-transform:        uppercase;
  letter-spacing:        0.08em;
  text-align:            center;

  &--ampm { grid-template-columns: 1fr 1fr 48px; }  // h | m | AM/PM
}

// ── Drums container ────────────────────────
.rti__drums {
  position:              relative;
  display:               grid;
  grid-template-columns: 1fr 1fr;        // Hour | Min
  align-items:           center;
  padding:               0 var(--space-4);
  height:                ($item-h * $vis);
  gap:                   0;
  background-color:      var(--bg-content) !important;

  &--ampm { grid-template-columns: 1fr 1fr 48px; }  // Hour | Min | AM/PM
}

// Highlight bar sitting behind the centre row
.rti__selector {
  position:      absolute;
  left:          var(--space-3);
  right:         var(--space-3);
  top:           50%;
  transform:     translateY(-50%);
  height:        $item-h;
  background:    rgba(255,140,66,0.09);
  border:        1px solid rgba(255,140,66,0.22);
  border-radius: var(--radius-md);
  pointer-events: none;
  z-index:       0;
}

// ── Single drum (scroll) ───────────────────
.rti__drum {
  height:           ($item-h * $vis);
  overflow-y:       scroll;
  scroll-snap-type: y mandatory;
  scrollbar-width:  none;
  outline:          none;
  position:         relative;
  z-index:          1;

  &::-webkit-scrollbar { display: none; }

  // top & bottom fade
  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black #{$item-h},
    black #{$item-h * ($vis - 1)},
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black #{$item-h},
    black #{$item-h * ($vis - 1)},
    transparent 100%
  );
}

.rti__drum-pad {
  height:       $item-h;
  flex-shrink:  0;
  scroll-snap-align: start;
}

.rti__drum-item {
  height:               $item-h;
  display:              flex;
  align-items:          center;
  justify-content:      center;
  font-size:            0.98rem;
  font-weight:          500;
  font-variant-numeric: tabular-nums;
  color:                var(--c-muted);
  cursor:               pointer;
  scroll-snap-align:    start;
  border-radius:        var(--radius-md);
  transition:           color 0.15s, background 0.15s;
  user-select:          none;
  letter-spacing:       0.03em;

  &:hover:not(.rti__drum-item--active) {
    color:      var(--c-text);
    background: rgba(255,140,66,0.06);
  }

  &--active {
    color:       var(--c-accent);
    font-weight: 700;
    font-size:   1.08rem;
  }
}

// Colon separator (unused visually but kept for potential use)
.rti__colon {
  font-size: 1.2rem; font-weight: 700;
  color: var(--c-accent); opacity: 0.55;
  padding: 0 2px; user-select: none;
  z-index: 2; position: relative;
}

// ── Range strip ────────────────────────────
.rti__range-strip {
  display:     flex;
  align-items: center;
  gap:         var(--space-2);
  padding:     var(--space-2) var(--space-4);
  background:  var(--bg-tertiary);
  border-top:  1px solid var(--c-border);
  font-size:   0.75rem;
}

.rti__range-seg {
  display:     flex;
  align-items: center;
  gap:         var(--space-1);
  flex:        1;
  color:       var(--c-muted);
  transition:  all 0.15s;
  padding:     4px 6px;
  border-radius: var(--radius-sm);

  svg  { font-size: 0.88rem; flex-shrink: 0; }
  code {
    font-size: 0.7rem; padding: 1px 6px;
    background: rgba(255,140,66,0.1); border-radius: var(--radius-sm);
    color: var(--c-accent);
  }

  &--active { background: rgba(255,140,66,0.07); color: var(--c-text); }
  &--done   { color: var(--c-accent); }
}

.rti__range-arrow { color: var(--c-accent); font-size: 0.82rem; flex-shrink: 0; opacity: 0.7; }

// ── Footer ─────────────────────────────────
.rti__pop-footer {
  display:         flex;
  align-items:     center;
  justify-content: flex-end;
  gap:             var(--space-2);
  padding:         var(--space-2) var(--space-4);
  border-top:      1px solid var(--c-border);
  background:      var(--bg-tertiary);
}

.rti__btn {
  display:       flex;
  align-items:   center;
  gap:           var(--space-1);
  padding:       5px 14px;
  border-radius: var(--radius-md);
  font-size:     0.8rem;
  font-family:   var(--font-fallback);
  font-weight:   500;
  cursor:        pointer;
  transition:    all 0.15s;

  &--ghost {
    border: 1px solid var(--c-border); background: transparent; color: var(--c-muted);
    &:hover { border-color: var(--c-accent); color: var(--c-accent); }
  }
  &--solid {
    border: 1px solid var(--c-accent); background: var(--c-accent); color: #fff;
    box-shadow: var(--glow-accent-sm);
    &:hover { background: var(--c-accent-2); border-color: var(--c-accent-2); }
  }
}

// ── Transitions ─────────────────────────────
.rti-fade-enter-active, .rti-fade-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.rti-fade-enter-from,   .rti-fade-leave-to     { opacity: 0; transform: translateY(-2px); }

.rti-pop-enter-active { transition: all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1); }
.rti-pop-leave-active { transition: all 0.15s ease; }
.rti-pop-enter-from   { opacity: 0; transform: translateY(-8px) scale(0.96); }
.rti-pop-leave-to     { opacity: 0; transform: translateY(-4px) scale(0.98); }
</style>

<style lang="scss">
.dark .rti__input :deep([role="group"]) {
  background: rgba(19, 19, 26, 0.8) !important;
}
.dark .rti__pop {
  background: rgba(19, 19, 26, 0.97);
}
</style>