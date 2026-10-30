// stores/ui.ts
import { defineStore,acceptHMRUpdate } from 'pinia'

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
// ============================================================
// SARIKA — UI Store  (stores/ui.ts)
// ============================================================\

export const useUIStore = defineStore('ui', {
  state: () => ({
    isDark: false,
    isCollapse: false,
    isSidebarCollapsed: false,
    notifPanelOpen: false,
    aiAssistantOpen: false,
    searchOpen: false,
    isMobileOpen : false,

    notifSocket: null,
    notifLoading: false,
    notifToken: null,

    searching: false,
    reportStatus: 'idle',
    trackStage: 'pending',
    lastScanValue: '',

    theme: 'system',
    locale: 'km',
    sidebarOpen: false,
    sidebarCollapsed: false,
    device: 'desktop',
    toasts: [],
    loadingKeys: new Set(),
    slideoverStack: [],
    modalStack: []
  }),

  getters: {
    isDark(state) {
      if (state.theme === 'system') {
        return typeof window !== 'undefined'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
          : false
      }
      return state.theme === 'dark'
    },
 
    isMobile:  (state) => state.device === 'mobile',
    isTablet:  (state) => state.device === 'tablet',
    isDesktop: (state) => state.device === 'desktop',
 
    isLoading: (state) => (key) => state.loadingKeys.has(key),
    anyLoading:(state) => state.loadingKeys.size > 0,
  },

  actions: {
    /* =======================
       THEME
    ======================= */
    setTheme(mode) {
      this.theme = mode
      if (typeof document !== 'undefined') {
        const isDark = mode === 'dark' ||
          (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
        document.documentElement.classList.toggle('dark', isDark)
      }
    },
 
    toggleTheme() {
      this.setTheme(this.isDark ? 'light' : 'dark')
      localStorage.setItem( 'sarika_theme', this.isDark ? 'dark' : 'light' )
    },

    toggleTheme1() {
      this.isDark = !this.isDark
      this.applyTheme()

      localStorage.setItem(
        'rama_theme',
        this.isDark ? 'dark' : 'light'
      )
    },

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

    applyTheme() {
      if (!import.meta.client) return

      document.documentElement.classList.toggle(
        'dark',
        this.isDark
      )
    },
    /* ── Locale ── */
    setLocale(locale) {
      this.locale = locale
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('lang', locale)
        document.documentElement.setAttribute('dir', 'ltr')
      }
    },
 
    openSearch() { this.searchOpen = true },
    closeSearch() { this.searchOpen = false },
    setReportStatus(s) { this.reportStatus = s },
    
    setTrackStage(s) { this.trackStage = s },
    setLastScan(v) { this.lastScanValue = v },

    /* =======================
       PANELS
    ======================= */
    /* ── Sidebar ── */
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen
      this.isSidebarCollapsed = !this.isSidebarCollapsed
    },
    collapseSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },
    setSidebarOpen(open) {
      this.sidebarOpen = open
    },

    toggleCollapse() {
      this.isCollapse = !this.isCollapse
    },

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

    toggleMobile() {
      this.isMobileOpen  = !this.isMobileOpen 
    },

    closeAll() {
      this.notifPanelOpen = false
      this.aiAssistantOpen = false
      this.searchOpen = false
      this.isMobileOpen  = false
    },

     /* ── Device Detection ── */
    detectDevice() {
      if (typeof window === 'undefined') return
      const w = window.innerWidth
      if (w < 768)       this.device = 'mobile'
      else if (w < 1024) this.device = 'tablet'
      else               this.device = 'desktop'
    },
 
    initDeviceListener() {
      if (typeof window === 'undefined') return
      this.detectDevice()
      window.addEventListener('resize', () => this.detectDevice())
    },
 
    /* ── Loading ── */
    startLoading(key) {
      this.loadingKeys.add(key)
    },
    stopLoading(key) {
      this.loadingKeys.delete(key)
    },
    async withLoading(key, fn) {
      this.startLoading(key)
      try {
        return await fn()
      } finally {
        this.stopLoading(key)
      }
    },
    
    /* ── Toasts ── */
    addToast(toast) {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
      this.toasts.push({ ...toast, id })
      setTimeout(() => this.removeToast(id), toast.duration ?? 4000)
    },
    removeToast(id) {
      const idx = this.toasts.findIndex(t => t.id === id)
      if (idx !== -1) this.toasts.splice(idx, 1)
    },
    success(title, message) {
      this.addToast({ type: 'success', title, message, duration: 3500 })
    },
    error(title, message) {
      this.addToast({ type: 'error', title, message, duration: 5000 })
    },
    info(title, message) {
      this.addToast({ type: 'info', title, message, duration: 4000 })
    },
    warn(title, message) {
      this.addToast({ type: 'warning', title, message, duration: 4000 })
    },
 
    /* ── Slideover stack ── */
    openSlideover(id) {
      if (!this.slideoverStack.includes(id))
        this.slideoverStack.push(id)
    },
    closeSlideover(id) {
      this.slideoverStack = this.slideoverStack.filter(s => s !== id)
    },
    closeAllSlideovers() {
      this.slideoverStack = []
    },
 
    /* ── Modal stack ── */
    openModal(id) {
      if (!this.modalStack.includes(id))
        this.modalStack.push(id)
    },
    closeModal(id) {
      this.modalStack = this.modalStack.filter(m => m !== id)
    },
  }
})


// make sure to pass the right store definition, `useAuth` in this case.
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUIStore, import.meta.hot))
}