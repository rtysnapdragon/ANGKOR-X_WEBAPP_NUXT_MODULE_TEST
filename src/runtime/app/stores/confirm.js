import { defineStore, acceptHMRUpdate } from '#imports'

export const useConfirmStore = defineStore( 'ConfirmStore', {
    state: () => ({
      confirm: null,
      loading: false
    }),

    getters: {
      data: state => state.confirm
    },

    actions: {
      setLoading(loading) {
        this.loading = loading
      },

      hide() {
        this.confirm = null
        this.loading = false
      },

      /**
       * Show a confirm dialog.
       *
       * @param props.persistent {boolean} — when true, clicking the overlay does NOT close the dialog.
       *   Use when showing a confirm on top of a dirty form.
       *   Example: confirmStore.show({ type: 'delete', persistent: true, onConfirm: ... })
       */
      show(props) {
        this.confirm = {
          type: props.type ?? "confirm",
          color: 'primary',
          confirmText: 'Confirm',
          cancelText: 'Cancel',
          message: props.message ?? "",
          persistent: false,   // override with persistent: true to block overlay-click close
          ...props
        }
      },

      async confirmAction() {
        if (!this.confirm?.onConfirm)
          return this.hide()

        try {
          this.loading = true
          
          await this.confirm.onConfirm()

          await this.confirm.onCancel()
          this.hide()
        } catch (error) {
          this.loading = false
          throw error
        }
      }
    }
  }
)

if (import.meta.hot) {
  import.meta.hot.accept(
    acceptHMRUpdate(
      useConfirmStore,
      import.meta.hot
    )
  )
}