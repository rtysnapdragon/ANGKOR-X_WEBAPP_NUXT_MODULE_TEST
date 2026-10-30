<script setup>
// RSelect — SARIKA  (NuxtUI v4.8.2)
// Full rebuild of old NuxtUI2 USelectMenu to NuxtUI v4 USelectMenu
// Supports: local data, API data, single, multiple, search, remote-select, scroll-load
// No lang="ts" — plain <script setup>

import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

// ── Props (mirrors old RSelect API + NuxtUI v4 additions) ─────────────────
const props = defineProps({
  // Data sources
  localData: {
    type: Object,
    default: null,
    // { data: [], keySearch: ['Name','NameEnglish'] }
  },
  api: {
    type: Object,
    default: null,
    // { url, method, where, filter, subChild }
  },

  // Behavior
  multiple:            { type: Boolean, default: false },
  searchable:          { type: [Boolean, String], default: true },
  disabled:            { type: Boolean, default: false },
  required:            { type: Boolean, default: false },  // hides "clear" option
  defaultSelect:       { type: Boolean, default: false },
  selectIfOne:         { type: Boolean, default: false },
  isNotAllowClear:     { type: Boolean, default: false },
  isNotAllowRemoteSelect: { type: Boolean, default: false },
  clearSelect:         { type: Boolean, default: true },

  // Display
  placeholder:         { type: String,  default: null },
  colorPlaceholder:    { type: Boolean, default: false },
  pk:                  { type: String,  default: 'Id' },
  variant:             { type: String,  default: 'outline' },
  leadingIcon:         { type: String,  default: null },
  fullWidth:           { type: Boolean, default: true },

  // Templates for rich option rendering
  templateLeading: { type: Object, default: null },
  // { labelKey, labelKeyEn, imagePath, imageType, gender }
  templateOption:  { type: Object, default: null },
  // { labelKey, labelKeyEn, subLabelKey, subLabelKeyEn, imagePath, imageType, gender }

  // NuxtUI v4 passthrough
  size:  { type: String, default: 'md' },
  color: { type: String, default: 'primary' },
  ui:    { type: Object, default: () => ({}) },
})

const emit = defineEmits([
  'selected',
  'mapData',
  'onSearch',
  'onOpen',
  'update:loading',
])

// ── Model ─────────────────────────────────────────────────────────────────
const selected  = defineModel({ default: undefined })
const isLoading = defineModel('loading', { default: false })

// ── Internal state ────────────────────────────────────────────────────────
const listData   = ref([])
const query      = ref('')
const totalRecord = ref(0)
const pages      = ref(1)
const selectRef  = ref(null)

// ── Computed helpers ──────────────────────────────────────────────────────
const apiUrl       = computed(() => props.api?.url ?? '')
const customFilter = computed(() => props.api?.filter ?? {})
const pk           = computed(() => props.pk || 'Id')
const placeholder  = computed(() => props.placeholder ?? t('please_select') ?? 'Select…')
const isMultiple   = computed(() => !!props.multiple)
const isRequired   = computed(() => !!props.required)

// For NuxtUI v4 USelectMenu: items is the flat array
const items = computed(() => listData.value)

function getItemLabel(item) {
  if (!item) return ''
  // Try templateLeading first
  const tl = props.templateLeading
  if (tl?.labelKey || tl?.labelKeyEn) {
    return tBy({ km: item[tl.labelKey], en: item[tl.labelKeyEn] })
  }
  // Fallback: Name/NameEnglish convention
  return tBy({ km: item.Name, en: item.NameEnglish }) || item[pk.value] || ''
}

function getOptionLabel(item) {
  if (!item) return ''
  const to = props.templateOption
  if (to?.labelKey || to?.labelKeyEn) {
    return tBy({ km: item[to.labelKey], en: item[to.labelKeyEn] })
  }
  return getItemLabel(item)
}

function getOptionSubLabel(item) {
  const to = props.templateOption
  if (!to || (!to.subLabelKey && !to.subLabelKeyEn)) return ''
  return tBy({ km: item[to.subLabelKey], en: item[to.subLabelKeyEn] })
}

