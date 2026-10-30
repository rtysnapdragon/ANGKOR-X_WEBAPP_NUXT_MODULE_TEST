<template>
  <div class="r-group-actions">
    <!-- ── 3-dot menu ── -->
    <RPopover  v-model="openAction"  v-if="isNotEmpty(lists) && useThreeDot" use="nuxtui"  :content="{ side: 'bottom-end' }">
      <template #trigger>
        <button class="custom-btn">
          <i :class="iconThreeDot ?? 'ri-more-2-fill'" />
        </button>
      </template>
      <RBtnList v-for="list in lists" :type="list.type" :icon="list.icon" :color="list.color" :label="list.label"
        :disabled="list.disabled" :loading="list.loading" :hide="list.hide" @click="() => { fnClick(list.type, list); openAction = false; }"
        :permission="list.permission" :showIfAllowed="list.showIfAllowed">
    
        <template v-if="$slots[`${list.type}icon`]" #[`${list.type}icon`]>
          <slot :name="`${list.type}icon`" />
        </template>
      </RBtnList>
    </RPopover>
    
    <RBtn v-else-if="isNotEmpty(lists) && !screen.isMobile" v-for="list in lists" :type="list.type" :icon="list.icon"
      :color="list.color" :label="list.label" :disabled="list.disabled" :isIconRight="list.isIconRight"
      :variant="list.variant" :isLabelBold="list.isLabelBold" :size="list.size" :loading="list.loading"
      :iconRight="list.iconRight" :noIcon="list.noIcon" :typeButton="list.typeButton" :hide="list.hide"
      :class="list.class" @click="fnClick(list.type, list)" :permission="list.permission"
      :showIfAllowed="list.showIfAllowed">
      <template v-if="$slots[`${list.type}icon`]" #[`${list.type}icon`]>
        <slot :name="`${list.type}icon`" />
      </template>
    </RBtn>
    
    <RPopover v-model="openAction" v-else-if="isNotEmpty(lists) && screen.isMobile && props.use=='nuxtui'" use="nuxtui"  :content="{ side: 'bottom-end',align: 'start',offset: 10 }" :ui="{
      content: '-translate-x-3 p-2 rounded-lg bg-white p-0 w-56 rounded-xl shadow-xl border border-gray-200'
    }">
      <template #trigger>
        <div class="r-group-action-more" @click="clickShow">
          <i class="ri-more-2-fill"></i>
        </div>
      </template>
      <div class="popup-nuxtui">
        <RBtnList v-for="list in lists" :type="list.type" :icon="list.icon" :color="list.color" :label="list.label"
          :disabled="list.disabled" :loading="list.loading" :hide="list.hide" @click="() => { fnClick(list.type, list); openAction = false; }"
          :permission="list.permission" :showIfAllowed="list.showIfAllowed">

          <template v-if="$slots[`${list.type}icon`]" #[`${list.type}icon`]>
            <slot :name="`${list.type}icon`" />
          </template>
        </RBtnList>
      </div>
    </RPopover>

    <!-- Mobile popover -->
    <RPopover  v-model="openAction"  v-else-if="isNotEmpty(lists) && screen.isMobile" use="headless" :content="{side:'left-start'}">
      <template #trigger>
        <div class="r-group-action-more" @click="clickShow">
          <i class="ri-more-2-fill"></i>
        </div>
      </template>
      <div class="popup">
        <RBtnList v-for="list in lists" :type="list.type" :icon="list.icon" :color="list.color" :label="list.label"
          :disabled="list.disabled" :loading="list.loading" :hide="list.hide" @click="() => { fnClick(list.type, list); openAction = false; }"
          :permission="list.permission" :showIfAllowed="list.showIfAllowed">

          <template v-if="$slots[`${list.type}icon`]" #[`${list.type}icon`]>
            <slot :name="`${list.type}icon`" />
          </template>
        </RBtnList>
      </div>
    </RPopover>

    <!-- <fwb-dropdown ref="refDropdown" placement="left" class="r-popup-action-btn"
      v-if="isNotEmpty(lists) && screen.isMobile" close-inside>
      <template #trigger>
        <div class="r-group-action-more" @click="clickShow">
          <i class="ri-more-2-fill"></i>
        </div>
      </template>
      <FwbListGroup class="popup">
        <RBtnList v-for="list in lists" :type="list.type" :icon="list.icon" :color="list.color" :label="list.label"
          :disabled="list.disabled" :loading="list.loading" :hide="list.hide" @click="fnClick(list.type, list)"
          :permission="list.permission" :showIfAllowed="list.showIfAllowed">

          <template v-if="$slots[`${list.type}icon`]" #[`${list.type}icon`]>
            <slot :name="`${list.type}icon`" />
          </template>
        </RBtnList>
      </FwbListGroup>
    </fwb-dropdown> -->
  </div>
