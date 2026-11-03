<template>
  <!--
    .rit-root is our stable namespace anchor.
    All global SCSS rules live under this class.
    UInputTags is NOT teleported — its DOM is inline —
    so :deep() would technically work, but global SCSS
    namespaced by .rit-root is more explicit and survives
    NuxtUI internal refactors.
  -->
  <div class="rit-root" :class="[`rit-root--${size}`, `rit-root--${variant}`]">
    <UInputTags
      ref="inputTagsRef"
      v-model="model"
      v-bind="passthroughProps"
      :ui="mergedUI"
      :loading="loading || asyncLoading"
      :disabled="disabled"
      @change="(e) => emit('change', e)"
      @blur="(e) => emit('blur', e)"
      @focus="
        (e) => {
          isFocused = true;
          emit('focus', e);
        }
      "
      @invalid="(v) => emit('invalid', v)"
      @add-tag="onAddTag"
      @remove-tag="(v) => emit('removeTag', v)"
      @update:model-value="onUpdateModel"
    >
      <!-- #leading slot -->
      <template v-if="$slots.leading" #leading="slotProps">
        <slot name="leading" v-bind="slotProps" />
      </template>

      <!-- #default slot -->
      <template v-if="$slots.default" #default="slotProps">
        <slot v-bind="slotProps" />
      </template>

      <!-- #trailing slot -->
      <template v-if="$slots.trailing" #trailing="slotProps">
        <slot name="trailing" v-bind="slotProps" />
      </template>

      <!-- #item-text slot -->
      <template v-if="$slots['item-text']" #item-text="slotProps">
        <slot name="item-text" v-bind="slotProps" />
      </template>

      <!-- #item-delete slot -->
      <template v-if="$slots['item-delete']" #item-delete="slotProps">
        <slot name="item-delete" v-bind="slotProps" />
      </template>
    </UInputTags>

    <!-- ══ DROPDOWN — two UI strategies ════════════════════════════════════
      dropdownUi="nuxtui"     (default) — UPopover: portal, z-index, a11y, SSR safe
      dropdownUi="transition" — plain Vue <Transition>: zero deps, absolute div
    ════════════════════════════════════════════════════════════════════════ -->

    <!-- ── 1. NuxtUI UPopover (default) ──────────────────────────────────
         UPopover wraps the anchor (UInputTags) in its trigger slot,
         so it can measure position and portal the content to body.
         open is controlled manually via showDropdown.
    ── -->
    <template v-if="dropdownUi === 'nuxtui'">
      <UPopover
        :open="showDropdown"
        :ui="{
          content: 'rit-popover-content',
          arrow: 'hidden',
        }"
        :popper="{ placement: 'bottom-start', strategy: 'fixed' }"
        :arrow="false"
        :dismiss-on-click-outside="false"
        :dismiss-on-focus-outside="false"
        :overlay="false"
        mode="manual"
        class="rit-popover-anchor"
      >
        <!-- anchor: the full-width virtual element that UPopover measures -->
        <template #default>
          <!-- empty: anchor is the .rit-root div itself, not a child -->
          <span class="rit-popover-trigger" />
        </template>

        <template #content>
          <div
            class="rit-dropdown"
            role="listbox"
            :aria-label="placeholder || 'Suggestions'"
          >
            <div v-if="asyncLoading" class="rit-dropdown__loader">
              <i class="ri-loader-4-line rit-spin" />
              <span>{{ loadingLabel }}</span>
            </div>
            <div
              v-else-if="visibleSuggestions.length === 0"
              class="rit-dropdown__empty"
            >
              <slot name="empty" :query="inputQuery">
                <i class="ri-search-line" />
                <span>{{ emptyLabel }}</span>
              </slot>
            </div>
            <template v-else>
              <button
                v-for="(item, idx) in visibleSuggestions"
                :key="idx"
                class="rit-dropdown__item"
                :class="{
                  'rit-dropdown__item--active': activeSuggestionIdx === idx,
                }"
                role="option"
                :aria-selected="activeSuggestionIdx === idx"
                type="button"
                @mousedown.prevent="selectSuggestion(item)"
                @mouseover="activeSuggestionIdx = idx"
              >
                <slot
                  name="suggestion"
                  :item="item"
                  :query="inputQuery"
                  :active="activeSuggestionIdx === idx"
                >
                  <span
                    class="rit-dropdown__text"
                    v-html="highlightMatch(displayItem(item), inputQuery)"
                  />
                </slot>
              </button>
            </template>
          </div>
        </template>
      </UPopover>
    </template>

    <!-- ── 2. Plain Transition (opt-in via dropdownUi="transition") ───────
         Zero extra deps. Absolute-positioned below the input.
         Use when you don't want UPopover's portal behaviour.
    ── -->
    <template v-else-if="dropdownUi === 'transition'">
      <Transition name="rit-drop">
        <div
          v-if="showDropdown"
          class="rit-dropdown rit-dropdown--absolute"
          role="listbox"
          :aria-label="placeholder || 'Suggestions'"
        >
          <div v-if="asyncLoading" class="rit-dropdown__loader">
            <i class="ri-loader-4-line rit-spin" />
            <span>{{ loadingLabel }}</span>
          </div>
          <div
            v-else-if="visibleSuggestions.length === 0"
            class="rit-dropdown__empty"
          >
            <slot name="empty" :query="inputQuery">
              <i class="ri-search-line" />
              <span>{{ emptyLabel }}</span>
            </slot>
          </div>
          <template v-else>
            <button
              v-for="(item, idx) in visibleSuggestions"
              :key="idx"
              class="rit-dropdown__item"
              :class="{
                'rit-dropdown__item--active': activeSuggestionIdx === idx,
              }"
              role="option"
              :aria-selected="activeSuggestionIdx === idx"
              type="button"
              @mousedown.prevent="selectSuggestion(item)"
              @mouseover="activeSuggestionIdx = idx"
            >
              <slot
                name="suggestion"
                :item="item"
                :query="inputQuery"
                :active="activeSuggestionIdx === idx"
              >
                <span
                  class="rit-dropdown__text"
                  v-html="highlightMatch(displayItem(item), inputQuery)"
                />
              </slot>
            </button>
          </template>
        </div>
      </Transition>
    </template>
  </div>
