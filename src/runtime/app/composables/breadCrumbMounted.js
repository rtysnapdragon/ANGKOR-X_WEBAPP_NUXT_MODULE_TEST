// composables/useBreadCrumb.js
// No TypeScript — plain JS composable

const defaultState = () => ({
  // Header
  ownerId: undefined,
  title: undefined,
  description: undefined,
  icon: undefined,

  // Back
  hasBack: false,
  backTooltip: undefined,
  fnBack: undefined,

  // Right-side action buttons
  // Shape: [{ label, icon, color, variant, size, to, onClick, disabled, loading, key }]
  actions: [],

 // Right-side full override — a functional component `(props) => VNode` (or VNode array).
  // When set, this replaces the whole `actions` render (still passed through the
  // #actions slot first, so a template consumer's slot always wins if provided).
  rightTemplate: undefined,

    // Left-side extra button (sits beside the back button / breadcrumb trail).
  // Clicking it opens a popover panel rendered from `render`.
  // Shape: { icon, label, tooltip, color, variant, size, render, onClick }
  // `render` — a functional component `(props) => VNode` rendered as the popover's
  // content (i.e. "render a div as template" driven purely from page state).
  leftButton: undefined,

  // Breadcrumb
  items: [],
  separatorIcon: 'i-lucide-chevron-right',
})

export const useBreadCrumbMounted = () => {
  const data = useState('breadcrumb', defaultState)

  // ── Set any subset of state ──────────────────────────────
  const set = (payload) => {
    data.value = { ...data.value, ...payload }
  }

  // ── Reset to defaults ─────────────────────────────────────
  const clear = () => {
    data.value = defaultState()
  }
  const add = (d) => {
    data.value = d;
  }
  // ── Helpers ───────────────────────────────────────────────
  const setTitle = (title, description, icon) => {
    data.value.title = title
    data.value.description = description
    data.value.icon = icon
  }

  const setBreadcrumbs = (items) => {
    data.value.items = items ?? []
  }

  /**
   * Enable back button.
   * @param {() => void} [action]  - callback; falls back to router.back()
   * @param {string}     [tooltip]
   */
  const setBack = (action, tooltip) => {
    data.value.hasBack = true
    data.value.fnBack = action ?? undefined // keep undefined so we can fall back to router.back()
    data.value.backTooltip = tooltip
  }

  const clearBack = () => {
    data.value.hasBack = false
    data.value.fnBack = undefined
    data.value.backTooltip = undefined
    data.value.actions = []
    data.value.rightTemplate = undefined
    data.value.leftButton = undefined
  }

  /**
   * Set the right-side action buttons.
   * @param {Array} actions - list of action button configs
   */
  const setActions = (actions) => {
    data.value.actions = Array.isArray(actions) ? actions : []
  }

/**
   * Set a fully custom render for the entire right side, replacing `actions`.
   * @param {Function|null} renderFn - functional component `(props) => VNode`
   */
  const setRightTemplate = (renderFn) => {
    data.value.rightTemplate = typeof renderFn === 'function' ? renderFn : undefined
  }
  // Backward-compat alias (older pages may still call setHasAction)
  const setHasAction = setActions
  /**
   * Set the left-side popover button.
   * @param {{ icon?: string, label?: string, tooltip?: string, color?: string,
   *           variant?: string, size?: string, render?: Function, onClick?: Function }|null} config
   */
  const setLeftButton = (config) => {
    data.value.leftButton = config && typeof config === 'object' ? config : undefined
  }

  return {
    data,
    add,
    set,
    clear,
    setTitle,
    setBreadcrumbs,
    setBack,
    clearBack,
    setActions,
    setHasAction,
    setRightTemplate,
    setLeftButton,
  }
}