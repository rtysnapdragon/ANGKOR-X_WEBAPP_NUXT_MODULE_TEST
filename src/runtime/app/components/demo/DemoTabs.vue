<template>
  <Swiper
    class="dt"
    :class="`dt--${variant}`"
    role="tablist"
    :modules="[FreeMode, Mousewheel]"
    slides-per-view="auto"
    :space-between="variant === 'pill' ? 8 : 6"
    free-mode
    :mousewheel="{ forceToAxis: true }"
    @swiper="onSwiper"
  >
    <SwiperSlide v-for="t in tabs" :key="t.key" class="dt-slide">
      <button
        type="button"
        role="tab"
        class="dt-tab"
        :class="{ 'is-active': active === t.key }"
        :aria-selected="active === t.key"
        @click="active = t.key"
      >
        <i v-if="t.icon" :class="t.icon" aria-hidden="true" />
        {{ t.label }}
      </button>
    </SwiperSlide>
  </Swiper>
</template>

<script setup>
// DemoTabs — horizontally swipeable tab bar (Swiper). npm i swiper
import { watch, nextTick } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { FreeMode, Mousewheel } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/free-mode'

const active = defineModel() // active tab key

const props = defineProps({
  tabs:    { type: Array,  required: true },  // [{ key, label, icon?, desc? }]
  variant: { type: String, default: 'line' }, // 'line' (underline) | 'pill' (segmented)
})

let swiper = null

function focusActive(animate = true) {
  const i = props.tabs.findIndex((t) => t.key === active.value)
  swiper?.slideTo(Math.max(0, i - 1), animate ? 300 : 0)
}

function onSwiper(sw) {
  swiper = sw
  focusActive(false)
}

// keep the active tab in view when it changes (click, or set from outside)
watch(active, async () => {
  await nextTick()
  swiper?.update()
  focusActive()
})
</script>

<!--
  GLOBAL (non-scoped): Swiper renders its own DOM, which scoped CSS can't reach.
  Also holds the shared .srd-* helpers used by every demo component.
-->
<style lang="scss">
/* ── tab bar ── */
.dt {
  margin-bottom: var(--sp-4);

  // soft edge fade = "there's more to swipe"
  -webkit-mask-image: linear-gradient(90deg, transparent 0, black 14px, black calc(100% - 14px), transparent 100%);
  mask-image: linear-gradient(90deg, transparent 0, black 14px, black calc(100% - 14px), transparent 100%);
}

.dt-slide { width: auto; } // required by slides-per-view="auto"

.dt-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  color: var(--c-muted);
  background: transparent;
  border: 0;
  cursor: pointer;
  transition:
    color var(--t-fast) var(--ease-out),
    background var(--t-fast) var(--ease-out),
    border-color var(--t-fast) var(--ease-out);

  &:hover { color: var(--c-text); }
}

// underline tabs
.dt--line {
  border-bottom: 1px solid var(--c-border);

  .dt-tab {
    padding: 10px 14px;
    border-bottom: 2px solid transparent;

    &.is-active {
      color: var(--c-accent);
      border-bottom-color: var(--c-accent);
    }
  }
}

// segmented pill tabs
.dt--pill {
  padding: 4px;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--r-full);
  -webkit-mask-image: none;
  mask-image: none;

  .dt-tab {
    padding: 7px 18px;
    font-weight: 600;
    border-radius: var(--r-full);

    &.is-active {
      color: var(--c-accent);
      background: color-mix(in srgb, var(--c-accent) 12%, transparent);
    }
  }
}

/* ── shared demo helpers ── */
.srd-panel { min-height: 200px; }

.srd-desc {
  margin-bottom: var(--sp-3);
  font-size: 13px;
  color: var(--c-muted);
}

.srd-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
}

.srd-log {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-3);
  margin-bottom: var(--sp-3);
  padding: var(--sp-2) var(--sp-3);
  font-size: 12px;
  color: var(--c-muted);
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--r-sm);
}

.srd-form { display: grid; gap: var(--sp-3); }

.srd-custom-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--sp-3) var(--sp-4);
}

.srd-sub {
  padding: var(--sp-2) var(--sp-5);
  font-size: 12px;
  color: var(--c-muted);
}

.srd-raw { padding: var(--sp-6); }

/* ── panel transition ── */
.srd-fade-enter-active,
.srd-fade-leave-active {
  transition: opacity var(--t-fast) var(--ease-out), transform var(--t-fast) var(--ease-out);
}
.srd-fade-enter-from,
.srd-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