</template>

<script setup>
// No lang="ts" — plain JS script setup
// Generic <T> removed; types.ts still available for consumers who want them

// ── Props ──────────────────────────────────────────────────────────────────
const props = defineProps({
  // ── UInputTags native ────────────────────────────────────────────────────
  as:             { type: String,   default: 'div'      },
  placeholder:    { type: String,   default: undefined  },
  maxLength:      { type: Number,   default: undefined  },
  color:          { type: String,   default: 'primary'  },
  variant:        { type: String,   default: 'outline'  },
  size:           { type: String,   default: 'md'       },
  autofocus:      { type: Boolean,  default: false      },
  autofocusDelay: { type: Number,   default: 0          },
  deleteIcon:     { type: String,   default: undefined  },
  highlight:      { type: Boolean,  default: false      },
  fixed:          { type: Boolean,  default: false      },
  defaultValue:   { type: Array,    default: undefined  },
  addOnPaste:     { type: Boolean,  default: false      },
  addOnTab:       { type: Boolean,  default: false      },
  addOnBlur:      { type: Boolean,  default: false      },
  duplicate:      { type: Boolean,  default: false      },
  disabled:       { type: Boolean,  default: false      },
  delimiter:      { type: [String, Object], default: undefined }, // RegExp is Object at runtime
  max:            { type: Number,   default: undefined  },
  id:             { type: String,   default: undefined  },
  name:           { type: String,   default: undefined  },
  required:       { type: Boolean,  default: false      },
  readonly:       { type: [Boolean, String], default: undefined },
  autocomplete:   { type: String,   default: undefined  },
  list:           { type: String,   default: undefined  },
  convertValue:   { type: Function, default: undefined  },
  displayValue:   { type: Function, default: undefined  },
  icon:           { type: String,   default: undefined  },
  avatar:         { type: Object,   default: undefined  },
  leading:        { type: Boolean,  default: false      },
  leadingIcon:    { type: String,   default: undefined  },
  trailing:       { type: Boolean,  default: false      },
  trailingIcon:   { type: String,   default: undefined  },
  loading:        { type: Boolean,  default: false      },
  loadingIcon:    { type: String,   default: undefined  },
  ui:             { type: Object,   default: () => ({}) },

  // ── RInputTags additions ─────────────────────────────────────────────────
  fetchSuggestions: { type: Function, default: undefined },
  debounce:         { type: Number,   default: 300       },
  suggestions:      { type: Array,    default: undefined },
  filterFn:         { type: Function, default: undefined },
  createNew:        { type: Boolean,  default: true      },
  maxSuggestions:   { type: Number,   default: 20        },
  emptyLabel:       { type: String,   default: 'No results' },
  loadingLabel:     { type: String,   default: 'Loading...' },

  /**
   * Dropdown UI strategy:
   *  'nuxtui'     (default) — UPopover from NuxtUI, gets portal/z-index/a11y for free
   *  'transition' — plain Vue <Transition> + absolute-positioned div (zero deps)
   */
  dropdownUi: { type: String, default: 'nuxtui' }, // 'nuxtui' | 'transition'
})

