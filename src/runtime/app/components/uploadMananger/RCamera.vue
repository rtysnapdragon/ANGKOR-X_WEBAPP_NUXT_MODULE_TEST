<template>
  <RModal
    v-model="cameraModal"
    :fullscreen="false"
    :appear="true"
    :transition="true"
    :overlay="true"
    :overflow-auto="false"
    :ui="{ width: '' }"
    :preventClose="true"
    :noClose="true"
  >
    <template #header>
      <div
        v-if="isBack"
        class="hoverBtn w-[35px] h-[35px] rounded-full flex justify-center items-center p-2 cursor-pointer"
        @click="whenBack"
      >
        <i class="ri-arrow-left-s-line text-[20px]"></i>
      </div>
      <div
        v-else
        class="hoverBtn w-[35px] h-[35px] rounded-full flex justify-center items-center p-2 cursor-pointer"
        @click="cameraModal = false"
      >
        <i class="ri-close-line text-[20px]"></i>
      </div>
    </template>

    <template #headerRight>
      <div
        class="hoverBtn w-[35px] h-[35px] rounded-full flex justify-center items-center p-2 cursor-pointer"
        @click="switchCamera"
      >
        <i class="ri-camera-switch-line text-[20px]"></i>
      </div>
    </template>

    <template #headerCenter>
      {{ t("camera") }}
    </template>

    <div
      v-if="loading"
      class="absolute inset-0 z-50 bg-white/70 flex justify-center items-center"
    >
      <div
        class="animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-primary)] border-t-transparent"
      ></div>
    </div>

    <div class="camera-container">
      <video ref="video" autoplay playsinline class="video-preview" />
      <canvas ref="canvas" class="hidden" />
    </div>

    <template #footer>
      <div class="w-full flex justify-center items-center">
        <div
          class="styleTake h-[50px] w-[50px] rounded-full flex items-center justify-center TakePicture cursor-pointer"
          @click="capturePhoto"
        >
          <div
            class="bg-[--color-primary] h-[40px] w-[40px] rounded-full flex justify-center items-center"
          >
            <i class="ri-camera-3-line text-[white] "></i>
          </div>
        </div>
      </div>
    </template>
  </RModal>
</template>

<script setup>
import { nextTick, ref, watch, onBeforeUnmount, computed } from "vue";
const cameraModal = defineModel();
const { t } = useI18n();
const props = defineProps(["width", "height", "isBack", "notCrop"]);
const emit = defineEmits(["capture","onBack"]);
const width = computed(() => props.width ?? 480);
const height = computed(() => props.height ?? 640);
const isBack = computed(() => props.isBack ?? false);
const notCrop = computed(() => props.notCrop ?? false);

const video = ref(null);
const canvas = ref(null);
const stream = ref(null);
const loading = ref(false);

const devices = ref([]);
const currentDeviceIndex = ref(0);


function whenBack(){
  cameraModal.value = false;
  emit('onBack',true)
  stopCamera()
}

const getVideoDevices = async () => {
  try {
    await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
      }
    });

    const allDevices = await navigator.mediaDevices.enumerateDevices();
    devices.value = allDevices.filter(device => device.kind === "videoinput");
  } catch (error) {
    console.error("Error accessing video devices:", error);
  }
};


const startCamera = async () => {
  loading.value = true;
  try {
    await getVideoDevices();
    if (!devices.value.length) {
      console.error("No video devices found.");
      loading.value = false;
      return;
    }

    const deviceId = devices.value[currentDeviceIndex.value]?.deviceId;

    const constraints = {
      video: {
        deviceId: { exact: deviceId },
        width: { ideal: width.value },
        height: { ideal: height.value },
      },
    };

    await stopCamera();
    if (!video.value) await nextTick();
    stream.value = await navigator.mediaDevices.getUserMedia(constraints);

    if (video.value) {
      video.value.srcObject = stream.value;
      video.value.onloadedmetadata = () => {
        video.value.play();
        loading.value = false;
      };
    } else {
      loading.value = false;
    }
  } catch (err) {
    console.error("Camera error:", err);
    loading.value = false;
  }
};

const stopCamera = async () => {
  if (stream.value) {
    stream.value.getTracks().forEach((track) => track.stop());
    stream.value = null;
  }
};

const switchCamera = async () => {
  if (devices.value.length === 0) return;
  currentDeviceIndex.value =
    (currentDeviceIndex.value + 1) % devices.value.length;
  await startCamera();
};

const capturePhoto = () => {
  const videoEl = video.value;
  const canvasEl = canvas.value;
  if (!videoEl || !canvasEl) return;
  canvasEl.width = videoEl.videoWidth;
  canvasEl.height = videoEl.videoHeight;
  const ctx = canvasEl.getContext("2d");
  ctx.translate(canvasEl.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
  const imageBase64 = canvasEl.toDataURL("image/jpeg", 1.0);
  const byteString = atob(imageBase64.split(",")[1]);
  const mimeString = imageBase64.split(",")[0].split(":")[1].split(";")[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([ab], { type: mimeString });
  const file = new File([blob], "captured.jpg", { type: mimeString });
  cameraModal.value = false;
  if (!notCrop.value) {
    cropImage(file);
  } else {
    emit("capture", file);
  }
};

function cropImage(file) {
  const option = {
    width: width.value,
    height: height.value,
    cropWidth: 3,
    cropHeight: 4,
    cropArea: 0.9,
    showCircle: true,
    compressOptions: {
      quality: 0.9,
      width: 480,
      scaleX: -1,
    },
    options: {
      background: true,
      zoomOnWheel: true,
      viewMode: 1,
      autoCropArea: 1,
      responsive: true,
      movable: true,
      zoomable: true,
      scalable: true,
    },
    title: tBy({ en: 'Crop Image', km: 'កាត់ទម្រង់រូបភាព' }),
    subTitle: tBy({
      en: 'Zoom in or out using the scroll wheel, and simply drag to reposition',
      km: 'ប្រើម៉ៅរបស់អ្នកដើម្បីពង្រីកឬបង្រួម និងអូសរូបភាពដើម្បីផ្លាស់ប្តូរទីតាំង',
    }),
    btnCancelText: t('cancel'),
    btnDoneText: t('done'),

    onDone(data) {
      emit('capture', data);
    },
    onClose() {
      cameraModal.value = true;
    },
    onError(e) {
      console.log('Error', e);
    },
    saving(b) {
      console.log('Saving', b);
    },
  };

  if (file) {
    file.crop(option);
  }
}



watch(cameraModal, (val) => {
  if (val) {
    startCamera();
  } else {
    stopCamera();
  }
});

onBeforeUnmount(() => {
  stopCamera();
});
</script>

<style scoped>
.camera-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}
.video-preview {
  width: 100%;
  max-width: 640px;
  border-radius: 8px;
  transform: scaleX(-1); /* Live mirror preview */
}
.hidden {
  display: none;
}
.btn {
  padding: 10px 20px;
  background-color: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
.btn:hover {
  background-color: #059669;
}
.styleTake {
  border: 2px solid var(--color-primary);
}
.hoverBtn:hover {
  background-color: var(--bg-wrapper);
}
.TakePicture:hover {
  opacity: 70%;
}
</style>