// ── NuxtUI v4 USelectMenu needs string labels (or object with label key)
// We transform items so USelectMenu can handle them natively
// then use #option slot for rich rendering
const searchFn = computed(() => {
  if (!props.searchable) return undefined
  if (apiUrl.value) return fnSearch
  return true  // local search
})

// ── Data fetching ──────────────────────────────────────────────────────────
let abortCtrl = null

async function getData(filter = {}, isFromSelect = false) {
  if (!apiUrl.value) return []
  const merged = { ...filter, ...customFilter.value }
  isLoading.value = true

  if (abortCtrl) abortCtrl.abort()
  abortCtrl = new AbortController()

  try {
    const { data, error } = await useHttp(apiUrl.value, {
      method:     props.api.method ?? 'GET',
      data:       isFromSelect ? filter : merged,
      controller: abortCtrl,
    })
    if (error?.value) return []

    let result = []
    if (props.api?.where)          result = data.value?.[props.api.where] ?? []
    else if (props.api?.subChild) {
      const sc = props.api.subChild
      result = data.value?.[sc.propFirst]?.[sc.index]?.[sc.propSecond] ?? []
    }
    else                           result = Array.isArray(data.value) ? data.value : (data.value?.data ?? [])

    emit('mapData', result)

    if (!isRequired.value && !isFromSelect && !isMultiple.value && !props.isNotAllowClear) {
      result = [{ [pk.value]: '', isDefault: true }, ...result]
    }
    if (isMultiple.value) {
      result = [
        { [pk.value]: 'selectAll', isSelectAll: true },
        { [pk.value]: 'clearAll',  isDefault: true  },
        ...result,
      ]
    }

    return result
  } catch { return [] }
  finally  { isLoading.value = false }
}

// ── Search ─────────────────────────────────────────────────────────────────
async function fnSearch(d) {
  emit('onSearch', d)
  if (!d) { query.value = ''; return listData.value }
  if (apiUrl.value) return await getData({ Search: d })
  // Local search fallback
  const keys = props.localData?.keySearch ?? ['Name', 'NameEnglish']
  return (props.localData?.data ?? []).filter(item =>
    keys.some(k => String(item[k] ?? '').toLowerCase().includes(d.toLowerCase()))
  )
}

// ── Init ───────────────────────────────────────────────────────────────────
onMounted(async () => {
  if (!isMultiple.value && typeof selected.value === 'object' && !selected.value) {
    selected.value = undefined
  }

  if (apiUrl.value) {
    listData.value = await getData({ Pages: 1, Records: 10 })
    const last = listData.value[listData.value.length - 1]
    totalRecord.value = last?.RecordCounts ?? last?.RecordCount ?? 0
  } else if (props.localData?.data) {
    listData.value = [...props.localData.data]
    emit('mapData', listData.value)
    if (!isRequired.value && !isMultiple.value && !props.isNotAllowClear) {
      listData.value.unshift({ [pk.value]: '', isDefault: true })
    }
    if (isMultiple.value) {
      listData.value.unshift({ [pk.value]: 'clearAll',  isDefault:  true })
      listData.value.unshift({ [pk.value]: 'selectAll', isSelectAll: true })
    }
  }

  if (props.defaultSelect && listData.value.length) {
    const first = listData.value.find(i => !i.isDefault && !i.isSelectAll)
    if (first) selected.value = isMultiple.value ? [first] : first
  }

  await fnSelectIfOne()
})

async function fnSelectIfOne() {
  if (!props.selectIfOne) return
  const real = listData.value.filter(i => !i.isDefault && !i.isSelectAll)
  if (real.length === 1) {
    selected.value = isMultiple.value ? [real[0]] : real[0]
  }
}