// ── Emits ──────────────────────────────────────────────────────────────────
const emit = defineEmits([
  'update:modelValue',
  'change', 'blur', 'focus', 'invalid', 'addTag', 'removeTag',
  'fetch:start', 'fetch:done', 'fetch:error',
])

// ── v-model ────────────────────────────────────────────────────────────────
const model = defineModel({ default: () => [] })

// ── Template refs / expose ─────────────────────────────────────────────────
const inputTagsRef = ref(null)

/** Mirrors UInputTags exposed `inputRef` */
const inputRef = computed(() => inputTagsRef.value?.inputRef ?? null)

defineExpose({ inputRef, inputTagsRef })

// ── Suggestion / autocomplete state ────────────────────────────────────────
const inputQuery          = ref('')
const asyncLoading        = ref(false)
const asyncSuggestions    = ref([])
const activeSuggestionIdx = ref(-1)
const isFocused           = ref(false)

const hasSuggestionMode = computed(() =>
  !!(props.suggestions?.length || props.fetchSuggestions)
)

// Resolved suggestion list (async overrides local)
const resolvedSuggestions = computed(() => {
  if (props.fetchSuggestions) return asyncSuggestions.value
  const raw = props.suggestions ?? []
  if (!inputQuery.value) return raw
  const q = inputQuery.value.toLowerCase()
  return props.filterFn
    ? raw.filter(i => props.filterFn(i, inputQuery.value))
    : raw.filter(i => String(displayItem(i)).toLowerCase().includes(q))
})

const visibleSuggestions = computed(() =>
  resolvedSuggestions.value
    .filter(i => !alreadySelected(i))
    .slice(0, props.maxSuggestions)
)

const showDropdown = computed(() =>
  hasSuggestionMode.value &&
  isFocused.value &&
  inputQuery.value.length > 0 &&
  !props.disabled &&
  (asyncLoading.value || visibleSuggestions.value.length > 0 ||
    (visibleSuggestions.value.length === 0 && !asyncLoading.value))
)

// ── Debounced async fetch ──────────────────────────────────────────────────
let debounceTimer = null

function scheduleAsyncFetch(query) {
  if (!props.fetchSuggestions) return
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(async () => {
    asyncLoading.value = true
    emit('fetch:start', query)
    try {
      const results = await props.fetchSuggestions(query)
      asyncSuggestions.value = results
      emit('fetch:done', results)
    } catch (err) {
      emit('fetch:error', err)
      asyncSuggestions.value = []
    } finally {
      asyncLoading.value = false
    }
  }, props.debounce)
}

// Watch the native input's value via MutationObserver + input event
// UInputTags exposes inputRef — we wire the 'input' event to it after mount.
function attachInputListener() {
  const el = inputRef.value
  if (!el) return

  el.addEventListener('input', (e) => {
    const val = e.target.value
    inputQuery.value = val
    activeSuggestionIdx.value = -1
    if (props.fetchSuggestions) scheduleAsyncFetch(val)
  })

  el.addEventListener('keydown', onInputKeydown)

  el.addEventListener('blur', () => {
    setTimeout(() => { isFocused.value = false }, 150)
  })
}

onMounted(() => {
  // Wait for UInputTags to render its inputRef
  nextTick(attachInputListener)
})

