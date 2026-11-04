<template>
  <div
    class="rs"
    :class="[uid, `rs--${theme}`, `rs--${variant}`, { 'rs--vertical': direction === 'vertical' }]"
    :style="rootStyle"
    v-bind="rootAttrs()"
  >
    <!-- ───────── HEADER ───────── -->
    <header v-if="showHeader" class="rs-header" :class="`is-${hdr?.align || 'left'}`">
      <slot name="header" v-bind="api">
        <div class="rs-header-main">
          <slot name="header-title" v-bind="api">
            <h3 v-if="hdr?.title" class="rs-title">{{ hdr.title }}</h3>
            <p v-if="hdr?.subtitle" class="rs-subtitle">{{ hdr.subtitle }}</p>
          </slot>
        </div>
        <div class="rs-header-side">
          <span v-if="hdr?.counter" class="rs-counter">{{ api.index + 1 }} / {{ api.total }}</span>
          <slot name="header-actions" v-bind="api">
            <div v-if="hdr?.arrows" class="rs-arrows">
              <button type="button" class="rs-mini" aria-label="Previous" @click="slidePrev()">‹</button>
              <button type="button" class="rs-mini" aria-label="Next" @click="slideNext()">›</button>
            </div>
          </slot>
        </div>
      </slot>
    </header>

    <!-- ───────── GROUP TABS (top) ───────── -->
    <nav v-if="showGroupTabs && groupPosition === 'top'" class="rs-groups" role="tablist">
      <slot name="groups" v-bind="api" :groups="groups">
        <button
          v-for="g in groups"
          :key="g.name"
          type="button"
          role="tab"
          class="rs-group"
          :class="{ 'is-active': g.name === activeGroup }"
          :aria-selected="g.name === activeGroup"
          @click="goTo(g.index)"
        >
          <slot name="group-tab" :group="g" :active="g.name === activeGroup">{{ g.label }}</slot>
        </button>
      </slot>
    </nav>

    <slot name="before" v-bind="api" />

    <!-- ───────── BODY / SWIPER ───────── -->
    <div class="rs-body" :style="bodyStyle">
      <Swiper
        v-if="entries.length"
        :key="rebuildKey"
        class="rs-swiper"
        :dir="rtl ? 'rtl' : undefined"
        v-bind="{ ...params, ...listeners() }"
      >
        <SwiperSlide
          v-for="(entry, i) in entries"
          :key="entry.key"
          v-slot="st"
          class="rs-slide"
          :virtual-index="i"
          :data-hash="hashNavigation ? entry.hash || entry.key : undefined"
          :data-history="history ? entry.hash || entry.key : undefined"
        >
          <slot name="slide-before" v-bind="slotProps(entry, i, st)" />

          <!-- FULL REPLACE of one slide -->
          <slot name="slide" v-bind="slotProps(entry, i, st)">
            <div class="rs-slide-inner" :style="{ '--rs-cols': entry.items.length }">
              <article v-for="(it, j) in entry.items" :key="j" class="rs-item">
                <!-- REPLACE one item (useful with group.size > 1) -->
                <slot name="item" v-bind="itemProps(entry, i, j, st)">
                  <component :is="n(it).component" v-if="n(it).component" v-bind="n(it).props || {}" />
                  <template v-else>
                    <slot name="media" v-bind="itemProps(entry, i, j, st)">
                      <div :class="zoomOn ? 'swiper-zoom-container' : 'rs-media'">
                        <img
                          class="rs-img"
                          :src="n(it).image || n(it).src"
                          :alt="n(it).alt || n(it).title || ''"
                          :loading="lazy ? 'lazy' : undefined"
                          draggable="false"
                          v-bind="parallaxMedia"
                          @error="onImgError($event, n(it))"
                        />
                      </div>
                    </slot>

                    <slot name="caption" v-bind="itemProps(entry, i, j, st)">
                      <div v-if="n(it).title || n(it).caption" class="rs-caption">
                        <slot name="caption-title" v-bind="itemProps(entry, i, j, st)">
                          <strong v-if="n(it).title" v-bind="parallaxTitle">{{ n(it).title }}</strong>
                        </slot>
                        <slot name="caption-text" v-bind="itemProps(entry, i, j, st)">
                          <span v-if="n(it).caption" v-bind="parallaxText">{{ n(it).caption }}</span>
                        </slot>
                      </div>
                    </slot>
                  </template>
                </slot>
              </article>
            </div>
          </slot>

          <!-- Group badge on the slide -->
          <slot v-if="grp?.badge && entry.group != null" name="group-label" v-bind="slotProps(entry, i, st)">
            <span class="rs-badge">{{ groupLabel(entry.group) }}</span>
          </slot>

          <!-- Floating layer over this slide -->
          <div v-if="$slots['slide-overlay']" class="rs-slide-overlay">
            <slot name="slide-overlay" v-bind="slotProps(entry, i, st)" />
          </div>

          <slot name="slide-after" v-bind="slotProps(entry, i, st)" />
        </SwiperSlide>
      </Swiper>

      <div v-else class="rs-empty"><slot name="empty">No slides</slot></div>

      <!-- Own navigation buttons (swiper binds to them by selector) -->
      <template v-if="ownNav && entries.length">
        <button type="button" class="rs-nav rs-prev" aria-label="Previous slide">
          <slot name="prev"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg></slot>
        </button>
        <button type="button" class="rs-nav rs-next" aria-label="Next slide">
          <slot name="next"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg></slot>
        </button>
      </template>

      <!-- Free overlay above the whole swiper -->
      <div v-if="$slots.overlay" class="rs-overlay"><slot name="overlay" v-bind="api" /></div>
    </div>

    <!-- ───────── THUMBS ───────── -->
    <Swiper
      v-if="thumbsOn && entries.length"
      class="rs-thumbs"
      :modules="[FreeMode, Thumbs]"
      v-bind="thumbsParams"
      @swiper="(s) => (thumbsSwiper = s)"
    >
      <SwiperSlide v-for="(entry, i) in entries" :key="entry.key" class="rs-thumb">
        <slot name="thumb" v-bind="slotProps(entry, i, {})">
          <img :src="thumbSrc(entry)" :alt="n(entry.items[0]).title || ''" draggable="false" />
        </slot>
      </SwiperSlide>
    </Swiper>

    <!-- ───────── GROUP TABS (bottom) ───────── -->
    <nav v-if="showGroupTabs && groupPosition === 'bottom'" class="rs-groups" role="tablist">
      <slot name="groups" v-bind="api" :groups="groups">
        <button
          v-for="g in groups"
          :key="g.name"
          type="button"
          role="tab"
          class="rs-group"
          :class="{ 'is-active': g.name === activeGroup }"
          @click="goTo(g.index)"
        >
          <slot name="group-tab" :group="g" :active="g.name === activeGroup">{{ g.label }}</slot>
        </button>
      </slot>
    </nav>

    <slot name="after" v-bind="api" />

    <!-- ───────── FOOTER ───────── -->
    <footer v-if="showFooter" class="rs-footer" :class="`is-${ftr?.align || 'left'}`">
      <slot name="footer" v-bind="api">
        <span v-if="ftr?.text" class="rs-footer-text">{{ ftr.text }}</span>
        <span v-if="ftr?.progress" class="rs-progress" aria-hidden="true">
          <i :style="{ transform: `scaleX(${api.progress})` }" />
        </span>
        <span v-if="ftr?.counter" class="rs-counter">{{ api.index + 1 }} / {{ api.total }}</span>
        <button v-if="ftr?.autoplayToggle" type="button" class="rs-mini" @click="toggleAutoplay()">
          {{ running ? '❚❚' : '▶' }}
        </button>
      </slot>
    </footer>
  </div>
