
<template>
  <RModal
    v-model="visible"
    :fullscreen="false"
    :appear="true"
    :transition="true"
    :overlay="true"
    :preventClose="true"
    :ui="{ width: '480px' }"
  >
    <template #header>
      {{ title }}
    </template>

    <div class="cropper-container">
      <img
        v-if="imageUrl"
        ref="imageElement"
        :src="imageUrl"
        class="cropper-image"
        alt="Image to crop"
      />
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <RBtn
          variant="outline"
          :label="cancelText"
          @click="closeCropper"
        />
        <RBtn
          color="primary"
          :label="doneText"
          :loading="saving"
          @click="confirmCrop"
        />
      </div>
    </template>
  </RModal>
</template>

<script setup>
import { ref, watch, nextTick, onBeforeUnmount } from "vue";
import Cropper from "cropperjs";
// import "cropperjs/dist/cropper.css";

const props = defineProps({
  file: { type: Object, default: null },
  width: { type: Number, default: 480 },
  height: { type: Number, default: 640 },
  showCircle: { type: Boolean, default: true },
  title: { type: String, default: "Crop Image" },
  cancelText: { type: String, default: "Cancel" },
  doneText: { type: String, default: "Done" },
});

const emit = defineEmits(["done", "close", "error"]);

const visible = ref(false);
const imageElement = ref(null);
const imageUrl = ref("");
const saving = ref(false);

let cropper = null;
let objectUrl = null;

function destroyCropper() {
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }

  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
    objectUrl = null;
  }
}

async function openCropper(file) {
  if (!(file instanceof Blob)) {
    emit("error", new Error("Invalid image file"));
    return;
  }

  destroyCropper();

  objectUrl = URL.createObjectURL(file);
  imageUrl.value = objectUrl;
  visible.value = true;

  await nextTick();

  if (!imageElement.value) return;

  cropper = new Cropper(imageElement.value, {
    aspectRatio: props.width / props.height,
    viewMode: 1,
    autoCropArea: 1,
    responsive: true,
    movable: true,
    zoomable: true,
    scalable: true,
    background: true,
    dragMode: "move",
    ready() {
      saving.value = false;
    },
  });
}

function confirmCrop() {
  if (!cropper) return;

  saving.value = true;

  try {
    const canvas = cropper.getCroppedCanvas({
      width: props.width,
      height: props.height,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: "high",
    });

    if (!canvas) {
      throw new Error("Unable to crop image");
    }

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          saving.value = false;
          emit("error", new Error("Image compression failed"));
          return;
        }

        const file = new File([blob], "cropped-profile.jpg", {
          type: "image/jpeg",
          lastModified: Date.now(),
        });

        const reader = new FileReader();

        reader.onload = () => {
          emit("done", {
            file,
            byteArray: reader.result,
            name: file.name,
            size: file.size,
            type: file.type,
          });

          saving.value = false;
          visible.value = false;
          destroyCropper();
        };

        reader.onerror = () => {
          saving.value = false;
          emit("error", reader.error);
        };

        reader.readAsDataURL(file);
      },
      "image/jpeg",
      0.9
    );
  } catch (error) {
    saving.value = false;
    emit("error", error);
  }
}

function closeCropper() {
  visible.value = false;
  destroyCropper();
  emit("close");
}

watch(
  () => props.file,
  (file) => {
    if (file) openCropper(file);
  },
  { immediate: true }
);

onBeforeUnmount(destroyCropper);
</script>

<style scoped>
.cropper-container {
  width: 100%;
  height: 400px;
  overflow: hidden;
}

.cropper-image {
  display: block;
  max-width: 100%;
}

cropper-canvas {
  width: 100%;
  height: 400px;
}

cropper-image {
  max-width: 100%;
}
</style>
