<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  extOf,
  formatBytes,
  formatDate,
  isExplorerDocument,
  isExplorerImage,
  kindOfExplorerFile,
  useFileExplorer,
} from '../../composables/useFileExplorer'
import RBtn from '../btn/RBtn.vue'
import RBtns from '../btn/RBtns.vue'
import RTblBtns from '../btn/RTblBtns.vue'
import FloatingInput from '../input/FloatingInput.vue'
import RInputTags from '../input/RInputTags.vue'
import RModal from '../RModal.vue'
import RPopover from '../RPopover.vue'
import RPopoverPanel from '../ui/RPopoverPanel.vue'
import RTabs from '../RTabs.vue'
import RTooltip from '../RTooltip.vue'

defineOptions({ name: 'RFileManagerContent' })

const props = defineProps({
  inline: { type: Boolean, default: false },
  multiple: { type: Boolean, default: false },
  accept: { type: String, default: '' },
  selectMode: { type: String, default: 'any' }, // any | image | video | audio | file | none
  provider: { type: String, default: '' },
  folderId: { type: Number, default: null },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  showClose: { type: Boolean, default: true },
  t: { type: Function, default: null },
})

const emit = defineEmits(['select', 'close', 'uploaded', 'deleted'])

let i18n = null
try {
  i18n = useI18n()
}
catch {
  i18n = null
}
const t = (key, fallback) => {
  try {
    if (typeof props.t === 'function') {
      const value = props.t(key, fallback)
      if (value) return value
    }
    if (i18n && typeof i18n.te === 'function' && i18n.te(key)) return i18n.t(key)
    if (i18n && typeof i18n.t === 'function') {
      const value = i18n.t(key)
      if (value && value !== key) return value
    }
  }
  catch { /* fall through */ }
  return fallback
}
const tr = (key, fallback) => t(key, fallback)

const explorer = useFileExplorer({
  provider: props.provider || undefined,
  folderId: props.folderId ?? null,
  rootLabel: tr('rfm_all_files', 'All files'),
})

const {
  provider: providerCode,
  providers,
  currentFolderId,
  breadcrumb,
  category,
  query,
  allFiles,
  activeFiles,
  activeFolders,
  counts,
  loading,
  loadingMore,
  uploading,
  error,
  hasMore,
  loadProviders,
  loadLibrary,
  loadMore,
  refresh,
  openFolder,
  goToBreadcrumb,
  createFolder,
  updateFolder,
  updateFile,
  deleteFolders,
  deleteFiles,
  restoreFiles,
  uploadFiles,
  downloadFile,
} = explorer

const viewMode = ref('grid')
const thumbSize = ref('medium')
const keepAspect = ref(true)
const sortBy = ref('uploaded')
const optionsMenuOpen = ref(false)
const filterMenuOpen = ref(false)
const selectedIds = ref([])
const selectedFolder = ref(null)
const activeFile = ref(null)
const detailsOpen = ref(false)
const detailsTab = ref('properties')
const previewOpen = ref(false)
const previewZoom = ref(1)
const searchOpen = ref(false)
const searchFocused = ref(false)
const searchInput = ref(null)
const uploadInput = ref(null)
const folderInput = ref(null)
const uploadMenuOpen = ref(false)
const uploads = ref([])
const customFields = reactive({})
const fileMeta = reactive({})
const searchFilters = reactive({
  category: 'any',
  tag: 'any',
  extension: 'any',
  kind: 'any',
  uploadDate: 'any',
  modifiedDate: 'any',
})
const toast = reactive({ visible: false, message: '', type: 'info' })
let toastTimer = null

const categories = ref([])
const categoryDialog = reactive({
  open: false,
  mode: 'create',
  id: '',
  name: '',
  extensions: [],
  private: false,
  error: '',
  saving: false,
})
const settingsTab = ref('categories')
const newFolder = reactive({ open: false, name: '', description: '', error: '', saving: false })
const renameDialog = reactive({ open: false, type: 'file', id: null, name: '', error: '', saving: false })
const confirmDialog = reactive({ open: false, title: '', body: '', busy: false, action: null })

const DEFAULT_CATEGORIES = [
  { id: 'images', name: 'Images', icon: 'i-lucide-image', extensions: ['jpeg', 'jpg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'svg', 'avif'], builtin: true, private: false },
  { id: 'documents', name: 'Documents', icon: 'i-lucide-file-text', extensions: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'odt', 'txt', 'csv', 'rtf'], builtin: true, private: false },
  { id: 'files', name: 'Files', icon: 'i-lucide-files', extensions: ['webm', 'mp4', 'flac', 'ogg', 'zip', 'gz', 'rar', '7z'], builtin: true, private: false },
]

const CATEGORY_EXTENSION_OPTIONS = [
  'mov', 'pdf', 'webm', 'mp4', 'mp3', 'flac', 'ogg', 'rar', 'zip', 'gz',
  'jpeg', 'jpg', 'png', 'gif', 'bmp', 'webp', 'tiff', 'svg', 'avif',
  'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'odt', 'txt', 'csv', 'rtf', '7z',
]

const builtinIds = ['all', 'images', 'documents', 'files', 'recent', 'trash']
const acceptList = computed(() => String(props.accept || '').split(',').map(item => item.trim().toLowerCase()).filter(Boolean))

const primaryCategories = computed(() => categories.value.filter(item => item.builtin && item.id !== 'files'))
const customCategories = computed(() => categories.value.filter(item => !item.builtin))
const activeCategory = computed(() => categories.value.find(item => item.id === category.value) ?? null)
const selectedFiles = computed(() => selectedIds.value.map(id => allFiles.value.find(file => file.Id === id)).filter(Boolean))
const primaryFile = computed(() => selectedFiles.value[0] ?? activeFile.value ?? null)
const activeProvider = computed(() => providers.value.find(item => item.Code === providerCode.value) ?? null)
const storage = computed(() => activeProvider.value?.Storage ?? null)
const storagePct = computed(() => {
  const item = storage.value
  if (!item) return null
  const total = Number(item.All)
  const used = Number(item.UsedStorage ?? item.Current)
  if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(used)) return null
  return Math.max(0, Math.min(100, Math.round((used / total) * 100)))
})
const storageLabel = computed(() => {
  const item = storage.value
  if (!item) return ''
  const used = Number(item.UsedStorage ?? item.Current)
  if (Number.isFinite(used) && Number.isFinite(Number(item.All))) return `${formatBytes(used)} / ${formatBytes(item.All)}`
  if (Number.isFinite(used)) return `${formatBytes(used)} used`
  return ''
})

const navCategories = computed(() => {
  const list = []
  list.push({ id: 'all', label: tr('rfm_all_files', 'All files'), icon: 'i-lucide-folder-open', count: counts.value.all })
  for (const item of primaryCategories.value) {
    list.push({ id: item.id, label: item.name, icon: item.icon || 'i-lucide-image', count: counts.value[item.id] })
  }
  for (const item of customCategories.value) {
    list.push({ id: item.id, label: item.name, icon: item.icon || 'i-lucide-folder', count: countCategory(item) })
  }
  list.push({ id: 'recent', label: tr('rfm_recent', 'Recent'), icon: 'i-lucide-history', count: counts.value.recent })
  list.push({ id: 'trash', label: tr('rfm_trash', 'Trash'), icon: 'i-lucide-trash-2', count: counts.value.trash })
  return list
})

const extensionOptions = computed(() => {
  const values = allFiles.value
    .map(file => extOf(file.Name))
    .filter(Boolean)
  return [...new Set(values)].sort((a, b) => a.localeCompare(b))
})

const selectedCategoryExtensions = computed(() =>
  Array.isArray(categoryDialog.extensions) ? categoryDialog.extensions : [],
)

const categoryExtensionChoices = computed(() => {
  const values = new Set([
    ...CATEGORY_EXTENSION_OPTIONS,
    ...extensionOptions.value,
    ...selectedCategoryExtensions.value,
  ])
  return [...values]
})

const categoryOptions = computed(() => categories.value.filter(item => item.id !== 'settings'))

const dateFilterOptions = computed(() => [
  { value: 'any', label: tr('rfm_any_time', 'Any time') },
  { value: '24h', label: tr('rfm_last_24h', 'Last 24 hours') },
  { value: '7d', label: tr('rfm_last_7d', 'Last 7 days') },
  { value: '30d', label: tr('rfm_last_30d', 'Last 30 days') },
  { value: '1y', label: tr('rfm_last_year', 'Last year') },
])

const mediaKindOptions = computed(() => [
  { value: 'any', label: tr('rfm_any_type', 'Any type') },
  { value: 'image', label: tr('rfm_images', 'Images') },
  { value: 'document', label: tr('rfm_documents', 'Documents') },
  { value: 'video', label: tr('rfm_videos', 'Video') },
  { value: 'audio', label: tr('rfm_audio', 'Audio') },
  { value: 'archive', label: tr('rfm_archives', 'Archives') },
])

const hasSearchFilters = computed(() => Object.values(searchFilters).some(value => value !== 'any'))

const detailTabs = computed(() => [
  { id: 'properties', label: tr('rfm_properties', 'Properties') },
  { id: 'versions', label: tr('rfm_versions', 'Versions') },
])

const folderFileCount = computed(() => {
  const folder = selectedFolder.value
  if (!folder) return 0
  return allFiles.value.filter(file => file.FolderId === folder.Id && !file.DeletedAt).length
})

const folderRecentFiles = computed(() => {
  const folder = selectedFolder.value
  if (!folder) return []
  return allFiles.value
    .filter(file => file.FolderId === folder.Id && !file.DeletedAt)
    .sort((a, b) => new Date(b.UpdatedAt || b.CreatedAt || 0).getTime() - new Date(a.UpdatedAt || a.CreatedAt || 0).getTime())
    .slice(0, 4)
})

const folderExtensions = computed(() => {
  const folder = selectedFolder.value
  if (!folder) return []
  const values = allFiles.value
    .filter(file => file.FolderId === folder.Id && !file.DeletedAt)
    .map(file => extOf(file.Name))
    .filter(Boolean)
  return [...new Set(values)].sort((a, b) => a.localeCompare(b))
})

const activeMeta = computed(() => {
  const file = primaryFile.value
  return file ? fileMeta[file.Id] ?? null : null
})

const allSelectedDeleted = computed(() => selectedFiles.value.length > 0 && selectedFiles.value.every(file => !!file.DeletedAt))

const fileActionItems = computed(() => {
  const items = []
  if (props.selectMode !== 'none' && !allSelectedDeleted.value) {
    items.push({
      type: 'view',
      variant: 'solid',
      size: 'xs',
      icon: 'i-lucide-check',
      label: tr('rfm_choose', 'Choose'),
      disabled: !canInsert.value,
      click: () => emitSelect(),
    })
  }
  if (selectedFiles.value.some(file => file.DeletedAt)) {
    items.push({
      type: 'view',
      variant: 'outline',
      size: 'xs',
      icon: 'i-lucide-rotate-ccw',
      label: tr('rfm_restore', 'Restore'),
      click: () => restoreSelected(),
    })
  }
  items.push({
    type: 'cancel',
    variant: 'outline',
    size: 'xs',
    icon: 'i-lucide-download',
    label: tr('rfm_download', 'Download'),
    click: () => downloadSelected(),
  })
  items.push({
    type: 'cancel',
    variant: 'outline',
    size: 'xs',
    icon: 'i-lucide-pencil',
    label: tr('rfm_rename', 'Rename'),
    disabled: selectedFiles.value.length !== 1,
    click: () => openRename(primaryFile.value, 'file'),
  })
  items.push({
    type: 'cancel',
    variant: 'outline',
    size: 'xs',
    icon: 'i-lucide-eye',
    label: tr('rfm_view', 'View'),
    disabled: selectedFiles.value.length !== 1 || !primaryFile.value?.Url,
    click: () => openPreview(primaryFile.value),
  })
  items.push({
    type: 'cancel',
    variant: 'outline',
    size: 'xs',
    icon: 'i-lucide-refresh-cw',
    label: tr('rfm_edit_overwrite', 'Edit overwrite'),
    disabled: true,
    click: () => {},
  })
  items.push({
    type: 'cancel',
    variant: 'outline',
    size: 'xs',
    icon: 'i-lucide-link',
    label: tr('rfm_copy_link', 'Copy link'),
    disabled: !primaryFile.value?.Url,
    click: () => copyUrl(primaryFile.value),
  })
  items.push({
    type: 'delete',
    variant: 'outline',
    size: 'xs',
    icon: 'i-lucide-trash-2',
    label: tr('rfm_delete', 'Delete'),
    click: () => askDeleteSelected(),
  })
  return items
})

const folderActionItems = computed(() => {
  if (!selectedFolder.value) return []
  return [
    {
      type: 'add',
      variant: 'outline',
      size: 'xs',
      icon: 'i-lucide-folder-plus',
      label: tr('rfm_add_folder', 'Add folder'),
      click: () => openNewFolder(),
    },
    {
      type: 'cancel',
      variant: 'outline',
      size: 'xs',
      icon: 'i-lucide-pencil',
      label: tr('rfm_rename', 'Rename'),
      click: () => openRename(selectedFolder.value, 'folder'),
    },
    {
      type: 'delete',
      variant: 'outline',
      size: 'xs',
      icon: 'i-lucide-trash-2',
      label: tr('rfm_delete', 'Delete'),
      click: () => askDeleteFolder(selectedFolder.value),
    },
    {
      type: 'cancel',
      variant: 'outline',
      size: 'xs',
      icon: 'i-lucide-folder-open',
      label: tr('rfm_open_folder', 'Open folder'),
      click: () => openSelectedFolder(),
    },
  ]
})

const displayFiles = computed(() => {
  const item = activeCategory.value
  let list = activeFiles.value.slice()

  if (item && !item.builtin) list = list.filter(file => item.extensions.includes(extOf(file.Name)))

  if (searchFilters.category !== 'any') {
    const filterCategory = categories.value.find(entry => entry.id === searchFilters.category)
    if (filterCategory) list = list.filter(file => filterCategory.extensions.includes(extOf(file.Name)))
  }
  if (searchFilters.extension !== 'any') list = list.filter(file => extOf(file.Name) === searchFilters.extension)
  if (searchFilters.kind !== 'any') list = list.filter(file => matchesKind(file, searchFilters.kind))
  if (searchFilters.uploadDate !== 'any') list = list.filter(file => withinDateRange(file.CreatedAt, searchFilters.uploadDate))
  if (searchFilters.modifiedDate !== 'any') list = list.filter(file => withinDateRange(file.UpdatedAt || file.CreatedAt, searchFilters.modifiedDate))

  if (sortBy.value === 'uploaded') {
    list.sort((a, b) => new Date(b.CreatedAt || 0).getTime() - new Date(a.CreatedAt || 0).getTime())
  }
  else if (sortBy.value === 'size') {
    list.sort((a, b) => Number(b.FileSize || 0) - Number(a.FileSize || 0))
  }
  else if (sortBy.value === 'type') {
    list.sort((a, b) => extOf(a.Name).localeCompare(extOf(b.Name)))
  }
  else {
    list.sort((a, b) => String(a.Name ?? '').localeCompare(String(b.Name ?? '')))
  }

  return list
})
const displayFolders = computed(() => activeFolders.value)

const viewTitle = computed(() => {
  if (query.value.trim()) return tr('rfm_search_results', 'Search results')
  if (category.value === 'all') {
    const current = breadcrumb.value[breadcrumb.value.length - 1]
    return current?.id == null ? tr('rfm_all_files', 'All files') : current.name
  }
  if (category.value === 'settings') return tr('rfm_settings', 'Settings')
  const item = navCategories.value.find(entry => entry.id === category.value)
  return item?.label ?? tr('rfm_files', 'Files')
})

