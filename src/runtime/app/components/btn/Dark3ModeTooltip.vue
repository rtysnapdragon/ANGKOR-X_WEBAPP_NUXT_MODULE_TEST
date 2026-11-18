<template>
  <div class="flex justify-center items-center">
    <!-- Only one icon will be visible at a time -->
    
    <!-- Dark Mode Icon (Only visible when currentMode is 'dark') -->
    <div 
      v-if="currentMode === 'dark'"
      @click="cycleMode"
      class="cursor-pointer flex justify-center items-center"
      title="Switch to Light Mode">
      <i class="ri-moon-line text-xl text-yellow-500"></i>
    </div>

    <!-- Light Mode Icon (Only visible when currentMode is 'light') -->
    <div 
      v-if="currentMode === 'light'"
      @click="cycleMode"
      class="cursor-pointer flex justify-center items-center"
      title="Switch to System Mode">
      <i class="ri-sun-line text-xl text-yellow-500"></i>
    </div>

    <!-- System Mode Icon (Only visible when currentMode is 'system') -->
    <div 
      v-if="currentMode === 'system'"
      @click="cycleMode"
      class="cursor-pointer flex justify-center items-center"
      title="Switch to Dark Mode">
      <i class="ri-contrast-2-line text-xl text-blue-500"></i>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

// Modes array: Dark, Light, System
const modes = ['dark', 'light', 'system'];
const currentMode = ref(modes[0]); // Start with the first mode, Dark

// Check if we're in the browser
const isBrowser = typeof window !== 'undefined';

// Function to get the stored theme from localStorage (if available)
function getStoredTheme() {
  if (isBrowser && localStorage?.getItem('theme')) {
    return localStorage?.getItem('theme');
  }
  return 'system'; // Default to 'system' if no theme is set
}

// Apply the current theme based on the mode
function applyTheme() {
  const mode = currentMode.value;
  if (mode === 'system') {
    detectSystemMode();
  } else {
    updateTheme(mode);
  }
}

// Detect the system theme preference (dark or light) and apply it
function detectSystemMode() {
  if (isBrowser) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (mediaQuery.matches) {
      updateTheme('dark');
    } else {
      updateTheme('light');
    }

    // Listen for changes to the system theme preference
    mediaQuery.addEventListener('change', (e) => {
      updateTheme(e.matches ? 'dark' : 'light');
    });
  }
}

// Update the theme by adding the respective class to the document
function updateTheme(mode) {
  if (isBrowser) {
    document.documentElement.classList.remove('dark', 'light');
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.add('light');
    }
    localStorage.setItem('theme', mode); // Save preference to localStorage
  }
}

// Cycle through the modes (Dark -> Light -> System -> Dark -> ...)
function cycleMode() {
  const currentIndex = modes.indexOf(currentMode.value);
  const nextIndex = (currentIndex + 1) % modes.length;
  currentMode.value = modes[nextIndex]; // Switch to the next mode
  applyTheme(); // Apply the new theme
}

// Initialize the theme based on stored preference or system setting
onMounted(() => {
  if (isBrowser) {
    const storedTheme = getStoredTheme(); // Get the stored theme from localStorage
    currentMode.value = storedTheme; // Set the current mode from localStorage
    applyTheme(); // Apply the theme immediately
  }
});
</script>

<style scoped>
/* Dark Mode Styles */
.dark {
  background-color: #333;
  color: white;
}

/* Light Mode Styles */
.light {
  background-color: white;
  color: black;
}

/* Tooltip Styling */
[title] {
  position: relative;
}

[title]:hover::after {
  content: attr(title);
  position: absolute;
  background-color: black;
  color: white;
  padding: 5px;
  border-radius: 4px;
  font-size: 12px;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  z-index: 100;
}

/* Icon styling */
.cursor-pointer {
  cursor: pointer;
}

/* Styling for active icons */
.text-yellow-500 {
  color: #fbbf24; /* Yellow for Dark and Light Mode */
}

.text-blue-500 {
  color: #3b82f6; /* Blue for System Mode */
}

.text-xl {
  font-size: 1.25rem;
}
</style>
