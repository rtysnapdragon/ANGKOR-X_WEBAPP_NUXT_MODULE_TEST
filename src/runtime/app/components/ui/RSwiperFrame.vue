<template>
  <div class="lp" :class="rootClass" :style="rootStyle">
    <!-- Slot: above the laptop -->
    <slot name="top" />

    <div class="lp-stage">
      <!-- Optional PNG frames (replace the CSS frame): light = silver, dark = space black -->
      <template v-if="hasImageFrame">
        <img v-if="frameLight" class="lp-frame-img lp-frame-light" :src="frameLight" alt="" draggable="false" />
        <img v-if="frameDark" class="lp-frame-img lp-frame-dark" :src="frameDark" alt="" draggable="false" />
      </template>

      <!-- LID: rim + black bezel + screen -->
      <div class="lp-lid">
        <div class="lp-bezel">
          <div class="lp-screen">
            <!-- Slot: menu bar (show-menubar) -->
            <div v-if="showMenubar" class="lp-menubar">
              <slot name="menubar">
                <span class="lp-menubar-dot" />
                <strong>{{ menubarTitle }}</strong>
                <span class="lp-menubar-gap" />
                <span>{{ menubarRight }}</span>
              </slot>
            </div>

            <!-- Slot: replace the whole screen (no carousel) -->
            <slot name="screen" :slides="slides">
              <Swiper
                v-if="slides.length"
                :key="swiperKey"
                class="lp-swiper"
                :modules="modules"
                :slides-per-view="1"
                :grab-cursor="false"
                :simulate-touch="true"
                :touch-ratio="1.2"
                :speed="speed"
                :loop="loop && slides.length > 1"
                :autoplay="autoplay > 0 ? { delay: autoplay, disableOnInteraction: false } : false"
                :pagination="pagination ? { clickable: true } : false"
                @slide-change="(s) => emit('change', s.realIndex ?? s.activeIndex)"
              >
                <SwiperSlide v-for="(s, i) in slides" :key="s.id || i" v-slot="{ isActive }">
                  <!-- 1. before everything in the slide (background, gradient, video...) -->
                  <slot name="slide-before" :slide="s" :index="i" :active="isActive" />

                  <!-- 2. FULL REPLACE: render anything (SVG / PNG / component / VNode) -->
                  <slot name="slide" :slide="s" :index="i" :active="isActive">
                    <component :is="s.component" v-if="s.component" :key="s.id" v-bind="s.props || {}" />
                    <template v-else>
                      <!-- 3. media only -->
                      <slot name="slide-media" :slide="s" :index="i" :active="isActive">
                        <img
                          class="lp-img"
                          :src="s.image"
                          :alt="s.title"
                          draggable="false"
                          loading="lazy"
                          @error="onImgError($event, s)"
                        />
                      </slot>

                      <!-- 4. caption (whole) or its title / text parts -->
                      <slot name="slide-caption" :slide="s" :index="i" :active="isActive">
                        <div v-if="s.title || s.caption" class="lp-caption">
                          <slot name="slide-caption-title" :slide="s" :index="i" :active="isActive">
                            <strong v-if="s.title">{{ s.title }}</strong>
                          </slot>
                          <slot name="slide-caption-text" :slide="s" :index="i" :active="isActive">
                            <span v-if="s.caption">{{ s.caption }}</span>
                          </slot>
                        </div>
                      </slot>
                    </template>
                  </slot>

                  <!-- 5. floating layer over this slide (badges, buttons, VNode components) -->
                  <div v-if="$slots['slide-overlay']" class="lp-slide-overlay">
                    <slot name="slide-overlay" :slide="s" :index="i" :active="isActive" />
                  </div>

                  <!-- 6. after everything in the slide -->
                  <slot name="slide-after" :slide="s" :index="i" :active="isActive" />
                </SwiperSlide>
              </Swiper>

              <!-- Slot: no slides -->
              <div v-else class="lp-empty"><slot name="empty" /></div>
            </slot>

            <!-- Slot: dock (show-dock) -->
            <div v-if="showDock" class="lp-dock">
              <slot name="dock">
                <span v-for="n in 7" :key="n" class="lp-dock-icon" />
              </slot>
            </div>

            <!-- Slot: notch content (camera by default) -->
            <div v-if="showNotch" class="lp-notch">
              <slot name="notch"><span class="lp-camera" /></slot>
            </div>

            <!-- Slot: free overlay above the whole screen (not per slide) -->
            <div v-if="$slots.overlay" class="lp-overlay"><slot name="overlay" /></div>
          </div>
        </div>
      </div>

      <!-- BASE: wider than the lid, finger groove in the middle, two feet -->
      <slot name="base">
        <div v-if="!hasImageFrame" class="lp-base" aria-hidden="true">
          <i class="lp-foot lp-foot-l" />
          <i class="lp-foot lp-foot-r" />
        </div>
      </slot>
    </div>

    <!-- Slot: below the laptop -->
    <slot name="footer" />
  </div>
