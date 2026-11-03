<script setup lang="ts">
// RStepper — SARIKA
// Full-featured UStepper wrapper built on NuxtUI v4.8.2
// ─────────────────────────────────────────────────────
// Modes       : horizontal (default) | vertical
// Orientation : auto-collapses to vertical on mobile
// Icons       : NuxtUI i-lucide-* OR RemixIcon via v-html (ri-*)
// Slots       :
//   #indicator  { item, index, isActive, isCompleted, isPending }
//   #title      { item, index, isActive }
//   #description{ item, index, isActive }
//   #content    { item, index, isActive }
//   #actions    — below stepper, exposes { prev, next, isFirst, isLast, activeIndex }
//   #completion — shown when all steps done
// ui prop     : deep-merged with SARIKA defaults → passed to UStepper :ui

import { ref, computed, useTemplateRef } from 'vue'
import type { StepperItem } from '@nuxt/ui'
import { useI18n } from 'vue-i18n'
import { useUIStore } from '@/stores/ui'

// ── Extended item type (adds remixicon + badge + status) ──────────────────
export interface RStepperItem extends Omit<StepperItem, 'icon'> {
  icon?:        string          // i-lucide-* OR ri-* (RemixIcon class)
  riIcon?:      string          // explicit RemixIcon class (ri-home-line, etc.)
  badge?:       string | number // optional badge on indicator
  status?:      'default' | 'success' | 'warning' | 'error'
  optional?:    boolean
  labelKm?:     string
  descriptionKm?: string
}

// ── Props ─────────────────────────────────────────────────────────────────
const props = withDefaults(defineProps<{
  items:          RStepperItem[]
  modelValue?:    number                         // controlled active index
  orientation?:   'horizontal' | 'vertical'
  size?:          'sm' | 'md' | 'lg'
  color?:         'accent' | 'success' | 'info'
  linear?:        boolean                        // prevent skipping steps
  showContent?:   boolean                        // render #content below connector
  showActions?:   boolean                        // built-in prev/next buttons
  completionMsg?: string                         // message when all done
  disabled?:      boolean
  ui?:            Record<string, unknown>        // NuxtUI ui passthrough
}>(), {
  orientation:   'horizontal',
  size:          'md',
  color:         'primary',
  showContent:   false,
  showActions:   false,
})

const emit = defineEmits<{
  'update:modelValue': [idx: number]
  change:              [idx: number]
  complete:            []
}>()

const { locale } = useI18n()
const ui = useUIStore()

// ── Stepper ref & active index ─────────────────────────────────────────────
const stepperRef = useTemplateRef<InstanceType<any>>('stepperRef')
const activeIdx  = ref(props.modelValue ?? 0)

// Sync prop → internal
watch(() => props.modelValue, v => {
  if (v !== undefined) activeIdx.value = v
})

const isCompleted = computed(() => activeIdx.value >= props.items.length)

// ── Navigation ─────────────────────────────────────────────────────────────
function goTo(idx: number) {
  if (props.disabled) return
  if (props.linear && idx > activeIdx.value + 1) return
  if (idx < 0 || idx > props.items.length) return
  activeIdx.value = idx
  emit('update:modelValue', idx)
  emit('change', idx)
  if (idx >= props.items.length) emit('complete')
}

function next() { goTo(activeIdx.value + 1) }
function prev() { goTo(activeIdx.value - 1) }
function reset() { goTo(0) }

// Expose for parent ref access
defineExpose({ next, prev, reset, goTo, activeIdx })

// ── Resolved label (bilingual) ─────────────────────────────────────────────
function label(item: RStepperItem) {
  return locale.value === 'km' && item.labelKm ? item.labelKm : (item.title ?? '')
}
function desc(item: RStepperItem) {
  return locale.value === 'km' && item.descriptionKm ? item.descriptionKm : (item.description ?? '')
}

// ── Is icon a RemixIcon? ───────────────────────────────────────────────────
function isRemixIcon(icon?: string) {
  return icon?.startsWith('ri-') ?? false
}

