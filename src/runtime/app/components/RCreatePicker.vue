<template>
  <div class="r-cp" role="dialog" :aria-label="t('create_new')">
    <Transition :name="direction" mode="out-in">
      <!-- ── Root grid ─────────────────────────────────────────────────── -->
      <div v-if="view === 'root'" key="root" class="r-cp__panel">
        <div class="r-cp__grid">
          <button
            v-for="item in rootItems"
            :key="item.key"
            type="button"
            class="r-cp__item"
            :class="{ 'r-cp__item--active': activeKey === item.key }"
            @click="onPick(item)"
          >
            <span class="r-cp__icon" :style="iconStyle(item)">
              <UIcon :name="item.icon" />
            </span>
            <span class="r-cp__label">{{ item.label }}</span>
          </button>
        </div>
      </div>

      <!-- ── "More" sub-panel ─────────────────────────────────────────── -->
      <div v-else key="more" class="r-cp__panel">
        <div class="r-cp__head">
          <button type="button" class="r-cp__nav-btn" :aria-label="t('back')" @click="goRoot">
            <UIcon name="ri-arrow-left-line" />
          </button>
          <h3 class="r-cp__title">{{ t('more') }}</h3>
          <button type="button" class="r-cp__nav-btn" :aria-label="t('close')" @click="emit('close')">
            <UIcon name="ri-close-line" />
          </button>
        </div>

        <label class="r-cp__search">
          <UIcon name="ri-search-line" class="r-cp__search-icon" />
          <input
            v-model="query"
            type="text"
            class="r-cp__search-input"
            :placeholder="t('search')"
            autocomplete="off"
          >
        </label>

        <div class="r-cp__grid r-cp__grid--more">
          <button
            v-for="item in filteredMoreItems"
            :key="item.key"
            type="button"
            class="r-cp__item"
            :class="{ 'r-cp__item--active': activeKey === item.key }"
            @click="onPick(item)"
          >
            <span class="r-cp__icon" :style="iconStyle(item)">
              <UIcon :name="item.icon" />
            </span>
            <span class="r-cp__label">{{ item.label }}</span>
          </button>

          <p v-if="!filteredMoreItems.length" class="r-cp__empty">
            {{ t('no_results_for', { value: query }) }}
          </p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

/**
 * RCreatePicker
 * Canva-style "create new" content-type picker.
 * Root grid → tap "More" → search panel with back/close.
 *
 * Usage:
 *  <RCreatePicker
 *    v-model="activeType"
 *    @select="onCreate"
 *    @close="showPicker = false"
 *  />
 */

// ─── Props ────────────────────────────────────────────────────────────────
const props = defineProps({
  modelValue: { type: String, default: null },
  // Allow parent overrides; falls back to sensible defaults below.
  items:     { type: Array,  default: null },
  moreItems: { type: Array,  default: null },
})

// ─── Emits ────────────────────────────────────────────────────────────────
const emit = defineEmits(['update:modelValue', 'select', 'close'])

const { t } = useI18n?.() ?? { t: (k, p) => p?.value ? `${k}: ${p.value}` : k }

// ─── Default option sets (colors map to soft circular icon chips) ─────────
const defaultRootItems = [
  { key: 'presentation', label: t('presentation'), icon: 'ri-slideshow-3-line', color: 'orange' },
  { key: 'social',       label: t('social_media'), icon: 'ri-heart-3-fill',     color: 'red'    },
  { key: 'video',        label: t('video'),        icon: 'ri-play-circle-fill', color: 'violet' },
  { key: 'doc',          label: t('doc'),           icon: 'ri-file-text-line',  color: 'teal'   },
  { key: 'whiteboard',   label: t('whiteboard'),    icon: 'ri-loop-right-line', color: 'green'  },
  { key: 'sheet',        label: t('sheet'),         icon: 'ri-grid-line',       color: 'blue'   },
  { key: 'websites',     label: t('websites'),      icon: 'ri-window-2-line',   color: 'indigo' },
  { key: 'code',         label: t('code'),          icon: 'ri-code-s-slash-line', color: 'purple' },
  { key: 'more',         label: t('more'),          icon: 'ri-more-fill',       color: 'muted'  },
]

const defaultMoreItems = [
  { key: 'email',       label: t('email'),       icon: 'ri-mail-fill',            color: 'indigo' },
  { key: 'customSize',  label: t('custom_size'), icon: 'ri-crop-2-line',          color: 'muted'  },
  { key: 'upload',      label: t('upload'),      icon: 'ri-upload-cloud-2-line',  color: 'blue'   },
]

const rootItems = computed(() => props.items ?? defaultRootItems)
const allMoreItems = computed(() => props.moreItems ?? defaultMoreItems)