</template>

<script setup>
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, Pagination, Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'

const props = defineProps({
  slides: { type: Array, default: () => [] },
  accent: { type: String, default: '#4dd2c4' },

  // 'auto' follows the `.dark` class: light = silver, dark = space black
  theme: { type: String, default: 'auto', validator: (v) => ['auto', 'light', 'dark'].includes(v) },

  // Optional PNG frames. `screenInset` = "top right bottom left" of the screen inside the PNG
  frameLight: { type: String, default: '' },
  frameDark: { type: String, default: '' },
  screenInset: { type: String, default: '3.2% 4.2% 9% 4.2%' },

  // Chrome
  showNotch: { type: Boolean, default: true },
  showMenubar: { type: Boolean, default: false },
  showDock: { type: Boolean, default: false },
  menubarTitle: { type: String, default: 'Finder' },
  menubarRight: { type: String, default: '' },

  // Carousel
  autoplay: { type: Number, default: 0 }, // ms, 0 = off
  loop: { type: Boolean, default: true },
  pagination: { type: Boolean, default: true },
  navigation: { type: Boolean, default: false },
  speed: { type: Number, default: 450 },

  maxWidth: { type: String, default: '560px' },
  ratio: { type: String, default: '16 / 10' },
})
const emit = defineEmits(['change'])

const hasImageFrame = computed(() => !!(props.frameLight || props.frameDark))
const modules = computed(() => [Pagination, Autoplay, ...(props.navigation ? [Navigation] : [])])

const rootClass = computed(() => [
  props.theme !== 'auto' && `lp--${props.theme}`,
  hasImageFrame.value && 'lp--img',
])
const rootStyle = computed(() => ({
  '--lp-accent': props.accent,
  '--lp-max': props.maxWidth,
  '--lp-ratio': props.ratio,
  '--lp-inset': props.screenInset,
}))

// image failed (blocked/offline) -> swap to fallback once
const onImgError = (e, s) => {
  if (s.fallback && e.target.src !== s.fallback) e.target.src = s.fallback
}

// reset to first slide when the slide set changes
const swiperKey = computed(() => props.slides.map((s) => s.id).join('|'))
</script>

