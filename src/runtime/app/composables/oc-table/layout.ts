import { onBeforeUnmount, onMounted } from 'vue'

type MaybeEl = HTMLElement | null | undefined

export interface TableLayoutOptions {
  /** `options.isScroll`. When false the target is left to grow naturally. */
  enabled: () => boolean
  /** Element that receives the computed height (table scroll body or card list). */
  target: () => MaybeEl
  /** Viewport width above which the height is pinned to the remaining viewport space. */
  minWidth: () => number
  /** Fixed vertical allowance below the target (container padding). */
  space: () => number
  /** Heights of everything rendered under the target (footer, detail slots). */
  extra: () => number
  /** Runs after each measurement, e.g. to refresh pinned-column offsets. */
  onSync?: () => void
}

/**
 * Replaces the old calScroll / calScrollModal / calScrollCard trio.
 * One rAF-throttled measurement, one window listener, removed on unmount
 * (the previous implementation never removed its resize listeners).
 */
export function useTableLayout(opts: TableLayoutOptions) {
  let frame = 0

  const setHeight = (el: HTMLElement, height: string, min?: string) => {
    el.style.setProperty('height', height)
    el.style.setProperty('max-height', height)
    if (min) el.style.setProperty('min-height', min)
  }

  function apply(el: HTMLElement) {
    if (!opts.enabled()) {
      for (const prop of ['height', 'max-height', 'min-height']) el.style.removeProperty(prop)
      return
    }

    // Inside a modal the available space is the modal body, not the viewport.
    const modal = el.closest<HTMLElement>('.oc-modal-container')
    if (modal) {
      const footer = modal.querySelector<HTMLElement>('.oc-modal-footer')?.offsetHeight ?? 0
      // Formula kept as-is from the previous implementation.
      const height = modal.getBoundingClientRect().height - (el.getBoundingClientRect().top + footer + 80)
      setHeight(el, `${height}px`)
      return
    }

    if (window.innerWidth > opts.minWidth()) {
      const top = el.getBoundingClientRect().top
      const height = window.innerHeight - (top + opts.space() + opts.extra() + 15)
      setHeight(el, `${height}px`, '400px')
    } else {
      setHeight(el, '100%', '400px')
    }
  }

  function run() {
    frame = 0
    const el = opts.target()
    if (el) apply(el)
    opts.onSync?.()
  }

  function schedule() {
    if (frame) cancelAnimationFrame(frame)
    frame = requestAnimationFrame(run)
  }

  onMounted(() => {
    window.addEventListener('resize', schedule, { passive: true })
    schedule()
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', schedule)
    if (frame) cancelAnimationFrame(frame)
  })

  return { sync: schedule }
}