</template>

<script setup>
/**
 * RSwipper — reusable Swiper wrapper (Swiper 11, works with or without the nuxt-swiper module).
 */
// Imported explicitly (same as EventLaptop.vue) so it works even if the nuxt-swiper module
// is not registered or its auto-import names are not resolved.
import { Swiper, SwiperSlide } from 'swiper/vue'
import {
  A11y, Autoplay, Controller, EffectCards, EffectCoverflow, EffectCreative, EffectCube, EffectFade,
  EffectFlip, FreeMode, Grid, HashNavigation, History, Keyboard, Mousewheel, Navigation, Pagination,
  Parallax, Scrollbar, Thumbs, Virtual, Zoom,
} from 'swiper/modules'
import 'swiper/css/bundle'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  // ── data ──
  items: { type: Array, default: () => [] }, // [{ id, image, title, caption, group, thumb, hash, component, props }] or ['url']
  itemKey: { type: String, default: 'id' },
  modelValue: { type: Number, default: undefined }, // active index (v-model)

  // ── look ──
  theme: { type: String, default: 'auto', validator: (v) => ['auto', 'light', 'dark'].includes(v) },
  variant: { type: String, default: 'default', validator: (v) => ['default', 'glass', 'flat'].includes(v) },
  colors: { type: Object, default: () => ({}) }, // { accent, accent2, bg, surface, text, muted, border }
  radius: { type: String, default: '' },
  gap: { type: String, default: '' },
  height: { type: [String, Number], default: '' },
  ratio: { type: String, default: '16 / 9' }, // '' to disable
  lazy: { type: Boolean, default: true },
  rtl: { type: Boolean, default: false },

  // ── custom sections (header / footer / group) ──
  custom: { type: Object, default: () => ({}) },
  /*
    {
      header: { show, title, subtitle, align: 'left|center|right', counter, arrows },
      footer: { show, text, align, counter, progress, autoplayToggle },
      group:  { by: 'group', size: 1, tabs: true, position: 'top|bottom', badge: false, labels: { key: 'Label' } },
    }
  */

  // ── core params ──
  direction: { type: String, default: undefined }, // horizontal | vertical
  slidesPerView: { type: [Number, String], default: undefined },
  slidesPerGroup: { type: Number, default: undefined },
  spaceBetween: { type: [Number, String], default: undefined },
  loop: { type: Boolean, default: undefined },
  rewind: { type: Boolean, default: undefined },
  centeredSlides: { type: Boolean, default: undefined },
  initialSlide: { type: Number, default: undefined },
  speed: { type: Number, default: undefined },
  autoHeight: { type: Boolean, default: undefined },
  grabCursor: { type: Boolean, default: undefined },
  allowTouchMove: { type: Boolean, default: undefined },
  simulateTouch: { type: Boolean, default: undefined },
  slideToClickedSlide: { type: Boolean, default: undefined },
  watchSlidesProgress: { type: Boolean, default: undefined },
  breakpoints: { type: Object, default: undefined },

  // ── features (Boolean | Object) ──
  navigation: { type: [Boolean, Object], default: undefined },
  pagination: { type: [Boolean, String, Object], default: undefined }, // true | bullets | dynamic | fraction | progressbar | custom | {}
  scrollbar: { type: [Boolean, Object], default: undefined },
  autoplay: { type: [Boolean, Number, Object], default: undefined },
  effect: { type: String, default: 'slide' }, // slide | fade | cube | coverflow | flip | cards | creative
  effectOptions: { type: Object, default: () => ({}) }, // { coverflowEffect: {...}, cubeEffect: {...} ... }
  freeMode: { type: [Boolean, Object], default: undefined },
  grid: { type: [Boolean, Number, Object], default: undefined }, // 2 | { rows, fill }
  virtual: { type: [Boolean, Object], default: undefined },
  keyboard: { type: [Boolean, Object], default: undefined },
  mousewheel: { type: [Boolean, Object], default: undefined },
  parallax: { type: Boolean, default: undefined },
  zoom: { type: [Boolean, Object], default: undefined },
  thumbs: { type: [Boolean, Object], default: undefined }, // true | thumbs swiper params
  control: { type: Object, default: undefined }, // another Swiper instance (Controller)
  hashNavigation: { type: [Boolean, Object], default: undefined },
  history: { type: [Boolean, Object], default: undefined },
  a11y: { type: [Boolean, Object], default: true },

  // custom pagination renderers
  renderBullet: { type: Function, default: undefined },
  renderFraction: { type: Function, default: undefined },
  renderProgressbar: { type: Function, default: undefined },
  renderCustom: { type: Function, default: undefined },

  // ── escape hatches ──
  modules: { type: Array, default: () => [] }, // extra Swiper modules
  swiperOptions: { type: Object, default: () => ({}) }, // raw Swiper params, highest priority
})

