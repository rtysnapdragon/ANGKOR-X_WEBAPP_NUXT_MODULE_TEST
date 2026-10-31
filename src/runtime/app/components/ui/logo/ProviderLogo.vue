
<script setup lang="ts">
import { computed } from 'vue'

type Provider =
  | 'google' | 'facebook' | 'github' | 'microsoft'
  | 'telegram' | 'tiktok' | 'supabase' | 'firebase'
  | 'mysql' | 'postgresql' | 'apple' | 'mongodb'
  | 'redis' | 'sqlite' | 'docker' | 'aws'
  | 'vercel' | 'netlify' | 'linux' | 'android'
  | 'discord' | 'unknown'
  | 'google'
  | 'google-gmail'
  | 'google-drive'
  | 'google-docs'
  | 'google-sheets'
  | 'google-slides'
  | 'google-photos'
  | 'google-maps'
  | 'google-calendar'
  | 'google-meet'
  | 'google-chat'
  | 'google-cloud'
  | 'google-play'
  | 'google-ads'
  | 'google-analytics'
  | 'google-chrome'
  | 'youtube'
  | 'google-gemini'
  | 'google-one'

type LogoVariant = 'plain' | 'solid' | 'soft' | 'outline'
type LogoShape = 'square' | 'rounded' | 'circle'
type LogoAnimation = 'none' | 'hover' | 'pulse' | 'spin'

const props = withDefaults(defineProps<{
  provider: string
  size?: number | string
  color?: string
  background?: string
  padding?: number | string
  radius?: number | string
  border?: string
  variant?: LogoVariant
  shape?: LogoShape
  animation?: LogoAnimation
  hoverEffect?: boolean
  disabled?: boolean
  clickable?: boolean
  label?: string
  title?: string
  svgClass?: string
}>(), {
  size: 24,
  color: 'currentColor',
  background: 'transparent',
  padding: 0,
  radius: '0.375rem',
  border: 'none',
  variant: 'plain',
  shape: 'rounded',
  animation: 'none',
  hoverEffect: false,
  disabled: false,
  clickable: false,
  label: '',
  title: '',
  svgClass: '',
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const aliases: Record<string, Provider> = {
  google: 'google',
  'google-oauth': 'google',
  facebook: 'facebook',
  github: 'github',
  gitlab: 'github',
  microsoft: 'microsoft',
  windows: 'microsoft',
  telegram: 'telegram',
  tiktok: 'tiktok',
  supabase: 'supabase',
  firebase: 'firebase',
  mysql: 'mysql',
  'my-sql': 'mysql',
  postgres: 'postgresql',
  postgresql: 'postgresql',
  'postgre-sql': 'postgresql',
  apple: 'apple',
  mac: 'apple',
  macos: 'apple',
  ios: 'apple',
  'apple-id': 'apple',
  mongodb: 'mongodb',
  mongo: 'mongodb',
  redis: 'redis',
  sqlite: 'sqlite',
  docker: 'docker',
  aws: 'aws',
  'amazon-web-services': 'aws',
  vercel: 'vercel',
  netlify: 'netlify',
  linux: 'linux',
  android: 'android',
  discord: 'discord',
  // Google products
  'google-gmail': 'google-gmail',
  gmail: 'google-gmail',
  'google-drive': 'google-drive',
  drive: 'google-drive',
  'google-docs': 'google-docs',
  'google-doc': 'google-docs',
  'google-documents': 'google-docs',
  docs: 'google-docs',
  'google-sheets': 'google-sheets',
  sheets: 'google-sheets',
  'google-slides': 'google-slides',
  slides: 'google-slides',
  'google-photos': 'google-photos',
  photos: 'google-photos',
  'google-maps': 'google-maps',
  maps: 'google-maps',
  'google-calendar': 'google-calendar',
  calendar: 'google-calendar',
  'google-meet': 'google-meet',
  meet: 'google-meet',
  'google-chat': 'google-chat',
  'google-cloud': 'google-cloud',
  gcp: 'google-cloud',
  'google-play': 'google-play',
  'play-store': 'google-play',
  'google-ads': 'google-ads',
  'google-adwords': 'google-ads',
  'google-analytics': 'google-analytics',
  analytics: 'google-analytics',
  'google-chrome': 'google-chrome',
  chrome: 'google-chrome',
  youtube: 'youtube',
  'google-youtube': 'youtube',
  'google-gemini': 'google-gemini',
  gemini: 'google-gemini',
  'google-one': 'google-one',
}

const normalizedProvider = computed<Provider>(() => {
  return aliases[props.provider?.toLowerCase().trim()] ?? 'unknown'
})

const providerLabel = computed(() => {
  const labels: Record<Provider, string> = {
    google: 'Google',
    facebook: 'Facebook',
    github: 'GitHub',
    microsoft: 'Microsoft',
    telegram: 'Telegram',
    tiktok: 'TikTok',
    supabase: 'Supabase',
    firebase: 'Firebase',
    mysql: 'MySQL',
    postgresql: 'PostgreSQL',
    apple: 'Apple',
    mongodb: 'MongoDB',
    redis: 'Redis',
    sqlite: 'SQLite',
    docker: 'Docker',
    aws: 'Amazon Web Services',
    vercel: 'Vercel',
    netlify: 'Netlify',
    linux: 'Linux',
    android: 'Android',
    discord: 'Discord',
    unknown: 'Unknown provider',
    'google-gmail': 'Gmail',
    'google-drive': 'Google Drive',
    'google-docs': 'Google Docs',
    'google-sheets': 'Google Sheets',
    'google-slides': 'Google Slides',
    'google-photos': 'Google Photos',
    'google-maps': 'Google Maps',
    'google-calendar': 'Google Calendar',
    'google-meet': 'Google Meet',
    'google-chat': 'Google Chat',
    'google-cloud': 'Google Cloud',
    'google-play': 'Google Play',
    'google-ads': 'Google Ads',
    'google-analytics': 'Google Analytics',
    'google-chrome': 'Google Chrome',
    'youtube': 'YouTube',
    'google-gemini': 'Google Gemini',
    'google-one': 'Google One',
  }

  return labels[normalizedProvider.value]
})

const iconSize = computed(() =>
  typeof props.size === 'number' ? `${props.size}px` : props.size,
)

const cssSize = computed(() => ({
  '--logo-size': iconSize.value,
  '--logo-color': props.color,
  '--logo-background': props.background,
  '--logo-padding': typeof props.padding === 'number'
    ? `${props.padding}px`
    : props.padding,
  '--logo-radius': props.shape === 'circle'
    ? '50%'
    : props.shape === 'square'
      ? '0'
      : typeof props.radius === 'number'
        ? `${props.radius}px`
        : props.radius,
  '--logo-border': props.border,
}))

const classes = computed(() => [
  `provider-logo--${props.variant}`,
  `provider-logo--${props.shape}`,
  `provider-logo--animation-${props.animation}`,
  {
    'provider-logo--hover': props.hoverEffect,
    'provider-logo--disabled': props.disabled,
    'provider-logo--clickable': props.clickable && !props.disabled,
  },
])

// function handleClick(event: MouseEvent) {
//   if (props.disabled || !props.clickable) return
//   emit('click', event)
// }
function handleClick(event: MouseEvent | KeyboardEvent) {
  if (props.disabled || !props.clickable) return

  // Emit the original mouse event for clicks.
  // For keyboard activation, emit a compatible MouseEvent.
  if (event instanceof MouseEvent) {
    emit('click', event)
  } else {
    emit(
      'click',
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: globalThis.window,
      }),
    )
  }
}

