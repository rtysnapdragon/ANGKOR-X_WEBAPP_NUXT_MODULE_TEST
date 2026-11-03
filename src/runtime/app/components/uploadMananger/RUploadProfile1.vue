<template>
  <div class="nav-profile-user max-w-fit">
    <RAvatar
      :src="getImageUrl(image)"
      :isUrl="refAVT"
      :round="round"
      :size="size"
      :border="border"
      :borderColor="gender"
      :errorType="errorType"
    />

    <div class="absolute camera-pos" :class="iconBg" >
      <label
        for="picture"
        class="change-picture-container" 
        v-if="isEmpty(getImageUrl(image))"
        @click="eventUpload"
      >
        <span class="camera flex justify-center items-center">
          <i v-if="!loading" :class="['ri-camera-fill', iconSize]"></i>
          <div v-else class="animate-spin flex justify-center items-center">
            <i :class="['ri-loader-4-line', iconSize]"></i>
          </div>
        </span>
      </label>

      <label
        for="picture"
        class="change-picture-container" :class="gender== 'transparent'?'':'box-shadow-btn'"
        v-else
        @click="eventDelete"
      >
        <span class="flex justify-center items-center">
          <i v-if="!loading" :class="['ri-delete-bin-3-line', 'color-red', iconSize]"></i>
          <div v-else class="animate-spin flex justify-center items-center">
            <i :class="['ri-loader-4-line', iconSize]"></i>
          </div>
        </span>
      </label>
    </div>
    <RUploadManager
      v-model="uploadProfile"
      @getFile="getFileFromUpload"
      :width="480"
      :height="640"
    ></RUploadManager>
  </div>
</template>

<script setup>
const { t } = useI18n();
const props = defineProps(["loading", "round", "size", "border", "gender", "errorType", "cameraLeft","iconSize"]);
const round = computed(() => props.round ?? "l");
const size = computed(() => props.size ?? "ml")
const border = computed(() => props.border ?? "l"); 
const gender = computed(() => props.gender?.toLowerCase());
const errorType = computed(() => props.errorType);
const loading = computed(() => props.loading);
const cameraLeft = computed(() => props.cameraLeft ?? false);

const emit = defineEmits(["onDone", "onDelete", "onUpload"]);
const image = defineModel();
const refAVT = ref();
const uploadProfile = ref(false);

const getFileFromUpload = async (data) => {
  if (data.file) {
    const reader = new FileReader();
    reader.readAsDataURL(data.file);
    image.value = data;
    emit("onDone", data.byteArray);
  }
};
  
const iconSize = computed(() => {
  if (props.iconSize == "3xs") {
    return "text-[6px]";
  }
  if (props.iconSize == "2xs") {
    return "text-[6px]";
  }
  else if (props.iconSize == "s") {
    return "text-[10px]";
  }
  else if (props.iconSize == "ss") {
    return "text-[12px]";
  }
  else if (props.iconSize == "sm") {
    return "text-[12px]";
  }
  else if (props.iconSize == "m") {
    return "text-[14px]";
  }
  else if (props.iconSize == "ml") {
    return "text-[16px]";
  }
  else if (props.iconSize == "l") {
    return "text-[18px]";
  }
  else if (props.iconSize == "xl") {
    return "text-[20px]";
  }
  else return "text-[16px]";
})

const iconBg = computed(() => {
  if(!cameraLeft.value){
    if (size.value == "2xs") {
      return "x2s";
    }
    else if (size.value == "xs") {
      return "xs";
    }
    else if(size.value == "s") {
      return "s";
    }
    else if (size.value == "sm") {
      return "sm";
    }
    else if (size.value == "m") {
      return "m";
    }
    else if (size.value == "ml") {
      return "ml";
    }
    else if (size.value == "l") {
      return "l";
    }
    else if (size.value == "xl") {
      return "xl";
    }
  }
  else if(cameraLeft.value){
    if (size.value == "2xs") {
      return "x2s-left";
    }
    if (size.value == "xs") {
      return "xs-left";
    }
    else if(size.value == "s") {
      return "s-left";
    }
    else if (size.value == "sm") {
      return "sm-left";
    }
    else if (size.value == "m") {
      return "m-left";
    }
    else if (size.value == "ml") {
      return "ml-left";
    }
    else if (size.value == "l") {
      return "l-left";
    }
    else if (size.value == "xl") {
      return "xl-left";
    }else return "m-left"
  }
  else return "m"
})

