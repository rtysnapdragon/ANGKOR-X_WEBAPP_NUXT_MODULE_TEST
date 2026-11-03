<script setup lang="ts">
import { toastQueue } from '../../composables/useRToast'
import { useRToast } from '../../composables/useRToast'

const toast = useRToast()

function closeToast(id: string) {
  toast.remove(id)
}

// Read a CSS variable from the document root at call time — respects active theme and dark/light mode.
function cssVar(name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

const typeConfig: Record<string, { icon: string; colorVar: string; fallback: string }> = {
  success:   { icon: 'ri-checkbox-circle-fill', colorVar: '--c-success',  fallback: '#4ade80' },
  error:     { icon: 'ri-close-circle-fill',    colorVar: '--c-danger',   fallback: '#f87171' },
  loading:   { icon: 'ri-loader-4-line',        colorVar: '--c-info',     fallback: '#60a5fa' },
  countdown: { icon: 'ri-time-fill',            colorVar: '--c-accent-2', fallback: '#ffb347' },
  progress:  { icon: 'ri-bar-chart-box-fill',   colorVar: '--c-accent',   fallback: '#ff8c42' },
  multistep: { icon: 'ri-git-merge-fill',       colorVar: '--c-info',     fallback: '#60a5fa' },
  action:    { icon: 'ri-cursor-fill',          colorVar: '--c-accent',   fallback: '#ff8c42' },
  gradient:  { icon: 'ri-magic-fill',           colorVar: '--c-accent',   fallback: '#ff8c42' },
  safety:    { icon: 'ri-shield-check-fill',    colorVar: '--c-success',  fallback: '#4ade80' },
  streaming: { icon: 'ri-sparkling-fill',       colorVar: '--c-accent',   fallback: '#ff8c42' },
  pipeline:  { icon: 'ri-cpu-fill',             colorVar: '--c-success',  fallback: '#4ade80' },
}

function getIcon(item: any) {
  return item.icon || typeConfig[item.type || 'success']?.icon || 'ri-notification-3-line'
}

function getColor(item: any): string {
  if (item.color) return item.color
  const cfg = typeConfig[item.type || 'success']
  return cfg ? cssVar(cfg.colorVar, cfg.fallback) : cssVar('--c-accent', '#ff8c42')
}

function getBgColor(item: any): string {
  if (item.type === 'gradient') return 'transparent'
  return item.bgColor || 'var(--c-surface)'
}

function getBorderColor(item: any): string {
  if (item.type === 'gradient') return 'transparent'
  return getColor(item)
}

function getProgress(item: any) {
  return toast.getProgress(item)
}

function getProgressWidth(item: any) {
  return `${getProgress(item)}%`
}

function shouldShowProgress(item: any) {
  return item.showProgress !== false && item.duration && item.duration > 0
}

function getStepIcon(step: any) {
  if (step.status === 'done') return 'ri-checkbox-circle-fill'
  if (step.status === 'active') return 'ri-loader-4-line spin'
  return 'ri-circle-line'
}

function getStepColor(step: any): string {
  if (step.status === 'done') return cssVar('--c-success', '#4ade80')
  if (step.status === 'active') return cssVar('--c-info', '#60a5fa')
  return cssVar('--c-border', 'rgba(255,140,66,0.16)')
}

function getBadgeColor(badge: string): string {
  const vars = ['--c-success', '--c-info', '--c-accent', '--c-accent-2', '--c-danger', '--c-info']
  const fallbacks = ['#4ade80', '#60a5fa', '#ff8c42', '#ffb347', '#f87171', '#60a5fa']
  const index = badge.length % vars.length
  return cssVar(vars[index], fallbacks[index])
}

// Check if should show close button
function showCloseButton(item: any) {
  return item.type !== 'loading' && item.type !== 'progress' && item.type !== 'streaming'
}

// Check if toast should auto-close
function isAutoClose(item: any) {
  return item.duration && item.duration > 0 && item.type !== 'loading'
}
</script>

<template>
  <Teleport to="body">
    <div class="r-toast-container">
      <TransitionGroup 
        name="toast" 
        tag="div" 
        class="r-toast-stack"
      >
        <div 
          v-for="item in toastQueue" 
          :key="item.id" 
          class="r-toast-card"
          :class="{
            'r-toast-gradient': item.type === 'gradient',
            'r-toast-loading': item.type === 'loading',
            'r-toast-streaming': item.type === 'streaming'
          }"
          :style="{
            background: getBgColor(item),
            borderColor: getBorderColor(item)
          }"
          @mouseenter="toast.pause(item.id)"
          @mouseleave="toast.resume(item.id)"
        >
          <!-- Progress Bar - Top -->
          <div
            v-if="shouldShowProgress(item) && item.progressPosition === 'top'"
            class="r-toast-progress r-toast-progress--top"
          >
            <div
              class="r-toast-progress__bar"
              :style="{
                width: getProgressWidth(item),
                background: item.progressColor || getColor(item),
                transition: item.paused ? 'none' : 'width 0.1s linear'
              }"
            />
          </div>

          <!-- Header Section -->
          <div class="r-toast-header">
            <div class="r-toast-left">
              <!-- Icon -->
              <div 
                class="r-toast-icon" 
                :style="{ 
                  background: getColor(item),
                  color: 'white'
                }"
              >
                <i :class="[getIcon(item), { 'spin': item.type === 'loading' }]" />
              </div>
              
              <!-- Content -->
              <div class="r-toast-content">
                <h4 class="r-toast-title">{{ item.title }}</h4>
                <p v-if="item.description" class="r-toast-description">
                  {{ item.description }}
                </p>
              </div>
            </div>

            <!-- Close Button -->
            <button 
              v-if="showCloseButton(item)"
              class="r-toast-btn-close" 
              @click="closeToast(item.id)"
              aria-label="Close notification"
            >
              <i class="ri-close-line" />
            </button>
          </div>

          <!-- 1. SUCCESS / ERROR / SAFETY - Badges -->
          <div v-if="['success', 'error', 'safety'].includes(item.type) && item.badges?.length" class="r-toast-badges">
            <span 
              v-for="badge in item.badges" 
              :key="badge"
              class="r-toast-badge"
              :style="{ background: getBadgeColor(badge) }"
            >
              {{ badge }}
            </span>
          </div>

          <!-- 2. COUNTDOWN -->
          <div v-if="item.type === 'countdown'" class="r-toast-countdown">
            <div class="r-toast-countdown-circle">
              <svg viewBox="0 0 36 36" class="r-toast-countdown-svg">
                <circle 
                  cx="18" cy="18" r="15.9"
                  fill="none" 
                  stroke="#e5e7eb"
                  stroke-width="3"
                />
                <circle 
                  cx="18" cy="18" r="15.9"
                  fill="none" 
                  :stroke="getColor(item)"
                  stroke-width="3"
                  stroke-dasharray="100"
                  :stroke-dashoffset="100 - ((item.countdown || 0) / (item.duration || 10) * 100)"
                  stroke-linecap="round"
                  class="r-toast-countdown-progress"
                />
              </svg>
              <span class="r-toast-countdown-number">{{ item.countdown || 0 }}s</span>
            </div>
            <span class="r-toast-countdown-label">Time remaining</span>
          </div>

          <!-- 3. PROGRESS -->
          <div v-if="item.type === 'progress'" class="r-toast-progress-bar">
            <div class="r-toast-progress-track">
              <div 
                class="r-toast-progress-fill"
                :style="{
                  width: `${item.progress || 0}%`,
                  background: item.progressColor || getColor(item)
                }"
              />
            </div>
            <div class="r-toast-progress-info">
              <span class="r-toast-progress-label">{{ item.progress || 0 }}%</span>
              <span v-if="item.description" class="r-toast-progress-status">{{ item.description }}</span>
            </div>
          </div>

          <!-- 4. MULTISTEP -->
          <div v-if="item.type === 'multistep'" class="r-toast-steps">
            <div 
              v-for="(step, index) in item.steps" 
              :key="step.label" 
              class="r-toast-step"
              :class="{
                'r-toast-step--done': step.status === 'done',
                'r-toast-step--active': step.status === 'active',
                'r-toast-step--pending': step.status === 'pending'
              }"
            >
              <div class="r-toast-step-indicator">
                <div 
                  class="r-toast-step-line" 
                  :class="{ 'r-toast-step-line--active': index < item.steps.findIndex(s => s.status === 'active') }"
                  v-if="index > 0"
                />
                <div 
                  class="r-toast-step-circle"
                  :style="{ 
                    borderColor: getStepColor(step),
                    background: step.status === 'done' ? getStepColor(step) : 'transparent'
                  }"
                >
                  <i 
                    v-if="step.status === 'done'" 
                    class="ri-check-line" 
                    style="color: white; font-size: 10px;"
                  />
                  <i 
                    v-else-if="step.status === 'active'" 
                    class="ri-loader-4-line spin" 
                    :style="{ color: getStepColor(step) }"
                  />
                  <span v-else class="r-toast-step-number">{{ index + 1 }}</span>
                </div>
              </div>
              <div class="r-toast-step-content">
                <span class="r-toast-step-label">{{ step.label }}</span>
                <span class="r-toast-step-status">
                  {{ step.status === 'done' ? 'Completed' : step.status === 'active' ? 'In Progress' : 'Pending' }}
                </span>
              </div>
            </div>
          </div>

          <!-- 5. PIPELINE -->
          <div v-if="item.type === 'pipeline'" class="r-toast-pipeline">
            <div class="r-toast-pipeline-container">
              <div 
                v-for="(step, index) in ['Data', 'Process', 'Analyze', 'Result']" 
                :key="index"
                class="r-toast-pipeline-step"
                :class="{ 
                  'r-toast-pipeline-step--active': index === 1,
                  'r-toast-pipeline-step--done': index < 1,
                  'r-toast-pipeline-step--pending': index > 1
                }"
              >
                <div class="r-toast-pipeline-node">
                  <div class="r-toast-pipeline-dot">
                    <i v-if="index < 1" class="ri-check-line" />
                    <i v-else-if="index === 1" class="ri-loader-4-line spin" />
                    <span v-else>{{ index + 1 }}</span>
                  </div>
                  <span class="r-toast-pipeline-label">{{ step }}</span>
                </div>
                <div v-if="index < 3" class="r-toast-pipeline-connector">
                  <div 
                    class="r-toast-pipeline-line" 
                    :class="{ 'r-toast-pipeline-line--active': index < 1 }"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- 6. STREAMING -->
          <div v-if="item.type === 'streaming'" class="r-toast-stream">
            <div class="r-toast-stream-header">
              <i class="ri-sparkling-fill" style="color: var(--c-accent);" />
              <span class="r-toast-stream-title">Live Stream</span>
              <span class="r-toast-stream-dot">●</span>
            </div>
            <div class="r-toast-stream-content">
              <div class="r-toast-stream-text">
                <span>{{ item.streamText || 'Processing data stream...' }}</span>
                <span class="r-toast-stream-cursor">▎</span>
              </div>
              <div class="r-toast-stream-indicators">
                <span class="r-toast-stream-indicator r-toast-stream-indicator--active" />
                <span class="r-toast-stream-indicator" />
                <span class="r-toast-stream-indicator" />
              </div>
            </div>
          </div>

          <!-- 7. ACTION -->
          <div v-if="item.type === 'action' && (item.action || item.onAction)" class="r-toast-action">
            <button 
              class="r-toast-action-btn"
              :style="{ 
                background: getColor(item),
                color: 'white'
              }"
              @click="item.action?.onClick?.() || item.onAction?.()"
            >
              <i v-if="item.action?.icon" :class="item.action.icon" />
              {{ item.action?.label || 'Take Action' }}
            </button>
          </div>

          <!-- 8. GRADIENT - Special styling with content overlay -->
          <div v-if="item.type === 'gradient'" class="r-toast-gradient-overlay">
            <div class="r-toast-gradient-shine" />
          </div>

          <!-- Progress Bar - Bottom -->
          <div
            v-if="shouldShowProgress(item) && item.progressPosition === 'bottom'"
            class="r-toast-progress r-toast-progress--bottom"
          >
            <div
              class="r-toast-progress__bar"
              :style="{
                width: getProgressWidth(item),
                background: item.progressColor || getColor(item),
                transition: item.paused ? 'none' : 'width 0.1s linear'
              }"
            />
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
// Container
.r-toast-container {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 99999;
  pointer-events: none;
  
  .r-toast-stack {
    display: flex;
    flex-direction: column-reverse;
    gap: 12px;
    pointer-events: auto;
  }
}

