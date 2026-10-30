/**
 * stores/dialog.js
 *
 * Global dialog store, the RDialog counterpart of stores/confirm.js.
 * Mount <RDialogHost /> once (app.vue or the layout); then from anywhere:
 *
 *   const dialog = useDialogStore()
 *
 *   // text dialog, promise style
 *   const { action } = await dialog.show({ title: 'Saved', message: 'All good.', tone: 'success' })
 *
 *   // any component inside a dialog (forms, pickers, ...)
 *   const res = await dialog.open(PageForm, { item }, { title: 'Edit page', size: 'lg' })
 *   if (res.action === 'confirm') reload(res.value)
 *
 * show() resolves ONCE, when the dialog closes:  { action: 'confirm' | 'cancel' | 'close', value }
 *
 * Options (all optional):
 *   title, description, message, icon, tone ('default'|'info'|'success'|'warning'|'danger'),
 *   size ('sm'|'md'|'lg'|'xl'|'full'), dismissible, persistent (= dismissible:false), showClose,
 *   confirmText, cancelText, confirmColor, confirmDisabled, cancelDisabled,
 *   closeOnConfirm (default true), ui,
 *   component + props      -> render a component in the body (it may emit close / confirm / loading)
 *   guard(close)           -> close interceptor, e.g. useFormGuard().requestClose
 *   onConfirm()            -> may be async; while it runs the dialog is locked (pending).
 *                             If it throws the dialog stays open and shows the error.
 *   onCancel(), onClose({ action, value }), onError(error)
 */
import { defineStore, acceptHMRUpdate } from '#imports'
import { markRaw } from 'vue'

const DEFAULTS = {
  tone: 'default',
  size: 'md',
  message: '',
  dismissible: true,
  showClose: true,
  confirmText: 'OK',
  cancelText: '',
  closeOnConfirm: true,
}

// Keep `undefined` from overriding a default (`{ ...DEFAULTS, ...{ size: undefined } }` would).
const clean = (o = {}) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined))

let seq = 0
// Promise resolvers live outside the state so the state stays plain data.
const resolvers = new Map()

function settle(id, result) {
  const resolve = resolvers.get(id)
  if (!resolve) return
  resolvers.delete(id)
  resolve(result)
}

export const useDialogStore = defineStore('DialogStore', {
  state: () => ({
    /** Open dialogs, oldest first. The last one is on top. */
    stack: [],
  }),

  getters: {
    current: (state) => state.stack.at(-1) ?? null,
    data() { return this.current },                       // parity with ConfirmStore.data
    isOpen: (state) => state.stack.some((d) => d.open),
  },

  actions: {
    /** Find by id, or the top-most open dialog when no id is given. */
    _find(id) {
      if (id == null) return [...this.stack].reverse().find((d) => d.open) ?? null
      return this.stack.find((d) => d.id === id) ?? null
    },

    show(options = {}) {
      const o = clean(options)
      const id = ++seq

      this.stack.push({
        ...DEFAULTS,
        ...o,
        id,
        // a body component usually brings its own buttons
        confirmText: o.confirmText ?? (o.component ? '' : DEFAULTS.confirmText),
        dismissible: o.persistent ? false : (o.dismissible ?? DEFAULTS.dismissible),
        component: o.component ? markRaw(o.component) : null,
        props: o.props ?? {},
        open: true,
        loading: false,
        error: '',
      })

      return new Promise((resolve) => resolvers.set(id, resolve))
    },

    /** Shortcut: render a component inside a dialog. */
    open(component, props = {}, options = {}) {
      return this.show({ ...options, component, props })
    },

    setLoading(loading, id) {
      const entry = this._find(id)
      if (entry) entry.loading = !!loading
    },

    update(id, patch = {}) {
      const entry = this._find(id)
      if (!entry) return
      const { id: _id, open: _open, ...rest } = clean(patch)
      Object.assign(entry, rest)
    },

    /** Confirm button: run onConfirm (locked while pending), then close. */
    async confirmAction(id, value) {
      const entry = this._find(id)
      if (!entry || !entry.open || entry.loading) return false

      if (entry.onConfirm) {
        entry.loading = true
        entry.error = ''
        try {
          await entry.onConfirm()
        } catch (error) {
          entry.loading = false
          entry.error = error?.message || String(error)
          entry.onError?.(error)
          return false                                    // stay open, keep the user's work
        }
        entry.loading = false
      }

      if (entry.closeOnConfirm === false) return true
      return this.close(entry.id, 'confirm', value)
    },

    /** Cancel button. */
    async cancelAction(id) {
      const entry = this._find(id)
      if (!entry || !entry.open || entry.loading) return false
      try { await entry.onCancel?.() } catch { /* a failing callback must not trap the dialog */ }
      return this.close(entry.id, 'cancel')
    },

    /** Close without confirming. Refused while a request is pending. */
    close(id, action = 'close', value) {
      const entry = this._find(id)
      if (!entry || !entry.open || entry.loading) return false

      entry.open = false                                  // host plays the leave animation…
      try { entry.onClose?.({ action, value }) } catch { /* ignore */ }
      settle(entry.id, { action, value })                 // …but callers are released right away
      return true
    },

    /** Called by the host after the leave animation: unmount the dialog. */
    remove(id) {
      const index = this.stack.findIndex((d) => d.id === id)
      if (index === -1 || this.stack[index].open) return
      this.stack.splice(index, 1)
      settle(id, { action: 'close', value: undefined })   // safety net
    },

    /** Close the top-most open dialog (parity with ConfirmStore.hide). */
    hide() {
      return this.close()
    },

    closeAll(action = 'close') {
      [...this.stack].reverse().forEach((d) => this.close(d.id, action))
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDialogStore, import.meta.hot))
}
