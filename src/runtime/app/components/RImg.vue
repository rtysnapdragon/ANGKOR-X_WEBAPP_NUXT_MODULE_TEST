<script setup>
import { UseDefaultImageStore } from "~/stores/defaultImage"

const FITS = ["cover", "contain", "fill", "none", "scale-down"]
const ROUNDED = ["none", "sm", "md", "lg", "xl", "2xl", "full"]

const props = defineProps({
  src: { type: String, default: undefined },
  alt: { type: String, default: "" },
  /** Fallback image set from the store (img, user, avatar, female, male, banner, product, trBg, or a registered key). */
  type: { type: String, default: "img" },
  /** Overrides the store fallback for this instance. */
  fallbackSrc: { type: String, default: undefined },
  /** Enables initials fallback when `type` is an avatar type. */
  name: { type: String, default: undefined },
  /** Hints for file-type detection when the URL has no extension (blob:, signed URLs). */
  fileName: { type: String, default: undefined },
  mime: { type: String, default: undefined },
  width: { type: [Number, String], default: undefined },
  height: { type: [Number, String], default: undefined },
  ratio: { type: [Number, String], default: undefined },
  fit: { type: String, default: "cover", validator: (v) => FITS.includes(v) },
  position: { type: String, default: "center" },
  rounded: { type: String, default: "none", validator: (v) => ROUNDED.includes(v) },
  lazy: { type: Boolean, default: true },
  priority: { type: Boolean, default: false },
  srcset: { type: String, default: undefined },
  sizes: { type: String, default: undefined },
  crossorigin: {
    type: String,
    default: undefined,
    validator: (v) => ["anonymous", "use-credentials"].includes(v),
  },
  referrerpolicy: { type: String, default: undefined },
  decoding: {
    type: String,
    default: "async",
    validator: (v) => ["async", "sync", "auto"].includes(v),
  },
  draggable: { type: Boolean, default: false },
  skeleton: { type: Boolean, default: true },
  /** Auto-retry count before falling back. */
  retry: { type: Number, default: 0 },
  retryDelay: { type: Number, default: 1500 },
  showLabel: { type: Boolean, default: true },
  /** Class hooks: { root, img, skeleton, tile, label } */
  ui: { type: Object, default: () => ({}) },
})

const emit = defineEmits(["load", "error", "fallback", "retry"])

const RADIUS = {
  none: "0",
  sm: "var(--r-sm)",
  md: "var(--r-md)",
  lg: "var(--r-lg)",
  xl: "var(--r-xl)",
  "2xl": "var(--r-2xl)",
  full: "var(--r-full)",
}

const store = UseDefaultImageStore()

const imgRef = ref(null)
const stage = ref("primary") // 'primary' | 'fallback' | 'tile'
const status = ref("loading") // 'loading' | 'loaded' | 'fallback'
const hydrated = ref(false)
const attempt = ref(0) // auto-retry counter
const nonce = ref(0) // cache-bust / forces <img> re-creation
const lastReason = ref(null) // 'empty' | 'file-type' | 'error' | 'fallback-error'
let timer

/* ---------- derived ---------- */

const hasSrc = computed(() => typeof props.src === "string" && props.src.trim() !== "")
const fileInfo = computed(() =>
  store.getFileInfo(props.src, { fileName: props.fileName, mime: props.mime }),
)
const isFile = computed(() => fileInfo.value.isFile)
const initials = computed(() =>
  props.name && store.isAvatar(props.type) ? store.getInitials(props.name) : "",
)
const fallbackUrl = computed(() => props.fallbackSrc || store.resolve(props.type))

const displaySrc = computed(() => {
  if (stage.value === "fallback") return fallbackUrl.value
  if (stage.value !== "primary" || !hasSrc.value) return undefined
  return withNonce(props.src, nonce.value)
})

const showImg = computed(() => stage.value !== "tile")