// Toast Card
.r-toast-card {
  width: 440px;
  max-width: calc(100vw - 48px);
  background: var(--c-surface);
  border-radius: 16px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.18),
    0 0 0 1px rgba(0, 0, 0, 0.06);
  padding: 16px 18px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1.5px solid transparent;
  
  &:hover {
    box-shadow: 
      0 24px 72px rgba(0, 0, 0, 0.18),
      0 0 0 1px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px) scale(1.01);
  }
  
  // Gradient Type
  &.r-toast-gradient {
    background: linear-gradient(135deg, var(--c-accent), var(--c-accent-2));
    color: white;
    border-color: transparent;

    .r-toast-title,
    .r-toast-description {
      color: white;
    }

    .r-toast-btn-close {
      color: rgba(255, 255, 255, 0.7);

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        color: white;
      }
    }
  }

  // Loading Type
  &.r-toast-loading {
    .r-toast-icon {
      animation: pulse 1.5s ease-in-out infinite;
    }
  }

  // Streaming Type
  &.r-toast-streaming {
    background: var(--c-surface);
    border-color: var(--c-accent);
  }
}

// Header
.r-toast-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.r-toast-left {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  flex: 1;
  min-width: 0;
}

.r-toast-icon {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: var(--c-text);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.r-toast-content {
  flex: 1;
  min-width: 0;
}

.r-toast-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--c-text);
  margin: 0;
  line-height: 1.4;
}