// ── Select handler ─────────────────────────────────────────────────────────
function onSelect(val) {
  if (!val) {
    emit('selected', isMultiple.value ? [] : undefined)
    return
  }

  if (isMultiple.value) {
    const arr = Array.isArray(val) ? val : [val]

    if (arr.some(i => i.isSelectAll)) {
      const all = listData.value.filter(i => !i.isDefault && !i.isSelectAll)
      selected.value = all
      emit('selected', all)
      return
    }
    if (arr.some(i => i.isDefault)) {
      selected.value = []
      emit('selected', [])
      return
    }
    emit('selected', arr)
    return
  }

  // Single
  if (val?.isDefault) { selected.value = undefined; emit('selected', undefined); return }
  emit('selected', val)
}

function removeTag(item) {
  if (!isMultiple.value) return
  const filtered = (selected.value ?? []).filter(i => i[pk.value] !== item[pk.value])
  selected.value = filtered
  emit('selected', filtered)
}

// ── Watchers ───────────────────────────────────────────────────────────────
watch(() => props.localData, (n) => {
  if (!n) return
  listData.value = [...(n.data ?? [])]
  if (!isRequired.value && !isMultiple.value && !props.isNotAllowClear) {
    listData.value.unshift({ [pk.value]: '', isDefault: true })
  }
}, { deep: true })

watch(() => customFilter.value, async (n, o) => {
  if (JSON.stringify(n) === JSON.stringify(o)) return
  await reload()
  selected.value = isMultiple.value ? [] : undefined
}, { deep: true })

watch(apiUrl, async () => {
  if (apiUrl.value) { await reload(); selected.value = isMultiple.value ? [] : undefined }
})

// ── Expose ─────────────────────────────────────────────────────────────────
async function reload() {
  listData.value = []
  listData.value = await getData({ Pages: 1, Records: 10 })
  totalRecord.value = listData.value[listData.value.length - 1]?.RecordCounts ?? 0
  await fnSelectIfOne()
}

async function remoteSelect(filter) {
  if (props.isNotAllowRemoteSelect) return
  const keyRemote = filter.pk ?? pk.value ?? 'Id'

  if (apiUrl.value) {
    const data = await getData(filter, true)
    if (isMultiple.value) {
      selected.value = data.filter(d => (filter[keyRemote] ?? []).includes(d[keyRemote]))
    } else {
      selected.value = data.find(d => d[keyRemote] === filter[keyRemote])
    }
  } else if (props.localData?.data) {
    const src = listData.value
    if (isMultiple.value) {
      selected.value = src.filter(d => (filter[keyRemote] ?? []).includes(d[keyRemote]))
    } else {
      selected.value = src.find(d => d[keyRemote] === filter[keyRemote])
    }
  }
}

defineExpose({ reload, remoteSelect })

// ── Merged UI ──────────────────────────────────────────────────────────────
const mergedUi = computed(() => ({
  base:   'rsel__trigger',
  option: { container: 'rsel__option' },
  ...props.ui,
}))
</script>

