/**
 * RInputTags — TypeScript interfaces
 * Mirrors 100% of UInputTags v4.8.2 API + async/search extensions.
 */

// ── Re-exported so consumers can import from one place ──────────────────────
export type RInputTagsColor =
  | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

export type RInputTagsVariant = 'outline' | 'soft' | 'subtle' | 'ghost' | 'none'

export type RInputTagsSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/** Shape accepted by the `avatar` prop */
export interface RInputTagsAvatar {
  src?: string
  alt?: string
  loading?: 'lazy' | 'eager'
  [key: string]: unknown
}

/** Shape of the `ui` slot-class override prop */
export interface RInputTagsUI {
  root?: string | string[]
  base?: string | string[]
  leading?: string | string[]
  leadingIcon?: string | string[]
  leadingAvatar?: string | string[]
  leadingAvatarSize?: string | string[]
  trailing?: string | string[]
  trailingIcon?: string | string[]
  item?: string | string[]
  itemText?: string | string[]
  itemDelete?: string | string[]
  itemDeleteIcon?: string | string[]
  input?: string | string[]
}

/**
 * Full props interface for RInputTags<T = string>.
 * All props correspond 1:1 to UInputTags v4.8.2 unless
 * marked with  ── RInputTags addition.
 */
export interface RInputTagsProps<T = string> {
  // ── v-model / value ──────────────────────────────────────────────────────
  modelValue?: T[] | null
  defaultValue?: T[]

  // ── UInputTags native props ───────────────────────────────────────────────
  as?: string
  placeholder?: string
  maxLength?: number
  color?: RInputTagsColor
  variant?: RInputTagsVariant
  size?: RInputTagsSize
  autofocus?: boolean
  autofocusDelay?: number
  deleteIcon?: string
  highlight?: boolean
  fixed?: boolean
  addOnPaste?: boolean
  addOnTab?: boolean
  addOnBlur?: boolean
  duplicate?: boolean
  disabled?: boolean
  delimiter?: string | RegExp
  max?: number
  id?: string
  name?: string
  required?: boolean
  readonly?: boolean | 'true' | 'false'
  autocomplete?: 'on' | 'off' | (string & {})
  list?: string
  convertValue?: (value: string) => T
  displayValue?: (value: T) => string
  icon?: string
  avatar?: RInputTagsAvatar
  leading?: boolean
  leadingIcon?: string
  trailing?: boolean
  trailingIcon?: string
  loading?: boolean
  loadingIcon?: string
  ui?: RInputTagsUI

  // ── RInputTags additions ─────────────────────────────────────────────────

  /**
   * Async function called on each search term change.
   * Return an array of suggestions to show in the dropdown.
   * When provided, enables autocomplete suggestion mode.
   */
  fetchSuggestions?: (query: string) => Promise<T[]>

  /**
   * Debounce delay (ms) for `fetchSuggestions` calls.
   * @default 300
   */
  debounce?: number

  /**
   * Local suggestions array. Filtered client-side by `filterFn`
   * when no `fetchSuggestions` is provided.
   */
  suggestions?: T[]

  /**
   * Custom client-side filter applied to `suggestions`.
   * Defaults to case-insensitive string includes.
   */
  filterFn?: (item: T, query: string) => boolean

  /**
   * When true, typing a value not present in suggestions
   * creates a new tag on Enter/delimiter. When false (default),
   * only values from suggestions can be added.
   * Has no effect when neither `suggestions` nor `fetchSuggestions` is set.
   * @default true
   */
  createNew?: boolean

  /**
   * Maximum number of suggestions shown in the dropdown.
   * @default 20
   */
  maxSuggestions?: number

  /** Label shown in the dropdown when no suggestions match. */
  emptyLabel?: string
}

/** All emitted events */
export interface RInputTagsEmits<T = string> {
  'update:modelValue': [value: T[]]
  change: [event: Event]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
  invalid: [value: T]
  addTag: [value: T]
  removeTag: [value: T]
  /** ── RInputTags addition: fired when async fetch starts */
  'fetch:start': [query: string]
  /** ── RInputTags addition: fired when async fetch completes */
  'fetch:done': [items: T[]]
  /** ── RInputTags addition: fired on fetch error */
  'fetch:error': [error: unknown]
}

/** Slot scope types */
export interface RInputTagsSlots<T = string> {
  /** Leading content (icon/avatar area) — receives { ui } */
  leading: (props: { ui: Record<string, string> }) => unknown
  /** Default slot — injected between tags and input */
  default: (props: { ui: Record<string, string> }) => unknown
  /** Trailing content — receives { ui } */
  trailing: (props: { ui: Record<string, string> }) => unknown
  /** Custom tag text render — receives { item, index, ui } */
  'item-text': (props: { item: T; index: number; ui: Record<string, string> }) => unknown
  /** Custom tag delete button render — receives { item, index, ui } */
  'item-delete': (props: { item: T; index: number; ui: Record<string, string> }) => unknown
  /** ── RInputTags addition: custom suggestion item render */
  suggestion: (props: { item: T; query: string; active: boolean }) => unknown
  /** ── RInputTags addition: empty state in suggestion dropdown */
  empty: (props: { query: string }) => unknown
}