// function handleClick(event: MouseEvent) {
//   if (props.disabled || !props.clickable) return
//   emit('click', event)
// }

// function handleKeydown(event: KeyboardEvent) {
//   if (props.disabled || !props.clickable) return

//   if (event.key === 'Enter' || event.key === ' ') {
//     event.preventDefault()

//     emit(
//       'click',
//       new MouseEvent('click', {
//         bubbles: true,
//         cancelable: true,
//       }),
//     )
//   }
// }

// Remove the old @keydown.enter.prevent and @keydown.space.prevent bindings.
</script>

<template>
  <span
    class="provider-logo"
    :class="classes"
    :style="cssSize"
    :role="clickable ? 'button' : 'img'"
    :tabindex="clickable && !disabled ? 0 : undefined"
    :aria-label="label || providerLabel"
    :aria-disabled="disabled || undefined"
    :title="title || label || providerLabel"
    @click="handleClick"
    @keydown.enter.prevent="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      :width="iconSize"
      :height="iconSize"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      :class="svgClass"
    >
      <!-- Google -->
      <template v-if="normalizedProvider === 'google'">
        <path fill="#4285F4" d="M23.49 12.27c0-.78-.07-1.53-.2-2.27H12v4.51h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.87c2.27-2.09 3.57-5.17 3.57-8.85Z"/>
        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.92l-3.87-3c-1.08.72-2.46 1.15-4.06 1.15-3.12 0-5.77-2.1-6.72-4.93H1.28v3.09A12 12 0 0 0 12 24Z"/>
        <path fill="#FBBC05" d="M5.28 14.3a7.2 7.2 0 0 1 0-4.6V6.61H1.28a12 12 0 0 0 0 10.78l4-3.09Z"/>
        <path fill="#EA4335" d="M12 4.77c1.77 0 3.35.61 4.6 1.81l3.45-3.45C17.94 1.17 15.24 0 12 0A12 12 0 0 0 1.28 6.61l4 3.09C6.23 6.87 8.88 4.77 12 4.77Z"/>
      </template>

      <!-- Facebook -->
      <template v-else-if="normalizedProvider === 'facebook'">
        <path fill="#1877F2" d="M24 12a12 12 0 1 0-13.88 11.86v-8.39H7.08V12h3.04V9.35c0-3 1.79-4.66 4.53-4.66 1.31 0 2.68.23 2.68.23v2.95h-1.51c-1.49 0-1.95.93-1.95 1.88V12h3.32l-.53 3.47h-2.79v8.39A12 12 0 0 0 24 12Z"/>
      </template>

      <!-- GitHub -->
      <template v-else-if="normalizedProvider === 'github'">
        <path fill="currentColor" d="M12 .8a11.5 11.5 0 0 0-3.64 22.41c.58.11.79-.25.79-.56v-2.2c-3.22.7-3.9-1.36-3.9-1.36-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.57-.29-5.27-1.29-5.27-5.73 0-1.27.45-2.31 1.19-3.13-.12-.29-.52-1.48.11-3.08 0 0 .97-.31 3.16 1.19a10.95 10.95 0 0 1 5.76 0c2.2-1.5 3.16-1.19 3.16-1.19.63 1.6.23 2.79.11 3.08.74.82 1.19 1.86 1.19 3.13 0 4.45-2.7 5.43-5.28 5.72.41.36.78 1.06.78 2.14v3.23c0 .31.21.68.8.56A11.5 11.5 0 0 0 12 .8Z"/>
      </template>

      <!-- Microsoft -->
      <template v-else-if="normalizedProvider === 'microsoft'">
        <path fill="#F25022" d="M1 1h10v10H1z"/>
        <path fill="#7FBA00" d="M13 1h10v10H13z"/>
        <path fill="#00A4EF" d="M1 13h10v10H1z"/>
        <path fill="#FFB900" d="M13 13h10v10H13z"/>
      </template>

      <!-- Telegram -->
      <template v-else-if="normalizedProvider === 'telegram'">
        <circle cx="12" cy="12" r="12" fill="#27A7E7"/>
        <path fill="#FFF" d="m5.1 11.6 12.1-4.67c.56-.2 1.05.14.87.98l-2.06 9.71c-.15.69-.56.86-1.13.53l-3.12-2.3-1.51 1.46c-.17.17-.31.31-.63.31l.22-3.18 5.79-5.23c.25-.22-.06-.35-.39-.13l-7.15 4.5-3.08-.96c-.67-.21-.68-.67.08-1.02Z"/>
      </template>

      <!-- TikTok -->
      <template v-else-if="normalizedProvider === 'tiktok'">
        <path fill="#25F4EE" d="M15.6 1h3.1c.22 2.13 1.42 3.88 3.3 4.77v3.3a9.3 9.3 0 0 1-6.4-2.52v8.3a6.7 6.7 0 1 1-6.7-6.7c.4 0 .8.04 1.2.12v3.48a3.4 3.4 0 1 0 2.2 3.2V1h3.3Z" transform="translate(-1 0)"/>
        <path fill="#FE2C55" d="M18.1 1h-3.3v14.95a3.4 3.4 0 0 1-5.3 2.82 3.4 3.4 0 0 0 6.1-2.06V8.41a9.3 9.3 0 0 0 6.4 2.52V7.64c-2.34-.93-3.74-2.98-3.9-5.64Z" opacity=".85"/>
        <path fill="currentColor" d="M14.8 1h3.3c.16 2.66 1.56 4.71 3.9 5.64v3.29a9.3 9.3 0 0 1-6.4-2.52v8.3a6.7 6.7 0 1 1-6.7-6.7c.4 0 .8.04 1.2.12v3.48a3.4 3.4 0 1 0 2.2 3.2V1h2.5Z"/>
      </template>

      <!-- Supabase -->
      <template v-else-if="normalizedProvider === 'supabase'">
        <path fill="#3ECF8E" d="M13.5 2.1a1.1 1.1 0 0 0-2-.5L1.8 14.1a1.1 1.1 0 0 0 .9 1.8h7.1l-.9 6a1.1 1.1 0 0 0 2 .6l11.3-13.9a1.1 1.1 0 0 0-.9-1.8h-8.1l.3-4.7Z"/>
      </template>

      <!-- Firebase -->
      <template v-else-if="normalizedProvider === 'firebase'">
        <path fill="#FFCA28" d="M4.1 16.5 6.7 2.4c.1-.7 1-.9 1.4-.3l2.7 5.1-6.7 9.3Z"/>
        <path fill="#FFA000" d="m4.1 16.5 6.7-9.3 3.2-6.1c.3-.6 1.2-.5 1.4.2l4.5 22.1L4.1 16.5Z"/>
        <path fill="#FFCA28" d="m4.1 16.5 15.8 6.9-8.1-14.3-7.7 7.4Z"/>
        <path fill="#F57C00" d="m11.8 9.1-7.7 7.4 15.8 6.9L11.8 9.1Z"/>
      </template>

      <!-- MySQL -->
      <template v-else-if="normalizedProvider === 'mysql'">
        <path fill="#00758F" d="M2 17.8c3.7 1.4 6.3-.2 8.1-2.1 1.3-1.3 2.3-2.8 4.1-2.7 1.5.1 2.3 1.1 3.1 1.5-.8-1.9-2.2-2.9-4-2.8-2.2.1-3.3 1.8-4.9 3.2-1.9 1.7-3.8 2.2-6.4 1.6Z"/>
        <path fill="#F29111" d="M12.3 5.4c1.8-.7 3.3-.1 4.4 1.2.8 1 1.4 2.3 2.5 2.9-.6-2.8-2-5.1-4.3-5.8-1.7-.5-3.4.1-4.5 1.2-.8.8-1.4 2-1.9 3.2 1.1-1.2 2.3-2.1 3.8-2.7Z"/>
        <path fill="#00758F" d="M16.8 9.8c1.6.5 2.8 1.8 3.4 3.4.6 1.8.4 3.6-.4 5.1 1.9-1.2 3.1-3.5 2.6-5.9-.5-2.3-2.3-4.1-4.5-4.6l-1.1 2Z"/>
      </template>

      <!-- PostgreSQL -->
      <template v-else-if="normalizedProvider === 'postgresql'">
        <path fill="#336791" d="M12 1.2c-3.8 0-6.5 1.9-7.5 5.4-.6 2.2-.2 4.8.6 6.9.5 1.4 1.2 2.7 2.2 3.6l.1 3.2c0 1.3.8 2 2 1.8l2.4-.4c.7-.1 1.1-.7 1.1-1.4v-2.1c.7.1 1.5.1 2.2 0v2.1c0 .7.4 1.3 1.1 1.4l2.4.4c1.2.2 2-.5 2-1.8l.1-3.2c1-1 1.7-2.2 2.2-3.6.8-2.1 1.2-4.7.6-6.9-1-3.5-3.7-5.4-7.5-5.4H12Zm-3.8 6c.9 0 1.6.9 1.6 2s-.7 2-1.6 2-1.6-.9-1.6-2 .7-2 1.6-2Zm7.6 0c.9 0 1.6.9 1.6 2s-.7 2-1.6 2-1.6-.9-1.6-2 .7-2 1.6-2Z"/>
        <path fill="#FFF" d="M8.2 7.2c.4 0 .7.5.7 1.1s-.3 1.1-.7 1.1-.7-.5-.7-1.1.3-1.1.7-1.1Zm7.6 0c.4 0 .7.5.7 1.1s-.3 1.1-.7 1.1-.7-.5-.7-1.1.3-1.1.7-1.1Z"/>
      </template>

      <!-- Apple / Mac / iOS -->
      <template v-else-if="normalizedProvider === 'apple'">
        <path fill="currentColor" d="M17.1 12.8c0-2.5 2-3.7 2.1-3.8-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-2-.9-3.2-.9-1.6 0-3.1.9-4 2.3-1.7 2.9-.4 7.2 1.2 9.6.8 1.2 1.7 2.5 2.9 2.4 1.2-.1 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.1-1.2 2.9-2.5.9-1.4 1.2-2.8 1.2-2.9-.1 0-2.3-.9-2.3-3.2ZM14.6 5.5c.7-.9 1.2-2.1 1.1-3.3-1.1.1-2.4.7-3.1 1.6-.7.8-1.3 2-1.1 3.2 1.2.1 2.4-.6 3.1-1.5Z"/>
      </template>

      <!-- MongoDB -->
      <template v-else-if="normalizedProvider === 'mongodb'">
        <path fill="#00684A" d="M12 1.1c-.3 1.5-1.1 2.4-2.1 3.7-2.5 3.1-4.4 5.9-3.8 9.6.4 2.8 2.5 5.1 5.1 6.1l.3 2.4h1l.3-2.4c2.6-1 4.7-3.3 5.1-6.1.6-3.7-1.3-6.5-3.8-9.6-1-1.3-1.8-2.2-2.1-3.7Z"/>
        <path fill="#00ED64" d="M12 4.2v16.3c2.4-1 4.3-3.2 4.7-5.8.5-3.3-1.3-5.9-3.6-8.8L12 4.2Z"/>
      </template>

      <!-- Redis -->
      <template v-else-if="normalizedProvider === 'redis'">
        <path fill="#A41E11" d="m2 7 10-4 10 4-10 4L2 7Z"/>
        <path fill="#D82C20" d="m2 7 10 4v10L2 17V7Z"/>
        <path fill="#A41E11" d="m22 7-10 4v10l10-4V7Z"/>
      </template>

      <!-- SQLite -->
      <template v-else-if="normalizedProvider === 'sqlite'">
        <path fill="#0F80CC" d="M4 2h11l5 5v15H4V2Z"/>
        <path fill="#FFF" d="M15 2v5h5L15 2Z"/>
        <path fill="#FFF" d="M7 11h10v1.5H7zm0 3.5h10V16H7zm0 3.5h7v1.5H7z"/>
      </template>

      <!-- Docker -->
      <template v-else-if="normalizedProvider === 'docker'">
        <path fill="#2496ED" d="M23.1 10.3c-.7-.5-2.3-.7-3.8-.4-.2-1.4-1-2.7-2.1-3.6l-.4-.3-.3.4c-.7 1.1-1 2.6-.8 4-.1 0-.3.1-.5.1H2.1l-.1.5c-.3 1.9 0 4.1 1.3 5.8 1.4 1.9 3.6 2.8 6.5 2.8 6.4 0 11.2-2.9 13.4-8.3l.2-.5-.3-.5ZM5 9h2v2H5V9Zm3 0h2v2H8V9Zm3 0h2v2h-2V9Zm-3-3h2v2H8V6Zm3 0h2v2h-2V6Zm3 3h2v2h-2V9Z"/>
      </template>

      <!-- AWS -->
      <template v-else-if="normalizedProvider === 'aws'">
        <path fill="#232F3E" d="M4 3h16v15H4V3Z"/>
        <path fill="#FF9900" d="M6.2 8.2c0-1.7 1.3-2.8 3.4-2.8 1.1 0 2.1.2 3 .6l-.7 1.7c-.7-.3-1.4-.5-2.1-.5-.8 0-1.3.3-1.3.8 0 .4.4.6 1.7.9 1.9.4 2.7 1.1 2.7 2.5 0 1.8-1.5 2.9-3.7 2.9-1.2 0-2.5-.3-3.5-.8l.7-1.7c.9.4 1.8.7 2.7.7.9 0 1.4-.3 1.4-.8 0-.4-.4-.6-1.8-.9-1.7-.4-2.5-1.1-2.5-2.6Z"/>
        <path fill="#FF9900" d="M3 20c5.4 2.1 11.8 2.2 17.7-.4l.4 1.2c-5.5 3.3-13.4 3-18.1-.8Z"/>
      </template>

      <!-- Vercel -->
      <template v-else-if="normalizedProvider === 'vercel'">
        <path fill="currentColor" d="M12 2 23 21H1L12 2Z"/>
      </template>

      <!-- Netlify -->
      <template v-else-if="normalizedProvider === 'netlify'">
        <path fill="#00AD9F" d="m12 1 4 4-4 4-4-4 4-4Zm-5 5 4 4-4 4-4-4 4-4Zm10 0 4 4-4 4-4-4 4-4Zm-5 5 4 4-4 4-4-4 4-4ZM2 14h5v2H2v-2Zm15 0h5v2h-5v-2Z"/>
      </template>

      <!-- Linux -->
      <template v-else-if="normalizedProvider === 'linux'">
        <path fill="#111" d="M12 1.5c-3.4 0-4.4 3.3-4.4 6.3 0 1.8-.9 3.2-1.7 4.8-.8 1.6-.8 3.3.3 4.1.7.5 1.4.2 2.1-.3l.8 4.1c.2 1 1 1.6 2 1.6h1.8c1 0 1.8-.6 2-1.6l.8-4.1c.7.5 1.4.8 2.1.3 1.1-.8 1.1-2.5.3-4.1-.8-1.6-1.7-3-1.7-4.8 0-3-1-6.3-4.4-6.3Z"/>
        <path fill="#FFF" d="M9.4 7.2a.8.8 0 1 0 0 1.6.8.8 0 0 0 0-1.6Zm5.2 0a.8.8 0 1 0 0 1.6.8.8 0 0 0 0-1.6Z"/>
        <path fill="#F5C400" d="M9 13h6v2H9z"/>
      </template>

      <!-- Android -->
      <template v-else-if="normalizedProvider === 'android'">
        <path fill="#3DDC84" d="M6.3 8.2 4.6 5.3a.5.5 0 0 1 .9-.5l1.8 3.1a10 10 0 0 1 9.4 0l1.8-3.1a.5.5 0 0 1 .9.5l-1.7 2.9a8 8 0 0 1 3.1 6.3H3.2a8 8 0 0 1 3.1-6.3ZM7 10.5a.8.8 0 1 0 0 1.6.8.8 0 0 0 0-1.6Zm10 0a.8.8 0 1 0 0 1.6.8.8 0 0 0 0-1.6ZM5 16h2v4H5v-4Zm12 0h2v4h-2v-4ZM2 15h2v5H2v-5Zm18 0h2v5h-2v-5Z"/>
      </template>

      <!-- Discord -->
      <template v-else-if="normalizedProvider === 'discord'">
        <path fill="#5865F2" d="M19.7 5.1A18.8 18.8 0 0 0 15 3.6l-.6 1.2a17.2 17.2 0 0 0-4.8 0L9 3.6a18.8 18.8 0 0 0-4.7 1.5C1.3 9.5.5 13.8.9 18a19 19 0 0 0 5.8 3l1.2-2a12 12 0 0 1-1.9-.9l.5-.4c3.6 1.7 7.5 1.7 11 0l.5.4a12 12 0 0 1-1.9.9l1.2 2a19 19 0 0 0 5.8-3c.5-4.9-.8-9.2-3.4-12.9ZM8.7 15.4c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2Zm6.6 0c-1.1 0-2-1-2-2.2s.9-2.2 2-2.2 2 1 2 2.2-.9 2.2-2 2.2Z"/>
      </template>

      <!-- Gmail -->
      <template v-else-if="normalizedProvider === 'google-gmail'">
        <path fill="#EA4335" d="M2 6.5 12 14l10-7.5V19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6.5Z"/>
        <path fill="#C5221F" d="M2 6.5V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1.5L12 14 2 6.5Z"/>
        <path fill="#FFF" d="M2 5.1 12 12l10-6.9v3L12 15 2 8.1v-3Z"/>
        <path fill="#4285F4" d="M2 6.5 5 8.8V21H4a2 2 0 0 1-2-2V6.5Z"/>
        <path fill="#34A853" d="M19 8.8 22 6.5V19a2 2 0 0 1-2 2h-1V8.8Z"/>
      </template>

      <!-- Google Drive -->
      <template v-else-if="normalizedProvider === 'google-drive'">
        <!-- Old -->
        <!-- <path fill="#00832D" d="M8.2 2h7.6L7.4 16H0L8.2 2Z" transform="translate(3 0)"/>
        <path fill="#0066DA" d="M7.4 16H22l-3.9 6H3.5L7.4 16Z"/>
        <path fill="#FFBA00" d="M8.2 2h7.6l8.2 14h-7.4L8.2 2Z" transform="translate(-1 0)"/> -->
        <!-- new -->
        <GoogleDriveLogo />
      </template>

      <!-- Google Docs -->
      <template v-else-if="normalizedProvider === 'google-docs'">
        <path fill="#4285F4" d="M5 2h9l5 5v15H5V2Z"/>
        <path fill="#A1C2FA" d="M14 2v5h5L14 2Z"/>
        <path fill="#FFF" d="M8 11h8v1.5H8zm0 3.5h8V16H8zm0 3.5h6v1.5H8z"/>
      </template>

      <!-- Google Sheets -->
      <template v-else-if="normalizedProvider === 'google-sheets'">
        <path fill="#188038" d="M5 2h9l5 5v15H5V2Z"/>
        <path fill="#81C995" d="M14 2v5h5L14 2Z"/>
        <path fill="#FFF" d="M7.5 10h9v9h-9z"/>
        <path fill="#188038" d="M7.5 13h9v1.2h-9zm3.8-3h1.2v9h-1.2z"/>
      </template>

      <!-- Google Slides -->
      <template v-else-if="normalizedProvider === 'google-slides'">
        <path fill="#F9AB00" d="M5 2h9l5 5v15H5V2Z"/>
        <path fill="#FDE293" d="M14 2v5h5L14 2Z"/>
        <rect x="7.5" y="10" width="9" height="7" rx="1" fill="#FFF"/>
        <path d="M12 17v2" stroke="#FFF" stroke-width="1.5"/>
      </template>

      <!-- Google Photos -->
      <template v-else-if="normalizedProvider === 'google-photos'">
        <path fill="#4285F4" d="M12 2a5 5 0 0 0-5 5v5h5V2Z"/>
        <path fill="#34A853" d="M22 12a5 5 0 0 0-5-5h-5v5h10Z"/>
        <path fill="#FBBC04" d="M12 22a5 5 0 0 0 5-5v-5h-5v10Z"/>
        <path fill="#EA4335" d="M2 12a5 5 0 0 0 5 5h5v-5H2Z"/>
      </template>

      <!-- Google Maps -->
      <template v-else-if="normalizedProvider === 'google-maps'">
        <path fill="#34A853" d="M12 2C7.6 2 4 5.5 4 10c0 5.2 8 12 8 12s8-6.8 8-12c0-4.5-3.6-8-8-8Z"/>
        <path fill="#4285F4" d="M12 2a8 8 0 0 0-7.4 4.9l7.4 5.2V2Z"/>
        <path fill="#FBBC04" d="M4.6 6.1A8 8 0 0 0 4 10c0 5.2 8 12 8 12v-9.9L4.6 6.1Z"/>
        <circle cx="12" cy="10" r="3.1" fill="#FFF"/>
        <circle cx="12" cy="10" r="1.8" fill="#4285F4"/>
      </template>

      <!-- Google Calendar -->
      <template v-else-if="normalizedProvider === 'google-calendar'">
        <rect x="3" y="4" width="18" height="18" rx="3" fill="#4285F4"/>
        <path fill="#FFF" d="M3 8h18v3H3z"/>
        <path fill="#EA4335" d="M3 4h18v4H3z"/>
        <path fill="#FFF" d="M7 2h2v5H7zm8 0h2v5h-2z"/>
        <path fill="#FFF" d="M7 13h4v4H7z"/>
      </template>

      <!-- Google Meet -->
      <template v-else-if="normalizedProvider === 'google-meet'">
        <path fill="#00897B" d="M3 6a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z"/>
        <path fill="#00AC47" d="M16 9.5 22 5v14l-6-4.5v-5Z"/>
        <path fill="#4285F4" d="M5 4h9a2 2 0 0 1 2 2v2H3V6a2 2 0 0 1 2-2Z"/>
        <path fill="#EA4335" d="M3 16h13v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2Z"/>
      </template>

      <!-- Google Chat -->
      <template v-else-if="normalizedProvider === 'google-chat'">
        <path fill="#00AC47" d="M3 4h18v13H11l-5 4v-4H3V4Z"/>
        <path fill="#FFF" d="M7 8h10v1.5H7zm0 4h7v1.5H7z"/>
      </template>

      <!-- Google Cloud -->
      <template v-else-if="normalizedProvider === 'google-cloud'">
        <path fill="#4285F4" d="M7 18a5 5 0 0 1-.7-10A6.5 6.5 0 0 1 18 7a5.5 5.5 0 0 1 0 11h-4v-4h4a1.5 1.5 0 0 0 0-3h-2.2l-.5-1.8a2.5 2.5 0 0 0-4.9.7V12H7a3 3 0 0 0 0 6h3v4H7a7 7 0 0 1 0-14Z"/>
        <path fill="#34A853" d="M10 14h4v8h-4z"/>
        <path fill="#FBBC04" d="M3 14h7v4H3z"/>
        <path fill="#EA4335" d="M15 14h6v4h-6z"/>
      </template>

      <!-- Google Play -->
      <template v-else-if="normalizedProvider === 'google-play'">
        <path fill="#00D7FE" d="M3 2v20l10-10L3 2Z"/>
        <path fill="#00A94B" d="m3 2 13 7-3 3L3 2Z"/>
        <path fill="#FFBC00" d="m3 22 13-7-3-3L3 22Z"/>
        <path fill="#FF3A44" d="m13 12 3-3 5 3-5 3-3-3Z"/>
      </template>

      <!-- Google Ads -->
      <template v-else-if="normalizedProvider === 'google-ads'">
        <path fill="#4285F4" d="M9 3a4 4 0 0 1 6.9-2l7.3 12.7a4 4 0 1 1-6.9 4L9 5a4 4 0 0 1 0-2Z" transform="translate(0 2)"/>
        <circle cx="6" cy="18" r="4" fill="#FBBC04"/>
        <path fill="#34A853" d="m12 13 2.3-4 3.7 6.5a4 4 0 0 1-6.9 4l-2-3.5 2.9-3Z"/>
      </template>

      <!-- Google Analytics -->
      <template v-else-if="normalizedProvider === 'google-analytics'">
        <path fill="#F9AB00" d="M4 15a3 3 0 0 1 3 3v2H4a3 3 0 0 1 0-5Z"/>
        <rect x="9" y="8" width="5" height="12" rx="2.5" fill="#E37400"/>
        <rect x="16" y="2" width="5" height="18" rx="2.5" fill="#F9AB00"/>
      </template>

      <!-- Google Chrome -->
      <template v-else-if="normalizedProvider === 'google-chrome'">
        <circle cx="12" cy="12" r="11" fill="#EA4335"/>
        <path fill="#FBBC04" d="M2.5 6.5 8 16l-2.1 4A11 11 0 0 1 2.5 6.5Z"/>
        <path fill="#34A853" d="M8 16h11l-2.2 4A11 11 0 0 1 5.9 20l2.1-4Z"/>
        <circle cx="12" cy="12" r="5.1" fill="#FFF"/>
        <circle cx="12" cy="12" r="4.1" fill="#4285F4"/>
      </template>

      <!-- YouTube -->
      <template v-else-if="normalizedProvider === 'youtube'">
        <rect x="1" y="4" width="22" height="16" rx="5" fill="#FF0033"/>
        <path fill="#FFF" d="M10 8.5 16 12l-6 3.5v-7Z"/>
      </template>

      <!-- Google Gemini -->
      <template v-else-if="normalizedProvider === 'google-gemini'">
        <path fill="#8E75FF" d="M12 1c1.5 5.7 4.3 8.5 11 11-6.7 2.5-9.5 5.3-11 11C10.5 17.3 7.7 14.5 1 12 7.7 9.5 10.5 6.7 12 1Z"/>
        <path fill="#4285F4" d="M19 1c.5 2 1.5 3 4 4-2.5 1-3.5 2-4 4-.5-2-1.5-3-4-4 2.5-1 3.5-2 4-4Z"/>
      </template>

      <!-- Google One -->
      <template v-else-if="normalizedProvider === 'google-one'">
        <path fill="#4285F4" d="M12 2a10 10 0 0 0-8.7 5h5A5 5 0 0 1 17 8h5A10 10 0 0 0 12 2Z"/>
        <path fill="#34A853" d="M21.7 7h-5a5 5 0 0 1-1.3 6.6l2.5 4A10 10 0 0 0 21.7 7Z"/>
        <path fill="#FBBC04" d="m17.9 17.6-2.5-4a5 5 0 0 1-6.8-.1l-2.5 4a10 10 0 0 0 11.8.1Z"/>
        <path fill="#EA4335" d="m6.1 17.5 2.5-4A5 5 0 0 1 7 7H2a10 10 0 0 0 4.1 10.5Z"/>
      </template>

      <!-- Fallback -->
      <template v-else>
        <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" stroke-width="1.5"/>
        <path d="M9.5 9a2.6 2.6 0 1 1 4.2 2.1c-1.1.8-1.7 1.2-1.7 2.4M12 17.5v.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </template>
            
    </svg>
  </span>