const tileKind = computed(() =>
  isFile.value ? fileInfo.value.kind : initials.value ? "initials" : "broken",
)
const tileIcon = computed(() => (isFile.value ? fileInfo.value.icon : "i-lucide-image-off"))

const toCss = (v) =>
  v === undefined || v === null || v === "" ? undefined : typeof v === "number" ? `${v}px` : v

const numericSize = computed(() => {
  const v = props.width ?? props.height
  if (typeof v === "number") return v
  return typeof v === "string" && /^\d+(\.\d+)?(px)?$/.test(v) ? parseFloat(v) : undefined
})

const labelVisible = computed(
  () =>
    props.showLabel &&
    isFile.value &&
    !!fileInfo.value.label &&
    !(numericSize.value && numericSize.value < 56),
)

const rootStyle = computed(() => ({
  width: toCss(props.width),
  height: toCss(props.height),
  aspectRatio: props.ratio !== undefined ? String(props.ratio) : undefined,
  "--r-img-fit": props.fit,
  "--r-img-pos": props.position,
  "--r-img-radius": RADIUS[props.rounded],
  "--r-img-initials-size": numericSize.value
    ? `${Math.round(numericSize.value * 0.38)}px`
    : undefined,
}))

const imgAttrs = computed(() => ({
  loading: props.priority || !props.lazy ? "eager" : "lazy",
  decoding: props.decoding,
  ...(props.priority ? { fetchpriority: "high" } : {}),
  crossorigin: props.crossorigin,
  referrerpolicy: props.referrerpolicy,
  draggable: props.draggable,
}))

const tileLabel = computed(() => props.alt || props.name || props.fileName || "")
const tileA11y = computed(() =>
  tileLabel.value ? { role: "img", "aria-label": tileLabel.value } : { "aria-hidden": "true" },
)

/* ---------- state machine ---------- */

function withNonce(src, n) {
  if (!n || /^(data|blob):/i.test(src)) return src
  const hashAt = src.indexOf("#")
  const base = hashAt > -1 ? src.slice(0, hashAt) : src
  const hash = hashAt > -1 ? src.slice(hashAt) : ""
  return `${base}${base.includes("?") ? "&" : "?"}_r=${n}${hash}`
}

function clearTimer() {
  if (timer) clearTimeout(timer)
  timer = undefined
}

function enterFallback(reason, force) {
  stage.value = force ?? (initials.value ? "tile" : "fallback")
  status.value = "fallback"
  lastReason.value = reason
  if (hydrated.value) emit("fallback", { reason, stage: stage.value })
}

function settle() {
  clearTimer()
  attempt.value = 0
  if (isFile.value) return enterFallback("file-type", "tile")
  if (!hasSrc.value) return enterFallback("empty")
  stage.value = "primary"
  status.value = "loading"
  lastReason.value = null
}

function onLoad(event) {
  if (stage.value === "primary") {
    status.value = "loaded"
    emit("load", event)
  } else {
    status.value = "fallback"
  }
}

function onError(event) {
  if (stage.value === "primary") {
    emit("error", event)
    if (attempt.value < props.retry) {
      attempt.value++
      emit("retry", attempt.value)
      timer = setTimeout(() => nonce.value++, props.retryDelay)
      return
    }
    return enterFallback("error")
  }
  // Fallback image itself failed: stop here, render the CSS tile (no loops).
  if (stage.value === "fallback") enterFallback("fallback-error", "tile")
}

/** Images that finish (or fail) before hydration never fire a Vue-bound event. */
function syncNative() {
  const el = imgRef.value
  if (!el || !el.complete) return
  if (el.naturalWidth > 0) onLoad(new Event("load"))
  else onError(new Event("error"))
}

function reload() {
  clearTimer()
  if (!hasSrc.value || isFile.value) return
  attempt.value = 0
  stage.value = "primary"
  status.value = "loading"
  nonce.value++
}

settle()

watch(() => [props.src, props.srcset, props.fileName, props.mime], settle)

