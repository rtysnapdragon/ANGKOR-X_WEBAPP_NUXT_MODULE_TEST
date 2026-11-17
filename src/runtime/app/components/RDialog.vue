<template>
  <!--
    UModal is the only Nuxt UI component used. One markup block serves both modes:
      local mode  -> one view built from props   (<RDialog v-model:open="open" ...>)
      host mode   -> one view per store dialog   (<RDialog host />, see stores/dialog.js)
  -->
  <UModal
    v-for="d in views"
    :key="d.id"
    :open="d.open"
    :title="d.title"
    :description="d.description"
    :dismissible="false"
    :close="false"
    :fullscreen="d.size === 'full'"
    :ui="uiFor(d)"
    @update:open="(value: boolean) => onUpdateOpen(d, value)"
    @close:prevent="onDismissAttempt(d)"
    @after:enter="onAfterEnter"
    @after:leave="onAfterLeave(d)"
  >
    <!-- Title (+ optional icon) -->
    <template v-if="d.icon || $slots.icon || $slots.title" #title>
      <span class="r-dialog__title">
        <span v-if="d.icon || $slots.icon" class="r-dialog__icon" aria-hidden="true">
          <slot name="icon"><i :class="d.icon" /></slot>
        </span>
        <slot name="title">{{ d.title }}</slot>
      </span>
    </template>

    <template v-if="$slots.description" #description>
      <slot name="description" />
    </template>

    <!-- Our own ✕ so it goes through the guard and respects `pending` -->
    <template v-if="d.showClose" #actions>
      <button
        type="button"
        class="r-dialog__close"
        :disabled="d.pending"
        :aria-label="t('rtyCms.form.close')"
        @click="requestClose(d)"
      >
        <i class="ri-close-line" />
      </button>
    </template>

    <template #body>
      <!-- host mode: a component, or a message, from the store -->
      <template v-if="host">
        <component
          v-if="d.component != null"
          :is="d.component"
          v-bind="d.props ?? {}"
          @close="(value: unknown) => store?.close(d.id, 'close', value)"
          @confirm="(value: unknown) => store?.close(d.id, 'confirm', value)"
          @loading="(value: boolean) => store?.setLoading(value, d.id)"
        />
        <p v-else-if="d.message" class="r-dialog__message">{{ d.message }}</p>

        <p v-if="d.error" class="r-dialog__error" role="alert">
          <i class="ri-error-warning-line" />
          <span>{{ d.error }}</span>
        </p>
      </template>

      <!-- local mode: your content -->
      <slot v-else v-bind="slotPropsOf(d)" />
    </template>

    <template v-if="hasFooter(d)" #footer>
      <slot name="footer" v-bind="slotPropsOf(d)">
        <div class="r-dialog__footer">
          <button
            v-if="d.cancelText"
            type="button"
            class="r-dialog__btn r-dialog__btn--ghost"
            :disabled="d.pending || d.cancelDisabled"
            @click="onCancel(d)"
          >
            {{ d.cancelText }}
          </button>
          <button
            v-if="d.confirmText"
            type="button"
            class="r-dialog__btn"
            :class="`r-dialog__btn--${confirmColorOf(d)}`"
            :disabled="d.pending || d.confirmDisabled"
            :aria-busy="d.pending"
            @click="onConfirm(d)"
          >
            <i v-if="d.pending" class="ri-loader-4-line r-dialog__spin" aria-hidden="true" />
            <span>{{ d.confirmText }}</span>
          </button>
        </div>
      </slot>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'

defineOptions({ name: 'RDialog', inheritAttrs: false })

type Size = 'sm' | 'md' | 'lg' | 'xl' | 'full'
type Tone = 'default' | 'info' | 'success' | 'warning' | 'danger'
type ButtonColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
type Guard = (close: () => void) => unknown

/** One dialog on screen: built from props (local) or from a stores/dialog.js entry (host). */
interface View {
  id: string | number
  open: boolean
  title?: string
  description?: string
  icon?: string
  tone?: Tone
  size?: Size
  dismissible?: boolean
  showClose?: boolean
  pending?: boolean
  guard?: Guard
  confirmText?: string
  cancelText?: string
  confirmColor?: ButtonColor
  confirmDisabled?: boolean
  cancelDisabled?: boolean
  ui?: Record<string, string>
  // host mode only
  component?: any
  props?: Record<string, unknown>
  message?: string
  error?: string
}

