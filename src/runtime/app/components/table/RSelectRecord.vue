<template>
  <div class="rsr-wrap">

    <!-- ══ MODE: USelect (NuxtUI 4.8.0) ══════════════════════════════════ -->
    <template v-if="mode === 'nuxtui'">
      <USelect
        v-model="model"
        :items="selectItems"
        value-key="value"
        label-key="label"
        size="sm"
        :disabled="loading"
        :aria-label="t ? t('rows_per_page') : 'Rows per page'"
        :ui="mergedUI"
        @update:model-value="onSelect"
      >
      <template #item="{ item }">
        <span
          :class="{
            'selected-item': model === item.value
          }"
        >
          {{ item.label }}
        </span>
      </template>
    </USelect>
    </template>

    <!-- ══ MODE: Flowbite (default — keeps original look exactly) ════════ -->
    <template v-else>
      <fwb-dropdown
        placement="top"
        class="rty-popup-drop-record"
        close-inside
        @show="isOpen = true"
        @hide="isOpen = false"
      >
        <template #trigger>
          <div class="trigger" :class="{ disabled: loading }">
            <span>
              {{ model }}
              <i
                class="ri-arrow-down-s-line"
                :class="{ isShow: isOpen }"
              />
            </span>
          </div>
        </template>

        <FwbListGroup class="popup">
          <div
            v-for="item in items"
            :key="item"
            class="item"
            :class="{ active: model === item }"
            @click="fnClick(item)"
          >
            <span>{{ item }}</span>
          </div>
        </FwbListGroup>
      </fwb-dropdown>
    </template>

  </div>
</template>

<script setup>
const { t } = useI18n()

const model = defineModel()

const props = defineProps({
  loading: { type: Boolean, default: false },
  /**
   * 'flowbite' (default) — original dropdown look, zero dep on USelect portal issues
   * 'nuxtui'             — USelect v4.8.0, styled to match the same compact look
   */
  mode:  { type: String, default: 'flowbite' },
  /** Override the items list. Defaults to [10, 20, 50, 100] */
  items: { type: Array, default: () => [10, 20, 50, 100] },
  /** ui override passthrough for nuxtui mode */
  ui:    { type: Object, default: () => ({}) },
})

const mode = computed(() => props.mode || 'flowbite')
const loading = computed(() => props.loading)
const items = computed(() => props.items)
const _ui = computed(() => props.ui)
const emit = defineEmits(['select'])

// ── Flowbite: open state tracked via fwb-dropdown events ──────────────────
// Bug fix: original used `!!refPopup` (always truthy) to detect open state.
// Now we track properly via @show/@hide events on fwb-dropdown.
const isOpen = ref(false)

function fnClick(val) {
  model.value = val
  emit('select', val)
}

// ── USelect: items must be objects with value + label ─────────────────────
const selectItems = computed(() =>
  props.items.map(n => ({ value: n, label: String(n) }))
)

function onSelect(val) {
  model.value = val
  emit('select', val)
}

// ── USelect UI — keeps the same 60px compact look as the flowbite version ─
// All classes are SARIKA global SCSS hooks (no Tailwind — TW4 not active).
// Bug fix: original uiSelection mixed dead TW utilities with SCSS class names.
const mergedUI = computed(() => ({
  base:        'rsr-u-base',
  trailing:    'rsr-u-trailing',
  trailingIcon:'rsr-u-trailing-icon',
  content:     'rsr-u-content',
  item:        'rsr-u-item',
  ...props.ui,
}))
</script>

<style lang="scss">
/* ════════════════════════════════════════════════════════════════════════════
   RSelectRecord — global SCSS (no scoped)
   Preserves original flowbite look exactly; USelect mode mirrors same size.
   SARIKA tokens only · dark + light
   ════════════════════════════════════════════════════════════════════════════

   WHY GLOBAL (not scoped)?
   USelect portal teleports [data-slot="content"] to document.body.
   Scoped [data-v-xxx] never reaches those elements.
   Flowbite dropdown also appends outside the component subtree.
   Both require non-scoped CSS. Namespaced under .rsr-* / .rty-* for safety.
   ════════════════════════════════════════════════════════════════════════════ */

// ── Wrapper ─────────────────────────────────────────────────────────────────
.rsr-wrap {
  display:         inline-flex;
  align-items:     center;
  user-select:     none;
  font-family:     var(--font-fallback);
}

