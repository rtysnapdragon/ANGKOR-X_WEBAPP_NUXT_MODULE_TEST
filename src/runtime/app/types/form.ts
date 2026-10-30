// ============================================================
// SARIKA — Form Builder Types
// ============================================================

export type FieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'url'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'toggle'
  | 'date'
  | 'datetime'
  | 'file'
  | 'avatar'
  | 'color'
  | 'range'
  | 'hidden'
  | 'divider'
  | 'heading'

export interface SelectOption {
  label: string
  value: string | number | boolean
  icon?: string
  disabled?: boolean
}

export interface FieldValidation {
  required?:  boolean
  min?:       number
  max?:       number
  minLength?: number
  maxLength?: number
  pattern?:   string
  email?:     boolean
  url?:       boolean
  custom?:    (value: unknown) => boolean | string
}

export interface FormField {
  key:          string
  type:         FieldType
  label?:       string           // i18n key or plain string
  placeholder?: string           // i18n key or plain string
  hint?:        string
  icon?:        string
  prefix?:      string
  suffix?:      string
  options?:     SelectOption[]
  optionsUrl?:  string           // API endpoint to fetch options
  validation?:  FieldValidation
  disabled?:    boolean
  readonly?:    boolean
  hidden?:      boolean
  cols?:        1 | 2 | 3 | 4   // grid columns span (default 1)
  rows?:        number           // for textarea
  accept?:      string           // for file input
  multiple?:    boolean
  defaultValue?: unknown
  class?:       string
  // Conditional visibility
  showWhen?: {
    field: string
    value: unknown
    op?:   '==' | '!=' | '>' | '<' | 'includes'
  }
}

export interface FormGroup {
  key:       string
  title?:    string
  icon?:     string
  cols?:     1 | 2 | 3 | 4
  collapsible?: boolean
  collapsed?:   boolean
  fields:    FormField[]
}

export interface FormSchema {
  groups: FormGroup[]
}

// ── Specific Form Payloads ── //

export interface UserInvitePayload {
  email:    string
  role:     string
  message?: string
}

export interface UserCreatePayload {
  name:       string
  email:      string
  phone?:     string
  role:       string
  department?: string
  avatar?:    string
  active:     boolean
}

export interface ProjectCreatePayload {
  name:        string
  description?: string
  color?:      string
  startDate?:  string
  endDate?:    string
  members?:    string[]
  status:      string
}

export interface ReportCreatePayload {
  title:       string
  type:        string
  dateRange?:  { from: string; to: string }
  filters?:    Record<string, unknown>
  schedule?:   string
}
