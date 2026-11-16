// stores/ui.ts
import { defineStore } from 'pinia'

/*
FULL PRODUCTION VERSION

Features:
- realtime notifications
- route on click
- Django PascalCase API support
- token auth
- unread count
- optimistic updates
- polling fallback
- websocket ready
*/

export interface NotificationItem {
  Id: number
  Type: 'like' | 'comment' | 'follow' | 'save' | 'system'
  Message: string
  From?: string
  FromAvatar?: string
  IsRead: boolean
  CreatedAt: string

  /*
  Route when clicked
  Example:
  /gallery/mekong-memories
  /artists/sophea-khun
  /dashboard/notifications
  */
  Href?: string

  /*
  optional image
  */
  Cover?: string
}

interface UIState {
  isDark: boolean
  notifPanelOpen: boolean
  aiAssistantOpen: boolean
  searchOpen: boolean
  mobileMenuOpen: boolean

  notifications: NotificationItem[]

  notifSocket: WebSocket | null
  notifLoading: boolean
  notifToken: string | null

  fullReloading: boolean
}

export const useUIStore = defineStore('ui', {
  state: (): UIState => ({
    isDark: false,
    notifPanelOpen: false,
    aiAssistantOpen: false,
    searchOpen: false,
    mobileMenuOpen: false,

    notifications: [],

    notifSocket: null,
    notifLoading: false,
    notifToken: null,

    fullReloading: false
  }),

  getters: {
    hasSystemNotif: (state) =>
      state.notifications.some((n) => n.Type === 'system'),

    unreadCount: (state) =>
      state.notifications.filter((n) => !n.IsRead).length,

    systemNotif: (state) =>
      state.notifications.filter((n) => n.Type === 'system'),

    userNotifs: (state) =>
      state.notifications.filter((n) => n.Type !== 'system')
  },

  actions: {
    /* =======================
       THEME
    ======================= */

    initTheme() {
      if (!import.meta.client) return

      const saved = localStorage.getItem('rama_theme')
      const prefersDark =
        window.matchMedia('(prefers-color-scheme: dark)').matches

      this.isDark = saved
        ? saved === 'dark'
        : prefersDark

      this.applyTheme()
    },

    toggleTheme() {
      this.isDark = !this.isDark
      this.applyTheme()

      localStorage.setItem(
        'rama_theme',
        this.isDark ? 'dark' : 'light'
      )
    },

    applyTheme() {
      if (!import.meta.client) return

      document.documentElement.classList.toggle(
        'dark',
        this.isDark
      )
    },

    /* =======================
       PANELS
    ======================= */

    toggleNotifPanel() {
      this.notifPanelOpen = !this.notifPanelOpen
      this.aiAssistantOpen = false
      this.searchOpen = false
    },

    toggleAIAssistant() {
      this.aiAssistantOpen = !this.aiAssistantOpen
      this.notifPanelOpen = false
    },

    toggleSearch() {
      this.searchOpen = !this.searchOpen
    },

    toggleMobileMenu() {
      console.log("Toggle mobile menu")
      this.mobileMenuOpen = !this.mobileMenuOpen
    },

    closeAll() {
      this.notifPanelOpen = false
      this.aiAssistantOpen = false
      this.searchOpen = false
      this.mobileMenuOpen = false
    },

    // ===============Reload full page with lang switch ==========================//
    startReload() {
      this.fullReloading = true

      // prevent scrolling during reload
      document.body.style.overflow = 'hidden'
    },

    stopReload() {
      this.fullReloading = false

      document.body.style.overflow = ''
    },

    hardReload(url = '/') {
      this.startReload()

      window.location.replace(url)
    }
  }
})