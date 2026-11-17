
import type { Component } from 'vue'

interface AppToastOptions {
  title?: string | Component
  description?: string | Component
  color?: 'primary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
  icon?: string
  duration?: number
  ui?: {
    root?: string
    wrapper?: string
    title?: string
    description?: string
    icon?: string
    close?: string
    [key: string]: string | undefined
  }
}

const defaultUI = {
  root: 'rounded-xl border border-default shadow-xl',
  wrapper: 'flex-1 min-w-0',
  title: 'font-semibold text-highlighted',
  description: 'text-sm text-muted',
  icon: 'size-5 shrink-0',
  close: 'rounded-md',
}

export const useToastApp = () => {
  const toast = useToast()

  const add = (options: AppToastOptions) => {
    return toast.add({
      ...options,
      ui: {
        ...defaultUI,
        ...options.ui,
      },
    })
  }

  return {
    add,
    update: toast.update,
    remove: toast.remove,
    clear: toast.clear,
  }
}