// ── Step state helpers ─────────────────────────────────────────────────────
function isActive(i: number)    { return i === activeIdx.value }
function isPast(i: number)      { return i < activeIdx.value }
function isFuture(i: number)    { return i > activeIdx.value }

// Step status → CSS modifier
function stepMod(item: RStepperItem, i: number) {
  if (item.status === 'error')   return 'rs__step--error'
  if (item.status === 'warning') return 'rs__step--warning'
  if (item.status === 'success' || isPast(i)) return 'rs__step--done'
  if (isActive(i)) return 'rs__step--active'
  return 'rs__step--pending'
}

// ── SARIKA default ui merged with consumer overrides ──────────────────────
const baseUi = computed(() => ({
  root:      'rs__nuxt-root',
  list:      'rs__nuxt-list',
  item:      'rs__nuxt-item',
  indicator: 'rs__nuxt-indicator',
  title:     'rs__nuxt-title',
  description: 'rs__nuxt-desc',
  separator: 'rs__nuxt-sep',
}))

const mergedUi = computed(() => ({
  ...baseUi.value,
  ...(props.ui ?? {}),
}))

// ── Built-in default icon per status ──────────────────────────────────────
function defaultIcon(item: RStepperItem, i: number): { ri: boolean; name: string } {
  if (item.status === 'error')   return { ri: true,  name: 'ri-error-warning-line' }
  if (item.status === 'warning') return { ri: true,  name: 'ri-alert-line' }
  if (item.status === 'success' || isPast(i))
    return { ri: true, name: 'ri-check-line' }

  // Explicit icon from item
  const ico = item.riIcon ?? item.icon
  if (ico && isRemixIcon(ico)) return { ri: true,  name: ico }
  if (ico)                     return { ri: false, name: ico }

  // Fallback: step number
  return { ri: false, name: '' }
}
</script>

