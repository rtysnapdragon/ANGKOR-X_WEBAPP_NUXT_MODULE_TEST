<script setup>
// RTimeline — SARIKA
// Thin wrapper around NuxtUI v4.8.2 UTimeline
// • No  lang="ts" — plain <script setup>
// • All UTimeline props forwarded via v-bind="$attrs"
// • All UTimeline slots forwarded with full scoped data
// • RemixIcon support: riIcon field → <i> tag rendered inside #indicator
// • SARIKA ui tokens merged with consumer :ui prop
// • Modes: vertical (default) | horizontal | alternating
// • Supports: v-model, :default-value, reverse, size, color, orientation, @select

import { computed, useAttrs } from 'vue'
import { useI18n } from 'vue-i18n'

// ── Props (SARIKA extras — UTimeline props pass through $attrs) ─────────────
const props = defineProps([
  // SARIKA-level extras
  'items',
  'mode',          // { type: String,  default: 'vertical' }, // 'vertical'|'horizontal'|'alternating'
  'ui',            // { type: Object,  default: () => ({}) },
  // bilingual helpers (applied per-item if fields exist)
  // items can carry: titleKm, descriptionKm, dateKm, riIcon, tag, color

])
const emit = defineEmits(['update:modelValue', 'select'])
const { locale } = useI18n()
const attrs = useAttrs()

const items = computed(() => props.items)
const mode = computed(() => props.mode)
const ui = computed(() => props.ui)

// ── Alternating class + ui preset ──────────────────────────────────────────
const isAlternating = computed(() => mode.value === 'alternating')

const wrapperClass = computed(() => {
  if (isAlternating.value) return 'translate-x-[calc(50%-1rem)] w-full'
  return ''
})

const alternatingUi = computed(() =>
  isAlternating.value
    ? { item: 'even:flex-row-reverse even:-translate-x-[calc(100%-2rem)] even:text-right' }
    : {}
)

// ── Merge ui: alternating preset → SARIKA base → consumer override ─────────
const sarikBaseUi = computed(() => ({
  // Colour the active indicator dot with accent
    // ── Right column ──
  wrapper: 'rt-wrapper',
  indicator: 'rtl-indicator',
  separator: 'rtl-separator',
  date:      'rtl-date',
  title:     'rtl-title',
  description: 'rtl-desc',
  ...alternatingUi.value,
  ...ui.value,
}))

// ── Resolve item icon: prefer riIcon, then icon ────────────────────────────
function isRiIcon(item) {
  return !!(item.riIcon || (item.icon && item.icon.startsWith('ri-')))
}
function riClass(item) {
  return item.riIcon || item.icon || 'ri-circle-line'
}

// ── Bilingual helpers ──────────────────────────────────────────────────────
function itemTitle(item) {
  return (locale.value === 'km' && item.titleKm) ? item.titleKm : (item.title ?? '')
}
function itemDesc(item) {
  return (locale.value === 'km' && item.descriptionKm) ? item.descriptionKm : (item.description ?? '')
}
function itemDate(item) {
  return (locale.value === 'km' && item.dateKm) ? item.dateKm : (item.date ?? '')
}

// ── Resolved items (bilingual fields injected so UTimeline renders them) ───
const resolvedItems = computed(() =>
  items.value?.map(item => ({
    ...item,
    title:       itemTitle(item),
    description: itemDesc(item),
    date:        itemDate(item),
  }))
)

// ── Orientation derived from mode ──────────────────────────────────────────
const orientation = computed(() => {
  if (attrs.orientation) return attrs.orientation
  return props.mode === 'horizontal' ? 'horizontal' : 'vertical'
})
</script>

