

<script setup lang="ts">
/**
 * RTimeline — SARIKA reusable timeline component
 * Built on NuxtUI 4.8.2 UTimeline primitives
 *
 * Slots exposed:
 *   #indicator          — override the avatar/icon bubble for all items
 *   #wrapper            — override the full content area for all items
 *   #date               — override the date text for all items
 *   #title              — override the title for all items
 *   #description        — override the description for all items
 *   #[slot]-indicator   — per-item indicator (item.slot = 'custom')
 *   #[slot]-wrapper     — per-item full wrapper
 *   #[slot]-date        — per-item date
 *   #[slot]-title       — per-item title
 *   #[slot]-description — per-item description
 *   #prefix             — inject above the list
 *   #suffix             — inject below the list
 */
import { computed, useSlots } from 'vue'
import type { TimelineItem } from '@nuxt/ui'

// ── Extended item type with SARIKA extras ─────────────────────────────────
export interface RTimelineItem extends TimelineItem {
  /** Override icon with a Remix Icon class (rendered via v-html) */
  remixIcon?:    string
  /** Status badge label */
  status?:       string
  /** Status color: success | error | warning | info | neutral */
  statusColor?:  'success' | 'error' | 'warning' | 'info' | 'neutral'
  /** Extra metadata key/value pairs shown below description */
  meta?:         Record<string, string>
  /** Dot-only mode — hides icon, shows small dot */
  dot?:          boolean
  /** Custom class on item wrapper */
  class?:        string
  slot?:         string
}

// ── Props ─────────────────────────────────────────────────────────────────
const props = withDefaults(defineProps<{
  items:          RTimelineItem[]
  /** v-model: active step index or value string */
  modelValue?:    string | number
  defaultValue?:  string | number
  /** Layout */
  orientation?:   'vertical' | 'horizontal'
  /** Alternate layout (zigzag) — applies even:flex-row-reverse */
  alternate?:     boolean
  /** Color for completed/active indicator */
  color?:         'primary' | 'success' | 'error' | 'warning' | 'info' | 'neutral'
  /** Avatar size */
  size?:          'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** Reverse step direction */
  reverse?:       boolean
  /** valueKey for item matching */
  valueKey?:      string
  /** Extra class on root */
  class?:         string
  /** NuxtUI :ui passthrough — merged on top of SARIKA defaults */
  ui?:            Record<string, any>
}>(), {
  orientation: 'vertical',
  alternate:   false,
  color:       'primary',
  size:        'md',
  reverse:     false,
  valueKey:    'value',
  ui:          () => ({}),
})

const emit = defineEmits<{
  'update:modelValue': [val: string | number]
  select:              [event: MouseEvent, item: RTimelineItem]
}>()

const model = defineModel<string | number>()

// ── SARIKA merged :ui ─────────────────────────────────────────────────────
// Merges SARIKA design token overrides with consumer :ui passthrough.
// UTimeline accepts ui as a flat object of slot class overrides.
const mergedUi = computed(() => ({
  // ── Root ──
  root: [
    'rt-root',
  ].join(' '),
  // ── Each item row ──
  item: [
    'rt-item',
    props.alternate
      ? 'even:flex-row-reverse even:-translate-x-[calc(100%-2rem)] even:text-right'
      : '',
  ].filter(Boolean).join(' '),

  // ── Left column: indicator + separator ──
  container: 'rt-container',

  // ── The icon/avatar bubble ──
  indicator: [
    'rt-indicator',
    // completed → accent fill
    'group-data-[state=completed]:bg-[var(--c-accent)] group-data-[state=completed]:text-white',
    // active → accent fill + ring
    'group-data-[state=active]:bg-[var(--c-accent)] group-data-[state=active]:text-white',
    'group-data-[state=active]:ring-2 group-data-[state=active]:ring-[var(--c-accent)] group-data-[state=active]:ring-offset-2 group-data-[state=active]:ring-offset-[var(--c-bg)]',
    // default (upcoming)
    'bg-[var(--c-surface)] text-[var(--c-muted)] ring-1 ring-[var(--c-border)]',
    // hover on clickable
    'transition-all duration-200',
  ].join(' '),

  // ── Connector line ──
  separator: [
    'rt-separator',
    'bg-[var(--c-border)]',
    // completed fills with accent
    'group-data-[state=completed]:bg-[var(--c-accent)]',
    'transition-colors duration-300',
  ].join(' '),

  // ── Right column ──
  wrapper: 'rt-wrapper',

  // ── Date label ──
  date: 'rt-date text-[var(--c-muted)] text-xs mb-0.5 font-mono',

  // ── Title ──
  title: 'rt-title text-[var(--c-text)] text-sm font-semibold leading-snug',

  // ── Description ──
  description: 'rt-desc text-[var(--c-muted)] text-sm leading-relaxed',

  // Deep-merge consumer ui on top
  ...props.ui,
}))

