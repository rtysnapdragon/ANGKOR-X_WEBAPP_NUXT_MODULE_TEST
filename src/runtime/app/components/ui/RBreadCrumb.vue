<script setup>
import { computed, useSlots } from 'vue'
import { useRouter } from 'vue-router'
import { useBreadCrumb } from '../../composables/breadCrumb'
import RTooltip from '../RTooltip.vue'

const props = defineProps({
  // Header (prop wins over state, same pattern as items/showBack below)
  title:       { type: String, default: undefined },
  description: { type: String, default: undefined },
  icon:        { type: String, default: undefined },

  // Breadcrumb items — if omitted, reads from useBreadCrumb state
  items:       { type: Array, default: undefined },

  // Back button
  showBack:    { type: Boolean, default: undefined },
  backTooltip: { type: String, default: undefined },
  backAction:  { type: Function, default: undefined },

  // Separator icon
  separatorIcon: { type: String, default: undefined },

  // Right-side action buttons — if omitted, reads from useBreadCrumb state
  // Shape: [{ label, icon, color, variant, size, to, onClick, disabled, loading, key, render }]
  actions: { type: Array, default: undefined },

  // Right-side full override — a functional component `(props) => VNode`.
  // Takes priority over `actions` (but the #actions slot always wins over both).
  template: { type: [Function, Object], default: undefined },

  // Left-side popover button — renders next to the back button / breadcrumb trail.
  // Shape: { icon, label, tooltip, color, variant, size, render, onClick }
  leftButton: { type: Object, default: undefined },
  leftTemplate: { type: [Function, Object], default: undefined },
})

const router = useRouter()
const crumb  = useBreadCrumb()
const slots  = useSlots()
const { t }  = useI18n?.() ?? { t: (s) => s }

// ── Resolved values (prop wins over state) ────────────────────────────────────
const titleComputed = computed(() =>
  props.title ?? crumb.data.value?.title,
)

const descriptionComputed = computed(() =>
  props.description ?? crumb.data.value?.description,
)

const iconComputed = computed(() =>
  props.icon ?? crumb.data.value?.icon,
)

const resolvedItems = computed(() =>
  props.items ?? crumb.data.value?.items ?? [],
)

const resolvedShowBack = computed(() => {
  if (props.showBack !== undefined) return props.showBack
  return crumb.data.value?.hasBack ?? false
})

const resolvedBackTooltip = computed(() =>
  props.backTooltip ?? crumb.data.value?.backTooltip ?? t('back'),
)

const resolvedSeparator = computed(() =>
  props.separatorIcon ?? crumb.data.value?.separatorIcon ?? 'i-lucide-chevron-right',
)

// ── Back action — prop → state → router.back() ────────────────────────────────
const handleBack = () => {
  const fn = props.backAction ?? crumb.data.value?.fnBack
  if (typeof fn === 'function') {
    fn()
  } else {
    router.back()
  }
}

// ── Dropdown items builder ────────────────────────────────────────────────────
const mapChildren = (children) => {
  if (!children?.length) return []
  return [
    children.map((child) => ({
      label:    child.label,
      icon:     child.icon,
      disabled: child.disabled ?? false,
      onSelect: () => {
        if (typeof child.onClick === 'function') {
          child.onClick()
          return
        }
        if (child.to) navigateTo(child.to)
      },
    })),
  ]
}

// ── Right-side actions (prop → state, backward-compat with old `hasAction` key) ─
const resolvedActions = computed(() => {
  const list = props.actions
    ?? crumb.data.value?.actions
    ?? crumb.data.value?.hasAction // backward-compat with older pages
    ?? []
  return Array.isArray(list) ? list : []
})

const handleActionClick = (item) => {
  if (!item) return
  if (typeof item.onClick === 'function') {
    item.onClick()
    return
  }
  // Backward-compat with older `click` key
  if (typeof item.click === 'function') {
    item.click()
    return
  }
  if (item.to) navigateTo(item.to)
}

// ── Right-side full template override (prop → state) ──────────────────────────
const resolvedTemplate = computed(() => {
  const fn = props.template ?? crumb.data.value?.rightTemplate
  return typeof fn === 'function' ? fn : undefined
})

// ── Left-side popover button (prop → state) ────────────────────────────────────
const resolvedLeftButton = computed(() => {
  const cfg = props.leftButton ?? crumb.data.value?.leftButton
  return cfg && typeof cfg === 'object' ? cfg : undefined
})

const resolvedLeftTemplate = computed(() => {
  const fn = props.leftTemplate ?? crumb.data.value?.leftTemplate
  return typeof fn === 'function' ? fn : undefined
})

const leftButtonRender = computed(() => {
  const fn = resolvedLeftButton.value?.render
  return typeof fn === 'function' ? fn : undefined
})

