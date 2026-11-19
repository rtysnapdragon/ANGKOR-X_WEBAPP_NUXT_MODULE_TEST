import { defineStore, skipHydrate } from 'pinia'
import { computed, ref } from 'vue'

/**
 * Theme store: a thin layer over `@nuxtjs/color-mode` (`useColorMode()`),
 * which stays the single source of truth for the theme.
 *
 * The module already owns persistence (under `colorMode.storageKey`), the
 * `.dark` class, the OS `prefers-color-scheme` listener and the inline head
 * script that prevents a flash of the wrong theme. A second copy of the mode in
 * Pinia drifted from it (Pinia re-hydrated the server default over the value
 * read from localStorage), so this store keeps no copy of its own.
 *
 * Everything the UI needs lives here, so ThemeToggle and MobileDrawer stay
 * presentational:
 *   - `mode` / `isDark`            the user's choice, and what is actually painted
 *   - `setMode` / `set` / `toggle` writes
 *   - `options`                    Light / Dark / System with icon + i18n key
 *   - `ready`                      false until the app has mounted (hydration-safe)
 *   - `activeMode` / `activeIndex` / `active`   `mode`, held at 'system' until ready
 *   - `onOptionKeydown`            radio-group arrow / Home / End navigation
 *
 * Required nuxt.config (so `.dark` matches `_color.scss`):
 *   colorMode: { classSuffix: '', storageKey: 'rty-cms-color-mode', preference: 'system' }
 */

/** `labelKey` is an i18n key; components translate it, so the store has no i18n dependency. */
export const THEME_OPTIONS = Object.freeze([
  { value: 'light', icon: 'ri-sun-line', labelKey: 'theme_light' },
  { value: 'dark', icon: 'ri-moon-line', labelKey: 'theme_dark' },
  { value: 'system', icon: 'ri-computer-line', labelKey: 'theme_system' },
])

export const isThemeMode = (value) => THEME_OPTIONS.some((o) => o.value === value)

export const useThemeStore = defineStore('rtyCmsTheme', () => {
  const colorMode = useColorMode()
  const nuxtApp = useNuxtApp()

  // ── Core state (read from color-mode; nothing of our own to hydrate) ──
  const mode = computed(() => (isThemeMode(colorMode.preference) ? colorMode.preference : 'system'))

  /** Resolved theme: `colorMode.value` already folds 'system' into light/dark. */
  const isDark = computed(() => colorMode.value === 'dark')

  function setMode(value) {
    colorMode.preference = value
  }

  /** Explicit light/dark from a boolean. */
  function set(dark) {
    setMode(dark ? 'dark' : 'light')
  }

  /** Flips whatever is currently painted. */
  function toggle() {
    setMode(isDark.value ? 'light' : 'dark')
  }

  /** @deprecated color-mode initialises itself; kept so old callers do not break. */
  function init() {}

  // ── Hydration-safe view of the mode ──────────────────────────
  // The stored preference only exists in the browser. Until the app has
  // mounted we report what the server rendered ('system'), so the first client
  // render matches the HTML. `skipHydrate` stops Pinia restoring the server's
  // value over it.
  const ready = skipHydrate(ref(false))
  if (import.meta.client) {
    if (nuxtApp.isHydrating) {
      nuxtApp.hooks.hookOnce('app:mounted', () => {
        ready.value = true
      })
    } else {
      ready.value = true // SPA, or the store was first used after hydration
    }
  }

  const activeMode = computed(() => (ready.value ? mode.value : 'system'))
  const activeIndex = computed(() =>
    Math.max(0, THEME_OPTIONS.findIndex((o) => o.value === activeMode.value)),
  )
  const active = computed(() => THEME_OPTIONS[activeIndex.value])

  // ── Radio-group keyboard support ─────────────────────────────
  // Arrow keys / Home / End move the selection, as a native radio group does.
  // Focus moves through the DOM, so the components need no template refs.
  function onOptionKeydown(event, index) {
    const last = THEME_OPTIONS.length - 1
    let next
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        next = index === last ? 0 : index + 1
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        next = index === 0 ? last : index - 1
        break
      case 'Home':
        next = 0
        break
      case 'End':
        next = last
        break
      default:
        return
    }
    event.preventDefault()
    setMode(THEME_OPTIONS[next].value)
    const group = event.currentTarget?.closest('[role="radiogroup"]')
    group?.querySelectorAll('[role="radio"]')[next]?.focus()
  }

  return {
    mode,
    isDark,
    setMode,
    set,
    toggle,
    init,
    options: THEME_OPTIONS,
    ready,
    activeMode,
    activeIndex,
    active,
    onOptionKeydown,
  }
})