<template>
  <div
    :class="[
      'rs',
      `rs--${orientation}`,
      `rs--${size}`,
      `rs--${color}`,
      {
        'rs--linear':   linear,
        'rs--disabled': disabled,
        'rs--done':     isCompleted,
      },
    ]"
  >

    <!-- ════════════════════════════════════════════════
         COMPLETION SCREEN
    ════════════════════════════════════════════════ -->
    <Transition name="rs-slide">
      <div v-if="isCompleted" class="rs__done">
        <slot name="completion" :reset="reset">
          <div class="rs__done-inner">
            <div class="rs__done-icon">
              <i class="ri-checkbox-circle-line" />
            </div>
            <p class="rs__done-title">
              {{ completionMsg ?? (locale === 'km' ? 'បានបញ្ចប់ទាំងអស់!' : 'All steps completed!') }}
            </p>
            <button type="button" class="rs__done-reset" @click="reset">
              <i class="ri-refresh-line" />
              {{ locale === 'km' ? 'ចាប់ផ្ដើមឡើងវិញ' : 'Start over' }}
            </button>
          </div>
        </slot>
      </div>
    </Transition>

    <!-- ════════════════════════════════════════════════
         STEPPER (hidden when completed)
    ════════════════════════════════════════════════ -->
    <div v-show="!isCompleted">

      <!-- ── Custom header (replaces UStepper list) ─ -->
      <div :class="['rs__track', `rs__track--${orientation}`]">
        <template v-for="(item, i) in items" :key="i">

          <!-- Step pill -->
          <button
            type="button"
            :class="['rs__step', stepMod(item, i), { 'rs__step--clickable': !linear || i <= activeIdx }]"
            :disabled="disabled || (linear && i > activeIdx + 1)"
            :aria-current="isActive(i) ? 'step' : undefined"
            @click="goTo(i)"
          >
            <!-- Indicator circle -->
            <span class="rs__indicator">
              <slot
                name="indicator"
                :item="item" :index="i"
                :is-active="isActive(i)"
                :is-completed="isPast(i)"
                :is-pending="isFuture(i)"
              >
                <!-- Badge -->
                <span v-if="item.badge !== undefined" class="rs__badge">{{ item.badge }}</span>

                <!-- RemixIcon via v-html -->
                <template v-if="defaultIcon(item, i).ri">
                  <i
                    :class="defaultIcon(item, i).name"
                    class="rs__indicator-icon"
                    aria-hidden="true"
                  />
                </template>

                <!-- NuxtUI icon -->
                <template v-else-if="defaultIcon(item, i).name">
                  <UIcon
                    :name="defaultIcon(item, i).name"
                    class="rs__indicator-icon"
                  />
                </template>

                <!-- Fallback: step number -->
                <template v-else>
                  <span class="rs__step-num">{{ i + 1 }}</span>
                </template>
              </slot>
            </span>

            <!-- Label block -->
            <span class="rs__label">
              <span class="rs__title">
                <slot name="title" :item="item" :index="i" :is-active="isActive(i)">
                  {{ label(item) }}
                </slot>
                <span v-if="item.optional" class="rs__optional">
                  {{ locale === 'km' ? '(ស្រេចចិត្ត)' : '(optional)' }}
                </span>
              </span>
              <span v-if="desc(item)" class="rs__desc">
                <slot name="description" :item="item" :index="i" :is-active="isActive(i)">
                  {{ desc(item) }}
                </slot>
              </span>
            </span>
          </button>

          <!-- Connector line between steps -->
          <div
            v-if="i < items.length - 1"
            :class="['rs__connector', { 'rs__connector--done': i < activeIdx }]"
            aria-hidden="true"
          />

        </template>
      </div>

      <!-- ── Step content panel ──────────────────────── -->
      <div v-if="showContent" class="rs__content-wrap">
        <TransitionGroup name="rs-content">
          <div
            v-for="(item, i) in items"
            v-show="isActive(i)"
            :key="i"
            class="rs__content"
          >
            <slot
              name="content"
              :item="item" :index="i" :is-active="isActive(i)"
            >
              <!-- Default: empty placeholder -->
              <div class="rs__content-placeholder">
                <i class="ri-file-list-3-line" aria-hidden="true" />
                <span>{{ label(item) }}</span>
              </div>
            </slot>
          </div>
        </TransitionGroup>
      </div>

      <!-- ── Built-in prev/next actions ─────────────── -->
      <div v-if="showActions" class="rs__actions">
        <slot
          name="actions"
          :prev="prev" :next="next"
          :is-first="activeIdx === 0"
          :is-last="activeIdx === items.length - 1"
          :active-index="activeIdx"
          :item="items[activeIdx]"
        >
          <button
            type="button"
            class="rs__btn rs__btn--ghost"
            :disabled="activeIdx === 0 || disabled"
            @click="prev"
          >
            <i class="ri-arrow-left-line" />
            {{ locale === 'km' ? 'មុន' : 'Back' }}
          </button>

          <div class="rs__actions-dots" aria-hidden="true">
            <span
              v-for="(_, i) in items"
              :key="i"
              :class="['rs__dot', { 'rs__dot--active': i === activeIdx, 'rs__dot--done': i < activeIdx }]"
              @click="goTo(i)"
            />
          </div>

          <button
            type="button"
            class="rs__btn rs__btn--solid"
            :disabled="disabled"
            @click="next"
          >
            {{ activeIdx >= items.length - 1
              ? (locale === 'km' ? 'បញ្ចប់' : 'Finish')
              : (locale === 'km' ? 'បន្ទាប់' : 'Next') }}
            <i :class="activeIdx >= items.length - 1 ? 'ri-check-line' : 'ri-arrow-right-line'" />
          </button>
        </slot>
      </div>

    </div><!-- /v-show !isCompleted -->

    <!-- ── NuxtUI UStepper (hidden, provides a11y + keyboard) ─
         We render our own visual track above and use UStepper
         as a headless keyboard controller. ──────────────────── -->
    <div class="rs__nuxt-hidden" aria-hidden="true">
      <UStepper
        ref="stepperRef"
        v-model="activeIdx"
        :items="items"
        :orientation="orientation"
        :ui="mergedUi"
      />
    </div>

  </div>
</template>

