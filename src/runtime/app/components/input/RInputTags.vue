<!--
  RInputTags.vue
  ----------------------------------------------------------------------------
  Reusable wrapper around Nuxt UI 4.8.2's <UInputTags>.

  ✔ Forwards EVERY UInputTags prop, slot and emit (1:1 passthrough)
  ✔ Adds optional "suggestion source" behaviour on top of the plain tags
    input so it can work as:
      - a free-text tags input (mode="none", default UInputTags behaviour)
      - a tags input backed by a LOCAL static list of options (mode="local")
      - a tags input backed by a REMOTE/API search (mode="api")
  ✔ Custom visual layer is applied through the official `ui` prop
    (root -> "ui-rinputtag-root", base -> "ui-rinputtag-base", ...) and
    styled in a single, non-scoped SCSS block at the bottom of this file,
    so app.config.ts theme + this stylesheet can both apply cleanly.
  ----------------------------------------------------------------------------
-->
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

/* ----------------------------------------------------------------------- */
/* Types                                                                   */
/* ----------------------------------------------------------------------- */

type TagValue = string | number | Record<string, any>

interface RInputTagsUi {
  root?: any
  base?: any
  leading?: any
  leadingIcon?: any
  leadingAvatar?: any
  leadingAvatarSize?: any
  trailing?: any
  trailingIcon?: any
  item?: any
  itemText?: any
  itemDelete?: any
  itemDeleteIcon?: any
  input?: any
}

defineOptions({
  name: 'RInputTags',
  inheritAttrs: false
})

/* ----------------------------------------------------------------------- */
/* Props — 1:1 mirror of UInputTags, plus RInputTags extras               */
/* ----------------------------------------------------------------------- */

const props = defineProps({
  /* ---------- native UInputTags props ---------- */
  as: { type: [String, Object], default: 'div' },
  placeholder: { type: String, default: undefined },
  maxLength: { type: Number, default: undefined },
  color: {
    type: String,
    default: 'primary',
    validator: (v: string) =>
      ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'].includes(v)
  },
  variant: {
    type: String,
    default: 'outline',
    validator: (v: string) => ['outline', 'soft', 'subtle', 'ghost', 'none'].includes(v)
  },
  size: {
    type: String,
    default: 'md',
    validator: (v: string) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(v)
  },
  autofocus: { type: Boolean, default: false },
  autofocusDelay: { type: Number, default: 0 },
  deleteIcon: { type: [String, Object, Function], default: undefined },
  highlight: { type: Boolean, default: false },
  fixed: { type: Boolean, default: false },
  modelValue: { type: Array as () => TagValue[], default: undefined },
  defaultValue: { type: Array as () => TagValue[], default: undefined },
  addOnPaste: { type: Boolean, default: false },
  addOnTab: { type: Boolean, default: false },
  addOnBlur: { type: Boolean, default: false },
  duplicate: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  delimiter: { type: [String, RegExp], default: undefined },
  max: { type: Number, default: undefined },
  id: { type: String, default: undefined },
  convertValue: { type: Function, default: undefined },
  displayValue: { type: Function, default: undefined },
  name: { type: String, default: undefined },
  required: { type: Boolean, default: false },
  icon: { type: [String, Object, Function], default: undefined },
  avatar: { type: Object, default: undefined },
  leading: { type: Boolean, default: false },
  leadingIcon: { type: [String, Object, Function], default: undefined },
  trailing: { type: Boolean, default: false },
  trailingIcon: { type: [String, Object, Function], default: undefined },
  loading: { type: Boolean, default: false },
  loadingIcon: { type: [String, Object, Function], default: undefined },
  list: { type: String, default: undefined },
  readonly: { type: [Boolean, String], default: undefined },
  autocomplete: { type: String, default: undefined },
  ui: { type: Object as () => RInputTagsUi, default: () => ({}) },
  class: { type: [String, Object, Array], default: undefined },

  /* ---------- RInputTags extras: data integration ---------- */

  /** 'auto' picks 'api' if fetchOptions is given, else 'local' if options given, else 'none'. */
  mode: {
    type: String,
    default: 'auto',
    validator: (v: string) => ['auto', 'local', 'api', 'none'].includes(v)
  },
  /** Local, static list of selectable options (strings or objects). */
  options: { type: Array as () => TagValue[], default: () => [] },
  /** Async fetcher for API-backed suggestions: (query: string) => Promise<TagValue[]> */
  fetchOptions: { type: Function as unknown as () => (q: string) => Promise<TagValue[]>, default: null },
  /** Key (string) or getter (fn) used to read a display label off an option object. */
  optionLabel: { type: [String, Function], default: 'label' },
  /** Key (string) or getter (fn) used to read the underlying tag value off an option object. */
  optionValue: { type: [String, Function], default: 'value' },
  /** Debounce (ms) applied before calling fetchOptions. */
  debounce: { type: Number, default: 300 },
  /** Minimum characters typed before triggering local filtering / API search. */
  minChars: { type: Number, default: 0 },
  /** Max number of suggestions rendered in the dropdown. */
  suggestionsLimit: { type: Number, default: 8 },
  /** When false, tags typed that don't match an option are rejected (local mode only). */
  allowCustom: { type: Boolean, default: true },
  loadingText: { type: String, default: 'Loading…' },
  noResultsText: { type: String, default: 'No results found' }
})