const emit = defineEmits(['update:modelValue', 'change', 'ready', 'group-change'])
const attrs = useAttrs()
const slots = useSlots()

// ───────────────────────── state ─────────────────────────
const rawId = typeof useId === 'function' ? useId() : String(getCurrentInstance()?.uid ?? 0)
const uid = `rs-${String(rawId).replace(/[^a-zA-Z0-9_-]/g, '')}`

const swiper = shallowRef(null)
const thumbsSwiper = shallowRef(null)
const active = ref(0)
const running = ref(false)
const localItems = ref([...props.items])
watch(() => props.items, (v) => { localItems.value = [...v] })

const n = (it) => (typeof it === 'string' ? { image: it } : it || {})

// ───────────────────────── entries (slides) + groups ─────────────────────────
const grp = computed(() => props.custom?.group || null)
const hdr = computed(() => props.custom?.header || null)
const ftr = computed(() => props.custom?.footer || null)

const entries = computed(() => {
  const g = grp.value
  const size = Math.max(1, Number(g?.size) || 1)
  const by = g?.by || 'group'
  const out = []
  localItems.value.forEach((it, idx) => {
    const item = n(it)
    const group = g ? item[by] : undefined
    const last = out[out.length - 1]
    if (last && size > 1 && last.items.length < size && last.group === group) last.items.push(it)
    else out.push({ key: String(item[props.itemKey] ?? idx), items: [it], start: idx, group, hash: item.hash })
  })
  return out
})