const canInsert = computed(() => {
  if (props.selectMode === 'none') return false
  if (!selectedFiles.value.length) return false
  return selectedFiles.value.every(isSelectable)
})

const recentSearches = ref([])

function countCategory(item) {
  const extensions = item.extensions ?? []
  return allFiles.value.filter(file => !file.DeletedAt && extensions.includes(extOf(file.Name))).length
}

function loadCategories() {
  const fallback = DEFAULT_CATEGORIES.map(item => ({ ...item, extensions: [...item.extensions] }))
  if (typeof window === 'undefined') {
    categories.value = fallback
    return
  }
  try {
    const raw = window.localStorage.getItem('rfm_categories')
    const stored = raw ? JSON.parse(raw) : null
    if (Array.isArray(stored) && stored.length) {
      const merged = stored
        .filter(item => item && typeof item.id === 'string' && typeof item.name === 'string')
        .map(item => ({
          id: item.id,
          name: item.name,
          icon: item.icon || 'i-lucide-folder',
          extensions: Array.isArray(item.extensions) ? item.extensions.map(ext => String(ext).toLowerCase().replace(/^\./, '')) : [],
          builtin: builtinIds.includes(item.id),
          private: Boolean(item.private),
        }))
      for (const item of fallback) {
        if (!merged.some(entry => entry.id === item.id)) merged.unshift(item)
      }
      categories.value = merged
      return
    }
  }
  catch { /* ignore storage errors */ }
  categories.value = fallback
}

function saveCategories() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem('rfm_categories', JSON.stringify(categories.value))
  }
  catch { /* ignore storage errors */ }
}

function loadRecentSearches() {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem('rfm_recent_searches')
    const stored = raw ? JSON.parse(raw) : null
    if (Array.isArray(stored)) recentSearches.value = stored.filter(item => typeof item === 'string').slice(0, 6)
  }
  catch { /* ignore */ }
}

function saveRecentSearches() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem('rfm_recent_searches', JSON.stringify(recentSearches.value))
  }
  catch { /* ignore */ }
}

function showToast(message, type = 'info') {
  toast.message = message
  toast.type = type
  toast.visible = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.visible = false
  }, 3200)
}

function isSelectable(file) {
  if (!file || file.DeletedAt) return false
  if (props.selectMode && props.selectMode !== 'any' && kindOfExplorerFile(file) !== props.selectMode) return false
  const rules = acceptList.value
  if (!rules.length) return true
  const mime = String(file.MimeType ?? '').toLowerCase()
  const ext = extOf(file.Name)
  return rules.some((rule) => {
    if (rule === '*/*') return true
    if (rule.endsWith('/*')) return mime.startsWith(rule.slice(0, -1))
    if (rule.startsWith('.')) return ext === rule.slice(1)
    if (rule.includes('/')) return mime === rule
    return ext === rule
  })
}

function fileIcon(file) {
  const kind = kindOfExplorerFile(file)
  if (kind === 'image') return 'i-lucide-image'
  if (kind === 'video') return 'i-lucide-video'
  if (kind === 'audio') return 'i-lucide-music'
  if (isExplorerDocument(file)) return 'i-lucide-file-text'
  const ext = extOf(file?.Name)
  if (['zip', 'rar', '7z', 'gz', 'tar'].includes(ext)) return 'i-lucide-archive'
  return 'i-lucide-file'
}

function typeLabel(file) {
  const ext = extOf(file?.Name)
  if (ext) return ext.toUpperCase()
  return kindOfExplorerFile(file).toUpperCase()
}

function onThumbError(event) {
  const image = event?.target
  if (image) image.style.display = 'none'
}

function onImageMeta(event, file) {
  const image = event?.target
  if (!file || !image?.naturalWidth) return
  fileMeta[file.Id] = { width: image.naturalWidth, height: image.naturalHeight }
}

function matchesKind(file, kind) {
  if (kind === 'image') return isExplorerImage(file)
  if (kind === 'document') return isExplorerDocument(file)
  if (kind === 'video') return kindOfExplorerFile(file) === 'video'
  if (kind === 'audio') return kindOfExplorerFile(file) === 'audio'
  if (kind === 'archive') return ['zip', 'rar', '7z', 'gz', 'tar'].includes(extOf(file?.Name))
  return true
}

function withinDateRange(value, range) {
  if (range === 'any') return true
  const time = new Date(value || 0).getTime()
  if (!Number.isFinite(time) || time <= 0) return false
  const days = { '24h': 1, '7d': 7, '30d': 30, '1y': 365 }[range]
  if (!days) return true
  return Date.now() - time <= days * 86400000
}

function fileTags(file) {
  if (!file) return []
  const tags = [kindOfExplorerFile(file)]
  const ext = extOf(file.Name)
  if (ext) tags.push(ext)
  if (file.IsPublic) tags.push(tr('rfm_public', 'Public'))
  if (file.DeletedAt) tags.push(tr('rfm_deleted', 'Deleted'))
  return [...new Set(tags.filter(Boolean))]
}

function fileDescription(file) {
  return file?.Description || tr('rfm_no_description', 'No description generated yet.')
}

function fieldsFor(file) {
  if (!file) return []
  const id = file.Id
  if (!Array.isArray(customFields[id])) customFields[id] = []
  return customFields[id]
}

function addCustomField(file) {
  if (!file) return
  fieldsFor(file).push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, label: '', content: '' })
  saveCustomFields()
}

function removeCustomField(file, index) {
  if (!file) return
  fieldsFor(file).splice(index, 1)
  saveCustomFields()
}

function loadCustomFields() {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem('rfm_custom_fields')
    const stored = raw ? JSON.parse(raw) : null
    if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
      for (const [key, value] of Object.entries(stored)) {
        if (Array.isArray(value)) customFields[key] = value
      }
    }
  }
  catch { /* ignore storage errors */ }
}

function saveCustomFields() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem('rfm_custom_fields', JSON.stringify(customFields))
  }
  catch { /* ignore storage errors */ }
}

function clearSelection() {
  selectedIds.value = []
  selectedFolder.value = null
  activeFile.value = null
  detailsOpen.value = false
  previewOpen.value = false
}

function selectFolder(folder) {
  if (!folder) return
  selectedIds.value = []
  activeFile.value = null
  selectedFolder.value = folder
  detailsOpen.value = true
  detailsTab.value = 'properties'
  previewOpen.value = false
}

function openSelectedFolder() {
  const folder = selectedFolder.value
  if (!folder) return
  clearSelection()
  openFolder(folder)
}

function openPreview(file = primaryFile.value) {
  if (!file?.Url) {
    showToast(tr('rfm_preview_unavailable', 'Preview is not available for this file.'), 'error')
    return
  }
  activeFile.value = file
  previewOpen.value = true
  previewZoom.value = 1
  detailsOpen.value = true
}

function closePreview() {
  previewOpen.value = false
  previewZoom.value = 1
}

function zoomIn() {
  previewZoom.value = Math.min(3, Number((previewZoom.value + 0.25).toFixed(2)))
}

function zoomOut() {
  previewZoom.value = Math.max(0.5, Number((previewZoom.value - 0.25).toFixed(2)))
}

function resetZoom() {
  previewZoom.value = 1
}

function clearSearchFilters() {
  searchFilters.category = 'any'
  searchFilters.tag = 'any'
  searchFilters.extension = 'any'
  searchFilters.kind = 'any'
  searchFilters.uploadDate = 'any'
  searchFilters.modifiedDate = 'any'
}

function onThumbnailsToggle(event) {
  viewMode.value = event?.target?.checked ? 'grid' : 'list'
}

function rowActions(file) {
  return [
    { type: 'view', icon: 'view', label: tr('rfm_details', 'Details'), data: file },
    { type: 'download', icon: 'ri-download-2-line', label: tr('rfm_download', 'Download'), data: file },
    { type: 'delete', icon: 'delete', label: tr('rfm_delete', 'Delete'), color: 'red', data: file },
  ]
}

function onRowAction(_event, action) {
  const file = action?.data
  const type = action?.type
  if (!file) return
  if (type === 'view') openDetails(file)
  else if (type === 'download') download(file)
  else if (type === 'delete') askDeleteFile(file)
}

function selectCategory(value) {
  uploadMenuOpen.value = false
  clearSelection()
  if (value === 'settings') {
    category.value = 'settings'
    query.value = ''
    return
  }
  if (builtinIds.includes(value)) explorer.setCategory(value)
  else {
    category.value = value
    query.value = ''
  }
}

function toggleSelect(file) {
  if (!isSelectable(file)) {
    showToast(tr('rfm_file_not_allowed', 'This file type is not allowed here.'), 'error')
    return
  }
  selectedFolder.value = null
  previewOpen.value = false
  const index = selectedIds.value.indexOf(file.Id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
    if (activeFile.value?.Id === file.Id) activeFile.value = null
    if (!selectedIds.value.length) detailsOpen.value = false
    return
  }
  if (!props.multiple) selectedIds.value = []
  selectedIds.value.push(file.Id)
  activeFile.value = file
  detailsOpen.value = true
}

function onFileClick(file, event) {
  if (!isSelectable(file)) {
    showToast(tr('rfm_file_not_allowed', 'This file type is not allowed here.'), 'error')
    return
  }
  selectedFolder.value = null
  previewOpen.value = false
  if (props.multiple || event?.ctrlKey || event?.metaKey) {
    toggleSelect(file)
    return
  }
  selectedIds.value = [file.Id]
  activeFile.value = file
  detailsOpen.value = true
}

function onFileDoubleClick(file) {
  if (!isSelectable(file)) return
  if (props.multiple) {
    toggleSelect(file)
    return
  }
  selectedIds.value = [file.Id]
  activeFile.value = file
  emitSelect()
}

function emitSelect() {
  if (!canInsert.value) return
  const payload = props.multiple ? selectedFiles.value.slice() : primaryFile.value
  if (!payload) return
  emit('select', payload)
}

function openDetails(file) {
  selectedFolder.value = null
  activeFile.value = file
  detailsOpen.value = true
  detailsTab.value = 'properties'
}

function closeDetails() {
  detailsOpen.value = false
  previewOpen.value = false
}

function openSearch() {
  searchOpen.value = true
  nextTick(() => searchInput.value?.focus())
}

function closeSearch() {
  searchOpen.value = false
  searchFocused.value = false
  filterMenuOpen.value = false
  query.value = ''
}

function onSearchBlur() {
  searchFocused.value = false
}

function commitSearch() {
  const value = query.value.trim()
  if (!value) return
  recentSearches.value = [value, ...recentSearches.value.filter(item => item !== value)].slice(0, 6)
  saveRecentSearches()
}

function triggerUpload() {
  uploadMenuOpen.value = false
  uploadInput.value?.click()
}

function triggerFolderUpload() {
  uploadMenuOpen.value = false
  folderInput.value?.click()
}

async function uploadBatch(files) {
  const list = Array.from(files ?? []).filter(Boolean)
  if (!list.length) return
  const entries = list.map((file, index) => ({
    id: `${Date.now()}-${index}-${file.name}`,
    name: file.name,
    progress: 0,
    status: 'uploading',
    error: '',
  }))
  uploads.value.push(...entries)
  try {
    const results = await uploadFiles(list, {
      provider: providerCode.value,
      folderId: currentFolderId.value,
      makePublic: true,
      onProgress: (overall, _file, index) => {
        const entry = entries[index]
        if (entry) entry.progress = Math.max(0, Math.min(1, overall))
      },
    })
    entries.forEach((entry) => {
      entry.progress = 1
      entry.status = 'done'
    })
    emit('uploaded', results)
    showToast(tr('rfm_upload_complete', 'Upload complete.'), 'success')
    setTimeout(() => {
      uploads.value = uploads.value.filter(entry => !entries.includes(entry))
    }, 2200)
  }
  catch (err) {
    entries.forEach((entry) => {
      entry.status = 'error'
      entry.error = err.message
    })
    showToast(err.message || tr('rfm_upload_failed', 'Upload failed.'), 'error')
  }
}

function onUploadPicked(event) {
  const input = event?.target
  const files = Array.from(input?.files ?? [])
  if (input) input.value = ''
  uploadBatch(files)
}

function onFolderPicked(event) {
  const input = event?.target
  const files = Array.from(input?.files ?? [])
  if (input) input.value = ''
  uploadBatch(files)
}

function openNewFolder() {
  newFolder.open = true
  newFolder.name = ''
  newFolder.description = ''
  newFolder.error = ''
}

async function submitNewFolder() {
  const name = newFolder.name.trim()
  if (!name) {
    newFolder.error = tr('rfm_folder_name_required', 'Enter a folder name.')
    return
  }
  newFolder.saving = true
  newFolder.error = ''
  try {
    await createFolder({ name, parentId: currentFolderId.value, description: newFolder.description.trim() })
    if (category.value !== 'all') explorer.setCategory('all')
    newFolder.open = false
    showToast(tr('rfm_folder_created', 'Folder created.'), 'success')
  }
  catch (err) {
    newFolder.error = err.message
  }
  finally {
    newFolder.saving = false
  }
}

function openRename(item, type = 'file') {
  if (!item) return
  renameDialog.open = true
  renameDialog.type = type
  renameDialog.id = item.Id
  renameDialog.name = item.Name || ''
  renameDialog.error = ''
}

async function submitRename() {
  const name = renameDialog.name.trim()
  if (!name) {
    renameDialog.error = tr('rfm_name_required', 'Enter a name.')
    return
  }
  renameDialog.saving = true
  renameDialog.error = ''
  try {
    if (renameDialog.type === 'folder') await updateFolder({ id: renameDialog.id, name })
    else await updateFile({ id: renameDialog.id, name })
    if (activeFile.value?.Id === renameDialog.id) activeFile.value = { ...activeFile.value, Name: name }
    if (selectedFolder.value?.Id === renameDialog.id) selectedFolder.value = { ...selectedFolder.value, Name: name }
    renameDialog.open = false
    showToast(tr('rfm_renamed', 'Renamed.'), 'success')
  }
  catch (err) {
    renameDialog.error = err.message
  }
  finally {
    renameDialog.saving = false
  }
}

function askDeleteFile(file) {
  if (!file) return
  const permanent = !!file.DeletedAt
  confirmDialog.title = permanent
    ? tr('rfm_delete_forever_title', 'Delete permanently?')
    : tr('rfm_delete_title', 'Move to trash?')
  confirmDialog.body = permanent
    ? tr('rfm_delete_forever_body', 'This file will be permanently removed.')
    : tr('rfm_delete_body', 'This file will be moved to trash.')
  confirmDialog.action = async () => {
    await deleteFiles([file.Id], permanent)
    if (selectedIds.value.includes(file.Id)) selectedIds.value = selectedIds.value.filter(id => id !== file.Id)
    if (activeFile.value?.Id === file.Id) activeFile.value = null
    emit('deleted', [file.Id])
  }
  confirmDialog.open = true
}

function askDeleteFolder(folder) {
  if (!folder) return
  confirmDialog.title = tr('rfm_delete_folder_title', 'Delete folder?')
  confirmDialog.body = tr('rfm_delete_folder_body', 'Files inside will move back to the root level.')
  confirmDialog.action = async () => {
    await deleteFolders([folder.Id])
    if (selectedFolder.value?.Id === folder.Id) {
      selectedFolder.value = null
      detailsOpen.value = false
    }
    emit('deleted', [folder.Id])
  }
  confirmDialog.open = true
}

function askDeleteSelected() {
  const files = selectedFiles.value
  if (!files.length) return
  const permanent = files.every(file => !!file.DeletedAt)
  confirmDialog.title = permanent
    ? tr('rfm_delete_forever_title', 'Delete permanently?')
    : tr('rfm_delete_title', 'Move to trash?')
  confirmDialog.body = tr('rfm_delete_selected_body', 'The selected files will be removed.')
  confirmDialog.action = async () => {
    await deleteFiles(files.map(file => file.Id), permanent)
    emit('deleted', files.map(file => file.Id))
    clearSelection()
  }
  confirmDialog.open = true
}

