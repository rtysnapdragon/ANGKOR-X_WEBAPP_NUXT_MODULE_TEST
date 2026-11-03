export interface MenuItem {
  id: string
  key: string
  label: string
  icon?: string
  link?: string
  color?: string
  to?: string
  children?: MenuItem[]
  isOpen?: boolean
  isGroup?: boolean
  permission?: string | null
  badgeDynamic?: string
}


export interface NotificationItem {
  Id: number
  Type: 'like' | 'comment' | 'follow' | 'save' | 'system'
  Message: string
  From?: string
  FromAvatar?: string
  IsRead: boolean
  CreatedAt: string

  /*
  Route when clicked
  Example:
  /gallery/mekong-memories
  /artists/sophea-khun
  /dashboard/notifications
  */
  Href?: string

  /*
  optional image
  */
  Cover?: string
}

export interface UIState {
  isDark: boolean
  notifPanelOpen: boolean
  aiAssistantOpen: boolean
  searchOpen: boolean
  mobileMenuOpen: boolean

  notifSocket: WebSocket | null
  notifLoading: boolean
  notifToken: string | null
}