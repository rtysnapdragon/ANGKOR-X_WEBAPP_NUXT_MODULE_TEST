// composables/useToast.ts
import { ref } from 'vue'
import { useEventListener } from '@vueuse/core'

export type RToastType =
  | 'success'
  | 'error'
  | 'loading'
  | 'countdown'
  | 'progress'
  | 'multistep'
  | 'action'
  | 'gradient'
  | 'safety'
  | 'streaming'
  | 'pipeline'

export interface RToastAction {
  label: string
  icon?: string
  onClick?: () => void
}
export interface AlertToastOptions  {
  title: string
  message: string,
  description?: string
  action?: {
    label: string
    icon?: string
    onClick?: () => void
  }
  badges?: string[]
}
// Global state for premium toasts (rendered by RToast.vue)
export const premiumToastQueue = ref<(AlertToastOptions & { id: string })[]>([])

export interface RToastOptions {
  type?: RToastType

  title: string
  description?: string

  icon?: string
  color?: string

  duration?: number

  showProgress?: boolean

  progressPosition?: 'top' | 'bottom'

  progressColor?: string

  progress?: number

  countdown?: number

  streamText?: string

  badges?: string[]

  steps?: {
    label: string
    status: 'pending' | 'active' | 'done'
  }[]

  action?: RToastAction

  onAction?: () => void
}

export interface RToastItem extends RToastOptions {
  id: string

  createdAt: number

  startedAt: number

  remaining: number

  paused: boolean

  timeout?: ReturnType<typeof setTimeout>
}

export const toastQueue = ref<RToastItem[]>([])

function generateId() {
  return `toast-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
}

export function useRToast() {
  function startTimer(item: RToastItem) {
    if (!item.duration) return

    clearTimeout(item.timeout)

    item.startedAt = Date.now()

    item.timeout = setTimeout(() => {
      remove(item.id)
    }, item.remaining)
  }

  function add(options: RToastOptions) {
    const duration = options.duration ?? 5000

    const item: RToastItem = {
      id: generateId(),

      type: 'success',

      color: 'primary',

      showProgress: true,

      progressPosition: 'bottom',

      duration,

      createdAt: Date.now(),

      startedAt: Date.now(),

      remaining: duration,

      paused: false,

      ...options
    }

    toastQueue.value.push(item)

    if (duration > 0) {
      startTimer(item)
    }

    return item
  }

  function alert(options: AlertToastOptions) {
    const id = `alert-${Date.now()}-${Math.random().toString(36).slice(2)}`
    premiumToastQueue.value.push({ ...options, id })
    return { id }
  }

  function remove(id: string) {
    const index = toastQueue.value.findIndex(
      toast => toast.id === id
    )

    if (index === -1) return

    const item = toastQueue.value[index]

    if (item.timeout) {
      clearTimeout(item.timeout)
    }

    toastQueue.value.splice(index, 1)
  }

  function clear() {
    toastQueue.value.forEach(item => {
      if (item.timeout) {
        clearTimeout(item.timeout)
      }
    })

    toastQueue.value = []
  }

  function pause(id: string) {
    const item = toastQueue.value.find(
      toast => toast.id === id
    )

    if (!item) return

    if (item.paused) return

    item.paused = true

    clearTimeout(item.timeout)

    const elapsed =
      Date.now() - item.startedAt

    item.remaining = Math.max(
      0,
      item.remaining - elapsed
    )
  }

  function resume(id: string) {
    const item = toastQueue.value.find(
      toast => toast.id === id
    )

    if (!item) return

    if (!item.paused) return

    item.paused = false

    startTimer(item)
  }

  function getProgress(item: RToastItem) {
    if (!item.duration) return 100

    if (item.paused) {
      return (
        (item.remaining / item.duration) *
        100
      )
    }

    const elapsed =
      Date.now() - item.startedAt

    const remain = Math.max(
      0,
      item.remaining - elapsed
    )

    return (
      (remain / item.duration) *
      100
    )
  }

  useEventListener(
    document,
    'visibilitychange',
    () => {
      if (document.hidden) {
        toastQueue.value.forEach(item => {
          pause(item.id)
        })
      } else {
        toastQueue.value.forEach(item => {
          resume(item.id)
        })
      }
    }
  )

  return {
    add,
    alert,
    remove,
    clear,
    pause,
    resume,
    getProgress,
    toasts: toastQueue
  }
}

// const toast = useToast()

// // 1. Success
// toast.add({
//   type: 'success',
//   title: 'Operation Successful',
//   description: 'Your data has been saved.',
//   badges: ['Completed', 'Verified']
// })

// // 2. Error
// toast.add({
//   type: 'error',
//   title: 'Operation Failed',
//   description: 'Please check your connection.',
//   badges: ['Error 500', 'Critical']
// })

// // 3. Loading
// toast.add({
//   type: 'loading',
//   title: 'Processing...',
//   description: 'Please wait while we process your request.',
//   duration: 0
// })

// // 4. Countdown
// toast.add({
//   type: 'countdown',
//   title: 'Session Expiring',
//   description: 'Your session will expire soon.',
//   countdown: 30,
//   duration: 30000
// })

// // 5. Progress
// toast.add({
//   type: 'progress',
//   title: 'File Upload',
//   description: 'Uploading large file...',
//   progress: 73,
//   duration: 0
// })

// // 6. Multistep
// toast.add({
//   type: 'multistep',
//   title: 'Deployment Process',
//   steps: [
//     { label: 'Build', status: 'done' },
//     { label: 'Test', status: 'active' },
//     { label: 'Deploy', status: 'pending' },
//     { label: 'Verify', status: 'pending' }
//   ],
//   duration: 0
// })

// // 7. Action
// toast.add({
//   type: 'action',
//   title: 'Update Available',
//   description: 'A new version is ready to install.',
//   action: {
//     label: 'Update Now',
//     icon: 'ri-download-line',
//     onClick: () => console.log('Update clicked')
//   }
// })

// // 8. Gradient
// toast.add({
//   type: 'gradient',
//   title: '✨ Premium Feature',
//   description: 'You have unlocked a new feature!',
//   icon: 'ri-star-fill'
// })

// // 9. Safety
// toast.add({
//   type: 'safety',
//   title: 'Security Check Passed',
//   description: 'All systems are secure.',
//   badges: ['Secure', 'Encrypted']
// })

// // 10. Streaming
// toast.add({
//   type: 'streaming',
//   title: 'Live Data Stream',
//   streamText: 'Processing real-time data...',
//   duration: 0
// })

// // 11. Pipeline
// toast.add({
//   type: 'pipeline',
//   title: 'AI Pipeline Running',
//   description: 'Processing through pipeline stages',
//   duration: 0
// })