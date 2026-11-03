<template>
  <img
    :src="imageSrc"
    loading="lazy"
    @error="handleError"
    :class="className"
  />
</template>

<script setup>
import { computed } from 'vue';
import { UseDefaultImageStore } from '../stores/defaultImage';

const props = defineProps({
  src: {
    type: String,
    default: '',
  },
  errorType: {
    type: String,
    default: 'img', // can be: img, user, avatar, banner, product
  },
  isUrl: {
    type: Boolean,
    default: true,
  },
  class: {
    type: String,
    default: '',
  },
  border: {
    type: String,
    default: '',
  }
});

const defaultImg = UseDefaultImageStore();
const className = computed(() => props.class);
const imageType = computed(() => props.errorType || 'img')
const imageSrc = computed(() => {
  if (!props.src) {
    const fallbackMap = {
      img: new URL('../assets/imgs/placeholder.png', import.meta.url).href,
      user: new URL('../assets/imgs/default-user.png', import.meta.url).href,
      avatar: new URL('../assets/imgs/default-avatar.png', import.meta.url).href,
      banner: new URL('../assets/imgs/default-banner.png', import.meta.url).href,
      product: new URL('../assets/imgs/default-product.png', import.meta.url).href,
    }

    const fallbackMap1 = {
      img: '/imgs/defaultProfile.png',
      user: '/imgs/default-user.png',
      avatar: '/imgs/default-avatar.png',
      banner: '/imgs/default-banner.png',
      product: '/imgs/default-product.png',
    };
    return fallbackMap[props.errorType] || fallbackMap.img;
  }
  return props.isUrl ? getUrl(props.src, true) : props.src;
});

const handleError = (e) => {
  if (!e || e.target.tagName !== 'IMG') return
  // console.log("Err -=====> ", e)//
  // e.target.onerror = null
  // e.target.src = fallbackMap[imageType.value] || fallbackMap.img
  defaultImg.get(e, imageType.value);
};
</script>