<style lang="scss" scoped>
// ─────────────────────────────────────────────────────
// SIZE TOKENS
// ─────────────────────────────────────────────────────
$indicator-size: (sm: 28px, md: 36px, lg: 44px);
$indicator-font: (sm: 0.75rem, md: 0.875rem, lg: 1rem);
$track-gap:      (sm: var(--space-3), md: var(--space-4), lg: var(--space-5));

// ─────────────────────────────────────────────────────
// HOST
// ─────────────────────────────────────────────────────
.rs {
  display:        flex;
  flex-direction: column;
  gap:            var(--space-5);
  font-family:    var(--font-fallback);
  width:          100%;
  position:       relative;

  &--disabled { opacity: 0.55; pointer-events: none; }
}

// ─────────────────────────────────────────────────────
// TRACK  (step pills + connectors)
// ─────────────────────────────────────────────────────
.rs__track {
  display: flex;
  align-items: flex-start;
  gap: 0;

  // Horizontal
  &--horizontal {
    flex-direction: row;
    align-items:    center;

    .rs__step  { flex-direction: column; align-items: center; text-align: center; }
    .rs__label { align-items: center; }

    // @include mobile-only {
    //   // collapse to vertical on mobile
    //   flex-direction: column;
    //   align-items:    flex-start;

    //   .rs__connector {
    //     width:  2px !important;
    //     height: 28px !important;
    //     margin: 0 0 0 18px !important;
    //     flex:   none !important;
    //   }

    //   .rs__step  { flex-direction: row; align-items: flex-start; text-align: left; }
    //   .rs__label { align-items: flex-start; }
    // }
  }

  // Vertical
  &--vertical {
    flex-direction: column;
    align-items:    flex-start;

    .rs__step { flex-direction: row; align-items: flex-start; text-align: left; }
    .rs__label { align-items: flex-start; }

    .rs__connector {
      width:  2px;
      height: 32px;
      margin: 0 0 0 17px;
      flex:   none;
    }
  }
}

// ─────────────────────────────────────────────────────
// STEP BUTTON
// ─────────────────────────────────────────────────────
.rs__step {
  display:        flex;
  gap:            var(--space-2);
  align-items:    center;
  background:     transparent;
  border:         none;
  padding:        var(--space-1);
  cursor:         default;
  flex:           1;               // equal width in horizontal
  min-width:      0;
  // @include transition;

  &--clickable { cursor: pointer; }

  .rs--vertical & { flex: none; width: 100%; }

  // ── State colours ──
  .rs__indicator { 
    // @include transition; 
  }

  &--active .rs__indicator {
    background: var(--c-accent);
    border-color: var(--c-accent);
    box-shadow: var(--glow-accent-sm);
    color: #fff;
  }

  &--done .rs__indicator {
    background: rgba(255,140,66,0.15);
    border-color: var(--c-accent);
    color: var(--c-accent);
  }

  &--pending .rs__indicator {
    background: var(--bg-tertiary);
    border-color: var(--c-border);
    color: var(--c-muted);
  }

  &--error .rs__indicator {
    background: rgba(248,113,113,0.12);
    border-color: var(--c-danger);
    color: var(--c-danger);
    box-shadow: 0 0 0 3px rgba(248,113,113,0.1);
  }

  &--warning .rs__indicator {
    background: rgba(255,179,71,0.12);
    border-color: var(--color-yellow);
    color: var(--color-yellow);
  }

  // Hover (clickable pending/active)
  &--clickable:hover:not(&--error):not(&--warning) {
    .rs__indicator {
      border-color: var(--c-accent);
      color:        var(--c-accent);
    }
    .rs__title { color: var(--c-accent); }
  }

  // Title colour by state
  &--active  .rs__title { color: var(--c-accent); font-weight: 600; }
  &--done    .rs__title { color: var(--c-text); }
  &--pending .rs__title { color: var(--c-muted); }
  &--error   .rs__title { color: var(--c-danger); }
  &--warning .rs__title { color: var(--color-yellow); }

  // Active desc
  &--active  .rs__desc  { color: var(--c-text); }
}