/* ----------------------------------------------------------------------- */
/* Emits — 1:1 mirror of UInputTags, plus RInputTags extras               */
/* ----------------------------------------------------------------------- */

const emit = defineEmits<{
  (e: 'change', payload: Event): void
  (e: 'blur', payload: FocusEvent): void
  (e: 'focus', payload: FocusEvent): void
  (e: 'update:data', payload: TagValue[]): void
  (e: 'invalid', payload: TagValue): void
  (e: 'addTag', payload: TagValue): void
  (e: 'removeTag', payload: TagValue): void
  /* extras */
  (e: 'search', query: string): void
  (e: 'selectOption', option: TagValue): void
}>()

/* ----------------------------------------------------------------------- */
/* Passthrough to UInputTags                                              */
/* ----------------------------------------------------------------------- */

function mergeCx(base: string, extra: any) {
  return extra ? [base, extra] : [base]
}

const mergedUi = computed<RInputTagsUi>(() => ({
  ...props.ui,
  root: mergeCx('ui-rinputtag-root', props.ui?.root),
  base: mergeCx('ui-rinputtag-base', props.ui?.base),
  leading: mergeCx('ui-rinputtag-leading', props.ui?.leading),
  leadingIcon: mergeCx('ui-rinputtag-leading-icon', props.ui?.leadingIcon),
  leadingAvatar: mergeCx('ui-rinputtag-leading-avatar', props.ui?.leadingAvatar),
  trailing: mergeCx('ui-rinputtag-trailing', props.ui?.trailing),
  trailingIcon: mergeCx('ui-rinputtag-trailing-icon', props.ui?.trailingIcon),
  item: mergeCx('ui-rinputtag-item', props.ui?.item),
  itemText: mergeCx('ui-rinputtag-item-text', props.ui?.itemText),
  itemDelete: mergeCx('ui-rinputtag-item-delete', props.ui?.itemDelete),
  itemDeleteIcon: mergeCx('ui-rinputtag-item-delete-icon', props.ui?.itemDeleteIcon),
  input: mergeCx('ui-rinputtag-input', props.ui?.input)
}))

/** Every native UInputTags prop, forwarded as-is (undefined values fall back to UInputTags defaults). */
const forwardedProps = computed(() => ({
  as: props.as,
  placeholder: props.placeholder,
  maxLength: props.maxLength,
  color: props.color,
  variant: props.variant,
  size: props.size,
  autofocus: props.autofocus,
  autofocusDelay: props.autofocusDelay,
  deleteIcon: props.deleteIcon,
  highlight: props.highlight,
  fixed: props.fixed,
  defaultValue: props.defaultValue,
  addOnPaste: props.addOnPaste,
  addOnTab: props.addOnTab,
  addOnBlur: props.addOnBlur,
  duplicate: props.duplicate,
  disabled: props.disabled,
  delimiter: props.delimiter,
  max: props.max,
  id: props.id,
  convertValue: props.convertValue,
  displayValue: props.displayValue,
  name: props.name,
  required: props.required,
  icon: props.icon,
  avatar: props.avatar,
  leading: props.leading,
  leadingIcon: props.leadingIcon,
  trailing: props.trailing,
  trailingIcon: props.trailingIcon,
  loading: props.loading || isLoadingSuggestions.value,
  loadingIcon: props.loadingIcon,
  list: props.list,
  readonly: props.readonly,
  autocomplete: props.autocomplete,
  class: props.class,
  use: ['nuxtui']
}))