// ─── View state (root ↔ more) ───────────────────────────────────────────
const view = ref('root')       // 'root' | 'more'
const direction = ref('r-cp-forward')
const query = ref('')
const activeKey = ref(props.modelValue)

const filteredMoreItems = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return allMoreItems.value
  return allMoreItems.value.filter(i => i.label.toLowerCase().includes(q))
})

function goRoot() {
  direction.value = 'r-cp-back'
  view.value = 'root'
  query.value = ''
}

function onPick(item) {
  if (item.key === 'more') {
    direction.value = 'r-cp-forward'
    view.value = 'more'
    return
  }
  activeKey.value = item.key
  emit('update:modelValue', item.key)
  emit('select', item)
}

// ─── Icon chip color → CSS vars (uses project palette from _color.scss) ──
const colorMap = {
  orange: 'var(--r-c-orange)',
  red:    'var(--r-c-red)',
  violet: 'var(--r-c-violet)',
  teal:   'var(--r-c-capture)',
  green:  'var(--r-c-dark-green)',
  blue:   'var(--r-c-blue)',
  indigo: 'var(--r-c-nenoBlue)',
  purple: 'var(--r-c-purple)',
  muted:  'var(--c-muted)',
}

function iconStyle(item) {
  return { '--r-cp-chip': colorMap[item.color] ?? 'var(--ui-primary)' }
}
</script>

<style lang="scss" scoped>
.r-cp {
  width: 100%;
  max-width: 320px;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--ui-radius-lg, 0.75rem);
  padding: 0.75rem;
  box-sizing: border-box;
  overflow: hidden;
}

.r-cp__panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* ── Grid of options ──────────────────────────────────────────────────── */
.r-cp__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;

  &--more {
    grid-template-columns: repeat(3, 1fr);
  }
}

.r-cp__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.75rem 0.375rem;
  border: 1px solid transparent;
  border-radius: 0.625rem;
  background: transparent;
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease, transform 0.08s ease;
  color: var(--c-text);

  &:hover {
    background: var(--c-hover, color-mix(in srgb, var(--c-text) 5%, transparent));
  }

  &:active {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: 2px solid var(--ui-primary, var(--c-accent));
    outline-offset: 2px;
  }

  &--active {
    background: color-mix(in srgb, var(--r-c-dark-green) 12%, transparent);
    border-color: color-mix(in srgb, var(--r-c-dark-green) 35%, transparent);

    .r-cp__label { color: var(--r-c-dark-green); font-weight: 700; }
    .r-cp__icon  { background: var(--r-c-dark-green); color: #fff; }
  }
}

.r-cp__icon {
  --r-cp-chip: var(--ui-primary);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--r-cp-chip);
  color: #fff;
  font-size: 1.25rem;
  flex-shrink: 0;

  :deep(svg) { width: 1.15em; height: 1.15em; }
}

.r-cp__label {
  font-size: 0.75rem;
  font-weight: 600;
  text-align: center;
  color: var(--c-text);
  line-height: 1.15;
}

/* ── "More" panel header ─────────────────────────────────────────────── */
.r-cp__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.r-cp__title {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--c-text);
}

.r-cp__nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--c-text);
  cursor: pointer;
  transition: background 0.12s ease;

  &:hover { background: var(--c-hover, rgba(0, 0, 0, 0.06)); }
  &:focus-visible { outline: 2px solid var(--ui-primary, var(--c-accent)); outline-offset: 1px; }
}

/* ── Search bar ───────────────────────────────────────────────────────── */
.r-cp__search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  background: var(--bg-tertiary, var(--c-bg));
  border: 1px solid var(--c-border);
}

.r-cp__search-icon {
  color: var(--c-muted);
  flex-shrink: 0;
}

.r-cp__search-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.875rem;
  color: var(--c-text);

  &::placeholder { color: var(--c-muted); }
}

.r-cp__empty {
  grid-column: 1 / -1;
  text-align: center;
  font-size: 0.8125rem;
  color: var(--c-muted);
  padding: 1rem 0;
  margin: 0;
}

/* ── Panel transition (forward = slide left, back = slide right) ───────── */
.r-cp-forward-enter-active,
.r-cp-forward-leave-active,
.r-cp-back-enter-active,
.r-cp-back-leave-active {
  transition: transform 0.18s ease, opacity 0.18s ease;
}

.r-cp-forward-enter-from { transform: translateX(16px); opacity: 0; }
.r-cp-forward-leave-to   { transform: translateX(-16px); opacity: 0; }
.r-cp-back-enter-from    { transform: translateX(-16px); opacity: 0; }
.r-cp-back-leave-to      { transform: translateX(16px); opacity: 0; }
</style>