// ─────────────────────────────────────────────────────
// INDICATOR CIRCLE
// ─────────────────────────────────────────────────────
.rs__indicator {
  position:       relative;
  flex-shrink:    0;
  border:         2px solid;
  border-radius:  50%;
  display:        flex;
  align-items:    center;
  justify-content: center;
  font-weight:    700;

  // Size variants
  .rs--sm & { width: map-get($indicator-size, sm); height: map-get($indicator-size, sm); font-size: map-get($indicator-font, sm); }
  .rs--md & { width: map-get($indicator-size, md); height: map-get($indicator-size, md); font-size: map-get($indicator-font, md); }
  .rs--lg & { width: map-get($indicator-size, lg); height: map-get($indicator-size, lg); font-size: map-get($indicator-font, lg); }
}

.rs__indicator-icon { font-size: 1em; line-height: 1; display: flex; }
.rs__step-num       { line-height: 1; }

// Badge (top-right overlay)
.rs__badge {
  position:      absolute;
  top:           -5px;
  right:         -5px;
  min-width:     16px;
  height:        16px;
  padding:       0 4px;
  border-radius: 8px;
  background:    var(--c-danger);
  color:         #fff;
  font-size:     0.6rem;
  font-weight:   700;
  display:       flex;
  align-items:   center;
  justify-content: center;
  border:        2px solid var(--c-surface);
  z-index:       2;
}

// ─────────────────────────────────────────────────────
// LABEL
// ─────────────────────────────────────────────────────
.rs__label {
  display:        flex;
  flex-direction: column;
  gap:            2px;
  min-width:      0;
}

.rs__title {
  font-size:   0.82rem;
  font-weight: 500;
  color:       var(--c-muted);
  // @include transition(fast);
  // @include truncate;

  .rs--lg & { font-size: 0.9rem; }
}

.rs__desc {
  font-size: 0.72rem;
  color:     var(--c-muted);
  // @include truncate;

  .rs--lg & { font-size: 0.78rem; }
}

.rs__optional {
  font-size:   0.68rem;
  color:       var(--c-muted);
  font-weight: 400;
  margin-left: 4px;
}

// ─────────────────────────────────────────────────────
// CONNECTOR LINE
// ─────────────────────────────────────────────────────
.rs__connector {
  flex:       1;
  height:     2px;
  background: var(--c-border);
  border-radius: 2px;
  // @include transition;
  margin:     0 var(--space-1);

  .rs--vertical & {
    flex: none;
    width:  2px;
    height: 28px;
    margin: 2px 0 2px 17px;
  }

  &--done { background: var(--c-accent); }

  // @include mobile-only {
  //   .rs--horizontal & {
  //     flex:   none;
  //     width:  2px;
  //     height: 24px;
  //     margin: 0 0 0 14px;
  //   }
  // }
}

// ─────────────────────────────────────────────────────
// CONTENT PANEL
// ─────────────────────────────────────────────────────
.rs__content-wrap {
  position: relative;
  min-height: 80px;
}

.rs__content {
  width: 100%;
}

.rs__content-placeholder {
  display:       flex;
  align-items:   center;
  gap:           var(--space-3);
  padding:       var(--space-5);
  background:    var(--bg-tertiary);
  border:        1px dashed var(--c-border);
  border-radius: var(--radius-lg);
  color:         var(--c-muted);
  font-size:     0.875rem;

  i { font-size: 1.2rem; color: var(--c-accent); }
}

// ─────────────────────────────────────────────────────
// ACTIONS ROW
// ─────────────────────────────────────────────────────
.rs__actions {
  display:         flex;
  align-items:     center;
  justify-content: space-between;
  gap:             var(--space-3);
  padding-top:     var(--space-2);
  border-top:      1px solid var(--c-border);
}

.rs__actions-dots {
  display:     flex;
  align-items: center;
  gap:         var(--space-2);
}