async function confirmAction() {
  if (typeof confirmDialog.action !== 'function') return
  confirmDialog.busy = true
  try {
    await confirmDialog.action()
    confirmDialog.open = false
    showToast(tr('rfm_done', 'Done.'), 'success')
  }
  catch (err) {
    showToast(err.message || tr('rfm_action_failed', 'The action failed.'), 'error')
  }
  finally {
    confirmDialog.busy = false
  }
}

async function restoreSelected() {
  const ids = selectedFiles.value.filter(file => file.DeletedAt).map(file => file.Id)
  if (!ids.length) return
  try {
    await restoreFiles(ids)
    clearSelection()
    showToast(tr('rfm_restored', 'Restored.'), 'success')
  }
  catch (err) {
    showToast(err.message || tr('rfm_action_failed', 'The action failed.'), 'error')
  }
}

async function download(file) {
  if (!file) return
  try {
    await downloadFile(file)
  }
  catch (err) {
    showToast(err.message || tr('rfm_download_failed', 'Download failed.'), 'error')
  }
}

async function downloadSelected() {
  for (const file of selectedFiles.value) await download(file)
}

async function copyUrl(file) {
  if (!file?.Url) return
  try {
    await navigator.clipboard.writeText(file.Url)
    showToast(tr('rfm_link_copied', 'Link copied.'), 'success')
  }
  catch {
    showToast(tr('rfm_copy_failed', 'Could not copy the link.'), 'error')
  }
}

async function togglePublic(file) {
  if (!file) return
  try {
    await updateFile({ id: file.Id, isPublic: !file.IsPublic })
    if (activeFile.value?.Id === file.Id) activeFile.value = { ...activeFile.value, IsPublic: !file.IsPublic }
  }
  catch (err) {
    showToast(err.message || tr('rfm_action_failed', 'The action failed.'), 'error')
  }
}

function normalizeCategoryExtension(value) {
  return String(value ?? '').trim().toLowerCase().replace(/^\.+/, '').replace(/[^a-z0-9+]/g, '')
}

function updateCategoryExtensions(values) {
  categoryDialog.extensions = [...new Set((Array.isArray(values) ? values : [])
    .map(normalizeCategoryExtension)
    .filter(Boolean))]
  categoryDialog.error = ''
}

function openCategoryDialog(item = null) {
  categoryDialog.open = true
  categoryDialog.mode = item ? 'edit' : 'create'
  categoryDialog.id = item?.id ?? ''
  categoryDialog.name = item?.name ?? ''
  categoryDialog.extensions = Array.isArray(item?.extensions) ? [...item.extensions] : []
  categoryDialog.private = Boolean(item?.private)
  categoryDialog.error = ''
  categoryDialog.saving = false
}

function saveCategory() {
  const name = categoryDialog.name.trim()
  if (!name) {
    categoryDialog.error = tr('rfm_category_name_required', 'Enter a category name.')
    return
  }
  const extensions = [...new Set(selectedCategoryExtensions.value.map(normalizeCategoryExtension).filter(Boolean))]
  if (!extensions.length) {
    categoryDialog.error = tr('rfm_category_extensions_required', 'Add at least one allowed extension.')
    return
  }
  if (categoryDialog.mode === 'edit') {
    const item = categories.value.find(entry => entry.id === categoryDialog.id)
    if (item) {
      item.name = name
      item.extensions = extensions
      item.private = categoryDialog.private
    }
  }
  else {
    const id = `custom-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'category'}-${Date.now().toString(36)}`
    categories.value.push({
      id,
      name,
      icon: 'i-lucide-folder',
      extensions,
      builtin: false,
      private: categoryDialog.private,
    })
  }
  saveCategories()
  categoryDialog.open = false
  showToast(tr('rfm_category_saved', 'Category saved.'), 'success')
}

function deleteCategory(item) {
  if (!item || item.builtin) return
  confirmDialog.title = tr('rfm_delete_category_title', 'Delete category?')
  confirmDialog.body = tr('rfm_delete_category_body', 'The category will be removed. Files are not deleted.')
  confirmDialog.action = async () => {
    categories.value = categories.value.filter(entry => entry.id !== item.id)
    saveCategories()
    if (category.value === item.id) selectCategory('all')
  }
  confirmDialog.open = true
}

function removeUpload(entry) {
  uploads.value = uploads.value.filter(item => item !== entry)
}

function loadMoreItems() {
  loadMore()
}

let providersReady = false
onMounted(async () => {
  loadCategories()
  loadRecentSearches()
  loadCustomFields()
  await loadProviders()
  providersReady = true
  loadLibrary({ reset: true })
})

watch(providerCode, (value, previous) => {
  if (!providersReady || !value || value === previous) return
  currentFolderId.value = null
  breadcrumb.value = [{ id: null, name: tr('rfm_all_files', 'All files') }]
  loadLibrary({ reset: true })
})

watch(() => props.provider, (value) => {
  if (value) providerCode.value = value
})

watch(() => props.folderId, (value) => {
  if (value !== undefined) {
    currentFolderId.value = value ?? null
    breadcrumb.value = [{ id: value ?? null, name: tr('rfm_all_files', 'All files') }]
    refresh()
  }
})

watch([currentFolderId, category], () => {
  selectedFolder.value = null
})

watch(customFields, saveCustomFields, { deep: true })
</script>

