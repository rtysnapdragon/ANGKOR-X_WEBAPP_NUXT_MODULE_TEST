<template>
  <div class="space-y-3">
    <div class="custom-image-size container-file-upload" @click="refInputFile.click()" @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave" @drop.prevent="onDrop" :class="[
        del ? '' : 'btn-delete-file-upload',
        height,
        isDragging ? 'is-drag-over' : '',
      ]">
      <input ref="refInputFile" type="file" name="dragDrop" multiple hidden @change="onChangeImage" :accept="acceptExtension ? acceptExtension : 'image/*,video/*,application/pdf'
        " />
      <div class="grid justify-center gap-[6px] text-center">
        <div class="icon-attachment-file flex justify-center">
          <img src="../../assets/imgs/default-img/Upload.png" alt="Browse" class="w-9 h-9 cursor-pointer" />
        </div>
        <p class="text-[13px] color-w-b-2">
          {{
            tBy({
              en: "Click or drag and drop here to upload",
              km: "ចុចឬអូសហើយទម្លាក់ទីនេះ",
            })
          }}
        </p>
      </div>
    </div>

    <div :class="`contain-attachment-file-wrapper ${columns ?? 'grid-cols-1'}`">
      <div v-for="file in fileImageList" :key="file.Name" :class="[
        'custom-image-size contain-attachment-file-container h-[60px]',
        height,
      ]">
        <div class="grid items-center justify-center w-10 h-10 min-h-[40px] rounded-[7px] overflow-hidden">
          <img v-if="isImage(file)" class="w-10 h-fit object-contain " :src="getImageUrl(file)" @error="
            (e) => {
              defaultImg.get(e, 'img');
            }
          " />
          <img v-else-if="isVideo(file)" class="w-10 h-fit object-contain "
            src="../../assets/imgs/default-img/video.png" />
          <img v-else-if="isPdf(file)" class="w-10 h-fit object-contain "
            src="../../assets/imgs/default-img/pdf-file.png" />
        </div>
        <div class="flex flex-col">
          <span class="text-[13px]">{{
            file.Name.substring(0, 15) + "." + file.Extension
          }}</span>
        </div>

        <button @click="clickOnBtnClose(file)" v-if="del" class="btn-del-down-icon btn-delete">
          <i class="ri-close-circle-fill"></i>
        </button>
        <button @click="downloadFile(file.Extension)" v-else class="btn-del-down-icon btn-download">
          <i class="ri-download-cloud-2-line"></i>
        </button>
      </div>
    </div>
  </div>  
</template>

<script setup>
import defaultGallery1 from "../../assets/imgs/default-file-img/Gallery1.png";
import {UseDefaultImageStore} from '../../stores/defaultImage'
const toast = useToast();
const defaultImg = UseDefaultImageStore();
const refInputFile = ref([]);
const fileImageList = defineModel();
const props = defineProps([
  "showIconDelete",
  "height",
  "columns",
  "editDrawFile",
  "acceptExtension",
]);
const emits = defineEmits(["onDeleteFile"]);
const del = computed(() => isNotEmpty(props.showIconDelete));
const height = computed(() => props.height ?? "");
const acceptExtension = computed(() => props.acceptExtension);
const columns = computed(() => props.columns);
const isDragging = ref(false);

const isImage = (file) => {
  const imageExtensions = ["jpg", "png", "jpeg", "gif", "jfif"];
  return imageExtensions.includes(file.Extension);
};

const isVideo = (file) => {
  const videoExtensions = ["mp4", "mov", "avi", "mkv", "MOV"];
  return videoExtensions.includes(file.Extension);
};
const isPdf = (file) => {
  const pdfExtensions = ["PDF", "pdf"];
  return pdfExtensions.includes(file.Extension);
};

const readAndPushFile = (file, callBack) => {
  let reader = new FileReader();

  reader.onloadend = function () {
    let byteArray = new Uint8Array(reader.result);
    let byteArrayAsArray = Array.from(byteArray);

    callBack(byteArrayAsArray);
  };

  reader.readAsArrayBuffer(file);
};

const onChangeImage = (event) => {
  const files = Array.from(event.target.files);
  processFiles(files);
  event.target.value = "";
};

