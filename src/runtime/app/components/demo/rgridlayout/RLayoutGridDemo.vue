<template>
  <RContent>
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold">RLayoutGrid Demo</h1>
        <p class="text-muted mt-1">Draggable & Resizable Grid Dashboard using RLayoutGrid component</p>
      </div>
      <div class="flex items-center gap-3">
        <UButton
          :label="t('Refresh')"
          icon="i-lucide-refresh-cw"
          variant="outline"
          :loading="refreshing"
          @click="refreshData"
        />
        <UButton
          :label="t('Add Card')"
          icon="i-lucide-plus"
          variant="soft"
          @click="addCard"
        />
        <UButton
          :label="t('Clear Layout')"
          icon="i-lucide-trash-2"
          variant="ghost"
          color="error"
          @click="clearLayout"
        />
        <UButton
          :label="draggable ? t('Disable Drag') : t('Enable Drag')"
          icon="draggable ? 'i-lucide-mouse-pointer-2' : 'i-lucide-lock'"
          variant="outline"
          @click="draggable = !draggable"
        />
        <UButton
          :label="resizable ? t('Disable Resize') : t('Enable Resize')"
          icon="resizable ? 'i-lucide-maximize-2' : 'i-lucide-minimize-2'"
          variant="outline"
          @click="resizable = !resizable"
        />
      </div>
    </div>

    <!-- Stats Row -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      <RStatCard
        title="Total Items"
        :value="layout.length"
        icon="i-lucide-layout-grid"
        color="primary"
      />
      <RStatCard
        title="Columns"
        :value="colNum"
        icon="i-lucide-columns"
        color="success"
      />
      <RStatCard
        title="Row Height"
        :value="`${rowHeight}px`"
        icon="i-lucide-maximize-2"
        color="info"
      />
      <RStatCard
        title="Breakpoint"
        :value="currentBreakpoint || 'lg'"
        icon="i-lucide-device-desktop"
        color="warning"
      />
    </div>

    <!-- RLayoutGrid -->
    <RLayoutGrid
      v-model:layout="layout"
      :layouts="responsiveLayouts"
      :col-num="colNum"
      :row-height="rowHeight"
      :draggable="draggable"
      :resizable="resizable"
      :vertical-compact="true"
      :use-css-transforms="true"
      :responsive="responsive"
      :grid-breakpoints="breakpoints"
      :margin="[16, 16]"
      :container-padding="[16, 16]"
      :show-grid-lines="showGridLines"
      @layout-change="onLayoutChange"
      @breakpoint-changed="onBreakpointChange"
      @item-added="onItemAdded"
      @item-removed="onItemRemoved"
    >
      <template #item="{ item }">
        {{ console.log("item.i --------> ",item) }}
        <div class="grid-item-wrapper">
          <!-- Remove button -->
          <button
            @click.stop="removeItem(item.i)"
            class="grid-item-close"
            :aria-label="t('Remove item')"
          >
            <i class="ri-close-line" />
          </button>

          <!-- Item content based on type -->
          <div class="grid-item-content">
            <!-- Analytics Charts (item 0) -->
            <AnalyticsCharts v-if="item.i === '0'" class="h-full w-full" />

            <!-- Analytics Key Metrics (item 1) -->
            <KeyMetricCard v-else-if="item.i === '1'" class="h-full w-full" />

            <!-- Performance Metric (item 2) -->
            <PerformanceMetric v-else-if="item.i === '2'" class="h-full w-full" />

            <!-- Analytics Charts 1 (item 3) -->
            <AnalyticsCharts1 v-else-if="item.i === '3'" class="h-full w-full" />

            <!-- Default card for other items -->
            <div v-else class="grid-item-default">
              <div class="grid-item-header">
                <span class="grid-item-id">{{ item.i }}</span>
                <span class="grid-item-type">{{ item.component?.name || 'Custom Widget' }}</span>
              </div>
              <div class="grid-item-info">
                <div class="grid-item-dimension">
                  <span class="label">Width</span>
                  <span class="value">{{ item.w }} cols</span>
                </div>
                <div class="grid-item-dimension">
                  <span class="label">Height</span>
                  <span class="value">{{ item.h }} rows</span>
                </div>
                <div class="grid-item-dimension">
                  <span class="label">Position</span>
                  <span class="value">({{ item.x }}, {{ item.y }})</span>
                </div>
                <div class="grid-item-dimension">
                  <span class="label">Size</span>
                  <span class="value">{{ item.w * colNum / 12 * 100 | 0 }}% width</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </RLayoutGrid>
  </RContent>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// Import demo components (these should exist in the project)
import KeyMetricCard from '~/components/dashboard/KeyMetricCard.vue'
import PerformanceMetric from '~/components/dashboard/PerformanceMetric.vue'