.r-toast-description {
  font-size: 13px;
  color: var(--c-muted);
  margin: 4px 0 0;
  line-height: 1.5;
}

.r-toast-btn-close {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--c-muted);
  cursor: pointer;
  transition: all 0.15s ease;
  font-size: 16px;

  &:hover {
    background: var(--c-hover);
    color: var(--c-text);
  }
}

// Progress Bar (Timer)
.r-toast-progress {
  position: absolute;
  left: 0;
  width: 100%;
  height: 4px;
  overflow: hidden;
  
  &--top {
    top: 0;
  }
  
  &--bottom {
    bottom: 0;
  }
  
  &__bar {
    height: 100%;
    border-radius: 0 2px 2px 0;
    transform-origin: left;
    transition: width 0.1s linear;
  }
}

// Badges
.r-toast-badges {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.r-toast-badge {
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  color: white;
  letter-spacing: 0.3px;
}

// Countdown
.r-toast-countdown {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 12px;
  background: var(--c-hover);
  border-radius: 12px;
}

.r-toast-countdown-circle {
  position: relative;
  width: 36px;
  height: 36px;
}

.r-toast-countdown-svg {
  transform: rotate(-90deg);
  width: 36px;
  height: 36px;
}

.r-toast-countdown-progress {
  transition: stroke-dashoffset 1s linear;
}

.r-toast-countdown-number {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  font-weight: 700;
  color: var(--c-text);
}

.r-toast-countdown-label {
  font-size: 13px;
  color: var(--c-muted);
}

// Progress
.r-toast-progress-bar {
  margin-top: 12px;
}

.r-toast-progress-track {
  height: 8px;
  background: var(--c-hover);
  border-radius: 4px;
  overflow: hidden;
}

.r-toast-progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.r-toast-progress-info {
  margin-top: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.r-toast-progress-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--c-text);
}