/* ══ FLOWBITE MODE — original styles kept verbatim, only token fixes ════════ */
.rty-popup-drop-record {
  display:  flex;
  gap:      6px;
  user-select: none;
  position: relative;

  .trigger {
    width:         60px;
    height:        32px;
    border-radius: 10px;
    padding:       0 8px 0 10px;
    background:    var(--bg-content, var(--c-surface));
    color:         var(--color-w-b-1);
    cursor:        pointer;
    transition:    background var(--t-fast) var(--ease-out),
                   border-color var(--t-fast) var(--ease-out);

    &:hover { background: color-mix(in srgb, var(--c-accent) 6%, var(--c-surface)); }

    // Bug fix: .disabled was inside trigger span — now on the trigger div itself
    &.disabled {
      pointer-events: none;
      opacity:        0.5;
      cursor:         not-allowed;
    }

    span {
      height:          100%;
      display:         flex;
      justify-content: space-between;
      align-items:     center;
      font-size:       13px;
      line-height:     13px;
      pointer-events:  none;

      i {
        font-size:   13px;
        line-height: 13px;
        transition:  transform 0.2s ease-in-out;    // Bug fix: was `transition: 0.2s` (shorthand missing property)

        &.isShow { transform: rotate(180deg); }
      }
    }
  }

  .popup {
    width:          60px;
    min-width:      60px;
    position:       absolute;
    padding:        6px 0;
    background:     var(--bg-content, var(--c-surface));
    border-radius:  10px;
    box-shadow:     0 6px 20px color-mix(in srgb, #000 18%, transparent);
    bottom:         4px;
    transform:      translateY(6px);
    opacity:        1;
    display:        flex;
    flex-direction: column;
    border:         none;
    animation:      rsr-ani-up 0.2s ease-in-out;

    .item {
      height:          25px;
      padding:         0 16px;
      font-size:       13px;
      display:         flex;
      align-items:     center;
      justify-content: space-between;
      cursor:          pointer;
      color:           var(--color-w-b-1);
      transition:      color 0.25s ease-in-out;

      span { pointer-events: none; }

      &:hover { color: var(--c-accent); }     // Bug fix: --color-primary → --c-accent (SARIKA token)
      &.active { color: var(--c-accent); }
    }
  }
}

@keyframes rsr-ani-up {
  from { transform: translateY(0);   opacity: 0; }
  to   { transform: translateY(6px); opacity: 1; }
}

// Context overrides (.rty-content / .rty-modal) — kept exactly
.rty-content,
.rty-modal {
  .rty-popup-drop-record {
    .trigger { background: var(--c-surface); }
    .popup   { background: var(--c-surface); }
  }
}

/* ══ USELECT MODE — global hooks, same compact 60px look ═══════════════════ */

// Base: the trigger button
.rsr-u-base,
.rsr-wrap {
  display:         inline-flex !important;
  align-items:     center !important;
  justify-content: space-between !important;
  width:           60px !important;
  height:          32px !important;
  padding:         0 8px 0 10px !important;
  border-radius:   10px !important;
  font-size:       13px !important;
  font-family:     var(--font-400) !important;
  color:           var(--color-w-b-1) !important;
  // background:      var(--bg-content, var(--c-surface)) !important;
  border:          none !important;
  // box-shadow:      none !important;
  cursor:          pointer !important;
  background:    var(--bg-content, var(--c-surface)) !important;
  box-shadow:    0px 1px 20px color-mix(in srgb, #393939 4%, transparent) !important;
  transition:      background var(--t-fast) var(--ease-out) !important;

  &:hover:not([data-disabled]) {
    background: color-mix(in srgb, var(--c-accent) 6%, var(--c-surface)) !important;
  }
  &[data-disabled] { opacity: .5; cursor: not-allowed !important; }
}

// Trailing chevron wrapper
.rsr-u-trailing,
.rsr-wrap{
  padding: 0 !important;
  margin:  0 !important;
  gap:     0 !important;
  display: flex;
  align-items: center;
}

.rsr-u-trailing-icon,
.rsr-wrap {
  font-size:   13px !important;
  color:       var(--color-w-b-1) !important;
  transition:  transform var(--t-fast) var(--ease-out) !important;

  // Rotate when open — USelect adds data-state="open" on its trigger
  [data-state="open"] & { transform: rotate(180deg); }
}

// Dropdown content (teleported — must be global)
.rsr-u-content {
  min-width:     60px !important;
  width:         60px !important;
  padding:       6px 0 !important;
  border-radius: 10px !important;
  border:        none !important;
  background:    var(--bg-content, var(--c-surface)) !important;
  box-shadow:    0 6px 20px color-mix(in srgb, #000 18%, transparent) !important;
  animation:     rsr-ani-up 0.2s ease-in-out !important;
}

.selected-item{
  color: gold !important;
}
/* Hide the selected checkmark in USelect */
.rsr-u-content {
  [data-slot="item"] [data-slot="item-trailing"],
  [data-slot="item"] [data-slot="item-leading"] {
    display: none !important;
  }
}

/* Keep selected item highlighted with accent color */
.rsr-u-content {
  [data-slot="item"][data-selected],
  [data-slot="item"][aria-selected="true"] {
    color: var(--c-accent) !important;
    background: transparent !important;
  }
}

// Individual option item inside dropdown
.rsr-u-item,
[data-slot="item"].rsr-u-item {
  height:          25px !important;
  padding:         0 16px !important;
  font-size:       13px !important;
  font-family:     var(--font-fallback) !important;
  color:           var(--color-w-b-1) !important;
  background:      transparent !important;
  border-radius:   0 !important;
  cursor:          pointer !important;
  transition:      color 0.25s ease-in-out !important;
  align-items: center;
  justify-content: center;

  &:hover,
  &[data-highlighted] { color: var(--c-accent) !important; background: transparent !important; }

  &[data-selected],
  &[aria-selected="true"] { color: var(--c-accent) !important; }
}

// Dark mode — both modes
.dark {
  .rty-popup-drop-record .trigger,
  .rty-popup-drop-record .popup,
  .rsr-u-base,
  .rsr-u-content {
    background: var(--c-surface) !important;
  }
}
</style>