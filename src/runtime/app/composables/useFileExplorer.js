import { computed, ref } from 'vue'
import { useHttp } from './https'
import useOptions from './useOptions'

export const FILE_EXPLORER_ENDPOINTS = {
  providersList: 'api/v1/file_explorer/providers/list',
  providersSummary: 'api/v1/file_explorer/providers/summary',
  storageRead: 'api/v1/file_explorer/storage/read',
  objectsList: 'api/v1/file_explorer/objects/list',
  foldersList: 'api/v1/file_explorer/folders/list',
  foldersRead: 'api/v1/file_explorer/folders/read',
  foldersCreate: 'api/v1/file_explorer/folders/create',
  foldersUpdate: 'api/v1/file_explorer/folders/update',
  foldersAssign: 'api/v1/file_explorer/folders/assign',
  foldersDelete: 'api/v1/file_explorer/folders/delete',
  filesList: 'api/v1/file_explorer/files/list',
  filesUpload: 'api/v1/file_explorer/files/upload',
  filesRead: 'api/v1/file_explorer/files/read',
  filesUpdate: 'api/v1/file_explorer/files/update',
  filesAssign: 'api/v1/file_explorer/files/assign',
  filesRestore: 'api/v1/file_explorer/files/restore',
  filesDownload: 'api/v1/file_explorer/files/download',
  filesDelete: 'api/v1/file_explorer/files/delete',
  googleList: 'api/v1/file_explorer/google/list',
  googleFoldersCreate: 'api/v1/file_explorer/google/folders/create',
  googleFilesRead: 'api/v1/file_explorer/google/files/read',
  googleFilesDelete: 'api/v1/file_explorer/google/files/delete',
  googleSummary: 'api/v1/file_explorer/google/summary',
}

export const FILE_KINDS = ['image', 'video', 'audio', 'file']

const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'avif', 'bmp', 'tiff', 'tif', 'ico']
const VIDEO_EXT = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'm4v']
const AUDIO_EXT = ['mp3', 'wav', 'ogg', 'oga', 'flac', 'm4a', 'aac']
const DOC_EXT = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'odt', 'ods', 'odp', 'rtf', 'md', 'json', 'xml']

export function extOf(name) {
  const value = String(name ?? '')
  const dot = value.lastIndexOf('.')
  return dot > -1 ? value.slice(dot + 1).toLowerCase() : ''
}

export function kindOfExplorerFile(file) {
  const mime = String(file?.MimeType ?? file?.mimeType ?? '').toLowerCase()
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'
  const ext = extOf(file?.Name ?? file?.name)
  if (IMAGE_EXT.includes(ext)) return 'image'
  if (VIDEO_EXT.includes(ext)) return 'video'
  if (AUDIO_EXT.includes(ext)) return 'audio'
  return 'file'
}

export function isExplorerDocument(file) {
  const ext = extOf(file?.Name ?? file?.name)
  return DOC_EXT.includes(ext) || String(file?.MimeType ?? '').toLowerCase().startsWith('text/')
}

export function isExplorerImage(file) {
  return kindOfExplorerFile(file) === 'image'
}

export function formatBytes(bytes) {
  const value = Number(bytes)
  if (!Number.isFinite(value) || value < 0) return ''
  if (value < 1024) return `${value} B`
  const units = ['KB', 'MB', 'GB', 'TB']
  let size = value / 1024
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit += 1
  }
  return `${size >= 10 ? Math.round(size) : size.toFixed(1)} ${units[unit]}`
}

export function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
  }
  catch {
    return date.toLocaleDateString()
  }
}

function messageOf(error) {
  if (!error) return ''
  if (typeof error === 'string') return error
  return error.Message ?? error.message ?? error.Detail ?? error.detail ?? 'Request failed'
}

async function post(url, body = {}) {
  const { data, error } = await useHttp(url, { method: 'POST', body })
  if (error?.value) throw new Error(messageOf(error.value))
  return data?.value
}

function queryFor(ids) {
  const list = (Array.isArray(ids) ? ids : [ids]).filter(id => id != null)
  return list.length === 1 ? `?Id=${encodeURIComponent(list[0])}` : `?Ids=${list.map(encodeURIComponent).join(',')}`
}