const groupLabel = (name) => grp.value?.labels?.[name] ?? name
const groups = computed(() => {
  if (!grp.value) return []
  const seen = new Map()
  entries.value.forEach((e, i) => {
    if (e.group != null && !seen.has(e.group)) seen.set(e.group, { name: e.group, label: groupLabel(e.group), index: i })
  })
  return [...seen.values()]
})
const activeGroup = computed(() => entries.value[active.value]?.group)
const showGroupTabs = computed(() => !!grp.value && grp.value.tabs !== false && groups.value.length > 1)
const groupPosition = computed(() => grp.value?.position || 'top')
watch(activeGroup, (g) => g != null && emit('group-change', g))

const showHeader = computed(() => !!slots.header || (!!hdr.value && hdr.value.show !== false))
const showFooter = computed(() => !!slots.footer || (!!ftr.value && ftr.value.show !== false))

// ───────────────────────── params ─────────────────────────
const flag = (v) => (v === undefined || v === false || v === null ? undefined : v)
const obj = (v, base = {}) => (v === undefined || v === false || v === null ? undefined : v === true ? base : { ...base, ...v })

const navObj = computed(() => obj(props.navigation, {}))
const ownNav = computed(() => !!navObj.value && !navObj.value.prevEl && !navObj.value.nextEl)
const zoomOn = computed(() => !!flag(props.zoom))
const thumbsOn = computed(() => !!flag(props.thumbs))

const effectModules = { fade: EffectFade, cube: EffectCube, coverflow: EffectCoverflow, flip: EffectFlip, cards: EffectCards, creative: EffectCreative }

const effectDefaults = () => {
  switch (props.effect) {
    case 'fade': return { fadeEffect: { crossFade: true } }
    case 'coverflow':
      return {
        centeredSlides: true,
        slidesPerView: 'auto',
        coverflowEffect: { rotate: 40, stretch: 0, depth: 120, modifier: 1, slideShadows: true },
      }
    case 'creative':
      return { creativeEffect: { prev: { shadow: true, translate: ['-20%', 0, -1] }, next: { translate: ['100%', 0, 0] } } }
    default: return {}
  }
}

const moduleEntries = computed(() => {
  const m = []
  const add = (key, mod, on) => on && m.push([key, mod])
  add('a11y', A11y, !!flag(props.a11y))
  add('navigation', Navigation, !!navObj.value)
  add('pagination', Pagination, !!flag(props.pagination))
  add('scrollbar', Scrollbar, !!flag(props.scrollbar))
  add('autoplay', Autoplay, !!flag(props.autoplay))
  add('freemode', FreeMode, !!flag(props.freeMode))
  add('grid', Grid, !!flag(props.grid))
  add('virtual', Virtual, !!flag(props.virtual))
  add('keyboard', Keyboard, !!flag(props.keyboard))
  add('mousewheel', Mousewheel, !!flag(props.mousewheel))
  add('parallax', Parallax, !!flag(props.parallax))
  add('zoom', Zoom, zoomOn.value)
  add('thumbs', Thumbs, thumbsOn.value)
  add('controller', Controller, !!props.control)
  add('hash', HashNavigation, !!flag(props.hashNavigation))
  add('history', History, !!flag(props.history))
  if (props.effect !== 'slide' && effectModules[props.effect]) add(`fx-${props.effect}`, effectModules[props.effect], true)
  return m
})
const modules = computed(() => [...moduleEntries.value.map((x) => x[1]), ...props.modules])
const rebuildKey = computed(() => `${moduleEntries.value.map((x) => x[0]).join('|')}:${props.direction}:${props.rtl}:${props.modules.length}`)