/* ----------------------------------------------------------------------- */
/* Option helpers                                                         */
/* ----------------------------------------------------------------------- */

function getOptionLabel(opt: TagValue): string {
  if (typeof props.optionLabel === 'function') return props.optionLabel(opt)
  if (opt && typeof opt === 'object') return String((opt as any)[props.optionLabel as string] ?? '')
  return String(opt)
}

function getOptionValue(opt: TagValue): TagValue {
  if (typeof props.optionValue === 'function') return props.optionValue(opt)
  if (opt && typeof opt === 'object') return (opt as any)[props.optionValue as string]
  return opt
}

/* ----------------------------------------------------------------------- */
/* Suggestion engine (local list and/or API search)                       */
/* ----------------------------------------------------------------------- */

const wrapperRef = ref<HTMLElement | null>(null)
const inputTagsRef = ref<any>(null)
const nativeInputEl = ref<HTMLInputElement | null>(null)

const currentQuery = ref('')
const isSuggestionsOpen = ref(false)
const activeSuggestionIndex = ref(-1)
const remoteResults = ref<TagValue[]>([])
const isLoadingSuggestions = ref(false)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const effectiveMode = computed(() => {
  if (props.mode !== 'auto') return props.mode
  if (typeof props.fetchOptions === 'function') return 'api'
  if (props.options && props.options.length) return 'local'
  return 'none'
})

const currentTags = computed<TagValue[]>(() => props.modelValue || [])

function isTagSelected(opt: TagValue) {
  const v = getOptionValue(opt)
  return currentTags.value.some((t) => (typeof t === 'object' ? getOptionValue(t) : t) === v)
}

const localFiltered = computed(() => {
  const q = currentQuery.value.trim().toLowerCase()
  return props.options
    .filter((opt) => !isTagSelected(opt))
    .filter((opt) => !q || getOptionLabel(opt).toLowerCase().includes(q))
    .slice(0, props.suggestionsLimit)
})

const filteredSuggestions = computed(() => {
  if (effectiveMode.value === 'api') return remoteResults.value.slice(0, props.suggestionsLimit)
  if (effectiveMode.value === 'local') return localFiltered.value
  return []
})

const showSuggestions = computed(
  () =>
    isSuggestionsOpen.value &&
    effectiveMode.value !== 'none' &&
    currentQuery.value.length >= props.minChars &&
    (isLoadingSuggestions.value || filteredSuggestions.value.length > 0 || currentQuery.value.length > 0)
)

watch(currentQuery, (q) => {
  activeSuggestionIndex.value = -1
  if (effectiveMode.value !== 'api') return

  if (debounceTimer) clearTimeout(debounceTimer)
  if (q.length < props.minChars || !props.fetchOptions) {
    remoteResults.value = []
    isLoadingSuggestions.value = false
    return
  }
  isLoadingSuggestions.value = true
  debounceTimer = setTimeout(async () => {
    try {
      emit('search', q)
      const res = await props.fetchOptions!(q)
      remoteResults.value = Array.isArray(res) ? res : []
    } catch {
      remoteResults.value = []
    } finally {
      isLoadingSuggestions.value = false
    }
  }, props.debounce)
})

function openSuggestions() {
  if (effectiveMode.value !== 'none') isSuggestionsOpen.value = true
}
function closeSuggestions() {
  isSuggestionsOpen.value = false
  activeSuggestionIndex.value = -1
}

function selectSuggestion(opt: TagValue) {
  if (!opt) return
  const value = getOptionValue(opt)
  if (!currentTags.value.some((t) => (typeof t === 'object' ? getOptionValue(t) : t) === value)) {
    const next = [...currentTags.value, value]
    emit('update:data', next)
    emit('addTag', value)
    emit('selectOption', opt)
  }
  if (nativeInputEl.value) nativeInputEl.value.value = ''
  currentQuery.value = ''
  closeSuggestions()
}