.rs__dot {
  width:         8px;
  height:        8px;
  border-radius: 50%;
  background:    var(--c-border);
  cursor:        pointer;
  // @include transition(fast);

  &--active {
    background: var(--c-accent);
    width:      20px;
    border-radius: 4px;
    box-shadow: var(--glow-accent-sm);
  }

  &--done { background: rgba(255,140,66,0.35); }
}

// ─────────────────────────────────────────────────────
// BUTTONS
// ─────────────────────────────────────────────────────
.rs__btn {
  display:       flex;
  align-items:   center;
  gap:           var(--space-1);
  padding:       7px 18px;
  border-radius: var(--radius-md);
  font-size:     0.82rem;
  font-weight:   500;
  font-family:   var(--font-fallback);
  cursor:        pointer;
  // @include transition(fast);

  i { font-size: 0.95rem; }

  &:disabled { opacity: 0.4; cursor: not-allowed; }

  &--ghost {
    border:     1px solid var(--c-border);
    background: transparent;
    color:      var(--c-muted);
    &:hover:not(:disabled) { border-color: var(--c-accent); color: var(--c-accent); }
  }

  &--solid {
    border:     1px solid var(--c-accent);
    background: var(--c-accent);
    color:      #fff;
    box-shadow: var(--glow-accent-sm);
    &:hover:not(:disabled) { background: var(--c-accent-2); border-color: var(--c-accent-2); }
  }
}

// ─────────────────────────────────────────────────────
// COMPLETION SCREEN
// ─────────────────────────────────────────────────────
.rs__done {
  padding: var(--space-8) var(--space-4);
}

.rs__done-inner {
  display:        flex;
  flex-direction: column;
  align-items:    center;
  gap:            var(--space-4);
  text-align:     center;
}

.rs__done-icon {
  width:         72px;
  height:        72px;
  border-radius: 50%;
  background:    rgba(255,140,66,0.1);
  border:        2px solid rgba(255,140,66,0.25);
  // @include flex-center;
  box-shadow:    var(--glow-accent);

  i {
    font-size: 2.2rem;
    color:     var(--c-accent);
    filter:    drop-shadow(var(--glow-text));
  }
}

.rs__done-title {
  font-size:   1.15rem;
  font-weight: 700;
  color:       var(--c-text);
  margin:      0;
}

.rs__done-reset {
  display:       flex;
  align-items:   center;
  gap:           var(--space-2);
  padding:       7px 20px;
  border:        1px solid var(--c-border);
  border-radius: var(--radius-md);
  background:    transparent;
  color:         var(--c-muted);
  font-size:     0.82rem;
  font-family:   var(--font-fallback);
  cursor:        pointer;
  // @include transition(fast);

  &:hover { border-color: var(--c-accent); color: var(--c-accent); }
  i { font-size: 0.95rem; }
}

// ─────────────────────────────────────────────────────
// HIDE NUXTUI STEPPER (used for keyboard/a11y only)
// ─────────────────────────────────────────────────────
.rs__nuxt-hidden {
  position:   absolute;
  width:      1px;
  height:     1px;
  overflow:   hidden;
  clip:       rect(0,0,0,0);
  white-space: nowrap;
  border:     0;
  pointer-events: none;
}

// ─────────────────────────────────────────────────────
// TRANSITIONS
// ─────────────────────────────────────────────────────
.rs-slide-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.rs-slide-leave-active { transition: all 0.2s ease; }
.rs-slide-enter-from,
.rs-slide-leave-to     { opacity: 0; transform: translateY(12px); }

.rs-content-enter-active { transition: all 0.25s ease; }
.rs-content-leave-active { transition: all 0.2s ease; position: absolute; width: 100%; }
.rs-content-enter-from   { opacity: 0; transform: translateX(16px); }
.rs-content-leave-to     { opacity: 0; transform: translateX(-16px); }
</style>

<!-- Global: NuxtUI slot class overrides (hidden element) -->
<style lang="scss">
.rs__nuxt-root,
.rs__nuxt-list,
.rs__nuxt-item,
.rs__nuxt-indicator,
.rs__nuxt-title,
.rs__nuxt-desc,
.rs__nuxt-sep { all: unset; }
</style>