const paginationParam = computed(() => {
  const v = props.pagination
  if (v === undefined || v === false) return undefined
  let o
  if (v === true) o = { clickable: true }
  else if (typeof v === 'string') o = v === 'dynamic' ? { type: 'bullets', dynamicBullets: true, clickable: true } : { type: v, clickable: true }
  else o = { clickable: true, ...v }
  if (props.renderBullet) o.renderBullet = props.renderBullet
  if (props.renderFraction) o.renderFraction = props.renderFraction
  if (props.renderProgressbar) o.renderProgressbar = props.renderProgressbar
  if (props.renderCustom) o.renderCustom = props.renderCustom
  return o
})

const params = computed(() => {
  const autoplay =
    props.autoplay === undefined || props.autoplay === false
      ? undefined
      : props.autoplay === true
        ? { delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true }
        : typeof props.autoplay === 'number'
          ? { delay: props.autoplay, disableOnInteraction: false, pauseOnMouseEnter: true }
          : { disableOnInteraction: false, ...props.autoplay }

  const grid =
    props.grid === undefined || props.grid === false
      ? undefined
      : props.grid === true ? { rows: 2, fill: 'row' }
        : typeof props.grid === 'number' ? { rows: props.grid, fill: 'row' }
          : props.grid

  const p = {
    modules: modules.value,
    direction: props.direction,
    slidesPerView: props.slidesPerView,
    slidesPerGroup: props.slidesPerGroup,
    spaceBetween: props.spaceBetween,
    loop: props.loop,
    rewind: props.rewind,
    centeredSlides: props.centeredSlides,
    initialSlide: props.initialSlide,
    speed: props.speed,
    autoHeight: props.autoHeight,
    grabCursor: props.grabCursor,
    allowTouchMove: props.allowTouchMove,
    simulateTouch: props.simulateTouch,
    slideToClickedSlide: props.slideToClickedSlide,
    watchSlidesProgress: props.watchSlidesProgress,
    breakpoints: props.breakpoints,
    effect: props.effect !== 'slide' ? props.effect : undefined,
    navigation: navObj.value && { prevEl: `.${uid} .rs-prev`, nextEl: `.${uid} .rs-next`, ...navObj.value },
    pagination: paginationParam.value,
    scrollbar: obj(props.scrollbar, { draggable: true }),
    autoplay,
    freeMode: flag(props.freeMode),
    grid,
    virtual: flag(props.virtual),
    keyboard: obj(props.keyboard, { enabled: true, onlyInViewport: true }),
    mousewheel: flag(props.mousewheel),
    parallax: flag(props.parallax),
    zoom: flag(props.zoom),
    thumbs: thumbsOn.value ? { swiper: thumbsSwiper.value && !thumbsSwiper.value.destroyed ? thumbsSwiper.value : null } : undefined,
    controller: props.control ? { control: props.control } : undefined,
    hashNavigation: obj(props.hashNavigation, { watchState: true }),
    history: obj(props.history, { key: 'slides' }),
    a11y: flag(props.a11y),
  }
  // effect defaults < explicit props < effectOptions < swiperOptions
  const defaults = effectDefaults()
  Object.keys(defaults).forEach((k) => p[k] === undefined && (p[k] = defaults[k]))
  Object.assign(p, props.effectOptions, props.swiperOptions)
  Object.keys(p).forEach((k) => p[k] === undefined && delete p[k])
  return p
})

const thumbsParams = computed(() => ({
  slidesPerView: 5,
  spaceBetween: 8,
  freeMode: true,
  watchSlidesProgress: true,
  ...(typeof props.thumbs === 'object' ? props.thumbs : {}),
}))
const thumbSrc = (entry) => {
  const it = n(entry.items[0])
  return it.thumb || it.image || it.src
}