<style lang="scss">
.lp {
  // ── LIGHT = silver / gray ──
  --lp-rim: #c9cacd;
  --lp-bezel: #050506;
  --lp-base-1: #e3e4e7;
  --lp-base-2: #aeb0b5;
  --lp-groove: #8f9196;
  --lp-foot: #6d6f74;
  --lp-shadow: rgba(20, 20, 30, 0.22);

  width: 100%;
  max-width: var(--lp-max, 560px);
  margin: 0 auto;
  filter: drop-shadow(0 22px 28px var(--lp-shadow));

  // ── DARK = space black ──
  .dark &:not(.lp--light),
  &.lp--dark {
    --lp-rim: #333336;
    --lp-bezel: #000;
    --lp-base-1: #3d3d41;
    --lp-base-2: #1a1a1c;
    --lp-groove: #0b0b0c;
    --lp-foot: #0b0b0c;
    --lp-shadow: rgba(0, 0, 0, 0.55);
  }

  .lp-stage { position: relative; }

  // ── LID ──
  .lp-lid {
    position: relative;
    padding: 1.5px;
    background: var(--lp-rim);
    border-radius: 15px 15px 2px 2px;
  }
  .lp-bezel {
    padding: 8px 8px 12px;
    background: var(--lp-bezel);
    border-radius: 13.5px 13.5px 1px 1px;
  }
  .lp-screen {
    position: relative;
    aspect-ratio: var(--lp-ratio, 16 / 10);
    border-radius: 6px 6px 1px 1px;
    overflow: hidden;
    background: #071a1c;
    user-select: none;
  }

  // notch + camera
  .lp-notch {
    position: absolute;
    top: 0;
    left: 50%;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 13%;
    min-width: 56px;
    height: 13px;
    transform: translateX(-50%);
    background: var(--lp-bezel);
    border-radius: 0 0 7px 7px;
  }
  .lp-camera { width: 4px; height: 4px; border-radius: 50%; background: #1d2127; box-shadow: 0 0 0 1px #14171b; }

  // menu bar
  .lp-menubar {
    position: absolute;
    inset: 0 0 auto 0;
    z-index: 4;
    display: flex;
    align-items: center;
    gap: 8px;
    height: 13px;
    padding: 0 10px;
    font-size: 6px;
    color: #fff;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(6px);
    strong { font-weight: 600; }
  }
  .lp-menubar-dot { width: 5px; height: 5px; border-radius: 50%; background: #fff; }
  .lp-menubar-gap { flex: 1; }

  // dock
  .lp-dock {
    position: absolute;
    left: 50%;
    bottom: 6px;
    z-index: 4;
    display: flex;
    gap: 4px;
    padding: 3px 6px;
    transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.22);
    backdrop-filter: blur(8px);
    border-radius: 8px;
  }
  .lp-dock-icon {
    width: 10px;
    height: 10px;
    border-radius: 3px;
    background: var(--lp-accent);
    &:nth-child(even) { background: #fff; opacity: 0.85; }
  }

  // screen overlay + per-slide overlay (children receive pointer events)
  .lp-overlay,
  .lp-slide-overlay {
    position: absolute;
    inset: 0;
    z-index: 6;
    pointer-events: none;
    > * { pointer-events: auto; }
  }

  .lp-swiper { cursor: default !important; width: 100%; height: 100%; }
  .lp-swiper .swiper-slide { position: relative; overflow: hidden; cursor: default !important; }
  .lp-img { width: 100%; height: 100%; object-fit: cover; display: block; pointer-events: none; }
  .lp-empty { width: 100%; height: 100%; display: grid; place-items: center; color: #fff; }
  .lp-caption {
    position: absolute;
    inset: auto 0 0 0;
    padding: 28px 16px 22px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    color: #fff;
    background: linear-gradient(transparent, rgba(0, 12, 16, 0.85));
    strong { font-size: 1rem; font-weight: 600; }
    span { font-size: 0.8125rem; opacity: 0.85; }
  }
  .swiper-pagination { bottom: 6px !important; }
  .swiper-pagination-bullet { width: 6px; height: 6px; background: #fff; opacity: 0.5; cursor: pointer; }
  .swiper-pagination-bullet-active { background: var(--lp-accent); opacity: 1; }

  // ── BASE ──
  .lp-base {
    position: relative;
    width: calc(100% + 14px);
    height: 15px;
    margin: 0 -7px;
    background: linear-gradient(180deg, var(--lp-base-1), var(--lp-base-2));
    border-radius: 0 0 14px 14px / 0 0 12px 12px;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22);

    // finger groove
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      width: 17%;
      height: 5px;
      transform: translateX(-50%);
      background: var(--lp-groove);
      border-radius: 0 0 10px 10px;
    }
  }
  .lp-foot {
    position: absolute;
    bottom: -2px;
    width: 9%;
    height: 3px;
    background: var(--lp-foot);
    border-radius: 0 0 3px 3px;
  }
  .lp-foot-l { left: 7%; }
  .lp-foot-r { right: 7%; }

  // ── PNG frame mode ──
  .lp-frame-img { display: block; width: 100%; height: auto; pointer-events: none; }
  .lp-frame-dark { display: none; }
  &.lp--light .lp-frame-light { display: block; }
  &.lp--light .lp-frame-dark { display: none; }
  .dark &:not(.lp--light) .lp-frame-light,
  &.lp--dark .lp-frame-light { display: none; }
  .dark &:not(.lp--light) .lp-frame-dark,
  &.lp--dark .lp-frame-dark { display: block; }

  &.lp--img {
    filter: none;
    .lp-lid {
      position: absolute;
      inset: var(--lp-inset);
      padding: 0;
      background: none;
      border-radius: 0;
    }
    .lp-bezel { height: 100%; padding: 0; background: none; border-radius: 0; }
    .lp-screen { height: 100%; aspect-ratio: auto; border-radius: 0; }
  }
}
</style>