function eventUpload() {
  uploadProfile.value = true;
  emit("onUpload");
}

function eventDelete() {
  // image.value = undefined
  emit("onDelete");
}

const getImageUrl = (data) => {
  console.log('get image >>',data)
  if (data?.file instanceof Blob) {
    refAVT.value = false;
    return URL.createObjectURL(data?.file);
  } else {
    refAVT.value = true;
    return data;
  }
};
</script>

<style lang="scss" scoped>
.dialog {
  background: var(--bg-wrapper);
  padding: 10px;
  border-radius: 10px;
}

.nav-profile-user {
  position: relative;

  .change-picture-container {
    width: 100% !important;
    height: 100% !important; 
    // display: flex;
    // justify-content: center;
    // align-items: center;
    // transition: 0.25s ease-in-out;
    // cursor: pointer;
    
    // &:hover {
    //   color: var(--color-primary);
    // } 
    border: 3.5px solid var(--bg-content);
    background: var(--bg-wrapper);
    color: var(--color-w-b-1);
    border-radius: 100%;
    // width: 35px;
    // height: 35px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: 0.25s ease-in-out;

    &:hover {
      color: var(--color-primary);
    }
  }
  
  .camera-pos{
    // cursor: pointer;
    // background: var(--bg-wrapper);
    // color: var(--color-w-b-1);
    // border-radius: 100%;
    // border: 2px solid var(--border-input);
    // position: absolute;

    &.x2s{
      width: 16px;
      height: 16px;
      bottom: -1px;
      right: -1px;
    }

    &.xs{
      width: 16px;
      height: 16px;
      bottom: -1px;
      right: -1px;
    }

    &.s{
      width: 20px;
      height: 20px;
      bottom: -2px;
      right: -2px;
    }

    &.sm{
      width: 22px;
      height: 22px;
      bottom: -2px;
      right: -2px;
    }
    
    &.m{
      width: 24px;
      height: 24px;
      bottom: -2px;
      right: -2px;
    }

    &.ml{
      width: 30px;
      height: 30px;
      bottom: -2px;
      right: -2px;
    }

    &.l{
      width: 34px;
      height: 34px;
      bottom: 0px;
      right: 0px;
      border: 4px solid var(--bg-input) !important;
    }

    // Camera left 
    &.x2s-left{
      width: 16px;
      height: 16px;
      bottom: -1px;
      left: -1px;
    }

    &.xs-left{
      width: 16px;
      height: 16px;
      bottom: -1px;
      left: -1px;
    }

    &.s-left{
      width: 20px;
      height: 20px;
      bottom: -2px;
      left: -2px;
    }

    &.sm-left{
      width: 22px;
      height: 22px;
      bottom: -2px;
      left: -2px;
    }
    
    &.m-left{
      width: 24px;
      height: 24px;
      bottom: -2px;
      left: -2px;
    }

    &.ml-left{
      width: 30px;
      height: 30px;
      bottom: -2px;
      left: -2px;
    }

    &.l-left{
      width: 34px;
      height: 34px;
      bottom: 0px;
      left: 0px;
      border: 4px solid var(--bg-input) !important;
    }

  }
}

.box-shadow-btn {
  border-radius: 100%;
  box-shadow: rgba(99, 99, 99, 0.2) 0px 2px 8px 0px;
}
</style>