const handleLeftButtonClick = () => {
  const fn = resolvedLeftButton.value?.onClick
  if (typeof fn === 'function') fn()
  // Popover open/close is handled by UPopover itself via its trigger slot;
  // this only fires the page's own side-effect (e.g. analytics, prefetch).
}

// ── Visibility ────────────────────────────────────────────────────────────────
const showActions = computed(() =>
  resolvedActions.value.length > 0 || !!resolvedTemplate.value || !!slots.actions,
)

const hasContent = computed(() =>
  resolvedShowBack.value
  || resolvedItems.value.length > 0
  || !!titleComputed.value
  || !!descriptionComputed.value
  || !!iconComputed.value
  || !!resolvedLeftButton.value,
)
</script>

<template>
  <div
    v-if="hasContent || showActions"
    class="rbc"
  >
    <!-- LEFT: icon + title/description + back + breadcrumb items -->
    <div class="rbc-left">
      <!-- Full override: consumer takes over the entire right side -->
      <slot
        name="actions"
        :actions="resolvedActions"
        :template="resolvedLeftTemplate"
      >
        <!-- Fully custom right-side render (functional component from state/prop) -->
        <component :is="resolvedLeftTemplate" v-if="resolvedLeftTemplate" />
      </slot>

      <!-- Heading (icon + title) -->
      <div
        v-if="(iconComputed || titleComputed || $slots.icon || $slots.title) && !resolvedLeftTemplate"
        class="rbc-heading"
      >
        <slot name="icon">
          <span v-if="iconComputed" class="rbc-icon-badge">
            <UIcon :name="iconComputed" class="rbc-icon" />
          </span>
        </slot>

        <div class="rbc-text">
          <slot name="title">
            <h1 v-if="titleComputed" class="rbc-title">
              {{ titleComputed }}
            </h1>
          </slot>

          <slot name="description">
            <p v-if="descriptionComputed" class="rbc-description">
              {{ descriptionComputed }}
            </p>
          </slot>
        </div>
      </div>

      <!-- Breadcrumb -->
      <div class="rbc-breadcrumb">
        <!-- Back button -->
        <template v-if="resolvedShowBack">
          <RTooltip
            v-if="resolvedBackTooltip"
            :text="resolvedBackTooltip"
          >
            <button class="rbc-separator text-[var(--c-text)] rbc-back-button cursor-pointer pr-2" type="button" @click="handleBack">
              <i class="ri-arrow-left-s-line" />
            </button>
          </RTooltip>

          <UButton
            v-else
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            @click="handleBack"
          />
        </template>

        <!-- Left-side popover button — its content is a template (functional
             component) supplied entirely through breadCrumb state, so a page
             can render arbitrary markup here without touching this component. -->
        <UPopover v-if="resolvedLeftButton">
          <RTooltip
            v-if="resolvedLeftButton.tooltip"
            :text="resolvedLeftButton.tooltip"
          >
            <RBtn
              :icon="resolvedLeftButton.icon"
              :color="resolvedLeftButton.color ?? 'neutral'"
              :variant="resolvedLeftButton.variant ?? 'ghost'"
              :size="resolvedLeftButton.size ?? 'xs'"
              @click="handleLeftButtonClick"
            >
              {{ resolvedLeftButton.label }}
            </RBtn>
          </RTooltip>

          <RBtn
            v-else
            :icon="resolvedLeftButton.icon"
            :color="resolvedLeftButton.color ?? 'neutral'"
            :variant="resolvedLeftButton.variant ?? 'ghost'"
            :size="resolvedLeftButton.size ?? 'xs'"
            @click="handleLeftButtonClick"
          >
            {{ resolvedLeftButton.label }}
          </RBtn>

          <template #content>
            <div class="rbc-left-panel">
              <!-- `render` is a functional component: (props) => VNode -->
              <component :is="leftButtonRender" v-if="leftButtonRender" />
              <slot v-else name="left-panel" />
            </div>
          </template>
        </UPopover>

        <!-- Breadcrumb items -->
        <UBreadcrumb
          v-if="resolvedItems.length"
          :items="resolvedItems"
        >
          <!-- Custom separator -->
          <template #separator>
            <UIcon
              :name="resolvedSeparator"
              class="rbc-separator text-[var(--c-text)]"
            />
          </template>

          <!-- Custom item rendering -->
          <template #item="{ item }">
            <div class="rbc-item">
              <!-- Navigable link -->
               <RTooltip v-if="item.to":text = "item.tooltipLabel || item.label">
                <RLink
                  :to="item.to"
                  class="rbc-link"
                >
                  <UIcon v-if="item.icon" :name="item.icon" class="rbc-item-icon" />
                  <span>{{ item.label }}</span>
                </RLink>
              </RTooltip>

              <!-- Clickable (no route) -->
              <div
                v-else-if="typeof item.onClick === 'function'"
                class="rbc-link"
                role="button"
                tabindex="0"
                @click="item.onClick"
              >
                <UIcon v-if="item.icon" :name="item.icon" class="rbc-item-icon" />
                <span>{{ item.label }}</span>
              </div>

              <!-- Current / last crumb -->
              <div
                v-else
                class="rbc-current"
              >
                <UIcon v-if="item.icon" :name="item.icon" class="rbc-item-icon" />
                <span>{{ item.label }}</span>
              </div>

              <!-- Dropdown for children -->
              <UDropdownMenu
                v-if="item.children?.length"
                :items="mapChildren(item.children)"
              >
                <div class="rbc-chevron-btn cursor-pointer p-2">
                  <UIcon
                    name="i-lucide-chevron-down"
                    class="rbc-separator"
                  />
                </div>
              </UDropdownMenu>
            </div>
          </template>
        </UBreadcrumb>
      </div>
    </div>

    <!-- RIGHT: actions -->
    <div
      v-if="showActions"
      class="rbc-actions"
    >
      <!-- Full override: consumer takes over the entire right side -->
      <slot
        name="actions"
        :actions="resolvedActions"
        :template="resolvedTemplate"
        :on-action="handleActionClick"
      >
        <!-- Fully custom right-side render (functional component from state/prop) -->
        <component :is="resolvedTemplate" v-if="resolvedTemplate" />

        <!-- Default: loop over the actions array -->
        <template
          v-else
          v-for="(item, idx) in resolvedActions"
          :key="item.key ?? item.label ?? idx"
        >
          <!-- Per-item full override via a render function on the item itself -->
          <component :is="item.render" v-if="typeof item.render === 'function'" />

          <!-- Per-item slot override -->
          <slot
            v-else
            name="action-item"
            :item="item"
            :index="idx"
            :on-click="() => handleActionClick(item)"
          >
            <RBtn
              :type="item.type"
              :icon="item.icon"
              :label="item.label"
              :color="item.color"
              :variant="item.variant"
              :size="item.size"
              :disabled="item.disabled"
              :loading="item.loading"
              @click="handleActionClick(item)"
            />
          </slot>
        </template>
      </slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* ── Container ─────────────────────────────────────────────────────────────── */
