<template>
  <Teleport to="body" v-if="isPreview && isNotEmpty(pathUrl)">
    <Transition>
      <div class="relative z-50 oc-preview-container">
        <div class="fixed inset-0 transition-opacity dark:bg-gray-800/75 bg-overlay z-10"></div>
        <div class="fixed inset-0 overflow-y-auto z-10">
          <div class="flex min-h-full items-center sm:items-center justify-center text-center z-50 relative"
            :class="isMulti ? 'p-10 sm:p-5' : 'p-0 sm:p-0'">
            <div class="header">
              <button class="img-v-button close" type="button" @click="closeImageByIconCancel">
                <i class="ri-close-line"></i>
              </button>
            </div>

            <div class="v2-image-video-view show" v-if="!isMulti">
              <ul class="body">
                <li class="item" ref="refImgVideo">
                  <img v-if="type == 'image'" :src="pathUrl" @error="(e) => { defaultImg.get(e, errorType) }"
                    class="container-image-video" />
                  <RVideo v-else :path="pathUrl" :autoPlay="true" VideoStyle="container-image-video" />
                </li>
              </ul>
            </div>

            <UCarousel v-else arrows ref="refCarousel" :items="pathUrl"
              :ui="{ item: 'basis-full justify-center items-center' }"
              class="rounded-lg overflow-hidden w-full xl:max-w-[800px]">
              <template #default="{ item }">
                <img v-if="findExtension(item[extension]) == 'img'" :src="getUrl(item[src], true)"
                  class="container-image-video" draggable="false"
                  @error="(e) => { e.target.src = $public(fileExtension(type)); e.target.onerror === null }">
                <!-- <OCVideo ref="refVideo" v-if="findExtension(item[extension]) == 'video'" :path="item[src]"
                  :autoPlay="isAutoPlay" VideoStyle="container-image-video" /> -->
                <div v-if="findExtension(item[extension]) == 'video'">
                  <img v-if="showThumbnail" :src="getThumbnail(item[src])" alt="Video thumbnail fallback"
                    class="container-image-video" />
                  <OCVideo v-else ref="refVideo" @error="handleVideoError" :path="item[src]" :autoPlay="isAutoPlay"
                    VideoStyle="container-image-video" />
                </div>
              </template>

              <template #prev="{ onClick, disabled }">
                <UButton size="sm" :disabled="disabled" @click="btnPrev(onClick)" color="gray"
                  icon="i-heroicons-chevron-left-20-solid"
                  class="rtl:[&_span:first-child]:rotate-180 w-fit z-10 absolute !left-1 top-1/2 transform -translate-y-1/2 rounded-full color-bg-content" />
              </template>

              <template #next="{ onClick, disabled }">
                <UButton size="sm" :disabled="disabled || pathUrl.length == 1" @click="btnNext(onClick)" color="gray"
                  icon="i-heroicons-chevron-right-20-solid"
                  class="rtl:[&_span:last-child]:rotate-180 w-fit z-10 absolute !right-1 top-1/2 transform -translate-y-1/2 rounded-full color-bg-content" />
              </template>

            </UCarousel>
            <!-- <div class="video-container-daily-record"></div> -->
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { onMounted } from 'vue';
import RVideo from './RVideo.vue'
import { UseDefaultImageStore } from "../stores/defaultImage";
// import { UseDefaultImageStore } from "@/stores/defaultImage"
const defaultImg = UseDefaultImageStore();
const isPreview = defineModel();
const props = defineProps(["pathUrl", "typeFile", "isBGClose", "errorType", 'isMulti', 'selected', 'page', 'extension', 'src']);
const emit = defineEmits(["onClickBackGroundBlur"]);
const pathUrl = computed(() => props.pathUrl);
const type = computed(() => props.typeFile || "image");
const errorType = computed(() => props.errorType || "user");
const bgClose = computed(() => props.isBGClose || false);
const isMulti = computed(() => props.isMulti || false);
const selected = computed(() => props.selected || false);
const page = computed(() => props.page || 1);
const extension = computed(() => props.extension || 'Extension');
const src = computed(() => props.src || 'Src');

const showThumbnail = ref(false)

const refImgVideo = ref()
const refCarousel = ref()
const isAutoPlay = ref(false)

onClickOutside(refImgVideo, event => {
  if (bgClose.value) {
    isPreview.value = false;
    emit("onClickBackGroundBlur");
  }
})

// onClickOutside(refCarousel, event => {
//   if (bgClose.value) {
//     isPreview.value = false;
//     emit("onClickBackGroundBlur");
//   }
// })

function handleVideoError(event) {
  console.warn("Video failed to load, switching to thumbnail.", event);
  showThumbnail.value = true;
}