// ── Keyboard navigation in dropdown ───────────────────────────────────────
function onInputKeydown(e) {
  if (!showDropdown.value) return

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      activeSuggestionIdx.value = Math.min(
        activeSuggestionIdx.value + 1,
        visibleSuggestions.value.length - 1
      )
      break
    case 'ArrowUp':
      e.preventDefault()
      activeSuggestionIdx.value = Math.max(activeSuggestionIdx.value - 1, -1)
      break
    case 'Enter':
      if (activeSuggestionIdx.value >= 0) {
        e.preventDefault()
        e.stopPropagation()
        selectSuggestion(visibleSuggestions.value[activeSuggestionIdx.value])
      } else if (!hasSuggestionMode.value || props.createNew) {
        // Fall through to UInputTags default Enter behaviour
      } else {
        // Block adding unknown tag when createNew=false and suggestions are in use
        e.preventDefault()
      }
      break
    case 'Escape':
      isFocused.value = false
      activeSuggestionIdx.value = -1
      break
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────
function displayItem(item) {
  if (props.displayValue) {
    return props.displayValue(item)
  }

  return String(item)
}

function alreadySelected(item) {
  if (props.duplicate) {
    return false
  }

  const disp = displayItem(item)

  return (model.value ?? []).some(
    v => displayItem(v) === disp
  )
}

function selectSuggestion(item) {
  const converted = props.convertValue
    ? props.convertValue(displayItem(item))
    : item

  if (!props.duplicate && alreadySelected(converted)) return

  const next = [...(model.value ?? []), converted]
  model.value = next
  emit('update:modelValue', next)
  emit('addTag', converted)

  // Clear the native input
  if (inputRef.value) {
    inputRef.value.value = ''
    inputRef.value.dispatchEvent(new Event('input'))
  }
  inputQuery.value = ''
  activeSuggestionIdx.value = -1
  asyncSuggestions.value = []
}

/** Highlight matching characters in suggestion text */
function highlightMatch(text, query) {
  if (!query) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(
    new RegExp(`(${escaped})`, 'gi'),
    '<mark class="rit-highlight">$1</mark>'
  )
}

// ── Emit forwarding ────────────────────────────────────────────────────────
function onAddTag(v) {
  emit('addTag', v)
}

function onUpdateModel(v) {
  model.value = v
  emit('update:modelValue', v)
}

// ── Props passthrough to UInputTags (exclude RInputTags-only props) ────────
// We list UInputTags native props explicitly so RInputTags additions
// (fetchSuggestions, debounce, suggestions, filterFn, createNew, etc.)
// are never forwarded as unknown attrs.
const passthroughProps = computed(() => ({
  as:             props.as,
  placeholder:    props.placeholder,
  maxLength:      props.maxLength,
  color:          props.color,
  variant:        props.variant,
  size:           props.size,
  autofocus:      props.autofocus,
  autofocusDelay: props.autofocusDelay,
  deleteIcon:     props.deleteIcon,
  highlight:      props.highlight,
  fixed:          props.fixed,
  defaultValue:   props.defaultValue,
  addOnPaste:     props.addOnPaste,
  addOnTab:       props.addOnTab,
  addOnBlur:      props.addOnBlur,
  duplicate:      props.duplicate,
  delimiter:      props.delimiter,
  max:            props.max,
  id:             props.id,
  name:           props.name,
  required:       props.required,
  readonly:       props.readonly,
  autocomplete:   props.autocomplete,
  list:           props.list,
  convertValue:   props.convertValue,
  displayValue:   props.displayValue,
  icon:           props.icon,
  avatar:         props.avatar,
  leading:        props.leading,
  leadingIcon:    props.leadingIcon,
  trailing:       props.trailing,
  trailingIcon:   props.trailingIcon,
  loadingIcon:    props.loadingIcon,
}))

// ── Merged UI: inject SARIKA class hooks then spread caller overrides ───────
const mergedUI = computed(() => ({
  root:          'rit-u-root',
  base:          'rit-u-base',
  leading:       'rit-u-leading',
  leadingIcon:   'rit-u-leading-icon',
  trailing:      'rit-u-trailing',
  trailingIcon:  'rit-u-trailing-icon',
  item:          'rit-u-item',
  itemText:      'rit-u-item-text',
  itemDelete:    'rit-u-item-delete',
  itemDeleteIcon:'rit-u-item-delete-icon',
  input:         'rit-u-input',
  ...(props.ui ?? {}),
}))

// ── SSR safety ────────────────────────────────────────────────────────────
// All DOM-touching logic is in onMounted — safe for SSR.
</script>

<style lang="scss">
/* ════════════════════════════════════════════════════════════════════════════
   RInputTags — global SCSS  ·  SARIKA tokens  ·  no Tailwind  ·  dark + light
   Namespace: .rit-root  (never leaks outside)
   ════════════════════════════════════════════════════════════════════════════ */

// ── Host wrapper ─────────────────────────────────────────────────────────
.rit-root {
  position: relative;
  width: 100%;
  font-family: var(--font-fallback);
}

// ── UInputTags base slot: the multi-line flex container ───────────────────
.rit-u-root,
.rit-root [data-slot="root"] {
  width: 100%;
}

.rit-u-base,
.rit-root [data-slot="base"] {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-1);
  width: 100%;
  min-height: 38px;
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--r-md) !important;
  border: 1px solid var(--color-w-b-3) !important;
  background: var(--c-surface) !important;
  color: var(--c-text) !important;
  font-family: var(--font-fallback) !important;
  font-size: 13px !important;
  transition:
    border-color var(--t-fast) var(--ease-out),
    box-shadow var(--t-fast) var(--ease-out),
    background var(--t-fast) var(--ease-out);

  // Focus-within ring
  &:focus-within {
    border-color: var(--c-accent) !important;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--c-accent) 15%, transparent) !important;
    outline: none !important;
  }

  // highlight prop (validation error uses this too)
  .rit-root [data-highlight] &,
  .rit-root.rit-root--highlight & {
    border-color: var(--c-accent) !important;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--c-accent) 15%, transparent) !important;
  }

  // Disabled
  [data-disabled] &,
  &:has(input:disabled) {
    background: var(--bg-tertiary) !important;
    opacity: 0.65;
    cursor: not-allowed;
  }
}

