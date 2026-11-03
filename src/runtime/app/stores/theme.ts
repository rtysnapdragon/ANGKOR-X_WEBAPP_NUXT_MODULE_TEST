import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/**
 * Drives the `.dark` class (which both `_color.scss` and the module's
 * `global.scss` key off) and persists the choice under the same storage key
 * `@nuxtjs/color-mode` is configured with, so the two stay in sync.
 *
 * Three user-facing modes:
 *   - 'light' / 'dark'  : explicit choice
 *   - 'system'          : follows the OS and reacts live when the OS flips
 *
 * `isDark` is the *resolved* result (what is actually painted), so existing
 * consumers that only read `theme.isDark` / call `theme.toggle()` keep working.
 */
export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'rty-cms-color-mode'
const MODES: readonly ThemeMode[] = ['light', 'dark', 'system']

const isMode = (value: unknown): value is ThemeMode =>
  typeof value === 'string' && (MODES as readonly string[]).includes(value)

export const useThemeStore = defineStore('rtyCmsTheme', () => {
  const mode = ref<ThemeMode>('system')
  const systemDark = ref(false)

  const isDark = computed(
    () => mode.value === 'dark' || (mode.value === 'system' && systemDark.value),
  )

  function apply() {
    if (typeof document === 'undefined') return
    const root = document.documentElement
    root.classList.toggle('dark', isDark.value)
    root.style.colorScheme = isDark.value ? 'dark' : 'light'
  }

  function setMode(value: ThemeMode) {
    mode.value = value
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, value)
      } catch {
        /* private mode / blocked storage must never break the toggle */
      }
    }
    apply()
  }

  /** Back-compat: explicit light/dark from a boolean. */
  function set(dark: boolean) {
    setMode(dark ? 'dark' : 'light')
  }

  /** Back-compat: flips whatever is currently painted. */
  function toggle() {
    setMode(isDark.value ? 'light' : 'dark')
  }

  // ── OS preference ───────────────────────────────────────────
  let mql: MediaQueryList | null = null

  function onSystemChange(event: MediaQueryListEvent) {
    systemDark.value = event.matches
    apply() // only changes anything while mode === 'system'
  }

  function init() {
    if (typeof document === 'undefined') return

    if (typeof window !== 'undefined' && window.matchMedia) {
      if (!mql) {
        mql = window.matchMedia('(prefers-color-scheme: dark)')
        if (mql.addEventListener) mql.addEventListener('change', onSystemChange)
        else mql.addListener(onSystemChange) // Safari < 14
      }
      systemDark.value = mql.matches
    }

    let stored: string | null = null
    try {
      stored = localStorage.getItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }

    // Nothing (or garbage) stored → follow the system, like color-mode's default.
    mode.value = isMode(stored) ? stored : 'system'
    apply()
  }

  init()

  return { mode, isDark, systemDark, setMode, set, toggle, init }
})