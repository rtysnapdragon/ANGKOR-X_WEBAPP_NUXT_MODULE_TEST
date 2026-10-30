<template>
  <div :class="`w-full h-full flex justify-center items-center rty-loader ${loading ? '' : 'rty-hide-lodader'
    } ${fullscreen ? 'rty-loader-fullscreen' : ''}`">
     <svg class="rty-loading-container" viewBox="0 0 40 40" height="40" width="40">
      <circle class="track" cx="20" cy="20" r="17.5" pathlength="100" stroke-width="5px" fill="none" />
      <circle class="car" cx="20" cy="20" r="17.5" pathlength="100" stroke-width="5px" fill="none" />
    </svg>
  </div>
</template>

<script setup>
const props = defineProps(["loading", "fullscreen"]);
const loading = computed(() => props.loading ?? false);
const fullscreen = computed(() => props.fullscreen ?? false);
</script>

<style scoped lang="scss">
.rty-loader {
  &.rty-hide-lodader {
    pointer-events: none !important;
    background-color: transparent;
    visibility: hidden;
    z-index: -1;
  }

  &.rty-loader-fullscreen {
    position: absolute;
    width: 100vw;
    height: 100vh;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: var(--bg-wrapper);
    z-index: 0;
  }
  .rty-loading-container {
    --uib-size: 22px;
    --uib-color: var(--color-w-b-1);
    --uib-speed: .8s;
    --uib-bg-opacity: 0.1;
    height: var(--uib-size);
    width: var(--uib-size);
    transform-origin: center;
    animation: rotate var(--uib-speed) linear infinite;
    will-change: transform;
    overflow: visible;

  .car {
    fill: none;
    stroke: var(--uib-color);
    stroke-dasharray: 25, 75;
    stroke-dashoffset: 0;
    stroke-linecap: round;
    transition: stroke 0.5s ease;
  }

  .track {
    fill: none;
    stroke: var(--uib-color);
    opacity: var(--uib-bg-opacity);
    transition: stroke 0.5s ease;
  }

  @keyframes rotate {
    100% {
      transform: rotate(360deg);
    }
  }
  }
}


</style>