// ── Status color map ──────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  success: 'var(--c-success)',
  error:   'var(--c-danger)',
  warning: 'var(--color-warning)',
  info:    'var(--c-info)',
  neutral: 'var(--c-muted)',
}

function statusColor(item: RTimelineItem): string {
  return STATUS_COLORS[item.statusColor ?? 'neutral']
}

// ── Item select ────────────────────────────────────────────────────────────
function onSelect(event: MouseEvent, item: RTimelineItem) {
  emit('select', event, item)
}
</script>

<template>
  <div :class="['rtl-wrap', props.class]">

    <!-- Prefix slot -->
    <slot name="prefix" />

    <UTimeline
      v-model="model"
      :items="items"
      :orientation="orientation"
      :color="color"
      :size="size"
      :reverse="reverse"
      :value-key="valueKey"
      :default-value="defaultValue"
      :ui="mergedUi"
      @select="onSelect"
    >
      <!-- ══════════════════════════════════════════════════════
           GLOBAL SLOTS  (apply to all items unless item.slot set)
           ══════════════════════════════════════════════════════ -->

      <!-- ── Indicator ─────────────────────────────────────── -->
      <template #indicator="{ item }">
        <slot name="indicator" :item="item">
          <!-- Dot mode -->
          <span v-if="(item as RTimelineItem).dot" class="rt-dot" />

          <!-- Remix icon via v-html -->
          <span
            v-else-if="(item as RTimelineItem).remixIcon"
            v-html="`<i class='${(item as RTimelineItem).remixIcon}'></i>`"
            class="rt-remix-icon"
          />

          <!-- Let UTimeline render its default avatar/icon otherwise (no content = default) -->
        </slot>
      </template>

      <!-- ── Wrapper (full right-column content) ───────────── -->
      <template #wrapper="{ item }">
        <slot name="wrapper" :item="item">
          <div class="rt-content-wrap">

            <!-- Date -->
            <slot name="date" :item="item">
              <time
                v-if="(item as RTimelineItem).date"
                class="rt-date"
              >
                {{ (item as RTimelineItem).date }}
              </time>
            </slot>

            <!-- Title row: title + optional status badge -->
            <div class="rt-title-row">
              <slot name="title" :item="item">
                <span
                  v-if="(item as RTimelineItem).title"
                  class="rt-title"
                >
                  {{ (item as RTimelineItem).title }}
                </span>
              </slot>

              <!-- Status badge -->
              <span
                v-if="(item as RTimelineItem).status"
                class="rt-badge"
                :style="{ '--rt-badge-color': statusColor(item as RTimelineItem) }"
              >
                {{ (item as RTimelineItem).status }}
              </span>
            </div>

            <!-- Description -->
            <slot name="description" :item="item">
              <p
                v-if="(item as RTimelineItem).description"
                class="rt-desc"
              >
                {{ (item as RTimelineItem).description }}
              </p>
            </slot>

            <!-- Meta key/value pairs -->
            <dl
              v-if="(item as RTimelineItem).meta && Object.keys((item as RTimelineItem).meta!).length"
              class="rt-meta"
            >
              <div
                v-for="(val, key) in (item as RTimelineItem).meta"
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

      <!-- ══════════════════════════════════════════════════════
           FORWARD ALL PER-ITEM NAMED SLOTS to UTimeline
           Consumer uses: <template #my-slot-indicator="{ item }">
           when item.slot = 'my-slot'
           ══════════════════════════════════════════════════════ -->
      <template
        v-for="(_, name) in $slots"
        :key="name"
        #[name]="slotProps"
      >
        <slot :name="name" v-bind="slotProps ?? {}" />
      </template>

    </UTimeline>

    <!-- Suffix slot -->
    <slot name="suffix" />

  </div>
