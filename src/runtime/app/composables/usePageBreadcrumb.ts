// composables/usePageBreadCrumb.ts
import { onBeforeUnmount, isRef, unref, watch, type Ref } from 'vue';
// import { useBreadCrumb } from '@bgtm/breadcrumb-nuxt';
import { useBreadCrumbMounted } from './breadCrumbMounted'
import type {
  RBreadcrumbItem,
} from '~/types/breadcrumb'

/**
 * Page header + breadcrumb: applied while the page is alive, cleared on unmount.
 * Rendered globally by `<RBreadCrumb />` (mounted in the navbar layout).
 *
 * Two naming conventions meet here:
 *   - this config (and RBreadCrumb's props) use  showBack / backAction
 *   - breadCrumb state (and RBreadCrumb's state reads) use hasBack / fnBack
 * The mapping happens below, so pages only ever pass the config names.
 *
 * `title / description / icon / items / actions …` accept a plain value, a ref
 * or a getter — getters are re-evaluated inside the watcher, so passing
 * `() => t('…')` keeps the header reactive on locale switches.
 * Callback-shaped fields (backAction / rightTemplate) are NEVER called here —
 * they are stored raw for RBreadCrumb to invoke.
 */
type Dyn<T> = T | Ref<T> | (() => T)

/** Right-side header button — rendered by RBreadCrumb through RBtn. */
export interface PageBreadcrumbAction {
  key?: string
  label?: string
  icon?: string
  type?: string
  color?: string
  variant?: string
  size?: string
  disabled?: boolean
  loading?: boolean
  to?: string
  onClick?: () => void
  click?: () => void
  render?: (...args: unknown[]) => unknown
}

/** Left-side popover button config. */
export interface PageBreadcrumbLeftButton {
  icon?: string
  label?: string
  tooltip?: string
  color?: string
  variant?: string
  size?: string
  render?: (...args: unknown[]) => unknown
  onClick?: () => void
}

export interface PageBreadcrumbConfig {
  title?: Dyn<string>
  description?: Dyn<string>
  icon?: Dyn<string>

  showBack?: Dyn<boolean>
  backTooltip?: Dyn<string>
  separatorIcon?: Dyn<string>
  items?: Dyn<RBreadcrumbItem[]>

  actions?: Dyn<PageBreadcrumbAction[]>
  /** Functional component replacing the whole right side — stored raw. */
  rightTemplate?: Ref<((...args: unknown[]) => unknown) | undefined> | ((...args: unknown[]) => unknown)
  /** Back handler (raw) — RBreadCrumb falls back to router.back() when absent. */
  backAction?: Ref<(() => void) | undefined> | (() => void)
  leftButton?: Dyn<PageBreadcrumbLeftButton>
}

function resolve<T>(value: Dyn<T> | undefined): T | undefined {
  if (value === undefined) return undefined
  if (typeof value === 'function') return (value as () => T)()
  return unref(value as T | Ref<T>)
}

function resolveRaw<T>(value: T | Ref<T | undefined> | undefined): T | undefined {
  if (value === undefined) return undefined
  return isRef(value) ? value.value : value
}

export const usePageBreadCrumb = (
  config: PageBreadcrumbConfig,
) => {
  const breadcrumb = useBreadCrumbMounted()

  const stop = watch(
    () => ({
      title: resolve(config.title),
      description: resolve(config.description),
      icon: resolve(config.icon),
      // config name -> state name
      hasBack: resolve(config.showBack),
      fnBack: resolveRaw(config.backAction),
      backTooltip: resolve(config.backTooltip),
      separatorIcon: resolve(config.separatorIcon),
      items: resolve(config.items),
      actions: resolve(config.actions),
      rightTemplate: resolveRaw(config.rightTemplate),
      leftButton: resolve(config.leftButton),
    }),
    (resolved) => {
      const payload: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(resolved)) {
        if (value !== undefined) payload[key] = value
      }
      breadcrumb.set(payload)
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    stop()
    breadcrumb.clear()
  })

  return breadcrumb
}

// Example usage

// usePageBreadCrumb({
//   showBack: true,

//   backTooltip: 'Back to dashboard',

//   backAction: () => navigateTo('/dashboard'),

//   items: [
//     {
//       label: 'Dashboard',
//       to: '/',
//       icon: 'i-lucide-home',
//     },

//     {
//       label: 'Users',
//       to: '/users',

//       children: [
//         {
//           label: 'Create User',
//           icon: 'i-lucide-plus',
//           to: '/users/create',
//         },

//         {
//           label: 'User Roles',
//           icon: 'i-lucide-shield',
//           to: '/users/roles',
//         },

//         {
//           label: 'Permission Matrix',
//           icon: 'i-lucide-lock',
//           onClick: () => {
//             console.log('Permission clicked')
//           },
//         },
//       ],
//     },

//     {
//       label: 'Detail',
//     },
//   ],
// })



// <!-- Full composable usage -->

// <script setup lang="ts">
// useMountedPageHeader({
//   title: 'Wedding Dashboard',

//   subtitle: 'Manage invitation event',

//   icon: 'i-lucide-layout-dashboard',

//   showBack: true,

//   backTooltip: 'Back to dashboard',

//   backAction: () => navigateTo('/'),

//   items: [
//     {
//       label: 'Dashboard',
//       to: '/',
//       icon: 'i-lucide-home',
//     },

//     {
//       label: 'Users',

//       to: '/users',

//       children: [
//         {
//           label: 'Create User',
//           icon: 'i-lucide-plus',
//           to: '/users/create',
//         },

//         {
//           label: 'Roles',
//           icon: 'i-lucide-shield',
//           to: '/users/roles',
//         },
//       ],
//     },

//     {
//       label: 'Detail',
//     },
//   ],
// })
// </script>