// ───────────────────────── events ─────────────────────────
const call = (name, ...a) => {
  const h = attrs[name]
  if (Array.isArray(h)) h.forEach((f) => f?.(...a))
  else h?.(...a)
}
const isOn = (k) => /^on[A-Z]/.test(k)
const rootAttrs = () => Object.fromEntries(Object.entries(attrs).filter(([k]) => !isOn(k)))
// every parent listener (@reach-end, @touch-start, @zoom-change ...) is forwarded to Swiper
const listeners = () => ({
  ...Object.fromEntries(Object.entries(attrs).filter(([k]) => isOn(k))),
  onSwiper: (s) => {
    swiper.value = s
    active.value = s.realIndex
    running.value = !!s.autoplay?.running
    emit('ready', s)
    call('onSwiper', s)
  },
  onSlideChange: (s) => {
    active.value = s.realIndex
    emit('update:modelValue', s.realIndex)
    emit('change', s.realIndex)
    call('onSlideChange', s)
  },
  onAutoplayStart: (s) => { running.value = true; call('onAutoplayStart', s) },
  onAutoplayStop: (s) => { running.value = false; call('onAutoplayStop', s) },
})

watch(() => props.modelValue, (v) => {
  if (v != null && swiper.value && v !== swiper.value.realIndex) goTo(v)
})

// ───────────────────────── methods ─────────────────────────
const goTo = (i, speed) => {
  const s = swiper.value
  if (!s) return
  if (params.value.loop) s.slideToLoop(i, speed)
  else s.slideTo(i, speed)
}
const slideNext = (speed) => swiper.value?.slideNext(speed)
const slidePrev = (speed) => swiper.value?.slidePrev(speed)
const slideToLoop = (i, speed) => swiper.value?.slideToLoop(i, speed)
const update = () => swiper.value?.update()
const toggleAutoplay = () => {
  const a = swiper.value?.autoplay
  if (!a) return
  a.running ? a.stop() : a.start()
}
const autoplayApi = {
  start: () => swiper.value?.autoplay?.start(),
  stop: () => swiper.value?.autoplay?.stop(),
  pause: () => swiper.value?.autoplay?.pause(),
  resume: () => swiper.value?.autoplay?.resume(),
}
const zoomApi = {
  in: () => swiper.value?.zoom?.in(),
  out: () => swiper.value?.zoom?.out(),
  toggle: () => swiper.value?.zoom?.toggle(),
}

// data-driven slide manipulation (Swiper "Manipulation" equivalent)
const appendSlide = (item) => { localItems.value = [...localItems.value, ...[].concat(item)] }
const prependSlide = (item) => {
  const list = [].concat(item)
  const keep = active.value
  localItems.value = [...list, ...localItems.value]
  nextTick(() => swiper.value?.slideTo(keep + list.length, 0))
}
const addSlide = (index, item) => {
  const a = [...localItems.value]
  a.splice(index, 0, ...[].concat(item))
  localItems.value = a
}
const removeSlide = (index) => {
  const del = new Set([].concat(index))
  localItems.value = localItems.value.filter((_, i) => !del.has(i))
}
const removeAllSlides = () => { localItems.value = [] }

// ───────────────────────── slot helpers ─────────────────────────
const api = computed(() => ({
  swiper: swiper.value,
  index: active.value,
  total: entries.value.length,
  progress: entries.value.length > 1 ? active.value / (entries.value.length - 1) : 1,
  group: activeGroup.value,
  running: running.value,
  next: slideNext,
  prev: slidePrev,
  goTo,
  toggleAutoplay,
}))

// `st` = SwiperSlide slot props. It can be undefined (e.g. slides cloned by loop/virtual, or the
// thumbs strip), so never read it directly. Fall back to the real swiper state.
const slotProps = (entry, index, st) => {
  const s = st || {}
  const cur = active.value
  return {
    entry, item: n(entry.items[0]), items: entry.items.map(n), index, group: entry.group,
    isActive: s.isActive ?? index === cur,
    isPrev: s.isPrev ?? index === cur - 1,
    isNext: s.isNext ?? index === cur + 1,
    isVisible: s.isVisible ?? false,
  }
}
const itemProps = (entry, index, j, st) => ({
  ...slotProps(entry, index, st), item: n(entry.items[j]), itemIndex: entry.start + j,
})

const parallaxMedia = computed(() => (props.parallax ? { 'data-swiper-parallax-x': '-12%' } : {}))
const parallaxTitle = computed(() => (props.parallax ? { 'data-swiper-parallax': '-30%' } : {}))
const parallaxText = computed(() => (props.parallax ? { 'data-swiper-parallax': '-60%' } : {}))

const onImgError = (e, it) => {
  if (it.fallback && e.target.src !== it.fallback) e.target.src = it.fallback
}

