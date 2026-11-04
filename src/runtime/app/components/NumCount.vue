
<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'

type NumberFormat = 'standard' | 'compact' | 'percent'

interface Props {
  value: number | string
  duration?: number
  prefix?: string
  suffix?: string
  separator?: boolean
  format?: NumberFormat
  compactDigits?: number
  startOnMount?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  duration: 1500,
  prefix: '',
  suffix: '',
  separator: true,
  format: 'standard',
  compactDigits: 1,
  startOnMount: true
})

const current = ref(0)

let animationFrame: number | null = null

const target = computed(() => {
  const number = Number(props.value)
  return Number.isFinite(number) ? Math.trunc(number) : 0
})

// const displayValue = computed(() => {
//   const value = Math.trunc(current.value)

//   if (props.format === 'compact') {
//     return new Intl.NumberFormat('en', {
//       notation: 'compact',
//       maximumFractionDigits: props.compactDigits,
//       minimumFractionDigits: 0
//     }).format(value)
//   }

//   return props.separator
//     ? value.toLocaleString()
//     : String(value)
// })
const displayValue = computed(() => {
  const value = Math.trunc(current.value)

  switch (props.format) {
    case 'compact':
      return new Intl.NumberFormat('en', {
        notation: 'compact',
        maximumFractionDigits: props.compactDigits,
        minimumFractionDigits: 0
      }).format(value)

    case 'percent':
      return `${value}%`

    case 'standard':
    default:
      return props.separator
        ? value.toLocaleString()
        : String(value)
  }
})
function cancelAnimation() {
  if (animationFrame !== null) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
  }
}

function animateCount(from: number, to: number) {
  cancelAnimation()

  if (from === to || props.duration <= 0) {
    current.value = to
    return
  }

  const startTime = performance.now()
  const duration = props.duration

  function update(now: number) {
    const progress = Math.min((now - startTime) / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)

    current.value = Math.trunc(from + (to - from) * eased)

    if (progress < 1) {
      animationFrame = requestAnimationFrame(update)
    } else {
      current.value = to
      animationFrame = null
    }
  }

  animationFrame = requestAnimationFrame(update)
}

watch(target, (next, previous) => {
  animateCount(previous, next)
})

onMounted(() => {
  if (props.startOnMount) {
    current.value = 0
    animateCount(0, target.value)
  } else {
    current.value = target.value
  }
})


onBeforeUnmount(cancelAnimation)
</script>

<template>
  <span class="num-count" aria-live="off">
    {{ prefix || '' }}{{ displayValue || '' }}{{ suffix || '' }}
  </span>
</template>

<style scoped lang="scss">
.num-count {
  display: inline-block;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: var(--c-text);
}
</style>



<!-- 2,400+
<NumCount :value="2400" suffix="+" />

2.4K+
<NumCount :value="2400" format="compact" suffix="+" />

50K+
<NumCount :value="50000" format="compact" compact-digits="0" suffix="+" />

10M+
<NumCount :value="10000000" format="compact" compact-digits="0" suffix="+" />

$2.5M
<NumCount :value="2500000" format="compact" prefix="$" /> -->
<!-- <NumCount :value="2400" format="standard" />
<NumCount :value="2400" format="compact" />
<NumCount :value="98" format="percent" />

Usage examples
Format	Value	Output
standard	2400	2,400
standard	50000	50,000
compact	2400	2.4K
compact	1500000	1.5M
percent	98	98% -->