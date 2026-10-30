// types/breadcrumb.ts

export interface RBreadcrumbItem {
  label: string

  to?: string

  icon?: string

  disabled?: boolean

  separatorIcon?: string

  children?: RBreadcrumbItem[]

  onClick?: () => void

  exact?: boolean

  class?: string
}

export interface RBreadcrumbState {
  showBack: boolean

  backTooltip?: string

  backAction?: () => void

  separatorIcon?: string

  items: RBreadcrumbItem[]
}

// types/r-page-header.ts

export interface RHeaderBreadcrumbItem {
  label: string

  to?: string

  icon?: string
  hasBack: boolean
  disabled?: boolean

  separatorIcon?: string

  children?: RHeaderBreadcrumbItem[]

  onClick?: () => void

  exact?: boolean

  class?: string
}

export interface RPageHeaderState {
  // Header
  title?: string

  subtitle?: string

  icon?: string

  // Breadcrumb
  hasBack?: boolean

  backTooltip?: string
  tooltip?: string
  fnBack?: () => void

  separatorIcon?: string

  items?: RHeaderBreadcrumbItem[]
}


// types/breadcrumb.ts

export interface RHeaderBreadcrumbChild {
  label: string
  icon?: string
  disabled?: boolean
  to?: string
  onClick?: () => void
}

export interface RHeaderBreadcrumbItem {
  label: string
  icon?: string
  to?: string
  onClick?: () => void
  children?: RHeaderBreadcrumbChild[]
}

export interface RPageHeaderState {
  // Header
  title?: string
  subtitle?: string
  icon?: string

  // Back button
  hasBack?: boolean
  backTooltip?: string
  fnBack?: () => void

  // Breadcrumb
  items?: RHeaderBreadcrumbItem[]
  separatorIcon?: string

  // Actions slot — components can register a render function or component
  // This is intentionally loose so pages can inject anything
  actionsKey?: string
}