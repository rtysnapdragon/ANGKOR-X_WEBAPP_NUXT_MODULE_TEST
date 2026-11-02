
<template>
  <header class="rtyheader">
    <nav
      class="rtyheader__nav"
      :class="props.background"
      aria-label="Main navigation"
    >
      <div class="rtyheader__main">
        <!-- Logo -->
        <div v-if="$slots.logo" class="rtyheader__logo">
          <slot name="logo" />
        </div>

        <!-- Left -->
        <div v-if="$slots.left" class="rtyheader__left">
          <slot name="left" />
        </div>

        <!-- Desktop center -->
        <div v-if="$slots.center" class="rtyheader__center">
          <slot name="center" />
        </div>

        <!-- Right -->
        <div v-if="$slots.right" class="rtyheader__right">
          <slot name="right" />
        </div>

        <!-- Mobile toggle -->
        <button
          v-if="$slots.mobile || $slots.center"
          type="button"
          class="rtyheader__toggle"
          :aria-expanded="mobileMenuOpen"
          aria-controls="rtyheader-mobile-menu"
          :aria-label="mobileMenuOpen ? 'Close menu' : 'Open menu'"
          @click="toggleMobileMenu"
        >
          <svg
            v-if="!mobileMenuOpen"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>

          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m18 6-12 12M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Mobile menu -->
      <Transition name="rtyheader-menu">
        <div
          v-if="mobileMenuOpen"
          id="rtyheader-mobile-menu"
          class="rtyheader__mobile"
        >
          <div class="rtyheader__mobile-content" @click="closeMobileMenu">
            <slot name="mobile">
              <slot name="center" />
            </slot>
          </div>
        </div>
      </Transition>
    </nav>
  </header>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  background: {
    type: String,
    default: '',
  },
})

const mobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

// Close mobile menu when switching to desktop.
if (import.meta.client) {
  const handleResize = () => {
    if (window.innerWidth >= 768) {
      closeMobileMenu()
    }
  }

  watch(mobileMenuOpen, (open) => {
    if (!open) return
  })
  
  // Register and clean up resize listener.
  onMounted(() => window.addEventListener('resize', handleResize))
  onBeforeUnmount(() => window.removeEventListener('resize', handleResize))
}
</script>

<style lang="scss" scoped>
.rtyheader {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 50;
  width: 100%;
  min-width: 0;
  padding: 10px 16px;
  pointer-events: none;

  &__nav {
    position: relative;
    width: 100%;
    max-width: 1440px;
    margin: 0 auto;
    padding: 10px 16px;
    color: var(--c-text);
    background: var(--bg-c-card);
    border: 1px solid var(--c-border);
    border-radius: 14px;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    pointer-events: auto;
  }

  &__main {
    display: flex;
    align-items: center;
    gap: 20px;
    width: 100%;
    min-height: 44px;
    min-width: 0;
  }

  &__logo {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    font-size: 1.5rem;
    font-weight: 700;
  }

  &__left {
    display: flex;
    align-items: center;
    min-width: 0;
  }

  &__center {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    min-width: 0;
    gap: 32px;
    padding: 0 16px;
    font-weight: 600;
  }

  &__right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-shrink: 0;
    gap: 10px;
    margin-left: auto;
  }

  &__toggle {
    display: none;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    padding: 8px;
    color: inherit;
    background: transparent;
    border: 0;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s ease;

    &:hover {
      background: var(--bg-wrapper);
    }

    svg {
      width: 24px;
      height: 24px;
    }
  }

  &__mobile {
    display: none;
  }

  @media (max-width: 767px) {
    padding: 8px 10px;

    &__nav {
      padding: 8px 12px;
    }

    &__main {
      gap: 12px;
    }

    &__center {
      display: none;
    }

    &__right {
      margin-left: auto;
    }

    &__toggle {
      display: inline-flex;
    }

    &__mobile {
      display: block;
      padding-top: 12px;
      margin-top: 10px;
      border-top: 1px solid var(--c-border);
    }

    &__mobile-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 8px 4px;
    }
  }
}

.rtyheader-menu-enter-active,
.rtyheader-menu-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.rtyheader-menu-enter-from,
.rtyheader-menu-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
