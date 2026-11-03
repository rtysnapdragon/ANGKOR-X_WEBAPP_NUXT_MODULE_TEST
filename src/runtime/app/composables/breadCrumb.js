// composables/breadCrumb.js
// Plain JS composable — shared state behind <RBreadCrumb>.
//
// Two ways to use it (both return the same API):
//
//  1. DECLARATIVE — describe the whole bar once, in setup(). Values may be plain, a ref, a
//     computed, or a getter, so the bar follows your page state automatically. The bar is
//     reset when the page unmounts (only if this page still owns it).
//
//        useBreadCrumb({
//          title: pageTitle,                       // ref / computed / getter / string
//          description: () => t('desc'),
//          icon: 'i-lucide-users',
//          showBack: true,
//          backTooltip: 'Back',
//          backAction: () => navigateTo('/admin'), // callback — never invoked as a getter
//          separatorIcon: 'i-lucide-chevron-right',
//          items: computed(() => [{ label: 'Home', to: '/' }, { label: 'Users' }]),
//          actions: () => [{ label: 'Save', onClick: save, loading: saving.value }],
//          rightTemplate: MyToolbar,               // component object OR (props) => VNode
//          leftButton: { label: 'View', icon: '…', tooltip: '…', render: MyPopover },
//        })
//
//     Or pass ONE getter returning the options, e.g. to switch the whole bar reactively:
//        useBreadCrumb(() => (isEdit.value ? editBar : viewBar))
//
//  2. IMPERATIVE — no argument; use the setters. No auto-cleanup (as before).
//
//        const crumb = useBreadCrumb()
//        crumb.setTitle('Users', 'Manage accounts', 'i-lucide-users')
//
// <RBreadCrumb> reads `useBreadCrumb().data` and is NOT changed by this file.
//
// Notes
//  - Declarative options only write state on the client. The layout (which holds <RBreadCrumb>)
//    is rendered before the page's setup() runs, so a server write could never reach the HTML —
//    it would only put functions into the SSR payload (which cannot be serialized) and cause a
//    hydration mismatch.
//  - Keys you stop declaring (e.g. when a getter returns a different set of options) are reset to
//    their defaults; keys you never declared are left alone, so imperative setters still work.

import { getCurrentScope, h, isVNode, onScopeDispose, toValue, unref, watch } from 'vue'
import { useState } from '#imports'

// ── State ────────────────────────────────────────────────────────────────────
const defaultState = () => ({
  ownerId: undefined,        // which declarative call currently owns the bar

  // Header
  title: undefined,
  description: undefined,
  icon: undefined,

  // Back
  hasBack: false,
  backTooltip: undefined,
  fnBack: undefined,         // falls back to router.back() in <RBreadCrumb>

  // Right side: buttons … or a full custom render (rightTemplate wins over `actions`)
  actions: [],               // [{ key, label, icon, color, variant, size, to, onClick, disabled, loading, render }]
  rightTemplate: undefined,  // functional component `(props) => VNode`
  leftTemplate: undefined,  // functional component `(props) => VNode`

  // Left popover button: { icon, label, tooltip, color, variant, size, onClick, render }
  leftButton: undefined,

  // Trail: [{ label, to, icon, tooltipLabel, onClick, disabled, children: [...] }] (strings allowed)
  items: [],
  separatorIcon: 'i-lucide-chevron-right',
})

// ── Option → state mapping ───────────────────────────────────────────────────
const ALIASES = {
  hasBack: 'showBack',
  fnBack: 'backAction',
  template: 'rightTemplate',
  leftTemplate: 'leftTemplate',
  breadcrumbs: 'items',
  hasAction: 'actions',
}
const STATE_KEYS = { showBack: 'hasBack', backAction: 'fnBack' }
const stateKey = (option) => STATE_KEYS[option] ?? option

// ── Helpers ──────────────────────────────────────────────────────────────────
const isPlainObject = (v) => {
  if (v === null || typeof v !== 'object' || isVNode(v) || v.__v_skip) return false
  const proto = Object.getPrototypeOf(v)
  return proto === Object.prototype || proto === null
}