<template>
  <UTimeline
    v-bind="$attrs"
    :items="resolvedItems"
    :orientation="orientation"
    :ui="sarikBaseUi"
    :class="['rtl', wrapperClass]"
    @update:model-value="$emit('update:modelValue', $event)"
    @select="$emit('select', $event)"
  >

    <!-- ── #indicator ──────────────────────────────────────
         Scope: { item, index, isLeading, modelValue }
         We render RemixIcon <i> OR UAvatar OR fall through
    ─────────────────────────────────────────────────────── -->
    <template #indicator="scope">
      <slot name="indicator" v-bind="scope">

        <!-- Avatar (GitHub PR example pattern) -->
        <UAvatar
          v-if="scope.item.avatar"
          v-bind="scope.item.avatar"
          size="xs"
          class="rtl__avatar"
        />

        <!-- RemixIcon via <i> tag -->
        <i
          v-else-if="isRiIcon(scope.item)"
          :class="[riClass(scope.item), 'rtl__ri-icon']"
          aria-hidden="true"
        />

        <!-- NuxtUI UIcon (default UTimeline behaviour — no override needed) -->
        <!-- UTimeline handles i-lucide-* icons internally when no slot override -->

      </slot>
    </template>

      <!-- ── Wrapper (full right-column content) ───────────── -->
      <template #wrapper="{ item }">
        <slot name="wrapper" :item="item">
          <div class="rt-content-wrap">

            <!-- Date -->
            <slot name="date" :item="item">
              <time
                v-if="(item).date"
                class="rt-date"
              >
                {{ (item).date }}
              </time>
            </slot>

            <!-- Title row: title + optional status badge -->
            <div class="rt-title-row">
              <slot name="title" :item="item">
                <span
                  v-if="(item).title"
                  class="rt-title"
                >
                  {{ (item).title }}
                </span>
              </slot>

              <!-- Status badge -->
              <span
                v-if="(item).status"
                class="rt-badge"
                :style="{ '--rt-badge-color': statusColor(item) }"
              >
                {{ (item).status }}
              </span>
            </div>

            <!-- Description -->
            <slot name="description" :item="item">
              <p
                v-if="(item).description"
                class="rt-desc"
              >
                {{ (item).description }}
              </p>
            </slot>

            <!-- Meta key/value pairs -->
            <dl
              v-if="(item).meta && Object.keys((item).meta).length"
              class="rt-meta"
            >
              <div
                v-for="(val, key) in (item).meta"
                :key="key"
                class="rt-meta__row"
              >
                <dt class="rt-meta__key">{{ key }}</dt>
                <dd class="rt-meta__val">{{ val }}</dd>
              </div>
            </dl>

          </div>
        </slot>
      </template>

    <!-- ── #title ─────────────────────────────────────────
         Scope: { item, index }
    ─────────────────────────────────────────────────────── -->
    <template #title="scope">
      <slot name="title" v-bind="scope">
        <span class="rtl__title-text">{{ scope.item.title }}</span>
        <!-- Optional tag chip beside title -->
        <span v-if="scope.item.tag" class="rtl__tag">{{ scope.item.tag }}</span>
      </slot>
    </template>

    <!-- ── #description ──────────────────────────────────
         Scope: { item, index }
    ─────────────────────────────────────────────────────── -->
    <template #description="scope">
      <slot name="description" v-bind="scope">
        <p v-if="scope.item.description" class="rtl__desc-text">
          {{ scope.item.description }}
        </p>
      </slot>
    </template>

    <!-- ── #date ─────────────────────────────────────────
         Scope: { item, index }
    ─────────────────────────────────────────────────────── -->
    <template #date="scope">
      <slot name="date" v-bind="scope">
        <span v-if="scope.item.date" class="rtl__date-text">{{ scope.item.date }}</span>
      </slot>
    </template>

    <!-- ── Passthrough all remaining slots consumer may define ── -->
    <!-- (e.g. #content, any future UTimeline slots) -->
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot
        v-if="name !== 'indicator' && name !== 'title' && name !== 'description' && name !== 'date'"
        :name="name"
        v-bind="slotProps ?? {}"
      />
    </template>

  </UTimeline>
</template>

<style lang="scss" scoped>
@use '../assets/styles/mixin' as *;
// ── Host ──────────────────────────────────────────────────
.rtl {
  font-family: var(--font-fallback);

  // avatar inside indicator
  &__avatar {
    border: 2px solid var(--c-border);
    border-radius: 50%;
  }

  // RemixIcon in indicator cell
  &__ri-icon {
    font-size: 1em;
    line-height: 1;
    color: inherit;
  }

  // Title text
  &__title-text {
    font-weight: 600;
    color:       var(--c-text);
  }

  // Tag chip
  &__tag {
    display:       inline-flex;
    align-items:   center;
    margin-left:   var(--space-2);
    padding:       1px 8px;
    font-size:     0.6rem;
    font-weight:   700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    background:    rgba(255, 140, 66, 0.1);
    color:         var(--c-accent);
    border:        1px solid rgba(255, 140, 66, 0.2);
    border-radius: var(--radius-full);
    vertical-align: middle;
  }

  // Description
  &__desc-text {
    font-size:   0.82rem;
    color:       var(--c-muted);
    line-height: 1.55;
    margin:      0;
  }

  // Date
  &__date-text {
    font-size:      0.68rem;
    font-weight:    600;
    color:          var(--c-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
}
</style>

<!-- ─────────────────────────────────────────────────────────
     GLOBAL — override NuxtUI UTimeline design tokens
     Applied via the :ui class strings above (rtl-*)
────────────────────────────────────────────────────────── -->
<style lang="scss">

// Separator / connector line
.rtl-separator {
  background: var(--c-border) !important;
  // @include transition;
}

// Date slot
.rtl-date {
  font-family:    var(--font-fallback);
  font-size:      0.68rem !important;
  font-weight:    600 !important;
  color:          var(--c-muted) !important;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

// Title slot
.rtl-title {
  font-family: var(--font-fallback);
  font-weight: 600 !important;
  color:       var(--c-text) !important;
  font-size:   0.875rem !important;
}

// Description slot
.rtl-desc {
  font-family: var(--font-fallback);
  font-size:   0.8rem !important;
  color:       var(--c-muted) !important;
  line-height: 1.55 !important;
}

// Indicator dot — accent when active
.rtl-indicator {
  // NuxtUI exposes color via CSS var; we patch active ring
  &[data-active="true"],
  &[aria-current="true"] {
    background:   var(--c-accent) !important;
    border-color: var(--c-accent) !important;
    box-shadow:   var(--glow-accent-sm) !important;
  }
}

// Dark-mode connector
.dark .rtl-separator {
  background: var(--c-border) !important;
}
</style>
