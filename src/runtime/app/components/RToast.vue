<template>
  <div v-if="toastStore.toasts.length" class="fixed bottom-4 right-4 space-y-2 w-100 z-50 min-w-[450px]">
    <transition-group name="toast-fade">
      <div v-for="t in toastStore.toasts" :key="t.id"
        class="p-4 rounded-lg shadow-md color-bg-content relative styleShadowBox" :class="getToastClass(t)"
        @mouseenter="pauseToast(t.id)" @mouseleave="resumeToast(t.id)">
        <button @click="remove(t.id)" class="absolute top-2 right-2 text-gray-500 hover:text-black" aria-label="Close">
          &times;
        </button>
        <div class="color-text text-[15px] font-semibold">{{ t.title }}</div>
        <p class="color-sub-text text-[13px]">{{ t.description }}</p>

        <div v-if="t.open && t.duration" class="w-full h-1 bg-gray-300 mt-2 overflow-hidden">
          <div ref="progressBar" class="h-full" :class="t.type == 'error'
            ? 'bg-red-500'
            : t.type == 'success'
              ? 'bg-green-500'
              : t.type == 'warning'
                ? 'bg-yellow-500'
                : ''
            " :style="{ width: getProgressWidth(t.id) }"></div>
        </div>

        <button v-if="t.action" class="text-sm mt-2 font-medium" :class="t.type == 'error'
          ? 'text-red-600 hover:text-red-800'
          : t.type == 'success'
            ? 'text-green-600 hover:text-green-800'
            : t.type == 'warning'
              ? 'text-yellow-600 hover:text-yellow-800'
              : ''
          " @click="t.action.onClick">
          {{ t.action.label }}
        </button>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
// import { useToastStore } from "#imports";
const { useToastStore } = await import("#imports");
const toastStore = useToastStore();
const toastTimers = ref({});
const progressWidths = ref({});
const progressIntervals = ref({});

// Get the appropriate class for the toast type
function getToastClass(t) {
  return t.type == "error"
    ? "border-red-500"
    : t.type == "success"
      ? "border-green-500"
      : t.type == "warning"
        ? "border-yellow-500"
        : "";
}

// Initialize progress width tracking
function setupToast(t) {
  if (!t.duration) return;

  // Set initial progress width to 100%
  progressWidths.value[t.id] = "100%";

  // Start the progress animation
  startProgressAnimation(t.id, t.duration);

  // Set up the timeout to remove the toast
  toastTimers.value[t.id] = setTimeout(() => {
    remove(t.id);
  }, t.duration);
}

// Start or restart the progress animation
function startProgressAnimation(id, duration) {
  // Clear any existing interval
  if (progressIntervals.value[id]) {
    clearInterval(progressIntervals.value[id]);
  }

  const currentToast = toastStore.toasts.find((t) => t.id === id);
  if (!currentToast) return;

  const startTime = Date.now();
  const endTime = startTime + duration;

  // Update progress at 60fps
  progressIntervals.value[id] = setInterval(() => {
    const now = Date.now();
    const remaining = Math.max(0, endTime - now);
    const percent = (remaining / duration) * 100;

    // Update the width
    progressWidths.value[id] = `${percent}%`;

    // If complete, clear the interval
    if (percent <= 0) {
      clearInterval(progressIntervals.value[id]);
      delete progressIntervals.value[id];
    }
  }, 16); // ~60fps
}

// Get current progress width
function getProgressWidth(id) {
  return progressWidths.value[id] || "100%";
}

// Pause toast and progress
function pauseToast(id) {
  // Clear the timeout
  if (toastTimers.value[id]) {
    clearTimeout(toastTimers.value[id]);
    delete toastTimers.value[id];
  }

  // Stop the progress animation
  if (progressIntervals.value[id]) {
    clearInterval(progressIntervals.value[id]);
    delete progressIntervals.value[id];
  }
}

// Resume toast and progress
function resumeToast(id) {
  const currentToast = toastStore.toasts.find((t) => t.id === id);
  if (!currentToast || !currentToast.duration) return;

  // Calculate remaining time based on current progress width
  const currentWidth = progressWidths.value[id] || "0%";
  const percentRemaining = parseFloat(currentWidth);
  const remainingTime = (percentRemaining / 100) * currentToast.duration;

  // Restart progress animation with remaining time
  startProgressAnimation(id, remainingTime);

  // Set new timeout with remaining time
  toastTimers.value[id] = setTimeout(() => {
    remove(id);
  }, remainingTime);
}

// Clean up resources
function cleanupToast(id) {
  // Clear timeout
  if (toastTimers.value[id]) {
    clearTimeout(toastTimers.value[id]);
    delete toastTimers.value[id];
  }

  // Clear interval
  if (progressIntervals.value[id]) {
    clearInterval(progressIntervals.value[id]);
    delete progressIntervals.value[id];
  }

  // Clear progress width
  delete progressWidths.value[id];
}

// Remove a toast
function remove(id) {
  cleanupToast(id);
  toastStore.remove(id);
}

// Set up watchers and initialize
onMounted(() => {
  // Initialize any existing toasts
  toastStore.toasts.forEach((t) => {
    if (t.duration) {
      setupToast(t);
    }
  });

  // Watch for changes to toasts array
  const unwatchToasts = watch(
    () => [...toastStore.toasts],
    (newToasts, oldToasts) => {
      // Set up new toasts
      newToasts.forEach((t) => {
        if (!oldToasts.some((oldT) => oldT.id === t.id) && t.duration) {
          setupToast(t);
        }
      });

      // Clean up removed toasts
      oldToasts.forEach((oldT) => {
        if (!newToasts.some((t) => t.id === oldT.id)) {
          cleanupToast(oldT.id);
        }
      });
    },
    { deep: true }
  );

  // Clean up on unmount
  onBeforeUnmount(() => {
    unwatchToasts();

    // Clear all timeouts and intervals
    Object.keys(toastTimers.value).forEach((id) => {
      clearTimeout(toastTimers.value[id]);
    });

    Object.keys(progressIntervals.value).forEach((id) => {
      clearInterval(progressIntervals.value[id]);
    });
  });
});
</script>

<style scoped>
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.5s, transform 0.3s;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.styleShadowBox {
  box-shadow: rgba(14, 30, 37, 0.12) 0px 2px 4px 0px, rgba(14, 30, 37, 0.32) 0px 2px 16px 0px;
}
</style>