const props = withDefaults(
  defineProps<{
    /**
     * Global host mode. Mount ONE <RDialog host /> in app.vue / the layout; it renders every
     * dialog opened through useDialogStore() (stores/dialog.js). All other props are ignored.
     */
    host?: boolean
    title?: string
    description?: string
    /** A CSS icon class, e.g. `ri-delete-bin-line` (Remix Icon) */
    icon?: string
    /** Accent colour of the top bar, icon bubble and default confirm button */
    tone?: Tone
    size?: Size
    /** Esc and overlay click may close the dialog (still routed through the guard) */
    dismissible?: boolean
    showClose?: boolean
    /** A request is in flight: nothing can close the dialog, confirm shows a spinner */
    pending?: boolean
    /**
     * Close interceptor. Receives the real close function; call it to close.
     * Fits useFormGuard().requestClose exactly:  :guard="guard.requestClose"
     */
    guard?: Guard
    confirmText?: string
    cancelText?: string
    confirmColor?: ButtonColor
    confirmDisabled?: boolean
    cancelDisabled?: boolean
    /** Close right after confirm (simple dialogs). Forms leave it off and close after saving. */
    closeOnConfirm?: boolean
    /** Extra classes per UModal slot: { content, header, body, footer, overlay, ... } */
    ui?: Record<string, string>
  }>(),
  {
    host: false,
    title: undefined,
    description: undefined,
    icon: undefined,
    tone: 'default',
    size: 'md',
    dismissible: true,
    showClose: true,
    pending: false,
    guard: undefined,
    confirmText: undefined,
    cancelText: undefined,
    confirmColor: undefined,
    confirmDisabled: false,
    cancelDisabled: false,
    closeOnConfirm: false,
    ui: undefined,
  },
)

const emit = defineEmits<{
  confirm: []
  cancel: []
  opened: []
  closed: []
}>()

const open = defineModel<boolean>('open', { default: false })

const { t } = useI18n()
const slots = useSlots()
const store = props.host ? useDialogStore() : null

// ── views ───────────────────────────────────────────────────────────────────
const localView = computed<View>(() => ({
  id: 'local',
  open: open.value,
  title: props.title,
  description: props.description,
  icon: props.icon,
  tone: props.tone,
  size: props.size,
  dismissible: props.dismissible,
  showClose: props.showClose,
  pending: props.pending,
  guard: props.guard,
  confirmText: props.confirmText,
  cancelText: props.cancelText,
  confirmColor: props.confirmColor,
  confirmDisabled: props.confirmDisabled,
  cancelDisabled: props.cancelDisabled,
  ui: props.ui,
}))

const views = computed<View[]>(() =>
  props.host
    ? (store?.stack ?? []).map((d: any): View => ({ ...d, pending: d.loading }))
    : [localView.value],
)

// ── close paths: every way out of a dialog ends in requestClose() ───────────
function closeView(d: View) {
  if (props.host) store?.close(d.id)
  else open.value = false
}

const isOpenNow = (d: View) =>
  props.host ? !!store?.stack.find((x: any) => x.id === d.id)?.open : open.value

/** The single way out. Resolves true when the dialog ended up closed. */
async function requestClose(d: View): Promise<boolean> {
  if (d.pending) return false                 // never close mid-request
  if (d.guard) {
    await d.guard(() => closeView(d))
    return !isOpenNow(d)
  }
  closeView(d)
  return true
}

function onUpdateOpen(d: View, value: boolean) {
  if (value) {
    if (!props.host) open.value = true
  } else {
    void requestClose(d)
  }
}

// Esc / overlay: UModal is non-dismissible, so it only tells us the user tried.
function onDismissAttempt(d: View) {
  if (d.dismissible) void requestClose(d)
}

function onCancel(d: View) {
  if (props.host) {
    void store?.cancelAction(d.id)
    return
  }
  emit('cancel')
  void requestClose(d)
}

function onConfirm(d: View) {
  if (props.host) {
    void store?.confirmAction(d.id)
    return
  }
  emit('confirm')
  if (props.closeOnConfirm) void requestClose(d)
}

function onAfterEnter() {
  if (!props.host) emit('opened')
}

function onAfterLeave(d: View) {
  if (props.host) store?.remove(d.id)          // unmount after the leave animation
  else emit('closed')
}

// ── presentation ────────────────────────────────────────────────────────────
const hasFooter = (d: View) => !!slots.footer || !!d.confirmText || !!d.cancelText

const TONE_COLOR: Record<Tone, ButtonColor> = {
  default: 'primary', info: 'info', success: 'success', warning: 'warning', danger: 'error',
}
const confirmColorOf = (d: View): ButtonColor => d.confirmColor ?? TONE_COLOR[d.tone ?? 'default']

const cx = (...parts: (string | undefined | false)[]) => parts.filter(Boolean).join(' ')

const uiFor = (d: View) => ({
  ...d.ui,
  overlay: cx('r-dialog__overlay', d.ui?.overlay),
  content: cx('r-dialog', `r-dialog--${d.size ?? 'md'}`, `r-dialog--tone-${d.tone ?? 'default'}`, d.ui?.content),
  header: cx('r-dialog__header', d.ui?.header),
  body: cx('r-dialog__body', d.ui?.body),
  footer: cx('r-dialog__footer-wrap', d.ui?.footer),
})

const slotPropsOf = (d: View) => ({
  close: () => closeView(d),
  requestClose: () => requestClose(d),
  pending: !!d.pending,
})

defineExpose({
  close: () => closeView(localView.value),
  requestClose: () => requestClose(localView.value),
})
</script>

<style lang="scss">
/* Not scoped on purpose: UModal teleports its content, and every class is prefixed `r-dialog`. */
@use 'sass:map';