function getThumbnail(videoPath) {
  // Example logic: replace .mp4 with .jpg (or your logic)
  const imgThumnail = videoPath.replace(/\.\w+$/, '.png');
  const extension = imgThumnail.split('.').pop();
  if (imgThumnail) return imgThumnail
  else fileExtension(extension)
}

function fileExtension(file) {
  console.log("Data File Image : : ", file)
  let data = '';
  if (file == 'docx') data = 'img/word.png'
  else if (file == 'xlsx') data = 'img/excel.png'
  else if (file == 'pptx') data = 'img/powerpoint.png'
  else if (file == 'txt') data = 'img/file.png'
  else if (file == 'pdf') data = 'img/excel.png'
  else if (file == 'png') data = 'img/default-no-img.png'
  else data = 'img/default.png'
  return data;
}
onMounted(() => {
  setTimeout(() => {
    if (refCarousel.value) {
      refCarousel.value?.select(page.value)
      if (isNotEmpty(selected.value)) {
        // console.log(isPreview.value, '--->>> ', refCarousel.value)
        isAutoPlay.value = (findExtension(selected.value[extension.value]) == 'video')
      }

      console.log(page.value, '====>>', pathUrl.value, selected.value, src.value)
    }
  }, 100);
})

// const closeModalByClickBackGround = (e) => {
//   if (bgClose) {
//     console.log('===>>> ', e.target.tagName)
//     // return
//     if (e.target.tagName !== "IMG" && e.target.tagName !== "VIDEO") {
//       isPreview.value = false;
//       emit("onClickBackGroundBlur");
//     }
//   }
// };

const closeImageByIconCancel = () => {
  isPreview.value = false;
  emit("onClickBackGroundBlur");
};


function btnPrev(fnPrev) {
  fnPrev()
  console.log(refCarousel.value?.page - 2, '>>> prev >>>', pathUrl.value[refCarousel.value?.page - 2]?.Id)
  isAutoPlay.value = (findExtension(pathUrl.value[refCarousel.value?.page - 2]?.Extension) == 'video')
  // setTimeout(() => {

  // }, 250);
}

function btnNext(fnNext) {
  fnNext()
  console.log(refCarousel.value)
  isAutoPlay.value = (findExtension(pathUrl.value[refCarousel.value?.page]?.Extension) == 'video')
  // setTimeout(() => {

  // }, 250);
}


const extensionMap = {
  '.pdf': 'file', 'pdf': 'file',
  '.m4a': 'voice', 'm4a': 'voice',
  '.mp4': 'video', 'mp4': 'video',
  '.jpg': 'img', '.jpeg': 'img', '.png': 'img', '.gif': 'img', '.svg': 'img', '.webp': 'img', '.avif': 'img',
  'jpg': 'img', 'jpeg': 'img', 'png': 'img', 'gif': 'img', 'svg': 'img', 'webp': 'img', 'avif': 'img',
};

function findExtension(ext) {
  return extensionMap[ext] || 'file'; // Return 'unknown' if not found
}
</script>

<style lang="scss">
.oc-preview-container .header button.img-v-button {
  all: unset;
  color: #bcbcbc;
  height: 40px;
  position: absolute;
  right: 20px;
  width: 40px;
  top: 4px;
  font-size: 30px;
  background: rgba(0, 0, 0, 0.3137254902);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 100%;
  cursor: pointer;
  transition: all 0.25s ease;
}

.oc-preview-container .header {
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  display: flex;
  justify-content: end;
  padding: 0 20px;
  align-items: center;
  min-height: 50px;
}

.oc-preview-container .v2-image-video-view ul.body {
  background: 0 0;
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0;
}

.oc-preview-container .v2-image-video-view ul.body li.item {
  list-style-type: none;
  display: block !important;
  overflow: hidden;
  background: 0 0;
  max-width: 1020px;
  padding: 20px;

  // max-w-full xl:max-w-[800px] object-cover max-h-[650px] 
  // .container-image-video {
  //   object-fit: cover;
  //   max-height: 650px;
  //   max-width: 100%;

  //   @media (min-width:1280px) {
  //     max-width: 800px;
  //   }
  // }
}

.oc-preview-container {
  .container-image-video {
    object-fit: cover !important;
    max-height: 650px !important;
    max-width: 100%;

    @media (min-width:1280px) {
      max-width: 800px !important;
    }
  }
}

.oc-preview-container .v2-image-video-view ul.body li.item img {
  /* max-height: 95vh;
    max-width: 100vw; */
  object-fit: contain;
  transition: all 0.25s ease;
  animation: img-view 0.25s alternate ease;
}

.oc-preview-container .header button.img-v-button:hover {
  color: #fff;
  background: rgba(0, 0, 0, 0.6196078431);
}
</style>