</template>

<style lang="scss">
.provider-logo {
  --logo-size: 24px;
  --logo-color: currentColor;
  --logo-background: transparent;
  --logo-padding: 0;
  --logo-radius: 0.375rem;
  --logo-border: none;

  position: relative;
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: calc(var(--logo-size) + var(--logo-padding) * 2);
  height: calc(var(--logo-size) + var(--logo-padding) * 2);
  padding: var(--logo-padding);
  color: var(--logo-color);
  background: var(--logo-background);
  border: var(--logo-border);
  border-radius: var(--logo-radius);
  vertical-align: middle;
  box-sizing: border-box;
  line-height: 1;
  transition:
    color 180ms ease,
    background-color 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease,
    opacity 180ms ease;

  > svg {
    display: block;
    width: var(--logo-size);
    height: var(--logo-size);
    max-width: 100%;
    max-height: 100%;
    overflow: visible;
    transition: transform 180ms ease;
  }

  &--plain {
    background: transparent;
  }

  &--solid {
    background: var(--logo-background);
  }

  &--soft {
    background: var(--logo-background);
  }

  &--outline {
    border: var(--logo-border);
  }

  &--square {
    border-radius: 0;
  }

  &--rounded {
    border-radius: var(--logo-radius);
  }

  &--circle {
    border-radius: 50%;
  }

  &--hover:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgb(0 0 0 / 12%);
  }

  &--clickable {
    cursor: pointer;
    user-select: none;

    &:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: 3px;
    }

    &:active {
      transform: scale(0.96);
    }
  }

  &--disabled {
    opacity: 0.45;
    cursor: not-allowed;
    pointer-events: none;
    filter: grayscale(0.65);
  }

  &--animation-hover:hover > svg {
    transform: scale(1.12);
  }

  &--animation-pulse {
    animation: provider-logo-pulse 1.8s ease-in-out infinite;
  }

  &--animation-spin > svg {
    animation: provider-logo-spin 2.5s linear infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none !important;
    transition: none;

    > svg {
      animation: none !important;
      transition: none;
    }
  }
}

