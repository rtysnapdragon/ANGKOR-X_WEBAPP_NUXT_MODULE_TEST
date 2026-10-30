<template>
  <div class="r-wrapper-chip">
    <div v-for="(item, i) in items" :class="`r-chip-container color-bg-content ${isNotEmpty(item.value )? '' : 'hidden'
      }`">
      <div class="flex items-center gap-1.5">
        <img :src="item.src" alt="" class="w-5 h-5 rounded-full" v-if="item.src" />
        <div class="w-5 h-5 rounded-full flex justify-center items-center !text-white bg-primary" v-else>
          <span class="text-xs" :style="{ color: textColor }">{{
            item.icon
          }}</span>
        </div>
        <span class="text-xs whitespace-nowrap">{{ item.value }}</span>
      </div>
      <div class="r-chip-cancel" v-if="!item.isNotRemove">
        <i class="ri-close-line transition-all cursor-pointer hover:opacity-75" @click="onRemove(i)"></i>
      </div>
    </div>
  </div>
</template>

<script setup>
const ocChipStore = useRChipDataStore();
const items = defineModel();
const props = defineProps(['stateKey'])
const emit = defineEmits("onRemove");

function onRemove(i) {
  emit("onRemove", items.value[i]);
  items.value[i].value = null;
}

const bgColor = ref("#ffffff");

function getPrimaryColor() {
  const element = document.createElement("div");
  element.className = "bg-primary";
  document.body.appendChild(element);
  const color = getComputedStyle(element).backgroundColor;
  document.body.removeChild(element);
  return color;
}
// Convert RGB to luminance
function getLuminance(rgb) {
  const rgbArray = rgb
    .replace(/rgba?\(|\s+|\)/g, "")
    .split(",")
    .slice(0, 3) // Get only R, G, B values
    .map(Number)
    .map((v) => v / 255) // Normalize to 0-1
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));

  return 0.2126 * rgbArray[0] + 0.7152 * rgbArray[1] + 0.0722 * rgbArray[2];
}

// Determine text color based on luminance
const textColor = computed(() => {
  return getLuminance(bgColor.value) > 0.5 ? "#000" : "#fff"; // Light background → black text, dark background → white text
});

const isMounted = ref(true)

mounted(() => {
  bgColor.value = getPrimaryColor();
  if (isNotEmpty(ocChipStore.getData[props.stateKey])) {
    items.value = ocChipStore.getData[props.stateKey]
  }else{
    const state = { ...ocChipStore?.data??{}, ...{ [props.stateKey]: items.value }, };
    ocChipStore.setData(state);
    console.log('mounted >>', state)
  }
  isMounted.value= false
});

watch(() => items.value, (n) => {
  if (n) {
    if (isNotEmpty(props.stateKey)&&!isMounted.value) {
      const state = { ...ocChipStore.data, ...{ [props.stateKey]: n }, };
      ocChipStore.setData(state);
      console.log(props.stateKey,'watch chip >>>>', n)
    }
    // ocChipStore.setData(n)
    bgColor.value = getPrimaryColor();
  }
}, { deep: true, immediate: true })
</script>

<style lang="scss" scoped>
.color-bg-content {
  .r-chip-container {
    background-color: var(--bg-wrapper) !important;
  }
}

.r-wrapper-chip {
  display: flex;
  grid-gap: 4px;
  align-items: center;
  flex-wrap: wrap;

  .r-chip-container {
    &.hidden{
      display: none;
    }
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 6px;
    padding: 4px 22px 4px 6px;
    border-radius: 8px;
    margin-top: 0px;

    @media (max-width: 768px) {
      margin-top: 12px;
    }

    .r-chip-cancel {
      position: absolute;
      top: 6px;
      right: 4px;
      display: flex;
      justify-content: center;
      align-items: center;

      i {
        font-size: 14px;
        line-height: 1rem;
      }
    }
  }
}
</style>

<!-- :style="`background-color:${generateColor(item.icon)}` -->