function handleNativeInput(e: Event) {
  currentQuery.value = (e.target as HTMLInputElement).value
  openSuggestions()
}
function handleNativeFocus() {
  openSuggestions()
}
function handleNativeKeydown(e: KeyboardEvent) {
  if (!showSuggestions.value || !filteredSuggestions.value.length) return
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeSuggestionIndex.value = Math.min(activeSuggestionIndex.value + 1, filteredSuggestions.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeSuggestionIndex.value = Math.max(activeSuggestionIndex.value - 1, 0)
  } else if (e.key === 'Enter' && activeSuggestionIndex.value > -1) {
    e.preventDefault()
    e.stopPropagation()
    selectSuggestion(filteredSuggestions.value[activeSuggestionIndex.value])
  } else if (e.key === 'Escape') {
    closeSuggestions()
  }
}
function handleOutsideClick(e: MouseEvent) {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target as Node)) closeSuggestions()
}

onMounted(() => {
  nativeInputEl.value = inputTagsRef.value?.inputRef ?? null
  nativeInputEl.value?.addEventListener('input', handleNativeInput)
  nativeInputEl.value?.addEventListener('focus', handleNativeFocus)
  nativeInputEl.value?.addEventListener('keydown', handleNativeKeydown, true)
  document.addEventListener('click', handleOutsideClick)
})
onBeforeUnmount(() => {
  nativeInputEl.value?.removeEventListener('input', handleNativeInput)
  nativeInputEl.value?.removeEventListener('focus', handleNativeFocus)
  nativeInputEl.value?.removeEventListener('keydown', handleNativeKeydown, true)
  document.removeEventListener('click', handleOutsideClick)
  if (debounceTimer) clearTimeout(debounceTimer)
})

/* ----------------------------------------------------------------------- */
/* Native UInputTags event handlers -> re-emitted 1:1, plus guard rails   */
/* ----------------------------------------------------------------------- */

function onChange(e: Event) {
  emit('change', e)
}
function onBlur(e: FocusEvent) {
  emit('blur', e)
}
function onFocus(e: FocusEvent) {
  emit('focus', e)
  openSuggestions()
}
function onUpdateModelValue(v: TagValue[]) {
  emit('update:data', v)
}
function onInvalid(v: TagValue) {
  emit('invalid', v)
}
function onAddTag(tag: TagValue) {
  if (!props.allowCustom && effectiveMode.value === 'local') {
    const isKnown = props.options.some((o) => getOptionValue(o) === tag)
    if (!isKnown) {
      const next = currentTags.value.filter((t) => t !== tag)
      emit('update:data', next)
      emit('invalid', tag)
      closeSuggestions()
      return
    }
  }
  emit('addTag', tag)
  closeSuggestions()
}
function onRemoveTag(tag: TagValue) {
  emit('removeTag', tag)
}

/* ----------------------------------------------------------------------- */
/* Expose (mirrors UInputTags' expose surface)                            */
/* ----------------------------------------------------------------------- */

defineExpose({
  inputRef: nativeInputEl
})
</script>