</template>

<style lang="scss" scoped>
// ─────────────────────────────────────────────────────────────────────────────
// WRAPPER
// ─────────────────────────────────────────────────────────────────────────────
.rtl-wrap {
  display:     flex;
  flex-direction: column;
  gap:         var(--space-3, 12px);
  font-family: var(--font-fallback);
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTENT WRAP (right column)
// ─────────────────────────────────────────────────────────────────────────────
.rt-content-wrap {
  display:        flex;
  flex-direction: column;
  gap:            3px;
  padding-bottom: 20px; // breathing room between items
}

// ─────────────────────────────────────────────────────────────────────────────
// DATE
// ─────────────────────────────────────────────────────────────────────────────
.rt-date {
  display:     block;
  font-size:   0.72rem;
  font-weight: 500;
  color:       var(--c-muted);
  font-family: 'JetBrains Mono', 'Fira Code', monospace, var(--font-fallback);
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

// ─────────────────────────────────────────────────────────────────────────────
// TITLE ROW
// ─────────────────────────────────────────────────────────────────────────────
.rt-title-row {
  display:     flex;
  align-items: center;
  gap:         7px;
  flex-wrap:   wrap;
}

.rt-title {
  font-size:   0.875rem;
  font-weight: 600;
  color:       var(--c-text);
  line-height: 1.4;
}

// ─────────────────────────────────────────────────────────────────────────────
// DESCRIPTION
// ─────────────────────────────────────────────────────────────────────────────
.rt-desc {
  font-size:   0.8rem;
  color:       var(--c-muted);
  line-height: 1.6;
  margin:      2px 0 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────────────────────
.rt-badge {
  display:       inline-flex;
  align-items:   center;
  font-size:     0.65rem;
  font-weight:   600;
  line-height:   1;
  padding:       3px 7px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color:         var(--rt-badge-color, var(--c-accent));
  background:    color-mix(in srgb, var(--rt-badge-color, var(--c-accent)) 14%, transparent);
  border:        1px solid color-mix(in srgb, var(--rt-badge-color, var(--c-accent)) 28%, transparent);
}

// ─────────────────────────────────────────────────────────────────────────────
// META KEY/VALUE
// ─────────────────────────────────────────────────────────────────────────────
.rt-meta {
  display:        flex;
  flex-direction: column;
  gap:            3px;
  margin-top:     6px;
  padding:        8px 10px;
  background:     var(--bg-tertiary, rgba(0,0,0,0.03));
  border-radius:  8px;
  border:         1px solid var(--c-border);

  &__row {
    display:     flex;
    gap:         6px;
    font-size:   0.75rem;
    line-height: 1.5;
  }

  &__key {
    color:      var(--c-muted);
    min-width:  80px;
    flex-shrink: 0;
    font-weight: 500;
  }

  &__val {
    color: var(--c-text);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DOT INDICATOR
// ─────────────────────────────────────────────────────────────────────────────
.rt-dot {
  display:       block;
  width:         10px;
  height:        10px;
  border-radius: 50%;
  background:    var(--c-accent);
  box-shadow:    0 0 0 3px rgba(255,140,66,0.18);
}

// ─────────────────────────────────────────────────────────────────────────────
// REMIX ICON
// ─────────────────────────────────────────────────────────────────────────────
.rt-remix-icon {
  display:    flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  font-size:  1em;

  :deep(i) {
    font-size: inherit;
    line-height: 1;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DARK MODE overrides
// ─────────────────────────────────────────────────────────────────────────────
.dark {
  .rt-meta {
    background: rgba(255,255,255,0.03);
  }
}
</style>