onMounted(() => {
  hydrated.value = true
  if (stage.value !== "primary") {
    emit("fallback", { reason: lastReason.value, stage: stage.value })
  } else {
    syncNative()
  }
})

onBeforeUnmount(clearTimer)

defineExpose({ status, stage, reload })
</script>

<template>
  <div
    class="r-img"
    :class="[
      `r-img--${status}`,
      { 'r-img--pending': hydrated && status === 'loading' },
      ui.root,
    ]"
    :style="rootStyle"
    :data-stage="stage"
  >
    <img
      v-if="showImg"
      :key="`${stage}-${nonce}`"
      ref="imgRef"
      class="r-img__el"
      :class="ui.img"
      :src="displaySrc"
      :srcset="stage === 'primary' ? srcset : undefined"
      :sizes="stage === 'primary' ? sizes : undefined"
      :alt="alt"
      v-bind="imgAttrs"
      @load="onLoad"
      @error="onError"
    />

    <div
      v-if="skeleton && status === 'loading'"
      class="r-img__skeleton"
      :class="ui.skeleton"
      aria-hidden="true"
    />

    <div
      v-if="stage === 'tile'"
      class="r-img__tile"
      :class="[`r-img__tile--${tileKind}`, ui.tile]"
      v-bind="tileA11y"
    >
      <span v-if="initials" class="r-img__initials">{{ initials }}</span>
      <template v-else>
        <UIcon :name="tileIcon" class="r-img__icon" />
        <span v-if="labelVisible" class="r-img__label" :class="ui.label">
          {{ fileInfo.label }}
        </span>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.r-img {
  position: relative;
  display: block;
  max-width: 100%;
  overflow: hidden;
  vertical-align: middle;
  border-radius: var(--r-img-radius, 0);

  &__el {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: var(--r-img-fit, cover);
    object-position: var(--r-img-pos, center);
    opacity: 1;
    transition: opacity var(--t-base) var(--ease-out);
  }

  // Applied only after hydration, so SSR output stays visible without JS.
  &--pending &__el {
    opacity: 0;
  }

  &__skeleton {
    position: absolute;
    inset: 0;
    background: var(--bg-tertiary);
    overflow: hidden;

    &::after {
      content: "";
      position: absolute;
      inset: 0;
      transform: translateX(-100%);
      background: linear-gradient(90deg, transparent, var(--glass-bg), transparent);
      animation: r-img-shimmer 1.4s var(--ease-in-out) infinite;
    }
  }

  &__tile {
    --r-img-tone: var(--c-muted);

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--sp-1);
    width: 100%;
    height: 100%;
    aspect-ratio: 1 / 1; // only effective when the root has no definite height
    color: var(--r-img-tone);
    background: color-mix(in srgb, var(--r-img-tone) 12%, var(--bg-tertiary));
    border: 1px solid var(--c-border);
    box-sizing: border-box;
    user-select: none;

    &--pdf { --r-img-tone: var(--c-danger); }
    &--doc { --r-img-tone: var(--c-info); }
    &--sheet { --r-img-tone: var(--c-success); }
    &--slide { --r-img-tone: var(--c-accent); }
    &--archive { --r-img-tone: var(--c-accent-2); }
    &--video { --r-img-tone: var(--c-info); }
    &--audio { --r-img-tone: var(--c-accent-2); }
    &--code { --r-img-tone: var(--c-text); }
    &--initials { --r-img-tone: var(--c-accent); }
  }

  &__icon {
    width: 42%;
    height: auto;
    aspect-ratio: 1 / 1;
  }

  &__label {
    font-size: 12px;
    font-weight: 600;
    line-height: 1;
    letter-spacing: 0.04em;
  }

  &__initials {
    font-size: var(--r-img-initials-size, 16px);
    font-weight: 600;
    line-height: 1;
  }
}

@keyframes r-img-shimmer {
  to {
    transform: translateX(100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .r-img__el {
    transition: none;
  }

  .r-img__skeleton::after {
    animation: none;
  }
}
</style>