.rbc {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  // margin-bottom: 4px;      /* sits just above the title inside RPageHeader */
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

/* ── Left cluster ───────────────────────────────────────────────────────────── */
.rbc-left {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  width: 100%;
  justify-content: flex-start;
  gap: 6px;
  min-width: 0;
}

/* ── Heading (icon + title) ────────────────────────────────────────────────── */
.rbc-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.rbc-icon-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border-radius: var(--ui-radius-md, 8px);
  background: color-mix(in srgb, var(--c-accent, currentColor) 12%, transparent);
}

.rbc-icon {
  width: 16px;
  height: 16px;
  color: var(--c-accent, var(--c-text));
}

.rbc-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.rbc-title {
  font-size: 17px;
  font-family: var(--font-400) !important;
  font-weight: bold !important;
  color: var(--c-text) !important;
  line-height: 1.25;
}

.rbc-description {
  font-size: 12px;
  font-weight: 500;
  color: var(--c-muted);
}

.rbc-breadcrumb {
  display: flex;
  align-items: center;
  justify-content: start;
  flex-direction: row;
  gap: 6px;
  min-width: 0;
  flex: 1;
  overflow: hidden;
}

/* ── Item wrapper ──────────────────────────────────────────────────────────── */
.rbc-item {
  display: flex;
  align-items: center;
  gap: 2px;
  white-space: nowrap;
  font-size: 13px;
  color: var(--c-text);
}

.rbc-item-icon {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
  color: var(--c-text);
}

/* ── Link / button styles ──────────────────────────────────────────────────── */
.rbc-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: var(--c-text, currentColor);
  cursor: pointer;
  transition: opacity 0.15s;
  text-decoration: none;
  background: none;
  border: none;
  padding: 0;

  &:hover {
    opacity: 0.7;
  }
}

/* ── Current (last) crumb ──────────────────────────────────────────────────── */
.rbc-current {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 700;
  color: var(--color-primary, currentColor);
}

/* ── Separator ─────────────────────────────────────────────────────────────── */
.rbc-separator {
  opacity: 0.4;
  width: 12px;
  height: 12px;
  color: var(--c-text);
}

/* ── Left-side popover panel ──────────────────────────────────────────────── */
.rbc-left-panel {
  min-width: 200px;
  max-width: 360px;
  padding: 10px;
  color: var(--c-text);
}

/* ── Chevron dropdown trigger ──────────────────────────────────────────────── */
.rbc-chevron-btn {
  padding-inline: 2px !important;
}

/* ── Actions ───────────────────────────────────────────────────────────────── */
.rbc-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    width: 100%;
    overflow-x: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }
}
</style>