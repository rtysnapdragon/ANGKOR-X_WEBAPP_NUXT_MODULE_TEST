<template>
  <svg class="stat-circle" width="80" viewBox="0 0 20 20">
    <circle class="bg" cx="10" cy="10" r="8" />
    <circle
      class="progress"
      cx="10"
      cy="10"
      r="8"
      :stroke-dasharray="circumference"
      :stroke-dashoffset="offset"
      ref="progressCircle"
    />
  </svg>
</template>

<script setup>
import gsap from 'gsap';

const props = defineProps({
  percentage: {
    type: Number,
    required: true,
  },
});

const radius = 8; 
const circumference = 2 * Math.PI * radius; 

const offset = computed(() => {
  return (100 - props.percentage) / 100 * circumference;
});

const progressCircle = ref(null);

onMounted(() => {
  animateProgress();
});

const animateProgress = () => {
  gsap.to(progressCircle.value, {
    strokeDashoffset: offset.value,
    duration: 1,
    ease: 'power1.out',
  });
};

watch(() => props.percentage, () => {
  animateProgress();
});
</script>

<style scoped>
.stat-circle {
  fill: none;
  stroke-width: 2.5;
  width: 30px;
  height: 30px;
}

.bg {
  stroke: #ddd;
}

.progress {
  stroke: #007bff; /* Customize progress color */
  stroke-linecap: round;
  transform: rotate(-90deg);
  transform-origin: center;
}
</style>
