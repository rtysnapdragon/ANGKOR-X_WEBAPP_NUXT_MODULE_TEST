<template>
  <RContent class="dashboard-page">
    <div class="space-y-6">
      <!-- Hero Section -->
      <div class="dashboard-hero">
        <div class="dashboard-hero__bg" aria-hidden="true">
          <div class="dashboard-hero__mesh">
            <div class="dashboard-hero__blob dashboard-hero__blob--a"></div>
            <div class="dashboard-hero__blob dashboard-hero__blob--b"></div>
            <div class="dashboard-hero__blob dashboard-hero__blob--c"></div>
          </div>
          <div class="dashboard-hero__noise"></div>
        </div>
        <div class="dashboard-hero__content">
          <div>
            <h1 class="dashboard-hero__title">
              {{ t("rtyCms.dashboard.title") }}
            </h1>
            <p class="dashboard-hero__subtitle">
              {{ greeting }}
            </p>
          </div>
          <div class="dashboard-hero__actions">
            <RBtn v-if="canSwitchDatabase" :to="localePath('/settings/databases')" icon="i-lucide-database" variant="ghost" size="sm">
              {{ t("rtyCms.dashboard.switch_database") }}
            </RBtn>
            <RBtn v-if="canSwitchLanguage" :to="localePath('/settings/localization')" icon="i-lucide-globe" variant="ghost" size="sm">
              {{ t("rtyCms.dashboard.switch_language") }}
            </RBtn>
          </div>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="dashboard-stats" v-if="!loadingStats">
        <RStatCard
          v-for="stat in statsCards"
          :key="stat.key"
          :title="stat.title"
          :value="stat.value"
          :icon="stat.icon"
          :trend="stat.trend"
          :trend-positive="stat.trendPositive"
          :color="stat.color"
        />
      </div>
      <div v-else class="dashboard-stats">
        <RStatCard v-for="i in 4" :key="i" skeleton />
      </div>

      <!-- Widgets grid (drag by the header, resize from the corner) -->
      <RGridLayout
        v-model:layout="dashboardLayout"
        v-model:option="gridOption"
        class="dashboard-grid"
        variant="bare"
        show-control-panel
        :control-panel-open="false"
        :controls="['toggles', 'reset']"
        :toggles="['isDraggable', 'isResizable', 'showGridLines']"
        :responsive-layouts="responsiveLayouts"
        :labels="gridLabels"
        @layout-change="onDashboardLayoutChange"
        @breakpoint-changed="onDashboardBreakpointChange"
      >
        <template #item="{ item, remove }">
          <div v-if="item && item.i" class="dashboard-grid-item" :data-item-id="item.i">
            <!-- Item header with actions -->
            <div class="dashboard-grid-item__header">
              <h3 class="dashboard-grid-item__title">{{ item.title }}</h3>
              <div class="dashboard-grid-item__actions">
                <RBtn
                  v-if="!item.static"
                  type="view"
                  icon="ri-fullscreen-line"
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  :aria-label="t('Fullscreen')"
                  @click.stop="toggleFullscreen(item.i)"
                />
                <RBtn
                  v-if="!item.static"
                  type="reset"
                  icon="ri-refresh-line"
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  :aria-label="t('Refresh')"
                  @click.stop="refreshWidget(item.i)"
                />
                <RBtn
                  v-if="!item.static"
                  type="delete"
                  icon="ri-delete-bin-line"
                  size="xs"
                  variant="ghost"
                  color="error"
                  :aria-label="t('Remove')"
                  @click.stop="remove()"
                />
              </div>
            </div>

            <!-- Widget content -->
            <div class="dashboard-grid-item__content">
              <!-- Recent Users -->
              <div v-if="item.component === 'RecentUsers'" class="dashboard-widget">
                <div v-if="loadingUsers" class="dashboard-widget__loading">
                  <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin text-muted" />
                </div>
                <div v-else-if="!recentUsers.length" class="dashboard-widget__empty">
                  <UIcon name="i-lucide-users" class="size-8 text-muted" />
                  <p class="mt-2 text-sm text-muted">{{ t("rtyCms.table.empty") }}</p>
                  <RBtn size="sm" variant="outline" @click="loadUsers">{{ t("Refresh") }}</RBtn>
                </div>
                <div v-else class="dashboard-widget__list">
                  <div v-for="user in recentUsers" :key="user.Id" class="dashboard-widget__item">
                    <RAvatar :src="user.AvatarUrl" :name="user.DisplayName || user.Username" size="sm" />
                    <div class="flex-1 min-w-0">
                      <p class="font-medium text-sm truncate">{{ user.DisplayName || user.Username }}</p>
                      <p class="text-xs text-muted truncate">{{ user.Email }}</p>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <UBadge v-for="role in user.Roles" :key="role" size="xs" variant="subtle" color="primary">
                        {{ role }}
                      </UBadge>
                      <span v-if="user.Online" class="flex items-center gap-1 text-xs text-success">
                        <span class="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
                        {{ t("rtyCms.dashboard.online") }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Recent Activity -->
              <div v-else-if="item.component === 'RecentActivity'" class="dashboard-widget">
                <div v-if="loadingActivity" class="dashboard-widget__loading">
                  <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin text-muted" />
                </div>
                <div v-else-if="!recentActivity.length" class="dashboard-widget__empty">
                  <UIcon name="i-lucide-activity" class="size-8 text-muted" />
                  <p class="mt-2 text-sm text-muted">{{ t("rtyCms.table.empty") }}</p>
                  <RBtn size="sm" variant="outline" @click="loadActivity">{{ t("Refresh") }}</RBtn>
                </div>
                <div v-else class="dashboard-widget__list">
                  <div v-for="entry in recentActivity" :key="entry.Id" class="dashboard-widget__activity">
                    <div class="dashboard-widget__activity-icon" :class="activityIconClass(entry.Action)">
                      <UIcon :name="activityIcon(entry.Action)" class="size-4" />
                    </div>
                    <div class="dashboard-widget__activity-content">
                      <p class="dashboard-widget__activity-text">
                        <span class="font-medium">{{ entry.UserName || t("rtyCms.dashboard.system") }}</span>
                        {{ " " }}<span>{{ activityText(entry) }}</span>
                      </p>
                      <p class="dashboard-widget__activity-meta">
                        {{ formatDateTime(entry.CreatedAt) }}
                        <span v-if="entry.SubjectType"> · {{ entry.SubjectType }} #{{ entry.SubjectId }}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- System Status -->
              <div v-else-if="item.component === 'SystemStatus'" class="dashboard-widget">
                <div class="dashboard-widget__status-grid">
                  <div class="dashboard-widget__status-item">
                    <div class="flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full" :class="wsConnected ? 'bg-success animate-pulse' : 'bg-error'"></span>
                      <span class="text-sm font-medium">{{ wsConnected ? t("Connected") : t("Disconnected") }}</span>
                    </div>
                    <p class="text-xs text-muted mt-0.5">{{ t("WebSocket") }}</p>
                  </div>
                  <template v-if="stats">
                    <div class="dashboard-widget__status-item">
                      <p class="text-2xl font-bold">{{ stats.Users?.Total ?? 0 }}</p>
                      <p class="text-xs text-muted">{{ t("Total Users") }}</p>
                    </div>
                    <div class="dashboard-widget__status-item">
                      <p class="text-2xl font-bold">{{ stats.Sessions?.ActiveSessions ?? 0 }}</p>
                      <p class="text-xs text-muted">{{ t("Active Sessions") }}</p>
                    </div>
                    <div class="dashboard-widget__status-item">
                      <p class="text-2xl font-bold">{{ (stats.Content?.Posts ?? 0) + (stats.Content?.Artworks ?? 0) }}</p>
                      <p class="text-xs text-muted">{{ t("Content Items") }}</p>
                    </div>
                  </template>
                </div>
              </div>

              <!-- Quick Actions -->
              <div v-else-if="item.component === 'QuickActions'" class="dashboard-widget">
                <div class="dashboard-widget__actions-grid">
                  <NuxtLink
                    v-for="module in modules"
                    :key="module.key"
                    :to="localePath(module.to)"
                    class="dashboard-widget__action-card"
                  >
                    <div class="flex items-center gap-3">
                      <span v-if="module.icon" class="text-primary" v-html="module.icon" />
                      <UIcon v-else name="i-lucide-layout-grid" class="size-5 shrink-0 text-primary" />
                      <p class="truncate font-medium">{{ module.label ? t(module.label) : module.key }}</p>
                    </div>
                    <ul v-if="module.children?.length" class="mt-3 space-y-2">
                      <li v-for="child in module.children" :key="child.key">
                        <NuxtLink
                          :to="localePath(child.to)"
                          class="flex items-center gap-2 text-sm text-muted hover:text-default transition-colors"
                        >
                          <UIcon name="i-lucide-chevron-right" class="size-3.5 shrink-0" />
                          <span class="truncate">{{ child.label ? t(child.label) : child.key }}</span>
                        </NuxtLink>
                      </li>
                    </ul>
                  </NuxtLink>
                </div>
              </div>

              <!-- Default widget placeholder -->
              <div v-else class="dashboard-widget-placeholder">
                <UIcon :name="item.icon || 'i-lucide-layout-grid'" class="size-12 text-muted" />
                <p class="mt-2 text-sm text-muted">{{ item.title }}</p>
                <p class="text-xs text-muted mt-1">Widget: {{ item.component || "Custom" }}</p>
                <div class="mt-2 text-xs text-muted font-mono">
                  {{ item.w }} × {{ item.h }} @ ({{ item.x }}, {{ item.y }})
                </div>
              </div>
            </div>
          </div>
        </template>
      </RGridLayout>

      <!-- Real-time Connection Status -->
      <div class="dashboard-connection" v-show="wsConnected">
        <div class="flex items-center gap-2 text-xs text-success">
          <span class="w-2 h-2 rounded-full bg-success animate-pulse"></span>
          <span>{{ t("rtyCms.dashboard.live_updates") }}</span>
        </div>
      </div>
    </div>
  </RContent>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue"

import { useTenantStore } from "~/stores/tenant"
import { usePermissionConfig } from "~/composables/usePermissionConfig"
// import { formatDateTime } from "~/composables/useGlobalFunctions"
import api from "~/helpers/apis"

const { t } = useI18n()
const tenant = useTenantStore()
const rbac = usePermissionConfig()
const menuStore = useMenuStore()

// ── Grid ─────────────────────────────────────────────────────────────────────
const gridBreakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }
// Every breakpoint layout below is authored on a 12-column grid
const gridCols = { lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 }

