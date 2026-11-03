<template>
  <RModal v-model="uploadProfile" :fullscreen="false" :appear="true" :transition="true" :overlay="true"
    :overflow-auto="false" :ui="{ width: '480px' }" :preventClose="true">
    <template #header>
      {{ t("change_profile_picture") }}
    </template>

    <div class="custom-image-size container-file-upload" :class="{ 'is-drag-over': isDragging }"
      @dragover.prevent="onDragOver" @dragleave.prevent="onDragLeave" @drop.prevent="onDrop">
      <input ref="refInputFile" type="file" name="dragDrop" hidden @change="onChangeImage"
        :accept="acceptExtension || 'image/*,video/*,application/pdf'" />
      <div class="grid justify-center gap-[16px] text-center">
        <div class="icon-attachment-file flex justify-center">
          <img :src="isNotEmpty(showImage) ? showImage : imageDefualt"
            class="w-[120px] h-[120px] object-cover rounded-full" />
        </div>
        <div class="flex flex-col gap-0">
          <div class="text-[18px] color-w-b-2">
            {{ t("drag_drop_photo_here") }}
          </div>
          <div class="text-[14px] color-w-b-2">
            - {{ tBy({ en: "or", km: "ឬ" }) }} -
          </div>
        </div>
        <div class="flex gap-2.5">
          <RBtn size="l" variant="solid" color="" icon="upload" :label="t('upload_from_computer')"
            class="bg-primary transition-all ease-in-out w-full flex justify-center"
            @click="refInputFile?.click()"></RBtn>
          <RBtn size="l" variant="solid" color="" icon="camera" :label="t('take_a_picture')"
            class="bg-primary transition-all ease-in-out w-full flex justify-center" @click="
              isCamera = true;
            uploadProfile = false;
            "></RBtn>
        </div>
      </div>
    </div>

    <template #footer> </template>
  </RModal>

  <RCamera v-model="isCamera" :isBack="true" @capture="handleCapture" @onBack="whenBackFromCamera" />
</template>

<script setup>
const toast = useToast();
import imageDefualt from "../../assets/imgs/default-user.png";
const { t } = useI18n();
const props = defineProps([
  "showIconDelete",
  "height",
  "columns",
  "editDrawFile",
  "acceptExtension",
  "width",
  "showImage",
]);
const width = computed(() => props.width ?? 480);
const height = computed(() => props.height ?? 640);
const showImage = computed(() => props.showImage ?? "");
const emit = defineEmits(["getFile"]);
const uploadProfile = defineModel();
const isCamera = ref(false);
const isDragging = ref(false);
const fileImage = ref();
const capturedImage = ref(null);

const refInputFile = ref();
const acceptExtension = computed(() => props.acceptExtension);

function whenBackFromCamera(check) {
  if (check) {
    uploadProfile.value = true;
  }
}

const onChangeImage = (event) => {
  const files = Array.from(event.target.files);
  processFiles(files);
  event.target.value = "";
};

const onDrop = (event) => {
  const files = Array.from(event.dataTransfer.files);
  processFiles(files);
  isDragging.value = false;
};

const onDragOver = () => (isDragging.value = true);
const onDragLeave = () => (isDragging.value = false);

function handleCapture(file) {
  capturedImage.value = file;
  emit("getFile", capturedImage.value);
}

function cropImage(file) {
  const option = {
    width: width.value,
    height: height.value,
    cropWidth: 3,
    cropHeight: 4,
    showCircle: true,
    compressOptions: {
      quality: 0.9,
      width: 480,
      scaleX: -1,
    },
    title: tBy({ en: "Crop Image", km: "កាត់ទម្រង់រូបភាព" }),
    subTitle: tBy({
      en: "Zoom in or out using the scroll wheel, and simply drag to reposition",
      km: "ប្រើម៉ៅរបស់អ្នកដើម្បីពង្រីកឬបង្រួម និងអូសរូបភាពដើម្បីផ្លាស់ប្តូរទីតាំង",
    }),
    btnCancelText: t("cancel"),
    btnDoneText: t("done"),
    onDone: function (data) {
      emit("getFile", data);
    },
    onClose: function () {
      uploadProfile.value = true;
    },
    onError: function (e) {
      console.log("Error", e);
    },
    saving: function (b) {
      console.log("Saving", b);
    },
  };
  if (file) {
    uploadProfile.value = false;
    file.crop(option);
  }
}

function processFiles(files) {
  const fileReadPromises = files.map((file) => {
    const extension = file.name.split(".").pop().toLowerCase();
    if (["mp4", "mov", "avi", "mkv", "pdf"].includes(extension)) {
      return new Promise((resolve) => {
        readAndPushFile(file, (byte) => {
          fileImage.value = {
            Image: byte,
            lastModified: file.lastModified,
            lastModifiedDate: file.lastModifiedDate,
            webkitRelativePath: file.webkitRelativePath,
            Name: file.name,
            size: file.size,
            fileTarget: file,
            Extension: extension,
            FilePath: "",
          };
          resolve();
        });
      });
    }

    if (["jpg", "png", "jpeg"].includes(extension)) {
      if (file.name.length > 50) {
        toast.add({
          color: "red",
          title: `Just 50 characters can be used. Please rename your file.`,
        });
        return Promise.resolve();
      }

      return new Promise((resolve) => {
        file.compress({
          maxWidth: 1020,
          compressSize: 1000000,
          quality: 0.8,
          onDone: (data) => {
            const sizeMB = data.size / (1024 * 1024);
            if (sizeMB > 2) {
              toast.add({
                color: "red",
                title: `The size of your file is over 2MB. Name: ${file.name}`,
              });
            } else {
              fileImage.value = {
                Image: data.byteArray,
                lastModified: file.lastModified,
                lastModifiedDate: file.lastModifiedDate,
                webkitRelativePath: file.webkitRelativePath,
                Name: file.name,
                size: data.size,
                fileTarget: file,
                Extension: extension,
                FilePath: "",
              };
              cropImage(file);
            }
            resolve();
          },
        });
      });
    }

    return Promise.resolve(); // unsupported file type
  });

  Promise.all(fileReadPromises).catch((err) =>
    console.error("File processing failed:", err)
  );
}
</script>

<style lang="scss" scrop>
.container-file-upload {
  width: 100% !important;
  border: 2px dotted var(--border-input) !important;
  padding: 200px 0 !important;
  border-radius: 10px !important;
  user-select: none !important;
  transition: all 0.2s ease !important;

  &.is-drag-over {
    border-color: var(--color-primary) !important;
  }

  // &:active {
  //   border-color: var(--color-primary);
  // }
}

.contain-attachment-file-wrapper {
  display: flex !important;
  flex-direction: column !important;
  gap: 6px !important;
  overflow-y: auto !important;
  max-height: 328px !important;

  .contain-attachment-file-container {
    position: relative !important;
    display: flex !important;
    align-items: center !important;
    gap: 10px !important;
    padding: 10px !important;
    border-radius: 10px !important;
    background-color: var(--bg-wrapper) !important;

    .btn-del-down-icon {
      position: absolute !important;
      top: 32% !important;
      right: 10px !important;
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;

      &.btn-delete i {
        font-size: 20px !important;
        color: var(--ocs-c-red) !important;
      }

      &.btn-download {
        background-color: #ebf8fe !important;

        i {
          font-size: 11px !important;
          color: var(--color-primary) !important;
        }
      }
    }
  }
}
</style>