.r-toast-progress-status {
  font-size: 12px;
  color: var(--c-muted);
}

// Multistep
.r-toast-steps {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.r-toast-step {
  display: flex;
  gap: 12px;
  align-items: flex-start;

  &--done .r-toast-step-label { color: var(--c-success); }
  &--active .r-toast-step-label { color: var(--c-info); font-weight: 600; }
}

.r-toast-step-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  padding-top: 2px;
}

.r-toast-step-line {
  width: 2px;
  height: 20px;
  background: var(--c-border);
  margin: 4px 0;

  &--active { background: var(--c-success); }
}

.r-toast-step-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid var(--c-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  color: var(--c-muted);
  transition: all 0.3s ease;
}

.r-toast-step-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0;
}

.r-toast-step-label {
  font-size: 13px;
  color: var(--c-text);
  font-weight: 500;
}

.r-toast-step-status {
  font-size: 11px;
  color: var(--c-muted);
  font-weight: 500;
}

// Pipeline
.r-toast-pipeline {
  margin-top: 14px;
  padding: 12px;
  background: var(--c-hover);
  border-radius: 12px;
}

.r-toast-pipeline-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.r-toast-pipeline-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  
  &--done {
    .r-toast-pipeline-dot { background: var(--c-success); color: white; }
    .r-toast-pipeline-label { color: var(--c-success); }
  }

  &--active {
    .r-toast-pipeline-dot { background: var(--c-info); color: white; animation: pulse 1.5s ease-in-out infinite; }
    .r-toast-pipeline-label { color: var(--c-info); font-weight: 600; }
  }

  &--pending {
    .r-toast-pipeline-dot { background: var(--c-hover); color: var(--c-muted); }
    .r-toast-pipeline-label { color: var(--c-muted); }
  }
}