const widget = (key, icon, title, geometry) => ({
  i: key,
  component: key,
  icon,
  title,
  ...geometry,
})

const buildLayouts = () => {
  const users = (g) => widget("RecentUsers", "i-lucide-users", t("rtyCms.dashboard.recent_users"), g)
  const activity = (g) => widget("RecentActivity", "i-lucide-activity", t("rtyCms.dashboard.recent_activity"), g)
  const status = (g) => widget("SystemStatus", "i-lucide-activity", t("rtyCms.dashboard.system_status"), g)
  const actions = (g) => widget("QuickActions", "i-lucide-zap", t("rtyCms.dashboard.quick_actions"), g)
  const stacked = () => [
    users({ x: 0, y: 0, w: 12, h: 6 }),
    activity({ x: 0, y: 6, w: 12, h: 6 }),
    status({ x: 0, y: 12, w: 12, h: 6 }),
    actions({ x: 0, y: 18, w: 12, h: 6 }),
  ]

  return {
    lg: [
      users({ x: 0, y: 0, w: 12, h: 6 }),
      activity({ x: 0, y: 6, w: 6, h: 8 }),
      status({ x: 6, y: 6, w: 6, h: 8 }),
      actions({ x: 0, y: 14, w: 12, h: 6 }),
    ],
    md: [
      users({ x: 0, y: 0, w: 6, h: 6 }),
      activity({ x: 6, y: 0, w: 6, h: 6 }),
      status({ x: 0, y: 6, w: 12, h: 6 }),
      actions({ x: 0, y: 12, w: 12, h: 6 }),
    ],
    sm: stacked(),
    xs: stacked(),
    xxs: stacked(),
  }
}

