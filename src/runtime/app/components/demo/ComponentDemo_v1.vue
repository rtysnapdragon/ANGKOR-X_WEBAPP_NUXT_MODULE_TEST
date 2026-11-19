<template>
  <div class="rcd">
    <h1>RModal · RSlider · RDrawer — Usage Reference</h1>
    <p class="srd-desc">
      Each main tab renders its own demo component; inside, every use case is a sub-tab.
      Both tab bars swipe horizontally when they overflow.
    </p>

    <!-- Main tabs (Swiper pill bar) -->
    <DemoTabs v-model="active" :tabs="mainTabs" variant="pill" />

    <!-- Demo components -->
    <Transition name="srd-fade" mode="out-in">
      <RModalDemo v-if="active === 'modal'" key="modal" />
      <RSliderDemo v-else-if="active === 'slider'" key="slider" />
      <RDrawerDemo v-else key="drawer" />
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Components are auto-imported by name — place the files in `components/`
// (or add explicit imports if your folder adds a name prefix).
const mainTabs = [
  { key: 'modal',  label: 'RModal',  icon: 'ri-window-line' },
  { key: 'slider', label: 'RSlider', icon: 'ri-layout-right-line' },
  { key: 'drawer', label: 'RDrawer', icon: 'ri-layout-bottom-line' },
]

const active = ref('modal')
</script>

<style lang="scss" scoped>
.rcd {
  max-width: 820px;
  margin: 0 auto;
  padding: var(--sp-6);

  h1 {
    margin-bottom: var(--sp-2);
    font-size: 20px;
  }
}
</style>