// ───────────────────────── style ─────────────────────────
const toCss = (v) => (typeof v === 'number' ? `${v}px` : v)
const rootStyle = computed(() => {
  const c = props.colors || {}
  return {
    '--rs-accent': c.accent,
    '--rs-accent-2': c.accent2,
    '--rs-bg': c.bg,
    '--rs-surface': c.surface,
    '--rs-text': c.text,
    '--rs-muted': c.muted,
    '--rs-border': c.border,
    '--rs-radius': props.radius || undefined,
    '--rs-gap': props.gap || undefined,
  }
})
const bodyStyle = computed(() => ({
  height: props.height ? toCss(props.height) : undefined,
  aspectRatio: !props.height && props.ratio && !props.autoHeight ? props.ratio : undefined,
}))

defineExpose({
  swiper, thumbsSwiper, active, entries, groups,
  slideNext, slidePrev, slideTo: goTo, slideToLoop, update,
  autoplay: autoplayApi, zoom: zoomApi, toggleAutoplay,
  appendSlide, prependSlide, addSlide, removeSlide, removeAllSlides,
})
</script>

<style lang="scss">
.rs {
  // ── theme: auto = project tokens (follow .dark), light/dark = fixed palettes ──
  --rs-accent: var(--c-accent, #ff8c42);
  --rs-accent-2: var(--c-accent-2, #ffb347);
  --rs-bg: var(--c-bg, #f8f5f0);
  --rs-surface: var(--c-surface, #fff);
  --rs-text: var(--c-text, #1a1510);
  --rs-muted: var(--c-muted, #8a7f72);
  --rs-border: var(--c-border, rgba(255, 140, 66, 0.16));
  --rs-radius: var(--r-lg, 16px);
  --rs-gap: var(--sp-3, 12px);

  &.rs--light {
    --rs-bg: #f8f5f0; --rs-surface: #fff; --rs-text: #1a1510; --rs-muted: #8a7f72;
    --rs-border: rgba(255, 140, 66, 0.16);
  }
  &.rs--dark {
    --rs-bg: #0a0a0b; --rs-surface: #131319; --rs-text: #f0ece4; --rs-muted: #7a7585;
    --rs-border: rgba(255, 140, 66, 0.12);
  }

  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr); // keep the column from growing to the width of all slides
  gap: var(--rs-gap);
  width: 100%;
  min-width: 0;
  max-width: 100%;
  color: var(--rs-text);

  // grid/flex children default to min-width:auto -> Swiper measures a huge container and locks
  > * { min-width: 0; }

  --swiper-theme-color: var(--rs-accent);
  --swiper-navigation-color: var(--rs-text);
  --swiper-pagination-color: var(--rs-accent);
  --swiper-pagination-bullet-inactive-color: var(--rs-muted);
  --swiper-pagination-bullet-inactive-opacity: 0.45;

  // ── header / footer ──
  .rs-header, .rs-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-3, 12px);
    flex-wrap: wrap;
    &.is-center { justify-content: center; text-align: center; flex-direction: column; }
    &.is-right { flex-direction: row-reverse; text-align: right; }
  }
  .rs-title { font-size: 1.25rem; font-weight: 600; margin: 0; }
  .rs-subtitle { margin: 2px 0 0; color: var(--rs-muted); font-size: 0.875rem; }
  .rs-header-side { display: flex; align-items: center; gap: var(--sp-3, 12px); }
  .rs-counter { font-size: 0.8125rem; color: var(--rs-muted); font-variant-numeric: tabular-nums; }
  .rs-footer { font-size: 0.875rem; color: var(--rs-muted); }
  .rs-arrows { display: flex; gap: 6px; }
  .rs-mini {
    width: 30px; height: 30px; border-radius: 50%; cursor: pointer;
    border: 1px solid var(--rs-border); background: var(--rs-surface); color: var(--rs-text);
    &:hover { border-color: var(--rs-accent); color: var(--rs-accent); }
  }
  .rs-progress {
    flex: 1; min-width: 80px; height: 4px; border-radius: 4px; overflow: hidden; background: var(--rs-border);
    i { display: block; height: 100%; transform-origin: left; background: var(--rs-accent); transition: transform 0.3s; }
  }

  // ── group tabs ──
  .rs-groups { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 2px; }
  .rs-group {
    flex: none; padding: 6px 14px; border-radius: 999px; cursor: pointer; font-weight: 600; font-size: 0.8125rem;
    border: 1px solid var(--rs-border); background: var(--rs-surface); color: var(--rs-muted);
    transition: background 0.2s, color 0.2s, border-color 0.2s;
    &:hover { color: var(--rs-text); }
    &.is-active { background: var(--rs-accent); border-color: var(--rs-accent); color: #fff; }
  }
  .rs-badge {
    position: absolute; top: 12px; left: 12px; z-index: 5; padding: 3px 10px; border-radius: 999px;
    background: rgba(0, 0, 0, 0.55); color: #fff; font-size: 0.6875rem; backdrop-filter: blur(6px);
  }

  // ── body ──
  .rs-body {
    position: relative;
    overflow: hidden;
    border-radius: var(--rs-radius);
    background: var(--rs-surface);
    border: 1px solid var(--rs-border);
  }
  .rs-swiper { width: 100%; max-width: 100%; min-width: 0; height: 100%; }
  .rs-img { -webkit-user-drag: none; }
  .rs-slide { position: relative; overflow: hidden; height: auto; }
  .rs-slide-inner {
    display: grid;
    grid-template-columns: repeat(var(--rs-cols, 1), minmax(0, 1fr));
    gap: var(--rs-gap);
    width: 100%;
    height: 100%;
  }
  .rs-item { position: relative; overflow: hidden; min-width: 0; height: 100%; }
  .rs-media { width: 100%; height: 100%; }
  .rs-img { display: block; width: 100%; height: 100%; object-fit: cover; user-select: none; }
  .rs-caption {
    position: absolute; inset: auto 0 0 0; z-index: 2;
    display: flex; flex-direction: column; gap: 2px; padding: 32px 16px 22px; color: #fff;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
    strong { font-size: 1rem; font-weight: 600; }
    span { font-size: 0.8125rem; opacity: 0.88; }
  }
  .rs-slide-overlay, .rs-overlay { position: absolute; inset: 0; z-index: 6; pointer-events: none; > * { pointer-events: auto; } }
  .rs-empty { display: grid; place-items: center; min-height: 160px; color: var(--rs-muted); }

  // ── nav ──
  .rs-nav {
    position: absolute; top: 50%; z-index: 10; display: grid; place-items: center;
    width: 40px; height: 40px; padding: 0; transform: translateY(-50%); cursor: pointer;
    border-radius: 50%; border: 1px solid var(--rs-border); background: var(--rs-surface); color: var(--rs-text);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12); transition: opacity 0.2s, transform 0.2s, color 0.2s;
    svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
    &:hover { color: var(--rs-accent); }
    &.swiper-button-disabled { opacity: 0.35; pointer-events: none; }
    &.swiper-button-lock { display: none; }
  }
  .rs-prev { left: 12px; }
  .rs-next { right: 12px; }
  &.rs--vertical {
    .rs-prev, .rs-next { left: 50%; right: auto; transform: translateX(-50%) rotate(90deg); }
    .rs-prev { top: 12px; }
    .rs-next { top: auto; bottom: 12px; }
  }

  // ── pagination / scrollbar ──
  .swiper-pagination-fraction, .swiper-pagination-custom { color: #fff; text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5); }
  .swiper-pagination-progressbar { background: var(--rs-border); }
  .swiper-scrollbar { background: var(--rs-border); }

  // ── thumbs ──
  .rs-thumbs { width: 100%; }
  .rs-thumb {
    overflow: hidden; border-radius: calc(var(--rs-radius) / 2); cursor: pointer; opacity: 0.5; aspect-ratio: 16 / 10;
    transition: opacity 0.2s;
    img { display: block; width: 100%; height: 100%; object-fit: cover; }
    &.swiper-slide-thumb-active { opacity: 1; outline: 2px solid var(--rs-accent); outline-offset: -2px; }
  }

  // ── variants ──
  &.rs--glass {
    .rs-body, .rs-nav, .rs-mini, .rs-group {
      background: var(--glass-bg, color-mix(in srgb, var(--rs-surface) 70%, transparent));
      backdrop-filter: blur(14px) saturate(160%);
    }
    .rs-group.is-active { background: var(--rs-accent); }
  }
  &.rs--flat {
    .rs-body { border-color: transparent; background: transparent; }
    .rs-nav { box-shadow: none; }
  }
}
</style>