@keyframes provider-logo-pulse {
  0%, 100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.06);
  }
}

@keyframes provider-logo-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

<!-- How to use this template

 <ProviderLogo provider="gmail" :size="32" />
    <ProviderLogo provider="google-drive" :size="32" />
    <ProviderLogo provider="docs" :size="32" />
    <ProviderLogo provider="sheets" :size="32" />
    <ProviderLogo provider="slides" :size="32" />
    <ProviderLogo provider="photos" :size="32" />
    <ProviderLogo provider="maps" :size="32" />
    <ProviderLogo provider="calendar" :size="32" />
    <ProviderLogo provider="meet" :size="32" />
    <ProviderLogo provider="google-cloud" :size="32" />
    <ProviderLogo provider="chrome" :size="32" />
    <ProviderLogo provider="youtube" :size="32" />
    <ProviderLogo provider="gemini" :size="32" />


<ProviderLogo provider="supabase" />

Large logo
<ProviderLogo provider="postgresql" :size="40" />

Circular logo badge
<ProviderLogo
  provider="firebase"
  :size="28"
  :padding="10"
  shape="circle"
  variant="soft"
  background="#fff3d6"
/>

Outlined logo with hover effect
<ProviderLogo
  provider="mongodb"
  :size="32"
  :padding="8"
  variant="outline"
  border="1px solid #00ED64"
  radius="12"
  :hover-effect="true"
/>

Clickable logo
<ProviderLogo
  provider="github"
  :size="28"
  clickable
  :hover-effect="true"
  @click="handleProviderClick"
/>

Animated logo
<ProviderLogo
  provider="supabase"
  :size="32"
  animation="pulse"
/>

 -->