// src/index.ts
export { default as getComponentPaths } from './runtime/app/utils/getComponentPaths'

export interface ExternalModuleOptions {
  message?: string
}

// export function init(options: ExternalModuleOptions = {}) {
//   const element = document.createElement('div')

//   element.className = 'external-module'
//   element.textContent = options.message ?? 'External module loaded'

//   return {
//     mount(target: HTMLElement) {
//       target.replaceChildren(element)
//     },

//     destroy() {
//       element.remove()
//     },
//   }
// }