<template>
  <div
    :class="[
      'rsel',
      props.variant,
      { 'rsel--disabled': disabled, 'rsel--multiple-filled': isMultiple && selected?.length },
    ]"
  >
    <USelectMenu
      ref="selectRef"
      v-model="selected"
      v-model:query="query"
      :items="items"
      :multiple="isMultiple"
      :searchable="searchable ? fnSearch : false"
      :loading="isLoading"
      :disabled="disabled"
      :placeholder="placeholder"
      :size="size"
      :color="color"
      :leading-icon="leadingIcon"
      :ui="mergedUi"
      :value-key="pk"
      trailing-icon="ri-arrow-down-s-line"
      loading-icon="ri-loader-4-line"
      searchable-placeholder="Search…"
      :clear-search-on-close="true"
      :class="fullWidth ? 'w-full' : ''"
      @update:model-value="onSelect"
      @update:open="$emit('onOpen', selected)"
    >

      <!-- ── #leading slot ─────────────────────────────── -->
      <template v-if="$slots.iconLeading" #leading>
        <slot name="iconLeading" />
      </template>

      <!-- ── Label slot (trigger display) ─────────────── -->
      <template #default="{ open }">
        <button
          type="button"
          :class="['rsel__btn', { 'rsel__btn--open': open, 'rsel__btn--disabled': disabled }]"
          :disabled="disabled"
        >
          <!-- Leading icon -->
          <UIcon v-if="leadingIcon" :name="leadingIcon" class="rsel__lead-icon" />

          <!-- Single selected -->
          <template v-if="!isMultiple">
            <slot v-if="$slots.leading && selected && !selected.isDefault" name="leading" :data="selected" />
            <span
              v-else-if="selected && !selected.isDefault"
              class="rsel__label-text"
            >
              {{ getItemLabel(selected) }}
            </span>
            <span v-else class="rsel__placeholder" :class="{ 'rsel__placeholder--color': colorPlaceholder }">
              {{ placeholder }}
            </span>
          </template>

          <!-- Multiple selected tags -->
          <template v-else>
            <div v-if="selected?.length" class="rsel__tags">
              <span
                v-for="(item, i) in (selected ?? []).filter(i => !i.isDefault && !i.isSelectAll)"
                :key="i"
                class="rsel__tag"
              >
                <slot v-if="$slots.leading" name="leading" :data="item" />
                <span v-else class="rsel__tag-text">{{ getItemLabel(item) }}</span>
                <button type="button" class="rsel__tag-rm" @click.stop="removeTag(item)">
                  <i class="ri-close-circle-fill" aria-hidden="true" />
                </button>
              </span>
            </div>
            <span v-else class="rsel__placeholder">{{ placeholder }}</span>
          </template>

          <!-- Trailing chevron -->
          <i class="ri-arrow-down-s-line rsel__chevron" :class="{ 'rsel__chevron--open': open }" aria-hidden="true" />
        </button>
      </template>

      <!-- ── Option slot ───────────────────────────────── -->
      <template #option="{ item }">
        <!-- Select all -->
        <div v-if="item.isSelectAll" class="rsel__opt-special">
          {{ locale === 'km' ? '--- ជ្រើសរើសទាំងអស់ ---' : '--- Select All ---' }}
        </div>

        <!-- Clear all -->
        <div v-else-if="item.isDefault && isMultiple" class="rsel__opt-special">
          {{ locale === 'km' ? '--- សម្អាត ---' : '--- Clear Selected ---' }}
        </div>

        <!-- Default/clear (single) -->
        <div v-else-if="item.isDefault && !isMultiple" class="rsel__opt-clear">
          {{ clearSelect ? (locale === 'km' ? '--- សម្អាត ---' : '--- Clear ---') : (locale === 'km' ? 'ទាំងអស់' : 'All') }}
        </div>

        <!-- Custom slot -->
        <div v-else-if="$slots.option" class="rsel__opt-row">
          <slot name="option" :data="item" />
        </div>

        <!-- templateOption with image -->
        <div
          v-else-if="templateOption?.imagePath"
          class="rsel__opt-row"
        >
          <div class="rsel__opt-avatar">
            <img
              v-if="item[templateOption.imagePath]"
              :src="item[templateOption.imagePath]"
              class="rsel__opt-avatar-img"
              loading="lazy"
            />
            <span v-else class="rsel__opt-avatar-fb">
              <i class="ri-user-line" aria-hidden="true" />
            </span>
          </div>
          <div class="rsel__opt-text">
            <span class="rsel__opt-label">{{ getOptionLabel(item) }}</span>
            <span v-if="getOptionSubLabel(item)" class="rsel__opt-sub">{{ getOptionSubLabel(item) }}</span>
          </div>
        </div>

        <!-- templateOption text-only -->
        <div v-else-if="templateOption?.labelKey || templateOption?.labelKeyEn" class="rsel__opt-row">
          <div class="rsel__opt-text">
            <span class="rsel__opt-label">{{ getOptionLabel(item) }}</span>
            <span v-if="getOptionSubLabel(item)" class="rsel__opt-sub">{{ getOptionSubLabel(item) }}</span>
          </div>
        </div>

        <!-- Default: Name/NameEnglish -->
        <span v-else class="rsel__opt-label">{{ getItemLabel(item) }}</span>
      </template>

    </USelectMenu>
  </div>