<template>
  <div ref="wrapperRef" class="ui-rinputtag-wrapper">
    <UInputTags
      ref="inputTagsRef"
      v-bind="forwardedProps"
      :model-value="modelValue"
      :ui="mergedUi"
      @change="onChange"
      @blur="onBlur"
      @focus="onFocus"
      @update:model-value="onUpdateModelValue"
      @invalid="onInvalid"
      @add-tag="onAddTag"
      @remove-tag="onRemoveTag"
    >
      <template v-for="(_, slotName) in $slots" #[slotName]="slotProps" :key="slotName">
        <slot :name="slotName" v-bind="slotProps" />
      </template>
    </UInputTags>

    <!-- <UPopver v-if="use == 'nuxtui'" v-model="isSuggestionsOpen" :positions="['bottom-start']">
      <template #trigger>

      </template>
      <template #content>
        
      </template>
    </UPopver> -->

    <Transition name="ui-rinputtag-fade">
      <div v-if="showSuggestions" class="ui-rinputtag-suggestions" role="listbox">
        <div v-if="isLoadingSuggestions" class="ui-rinputtag-suggestion-state">
          {{ loadingText }}
        </div>

        <template v-else-if="filteredSuggestions.length">
          <button
            v-for="(opt, idx) in filteredSuggestions"
            :key="`${getOptionValue(opt)}-${idx}`"
            type="button"
            role="option"
            class="ui-rinputtag-suggestion-item"
            :class="{ 'is-active': idx === activeSuggestionIndex }"
            :aria-selected="idx === activeSuggestionIndex"
            @mousedown.prevent="selectSuggestion(opt)"
            @mouseenter="activeSuggestionIndex = idx"
          >
            <slot name="suggestion" :option="opt" :index="idx" :label="getOptionLabel(opt)">
              {{ getOptionLabel(opt) }}
            </slot>
          </button>
        </template>

        <div v-else class="ui-rinputtag-suggestion-state">
          {{ noResultsText }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<style lang="scss">
/* ============================================================
   RInputTags — visual overrides
   Non-scoped on purpose: targets the class hooks injected via
   the `ui` prop merge above (ui-rinputtag-root / -base / ...),
   which live on Nuxt UI's internally rendered DOM nodes.
   ============================================================ */

.ui-rinputtag-wrapper {
  position: relative;
  width: 100%;
  font-family: var(--font-fallback, 'Inter', system-ui, sans-serif);
}

.ui-rinputtag-root {
  width: 100%;
}

.ui-rinputtag-base {
  border-radius: var(--radius-md, 10px) !important;
  background-color: var(--c-surface, #ffffff);
  border-color: var(--c-border, rgba(255, 140, 66, 0.16)) !important;
  transition: var(--transition-base, all 0.2s ease);

  &:hover {
    background-color: var(--c-hover, rgba(0, 0, 0, 0.025));
  }

  &:focus-within {
    box-shadow: 0 0 0 2px var(--c-accent, #ff8c42);
  }
}

.ui-rinputtag-input {
  color: var(--c-text, #1a1510);
  font-family: inherit;

  &::placeholder {
    color: var(--c-muted, #8a7f72);
  }
}

.ui-rinputtag-leading-icon,
.ui-rinputtag-trailing-icon {
  color: var(--c-muted, #8a7f72);
}

.ui-rinputtag-item {
  border-radius: var(--radius-sm, 6px) !important;
  background-color: var(--bg-tertiary, #f1f3f6);
  color: var(--c-text, #1a1510);
  border-color: var(--c-border, rgba(255, 140, 66, 0.16)) !important;
}

.ui-rinputtag-item-delete {
  color: var(--c-muted, #8a7f72);
  border-radius: var(--radius-xs, 4px) !important;
  transition: var(--transition-fast, all 0.15s ease);

  &:hover {
    color: var(--c-danger, #f87171);
    background-color: var(--r-c-danger-bg, rgba(224, 90, 90, 0.12));
  }
}

/* ---------------- suggestions dropdown ---------------- */

.ui-rinputtag-suggestions {
  position: absolute;
  z-index: 50;
  top: calc(100% + var(--space-1, 4px));
  left: 0;
  right: 0;
  max-height: 260px;
  overflow-y: auto;
  padding: var(--space-1, 4px);
  border-radius: var(--radius-md, 10px);
  background-color: var(--c-surface, #ffffff);
  border: 1px solid var(--c-border, rgba(255, 140, 66, 0.16));
  box-shadow: var(--glass-shadow, 0 8px 32px rgba(0, 0, 0, 0.08));
}

.ui-rinputtag-suggestion-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: var(--space-2, 8px) var(--space-3, 12px);
  border: 0;
  background: transparent;
  border-radius: var(--radius-sm, 6px);
  color: var(--c-text, #1a1510);
  font-size: 0.875rem;
  cursor: pointer;
  transition: var(--transition-fast, all 0.15s ease);

  &:hover,
  &.is-active {
    background-color: var(--c-hover, rgba(0, 0, 0, 0.025));
    color: var(--c-accent, #ff8c42);
  }
}

.ui-rinputtag-suggestion-state {
  padding: var(--space-2, 8px) var(--space-3, 12px);
  color: var(--c-muted, #8a7f72);
  font-size: 0.8125rem;
}

.ui-rinputtag-fade-enter-active,
.ui-rinputtag-fade-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.ui-rinputtag-fade-enter-from,
.ui-rinputtag-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