const onDrop = (event) => {
  const files = Array.from(event.dataTransfer.files);
  processFiles(files);
  isDragging.value = false;
  event.target.value = "";
};

const processFiles = (files) => {
  let fileReadPromises = [];

  files.forEach((file) => {
    let fileName = file.name;
    let extension = fileName.split(".").pop().toLowerCase();

    if (["mp4", "mov", "avi", "mkv", "pdf"].includes(extension)) {
      let fileReadPromise = new Promise((resolve) => {
        readAndPushFile(file, (byte) => {
          let obj = {
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
          // console.log('----->>> file >>', obj, byte)
          fileImageList.value?.unshift(obj);
          resolve();
        });
      });
      fileReadPromises.push(fileReadPromise);
    }

    else if (["jpg", "png", "jpeg", "gif", "jfif"].includes(extension)) {
      if (fileName.length > 50) {
        toast.add({
          color: "red",
          title: `Just 50 characters can be used, therefore please rename your file.`,
        });
      } else {
        let fileReadPromise = new Promise((resolve, reject) => {
          file.compress({
            maxWidth: 1020,
            compressSize: 1000000,
            quality: 0.8,
            onDone: (data) => {
              new DataTransfer();
              let obj = {
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
              if (obj.size / (1024 * 1024).toFixed(2) > 2) {
                toast.add({
                  color: "red",
                  title: `The size of your file over 2 M.B Name : ${obj.Name}.`,
                });
              } else {
                fileImageList.value?.unshift(obj);
              }
              resolve();
            },
          });
        });
        fileReadPromises.push(fileReadPromise);
      }
    }

    else {
      toast.add({
        color: "red",
        title: `The file type is not supported. Name : ${file.name}.`,
      });
    }
  });

  Promise.all(fileReadPromises)
    .then(() => {
      fileImageList.value;
    })
    .catch((error) => {
      console.error("Error processing files:", error);
    });
};

const onDragOver = () => {
  isDragging.value = true;
};

const onDragLeave = () => {
  isDragging.value = false;
};

const getImageUrl = (file) => {
  const extension = file?.Extension || file?.Name?.split(".").pop();
  if (isImage(file)) {
    if (file.Path) {
      return getUrl(file.Path, true);
    } else {
      return URL.createObjectURL(file?.fileTarget || file?.FullPath);
    }
  } else if (isVideo(file)) {
    return URL.createObjectURL(file?.fileTarget || file?.FullPath);
  } else {
    return defaultGallery1;
  }
};

const clickOnBtnClose = (file) => {
  fileImageList.value = fileImageList.value.filter((v) => v.Name != file.Name);
  emits("onDeleteFile", file);
};

const downloadFile = (data) => {
  console.log(data);
  const path = data;
  const a = document.createElement("a");
  a.href = path;
  a.download = path;

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};
</script>

<style lang="scss" scoped>
.container-file-upload {
  width: 100%;
  cursor: pointer;
  border: 2px dotted var(--border-input);
  padding: 20px 0 !important;
  border-radius: 10px;
  user-select: none;
  transition: all 0.2s ease;

  &.btn-delete-file-upload {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &.is-drag-over {
    border-color: var(--color-primary);
    // transform: scale3d(1.01, 1.01, 1);
  }

  // &:hover {
  //   border-color: var(--color-primary);
  //   background-color: #00000008;
  // }

  &:active {
    // transform: scale3d(0.95, 0.95, 1);
    border-color: var(--color-primary);
  }
}

.contain-attachment-file-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
  max-height: 328px;

  .contain-attachment-file-container {
    position: relative;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    border-radius: 10px;
    background-color: var(--bg-wrapper);

    .btn-del-down-icon {
      cursor: pointer;
      position: absolute;
      top: 32%;
      right: 10px;
      width: 20px;
      height: 20px;
      display: flex;
      justify-content: center;
      align-items: center;

      &.btn-delete {
        i {
          font-size: 20px;
          color: var(--ocs-c-red);
        }
      }

      &.btn-download {
        background-color: #ebf8fe;

        i {
          font-size: 11px;
          color: var(--color-primary);
        }
      }
    }
  }
}
</style>
