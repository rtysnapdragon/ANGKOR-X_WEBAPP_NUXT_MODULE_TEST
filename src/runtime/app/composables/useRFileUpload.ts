import { ref, reactive, computed, type Ref } from 'vue'

/**
 * useRFileUpload
 * ---------------------------------------------------------------
 * Drives per-file upload progress, error/retry state, and
 * dimension/size/count validation for RFileUpload.
 *
 * This composable does NOT perform the actual network request —
 * you provide an `uploadHandler` (e.g. axios/useHttp call) and
 * this composable wraps it with progress tracking + retry plumbing.
 * ---------------------------------------------------------------
 */

export type RFileStatus = 'idle' | 'uploading' | 'success' | 'error'

export interface RFileEntry {
  /** Stable id — not File.name, since duplicate names are allowed */
  id: string
  file: File
  status: RFileStatus
  /** 0–100 */
  progress: number
  error?: string
  /** Object URL for image preview, revoked on cleanup */
  previewUrl?: string
}

export interface RFileUploadLimits {
  /** Max size per file, in bytes */
  maxSize?: number
  /** Max number of files total (existing + new) */
  maxFiles?: number
  /** Minimum image width/height in px (images only) */
  minDimensions?: { width: number; height: number }
  /** Maximum image width/height in px (images only) */
  maxDimensions?: { width: number; height: number }
  /** Comma-separated accept list, same semantics as native input accept */
  accept?: string
}

export interface RUploadHandlerArgs {
  file: File
  onProgress: (percent: number) => void
  signal: AbortSignal
}

export type RUploadHandler = (args: RUploadHandlerArgs) => Promise<void>

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function isImage(file: File) {
  return file.type.startsWith('image/')
}

function readImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  if (!isImage(file)) return Promise.resolve(null)
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(url)
    }
    img.onerror = () => {
      resolve(null)
      URL.revokeObjectURL(url)
    }
    img.src = url
  })
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function useRFileUpload(options: {
  limits?: RFileUploadLimits
  uploadHandler?: RUploadHandler
  /** Called whenever a file is rejected by validation (size/dimensions/count) */
  onWarning?: (message: string, file?: File) => void
} = {}) {
  const { limits = {}, uploadHandler, onWarning } = options

  const entries: Ref<RFileEntry[]> = ref([])
  const controllers = new Map<string, AbortController>()

  const isUploading = computed(() => entries.value.some(e => e.status === 'uploading'))
  const hasErrors = computed(() => entries.value.some(e => e.status === 'error'))
  const erroredEntries = computed(() => entries.value.filter(e => e.status === 'error'))
  const successCount = computed(() => entries.value.filter(e => e.status === 'success').length)
  const totalCount = computed(() => entries.value.length)

  function warn(message: string, file?: File) {
    onWarning?.(message, file)
  }

  /** Validate size + accept synchronously; dimensions async. Returns error string or null. */
  async function validateFile(file: File): Promise<string | null> {
    if (limits.maxSize && file.size > limits.maxSize) {
      return `"${file.name}" exceeds the ${formatBytes(limits.maxSize)} size limit.`
    }

    if (limits.accept && limits.accept !== '*') {
      const accepted = limits.accept.split(',').map(s => s.trim().toLowerCase())
      const matches = accepted.some((pattern) => {
        if (pattern.startsWith('.')) return file.name.toLowerCase().endsWith(pattern)
        if (pattern.endsWith('/*')) return file.type.startsWith(pattern.replace('/*', '/'))
        return file.type.toLowerCase() === pattern
      })
      if (!matches) {
        return `"${file.name}" is not an accepted file type.`
      }
    }

    if (limits.minDimensions || limits.maxDimensions) {
      const dims = await readImageDimensions(file)
      if (dims) {
        const { width, height } = dims
        if (limits.minDimensions && (width < limits.minDimensions.width || height < limits.minDimensions.height)) {
          return `"${file.name}" is smaller than the minimum ${limits.minDimensions.width}x${limits.minDimensions.height}px.`
        }
        if (limits.maxDimensions && (width > limits.maxDimensions.width || height > limits.maxDimensions.height)) {
          return `"${file.name}" exceeds the maximum ${limits.maxDimensions.width}x${limits.maxDimensions.height}px.`
        }
      }
    }

    return null
  }

  /** Add new files (post drop/select). Runs validation, builds previews, kicks off upload if handler present. */
  async function addFiles(files: File[] | FileList | null | undefined) {
    if (!files) return
    const incoming = Array.from(files)
    if (!incoming.length) return

    if (limits.maxFiles) {
      const room = limits.maxFiles - entries.value.length
      if (room <= 0) {
        warn(`You can upload a maximum of ${limits.maxFiles} file${limits.maxFiles === 1 ? '' : 's'}.`)
        return
      }
      if (incoming.length > room) {
        warn(`Only ${room} more file${room === 1 ? '' : 's'} can be added (limit ${limits.maxFiles}).`)
        incoming.splice(room)
      }
    }

    for (const file of incoming) {
      const error = await validateFile(file)
      if (error) {
        warn(error, file)
        continue
      }

      const entry: RFileEntry = reactive({
        id: uid(),
        file,
        status: 'idle',
        progress: 0,
        previewUrl: isImage(file) ? URL.createObjectURL(file) : undefined
      })
      entries.value.push(entry)

      if (uploadHandler) {
        startUpload(entry)
      } else {
        entry.status = 'success'
        entry.progress = 100
      }
    }
  }

  function startUpload(entry: RFileEntry) {
    if (!uploadHandler) return
    entry.status = 'uploading'
    entry.progress = 0
    entry.error = undefined

    const controller = new AbortController()
    controllers.set(entry.id, controller)

    uploadHandler({
      file: entry.file,
      signal: controller.signal,
      onProgress: (percent: number) => {
        entry.progress = Math.max(0, Math.min(100, percent))
      }
    })
      .then(() => {
        entry.status = 'success'
        entry.progress = 100
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        entry.status = 'error'
        entry.error = err instanceof Error ? err.message : 'Upload failed. Please try again.'
      })
      .finally(() => {
        controllers.delete(entry.id)
      })
  }

  /** Retry a single failed file */
  function retryFile(id: string) {
    const entry = entries.value.find(e => e.id === id)
    if (!entry || entry.status !== 'error') return
    startUpload(entry)
  }

  /** Retry every failed file */
  function retryAll() {
    erroredEntries.value.forEach(e => startUpload(e))
  }

  /** Remove a single file by id; aborts in-flight upload if needed */
  function removeFile(id: string) {
    const idx = entries.value.findIndex(e => e.id === id)
    if (idx === -1) return
    const entry = entries.value[idx]
    controllers.get(entry.id)?.abort()
    controllers.delete(entry.id)
    if (entry.previewUrl) URL.revokeObjectURL(entry.previewUrl)
    entries.value.splice(idx, 1)
  }

  /** Remove all files; aborts any in-flight uploads */
  function removeAll() {
    controllers.forEach(c => c.abort())
    controllers.clear()
    entries.value.forEach((e) => {
      if (e.previewUrl) URL.revokeObjectURL(e.previewUrl)
    })
    entries.value = []
  }

  function reset() {
    removeAll()
  }

  return {
    entries,
    isUploading,
    hasErrors,
    erroredEntries,
    successCount,
    totalCount,
    addFiles,
    retryFile,
    retryAll,
    removeFile,
    removeAll,
    reset,
    formatBytes
  }
}