// ── Variant surface overrides ─────────────────────────────────────────────
.rit-root--soft .rit-u-base {
  background: color-mix(in srgb, var(--c-surface) 60%, transparent) !important;
  border-color: transparent !important;
}
.rit-root--subtle .rit-u-base {
  background: color-mix(in srgb, var(--c-muted) 8%, transparent) !important;
}
.rit-root--ghost .rit-u-base {
  background: transparent !important;
  border-color: transparent !important;
  &:focus-within {
    background: color-mix(in srgb, var(--c-muted) 6%, transparent) !important;
  }
}
.rit-root--none .rit-u-base {
  background: transparent !important;
  border-color: transparent !important;
  box-shadow: none !important;
}

// ── Size adjustments ──────────────────────────────────────────────────────
.rit-root--xs .rit-u-base {
  min-height: 28px;
  padding: var(--sp-1) var(--sp-2);
  font-size: 11px !important;
}
.rit-root--sm .rit-u-base {
  min-height: 32px;
  padding: var(--sp-1) var(--sp-3);
  font-size: 12px !important;
}
.rit-root--md .rit-u-base {
  min-height: 38px;
}
.rit-root--lg .rit-u-base {
  min-height: 44px;
  padding: var(--sp-2) var(--sp-4);
  font-size: 14px !important;
}
.rit-root--xl .rit-u-base {
  min-height: 50px;
  padding: var(--sp-3) var(--sp-4);
  font-size: 15px !important;
}

// ── Tag item ──────────────────────────────────────────────────────────────
.rit-u-item,
.rit-root [data-slot="item"] {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  border-radius: var(--r-full);
  font-size: 0.72rem !important;
  font-weight: 600;
  line-height: 1.4;
  color: var(--c-accent) !important;
  background: color-mix(in srgb, var(--c-accent) 12%, transparent) !important;
  border: 1px solid color-mix(in srgb, var(--c-accent) 28%, transparent) !important;
  font-family: var(--font-fallback);
  transition:
    background var(--t-fast),
    border-color var(--t-fast);
  flex-shrink: 0;

  // Active (being navigated via keyboard in Reka)
  &[data-state="active"] {
    background: color-mix(in srgb, var(--c-accent) 22%, transparent) !important;
    border-color: var(--c-accent) !important;
    box-shadow: var(--glow-accent-sm);
  }

  // Disabled tag
  &[data-disabled] {
    opacity: 0.5;
    pointer-events: none;
  }
}

// ── Tag text ──────────────────────────────────────────────────────────────
.rit-u-item-text,
.rit-root [data-slot="itemText"] {
  font-size: inherit !important;
  color: inherit !important;
  line-height: 1.3;
}

// ── Tag delete button ─────────────────────────────────────────────────────
.rit-u-item-delete,
.rit-root [data-slot="itemDelete"] {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: color-mix(in srgb, var(--c-accent) 70%, transparent);
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition:
    background var(--t-fast),
    color var(--t-fast);

  &:hover {
    background: color-mix(in srgb, var(--c-accent) 20%, transparent);
    color: var(--c-accent);
  }

  &:disabled {
    pointer-events: none;
  }
}

.rit-u-item-delete-icon,
.rit-root [data-slot="itemDeleteIcon"] {
  font-size: 10px !important;
  line-height: 1;
}