.r-toast-pipeline-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.r-toast-pipeline-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  transition: all 0.3s ease;
}

.r-toast-pipeline-label {
  font-size: 11px;
  color: var(--c-muted);
  font-weight: 500;
  transition: all 0.3s ease;
}

.r-toast-pipeline-connector {
  flex: 1;
  padding: 0 4px;
}

.r-toast-pipeline-line {
  height: 2px;
  background: var(--c-border);
  width: 100%;

  &--active { background: var(--c-success); }
}

// Streaming
.r-toast-stream {
  margin-top: 12px;
}

.r-toast-stream-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.r-toast-stream-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--c-accent);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.r-toast-stream-dot {
  color: var(--c-danger);
  font-size: 8px;
  animation: blink 1s step-end infinite;
}

.r-toast-stream-content {
  background: var(--c-hover);
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--c-border);
}

.r-toast-stream-text {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--c-text);
  font-family: 'Courier New', monospace;
}

.r-toast-stream-cursor {
  animation: blink 1s step-end infinite;
  color: var(--c-accent);
}

.r-toast-stream-indicators {
  margin-top: 8px;
  display: flex;
  gap: 4px;
}

.r-toast-stream-indicator {
  flex: 1;
  height: 2px;
  background: var(--c-border);
  border-radius: 1px;
  transition: all 0.3s ease;

  &--active {
    background: var(--c-accent);
    animation: pulse 1.5s ease-in-out infinite;
  }
}

// Action
.r-toast-action {
  margin-top: 12px;
}

.r-toast-action-btn {
  width: 100%;
  padding: 10px 16px;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  i {
    font-size: 16px;
  }
}

// Gradient Overlay
.r-toast-gradient-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.r-toast-gradient-shine {
  position: absolute;
  top: -50%;
  left: -50%;
  right: -50%;
  bottom: -50%;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.2), transparent 60%);
  animation: shine 3s ease-in-out infinite;
}

// Animations
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

@keyframes shine {
  0%, 100% {
    transform: translateX(-100%) rotate(25deg);
  }
  50% {
    transform: translateX(100%) rotate(25deg);
  }
}

// Transitions
.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.95);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(50px) scale(0.95);
}

// Responsive
@media (max-width: 640px) {
  .r-toast-container {
    right: 12px;
    bottom: 12px;
  }
  
  .r-toast-card {
    width: 100%;
    padding: 14px 16px;
  }
  
  .r-toast-pipeline-container {
    flex-direction: row;
    gap: 0;
  }
  
  .r-toast-step-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
}
</style>