const responsiveLayouts = buildLayouts()

// RGridLayout mutates its layout in place, so seed it with a detached copy of `lg`
const dashboardLayout = ref(JSON.parse(JSON.stringify(responsiveLayouts.lg)))

// v-model:option — the control panel (edit mode / grid lines) writes back into this object
const gridOption = ref({
  isResponsive: true,
  isDraggable: true,
  isResizable: true,
  isVerticalCompact: true,
  isUseCssTransforms: true,
  colNum: 12,
  rowHeight: 60,
  margin: [16, 16],
  breakpoints: gridBreakpoints,
  cols: gridCols,
  showGridLines: false,
  // Drag by the widget header only, so scrolling / clicking inside a widget never moves it
  dragAllowFrom: ".dashboard-grid-item__header",
})

const gridLabels = computed(() => ({
  controlPanel: t("Customize layout"),
  draggable: t("Draggable"),
  resizable: t("Resizable"),
  showGridLines: t("Grid lines"),
  reset: t("Reset"),
}))

// ── Data ─────────────────────────────────────────────────────────────────────
const stats = ref(null)
const loadingStats = ref(true)
const recentUsers = ref([])
const loadingUsers = ref(false)
const recentActivity = ref([])
const loadingActivity = ref(false)
const wsConnected = ref(false)