<template>
  <div
    class="rfm"
    :class="{ 'rfm--inline': inline, 'rfm--details': detailsOpen && (primaryFile || selectedFolder) }"
  >
    <aside class="rfm__sidebar">
      <div class="rfm__brand">
        <span class="rfm__brand-mark"><UIcon name="i-lucide-folder-kanban" /></span>
        <span class="rfm__brand-text">
          <strong>{{ title || tr('rfm_title', 'File manager') }}</strong>
          <small>{{ description || tr('rfm_powered_by', 'Powered by Angkor-X') }}</small>
        </span>
      </div>

      <nav
        class="rfm__nav"
        :aria-label="tr('rfm_categories', 'Categories')"
      >
        <button
          v-for="item in navCategories"
          :key="item.id"
          type="button"
          class="rfm__nav-item"
          :class="{ 'is-active': category === item.id }"
          @click="selectCategory(item.id)"
        >
          <UIcon :name="item.icon" />
          <span>{{ item.label }}</span>
          <span
            v-if="item.count != null"
            class="rfm__nav-count"
          >{{ item.count }}</span>
        </button>
      </nav>

      <div class="rfm__sidebar-foot">
        <div
          v-if="activeProvider"
          class="rfm__storage"
        >
          <div class="rfm__storage-head">
            <span>{{ activeProvider.Name || activeProvider.Code }}</span>
            <span v-if="storagePct != null">{{ storagePct }}%</span>
          </div>
          <div
            v-if="storagePct != null"
            class="rfm__storage-bar"
          >
            <span :style="{ width: `${storagePct}%` }" />
          </div>
          <small v-if="storageLabel">{{ storageLabel }}</small>
        </div>
        <button
          type="button"
          class="rfm__nav-item"
          :class="{ 'is-active': category === 'settings' }"
          @click="selectCategory('settings')"
        >
          <UIcon name="i-lucide-settings-2" />
          <span>{{ tr('rfm_settings', 'Settings') }}</span>
        </button>
      </div>
    </aside>

    <section class="rfm__main">
      <header class="rfm__topbar">
        <div class="rfm__topbar-left">
          <div
            v-if="category === 'all' && !query.trim()"
            class="rfm__breadcrumb"
          >
            <template
              v-for="(crumb, index) in breadcrumb"
              :key="`${crumb.id}-${index}`"
            >
              <UIcon
                v-if="index"
                name="i-lucide-chevron-right"
                class="rfm__crumb-sep"
              />
              <button
                type="button"
                class="rfm__crumb"
                :class="{ 'is-current': index === breadcrumb.length - 1 }"
                @click="goToBreadcrumb(index)"
              >
                {{ crumb.id == null ? tr('rfm_all_files', 'All files') : crumb.name }}
              </button>
            </template>
          </div>
          <h2
            v-else
            class="rfm__view-title"
          >
            {{ viewTitle }}
          </h2>
        </div>

        <div class="rfm__topbar-actions">
          <div
            class="rfm__search"
            :class="{ 'is-open': searchOpen }"
          >
            <button
              v-if="!searchOpen"
              type="button"
              class="rfm__icon-btn"
              :aria-label="tr('rfm_search', 'Search')"
              @click="openSearch"
            >
              <UIcon name="i-lucide-search" />
            </button>
            <template v-else>
              <UIcon
                name="i-lucide-search"
                class="rfm__search-icon"
              />
              <input
                ref="searchInput"
                v-model="query"
                type="search"
                :placeholder="tr('rfm_search_assets', 'Search assets')"
                @focus="searchFocused = true"
                @blur="onSearchBlur"
                @keydown.enter.prevent="commitSearch"
                @keydown.esc.prevent="closeSearch"
              >
              <button
                v-if="query"
                type="button"
                class="rfm__icon-btn"
                :aria-label="tr('rfm_clear', 'Clear')"
                @click="query = ''"
              >
                <UIcon name="i-lucide-x" />
              </button>
              <button
                type="button"
                class="rfm__icon-btn"
                :aria-label="tr('rfm_close_search', 'Close search')"
                @click="closeSearch"
              >
                <UIcon name="i-lucide-arrow-left" />
              </button>
              <RPopoverPanel
                v-model:open="filterMenuOpen"
                side="bottom"
                align="end"
                :side-offset="8"
                size="xl"
                show-close
                panel-class="rfm-filters-panel"
              >
                <template #default="{ open }">
                  <RTooltip :text="tr('rfm_filter_by', 'Filter by')">
                    <button
                      type="button"
                      class="rfm__icon-btn"
                      :class="{ 'is-active': hasSearchFilters || open }"
                      :aria-label="tr('rfm_filter_by', 'Filter by')"
                    >
                      <UIcon name="i-lucide-list-filter" />
                    </button>
                  </RTooltip>
                </template>
                <template #header>
                  <div class="rfm__filters-head">
                    <span class="rpp-panel__title">{{ tr('rfm_filter_by', 'Filter by') }}</span>
                    <RBtn
                      v-if="hasSearchFilters"
                      variant="outline"
                      type="cancel"
                      size="xs"
                      icon="i-lucide-filter-x"
                      :label="tr('rfm_clear_filters', 'Clear filters')"
                      @click="clearSearchFilters"
                    />
                  </div>
                </template>
                <template #body>
                  <div class="rfm__filters-grid">
                    <label>
                      <span>{{ tr('rfm_categories', 'Categories') }}</span>
                      <select v-model="searchFilters.category">
                        <option value="any">
                          {{ tr('rfm_any_category', 'Any category') }}
                        </option>
                        <option
                          v-for="item in categoryOptions"
                          :key="item.id"
                          :value="item.id"
                        >
                          {{ item.name }}
                        </option>
                      </select>
                    </label>
                    <label>
                      <span>{{ tr('rfm_tags', 'Tags') }}</span>
                      <select
                        v-model="searchFilters.tag"
                        disabled
                      >
                        <option value="any">
                          {{ tr('rfm_any_tag', 'Any tag') }}
                        </option>
                      </select>
                    </label>
                    <label>
                      <span>{{ tr('rfm_extensions', 'Extensions') }}</span>
                      <select v-model="searchFilters.extension">
                        <option value="any">
                          {{ tr('rfm_any_extension', 'Any extension') }}
                        </option>
                        <option
                          v-for="ext in extensionOptions"
                          :key="ext"
                          :value="ext"
                        >
                          {{ ext.toUpperCase() }}
                        </option>
                      </select>
                    </label>
                    <label>
                      <span>{{ tr('rfm_upload_date', 'Upload date') }}</span>
                      <select v-model="searchFilters.uploadDate">
                        <option
                          v-for="item in dateFilterOptions"
                          :key="item.value"
                          :value="item.value"
                        >
                          {{ item.label }}
                        </option>
                      </select>
                    </label>
                    <label>
                      <span>{{ tr('rfm_modification_date', 'Modification date') }}</span>
                      <select v-model="searchFilters.modifiedDate">
                        <option
                          v-for="item in dateFilterOptions"
                          :key="item.value"
                          :value="item.value"
                        >
                          {{ item.label }}
                        </option>
                      </select>
                    </label>
                  </div>
                  <div class="rfm__filter-kinds">
                    <button
                      v-for="item in mediaKindOptions"
                      :key="item.value"
                      type="button"
                      :class="{ 'is-active': searchFilters.kind === item.value }"
                      @click="searchFilters.kind = item.value"
                    >
                      {{ item.label }}
                    </button>
                  </div>
                </template>
              </RPopoverPanel>
              <div
                v-if="searchFocused && !query.trim()"
                class="rfm__search-panel"
              >
                <div
                  v-if="recentSearches.length"
                  class="rfm__search-group"
                >
                  <h4>{{ tr('rfm_recent_searches', 'Recent searches') }}</h4>
                  <button
                    v-for="term in recentSearches"
                    :key="term"
                    type="button"
                    @mousedown.prevent="query = term"
                  >
                    <UIcon name="i-lucide-history" />{{ term }}
                  </button>
                </div>
                <div class="rfm__search-group">
                  <h4>{{ tr('rfm_categories', 'Categories') }}</h4>
                  <button
                    v-for="item in primaryCategories"
                    :key="item.id"
                    type="button"
                    @mousedown.prevent="selectCategory(item.id)"
                  >
                    <UIcon :name="item.icon" />{{ item.name }}
                  </button>
                </div>
              </div>
            </template>
          </div>

          <RBtn
            variant="outline"
            type="add"
            size="xs"
            icon="i-lucide-folder-plus"
            :label="tr('rfm_add_folder', 'Add folder')"
            @click="openNewFolder"
          />

          <div class="rfm__upload">
            <RBtn
              variant="solid"
              type="view"
              size="xs"
              icon="i-lucide-upload"
              :label="tr('rfm_upload', 'Upload')"
              :disabled="uploading"
              @click="triggerUpload"
            />
            <button
              type="button"
              class="rfm__btn rfm__btn--primary rfm__btn--caret"
              :aria-label="tr('rfm_upload_options', 'Upload options')"
              @click="uploadMenuOpen = !uploadMenuOpen"
            >
              <UIcon name="i-lucide-chevron-down" />
            </button>
            <div
              v-if="uploadMenuOpen"
              class="rfm__menu"
            >
              <button
                type="button"
                @click="triggerUpload"
              >
                <UIcon name="i-lucide-file-up" />{{ tr('rfm_file_upload', 'File upload') }}
              </button>
              <button
                type="button"
                @click="triggerFolderUpload"
              >
                <UIcon name="i-lucide-folder-up" />{{ tr('rfm_folder_upload', 'Folder upload') }}
              </button>
              <div class="rfm__menu-sep" />
              <label class="rfm__menu-field">
                <span>{{ tr('rfm_provider', 'Provider') }}</span>
                <select v-model="providerCode">
                  <option
                    v-for="item in providers"
                    :key="item.Code"
                    :value="item.Code"
                    :disabled="!item.IsConfigured"
                  >{{ item.Name || item.Code }}</option>
                  <option
                    v-if="!providers.length"
                    value="telegram"
                  >Telegram</option>
                </select>
              </label>
            </div>
          </div>

          <div
            class="rfm__view-toggle"
            role="group"
            :aria-label="tr('rfm_view', 'View')"
          >
            <RTooltip :text="tr('rfm_grid_view', 'Grid view')">
              <button
                type="button"
                :class="{ 'is-active': viewMode === 'grid' }"
                :aria-label="tr('rfm_grid_view', 'Grid view')"
                @click="viewMode = 'grid'"
              >
                <UIcon name="i-lucide-layout-grid" />
              </button>
            </RTooltip>
            <RTooltip :text="tr('rfm_list_view', 'List view')">
              <button
                type="button"
                :class="{ 'is-active': viewMode === 'list' }"
                :aria-label="tr('rfm_list_view', 'List view')"
                @click="viewMode = 'list'"
              >
                <UIcon name="i-lucide-list" />
              </button>
            </RTooltip>
          </div>

          <RPopover
            v-model="optionsMenuOpen"
            placement="bottom-end"
            :ui="{ content: 'p-0 bg-transparent shadow-none border-none' }"
          >
            <template #trigger>
              <RTooltip :text="tr('rfm_display_options', 'Display options')">
                <button
                  type="button"
                  class="rfm__icon-btn"
                  :aria-label="tr('rfm_display_options', 'Display options')"
                >
                  <UIcon name="i-lucide-sliders-horizontal" />
                </button>
              </RTooltip>
            </template>
            <div class="rfm__options">
              <strong>{{ tr('rfm_assets', 'Assets') }}</strong>
              <label class="rfm__options-field">
                <span>{{ tr('rfm_sort_by', 'Sort by') }}</span>
                <select v-model="sortBy">
                  <option value="uploaded">{{ tr('rfm_sort_uploaded', 'Upload date') }}</option>
                  <option value="name">{{ tr('rfm_sort_name', 'Name') }}</option>
                  <option value="size">{{ tr('rfm_sort_size', 'Size') }}</option>
                  <option value="type">{{ tr('rfm_sort_type', 'Type') }}</option>
                </select>
              </label>
              <div class="rfm__options-group">
                <span>{{ tr('rfm_display', 'Display') }}</span>
                <label class="rfm__options-check">
                  <input
                    type="checkbox"
                    :checked="viewMode === 'grid'"
                    @change="onThumbnailsToggle"
                  >
                  <span>{{ tr('rfm_thumbnails', 'Thumbnails') }}</span>
                </label>
              </div>
              <label class="rfm__options-field">
                <span>{{ tr('rfm_size', 'Size') }}</span>
                <select v-model="thumbSize">
                  <option value="small">{{ tr('rfm_small', 'Small') }}</option>
                  <option value="medium">{{ tr('rfm_medium', 'Medium') }}</option>
                  <option value="large">{{ tr('rfm_large', 'Large') }}</option>
                </select>
              </label>
              <label class="rfm__options-check">
                <input
                  v-model="keepAspect"
                  type="checkbox"
                >
                <span>{{ tr('rfm_keep_aspect', 'Keep aspect ratio') }}</span>
              </label>
            </div>
          </RPopover>

          <RTooltip
            v-if="showClose"
            :text="tr('rfm_close', 'Close')"
          >
            <button
              type="button"
              class="rfm__icon-btn"
              :aria-label="tr('rfm_close', 'Close')"
              @click="emit('close')"
            >
              <UIcon name="i-lucide-x" />
            </button>
          </RTooltip>
        </div>
      </header>

      <div
        v-if="selectedFiles.length || selectedFolder"
        class="rfm__actionbar"
      >
        <div class="rfm__actionbar-info">
          <template v-if="selectedFiles.length">
            <strong>{{ selectedFiles.length }}</strong>
            <span>{{ selectedFiles.length === 1 ? tr('rfm_file_selected', 'file selected') : tr('rfm_files_selected', 'files selected') }}</span>
          </template>
          <template v-else>
            <UIcon name="i-lucide-folder" />
            <strong>{{ selectedFolder.Name }}</strong>
            <span>{{ folderFileCount }} {{ tr('rfm_assets', 'assets') }}</span>
          </template>
        </div>
        <div class="rfm__actionbar-actions">
          <RBtns :data="selectedFiles.length ? fileActionItems : folderActionItems" />
          <RTooltip :text="tr('rfm_cancel', 'Cancel')">
            <button
              type="button"
              class="rfm__icon-btn"
              :aria-label="tr('rfm_cancel', 'Cancel')"
              @click="clearSelection"
            >
              <UIcon name="i-lucide-x" />
            </button>
          </RTooltip>
        </div>
      </div>

      <div
        v-if="error"
        class="rfm__error"
      >
        {{ error }}
      </div>

      <div
        v-if="category === 'settings'"
        class="rfm__settings"
      >
        <div class="rfm__settings-head">
          <div>
            <h2>{{ tr('rfm_asset_categories', 'Asset categories') }}</h2>
            <p>{{ tr('rfm_asset_categories_desc', 'Categories are the top-level elements that organize assets in the file manager.') }}</p>
          </div>
          <RBtn
            variant="solid"
            type="view"
            size="xs"
            icon="i-lucide-plus"
            :label="tr('rfm_add_category', 'Add category')"
            @click="openCategoryDialog()"
          />
        </div>

        <div
          class="rfm__tabs"
          role="tablist"
        >
          <button
            type="button"
            :class="{ 'is-active': settingsTab === 'categories' }"
            @click="settingsTab = 'categories'"
          >
            {{ tr('rfm_asset_categories', 'Asset categories') }}
          </button>
          <button
            type="button"
            :class="{ 'is-active': settingsTab === 'permissions' }"
            @click="settingsTab = 'permissions'"
          >
            {{ tr('rfm_permissions', 'Permissions') }}
          </button>
        </div>

        <div
          v-if="settingsTab === 'categories'"
          class="rfm__category-grid"
        >
          <article
            v-for="item in categories"
            :key="item.id"
            class="rfm__category-card"
          >
            <div class="rfm__category-head">
              <span class="rfm__category-icon"><UIcon :name="item.icon || 'i-lucide-folder'" /></span>
              <div>
                <h3>{{ item.name }}</h3>
                <code>{{ item.id }}</code>
              </div>
              <span
                v-if="item.private"
                class="rfm__category-private"
              >
                <UIcon name="i-lucide-lock" />{{ tr('rfm_private', 'Private') }}
              </span>
            </div>
            <p class="rfm__category-label">
              {{ tr('rfm_allowed_extensions', 'Allowed extensions') }}
            </p>
            <div class="rfm__chips">
              <span
                v-for="ext in item.extensions"
                :key="ext"
              >{{ ext }}</span>
            </div>
            <div class="rfm__category-actions">
              <button
                type="button"
                @click="openCategoryDialog(item)"
              >
                <UIcon name="i-lucide-pencil" />{{ tr('rfm_edit', 'Edit') }}
              </button>
              <button
                v-if="!item.builtin"
                type="button"
                class="is-danger"
                @click="deleteCategory(item)"
              >
                <UIcon name="i-lucide-trash-2" />{{ tr('rfm_delete', 'Delete') }}
              </button>
            </div>
          </article>
        </div>

        <div
          v-else
          class="rfm__permissions"
        >
          <UIcon name="i-lucide-shield-check" />
          <h3>{{ tr('rfm_permissions_title', 'Permissions') }}</h3>
          <p>{{ tr('rfm_permissions_desc', 'File manager permissions are managed by your administrator.') }}</p>
        </div>
      </div>

      <div
        v-else
        class="rfm__body"
      >
        <div
          class="rfm__content"
          :class="{ 'is-list': viewMode === 'list' }"
        >
          <div
            v-if="loading"
            class="rfm__state"
          >
            <UIcon
              name="i-lucide-loader-circle"
              class="rfm__spin"
            />
            <strong>{{ tr('rfm_loading', 'Loading files…') }}</strong>
          </div>

          <div
            v-else-if="!displayFolders.length && !displayFiles.length"
            class="rfm__state"
          >
            <UIcon name="i-lucide-image-off" />
            <strong>{{ query.trim() ? tr('rfm_no_results', 'No results found') : tr('rfm_empty', 'No files yet') }}</strong>
            <span>{{ query.trim() ? tr('rfm_no_results_hint', 'Try a different search.') : tr('rfm_empty_hint', 'Upload files or create a folder to get started.') }}</span>
            <RBtn
              v-if="!query.trim()"
              variant="solid"
              type="view"
              size="xs"
              icon="i-lucide-upload"
              :label="tr('rfm_upload', 'Upload')"
              @click="triggerUpload"
            />
          </div>

          <template v-else>
            <section
              v-if="displayFolders.length"
              class="rfm__folders"
            >
              <h3 class="rfm__section-title">
                {{ tr('rfm_folders', 'Folders') }}
              </h3>
              <div class="rfm__folder-grid">
                <article
                  v-for="folder in displayFolders"
                  :key="folder.Id"
                  class="rfm__folder-card"
                  :class="{ 'is-selected': selectedFolder?.Id === folder.Id }"
                  @click="selectFolder(folder)"
                  @dblclick="openFolder(folder)"
                >
                  <span class="rfm__folder-icon"><UIcon name="i-lucide-folder" /></span>
                  <span class="rfm__folder-name">{{ folder.Name }}</span>
                  <span class="rfm__folder-meta">{{ folder.Description || formatDate(folder.CreatedAt) }}</span>
                  <span
                    class="rfm__folder-actions"
                    @click.stop
                  >
                    <RTooltip :text="tr('rfm_rename', 'Rename')">
                      <button
                        type="button"
                        :aria-label="tr('rfm_rename', 'Rename')"
                        @click="openRename(folder, 'folder')"
                      ><UIcon name="i-lucide-pencil" /></button>
                    </RTooltip>
                    <RTooltip :text="tr('rfm_delete', 'Delete')">
                      <button
                        type="button"
                        :aria-label="tr('rfm_delete', 'Delete')"
                        @click="askDeleteFolder(folder)"
                      ><UIcon name="i-lucide-trash-2" /></button>
                    </RTooltip>
                  </span>
                </article>
              </div>
            </section>

            <section class="rfm__files">
              <div class="rfm__files-head">
                <h3 class="rfm__section-title">
                  {{ tr('rfm_assets', 'Assets') }} <span>{{ displayFiles.length }}</span>
                </h3>
                <button
                  v-if="hasMore"
                  type="button"
                  class="rfm__link"
                  :disabled="loadingMore"
                  @click="loadMoreItems"
                >
                  {{ loadingMore ? tr('rfm_loading_more', 'Loading…') : tr('rfm_load_more', 'Load more') }}
                </button>
              </div>

              <div
                v-if="viewMode === 'grid'"
                class="rfm__grid"
                :class="[`is-${thumbSize}`, { 'keep-aspect': keepAspect }]"
              >
                <article
                  v-for="file in displayFiles"
                  :key="file.Id"
                  class="rfm__card"
                  :class="{ 'is-selected': selectedIds.includes(file.Id), 'is-disabled': !isSelectable(file), 'is-deleted': !!file.DeletedAt }"
                  @click="onFileClick(file, $event)"
                  @dblclick="onFileDoubleClick(file)"
                >
                  <div class="rfm__thumb">
                    <img
                      v-if="isExplorerImage(file) && file.Url"
                      :src="file.Url"
                      :alt="file.Name"
                      loading="lazy"
                      @load="onImageMeta($event, file)"
                      @error="onThumbError"
                    >
                    <div
                      v-else
                      class="rfm__thumb-icon"
                    >
                      <UIcon :name="fileIcon(file)" />
                    </div>
                    <span
                      v-if="file.DeletedAt"
                      class="rfm__badge rfm__badge--danger"
                    >{{ tr('rfm_deleted', 'Deleted') }}</span>
                    <span
                      v-else-if="!file.IsPublic"
                      class="rfm__badge"
                    >{{ tr('rfm_private', 'Private') }}</span>
                    <button
                      type="button"
                      class="rfm__check"
                      :aria-label="tr('rfm_select', 'Select')"
                      @click.stop="toggleSelect(file)"
                    >
                      <UIcon
                        v-if="selectedIds.includes(file.Id)"
                        name="i-lucide-check"
                      />
                    </button>
                    <div
                      class="rfm__card-actions"
                      @click.stop
                    >
                      <RTooltip :text="tr('rfm_details', 'Details')">
                        <button
                          type="button"
                          :aria-label="tr('rfm_details', 'Details')"
                          @click="openDetails(file)"
                        >
                          <UIcon name="i-lucide-info" />
                        </button>
                      </RTooltip>
                      <RTooltip :text="tr('rfm_download', 'Download')">
                        <button
                          type="button"
                          :aria-label="tr('rfm_download', 'Download')"
                          @click="download(file)"
                        >
                          <UIcon name="i-lucide-download" />
                        </button>
                      </RTooltip>
                      <RTooltip :text="tr('rfm_delete', 'Delete')">
                        <button
                          type="button"
                          :aria-label="tr('rfm_delete', 'Delete')"
                          @click="askDeleteFile(file)"
                        >
                          <UIcon name="i-lucide-trash-2" />
                        </button>
                      </RTooltip>
                    </div>
                  </div>
                  <div class="rfm__card-body">
                    <span
                      class="rfm__name"
                      :title="file.Name"
                    >{{ file.Name }}</span>
                    <span class="rfm__meta">
                      <span class="rfm__type">{{ typeLabel(file) }}</span>
                      <span v-if="file.FileSize">{{ formatBytes(file.FileSize) }}</span>
                    </span>
                  </div>
                </article>
              </div>

              <div
                v-else
                class="rfm__list"
              >
                <div class="rfm__list-head">
                  <span />
                  <span>{{ tr('rfm_name', 'Name') }}</span>
                  <span>{{ tr('rfm_type', 'Type') }}</span>
                  <span>{{ tr('rfm_size', 'Size') }}</span>
                  <span>{{ tr('rfm_modified', 'Modified') }}</span>
                  <span />
                </div>
                <div
                  v-for="file in displayFiles"
                  :key="file.Id"
                  class="rfm__row"
                  :class="{ 'is-selected': selectedIds.includes(file.Id), 'is-disabled': !isSelectable(file), 'is-deleted': !!file.DeletedAt }"
                  @click="onFileClick(file, $event)"
                  @dblclick="onFileDoubleClick(file)"
                >
                  <button
                    type="button"
                    class="rfm__row-check"
                    @click.stop="toggleSelect(file)"
                  >
                    <UIcon
                      v-if="selectedIds.includes(file.Id)"
                      name="i-lucide-check"
                    />
                  </button>
                  <span class="rfm__row-name"><UIcon :name="fileIcon(file)" /><span :title="file.Name">{{ file.Name }}</span></span>
                  <span>{{ typeLabel(file) }}</span>
                  <span>{{ formatBytes(file.FileSize) }}</span>
                  <span>{{ formatDate(file.UpdatedAt || file.CreatedAt) }}</span>
                  <span
                    class="rfm__row-actions"
                    @click.stop
                  >
                    <ClientOnly>
                      <RTblBtns
                        :items="rowActions(file)"
                        @action-click="onRowAction"
                      />
                    </ClientOnly>
                  </span>
                </div>
              </div>
            </section>
          </template>
        </div>

        <aside
          v-if="detailsOpen && (primaryFile || selectedFolder)"
          class="rfm__details"
        >
          <div class="rfm__details-head">
            <strong>{{ selectedFolder ? tr('rfm_folder_details', 'Folder details') : tr('rfm_details', 'Details') }}</strong>
            <RTooltip :text="tr('rfm_close', 'Close')">
              <button
                type="button"
                class="rfm__icon-btn"
                :aria-label="tr('rfm_close', 'Close')"
                @click="closeDetails"
              >
                <UIcon name="i-lucide-x" />
              </button>
            </RTooltip>
          </div>

          <template v-if="selectedFolder">
            <div class="rfm__details-preview rfm__folder-preview">
              <UIcon name="i-lucide-folder" />
            </div>
            <h3 class="rfm__details-name">
              {{ selectedFolder.Name }}
            </h3>
            <div class="rfm__details-grid">
              <span>{{ tr('rfm_id', 'ID') }}</span><strong>{{ selectedFolder.Id }}</strong>
              <span>{{ tr('rfm_number_of_assets', 'Number of assets') }}</span><strong>{{ folderFileCount }}</strong>
              <span>{{ tr('rfm_created', 'Created') }}</span><strong>{{ formatDate(selectedFolder.CreatedAt) || '—' }}</strong>
              <span>{{ tr('rfm_modified', 'Modified') }}</span><strong>{{ formatDate(selectedFolder.UpdatedAt) || '—' }}</strong>
              <span>{{ tr('rfm_path', 'Path') }}</span><strong>{{ selectedFolder.Path || '—' }}</strong>
            </div>
            <section class="rfm__detail-section">
              <h4>{{ tr('rfm_allowed_extensions', 'Allowed extensions') }}</h4>
              <div class="rfm__chips">
                <span
                  v-for="ext in folderExtensions"
                  :key="ext"
                >{{ ext }}</span>
                <span v-if="!folderExtensions.length">—</span>
              </div>
            </section>
            <section class="rfm__detail-section">
              <h4>{{ tr('rfm_recently_modified', 'Recently modified assets') }}</h4>
              <div class="rfm__recent-list">
                <button
                  v-for="file in folderRecentFiles"
                  :key="file.Id"
                  type="button"
                  class="rfm__recent"
                  @click="openDetails(file)"
                >
                  <UIcon :name="fileIcon(file)" />
                  <span :title="file.Name">{{ file.Name }}</span>
                  <small>{{ formatDate(file.UpdatedAt || file.CreatedAt) }}</small>
                </button>
                <span
                  v-if="!folderRecentFiles.length"
                  class="rfm__muted"
                >{{ tr('rfm_no_assets', 'No assets yet.') }}</span>
              </div>
            </section>
            <section class="rfm__detail-section">
              <h4>{{ tr('rfm_file_limits', 'File limits') }}</h4>
              <div class="rfm__details-grid">
                <span>{{ tr('rfm_max_file_size', 'Maximum file size') }}</span><strong>{{ activeProvider?.MaxSizeBytes ? formatBytes(activeProvider.MaxSizeBytes) : '—' }}</strong>
                <span>{{ tr('rfm_max_image_resolution', 'Maximum image resolution') }}</span><strong>{{ tr('rfm_not_set', 'Not set') }}</strong>
              </div>
            </section>
            <div class="rfm__details-actions">
              <RBtn
                variant="solid"
                type="view"
                size="xs"
                icon="i-lucide-folder-open"
                :label="tr('rfm_open_folder', 'Open folder')"
                @click="openSelectedFolder"
              />
              <RBtn
                variant="outline"
                type="cancel"
                size="xs"
                icon="i-lucide-pencil"
                :label="tr('rfm_rename', 'Rename')"
                @click="openRename(selectedFolder, 'folder')"
              />
              <RBtn
                variant="outline"
                type="delete"
                size="xs"
                icon="i-lucide-trash-2"
                :label="tr('rfm_delete', 'Delete')"
                @click="askDeleteFolder(selectedFolder)"
              />
            </div>
          </template>

          <template v-else-if="primaryFile">
            <div
              class="rfm__details-preview"
              @dblclick="openPreview(primaryFile)"
            >
              <img
                v-if="isExplorerImage(primaryFile) && primaryFile.Url"
                :src="primaryFile.Url"
                :alt="primaryFile.Name"
                @load="onImageMeta($event, primaryFile)"
                @error="onThumbError"
              >
              <UIcon
                v-else
                :name="fileIcon(primaryFile)"
              />
              <RTooltip
                v-if="primaryFile.Url"
                :text="tr('rfm_view', 'View')"
              >
                <button
                  type="button"
                  class="rfm__preview-open"
                  :aria-label="tr('rfm_view', 'View')"
                  @click="openPreview(primaryFile)"
                >
                  <UIcon name="i-lucide-expand" />
                </button>
              </RTooltip>
            </div>
            <h3 class="rfm__details-name">
              {{ primaryFile.Name }}
            </h3>
            <RTabs
              v-model="detailsTab"
              :items="detailTabs"
              variant="underline"
              size="sm"
              compact
              class="rfm__details-tabs"
            />

            <div
              v-if="detailsTab === 'properties'"
              class="rfm__details-scroll"
            >
              <section class="rfm__detail-section">
                <h4>{{ tr('rfm_attributes', 'Attributes') }}</h4>
                <div class="rfm__details-grid">
                  <span>{{ tr('rfm_upload_date', 'Upload date') }}</span><strong>{{ formatDate(primaryFile.CreatedAt) || '—' }}</strong>
                  <span>{{ tr('rfm_modification_date', 'Modification date') }}</span><strong>{{ formatDate(primaryFile.UpdatedAt) || '—' }}</strong>
                  <span>{{ tr('rfm_file_size', 'File size') }}</span><strong>{{ formatBytes(primaryFile.FileSize) || '—' }}</strong>
                  <span>{{ tr('rfm_width', 'Width') }}</span><strong>{{ activeMeta?.width ? `${activeMeta.width} px` : '—' }}</strong>
                  <span>{{ tr('rfm_height', 'Height') }}</span><strong>{{ activeMeta?.height ? `${activeMeta.height} px` : '—' }}</strong>
                  <span>{{ tr('rfm_provider', 'Provider') }}</span><strong>{{ primaryFile.Provider || '—' }}</strong>
                  <span>{{ tr('rfm_visibility', 'Visibility') }}</span><strong>{{ primaryFile.IsPublic ? tr('rfm_public', 'Public') : tr('rfm_private', 'Private') }}</strong>
                </div>
              </section>
              <section class="rfm__detail-section">
                <h4>{{ tr('rfm_information', 'Information') }}</h4>
                <div class="rfm__details-grid">
                  <span>{{ tr('rfm_file_name', 'File name') }}</span><strong>{{ primaryFile.Name }}</strong>
                  <span>{{ tr('rfm_file_id', 'File ID') }}</span><strong>{{ primaryFile.FileId || primaryFile.Id }}</strong>
                  <span>{{ tr('rfm_folder', 'Folder') }}</span><strong>{{ allFiles.find((item) => item.FolderId === primaryFile.FolderId)?.Name || '—' }}</strong>
                  <span>{{ tr('rfm_url', 'URL') }}</span><strong class="rfm__break">{{ primaryFile.Url || '—' }}</strong>
                </div>
              </section>
              <section class="rfm__detail-section">
                <h4>{{ tr('rfm_description', 'Description') }} <small>{{ tr('rfm_ai_generated', 'AI generated') }}</small></h4>
                <p class="rfm__muted">
                  {{ fileDescription(primaryFile) }}
                </p>
              </section>
              <section class="rfm__detail-section">
                <h4>{{ tr('rfm_tags', 'Tags') }} <small>{{ tr('rfm_ai_generated', 'AI generated') }}</small></h4>
                <div class="rfm__chips">
                  <span
                    v-for="tag in fileTags(primaryFile)"
                    :key="tag"
                  >{{ tag }}</span>
                </div>
              </section>
              <section class="rfm__detail-section">
                <h4>{{ tr('rfm_custom_fields', 'Custom fields') }}</h4>
                <div
                  v-for="(field, index) in fieldsFor(primaryFile)"
                  :key="field.id"
                  class="rfm__custom-field"
                >
                  <input
                    v-model="field.label"
                    type="text"
                    :placeholder="tr('rfm_label', 'Label')"
                  >
                  <input
                    v-model="field.content"
                    type="text"
                    :placeholder="tr('rfm_content', 'Content')"
                  >
                  <RTooltip :text="tr('rfm_delete', 'Delete')">
                    <button
                      type="button"
                      class="rfm__icon-btn"
                      :aria-label="tr('rfm_delete', 'Delete')"
                      @click="removeCustomField(primaryFile, index)"
                    >
                      <UIcon name="i-lucide-x" />
                    </button>
                  </RTooltip>
                </div>
                <RBtn
                  variant="outline"
                  type="add"
                  size="xs"
                  icon="i-lucide-plus"
                  :label="tr('rfm_add_new_field', 'Add new field')"
                  @click="addCustomField(primaryFile)"
                />
              </section>
            </div>

            <div
              v-else
              class="rfm__details-scroll"
            >
              <section class="rfm__detail-section">
                <h4>{{ tr('rfm_versions', 'Versions') }}</h4>
                <div class="rfm__version">
                  <div>
                    <strong>{{ tr('rfm_current_version', 'Current version') }}</strong>
                    <small>{{ formatDate(primaryFile.UpdatedAt || primaryFile.CreatedAt) }}</small>
                  </div>
                  <span>{{ formatBytes(primaryFile.FileSize) }}</span>
                </div>
                <div class="rfm__version-actions">
                  <RBtn
                    variant="outline"
                    type="cancel"
                    size="xs"
                    icon="i-lucide-eye"
                    :label="tr('rfm_preview', 'Preview')"
                    :disabled="!primaryFile.Url"
                    @click="openPreview(primaryFile)"
                  />
                  <RBtn
                    variant="outline"
                    type="cancel"
                    size="xs"
                    icon="i-lucide-download"
                    :label="tr('rfm_download', 'Download')"
                    @click="download(primaryFile)"
                  />
                </div>
              </section>
            </div>

            <div class="rfm__details-actions">
              <RBtn
                v-if="selectMode !== 'none' && !primaryFile.DeletedAt"
                variant="solid"
                type="view"
                size="xs"
                icon="i-lucide-check"
                :label="tr('rfm_insert', 'Insert')"
                :disabled="!canInsert"
                @click="emitSelect"
              />
              <RBtn
                v-if="primaryFile.DeletedAt"
                variant="solid"
                type="view"
                size="xs"
                icon="i-lucide-rotate-ccw"
                :label="tr('rfm_restore', 'Restore')"
                @click="restoreSelected"
              />
              <RBtn
                variant="outline"
                type="cancel"
                size="xs"
                icon="i-lucide-download"
                :label="tr('rfm_download', 'Download')"
                @click="download(primaryFile)"
              />
              <RBtn
                v-if="primaryFile.Url"
                variant="outline"
                type="cancel"
                size="xs"
                icon="i-lucide-link"
                :label="tr('rfm_copy_link', 'Copy link')"
                @click="copyUrl(primaryFile)"
              />
              <RBtn
                variant="outline"
                type="cancel"
                size="xs"
                icon="i-lucide-pencil"
                :label="tr('rfm_rename', 'Rename')"
                @click="openRename(primaryFile, 'file')"
              />
              <RBtn
                variant="outline"
                type="cancel"
                size="xs"
                :icon="primaryFile.IsPublic ? 'i-lucide-lock' : 'i-lucide-globe'"
                :label="primaryFile.IsPublic ? tr('rfm_make_private', 'Make private') : tr('rfm_make_public', 'Make public')"
                @click="togglePublic(primaryFile)"
              />
              <RBtn
                variant="outline"
                type="delete"
                size="xs"
                icon="i-lucide-trash-2"
                :label="primaryFile.DeletedAt ? tr('rfm_delete_forever', 'Delete forever') : tr('rfm_delete', 'Delete')"
                @click="askDeleteFile(primaryFile)"
              />
            </div>
          </template>
        </aside>
      </div>

      <footer
        v-if="selectedIds.length"
        class="rfm__selection"
      >
        <span>{{ selectedIds.length }} {{ tr('rfm_selected', 'selected') }}</span>
        <div class="rfm__selection-actions">
          <RBtn
            variant="outline"
            type="cancel"
            size="xs"
            icon="i-lucide-x"
            :label="tr('rfm_cancel', 'Cancel')"
            @click="clearSelection"
          />
        </div>
      </footer>
    </section>

    <div
      v-if="previewOpen && primaryFile"
      class="rfm__preview"
      @click.self="closePreview"
    >
      <div class="rfm__preview-panel">
        <header class="rfm__preview-head">
          <div class="rfm__preview-title">
            <strong>{{ primaryFile.Name }}</strong>
            <small>{{ typeLabel(primaryFile) }} · {{ formatBytes(primaryFile.FileSize) }}</small>
          </div>
          <div class="rfm__preview-tools">
            <RTooltip :text="tr('rfm_zoom_out', 'Zoom out')">
              <button
                type="button"
                class="rfm__icon-btn"
                :aria-label="tr('rfm_zoom_out', 'Zoom out')"
                @click="zoomOut"
              >
                <UIcon name="i-lucide-zoom-out" />
              </button>
            </RTooltip>
            <span class="rfm__zoom-value">{{ Math.round(previewZoom * 100) }}%</span>
            <RTooltip :text="tr('rfm_zoom_in', 'Zoom in')">
              <button
                type="button"
                class="rfm__icon-btn"
                :aria-label="tr('rfm_zoom_in', 'Zoom in')"
                @click="zoomIn"
              >
                <UIcon name="i-lucide-zoom-in" />
              </button>
            </RTooltip>
            <RTooltip :text="tr('rfm_reset_zoom', 'Reset zoom')">
              <button
                type="button"
                class="rfm__icon-btn"
                :aria-label="tr('rfm_reset_zoom', 'Reset zoom')"
                @click="resetZoom"
              >
                <UIcon name="i-lucide-maximize-2" />
              </button>
            </RTooltip>
            <RBtn
              variant="outline"
              type="cancel"
              size="xs"
              icon="i-lucide-download"
              :label="tr('rfm_download', 'Download')"
              @click="download(primaryFile)"
            />
            <RBtn
              variant="outline"
              type="cancel"
              size="xs"
              icon="i-lucide-x"
              :label="tr('rfm_cancel', 'Cancel')"
              @click="closePreview"
            />
          </div>
        </header>
        <div class="rfm__preview-body">
          <div class="rfm__preview-stage">
            <img
              v-if="isExplorerImage(primaryFile) && primaryFile.Url"
              :src="primaryFile.Url"
              :alt="primaryFile.Name"
              :style="{ transform: `scale(${previewZoom})` }"
              @load="onImageMeta($event, primaryFile)"
              @error="onThumbError"
            >
            <div
              v-else
              class="rfm__preview-file"
            >
              <UIcon :name="fileIcon(primaryFile)" />
              <span>{{ primaryFile.Name }}</span>
            </div>
          </div>
          <aside class="rfm__preview-details">
            <h3>{{ primaryFile.Name }}</h3>
            <RTabs
              v-model="detailsTab"
              :items="detailTabs"
              variant="underline"
              size="sm"
              compact
            />
            <div
              v-if="detailsTab === 'properties'"
              class="rfm__details-scroll"
            >
              <section class="rfm__detail-section">
                <h4>{{ tr('rfm_attributes', 'Attributes') }}</h4>
                <div class="rfm__details-grid">
                  <span>{{ tr('rfm_upload_date', 'Upload date') }}</span><strong>{{ formatDate(primaryFile.CreatedAt) || '—' }}</strong>
                  <span>{{ tr('rfm_modification_date', 'Modification date') }}</span><strong>{{ formatDate(primaryFile.UpdatedAt) || '—' }}</strong>
                  <span>{{ tr('rfm_file_size', 'File size') }}</span><strong>{{ formatBytes(primaryFile.FileSize) || '—' }}</strong>
                  <span>{{ tr('rfm_width', 'Width') }}</span><strong>{{ activeMeta?.width ? `${activeMeta.width} px` : '—' }}</strong>
                  <span>{{ tr('rfm_height', 'Height') }}</span><strong>{{ activeMeta?.height ? `${activeMeta.height} px` : '—' }}</strong>
                  <span>{{ tr('rfm_provider', 'Provider') }}</span><strong>{{ primaryFile.Provider || '—' }}</strong>
                </div>
              </section>
              <section class="rfm__detail-section">
                <h4>{{ tr('rfm_description', 'Description') }} <small>{{ tr('rfm_ai_generated', 'AI generated') }}</small></h4>
                <p class="rfm__muted">
                  {{ fileDescription(primaryFile) }}
                </p>
              </section>
              <section class="rfm__detail-section">
                <h4>{{ tr('rfm_tags', 'Tags') }} <small>{{ tr('rfm_ai_generated', 'AI generated') }}</small></h4>
                <div class="rfm__chips">
                  <span
                    v-for="tag in fileTags(primaryFile)"
                    :key="tag"
                  >{{ tag }}</span>
                </div>
              </section>
              <section class="rfm__detail-section">
                <h4>{{ tr('rfm_url', 'URL') }}</h4>
                <div class="rfm__url-row">
                  <span class="rfm__break">{{ primaryFile.Url || '—' }}</span>
                  <RBtn
                    v-if="primaryFile.Url"
                    variant="outline"
                    type="cancel"
                    size="xs"
                    icon="i-lucide-link"
                    :label="tr('rfm_copy_link', 'Copy link')"
                    @click="copyUrl(primaryFile)"
                  />
                </div>
              </section>
              <section class="rfm__detail-section">
                <h4>{{ tr('rfm_custom_fields', 'Custom fields') }}</h4>
                <div
                  v-for="(field, index) in fieldsFor(primaryFile)"
                  :key="field.id"
                  class="rfm__custom-field"
                >
                  <input
                    v-model="field.label"
                    type="text"
                    :placeholder="tr('rfm_label', 'Label')"
                  >
                  <input
                    v-model="field.content"
                    type="text"
                    :placeholder="tr('rfm_content', 'Content')"
                  >
                  <RTooltip :text="tr('rfm_delete', 'Delete')">
                    <button
                      type="button"
                      class="rfm__icon-btn"
                      :aria-label="tr('rfm_delete', 'Delete')"
                      @click="removeCustomField(primaryFile, index)"
                    >
                      <UIcon name="i-lucide-x" />
                    </button>
                  </RTooltip>
                </div>
                <RBtn
                  variant="outline"
                  type="add"
                  size="xs"
                  icon="i-lucide-plus"
                  :label="tr('rfm_add_new_field', 'Add new field')"
                  @click="addCustomField(primaryFile)"
                />
              </section>
            </div>
            <div
              v-else
              class="rfm__details-scroll"
            >
              <section class="rfm__detail-section">
                <h4>{{ tr('rfm_versions', 'Versions') }}</h4>
                <div class="rfm__version">
                  <div>
                    <strong>{{ tr('rfm_current_version', 'Current version') }}</strong>
                    <small>{{ formatDate(primaryFile.UpdatedAt || primaryFile.CreatedAt) }}</small>
                  </div>
                  <span>{{ formatBytes(primaryFile.FileSize) }}</span>
                </div>
              </section>
            </div>
            <div class="rfm__details-actions">
              <RBtn
                v-if="selectMode !== 'none' && !primaryFile.DeletedAt"
                variant="solid"
                type="view"
                size="xs"
                icon="i-lucide-check"
                :label="tr('rfm_insert', 'Insert')"
                :disabled="!canInsert"
                @click="emitSelect"
              />
              <RBtn
                variant="outline"
                type="cancel"
                size="xs"
                icon="i-lucide-x"
                :label="tr('rfm_cancel', 'Cancel')"
                @click="closePreview"
              />
            </div>
          </aside>
        </div>
      </div>
    </div>

    <input
      ref="uploadInput"
      type="file"
      multiple
      hidden
      @change="onUploadPicked"
    >
    <input
      ref="folderInput"
      type="file"
      webkitdirectory
      multiple
      hidden
      @change="onFolderPicked"
    >

    <div
      v-if="uploads.length"
      class="rfm__uploads"
    >
      <div
        v-for="entry in uploads"
        :key="entry.id"
        class="rfm__upload-item"
        :class="`is-${entry.status}`"
      >
        <div class="rfm__upload-text">
          <span :title="entry.name">{{ entry.name }}</span>
          <small v-if="entry.error">{{ entry.error }}</small>
          <small v-else>{{ Math.round(entry.progress * 100) }}%</small>
        </div>
        <div class="rfm__upload-track">
          <span :style="{ width: `${Math.round(entry.progress * 100)}%` }" />
        </div>
        <button
          type="button"
          class="rfm__icon-btn"
          :aria-label="tr('rfm_close', 'Close')"
          @click="removeUpload(entry)"
        >
          <UIcon name="i-lucide-x" />
        </button>
      </div>
    </div>

    <div
      v-if="toast.visible"
      class="rfm__toast"
      :class="`is-${toast.type}`"
    >
      {{ toast.message }}
    </div>

    <div
      v-if="newFolder.open"
      class="rfm__dialog-backdrop"
      @click.self="newFolder.open = false"
    >
      <div
        class="rfm__dialog"
        role="dialog"
        aria-modal="true"
      >
        <h3>{{ tr('rfm_new_folder', 'New folder') }}</h3>
        <label>
          <span>{{ tr('rfm_name', 'Name') }}</span>
          <input
            v-model="newFolder.name"
            type="text"
            :placeholder="tr('rfm_folder_name', 'Folder name')"
            @keydown.enter.prevent="submitNewFolder"
          >
        </label>
        <label>
          <span>{{ tr('rfm_description', 'Description') }}</span>
          <textarea
            v-model="newFolder.description"
            rows="3"
            :placeholder="tr('rfm_optional', 'Optional')"
          />
        </label>
        <p
          v-if="newFolder.error"
          class="rfm__dialog-error"
        >
          {{ newFolder.error }}
        </p>
        <div class="rfm__dialog-actions">
          <button
            type="button"
            class="rfm__btn rfm__btn--ghost"
            @click="newFolder.open = false"
          >
            {{ tr('rfm_cancel', 'Cancel') }}
          </button>
          <button
            type="button"
            class="rfm__btn rfm__btn--primary"
            :disabled="newFolder.saving"
            @click="submitNewFolder"
          >
            {{ tr('rfm_create', 'Create') }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="renameDialog.open"
      class="rfm__dialog-backdrop"
      @click.self="renameDialog.open = false"
    >
      <div
        class="rfm__dialog"
        role="dialog"
        aria-modal="true"
      >
        <h3>{{ tr('rfm_rename', 'Rename') }}</h3>
        <label>
          <span>{{ tr('rfm_name', 'Name') }}</span>
          <input
            v-model="renameDialog.name"
            type="text"
            @keydown.enter.prevent="submitRename"
          >
        </label>
        <p
          v-if="renameDialog.error"
          class="rfm__dialog-error"
        >
          {{ renameDialog.error }}
        </p>
        <div class="rfm__dialog-actions">
          <button
            type="button"
            class="rfm__btn rfm__btn--ghost"
            @click="renameDialog.open = false"
          >
            {{ tr('rfm_cancel', 'Cancel') }}
          </button>
          <button
            type="button"
            class="rfm__btn rfm__btn--primary"
            :disabled="renameDialog.saving"
            @click="submitRename"
          >
            {{ tr('rfm_save', 'Save') }}
          </button>
        </div>
      </div>
    </div>

    <RModal
      v-model="categoryDialog.open"
      :title="categoryDialog.mode === 'edit' ? tr('rfm_edit_category', 'Edit category') : tr('rfm_add_category', 'Add category')"
      :description="tr('rfm_category_modal_desc', 'Define how this category groups assets and which file types it accepts.')"
      modal-width="min(920px, 94vw)"
      :modal-radius="16"
      body-class="rfm-category-modal-body"
    >
      <div class="rfm__category-form">
        <FloatingInput
          v-model="categoryDialog.name"
          :label="tr('rfm_category_name', 'Category name')"
          :placeholder="tr('rfm_category_name_placeholder', 'e.g. Marketing assets')"
        />

        <div class="rfm__extensions-field">
          <span class="rfm__field-label">{{ tr('rfm_allowed_extensions', 'Allowed extensions') }}</span>
          <RInputTags
            class="rfm__extension-tags"
            :model-value="selectedCategoryExtensions"
            :options="categoryExtensionChoices"
            :convert-value="normalizeCategoryExtension"
            mode="local"
            :min-chars="0"
            :suggestions-limit="60"
            :duplicate="false"
            :allow-custom="true"
            :add-on-blur="false"
            :placeholder="tr('rfm_extension_placeholder', 'e.g. pdf')"
            :no-results-text="tr('rfm_no_results', 'No results found')"
            @update:data="updateCategoryExtensions"
          >
            <template #suggestion="{ option }">
              <span class="rfm__extension-chip">{{ option }}</span>
            </template>
          </RInputTags>
        </div>

        <label class="rfm__private-toggle">
          <input
            v-model="categoryDialog.private"
            type="checkbox"
          >
          <span>
            <strong>{{ tr('rfm_make_category_private', 'Make this category private') }}</strong>
            <small>{{ tr('rfm_make_category_private_desc', 'When a category is marked as private, public access to the files within it is disabled. Only authorized users with access to the file manager will be able to view or download the files in that category.') }}</small>
          </span>
        </label>

        <p
          v-if="categoryDialog.error"
          class="rfm__category-form-error"
        >
          {{ categoryDialog.error }}
        </p>
      </div>

      <template #footer>
        <RBtn
          variant="outline"
          type="cancel"
          size="sm"
          :label="tr('rfm_cancel', 'Cancel')"
          @click="categoryDialog.open = false"
        />
        <RBtn
          variant="solid"
          type="view"
          size="sm"
          icon="i-lucide-check"
          :loading="categoryDialog.saving"
          :label="tr('rfm_save', 'Save')"
          @click="saveCategory"
        />
      </template>
    </RModal>

    <div
      v-if="confirmDialog.open"
      class="rfm__dialog-backdrop"
      @click.self="confirmDialog.open = false"
    >
      <div
        class="rfm__dialog"
        role="dialog"
        aria-modal="true"
      >
        <h3>{{ confirmDialog.title }}</h3>
        <p>{{ confirmDialog.body }}</p>
        <div class="rfm__dialog-actions">
          <button
            type="button"
            class="rfm__btn rfm__btn--ghost"
            @click="confirmDialog.open = false"
          >
            {{ tr('rfm_cancel', 'Cancel') }}
          </button>
          <button
            type="button"
            class="rfm__btn rfm__btn--danger"
            :disabled="confirmDialog.busy"
            @click="confirmAction"
          >
            {{ tr('rfm_confirm', 'Confirm') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rfm {
  --rfm-bg: var(--bg-content, #ffffff);
  --rfm-panel: var(--bg-wrapper, #f8fafc);
  --rfm-hover: var(--bg-hover, #f1f5f9);
  --rfm-border: var(--border-card, #e2e8f0);
  --rfm-text: var(--c-text, #0f172a);
  --rfm-muted: var(--c-muted, #64748b);
  --rfm-accent: var(--color-primary, #2563eb);
  --rfm-danger: var(--r-c-danger, #dc2626);
  display: flex;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color: var(--rfm-text);
  background: var(--rfm-bg);
  font-family: var(--font-400, inherit);
}

.rfm--inline { min-height: 560px; border: 1px solid var(--rfm-border); border-radius: 14px; }

.rfm__sidebar {
  display: flex;
  flex-direction: column;
  flex: 0 0 230px;
  min-height: 0;
  padding: 18px 12px 14px;
  background: var(--rfm-panel);
  border-right: 1px solid var(--rfm-border);
}

.rfm__brand { display: flex; align-items: center; gap: 10px; padding: 0 8px 18px; }
.rfm__brand-mark {
  display: inline-flex; align-items: center; justify-content: center;
  width: 34px; height: 34px; border-radius: 10px;
  color: var(--rfm-accent); background: color-mix(in srgb, var(--rfm-accent) 12%, transparent);
}
.rfm__brand-text { display: flex; flex-direction: column; min-width: 0; }
.rfm__brand-text strong { font-size: 0.9rem; font-weight: 650; }
.rfm__brand-text small { font-size: 0.68rem; color: var(--rfm-muted); }

.rfm__nav { display: grid; gap: 3px; }
.rfm__nav-item {
  display: flex; align-items: center; gap: 10px;
  width: 100%; padding: 8px 10px;
  font-size: 0.82rem; color: var(--rfm-muted);
  text-align: left; background: transparent; border: 0; border-radius: 8px;
  cursor: pointer;
}
.rfm__nav-item:hover { color: var(--rfm-text); background: var(--rfm-hover); }
.rfm__nav-item.is-active { color: var(--rfm-accent); background: color-mix(in srgb, var(--rfm-accent) 10%, transparent); font-weight: 600; }
.rfm__nav-item > span:nth-child(2) { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rfm__nav-count { font-size: 0.7rem; color: var(--rfm-muted); }

.rfm__sidebar-foot { display: grid; gap: 10px; margin-top: auto; padding-top: 14px; }
.rfm__storage { padding: 10px; border: 1px solid var(--rfm-border); border-radius: 10px; background: var(--rfm-bg); }
.rfm__storage-head { display: flex; justify-content: space-between; gap: 8px; font-size: 0.72rem; font-weight: 600; }
.rfm__storage-bar { height: 5px; margin: 8px 0 6px; overflow: hidden; background: var(--rfm-hover); border-radius: 999px; }
.rfm__storage-bar span { display: block; height: 100%; background: var(--rfm-accent); }
.rfm__storage small { font-size: 0.68rem; color: var(--rfm-muted); }

.rfm__main { display: flex; flex-direction: column; flex: 1 1 auto; min-width: 0; min-height: 0; }
.rfm__topbar {
  display: flex; align-items: center; justify-content: space-between; gap: 14px;
  padding: 12px 18px; border-bottom: 1px solid var(--rfm-border);
}
.rfm__topbar-left { min-width: 0; }
.rfm__breadcrumb { display: flex; align-items: center; gap: 4px; min-width: 0; }
.rfm__crumb {
  max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font-size: 0.82rem; color: var(--rfm-muted); background: transparent; border: 0; cursor: pointer;
}
.rfm__crumb:hover { color: var(--rfm-text); }
.rfm__crumb.is-current { color: var(--rfm-text); font-weight: 650; }
.rfm__crumb-sep { width: 14px; height: 14px; color: var(--rfm-muted); }
.rfm__view-title { margin: 0; font-size: 0.95rem; font-weight: 650; }
.rfm__topbar-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }

.rfm__search { position: relative; display: flex; align-items: center; gap: 6px; }
.rfm__search.is-open {
  min-width: 260px; padding: 0 8px;
  background: var(--rfm-panel); border: 1px solid var(--rfm-border); border-radius: 9px;
}
.rfm__search input {
  flex: 1; min-width: 0; height: 34px; padding: 0;
  font-size: 0.82rem; color: var(--rfm-text); background: transparent; border: 0; outline: 0;
}
.rfm__search-icon { width: 15px; height: 15px; color: var(--rfm-muted); }
.rfm__search-panel {
  position: absolute; top: calc(100% + 8px); left: 0; z-index: 20;
  width: 300px; padding: 10px;
  background: var(--rfm-bg); border: 1px solid var(--rfm-border); border-radius: 12px;
  box-shadow: 0 18px 40px rgb(15 23 42 / 16%);
}
.rfm__search-group + .rfm__search-group { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--rfm-border); }
.rfm__search-group h4 { margin: 0 0 6px; font-size: 0.68rem; font-weight: 650; color: var(--rfm-muted); text-transform: uppercase; letter-spacing: 0.04em; }
.rfm__search-group button {
  display: flex; align-items: center; gap: 8px; width: 100%; padding: 7px 8px;
  font-size: 0.8rem; color: var(--rfm-text); text-align: left; background: transparent; border: 0; border-radius: 7px; cursor: pointer;
}
.rfm__search-group button:hover { background: var(--rfm-hover); }

.rfm__btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 7px;
  height: 34px; padding: 0 12px;
  font-size: 0.8rem; font-weight: 550; white-space: nowrap;
  color: var(--rfm-text); background: var(--rfm-bg);
  border: 1px solid var(--rfm-border); border-radius: 8px; cursor: pointer;
}
.rfm__btn:hover { background: var(--rfm-hover); }
.rfm__btn:disabled { opacity: 0.55; cursor: not-allowed; }
.rfm__btn--primary { color: #fff; background: var(--rfm-accent); border-color: var(--rfm-accent); }
.rfm__btn--primary:hover { filter: brightness(0.96); }
.rfm__btn--ghost { background: transparent; }
.rfm__btn--danger { color: var(--rfm-danger); border-color: color-mix(in srgb, var(--rfm-danger) 35%, transparent); background: transparent; }
.rfm__btn--danger:hover { background: color-mix(in srgb, var(--rfm-danger) 9%, transparent); }
.rfm__btn--caret { width: 30px; padding: 0; border-radius: 0 8px 8px 0; }
.rfm__upload { position: relative; display: flex; }
.rfm__upload > .rfm__btn:first-child { border-radius: 8px 0 0 8px; border-right: 0; }
.rfm__menu {
  position: absolute; top: calc(100% + 8px); right: 0; z-index: 30;
  width: 230px; padding: 6px;
  background: var(--rfm-bg); border: 1px solid var(--rfm-border); border-radius: 12px;
  box-shadow: 0 18px 40px rgb(15 23 42 / 16%);
}
.rfm__menu button {
  display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px 9px;
  font-size: 0.8rem; color: var(--rfm-text); text-align: left; background: transparent; border: 0; border-radius: 7px; cursor: pointer;
}
.rfm__menu button:hover { background: var(--rfm-hover); }
.rfm__menu-sep { height: 1px; margin: 6px 0; background: var(--rfm-border); }
.rfm__menu-field { display: grid; gap: 5px; padding: 6px 9px 2px; font-size: 0.7rem; color: var(--rfm-muted); }
.rfm__menu-field select {
  height: 30px; padding: 0 8px; font-size: 0.78rem; color: var(--rfm-text);
  background: var(--rfm-panel); border: 1px solid var(--rfm-border); border-radius: 7px;
}

.rfm__icon-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; padding: 0;
  color: var(--rfm-muted); background: transparent; border: 0; border-radius: 8px; cursor: pointer;
}
.rfm__icon-btn:hover { color: var(--rfm-text); background: var(--rfm-hover); }
.rfm__icon-btn.is-active {
  color: var(--rfm-accent);
  background: color-mix(in srgb, var(--rfm-accent) 12%, transparent);
}

.rfm__view-toggle { display: inline-flex; padding: 2px; background: var(--rfm-panel); border: 1px solid var(--rfm-border); border-radius: 8px; }
.rfm__view-toggle button {
  display: inline-flex; align-items: center; justify-content: center;
  width: 30px; height: 28px; padding: 0;
  color: var(--rfm-muted); background: transparent; border: 0; border-radius: 6px; cursor: pointer;
}
.rfm__view-toggle button.is-active { color: var(--rfm-text); background: var(--rfm-bg); box-shadow: 0 1px 3px rgb(15 23 42 / 12%); }

.rfm__actionbar {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 8px 18px; border-bottom: 1px solid var(--rfm-border);
  background: color-mix(in srgb, var(--rfm-accent) 5%, var(--rfm-bg));
}
.rfm__actionbar-info { display: flex; align-items: center; gap: 6px; min-width: 0; font-size: 0.78rem; color: var(--rfm-muted); }
.rfm__actionbar-info strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--rfm-text); }
.rfm__actionbar-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
.rfm__actionbar-actions :deep(.r-group-actions) { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

:global(.rfm-filters-panel) {
  --rfm-text: var(--c-text);
  --rfm-muted: var(--c-muted);
  --rfm-border: var(--c-border);
  --rfm-bg: var(--c-surface);
  --rfm-panel: var(--c-surface);
  --rfm-hover: color-mix(in srgb, var(--c-accent) 8%, transparent);
  --rfm-accent: var(--c-accent);
}
:global(.rfm-filters-panel .rpp-panel__body) { display: grid; gap: 12px; }
:global(.rfm__filters-head) {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  flex: 1; min-width: 0; font-size: 0.8rem;
}
:global(.rfm__filters-grid) { display: grid; grid-template-columns: repeat(auto-fit, minmax(145px, 1fr)); gap: 8px; }
:global(.rfm__filters-grid label) { display: grid; gap: 4px; font-size: 0.68rem; color: var(--rfm-muted); }
:global(.rfm__filters-grid select) {
  height: 30px; padding: 0 8px; font-size: 0.76rem; color: var(--rfm-text);
  background: var(--rfm-bg); border: 1px solid var(--rfm-border); border-radius: 7px;
}
:global(.rfm__filter-kinds) { display: flex; flex-wrap: wrap; gap: 6px; }
:global(.rfm__filter-kinds button) {
  padding: 5px 9px; font-size: 0.72rem; color: var(--rfm-muted);
  background: transparent; border: 1px solid var(--rfm-border); border-radius: 999px; cursor: pointer;
}
:global(.rfm__filter-kinds button:hover) { color: var(--rfm-text); background: var(--rfm-hover); }
:global(.rfm__filter-kinds button.is-active) {
  color: var(--rfm-accent); background: color-mix(in srgb, var(--rfm-accent) 10%, transparent);
  border-color: color-mix(in srgb, var(--rfm-accent) 38%, var(--rfm-border));
}

.rfm__options {
  display: grid; gap: 10px; min-width: 220px; padding: 12px;
  background: var(--rfm-bg); border: 1px solid var(--rfm-border); border-radius: 12px;
  box-shadow: 0 18px 40px rgb(15 23 42 / 16%);
}
.rfm__options > strong { font-size: 0.78rem; }
.rfm__options-field { display: grid; gap: 4px; font-size: 0.7rem; color: var(--rfm-muted); }
.rfm__options-field select {
  height: 30px; padding: 0 8px; font-size: 0.76rem; color: var(--rfm-text);
  background: var(--rfm-panel); border: 1px solid var(--rfm-border); border-radius: 7px;
}
.rfm__options-group { display: grid; gap: 5px; font-size: 0.7rem; color: var(--rfm-muted); }
.rfm__options-check { display: flex; align-items: center; gap: 7px; font-size: 0.76rem; color: var(--rfm-text); }
.rfm__options-check input { width: 14px; height: 14px; accent-color: var(--rfm-accent); }

.rfm__error { margin: 10px 18px 0; padding: 9px 12px; font-size: 0.8rem; color: var(--rfm-danger); background: color-mix(in srgb, var(--rfm-danger) 8%, transparent); border: 1px solid color-mix(in srgb, var(--rfm-danger) 30%, transparent); border-radius: 8px; }

.rfm__body { display: flex; flex: 1 1 auto; min-height: 0; }
.rfm__content { flex: 1 1 auto; min-width: 0; overflow: auto; padding: 18px; }
.rfm__state {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  min-height: 320px; padding: 30px; text-align: center; color: var(--rfm-muted);
}
.rfm__state > svg { width: 36px; height: 36px; }
.rfm__state strong { font-size: 0.95rem; color: var(--rfm-text); }
.rfm__state span { max-width: 360px; font-size: 0.8rem; }
.rfm__spin { animation: rfm-spin 0.9s linear infinite; }
@keyframes rfm-spin { to { transform: rotate(360deg); } }

.rfm__section-title { margin: 0 0 10px; font-size: 0.78rem; font-weight: 650; color: var(--rfm-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.rfm__section-title span { margin-left: 5px; color: var(--rfm-muted); }
.rfm__folders { margin-bottom: 20px; }
.rfm__folder-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 10px; }
.rfm__folder-card {
  position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 3px;
  min-width: 0; padding: 12px; text-align: left;
  background: var(--rfm-panel); border: 1px solid var(--rfm-border); border-radius: 10px; cursor: pointer;
}
.rfm__folder-card:hover { border-color: color-mix(in srgb, var(--rfm-accent) 40%, var(--rfm-border)); background: var(--rfm-hover); }
.rfm__folder-card.is-selected { border-color: var(--rfm-accent); box-shadow: 0 0 0 2px color-mix(in srgb, var(--rfm-accent) 22%, transparent); }
.rfm__folder-icon { display: inline-flex; color: #eab308; }
.rfm__folder-name { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.82rem; font-weight: 600; }
.rfm__folder-meta { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.7rem; color: var(--rfm-muted); }
.rfm__folder-actions { position: absolute; top: 6px; right: 6px; display: none; gap: 2px; }
.rfm__folder-card:hover .rfm__folder-actions { display: flex; }
.rfm__folder-actions button, .rfm__card-actions button, .rfm__row-actions button {
  display: inline-flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; padding: 0;
  color: var(--rfm-muted); background: var(--rfm-bg); border: 1px solid var(--rfm-border); border-radius: 7px; cursor: pointer;
}
.rfm__folder-actions button:hover, .rfm__card-actions button:hover, .rfm__row-actions button:hover { color: var(--rfm-text); background: var(--rfm-hover); }

.rfm__files-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.rfm__link { padding: 0; font-size: 0.75rem; color: var(--rfm-accent); background: transparent; border: 0; cursor: pointer; }
.rfm__link:disabled { opacity: 0.5; cursor: wait; }

.rfm__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 12px; }
.rfm__grid.is-small { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); }
.rfm__grid.is-large { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }
.rfm__grid.keep-aspect .rfm__thumb img { object-fit: contain; }
.rfm__card {
  min-width: 0; overflow: hidden;
  background: var(--rfm-panel); border: 1px solid var(--rfm-border); border-radius: 12px; cursor: pointer;
  transition: border-color 120ms ease, box-shadow 120ms ease, transform 120ms ease;
}
.rfm__card:hover { border-color: color-mix(in srgb, var(--rfm-accent) 35%, var(--rfm-border)); box-shadow: 0 8px 22px rgb(15 23 42 / 8%); transform: translateY(-1px); }
.rfm__card.is-selected { border-color: var(--rfm-accent); box-shadow: 0 0 0 2px color-mix(in srgb, var(--rfm-accent) 22%, transparent); }
.rfm__card.is-disabled { opacity: 0.5; }
.rfm__card.is-deleted { opacity: 0.72; }
.rfm__thumb {
  position: relative; display: flex; align-items: center; justify-content: center;
  aspect-ratio: 4 / 3; overflow: hidden; background: var(--rfm-hover);
}
.rfm__thumb img { width: 100%; height: 100%; object-fit: cover; }
.rfm__thumb-icon { display: inline-flex; color: var(--rfm-muted); }
.rfm__thumb-icon > svg { width: 34px; height: 34px; }
.rfm__badge {
  position: absolute; top: 7px; left: 7px; padding: 2px 6px;
  font-size: 0.62rem; font-weight: 600; color: var(--rfm-text);
  background: color-mix(in srgb, var(--rfm-bg) 88%, transparent); border-radius: 999px;
}
.rfm__badge--danger { color: var(--rfm-danger); }
.rfm__check {
  position: absolute; top: 7px; right: 7px;
  display: inline-flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; padding: 0;
  color: #fff; background: color-mix(in srgb, var(--rfm-bg) 70%, transparent);
  border: 1px solid var(--rfm-border); border-radius: 6px; cursor: pointer;
}
.rfm__card.is-selected .rfm__check { background: var(--rfm-accent); border-color: var(--rfm-accent); }
.rfm__card-actions {
  position: absolute; right: 7px; bottom: 7px; display: none; gap: 4px;
}
.rfm__card:hover .rfm__card-actions { display: flex; }
.rfm__card-body { display: grid; gap: 3px; padding: 9px 10px 10px; }
.rfm__name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.78rem; font-weight: 600; }
.rfm__meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 0.68rem; color: var(--rfm-muted); }
.rfm__type { padding: 1px 5px; font-size: 0.62rem; font-weight: 650; color: var(--rfm-muted); background: var(--rfm-bg); border: 1px solid var(--rfm-border); border-radius: 4px; }

.rfm__list { display: grid; gap: 2px; }
.rfm__list-head, .rfm__row {
  display: grid; grid-template-columns: 34px minmax(160px, 1fr) 80px 80px 110px 92px;
  align-items: center; gap: 8px; padding: 7px 8px;
}
.rfm__list-head { font-size: 0.68rem; font-weight: 650; color: var(--rfm-muted); text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid var(--rfm-border); }
.rfm__row { font-size: 0.78rem; border-radius: 8px; cursor: pointer; }
.rfm__row:hover { background: var(--rfm-hover); }
.rfm__row.is-selected { background: color-mix(in srgb, var(--rfm-accent) 9%, transparent); }
.rfm__row.is-disabled { opacity: 0.5; }
.rfm__row.is-deleted { opacity: 0.72; }
.rfm__row-check {
  display: inline-flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; padding: 0;
  color: #fff; background: transparent; border: 1px solid var(--rfm-border); border-radius: 6px; cursor: pointer;
}
.rfm__row.is-selected .rfm__row-check { background: var(--rfm-accent); border-color: var(--rfm-accent); }
.rfm__row-name { display: flex; align-items: center; gap: 8px; min-width: 0; }
.rfm__row-name span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rfm__row-actions { display: flex; justify-content: flex-end; gap: 4px; }

.rfm__details {
  display: flex; flex-direction: column;
  flex: 0 0 290px; min-height: 0; overflow: auto;
  padding: 14px; border-left: 1px solid var(--rfm-border); background: var(--rfm-panel);
}
.rfm__details-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; font-size: 0.82rem; }
.rfm__details-preview {
  position: relative;
  display: flex; align-items: center; justify-content: center;
  min-height: 150px; max-height: 220px; overflow: hidden;
  background: var(--rfm-bg); border: 1px solid var(--rfm-border); border-radius: 10px;
}
.rfm__details-preview img { width: 100%; height: 100%; max-height: 220px; object-fit: contain; }
.rfm__details-preview > svg { width: 42px; height: 42px; color: var(--rfm-muted); }
.rfm__folder-preview > svg { width: 54px; height: 54px; color: #eab308; }
.rfm__preview-open {
  position: absolute; right: 8px; bottom: 8px;
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; padding: 0;
  color: var(--rfm-text); background: color-mix(in srgb, var(--rfm-bg) 82%, transparent);
  border: 1px solid var(--rfm-border); border-radius: 8px; cursor: pointer;
}
.rfm__preview-open:hover { background: var(--rfm-hover); }
.rfm__details-name { margin: 10px 0; font-size: 0.86rem; font-weight: 650; word-break: break-word; }
.rfm__details-tabs { margin-bottom: 8px; }
.rfm__details-scroll { flex: 1 1 auto; min-height: 0; overflow: auto; padding-right: 2px; }
.rfm__detail-section { display: grid; gap: 7px; padding: 12px 0; border-top: 1px solid var(--rfm-border); }
.rfm__detail-section:first-child { padding-top: 0; border-top: 0; }
.rfm__detail-section h4 {
  display: flex; align-items: center; gap: 6px; margin: 0;
  font-size: 0.7rem; font-weight: 650; color: var(--rfm-muted);
  text-transform: uppercase; letter-spacing: 0.04em;
}
.rfm__detail-section h4 small { font-size: 0.62rem; font-weight: 500; letter-spacing: 0; text-transform: none; opacity: 0.8; }
.rfm__muted { margin: 0; font-size: 0.74rem; color: var(--rfm-muted); }
.rfm__break { word-break: break-all; }
.rfm__details-grid { display: grid; grid-template-columns: 96px 1fr; gap: 7px 10px; font-size: 0.74rem; }
.rfm__details-grid span { color: var(--rfm-muted); }
.rfm__details-grid strong { font-weight: 550; word-break: break-word; }
.rfm__details-actions { display: grid; gap: 6px; margin-top: 14px; }
.rfm__details-actions .rfm__btn { justify-content: flex-start; width: 100%; }
.rfm__details-actions :deep(.r-btn-action) { justify-content: flex-start; width: 100%; }
.rfm__recent-list { display: grid; gap: 4px; }
.rfm__recent {
  display: grid; grid-template-columns: 18px minmax(0, 1fr) auto; align-items: center; gap: 6px;
  padding: 6px 7px; font-size: 0.72rem; text-align: left; color: var(--rfm-text);
  background: transparent; border: 0; border-radius: 6px; cursor: pointer;
}
.rfm__recent:hover { background: var(--rfm-hover); }
.rfm__recent span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rfm__recent small { font-size: 0.64rem; color: var(--rfm-muted); }
.rfm__custom-field { display: grid; grid-template-columns: 90px minmax(0, 1fr) 26px; gap: 5px; align-items: center; }
.rfm__custom-field input {
  min-width: 0; height: 30px; padding: 0 8px;
  font-size: 0.74rem; color: var(--rfm-text);
  background: var(--rfm-bg); border: 1px solid var(--rfm-border); border-radius: 7px; outline: 0;
}
.rfm__custom-field input:focus { border-color: var(--rfm-accent); }
.rfm__version { display: flex; justify-content: space-between; gap: 10px; padding: 8px; border: 1px solid var(--rfm-border); border-radius: 8px; font-size: 0.74rem; }
.rfm__version div { display: grid; gap: 2px; }
.rfm__version small { font-size: 0.66rem; color: var(--rfm-muted); }
.rfm__version-actions { display: flex; gap: 6px; margin-top: 6px; }
.rfm__url-row { display: grid; gap: 6px; font-size: 0.72rem; }

.rfm__selection {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 10px 18px; font-size: 0.78rem;
  border-top: 1px solid var(--rfm-border); background: var(--rfm-panel);
}
.rfm__selection-actions { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }

.rfm__uploads {
  position: absolute; right: 16px; bottom: 16px; z-index: 40;
  display: grid; gap: 7px; width: min(320px, calc(100% - 32px));
}
.rfm__upload-item {
  display: grid; grid-template-columns: 1fr 28px; gap: 6px 8px; align-items: center;
  padding: 9px 10px;
  background: var(--rfm-bg); border: 1px solid var(--rfm-border); border-radius: 10px;
  box-shadow: 0 12px 30px rgb(15 23 42 / 14%);
}
.rfm__upload-text { display: grid; gap: 2px; min-width: 0; }
.rfm__upload-text span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.76rem; font-weight: 600; }
.rfm__upload-text small { font-size: 0.66rem; color: var(--rfm-muted); }
.rfm__upload-track { grid-column: 1 / -1; height: 4px; overflow: hidden; background: var(--rfm-hover); border-radius: 999px; }
.rfm__upload-track span { display: block; height: 100%; background: var(--rfm-accent); transition: width 160ms linear; }
.rfm__upload-item.is-error .rfm__upload-track span { background: var(--rfm-danger); }

.rfm__toast {
  position: fixed; top: 20px; left: 50%; z-index: 10000; transform: translateX(-50%);
  padding: 9px 14px; font-size: 0.8rem; color: #fff;
  background: #0f172a; border-radius: 9px; box-shadow: 0 12px 30px rgb(15 23 42 / 22%);
}
.rfm__toast.is-error { background: var(--rfm-danger); }
.rfm__toast.is-success { background: #15803d; }

.rfm__dialog-backdrop {
  position: fixed; inset: 0; z-index: 10001;
  display: flex; align-items: center; justify-content: center; padding: 20px;
  background: rgb(15 23 42 / 42%);
}
.rfm__dialog {
  display: grid; gap: 12px; width: min(420px, 100%);
  padding: 18px;
  background: var(--rfm-bg); border: 1px solid var(--rfm-border); border-radius: 14px;
  box-shadow: 0 24px 60px rgb(15 23 42 / 26%);
}
.rfm__dialog h3 { margin: 0; font-size: 0.95rem; }
.rfm__dialog p { margin: 0; font-size: 0.8rem; color: var(--rfm-muted); }
.rfm__dialog label { display: grid; gap: 5px; font-size: 0.74rem; color: var(--rfm-muted); }
.rfm__dialog input, .rfm__dialog textarea {
  width: 100%; padding: 8px 10px;
  font-size: 0.82rem; color: var(--rfm-text);
  background: var(--rfm-panel); border: 1px solid var(--rfm-border); border-radius: 8px; outline: 0;
}
.rfm__dialog input:focus, .rfm__dialog textarea:focus { border-color: var(--rfm-accent); }
.rfm__dialog-error { color: var(--rfm-danger) !important; }
.rfm__dialog-actions { display: flex; justify-content: flex-end; gap: 8px; }

.rfm__settings { flex: 1 1 auto; overflow: auto; padding: 20px; }
.rfm__settings-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
.rfm__settings-head h2 { margin: 0 0 4px; font-size: 1rem; }
.rfm__settings-head p { max-width: 620px; margin: 0; font-size: 0.8rem; color: var(--rfm-muted); }
.rfm__tabs { display: flex; gap: 4px; margin: 18px 0; border-bottom: 1px solid var(--rfm-border); }
.rfm__tabs button {
  padding: 8px 10px; font-size: 0.8rem; color: var(--rfm-muted);
  background: transparent; border: 0; border-bottom: 2px solid transparent; cursor: pointer;
}
.rfm__tabs button.is-active { color: var(--rfm-text); border-bottom-color: var(--rfm-accent); font-weight: 600; }
.rfm__category-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
.rfm__category-card {
  display: flex; flex-direction: column; gap: 9px; padding: 14px;
  background: var(--rfm-panel); border: 1px solid var(--rfm-border); border-radius: 12px;
}
.rfm__category-head { display: flex; align-items: center; gap: 9px; }
.rfm__category-icon { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; color: var(--rfm-accent); background: color-mix(in srgb, var(--rfm-accent) 10%, transparent); border-radius: 8px; }
.rfm__category-head h3 { margin: 0; font-size: 0.86rem; }
.rfm__category-head code { font-size: 0.62rem; color: var(--rfm-muted); }
.rfm__category-private {
  display: inline-flex; align-items: center; gap: 4px; margin-left: auto;
  padding: 3px 7px; font-size: 0.64rem; font-weight: 600; color: var(--rfm-accent);
  background: color-mix(in srgb, var(--rfm-accent) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--rfm-accent) 24%, var(--rfm-border));
  border-radius: 999px;
}
.rfm__category-label { margin: 0; font-size: 0.68rem; font-weight: 600; color: var(--rfm-muted); text-transform: uppercase; letter-spacing: 0.04em; }
.rfm__chips { display: flex; flex-wrap: wrap; gap: 4px; }
.rfm__chips span { padding: 2px 6px; font-size: 0.66rem; color: var(--rfm-muted); background: var(--rfm-bg); border: 1px solid var(--rfm-border); border-radius: 5px; }
.rfm__selected-extensions span { display: inline-flex; align-items: center; gap: 4px; padding-right: 3px; }
.rfm__selected-extensions button {
  display: inline-flex; align-items: center; justify-content: center;
  width: 14px; height: 14px; padding: 0; color: inherit;
  background: transparent; border: 0; cursor: pointer;
}
.rfm__selected-extensions button:hover { color: var(--rfm-danger); }
.rfm__category-actions { display: flex; gap: 6px; margin-top: auto; padding-top: 4px; }
.rfm__category-actions button {
  display: inline-flex; align-items: center; gap: 5px; padding: 5px 8px;
  font-size: 0.72rem; color: var(--rfm-muted); background: transparent; border: 1px solid var(--rfm-border); border-radius: 7px; cursor: pointer;
}
.rfm__category-actions button:hover { color: var(--rfm-text); background: var(--rfm-hover); }
.rfm__category-actions button.is-danger { color: var(--rfm-danger); }

:global(.rm-body.rfm-category-modal-body) {
  --border-color: var(--c-border);
  --text: var(--c-text);
  --color-text-primary: var(--c-text);
  --general-text-color: var(--c-muted);
  --primary-color: var(--c-accent);
  --muted: var(--c-muted);
  --border: var(--c-border);
  --color-bg: var(--c-surface);
  padding: 18px 20px 20px;
}
:global(.rfm__category-form) { display: grid; gap: 16px; }
:global(.rfm__category-form .input-group input) { font-size: 0.84rem; }
:global(.rfm__category-form .input-group.focused input) { border-color: var(--c-accent) !important; }
:global(.rfm__extensions-field) { display: grid; gap: 8px; }
:global(.rfm__field-label) { font-size: 0.76rem; font-weight: 600; color: var(--c-muted); }
:global(.rfm__extension-tags) { width: 100%; }
:global(.rfm__extension-tags .ui-rinputtag-base) {
  min-height: 42px !important;
  padding: 6px 10px !important;
  background: var(--c-surface) !important;
  border-color: var(--c-border) !important;
  border-radius: 12px !important;
}
:global(.rfm__extension-tags .ui-rinputtag-item) {
  display: inline-flex; align-items: center; gap: 4px;
  height: auto !important; padding: 4px 8px !important;
  font-size: 0.72rem !important; font-weight: 600;
  color: var(--c-text) !important;
  background: var(--c-hover, color-mix(in srgb, var(--c-muted) 12%, transparent)) !important;
  border: 1px solid var(--c-border) !important;
  border-radius: 999px !important;
}
:global(.rfm__extension-tags .ui-rinputtag-input) { min-width: 80px; font-size: 0.84rem !important; }
:global(.rfm__extension-tags .ui-rinputtag-suggestions) {
  display: flex; flex-wrap: wrap; gap: 6px; z-index: 5555555555555;
  max-height: 220px; padding: 8px; overflow-y: auto;
}
:global(.rfm__extension-tags .ui-rinputtag-suggestion-item) {
  display: inline-flex; width: auto !important; padding: 0 !important;
  background: transparent !important; border-radius: 999px !important;
}
:global(.rfm__extension-tags .ui-rinputtag-suggestion-item:hover) { background: transparent !important; }
:global(.rfm__extension-tags .ui-rinputtag-suggestion-state) { padding: 12px 8px; font-size: 0.76rem; }
:global(.rfm__extension-chip) {
  display: inline-flex; align-items: center; gap: 4px;
  height: auto !important; padding: 5px 9px !important;
  font-size: 0.72rem; color: var(--c-muted);
  background: transparent !important; border: 1px solid var(--c-border);
  border-radius: 999px !important; box-shadow: none !important; cursor: pointer;
}
:global(.rfm__extension-chip:hover) { color: var(--c-text); background: var(--c-hover) !important; }
:global(.rfm__private-toggle) {
  display: flex; align-items: flex-start; gap: 10px; padding: 12px;
  background: color-mix(in srgb, var(--c-accent) 4%, transparent);
  border: 1px solid var(--c-border); border-radius: 12px; cursor: pointer;
}
:global(.rfm__private-toggle input) {
  flex-shrink: 0; width: 16px; height: 16px; margin-top: 2px;
  accent-color: var(--c-accent);
}
:global(.rfm__private-toggle strong) { display: block; font-size: 0.8rem; color: var(--c-text); }
:global(.rfm__private-toggle small) { display: block; margin-top: 3px; font-size: 0.72rem; line-height: 1.45; color: var(--c-muted); }
:global(.rfm__category-form-error) { margin: 0; font-size: 0.76rem; color: var(--c-danger, #dc2626); }

.rfm__permissions { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; min-height: 280px; text-align: center; color: var(--rfm-muted); }
.rfm__permissions > svg { width: 38px; height: 38px; }
.rfm__permissions h3 { margin: 0; font-size: 0.95rem; color: var(--rfm-text); }
.rfm__permissions p { max-width: 380px; margin: 0; font-size: 0.8rem; }

.rfm__preview {
  position: fixed; inset: 0; z-index: 10002;
  display: flex; align-items: center; justify-content: center; padding: 18px;
  background: rgb(15 23 42 / 72%);
  backdrop-filter: blur(4px);
}
.rfm__preview-panel {
  display: flex; flex-direction: column;
  width: min(1200px, 100%); height: min(820px, 100%); overflow: hidden;
  background: var(--rfm-bg); border: 1px solid var(--rfm-border); border-radius: 16px;
  box-shadow: 0 28px 70px rgb(15 23 42 / 38%);
}
.rfm__preview-head {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 10px 14px; border-bottom: 1px solid var(--rfm-border);
}
.rfm__preview-title { display: grid; gap: 2px; min-width: 0; }
.rfm__preview-title strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.86rem; }
.rfm__preview-title small { font-size: 0.7rem; color: var(--rfm-muted); }
.rfm__preview-tools { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
.rfm__zoom-value { min-width: 44px; font-size: 0.72rem; color: var(--rfm-muted); text-align: center; }
.rfm__preview-body { display: flex; flex: 1 1 auto; min-height: 0; }
.rfm__preview-stage {
  display: flex; align-items: center; justify-content: center; flex: 1 1 auto;
  min-width: 0; overflow: auto; padding: 18px;
  background: color-mix(in srgb, var(--rfm-text) 6%, var(--rfm-panel));
}
.rfm__preview-stage img { max-width: 100%; max-height: 100%; object-fit: contain; transform-origin: center; transition: transform 120ms ease; }
.rfm__preview-file { display: grid; justify-items: center; gap: 8px; color: var(--rfm-muted); }
.rfm__preview-file > svg { width: 54px; height: 54px; }
.rfm__preview-details {
  display: flex; flex-direction: column; flex: 0 0 300px; min-height: 0;
  padding: 14px; overflow: auto; border-left: 1px solid var(--rfm-border); background: var(--rfm-panel);
}
.rfm__preview-details h3 { margin: 0 0 8px; font-size: 0.86rem; word-break: break-word; }
.rfm__preview-details .rfm__details-actions { margin-top: auto; }

@media (max-width: 900px) {
  .rfm__sidebar { flex-basis: 190px; }
  .rfm__details { position: absolute; inset: 0 0 0 auto; z-index: 15; width: min(320px, 100%); box-shadow: -18px 0 40px rgb(15 23 42 / 16%); }
  .rfm--details .rfm__main { position: relative; }
  .rfm__preview-details { flex-basis: 260px; }
}

@media (max-width: 680px) {
  .rfm__sidebar { display: none; }
  .rfm__topbar { flex-direction: column; align-items: stretch; }
  .rfm__topbar-actions { justify-content: flex-start; }
  .rfm__actionbar { flex-direction: column; align-items: stretch; }
  .rfm__actionbar-actions { justify-content: flex-start; }
  .rfm__grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }
  .rfm__grid.is-small { grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); }
  .rfm__grid.is-large { grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); }
  .rfm__list-head, .rfm__row { grid-template-columns: 30px minmax(120px, 1fr) 70px 80px; }
  .rfm__list-head > :nth-child(4), .rfm__list-head > :nth-child(5), .rfm__row > :nth-child(4), .rfm__row > :nth-child(5) { display: none; }
  .rfm__preview { padding: 0; }
  .rfm__preview-panel { width: 100%; height: 100%; border-radius: 0; }
  .rfm__preview-body { flex-direction: column; }
  .rfm__preview-details { flex: 1 1 auto; border-left: 0; border-top: 1px solid var(--rfm-border); }
  .rfm__custom-field { grid-template-columns: 70px minmax(0, 1fr) 26px; }
}
</style>
