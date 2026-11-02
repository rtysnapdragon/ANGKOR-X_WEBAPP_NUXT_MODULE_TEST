<template>
  <div class="">
    <div class="kottra-wrapper">
      <div class="kottra-navbar-left md:block hidden">
        <MenuNavLeft @show-collapsed="childClick" :is-collapsed="isCollapsed" :is-open="isOpen"
          :style="{ width: navbarWidth + 'px' }" />
        <div :class="`resize-handle ${isCollapsed ? 'hidden' : ''}`" @mousedown="handleMouseDown"></div>
      </div>
      <div class="md:hidden block">
        <USlideover v-model="isOpen" side="left" :style="{ width: navbarWidth + 'px' }">
          <MenuNavDialog :is-open="isOpen" :nav-width="navbarWidth" @closed-menu="menuOpen" />
        </USlideover>
      </div>
      <div class="kottra-navbar-right">
        <NavMain @hide-collapsed="childClick" @open-menu="menuOpen" :is-collapsed="isCollapsed" :is-open="isOpen"
          :window-width="windowWidth" :is-resize="isResizing">
          <slot />
        </NavMain>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useCookie } from "#imports";
const props = defineProps(['type']);
const expires = new Date()
expires.setFullYear(expires.getFullYear() + 1)

const isCollapsed = useCookie('isCollapsed')
const navbarWidth = useCookie('navbarWidth')

const startX = ref(0);
const isResizing = ref(false);
const isOpen = ref(false);


function childClick() {
  console.log("IsCollapsed 1", isCollapsed.value)
  isCollapsed.value = !isCollapsed.value
  console.log("IsCollapsed 2", isCollapsed.value)
}

function menuOpen() {
  isOpen.value = !isOpen.value;
}

const windowWidth = ref(0);

const handleMouseDown = (event) => {
  startX.value = event.pageX;
  isResizing.value = true;
  if (process.client) {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }
};

const handleMouseMove = (event) => {
  event.preventDefault();
  event.stopPropagation();

  if (!navbarWidth.value) navbarWidth.value = 256;

  if (isResizing.value) {
    if (event.pageX >= 190 && event.pageX <= 400) {
      requestAnimationFrame(() => { // Use requestAnimationFrame for smoother animation
        const diffX = event.pageX - startX.value;
        navbarWidth.value += diffX;
        startX.value = event.pageX;
      });
    }

  }
};

const handleMouseUp = () => {
  isResizing.value = false;

  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', handleMouseUp);
};

const handleResize = () => {
  windowWidth.value = window.innerWidth;
  if (windowWidth.value < 768) {
    // isOpen.value = true
  } else {
    isOpen.value = false;
  }
};

mounted(() => {
  console.log("expires", expires.getFullYear())
  windowWidth.value = window.innerWidth;
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', handleMouseUp);
  window.removeEventListener('resize', handleResize);
});


</script>

<style lang="scss" scoped></style>