/**
 * <RBreadCrumb> renders `rightTemplate`, `leftButton.render` and `actions[].render` with
 * `<component :is>` and only accepts FUNCTIONS. Pages naturally pass defineComponent({...})
 * objects, so wrap those in a functional component. Cached per component so the identity is
 * stable — a fresh wrapper on every update would remount (and e.g. blur a search input).
 */
const renderCache = new WeakMap()
const toRender = (component) => {
  if (!component) return undefined
  if (typeof component === 'function') return component
  if (typeof component !== 'object') return undefined
  if (isVNode(component)) return () => component
  let wrapper = renderCache.get(component)
  if (!wrapper) {
    wrapper = () => h(component)
    renderCache.set(component, wrapper)
  }
  return wrapper
}

/** Unwrap refs/computed at any depth of plain arrays/objects. Functions and components stay as-is. */
const KEEP_AS_IS = new Set(['render'])
const resolveDeep = (value) => {
  const v = unref(value)
  if (Array.isArray(v)) return v.map(resolveDeep)
  if (isPlainObject(v)) {
    const out = {}
    for (const key of Object.keys(v)) {
      out[key] = KEEP_AS_IS.has(key) ? unref(v[key]) : resolveDeep(v[key])
    }
    return out
  }
  return v
}

const normalizeItems = (list) =>
  Array.isArray(list)
    ? list.filter(Boolean).map((item) => (typeof item === 'string' ? { label: item } : item))
    : []

const normalizeActions = (list) =>
  Array.isArray(list)
    ? list
        .filter((a) => a && typeof a === 'object')
        .map((a) => (a.render === undefined ? a : { ...a, render: toRender(a.render) }))
    : []

const normalizeLeftButton = (button) =>
  button && typeof button === 'object' ? { ...button, render: toRender(button.render) } : undefined

// ── Declarative options ──────────────────────────────────────────────────────
const plain = (v) => toValue(v)

const RESOLVERS = {
  title: plain,
  description: plain,
  icon: plain,
  backTooltip: plain,
  separatorIcon: plain,
  showBack: (v) => {
    const value = toValue(v)
    return value === undefined ? undefined : !!value
  },
  // Callbacks: only unwrap a ref — NEVER call it (toValue would run `() => navigateTo(...)`).
  backAction: (v) => {
    const fn = unref(v)
    return typeof fn === 'function' ? fn : undefined
  },
  rightTemplate: (v) => toRender(unref(v)),
  leftTemplate: (v) => toRender(unref(v)),
  items: (v) => normalizeItems(resolveDeep(toValue(v))),
  actions: (v) => normalizeActions(resolveDeep(toValue(v))),
  leftButton: (v) => normalizeLeftButton(resolveDeep(toValue(v))),
}

const warned = new Set()

/** Read options (object | ref | reactive | getter) into a plain `{ option: value }` snapshot. */
const resolveOptions = (raw) => {
  const source = unref(typeof raw === 'function' ? raw() : raw)
  const out = {}
  if (!source || typeof source !== 'object') return out

  for (const [name, value] of Object.entries(source)) {
    const key = ALIASES[name] ?? name
    const resolve = RESOLVERS[key]
    if (!resolve) {
      if (import.meta.dev && !warned.has(name)) {
        warned.add(name)
        console.warn(`[useBreadCrumb] Unknown option "${name}" ignored.`)
      }
      continue
    }
    out[key] = resolve(value)
  }

  // A back callback implies a back button unless `showBack` was declared.
  if (typeof out.backAction === 'function' && !('showBack' in out)) out.showBack = true
  return out
}

/** Same normalisation for the imperative `set()` / `add()` (state-shaped payloads). */
const normalizeStatePatch = (payload = {}) => {
  const out = { ...payload }
  if ('items' in out) out.items = normalizeItems(resolveDeep(out.items))
  if ('actions' in out) out.actions = normalizeActions(resolveDeep(out.actions))
  if ('rightTemplate' in out) out.rightTemplate = toRender(out.rightTemplate)
  if ('leftTemplate' in out) out.leftTemplate = toRender(out.leftTemplate)
  if ('leftButton' in out) out.leftButton = normalizeLeftButton(resolveDeep(out.leftButton))
  return out
}

