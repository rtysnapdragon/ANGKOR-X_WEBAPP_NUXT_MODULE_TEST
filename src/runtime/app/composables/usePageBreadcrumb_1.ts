// composables/usePageBreadCrumb.ts
import { onMounted, onBeforeUnmount } from 'vue';
// import { useBreadCrumb } from '@bgtm/breadcrumb-nuxt';
import { useBreadCrumb } from './breadCrumb.js'
import type {
  RBreadcrumbState,
} from '~/types/breadcrumb'

/**
 * Page header + breadcrumb, set on mount and cleared on unmount.
 *
 * Two naming conventions meet here:
 *   - this config (and RBreadCrumb's props) use  showBack / backAction
 *   - breadCrumb state (and RBreadCrumb's state reads) use hasBack / fnBack
 * The mapping happens below, so pages only ever pass the config names.
 * `title / description / icon / actions / rightTemplate / leftButton` are
 * extra header fields that live in the same breadCrumb state.
 */
export type PageBreadcrumbConfig = Partial<RBreadcrumbState> & {
  title?: string
  description?: string
  icon?: string
  /** Right-side buttons: [{ type, label, icon, color, variant, size, onClick, disabled, loading }] */
  actions?: Record<string, any>[]
  /** Full right-side override — a functional component `(props) => VNode`. */
  rightTemplate?: (...args: any[]) => any
  /** Left-side popover button config: { icon, label, tooltip, render, onClick }. */
  leftButton?: Record<string, any>
}

export const usePageBreadcrumb_1 = (
  config: PageBreadcrumbConfig,
) => {
  const breadcrumb = useBreadCrumb()

  onMounted(() => {
    const { showBack, backAction, ...rest } = config

    breadcrumb.set({
      ...rest,
      // config name -> state name
      ...(showBack !== undefined ? { hasBack: showBack } : {}),
      ...(backAction !== undefined ? { fnBack: backAction } : {}),
    })
  })

  onBeforeUnmount(() => {
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