let ws = null
let reconnectTimer = null
let isUnmounting = false

const statsCards = computed(() => {
  if (!stats.value) return []
  return [
    {
      key: "users",
      title: t("rtyCms.dashboard.total_users"),
      value: stats.value.Users?.Total ?? 0,
      icon: "i-lucide-users",
      color: "accent",
      trend: stats.value.Users?.Total > 0 ? ((stats.value.Users?.NewToday ?? 0) / stats.value.Users.Total * 100) : 0,
    },
    {
      key: "active",
      title: t("rtyCms.dashboard.active_users"),
      value: stats.value.Users?.Active ?? 0,
      icon: "i-lucide-user-check",
      color: "success",
      trend: stats.value.Users?.Total > 0 ? ((stats.value.Users?.New7d ?? 0) / stats.value.Users.Total * 100) : 0,
    },
    {
      key: "content",
      title: t("rtyCms.dashboard.content_items"),
      value: (stats.value.Content?.Posts ?? 0) + (stats.value.Content?.Artworks ?? 0),
      icon: "i-lucide-file-text",
      color: "info",
      trend: (stats.value.Content?.Posts ?? 0) > 0 ? (stats.value.Content?.PostsPublished ?? 0) / (stats.value.Content?.Posts ?? 1) * 100 : 0,
    },
    {
      key: "sessions",
      title: t("rtyCms.dashboard.active_sessions"),
      value: stats.value.Sessions?.ActiveSessions ?? 0,
      icon: "i-lucide-activity",
      color: "warning",
      trend: stats.value.Sessions?.WebSockets > 0 ? (stats.value.Sessions?.OnlineUsers ?? 0) / stats.value.Sessions.WebSockets * 100 : 0,
    },
  ]
})

const greeting = computed(() => {
  const name = rbac.context.value?.Username || rbac.context.value?.Email || ""
  return name
    ? t("rtyCms.dashboard.greeting", { name })
    : t("rtyCms.dashboard.description")
})

const canSwitchDatabase = computed(() => tenant.canSwitchDatabase.value)
const canSwitchLanguage = computed(() => tenant.canSwitchLanguage.value)

const modules = computed(() => menuStore.getSidebarMenu)

async function loadStats() {
  loadingStats.value = true
  try {
    const { data, error } = await useHttp(api.dashboard.summary, { method: "GET" })
    if (!error.value && data.value) {
      stats.value = data.value
    }
  } finally {
    loadingStats.value = false
  }
}

async function loadUsers() {
  loadingUsers.value = true
  try {
    const { data, error } = await useHttp(api.dashboard.users, {
      method: "GET",
      params: { page: 1, page_size: 10 },
    })
    if (!error.value && data.value) {
      recentUsers.value = data.value.Items ?? []
    }
  } finally {
    loadingUsers.value = false
  }
}

async function loadActivity() {
  loadingActivity.value = true
  try {
    const { data, error } = await useHttp(api.dashboard.activity, {
      method: "GET",
      params: { page: 1, page_size: 15 },
    })
    if (!error.value && data.value) {
      recentActivity.value = data.value.Items ?? []
    }
  } finally {
    loadingActivity.value = false
  }
}

