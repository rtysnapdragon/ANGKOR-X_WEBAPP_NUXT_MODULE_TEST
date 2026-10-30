<template>
  <RTooltip
    :text="`${isDark ? $t('switch_to_dark_mode') : $t('switch_to_light_mode')}`"
  >
    <BtnIcon
      :icon="
        isClick
          ? isDark
            ? 'ri-sun-line'
            : 'ri-contrast-2-line'
          : isDark
          ? 'ri-contrast-2-line'
          : 'ri-sun-line'
      "
      @mouseenter="mouseenter"
      @mouseleave="mouseleave"
      :class="type == 'default' ? 'text-white' : ''"
      @click="click"
      class="text-[18px]"
    />
  </RTooltip>
</template>

<script setup>
const modeStore = useModeStore();
const colorMode = useColorMode();
const isDark = ref(colorMode.value == "dark" ? true : false);
const isClick = ref(false);

function mouseenter() {
  isDark.value = !isDark.value;
}
function mouseleave() {
  isDark.value = !isDark.value;
  isClick.value = false;
}
function click() {
  isDark.value = !isDark.value;
  colorMode.preference = colorMode.value == "dark" ? "light" : "dark";
  isClick.value = true;
  modeStore.set(!isDark.value);
}
mounted(() => {
  setTimeout(() => {
    modeStore.set(isDark.value);
  }, 100);
});
</script>