// ── Composable ───────────────────────────────────────────────────────────────
let ownerSeq = 0

/**
 * @param {object | (() => object) | import('vue').Ref<object>} [options]
 *   Declarative options (see top of file). Omit for imperative use only.
 */
export const useBreadCrumb = (options) => {
  const data = useState('breadcrumb', defaultState)

  const declarative = options !== undefined
  const ownerId = declarative ? `crumb_${++ownerSeq}` : undefined

  // ── Imperative API (unchanged names, plus normalisation) ───────────────────
  const set = (payload) => {
    data.value = { ...data.value, ...normalizeStatePatch(payload) }
  }

  const clear = () => {
    // A declarative instance keeps ownership so its next reactive update still applies.
    data.value = { ...defaultState(), ownerId }
  }

  const add = (state) => {
    data.value = { ...defaultState(), ...normalizeStatePatch(state) }
  }

  const setTitle = (title, description, icon) => {
    data.value.title = title
    data.value.description = description
    data.value.icon = icon
  }

  const setBreadcrumbs = (items) => {
    data.value.items = normalizeItems(resolveDeep(items))
  }
  const setItems = setBreadcrumbs

  /**
   * Enable the back button.
   * @param {() => void} [action]  callback; falls back to router.back()
   * @param {string}     [tooltip]
   */
  const setBack = (action, tooltip) => {
    data.value.hasBack = true
    data.value.fnBack = typeof action === 'function' ? action : undefined
    data.value.backTooltip = tooltip
  }

  /** Disables back AND clears the right side + left button (kept as before for old pages). */
  const clearBack = () => {
    data.value.hasBack = false
    data.value.fnBack = undefined
    data.value.backTooltip = undefined
    data.value.actions = []
    data.value.rightTemplate = undefined
    data.value.leftTemplate = undefined
    data.value.leftButton = undefined
  }

  const setActions = (actions) => {
    data.value.actions = normalizeActions(resolveDeep(actions))
  }
  const setHasAction = setActions // backward-compat alias

  /** @param {Function|object|null} component  functional component OR defineComponent object */
  const setRightTemplate = (component) => {
    data.value.rightTemplate = toRender(component)
  }

  /** @param {Function|object|null} component  functional component OR defineComponent object */
  const setLeftTemplate = (component) => {
    data.value.leftTemplate = toRender(component)
  }

  /** @param {{ icon?, label?, tooltip?, color?, variant?, size?, onClick?, render? }|null} config */
  const setLeftButton = (config) => {
    data.value.leftButton = normalizeLeftButton(resolveDeep(config))
  }

  // ── Declarative binding ────────────────────────────────────────────────────
  // Client only — see the note at the top of the file.
  if (declarative && !import.meta.server) {
    let first = true
    let declared = new Set()

    const commit = (resolved) => {
      const defaults = defaultState()
      let next

      if (first) {
        // A page is (re)declaring its bar: start from a clean slate and take ownership.
        next = defaults
        first = false
      } else {
        const current = data.value.ownerId
        if (current && current !== ownerId) return // another page owns the bar now
        next = { ...data.value }
      }

      // Options declared earlier but not now → back to defaults.
      for (const name of declared) {
        if (!(name in resolved)) next[stateKey(name)] = defaults[stateKey(name)]
      }
      for (const [name, value] of Object.entries(resolved)) {
        next[stateKey(name)] = value
      }

      next.ownerId = ownerId
      data.value = next
      declared = new Set(Object.keys(resolved))
    }

    watch(() => resolveOptions(options), commit, { immediate: true })

    // Leaving the page clears the bar — but only if no other page has taken it over meanwhile
    // (with page transitions the next page's setup() can run before this unmount).
    if (getCurrentScope()) {
      onScopeDispose(() => {
        if (data.value.ownerId === ownerId) data.value = defaultState()
      })
    }
  }

  return {
    data,
    add,
    set,
    clear,
    setTitle,
    setBreadcrumbs,
    setItems,
    setBack,
    clearBack,
    setActions,
    setHasAction,
    setRightTemplate,
    setLeftTemplate,
    setLeftButton,
  }
}