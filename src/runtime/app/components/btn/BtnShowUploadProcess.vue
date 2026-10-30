<template>
  <UPopover
    :ui="{
      background: 'color-bg-content',
      rounded: 'rty-rounded',
      ring: 'ring-0',
      wrapper: 'flex',
      popper: { placement: 'bottom-end' },
    }"
    data-headlessui-state="open"
  >
    <OCTooltip :text="$t('upload')">
      <div
        style="width: 40px !important; display: flex; justify-content: center"
      >
        <BtnIcon
          icon="ri-upload-cloud-line !text-[19px] ml-px"
          :class="getFile.isUploading ? 'loader-progress' : ''"
        />
      </div>
    </OCTooltip>
    <template #panel="{ close }" class="p-2 rounded-[14px]">
      <div class="customer-shadow-dialog-filter">
        <div class="rty-filter-header">
          <h3 class="font-medium text-sm">{{ $t("upload") }}</h3>
        </div>

        <div class="max-h-[350px] overflow-hidden pb-4">
          <div
            class="flex max-h-[320px] overflow-y-auto p-4 pb-0 pt-0 flex-col gap-2.5 w-[350px]"
          >
            <div
              v-for="(fileData, index) in getFile.allFileMoreUpload"
              :key="index"
              class="flex justify-between items-center  w-full color-bg-wrapper rounded-[14px] p-[10px]"
            >
              {{ console.log(getFile.isUploading) }}
              <div class="flex justify-left items-center gap-2.5">
                <img
                  v-if="isImageP(fileData.file.name.split('.')[1])"
                  class="w-[40px] h-[40px] object-cover rounded-[7px]"
                  :src="getImageUrl(fileData.file)"
                />
                <img
                  v-if="isVideoP(fileData.file.name.split('.')[1])"
                  class="w-[40px] h-[40px] object-cover rounded-[7px]"
                  src="/images/profile_male.png"
                />
                <div class="flex flex-col">
                  <span class="text-[13px]">{{
                    fileData.file.name.substring(0, 15)
                  }}</span>
                  <span class="text-[12px] color-sub-text">{{
                    formatFileSize(fileData.file.size)
                  }}</span>
                </div>
              </div>
              <div
                v-if="
                  fileData.status === 'uploading' ||
                  fileData.status === 'pending'
                "
              >
                <ProgressCircle
                  :percentage="fileData.progress"
                ></ProgressCircle>
              </div>
              <div v-else-if="fileData.status === 'error'">
                <span>❌</span>
              </div>
            </div>
            <!-- <div
              v-for="(upload, Id) in getFile.fileCompleted"
              :key="Id"
              class="flex justify-between items-center size-[100%] w-full color-bg-wrapper rounded-[14px] p-[10px]"
            >
              <div class="flex justify-left items-center gap-2.5">
                <img
                  v-if="isImage(upload)"
                  class="w-[40px] h-[40px] object-cover rounded-[7px]"
                  :src="upload.FullPath"
                />
                <img
                  v-if="isVideo(upload)"
                  class="w-[40px] h-[40px] object-cover rounded-[7px]"
                  src="/public/img/default-img/video.png"
                />
                <div class="flex flex-col">
                  <span class="text-[13px]">
                    {{ upload.Name.substring(0, 15) + "." + upload.Extension }}
                  </span>
                  <span class="text-[12px] color-sub-text">
                    {{ formatFileSize(upload.Size) }}
                  </span>
                </div>
              </div>
            </div> -->
          </div>
        </div>
      </div>
    </template>
  </UPopover>
</template>

<script setup>
const { t } = useI18n();
const getFile = useUploadProgress();
const dataCompleted = ref([]);
watch(getFile.fileCompleted, () => {
  // console.log(Object.values(getFile.fileCompleted).reverse())
});
// const typeImage = {
//   docx: '/_oc/components/public/img/word.png',
//   xlsx: '/_oc/components/public/img/excel.png',
//   pptx: '/_oc/components/public/img/powerpoint.png',
//   txt: '/_oc/components/public/img/txt-file.png',
//   pdf: '/_oc/components/public/img/pdf-file.png',
//   default: '/_oc/components/public/img/Gallery1.png',
// };

function formatFileSize(bytes) {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Bytes";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i];
}
const isImage = (file) => {
  const imageExtensions = ["jpg", "png", "jpeg", "JPG", "PNG", "JPEG"];
  return imageExtensions.includes(file.Extension);
};
const isImageP = (file) => {
  const imageExtensions = ["jpg", "png", "jpeg", "JPG", "PNG", "JPEG"];
  return imageExtensions.includes(file);
};

const isVideo = (file) => {
  const videoExtensions = [
    "mp4",
    "mov",
    "avi",
    "mkv",
    "MP4",
    "MOV",
    "AVI",
    "MKV",
  ];
  return videoExtensions.includes(file.Extension);
};
const isVideoP = (file) => {
  const videoExtensions = [
    "mp4",
    "mov",
    "avi",
    "mkv",
    "MP4",
    "MOV",
    "AVI",
    "MKV",
  ];
  return videoExtensions.includes(file);
};
const getImageUrl = (file) => {
  return URL.createObjectURL(file);
};
</script>
<style lang="scss" scoped>
.customer-shadow-dialog-filter {
  box-shadow: 6px 6px 20px rgba(0, 0, 0, 0.1);
}

.dark {
  .customer-shadow-dialog-filter {
    box-shadow: 6px 6px 20px rgba(0, 0, 0, 0.6);
  }
}

.loader-progress {
  width: 24px !important;
  height: 24px !important;
  margin-top: 4px;
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--rty-loading);
  box-shadow: 0 0 0 0 var(--bg-content-50);
  animation: l1 0.8s infinite;
}
@keyframes l1 {
  100% {
    box-shadow: 0 0 5px 5px var(--color-shadow);
  }
}
</style>