export function useFileExplorer(options = {}) {
  const provider = ref(options.provider || 'telegram')
  const currentFolderId = ref(options.folderId ?? null)
  const breadcrumb = ref([{ id: null, name: options.rootLabel || 'All files' }])
  const category = ref(options.category || 'all')
  const query = ref('')
  const allFiles = ref([])
  const allFolders = ref([])
  const providers = ref([])
  const loading = ref(false)
  const loadingMore = ref(false)
  const uploading = ref(false)
  const error = ref('')
  const page = ref(1)
  const pageSize = ref(100)
  const folderPage = ref(1)
  const folderPageSize = ref(200)
  const totalFiles = ref(0)
  const totalFolders = ref(0)

  const uploadConfig = (() => {
    try {
      return useOptions(FILE_EXPLORER_ENDPOINTS.filesUpload, { method: 'POST', body: new FormData() })
    }
    catch {
      return null
    }
  })()
  const downloadConfig = (() => {
    try {
      return useOptions(FILE_EXPLORER_ENDPOINTS.filesDownload, { method: 'POST', body: {} })
    }
    catch {
      return null
    }
  })()

  const hasMoreFiles = computed(() => allFiles.value.length < totalFiles.value)
  const hasMoreFolders = computed(() => allFolders.value.length < totalFolders.value)
  const hasMore = computed(() => hasMoreFiles.value || hasMoreFolders.value)
  const currentFolder = computed(() => {
    const id = currentFolderId.value
    if (id == null) return null
    return allFolders.value.find(folder => folder.Id === id) ?? null
  })

  const activeFiles = computed(() => {
    const current = currentFolderId.value
    const search = query.value.trim().toLowerCase()
    let list = allFiles.value.slice()
    if (category.value === 'trash') list = list.filter(file => !!file.DeletedAt)
    else list = list.filter(file => !file.DeletedAt)

    if (category.value === 'all') {
      list = list.filter(file => (file.FolderId ?? null) === (current ?? null))
    }
    else if (category.value === 'images') {
      list = list.filter(isExplorerImage)
    }
    else if (category.value === 'documents') {
      list = list.filter(file => isExplorerDocument(file) && !isExplorerImage(file))
    }
    else if (category.value === 'files') {
      list = list.filter(file => !isExplorerImage(file) && !isExplorerDocument(file))
    }

    if (search) list = list.filter(file => String(file.Name ?? '').toLowerCase().includes(search))
    if (category.value === 'recent') {
      list.sort((a, b) => new Date(b.CreatedAt ?? 0).getTime() - new Date(a.CreatedAt ?? 0).getTime())
    }
    else {
      list.sort((a, b) => String(a.Name ?? '').localeCompare(String(b.Name ?? '')))
    }
    return list
  })

  const activeFolders = computed(() => {
    if (category.value !== 'all') return []
    const current = currentFolderId.value
    const search = query.value.trim().toLowerCase()
    let list = allFolders.value.filter(folder => (folder.ParentId ?? null) === (current ?? null))
    if (search) list = list.filter(folder => String(folder.Name ?? '').toLowerCase().includes(search))
    return list.slice().sort((a, b) => String(a.Name ?? '').localeCompare(String(b.Name ?? '')))
  })

  const counts = computed(() => {
    const live = allFiles.value.filter(file => !file.DeletedAt)
    return {
      all: live.length,
      images: live.filter(isExplorerImage).length,
      documents: live.filter(file => isExplorerDocument(file) && !isExplorerImage(file)).length,
      files: live.filter(file => !isExplorerImage(file) && !isExplorerDocument(file)).length,
      recent: live.length,
      trash: allFiles.value.filter(file => !!file.DeletedAt).length,
    }
  })

  async function loadProviders() {
    try {
      const result = await post(FILE_EXPLORER_ENDPOINTS.providersList, { Action: 'list', IncludeStorage: true })
      providers.value = Array.isArray(result) ? result : []
      if (!options.provider) {
        const preferred = providers.value.find(item => item.IsConfigured && item.Connected)
          ?? providers.value.find(item => item.IsConfigured)
        if (preferred?.Code) provider.value = preferred.Code
      }
    }
    catch (e) {
      error.value = e.message
    }
  }

  function fetchFolders(targetPage, replace) {
    return post(FILE_EXPLORER_ENDPOINTS.foldersList, {
      Page: targetPage,
      PageSize: folderPageSize.value,
      OrderBy: 'Name',
      OrderDir: 'asc',
    }).then((result) => {
      const list = Array.isArray(result) ? result : []
      allFolders.value = replace ? list : [...allFolders.value, ...list]
      totalFolders.value = list[0]?.TotalRecord ?? allFolders.value.length
    })
  }

  function fetchFiles(targetPage, replace) {
    return post(FILE_EXPLORER_ENDPOINTS.filesList, {
      Page: targetPage,
      PageSize: pageSize.value,
      OrderBy: 'CreatedAt',
      OrderDir: 'desc',
      IncludeDeleted: true,
    }).then((result) => {
      const list = Array.isArray(result) ? result : []
      allFiles.value = replace ? list : [...allFiles.value, ...list]
      totalFiles.value = list[0]?.TotalRecord ?? allFiles.value.length
    })
  }

  async function loadLibrary({ reset = false } = {}) {
    if (reset) {
      page.value = 1
      folderPage.value = 1
      allFiles.value = []
      allFolders.value = []
      totalFiles.value = 0
      totalFolders.value = 0
    }
    const first = reset || !allFiles.value.length
    if (first) loading.value = true
    else loadingMore.value = true
    error.value = ''
    try {
      const tasks = []
      if (reset || !allFolders.value.length) {
        tasks.push(fetchFolders(folderPage.value, true))
      }
      tasks.push(fetchFiles(page.value, reset))
      await Promise.all(tasks)
    }
    catch (e) {
      error.value = e.message
    }
    finally {
      loading.value = false
      loadingMore.value = false
    }
  }

  async function loadMore() {
    if (loading.value || loadingMore.value || !hasMore.value) return
    loadingMore.value = true
    error.value = ''
    try {
      const tasks = []
      if (hasMoreFiles.value) {
        page.value += 1
        tasks.push(fetchFiles(page.value, false))
      }
      if (hasMoreFolders.value) {
        folderPage.value += 1
        tasks.push(fetchFolders(folderPage.value, false))
      }
      await Promise.all(tasks)
    }
    catch (e) {
      error.value = e.message
    }
    finally {
      loadingMore.value = false
    }
  }

  function refresh() {
    return loadLibrary({ reset: true })
  }

  function openFolder(folder) {
    if (!folder) return
    category.value = 'all'
    query.value = ''
    currentFolderId.value = folder.Id
    breadcrumb.value = [...breadcrumb.value, { id: folder.Id, name: folder.Name }]
  }

  function goToBreadcrumb(index) {
    const target = breadcrumb.value[index]
    if (!target) return
    breadcrumb.value = breadcrumb.value.slice(0, index + 1)
    currentFolderId.value = target.id
    category.value = 'all'
    query.value = ''
  }

  function goRoot() {
    breadcrumb.value = [{ id: null, name: breadcrumb.value[0]?.name || 'All files' }]
    currentFolderId.value = null
    category.value = 'all'
    query.value = ''
  }

  function setCategory(value) {
    category.value = value
    query.value = ''
    if (value === 'all') {
      breadcrumb.value = breadcrumb.value.slice(0, 1)
      currentFolderId.value = null
    }
  }

  async function createFolder({ name, parentId = currentFolderId.value, description = '' }) {
    const result = await post(FILE_EXPLORER_ENDPOINTS.foldersCreate, {
      Name: name,
      ParentId: parentId ?? null,
      Description: description || null,
    })
    await refresh()
    return result
  }

  async function updateFolder({ id, name, parentId, description }) {
    const body = { Id: id }
    if (name !== undefined) body.Name = name
    if (parentId !== undefined) body.ParentId = parentId
    if (description !== undefined) body.Description = description
    const result = await post(FILE_EXPLORER_ENDPOINTS.foldersUpdate, body)
    await refresh()
    return result
  }

  async function deleteFolders(ids) {
    const { data, error: err } = await useHttp(
      `${FILE_EXPLORER_ENDPOINTS.foldersDelete}${queryFor(ids)}`,
      { method: 'GET' },
    )
    if (err?.value) throw new Error(messageOf(err.value))
    await refresh()
    return data?.value
  }

  async function assignFolder({ id, parentId }) {
    const result = await post(FILE_EXPLORER_ENDPOINTS.foldersAssign, { Id: id, ParentId: parentId })
    await refresh()
    return result
  }

  async function updateFile({ id, name, folderId, isPublic }) {
    const body = { Id: id }
    if (name !== undefined) body.Name = name
    if (folderId !== undefined) body.FolderId = folderId
    if (isPublic !== undefined) body.IsPublic = isPublic
    const result = await post(FILE_EXPLORER_ENDPOINTS.filesUpdate, body)
    await refresh()
    return result
  }

  async function assignFile({ id, folderId }) {
    const result = await post(FILE_EXPLORER_ENDPOINTS.filesAssign, { Id: id, FolderId: folderId })
    await refresh()
    return result
  }

  async function deleteFiles(ids, purge = false) {
    const suffix = purge ? '&Purge=true' : ''
    const { data, error: err } = await useHttp(
      `${FILE_EXPLORER_ENDPOINTS.filesDelete}${queryFor(ids)}${suffix}`,
      { method: 'GET' },
    )
    if (err?.value) throw new Error(messageOf(err.value))
    await refresh()
    return data?.value
  }

  async function restoreFiles(ids) {
    const list = Array.isArray(ids) ? ids : [ids]
    for (const id of list) {
      await post(FILE_EXPLORER_ENDPOINTS.filesRestore, { Id: id })
    }
    await refresh()
  }

  function uploadFile(file, uploadOptions = {}) {
    return new Promise((resolve, reject) => {
      if (!uploadConfig?.url) {
        reject(new Error('Upload endpoint is unavailable'))
        return
      }
      const form = new FormData()
      form.append('File', file, file.name)
      form.append('Provider', uploadOptions.provider || provider.value)
      if (uploadOptions.folderId != null) form.append('FolderId', String(uploadOptions.folderId))
      form.append('MakePublic', String(uploadOptions.makePublic !== false))

      const xhr = new XMLHttpRequest()
      xhr.open('POST', uploadConfig.url, true)
      Object.entries(uploadConfig.options?.headers ?? {}).forEach(([key, value]) => {
        if (value != null && value !== '') xhr.setRequestHeader(key, value)
      })
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && typeof uploadOptions.onProgress === 'function') {
          uploadOptions.onProgress(event.loaded / event.total)
        }
      }
      xhr.onload = () => {
        let payload
        try {
          payload = JSON.parse(xhr.responseText)
        }
        catch {
          payload = null
        }
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(payload)
        }
        else {
          reject(new Error(messageOf(payload) || `Upload failed (${xhr.status})`))
        }
      }
      xhr.onerror = () => reject(new Error('Upload failed'))
      xhr.onabort = () => reject(new Error('Upload cancelled'))
      xhr.send(form)
    })
  }

  async function uploadFiles(fileList, uploadOptions = {}) {
    const list = Array.from(fileList ?? []).filter(Boolean)
    const results = []
    uploading.value = true
    try {
      for (let index = 0; index < list.length; index += 1) {
        const file = list[index]
        const result = await uploadFile(file, {
          ...uploadOptions,
          onProgress: (progress) => {
            const overall = (index + progress) / list.length
            if (typeof uploadOptions.onProgress === 'function') uploadOptions.onProgress(overall, file, index)
          },
        })
        results.push(result)
      }
      await refresh()
      return results
    }
    finally {
      uploading.value = false
    }
  }

  async function downloadFile(file) {
    if (!downloadConfig?.url) throw new Error('Download endpoint is unavailable')
    const response = await fetch(downloadConfig.url, {
      method: 'POST',
      headers: {
        ...(downloadConfig.options?.headers ?? {}),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Id: file.Id }),
    })
    if (!response.ok) {
      let payload
      try {
        payload = await response.json()
      }
      catch {
        payload = null
      }
      throw new Error(messageOf(payload) || `Download failed (${response.status})`)
    }
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = file.Name || 'download'
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return {
    provider,
    providers,
    currentFolderId,
    currentFolder,
    breadcrumb,
    category,
    query,
    allFiles,
    allFolders,
    activeFiles,
    activeFolders,
    counts,
    loading,
    loadingMore,
    uploading,
    error,
    page,
    pageSize,
    totalFiles,
    totalFolders,
    hasMore,
    hasMoreFiles,
    hasMoreFolders,
    loadProviders,
    loadLibrary,
    loadMore,
    refresh,
    openFolder,
    goToBreadcrumb,
    goRoot,
    setCategory,
    createFolder,
    updateFolder,
    deleteFolders,
    assignFolder,
    updateFile,
    assignFile,
    deleteFiles,
    restoreFiles,
    uploadFile,
    uploadFiles,
    downloadFile,
  }
}