$sizes: (
  sm: 24rem,
  md: 32rem,
  lg: 44rem,
  xl: 64rem,
);

$tones: (
  default: var(--c-accent, #6366f1),
  info: #3b82f6,
  success: #22c55e,
  warning: #f59e0b,
  danger: var(--c-danger, #ef4444),
);

$ease: cubic-bezier(0.2, 0.7, 0.3, 1);

.r-dialog__overlay {
  background: color-mix(in srgb, #0b0820 55%, transparent);
  backdrop-filter: blur(3px);
}

.r-dialog {
  --rd-tone: #{map.get($tones, default)};

  display: flex;
  flex-direction: column;
  border: 1px solid var(--c-border, var(--ui-border));
  border-radius: var(--r-xl, 20px);
  background: var(--c-surface, var(--ui-bg));
  color: var(--c-text, var(--ui-text));
  box-shadow: var(--glass-shadow, 0 24px 60px rgba(0, 0, 0, 0.18));
  overflow: hidden;

  // accent bar
  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: 3px;
    background: linear-gradient(90deg, var(--rd-tone), color-mix(in srgb, var(--rd-tone) 35%, transparent));
    pointer-events: none;
  }

  @each $name, $width in $sizes {
    &--#{$name} {
      max-width: min(#{$width}, calc(100vw - 1.5rem));
    }
  }

  &--full {
    max-width: none;
    border-radius: 0;
  }

  @each $name, $color in $tones {
    &--tone-#{$name} {
      --rd-tone: #{$color};
    }
  }
}

.r-dialog__header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1.25rem 1.25rem 0.75rem;
}

.r-dialog__title {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.r-dialog__icon {
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  font-size: 1.15rem;
  color: var(--rd-tone);
  background: color-mix(in srgb, var(--rd-tone) 12%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--rd-tone) 24%, transparent);
  animation: r-dialog-pop 0.35s $ease both;
}

.r-dialog__close {
  display: inline-grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--c-muted, var(--ui-text-muted));
  font-size: 1.15rem;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;

  &:hover:not(:disabled) {
    background: color-mix(in srgb, var(--c-text, currentColor) 8%, transparent);
    color: var(--c-text, var(--ui-text));
  }

  &:focus-visible {
    outline: 2px solid var(--rd-tone, var(--c-accent));
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.r-dialog__body {
  flex: 1 1 auto;
  min-height: 0;
  padding: 0.5rem 1.25rem 1.25rem;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.r-dialog__footer-wrap {
  padding: 0.875rem 1.25rem;
  border-top: 1px solid var(--c-border, var(--ui-border));
  background: color-mix(in srgb, var(--c-text, currentColor) 3%, transparent);
}

.r-dialog__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  width: 100%;
}

.r-dialog__message {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--c-muted, var(--ui-text-muted));
  white-space: pre-line;
}

.r-dialog__error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.75rem 0 0;
  padding: 0.6rem 0.75rem;
  border: 1px solid color-mix(in srgb, var(--c-danger, #ef4444) 35%, transparent);
  border-radius: var(--r-md, 12px);
  background: color-mix(in srgb, var(--c-danger, #ef4444) 10%, transparent);
  color: var(--c-danger, #ef4444);
  font-size: 0.82rem;

  i {
    flex-shrink: 0;
    font-size: 1rem;
  }
}

// Footer buttons: plain <button>s, so UModal is the only Nuxt UI component used here.
$btn-colors: (
  primary: var(--c-accent, #6366f1),
  secondary: var(--c-accent-2, #8b5cf6),
  success: #22c55e,
  info: #3b82f6,
  warning: #f59e0b,
  error: var(--c-danger, #ef4444),
  neutral: #64748b,
);

.r-dialog__btn {
  --rd-btn: #{map.get($btn-colors, primary)};

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 2.25rem;
  padding: 0 1rem;
  border: 1px solid transparent;
  border-radius: var(--r-md, 12px);
  background: var(--rd-btn);
  color: #fff;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background-color 0.15s ease,
    opacity 0.15s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px -6px color-mix(in srgb, var(--rd-btn) 70%, transparent);
  }

  &:active:not(:disabled) {
    transform: none;
  }

  &:focus-visible {
    outline: 2px solid var(--rd-btn);
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  &--ghost {
    background: transparent;
    color: var(--c-text, var(--ui-text));

    &:hover:not(:disabled) {
      background: color-mix(in srgb, var(--c-text, currentColor) 8%, transparent);
      box-shadow: none;
      transform: none;
    }
  }

  @each $name, $color in $btn-colors {
    &--#{$name} {
      --rd-btn: #{$color};
    }
  }
}

.r-dialog__spin {
  animation: r-dialog-spin 0.8s linear infinite;
}

@keyframes r-dialog-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes r-dialog-pop {
  from {
    opacity: 0;
    transform: scale(0.6);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 480px) {
  .r-dialog__footer {
    flex-direction: column-reverse;

    > * {
      width: 100%;
      justify-content: center;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .r-dialog__icon,
  .r-dialog__spin {
    animation: none;
  }
}
</style>