// ── Native input inside UInputTags ────────────────────────────────────────
.rit-u-input,
.rit-root [data-slot="input"] {
  flex: 1;
  min-width: 80px;
  border: none !important;
  outline: none !important;
  background: transparent !important;
  color: var(--c-text) !important;
  font-size: inherit !important;
  font-family: var(--font-fallback) !important;
  padding: 0;
  line-height: 1.5;

  &::placeholder {
    color: var(--c-muted) !important;
  }
  &:disabled {
    cursor: not-allowed;
  }
}

// ── Leading / trailing icon slots ─────────────────────────────────────────
.rit-u-leading,
.rit-root [data-slot="leading"] {
  display: flex;
  align-items: center;
  padding-left: var(--sp-3);
  color: var(--c-muted);
  flex-shrink: 0;
}

.rit-u-trailing,
.rit-root [data-slot="trailing"] {
  display: flex;
  align-items: center;
  padding-right: var(--sp-3);
  color: var(--c-muted);
  flex-shrink: 0;
}

.rit-u-leading-icon,
.rit-u-trailing-icon,
.rit-root [data-slot="leadingIcon"],
.rit-root [data-slot="trailingIcon"] {
  font-size: 1rem;
  color: var(--c-muted);
}

// ── Suggestion dropdown ───────────────────────────────────────────────────
// Shared content styles used by both UPopover and Transition modes.
// .rit-dropdown--absolute adds position:absolute for the Transition mode.
.rit-dropdown {
  border-radius: var(--r-lg);
  border: 1px solid var(--c-border);
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  box-shadow: var(--glass-shadow);
  overflow: hidden;
  max-height: 240px;
  overflow-y: auto;
  min-width: 200px;

  // SARIKA scrollbar
  scrollbar-width: thin;
  scrollbar-color: var(--color-w-b-3) transparent;
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--color-w-b-3);
    border-radius: var(--r-full);
  }

  // Transition mode: positioned absolute below the input
  &--absolute {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    z-index: 50;
  }

  &__loader,
  &__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--sp-2);
    padding: var(--sp-4);
    font-size: 0.8125rem;
    color: var(--c-muted);
    font-family: var(--font-fallback);
  }

  &__item {
    display: flex;
    align-items: center;
    width: 100%;
    padding: var(--sp-2) var(--sp-3);
    border: none;
    background: transparent;
    color: var(--c-text);
    font-size: 0.8125rem;
    font-family: var(--font-fallback);
    font-weight: 500;
    text-align: left;
    cursor: pointer;
    transition: background var(--t-fast) var(--ease-out);

    &:hover,
    &--active {
      background: color-mix(in srgb, var(--c-accent) 8%, transparent);
      color: var(--c-accent);
    }
  }

  &__text {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

// ── UPopover mode: override UPopover's content wrapper ────────────────────
// UPopover teleports [data-slot="content"] to body.
// .rit-popover-content is injected via ui.content so we can target it globally.
.rit-popover-content {
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  border-radius: 0 !important;
  // The inner .rit-dropdown carries all the real surface styles above.
}

// The invisible trigger span UPopover measures — full-width stretch
.rit-popover-anchor {
  display: contents; // no layout impact on .rit-root
}
.rit-popover-trigger {
  display: block;
  width: 100%;
  height: 0;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
}

// ── Highlight match in dropdown ───────────────────────────────────────────
.rit-highlight {
  background: color-mix(in srgb, var(--c-accent) 22%, transparent);
  color: var(--c-accent);
  font-weight: 700;
  border-radius: 2px;
  padding: 0 2px;
}

// ── Dropdown transition ───────────────────────────────────────────────────
.rit-drop-enter-active,
.rit-drop-leave-active {
  transition:
    opacity var(--t-fast) var(--ease-out),
    transform var(--t-fast) var(--ease-out);
}
.rit-drop-enter-from,
.rit-drop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}

// ── Spinner animation ─────────────────────────────────────────────────────
.rit-spin {
  animation: rit-spin 0.7s linear infinite;
}
@keyframes rit-spin {
  to {
    transform: rotate(360deg);
  }
}

// ── Dark mode ────────────────────────────────────────────────────────────
.dark {
  .rit-u-base,
  .rit-root [data-slot="base"] {
    border-color: var(--color-w-b-2) !important;
    background: var(--c-surface) !important;
  }

  .rit-dropdown {
    box-shadow:
      0 8px 32px color-mix(in srgb, #000 50%, transparent),
      0 1px 0 color-mix(in srgb, #fff 4%, transparent) inset;
  }
}
</style>
