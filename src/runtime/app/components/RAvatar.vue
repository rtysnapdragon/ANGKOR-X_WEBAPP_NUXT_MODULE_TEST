<template>
  <div v-if="Array.isArray(src) && src?.length > 0" class="group-avatar">
    <div
      v-for="(item, index) in visibleSrc"
      :key="index"
      :class="`avatar ${avatarClasses} ${src?.length > 1 ? 'border-none' : ''} ${
        hasBadge && index === visibleSrc.length - 1 && extraCount === 0 ? 'has-chip' : ''
      }`"
    >
      <img :src="getSrc(item)" loading="lazy" @error="handleError" @click.stop.prevent="handlePreviewClick"/>
      <RPreviewFile
        v-if="props.src.length == 1 && !props.notUsePreviewImage"
        :pathUrl="getSrc(item)"
        :errorType="errorType"
        v-model="isPreviewImage"
        :isBGClose="true"
      />
      <slot
        name="chip"
        v-if="hasBadge && index === visibleSrc.length - 1 && extraCount === 0"
      >
        <span
          v-if="props.online !== undefined"
          class="av-chip"
          :class="props.online ? 'av-online' : 'av-offline'"
        />
        <span
          v-else-if="props.chip !== undefined"
          class="av-chip"
          :class="typeof props.chip === 'boolean' ? (props.chip ? 'av-online' : 'av-offline') : 'av-chip-text'"
        >
          <template v-if="typeof props.chip !== 'boolean'">{{ props.chip }}</template>
        </span>
      </slot>
    </div>
    <div v-if="extraCount > 0" :class="`avatar show-plus ${avatarClasses} ${hasBadge ? 'has-chip' : ''}`">
      +{{ extraCount }}
      <slot name="chip" v-if="hasBadge">
        <span
          v-if="props.online !== undefined"
          class="av-chip"
          :class="props.online ? 'av-online' : 'av-offline'"
        />
        <span
          v-else-if="props.chip !== undefined"
          class="av-chip"
          :class="typeof props.chip === 'boolean' ? (props.chip ? 'av-online' : 'av-offline') : 'av-chip-text'"
        >
          <template v-if="typeof props.chip !== 'boolean'">{{ props.chip }}</template>
        </span>
      </slot>
    </div>
  </div>
  <div
    v-else
    :class="`avatar cursor-pointer ${avatarClasses} ${hasBadge ? 'has-chip' : ''}`"
  >
    <img
      :src="getSrc(src)"
      loading="lazy"
      @error="handleError"
      @click.stop.prevent="handlePreviewClick"
    />
    <slot></slot>
    <RPreviewFile
      v-if="isPreviewImage && !props.notUsePreviewImage && !isError"
      :pathUrl="getSrc(src)"
      :errorType="errorType"
      v-model="isPreviewImage"
      :isBGClose="true"
    />
    <!-- Custom chip slot or online/chip indicator -->
    <slot name="chip">
      <span
        v-if="props.online !== undefined"
        class="av-chip"
        :class="props.online ? 'av-online' : 'av-offline'"
      />
      <span
        v-else-if="props.chip !== undefined"
        class="av-chip"
        :class="typeof props.chip === 'boolean' ? (props.chip ? 'av-online' : 'av-offline') : 'av-chip-text'"
      >
        <template v-if="typeof props.chip !== 'boolean'">{{ props.chip }}</template>
      </span>
    </slot>
  </div>
</template>

<script setup>
import { computed, ref, watch, useSlots } from "vue";
import { UseDefaultImageStore } from "../stores/defaultImage";
// import { UseDefaultImageStore } from "@/stores/defaultImage"
import RPreviewFile from './RPreviewFile.vue'

const slots = useSlots();
const defaultImg = UseDefaultImageStore();
const isPreviewImage = ref(false);
const isError = ref(false);


const props = defineProps({
  notUsePreviewImage: {
    type: Boolean,
    default: false,
  },
  src: {
    type: [String, Array],
    required: true,
  },
  size: {
    type: String,
    default: "s",
  },
  round: {
    type: String,
    default: "l",
  },
  border: {
    type: String,
    default: "l",
  },
  borderColor: {
    type: String,
    default: "default",
  },
  background: {
    type: String,
    default: "content",
  },
  newClass: {
    type: String,
    default: "",
  },
  errorType: {
    type: String,
    default: "user",
  },
  isUrl: {
    type: Boolean,
    default: true,
  },
  maxSrc: {
    type: Number,
    default: 5,
  },
  online: {
    type: Boolean,
    default: undefined,
  },
  gender: {
    type: String,
    default: "female",
  },
  chip: {
    type: [Boolean, String, Number, Object],
    default: undefined,
  },
});

const resolvedErrorType = computed(() => {
  if (props.gender) {
    const g = String(props.gender).toLowerCase();
    if (g === "male" || g === "m") return "male";
    if (g === "female" || g === "f") return "female";
  }
  if (props.errorType && props.errorType !== "user") {
    return props.errorType;
  }
  return "female";
});

const hasBadge = computed(() => {
  if (props.online !== undefined) return true;
  if (!!slots.chip) return true;
  if (props.chip === undefined || props.chip === null) return false;
  if (typeof props.chip === "boolean") return true;
  if (typeof props.chip === "number") return props.chip > 0;
  if (typeof props.chip === "string") return props.chip.length > 0;
  return true; // Object case — assume intentional
});

const getSrc = (src) => {
  return props.isUrl ? getUrl(src, true) : src;
};

const avatarClasses = computed(() => {
  return [
    `size-${props.size}`,
    `round-${props.round}`,
    `border-${props.border}`,
    `borderColor-${typeof props.borderColor === "string" ? props.borderColor.toLowerCase() : ""}`,
    `background-${props.background}`,
    props.newClass,
  ].join(" ");
});


const visibleSrc = computed(() => {
  return Array.isArray(props.src) ? props.src.slice(0, props.maxSrc) : [];
});

const extraCount = computed(() => {
  return Array.isArray(props.src) ? props.src.length - props.maxSrc : 0;
});

const handleError = (e) => {
  isError.value = true;
  // defaultImg.get(e, props.errorType);
  defaultImg.get(e, resolvedErrorType.value);
};

const handlePreviewClick = () => {
  if (props.notUsePreviewImage || isError.value) return;
  isPreviewImage.value = true;
};
watch(() => props.src, () => {
  isError.value = false;
});

const isShowModal = ref(false);

const onImageClick = (src) => {
  console.log("------>>>", getSrc(src));
};
</script>

<style lang="scss" scoped>
.avatar {
  position: relative;
  user-select: none;
  overflow: hidden;

  &.size-3xs {
    width: 22px !important;
    height: 22px !important;
    min-width: 22px !important;
    min-height: 22px !important;
  }

  &.size-2xs {
    width: 26px !important;
    height: 26px !important;
    min-width: 26px !important;
    min-height: 26px !important;
  }

  &.size-xs {
    width: 30px !important;
    height: 30px !important;
    min-width: 30px !important;
    min-height: 30px !important;
  }

  &.size-s {
    width: 35px !important;
    height: 35px !important;
    min-width: 35px !important;
    min-height: 35px !important;
  }

  &.size-sm {
    width: 40px !important;
    height: 40px !important;
    min-width: 40px !important;
    min-height: 40px !important;
  }

  &.size-m {
    width: 50px !important;
    height: 50px !important;
    min-width: 50px !important;
    min-height: 50px !important;
  }

  &.size-md {
    width: 65px !important;
    height: 65px !important;
    min-width: 65px !important;
    min-height: 65px !important;
  }

  &.size-ml {
    width: 80px !important;
    height: 80px !important;
    min-width: 80px !important;
    min-height: 80px !important;
  }

  &.size-l {
    width: 100px !important;
    height: 100px !important;
    min-width: 100px !important;
    min-height: 100px !important;
  }

  &.size-xl {
    width: 130px !important;
    height: 130px !important;
    min-width: 130px !important;
    min-height: 130px !important;
  }

  &.size-2xl {
    width: 160px !important;
    height: 160px !important;
    min-width: 160px !important;
    min-height: 160px !important;
  }

  &.size-3xl {
    width: 190px !important;
    height: 190px !important;
    min-width: 190px !important;
    min-height: 190px !important;
  }

  &.size-4xl {
    width: 220px !important;
    height: 220px !important;
    min-width: 220px !important;
    min-height: 220px !important;
  }

  &.size-ss {
    width: 18px !important;
    height: 18px !important;
    min-width: 18px !important;
    min-height: 18px !important;
  }

  &.round-s {
    border-radius: 10px !important;

    img {
      border-radius: 9px !important;
    }
  }

  &.round-m {
    border-radius: 20px;

    img {
      border-radius: 19px;
    }
  }

  &.round-l {
    border-radius: 100px;

    img {
      border-radius: 100px;
    }
  }

  &.border-s {
    border: 1px solid var(--color-w-b-4);

    img {
      padding: 2px;
    }
  }

  &.border-m {
    border: 1.5px solid var(--color-w-b-4);

    img {
      padding: 2.5px;
    }
  }

  &.border-l {
    border: 2px solid var(--color-w-b-4);

    img {
      padding: 3px;
    }
  }

  &.borderColor-default {
    border-color: var(--color-w-b-4) !important;
  }

  &.borderColor-nenoBlue {
    border-color: var(--r-c-nenoBlue) !important;
  }

  &.borderColor-green {
    border-color: var(--r-c-green) !important;
  }

  &.borderColor-orange {
    border-color: var(--r-c-orange) !important;
  }

  &.borderColor-purple {
    border-color: var(--r-c-purple) !important;
  }

  &.borderColor-purpleBlack {
    border-color: var(--r-c-purpleBlack) !important;
  }

  &.borderColor-red {
    border-color: var(--r-c-red) !important;
  }

  &.borderColor-orangeRed {
    border-color: var(--r-c-orangeRed) !important;
  }

  &.borderColor-blue {
    border-color: var(--r-c-blue) !important;
  }

  &.borderColor-capture {
    border-color: var(--r-c-capture) !important;
  }

  &.borderColor-male {
    border-color: var(--r-c-male) !important;
  }

  &.borderColor-female {
    border-color: var(--r-c-female) !important;

    img {
      border-radius: 50% !important;
    }
  }

  &.borderColor-content {
    border-color: var(--bg-content) !important;
  }

  &.borderColor-transparent {
    border-color: transparent !important;
  }

  &.background-content {
    background-color: var(--bg-content) !important;
  }

  &.background-wrapper {
    background-color: var(--bg-wrapper) !important;
  }


  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50% !important;
  }

  &.border-none {
    border: unset !important;
  }

  &.has-chip {
    overflow: visible;
  }

  // Online/offline chip
  .av-chip {
    position: absolute;
    top: 2px;
    right: -5px;
    width: 26%;
    height: 26%;
    width: 12px !important;
    height: 12px !important;
    min-width: 6px !important;
    min-height: 6px !important;
    border-radius: 50%;
    border: 2px solid var(--c-surface, #fff) !important;
    z-index: 1 !important;

    &.av-online {
      background: #22c55e !important;
    }

    &.av-offline {
      background: #94a3b8 !important;
    }

    &.av-chip-text {
      width: auto;
      height: auto;
      max-width: none;
      max-height: none;
      min-width: 16px !important;
      min-height: 16px !important;
      padding: 0 4px !important;
      border-radius: 10px !important;
      background: #ef4444 !important;
      color: #ffffff !important;
      font-size: 10px !important;
      font-weight: 600 !important;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }
  }
}

.group-avatar {
  display: flex;
  align-items: center;

  :not(:first-child) {
    margin-left: -15px;
  }

}

.show-plus {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-content);
  color: var(--text-primary);
  font-size: 14px;
  font-weight: bold;
  user-select: none;
  text-align: center;
}

.avatar {
  &.fade-enter-active {
    animation: s_wrapper 0.3s ease-in-out;
    opacity: 1;

    @keyframes s_wrapper {
      from {
        opacity: 0;
      }

      to {
        opacity: 1;
      }
    }
  }

  &.fade-leave-active {
    animation: h_wrapper 0.3s ease-in-out;
    opacity: 0;

    @keyframes h_wrapper {
      from {
        opacity: 1;
      }

      to {
        opacity: 0;
      }
    }
  }
}
</style>