</template>

<style lang="scss" scoped>
// ─────────────────────────────────────────────────────────
// HOST
// ─────────────────────────────────────────────────────────
.rsel {
  width:       100%;
  font-family: var(--font-fallback, 'Inter', system-ui, sans-serif);

  &--disabled { pointer-events: none; opacity: 0.65; }
}

// ─────────────────────────────────────────────────────────
// TRIGGER BUTTON
// ─────────────────────────────────────────────────────────
.rsel__btn {
  display:         flex;
  align-items:     center;
  width:           100%;
  min-height:      38px;
  padding:         6px 36px 6px 12px;
  background:      transparent;
  border:          1px solid var(--c-border, rgba(255,140,66,0.16));
  border-radius:   var(--radius-md, 10px);
  cursor:          pointer;
  font-family:     inherit;
  gap:             var(--space-2, 8px);
  position:        relative;
  // @include transition(fast);

  &:focus, &--open {
    border-color: var(--c-accent, #ff8c42);
    box-shadow:   0 0 0 3px rgba(255, 140, 66, 0.12);
    outline:      none;
  }

  &:hover:not(&--disabled) { border-color: rgba(255, 140, 66, 0.4); }
  &--disabled               { cursor: not-allowed; }
}

// Variants
.rsel.outline .rsel__btn     { background: transparent; }
.rsel.solid   .rsel__btn     { background: var(--bg-tertiary, #f1f3f6); border-color: transparent; }
.rsel.none    .rsel__btn     { background: transparent; border-color: transparent; box-shadow: none; }

.rsel__lead-icon {
  font-size:   1rem;
  color:       var(--c-muted, #8a7f72);
  flex-shrink: 0;
}

.rsel__label-text {
  flex:        1;
  font-size:   13px;
  color:       var(--c-text, #1a1510);
  // @include truncate;
}

.rsel__placeholder {
  flex:      1;
  font-size: 12px;
  color:     var(--c-muted, #8a7f72);
  // @include truncate;

  &--color { color: var(--c-accent, #ff8c42); opacity: 1; }
}

.rsel__chevron {
  position:     absolute;
  right:        10px;
  top:          50%;
  transform:    translateY(-50%);
  font-size:    1rem;
  color:        var(--c-muted, #8a7f72);
  // @include transition(fast);

  &--open { transform: translateY(-50%) rotate(180deg); }
}

// ─────────────────────────────────────────────────────────
// MULTIPLE TAGS
// ─────────────────────────────────────────────────────────
.rsel__tags {
  display:     flex;
  flex-wrap:   wrap;
  gap:         4px;
  flex:        1;
  min-width:   0;
  max-height:  80px;
  overflow-y:  auto;
  padding:     2px 0;
}

.rsel__tag {
  display:       flex;
  align-items:   center;
  gap:           4px;
  padding:       2px 6px 2px 8px;
  background:    var(--bg-tertiary, #f1f3f6);
  border-radius: var(--radius-md, 10px);
  font-size:     12px;
  color:         var(--c-text, #1a1510);

  &-text { max-width: 120px;
    //  @include truncate; 
    }

  &-rm {
    border:     none;
    background: transparent;
    padding:    0;
    cursor:     pointer;
    color:      var(--c-danger, #f87171);
    font-size:  14px;
    display:    flex;
    // @include transition(fast);
    &:hover { color: darken(#f87171, 10%); }
  }
}

// ─────────────────────────────────────────────────────────
// OPTION ROWS
// ─────────────────────────────────────────────────────────
.rsel__opt-special {
  font-size: 12px;
  color:     var(--c-muted, #8a7f72);
  padding:   8px 14px;
  width:     100%;
  opacity:   0.7;
  font-style: italic;
}

.rsel__opt-clear {
  font-size: 12px;
  color:     var(--c-muted, #8a7f72);
  padding:   8px 14px;
  width:     100%;
  opacity:   0.7;
}

.rsel__opt-row {
  display:     flex;
  align-items: center;
  gap:         var(--space-2, 8px);
  padding:     6px 12px;
  width:       100%;
}

.rsel__opt-avatar {
  width:         32px;
  height:        32px;
  border-radius: 50%;
  overflow:      hidden;
  flex-shrink:   0;
  background:    var(--bg-tertiary, #f1f3f6);
  // @include flex-center;

  &-img { width: 100%; height: 100%; object-fit: cover; }
  &-fb  { font-size: 1rem; color: var(--c-muted, #8a7f72); }
}

.rsel__opt-text {
  display:        flex;
  flex-direction: column;
  gap:            2px;
  min-width:      0;
}

.rsel__opt-label {
  font-size:   13px;
  color:       var(--c-text, #1a1510);
  // @include truncate;
}

.rsel__opt-sub {
  font-size: 11px;
  color:     var(--c-muted, #8a7f72);
  // @include truncate;
}
</style>

<!-- Global: NuxtUI USelectMenu portal overrides -->
<style lang="scss">

// ── Trigger base (NuxtUI's internal button) ────────────────────
.rsel__trigger {
  // Hijack NuxtUI base class to remove default styles
  all: unset !important;
  display: block !important;
  width:   100% !important;
}

// ── Dropdown list ──────────────────────────────────────────────
[data-radix-popper-content-wrapper],
[role="listbox"] {
  font-family: var(--font-fallback, 'Inter', system-ui, sans-serif) !important;
}

[role="listbox"] {
  background:    var(--c-surface, #fff) !important;
  border:        1px solid var(--c-border, rgba(255,140,66,0.16)) !important;
  border-radius: var(--radius-lg, 16px) !important;
  box-shadow:    var(--glass-shadow, 0 8px 32px rgba(0,0,0,0.08)) !important;
  overflow:      hidden !important;
  animation:     rsel-drop 0.2s ease-out !important;
}

@keyframes rsel-drop {
  from { opacity: 0; transform: translateY(6px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

// ── Option item ────────────────────────────────────────────────
[role="option"] {
  border-radius: var(--radius-md, 10px) !important;
  margin:        0 4px !important;
  cursor:        pointer !important;
  // @include transition(fast);

  &[data-active-item],
  &:hover {
    background: rgba(255, 140, 66, 0.07) !important;
  }

  &[data-selected="true"] {
    background: rgba(255, 140, 66, 0.12) !important;
    color:      var(--c-accent, #ff8c42) !important;
  }
}

// ── Search input ───────────────────────────────────────────────
[data-slot="input"] input,
[role="combobox"] {
  background:   var(--c-surface, #fff) !important;
  border-bottom: 1px solid var(--c-border, rgba(255,140,66,0.16)) !important;
  padding:      10px 14px !important;
  font-size:    13px !important;
  font-family:  inherit !important;
  color:        var(--c-text, #1a1510) !important;

  &:focus { border-bottom-color: var(--c-accent, #ff8c42) !important; outline: none !important; }
  &::placeholder { color: var(--c-muted, #8a7f72) !important; }
}

// ── Scrollbar ──────────────────────────────────────────────────
[role="listbox"]::-webkit-scrollbar        { width: 5px; }
[role="listbox"]::-webkit-scrollbar-track  { background: transparent; }
[role="listbox"]::-webkit-scrollbar-thumb  { background: var(--c-border, rgba(255,140,66,0.16)); border-radius: 9999px; }
[role="listbox"]::-webkit-scrollbar-thumb:hover { background: var(--c-accent, #ff8c42); }

// ── Dark mode ──────────────────────────────────────────────────
.dark [role="listbox"] {
  background: rgba(19, 19, 26, 0.97) !important;
}
.dark [role="option"]:hover,
.dark [role="option"][data-active-item] {
  background: rgba(255, 140, 66, 0.1) !important;
}
</style>
