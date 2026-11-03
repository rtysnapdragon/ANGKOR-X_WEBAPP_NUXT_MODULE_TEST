
<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  value: {
    type: Number,
    default: 0,
  },
  duration: {
    type: Number,
    default: 800,
  },
  decimals: {
    type: Number,
    default: 0,
  },
  format: {
    type: String,
    default: 'standard', // standard | compact | percent
    validator: (value) =>
      ['standard', 'compact', 'percent'].includes(value),
  },
  locale: {
    type: String,
    default: undefined,
  },
  prefix: {
    type: String,
    default: '',
  },
  suffix: {
    type: String,
    default: '',
  },
  isIncrease: {
    type: Boolean,
    default: null,
  },
  fallback: {
    type: String,
    default: '—',
  },
  isFullNum: {
    type: Boolean,
    default: true,
  },
})

const displayed = ref(0)
let animationFrame = null
let mounted = false

const ease = (t) =>
  t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2

// const formatter = computed(() => {
//   const decimals = Math.max(0, Math.floor(props.decimals || 0))

//   const options = props.format === 'compact'
//     ? {
//         notation: 'compact',
//         maximumFractionDigits: Math.max(decimals, 1),
//       }
//     : {
//         minimumFractionDigits: decimals,
//         maximumFractionDigits: decimals,
//       }

//   if (props.isIncrease !== null) {
//     options.signDisplay = 'never'
//   }

//   if (props.format === 'percent') {
//     options.style = 'percent'
//   }

//   try {
//     return new Intl.NumberFormat(props.locale, options)
//   } catch {
//     return new Intl.NumberFormat(undefined, options)
//   }
// })
const formatter = computed(() => {
  const decimals = Math.max(0, Math.floor(props.decimals || 0))

  const options = props.isFullNum
    ? {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }
    : props.format === 'compact'
      ? {
          notation: 'compact',
          maximumFractionDigits: Math.max(decimals, 1),
        }
      : {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }

  if (props.format === 'percent') {
    options.style = 'percent'
  }

  try {
    return new Intl.NumberFormat(props.locale, options)
  } catch {
    return new Intl.NumberFormat(undefined, options)
  }
})
const sign = computed(() => {
  if (props.isIncrease === true) return '+'
  if (props.isIncrease === false) return '-'
  return ''
})

const render = (number) => {
  const value = formatter.value.format(Math.abs(number))

  return `${props.prefix}${sign.value}${value}${props.suffix}`
}

const finalText = computed(() => {
  if (props.value == null || !Number.isFinite(Number(props.value))) {
    return props.fallback
  }

  return render(Number(props.value))
})

const displayedText = computed(() => render(displayed.value))

function stopAnimation() {
  if (animationFrame !== null) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
  }
}

function animateTo(target, from = displayed.value) {
  stopAnimation()

  target = Number(target)

  if (!Number.isFinite(target)) {
    displayed.value = 0
    return
  }

  if (!mounted || props.duration <= 0) {
    displayed.value = target
    return
  }

  const startValue = from
  let startTime

  const tick = (timestamp) => {
    if (startTime === undefined) startTime = timestamp

    const progress = Math.min(
      (timestamp - startTime) / props.duration,
      1,
    )

    displayed.value = startValue + (
      target - startValue
    ) * ease(progress)

    if (progress < 1) {
      animationFrame = requestAnimationFrame(tick)
    } else {
      displayed.value = target
      animationFrame = null
    }
  }

  animationFrame = requestAnimationFrame(tick)
}

watch(
  () => props.value,
  (newValue) => {
    if (newValue == null || !Number.isFinite(Number(newValue))) {
      stopAnimation()
      return
    }

    animateTo(newValue)
  },
)

watch(
  () => props.duration,
  () => animateTo(props.value),
)

onMounted(() => {
  mounted = true
  displayed.value = 0
  animateTo(props.value, 0)
})

onBeforeUnmount(() => {
  mounted = false
  stopAnimation()
})
</script>

<template>
  <span class="animated-number">
    <span
      class="animated-number__value"
      aria-hidden="true"
    >
      {{ displayedText }}
    </span>

    <span class="animated-number__sr">
      {{ finalText }}
    </span>
  </span>
</template>

<style lang="scss" scoped>
.animated-number {
  position: relative;
  display: inline-block;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' 1;

  &__value {
    display: inline-block;
    font-size: 30px;
    font-weight: 900;
  }

  &__sr {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }
}
</style>


<!--
Displays 14,546
<AnimatedNumber :value="14546" :is-full-num="true" />

Displays 14.5K
<AnimatedNumber :value="14546" format="compact" />

Displays +14,546
<AnimatedNumber
  :value="14546"
  :is-full-num="true"
  :is-increase="true"
/>

<AnimatedNumber
  :value="12.5"
  :decimals="1"
  format="standard"
  suffix="%"
  :is-increase="true"
/>

<AnimatedNumber
  :value="8.2"
  :decimals="1"
  suffix="%"
  :is-increase="false"
/>

Displays 14.5K
<AnimatedNumber
  :value="14546"
  format="compact"
/>

--->