// WebSocket for real-time updates (auto-reconnect, cleaned up on unmount)
function connectWebSocket() {
  const token = useCookie("access_token").value
  if (!token || isUnmounting) return

  const wsUrl = `${import.meta.env.VITE_WS_URL || ""}/ws/dashboard?token=${token}`
  ws = new WebSocket(wsUrl)

  ws.onopen = () => {
    wsConnected.value = true
  }

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data)
      if (msg.type === "stats" || msg.type === "snapshot") {
        stats.value = msg.data
      }
    } catch {
      // ignore parse errors
    }
  }

  ws.onclose = () => {
    wsConnected.value = false
    if (!isUnmounting) {
      reconnectTimer = setTimeout(connectWebSocket, 5000)
    }
  }

  ws.onerror = () => {
    wsConnected.value = false
  }
}

function activityIcon(action) {
  const map = {
    create: "i-lucide-plus-circle",
    update: "i-lucide-edit-3",
    delete: "i-lucide-trash-2",
    publish: "i-lucide-rocket",
    login: "i-lucide-log-in",
    logout: "i-lucide-log-out",
    assign: "i-lucide-shield-check",
  }
  return map[action?.toLowerCase()] || "i-lucide-activity"
}

function activityIconClass(action) {
  const map = {
    create: "bg-success/10 text-success",
    update: "bg-info/10 text-info",
    delete: "bg-error/10 text-error",
    publish: "bg-warning/10 text-warning",
    login: "bg-primary/10 text-primary",
    logout: "bg-neutral/10 text-neutral",
    assign: "bg-primary/10 text-primary",
  }
  return map[action?.toLowerCase()] || "bg-neutral/10 text-neutral"
}

function activityText(item) {
  const action = t(`rtyCms.dashboard.actions.${item.Action.toLowerCase()}`, { default: item.Action })
  if (item.SubjectType) {
    return `${action} ${item.SubjectType} #${item.SubjectId}`
  }
  return action
}

// ── Grid events ──────────────────────────────────────────────────────────────
// Fired after every user-driven change (moved / resized / add / remove / reset).
// Persist `layout` here (localStorage, API, …) if you want the arrangement to survive reloads.
function onDashboardLayoutChange(_layout, { type, breakpoint }) {
  if (import.meta.dev) console.debug("[dashboard] layout", type, breakpoint)
}

function onDashboardBreakpointChange(breakpoint) {
  if (import.meta.dev) console.debug("[dashboard] breakpoint", breakpoint)
}

// ── Widget actions ───────────────────────────────────────────────────────────
// The transformed grid item breaks `position: fixed`, so the Fullscreen API is used instead.
async function toggleFullscreen(widgetId) {
  const el = document.querySelector(`[data-item-id="${CSS.escape(String(widgetId))}"]`)
  if (!el?.requestFullscreen) return
  try {
    if (document.fullscreenElement === el) await document.exitFullscreen()
    else await el.requestFullscreen()
  } catch {
    // the browser refused (no user gesture / not allowed) — nothing to do
  }
}

function refreshWidget(widgetId) {
  const item = dashboardLayout.value.find((l) => l.i === widgetId)
  if (!item) return
  switch (item.component) {
    case "RecentUsers":
      void loadUsers()
      break
    case "RecentActivity":
      void loadActivity()
      break
    case "SystemStatus":
      void loadStats()
      break
  }
}

onMounted(async () => {
  await menuStore.get()
  await Promise.all([loadStats(), loadUsers(), loadActivity()])
  connectWebSocket()
})

onUnmounted(() => {
  isUnmounting = true

  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }

  ws?.close()
  ws = null
})
</script>

<style lang="scss" scoped>
.dashboard-page {
  padding: 0;
  max-width: 100%;
}

