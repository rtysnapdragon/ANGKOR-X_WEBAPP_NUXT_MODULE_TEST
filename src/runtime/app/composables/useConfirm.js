// ------------------------------------------------------------
// useConfirm – wrapper around useConfirmStore.show(...)
// Returns a promise that resolves true when the user clicks OK,
// false when Cancel or the overlay is dismissed.
// ------------------------------------------------------------
import { ref, watch } from 'vue'
import { useConfirmStore } from '../stores/confirm'

export function useConfirm() {
  const store = useConfirmStore()
  let settled = false

  function confirmDestructive (options = {}) {
    return new Promise((resolve) => {
      // reset guard in case promise is reused
      settled = false

      const finish = (v) => {
        if (!settled) {
          settled = true
          resolve(v)
        }
      }

      const stop = watch(
        () => store.data,
        (data) => {
          if (!data && !settled) {
            settled = true
            resolve(false)
            stop()
          }
        },
        { immediate: true }
      )

      store.show({
        type: options.color === 'error' ? 'delete' : 'warning',
        title: options.title || 'Confirm',
        message: options.description || '',
        labelBtn: options.confirmLabel || 'OK',
        persistent: options.persistent ?? false,
        onConfirm: async () => {
          finish(true)
          stop()
        },
        onCancel: async () => {
          finish(false)
          stop()
        },
      })
    })
  }

  return { confirmDestructive }
}