const { t } = useI18n()

// Layout state
const layout = ref([
  { x: 0, y: 0, w: 6, h: 8, i: '0', component: '' },
  { x: 6, y: 0, w: 6, h: 4, i: '1', component: KeyMetricCard },
  { x: 6, y: 4, w: 6, h: 4, i: '2', component: PerformanceMetric },
  { x: 0, y: 8, w: 12, h: 8, i: '3', component: '' },
])

// Grid configuration
const colNum = 12
const rowHeight = 80
const draggable = ref(true)
const resizable = ref(true)
const responsive = ref(true)
const showGridLines = ref(true)
const refreshing = ref(false)
const currentBreakpoint = ref('lg')
const nextId = ref(layout.value.length)

// Breakpoints
const breakpoints = {
  lg: 1200,
  md: 996,
  sm: 768,
  xs: 480,
  xxs: 0,
}

const responsiveLayouts = {
  lg: layout.value,
  md: [
    { x: 0, y: 0, w: 6, h: 8, i: '0' },
    { x: 6, y: 0, w: 6, h: 4, i: '1' },
    { x: 0, y: 8, w: 6, h: 4, i: '2' },
    { x: 6, y: 4, w: 6, h: 4, i: '3' },
  ],
  sm: [
    { x: 0, y: 0, w: 12, h: 6, i: '0' },
    { x: 0, y: 6, w: 12, h: 4, i: '1' },
    { x: 0, y: 10, w: 12, h: 4, i: '2' },
    { x: 0, y: 14, w: 12, h: 4, i: '3' },
  ],
  xs: [
    { x: 0, y: 0, w: 12, h: 6, i: '0' },
    { x: 0, y: 6, w: 12, h: 4, i: '1' },
    { x: 0, y: 10, w: 12, h: 4, i: '2' },
    { x: 0, y: 14, w: 12, h: 4, i: '3' },
  ],
  xxs: [
    { x: 0, y: 0, w: 12, h: 6, i: '0' },
    { x: 0, y: 6, w: 12, h: 4, i: '1' },
    { x: 0, y: 10, w: 12, h: 4, i: '2' },
    { x: 0, y: 14, w: 12, h: 4, i: '3' },
  ],
}

function refreshData() {
  refreshing.value = true
  setTimeout(() => {
    refreshing.value = false
  }, 1000)
}

function addCard() {
  const id = nextId.value.toString()
  nextId.value++
  layout.value.push({
    x: 0,
    y: 0,
    w: 6,
    h: 4,
    i: id,
    component: { name: `Widget ${id}` },
  })
}

function removeItem(id: string) {
  layout.value = layout.value.filter(item => item.i !== id)
}

function clearLayout() {
  layout.value = []
  nextId.value = 0
}

function onLayoutChange(newLayout: any[], oldLayout: any[]) {
  console.log('Layout changed:', newLayout.length, 'items')
}

function onBreakpointChange(breakpoint: string, newLayout: any[]) {
  currentBreakpoint.value = breakpoint
  console.log('Breakpoint changed:', breakpoint)
}

function onItemAdded(item: any) {
  console.log('Item added:', item.i)
}

function onItemRemoved(itemId: string) {
  console.log('Item removed:', itemId)
}
</script>

<style lang="scss" scoped>
/* Grid item wrapper */
.grid-item-wrapper {
  position: relative;
  height: 100%;
  width: 100%;
}

/* Close button */
.grid-item-close {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  color: var(--c-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transform: translateY(-4px);
  transition: all 200ms ease;
  z-index: 10;
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.1);

  &:hover {
    background: var(--c-error);
    border-color: var(--c-error);
    color: white;
  }

  .grid-item-wrapper:hover & {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Grid item content */
.grid-item-content {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}

/* Default card for custom items */
.grid-item-default {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  background: color-mix(in srgb, var(--c-primary) 3%, transparent);
  border-radius: 0.75rem;
  border: 1px solid var(--c-border);
}

.grid-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--c-border);
}

.grid-item-id {
  font-family: monospace;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--c-primary);
}

.grid-item-type {
  font-size: 0.8125rem;
  color: var(--c-muted);
  background: color-mix(in srgb, var(--c-primary) 10%, transparent);
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
}

.grid-item-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.grid-item-dimension {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 0.5rem;
  padding: 0.75rem;
}

.grid-item-dimension .label {
  display: block;
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--c-muted);
  margin-bottom: 0.25rem;
}

.grid-item-dimension .value {
  font-family: monospace;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--c-text);
}

/* Analytics components will fill their containers */
:deep(.grid-item-wrapper) {
  height: 100%;
  width: 100%;
}

:deep(.grid-item-wrapper > div) {
  height: 100%;
}
</style>