.dashboard-hero {
  position: relative;
  border-radius: 1rem;
  overflow: hidden;
  padding: 2rem 2.5rem;
  color: var(--c-text);

  @media (max-width: 768px) {
    padding: 2rem 1.5rem;
  }

  &__bg {
    position: absolute;
    inset: 0;
    z-index: 0;
  }

  &__mesh {
    position: absolute;
    inset: 0;
  }

  &__blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(64px);
    opacity: 0.25;
    animation: dash-drift 20s ease-in-out infinite;
    will-change: transform, opacity;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }

    &--a {
      width: 200%;
      height: 200%;
      top: -50%;
      left: -50%;
      background: radial-gradient(circle at 30% 30%, var(--c-primary), transparent 70%);
      animation-delay: 0s;
    }
    &--b {
      width: 180%;
      height: 180%;
      bottom: -60%;
      right: -40%;
      background: radial-gradient(circle at 70% 70%, var(--c-secondary), transparent 70%);
      animation-duration: 24s;
      animation-delay: -5s;
    }
    &--c {
      width: 140%;
      height: 140%;
      top: 10%;
      left: 50%;
      transform: translateX(-50%);
      background: radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--c-primary) 60%, var(--c-secondary)), transparent 70%);
      animation-duration: 28s;
      animation-delay: -10s;
      opacity: 0.18;
    }
  }

  &__noise {
    position: absolute;
    inset: 0;
    opacity: 0.02;
    pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    background-size: 256px 256px;
  }

  &__content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 1rem;

    @media (min-width: 768px) {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
    }
  }

  &__title {
    margin: 0;
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    font-weight: 800;
    letter-spacing: -0.02em;
    background: linear-gradient(135deg, var(--c-text), var(--c-muted));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  &__subtitle {
    margin: 0;
    color: var(--c-muted);
    font-size: 1rem;
  }

  &__actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;

    @media (max-width: 767px) {
      width: 100%;
      justify-content: center;
    }
  }
}

.dashboard-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.dashboard-grid {
  margin-top: 1rem;
}

// ── Widget cards (rendered through RGridLayout's #item slot) ─────────────────
.dashboard-grid-item {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 0.75rem;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.04);
  transition: box-shadow 200ms ease, border-color 200ms ease;

  &:hover {
    border-color: color-mix(in srgb, var(--c-primary) 25%, var(--c-border));
    box-shadow: 0 10px 28px -12px rgb(0 0 0 / 0.2);
  }

  &:fullscreen {
    border-radius: 0;
    border: 0;
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--c-border);
    background: color-mix(in srgb, var(--c-bg) 60%, var(--c-surface));
    cursor: grab;
    user-select: none;

    &:active {
      cursor: grabbing;
    }
  }

  &__title {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--c-text);
  }

  &__actions {
    display: flex;
    gap: 0.25rem;
    cursor: default;
  }

  &__content {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 1rem;
  }
}

.dashboard-widget {
  display: flex;
  flex-direction: column;
  height: 100%;

  &__loading,
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 1rem;
    color: var(--c-muted);
  }

  &__list {
    flex: 1;
    overflow-y: auto;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--c-border);

    &:last-child {
      border-bottom: none;
    }
  }

  &__activity {
    display: flex;
    gap: 0.75rem;
    padding: 0.5rem 0;
  }

  &__activity-icon {
    display: grid;
    flex-shrink: 0;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 0.5rem;
  }

  &__activity-content {
    flex: 1;
    min-width: 0;
  }

  &__activity-text {
    margin: 0 0 0.125rem;
    font-size: 0.8125rem;
    color: var(--c-text);
  }

  &__activity-meta {
    margin: 0;
    font-size: 0.6875rem;
    color: var(--c-muted);
  }

  &__status-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;

    @media (min-width: 480px) {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  &__status-item {
    padding: 0.75rem;
    background: color-mix(in srgb, var(--c-primary) 5%, transparent);
    border: 1px solid var(--c-border);
    border-radius: 0.5rem;

    p {
      margin: 0;
    }
  }

  &__actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 0.75rem;
  }

  &__action-card {
    display: block;
    padding: 1rem;
    text-decoration: none;
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: 0.75rem;
    transition: all 200ms ease;

    &:hover {
      border-color: color-mix(in srgb, var(--c-primary) 30%, var(--c-border));
      box-shadow: 0 4px 12px rgb(0 0 0 / 0.08);
      transform: translateY(-2px);
    }
  }
}

.dashboard-widget-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
  text-align: center;
  color: var(--c-muted);
  background: color-mix(in srgb, var(--c-bg) 80%, var(--c-surface));
  border: 2px dashed var(--c-border);
  border-radius: 0.75rem;
}

.dashboard-connection {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: color-mix(in srgb, var(--c-success) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--c-success) 20%, transparent);
  border-radius: 0.5rem;
}

@keyframes dash-drift {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(4%, -3%) scale(1.06);
  }
}
</style>
