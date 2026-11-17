
import type { Component } from 'vue'

interface AppToastOptions {
  title?: string | Component
  description?: string | Component
  color?: 'primary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
  icon?: string
  duration?: number
  ui?: Record<string, string>
  [key: string]: any
}

export const useToast = () => {
  const toast = useToast()

  const defaultUI = {
    root: 'rounded-xl border border-default shadow-xl',
    title: 'font-semibold text-highlighted',
    description: 'text-sm text-muted',
    icon: 'size-5'
  }

  return {
    ...toast,

    add(options: AppToastOptions) {
      return toast.add({
        ...options,
        ui: {
          ...defaultUI,
          ...options.ui
        }
      })
    }
  }
}
