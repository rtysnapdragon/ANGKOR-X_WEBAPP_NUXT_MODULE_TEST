<script setup lang="ts">
// RThemeToggle — dark/light mode + locale (km/en) switcher
import { useUIStore } from '@/stores/ui'
import { useI18n } from 'vue-i18n'

const ui    = useUIStore()
const { locale } = useI18n()

function toggleLocale() {
  const next = locale.value === 'en' ? 'km' : 'en'
  locale.value = next
  ui.setLocale(next as 'en' | 'km')
}
</script>

<template>
  <div class="r-theme-toggle">
    <!-- Locale -->
    <button
      class="r-theme-toggle__btn"
      :title="locale === 'en' ? 'Switch to Khmer' : 'Switch to English'"
      type="button"
      @click="toggleLocale"
    >
      <span class="r-theme-toggle__lang">{{ locale === 'en' ? 'ខ្មែរ' : 'EN' }}</span>
    </button>

    <!-- Theme -->
    <button
      class="r-theme-toggle__btn"
      :title="ui.isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      type="button"
      @click="ui.toggleTheme"
    >
      <UIcon :name="ui.isDark ? 'i-lucide-sun' : 'i-lucide-moon'" />
    </button>
  </div>
</template>

<style lang="scss" scoped>
.r-theme-toggle {
  display:     flex;
  align-items: center;
  gap:         var(--space-1);

  &__btn {
    width:         34px;
    height:        34px;
    border-radius: var(--radius-md);
    border:        1px solid var(--c-border);
    background:    transparent;
    color:         var(--c-muted);
    cursor:        pointer;

    &:hover {
      color:        var(--c-accent);
      border-color: var(--c-accent);
      background:   rgba(255,140,66,0.08);
    }
  }

  &__lang {
    font-size:   0.72rem;
    font-weight: 600;
    font-family: var(--font-fallback);
  }
}
</style>