</template>

<script setup>
import { FwbDropdown, FwbListGroup, FwbListGroupItem } from "flowbite-vue";
import {useScreenStore } from '../../stores/screen'
const screen = useScreenStore();
const props = defineProps(["data","threeDotOnly", "use", "iconThreeDot"]);
const emit = defineEmits(["click"]);
const lists = computed(() => props.data);
const useThreeDot = computed(() => props.threeDotOnly ?? false);
const iconThreeDot = computed(() => props.iconThreeDot ?? 'ri-more-2-fill')// ri-more-fill //ri-equalizer-lin
const openAction = ref(false)
const refDropdown = ref()

/* ── 3-dot menu state ───────────────────────────────────────────────────── */
const openMenu = ref(false)
function toggleMenu() { openMenu.value = !openMenu.value; console.log(openMenu.value, '===>>>'); }
function closeMenu()    { openMenu.value = false }

watch(() => screen.isMobile, (n) => {
  console.log(n, '===>>>', refDropdown.value)
})
function fnClick(type, list) {
  emit("click", type, list);
}
</script>

<style lang="scss" scoped>
::v-deep .r-popup-action-btn {
  .z-10 {
    z-index: 100;
  }
}

.popup{
  background: var(--bg-wrapper);
  position: absolute;
  top: -18px;
  right: -1px;
  padding: 8px 8px;
  border-radius: 10px;
  box-shadow: 0px 3px 10px 5px rgba(0, 0, 0, 0.05);
  // box-shadow: 0px 3px 10px 5px rgba(0, 0, 0, 0.05);
  bottom: unset;
  animation: ani-bottom 0.25s ease-in-out;
  transform: translateY(0px);
  opacity: 1;
  width: fit-content;
  border: none;
}

.popup-nuxtui{
  background: var(--bg-wrapper);
  position: absolute;
  top: -10px;
  right: 15px;
  padding: 8px 8px;
  border-radius: 10px;
  box-shadow: 0px 3px 10px 5px rgba(0, 0, 0, 0.05);
  // box-shadow: 0px 3px 10px 5px rgba(0, 0, 0, 0.05);
  bottom: unset;
  animation: ani-bottom 0.25s ease-in-out;
  transform: translateY(0px);
  opacity: 1;
  width: fit-content;
  border: none;
}
.r-group-actions {
  display: flex;
  grid-gap: 6px;
  flex-wrap: wrap;

  .r-group-action-more {
    width: 36px !important;
    height: 36px !important;
    border-radius: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 16px;
    line-height: 16px;
    background: var(--bg-content);
    color: var(--color-w-b-1);
    cursor: pointer;
  }

  .r-popup-action-btn {
    position: relative;

    .popup {
      position: absolute;
      top: 26px;
      right: 16px;
      padding: 8px 8px;
      background: var(--bg-wrapper);
      border-radius: 10px;
      box-shadow: 0px 6px 20px #0000002d;
      bottom: unset;
      animation: ani-bottom 0.25s ease-in-out;
      transform: translateY(0px);
      opacity: 1;
      width: fit-content;
      border: none;

      @keyframes ani-bottom {
        from {
          transform: translateY(-6px);
          opacity: 0;
        }

        to {
          transform: translateY(0px);
          opacity: 1;
        }
      }
    }
  }
}

.r-content {
  .r-group-action-more {
    background: var(--bg-wrapper);
  }
}

// ── 3-dot menu ─────────────────────────────────────────────────────────
.custom-btn{
    display:         flex;
    align-items:     center;
    justify-content: center;
    width:   30px;
    height:  30px;
    border-radius: var(--r-full);
    border:  0.5px solid var(--c-border);
    background: var(--glass-bg);
    backdrop-filter: blur(8px);
    color:   var(--c-muted);
    cursor:  pointer;
    font-size: 1rem;
    transition: background var(--t-fast) var(--ease-out),
                border-color var(--t-fast) var(--ease-out),
                color var(--t-fast) var(--ease-out);

    &:hover {
      // border-color: var(--c-accent);
      color:        var(--c-accent);
      outline: none;
      // background:   color-mix(in srgb, var(--c-accent) 8%, var(--glass-bg));
    }
    &:focus{
      outline: none !important;
      background:   color-mix(in srgb, var(--c-accent) 8%, var(--glass-bg));
    }
    &:focus-visible {
      border-color: var(--c-accent);
      color: var(--c-accent);
      background: color-mix(in srgb, var(--c-accent) 8%, var(--glass-bg));
      outline: none;
    }

    &:active {
      background: color-mix(in srgb, var(--c-accent) 12%, var(--glass-bg));
    }
}
</style>
