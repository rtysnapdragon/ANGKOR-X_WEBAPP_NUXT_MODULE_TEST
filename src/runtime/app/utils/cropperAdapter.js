
import Cropper from "cropperjs";

const activeCrops = new WeakMap();

const TEMPLATE = `
  <cropper-canvas background style="height: 420px; width: 100%;">
    <cropper-image
      rotatable
      scalable
      translatable
    ></cropper-image>

    <cropper-shade hidden></cropper-shade>

    <cropper-handle action="move" plain></cropper-handle>

    <cropper-selection
      initial-coverage="0.9"
      movable
      resizable
      zoomable
      outlined
    >
      <cropper-grid role="grid" covered></cropper-grid>
      <cropper-crosshair centered></cropper-crosshair>
      <cropper-handle action="move"></cropper-handle>
      <cropper-handle action="n-resize"></cropper-handle>
      <cropper-handle action="e-resize"></cropper-handle>
      <cropper-handle action="s-resize"></cropper-handle>
      <cropper-handle action="w-resize"></cropper-handle>
      <cropper-handle action="ne-resize"></cropper-handle>
      <cropper-handle action="nw-resize"></cropper-handle>
      <cropper-handle action="se-resize"></cropper-handle>
      <cropper-handle action="sw-resize"></cropper-handle>
    </cropper-selection>
  </cropper-canvas>
`;

export async function cropFile(file, option = {}) {
  if (!(file instanceof File)) {
    throw new TypeError("Expected a File object");
  }

  const {
    width = 480,
    height = 640,
    cropWidth = 3,
    cropHeight = 4,
    cropArea = 0.9,
    compressOptions = {},
    title = "Crop Image",
    subTitle = "Zoom and drag to reposition",
    btnCancelText = "Cancel",
    btnDoneText = "Done",
    onDone,
    onClose,
    onError,
    saving,
    showCircle = false,
  } = option;

  // Close any existing cropper for this file.
  activeCrops.get(file)?.();

  const objectUrl = URL.createObjectURL(file);

  const overlay = document.createElement("div");
  overlay.className = "r-crop-overlay";

  overlay.innerHTML = `
    <div class="r-crop-dialog">
      <div class="r-crop-header">
        <div>
          <h3>${title}</h3>
          <p>${subTitle}</p>
        </div>
        <button type="button" class="r-crop-close">×</button>
      </div>

      <div class="r-crop-editor"></div>

      <div class="r-crop-footer">
        <button type="button" class="r-crop-cancel">
          ${btnCancelText}
        </button>
        <button type="button" class="r-crop-done">
          ${btnDoneText}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const editor = overlay.querySelector(".r-crop-editor");

  const style = document.createElement("style");
  style.textContent = `
    .r-crop-overlay {
      position: fixed;
      inset: 0;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      background: rgba(0,0,0,.65);
    }

    .r-crop-dialog {
      width: min(600px, 100%);
      background: white;
      border-radius: 12px;
      overflow: hidden;
      color: #222;
    }

    .r-crop-header {
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .r-crop-header h3 {
      margin: 0;
      font-size: 18px;
    }

    .r-crop-header p {
      margin: 5px 0 0;
      font-size: 13px;
    }

    .r-crop-close {
      border: 0;
      background: transparent;
      font-size: 26px;
      cursor: pointer;
    }

    .r-crop-editor {
      width: 100%;
      height: 420px;
      overflow: hidden;
      background: #222;
    }

    .r-crop-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 16px;
    }

    .r-crop-footer button {
      padding: 10px 20px;
      border: 0;
      border-radius: 6px;
      cursor: pointer;
    }

    .r-crop-done {
      background: #2563eb;
      color: white;
    }

    .r-crop-selection {
      aspect-ratio: ${cropWidth} / ${cropHeight};
    }

    ${showCircle ? `
      .r-crop-editor cropper-selection {
        border-radius: 50%;
      }
    ` : ""}
  `;

  document.head.appendChild(style);

  const image = new Image();
  image.src = objectUrl;

  let cropper;
  let closed = false;

  const cleanup = () => {
    if (closed) return;
    closed = true;

    cropper?.destroy();
    overlay.remove();
    style.remove();
    URL.revokeObjectURL(objectUrl);

    if (activeCrops.get(file) === cleanup) {
      activeCrops.delete(file);
    }
  };

  activeCrops.set(file, cleanup);

  const close = () => {
    cleanup();
    onClose?.();
  };

  try {
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });

    if (closed) return;

    cropper = new Cropper(image, {
      container: editor,
      template: TEMPLATE,
    });

    const selection = cropper.getCropperSelection();

    if (!selection) {
      throw new Error("Cropper selection could not initialize");
    }

    selection.aspectRatio = cropWidth / cropHeight;
    selection.initialCoverage = cropArea;

    overlay.querySelector(".r-crop-close").onclick = close;
    overlay.querySelector(".r-crop-cancel").onclick = close;

    overlay.querySelector(".r-crop-done").onclick = async () => {
      const button = overlay.querySelector(".r-crop-done");

      try {
        button.disabled = true;
        saving?.(true);

        const canvas = await selection.$toCanvas({
          width: compressOptions.width || width,
          height: height,
          beforeDraw(context, canvas) {
            if (compressOptions.scaleX === -1) {
              context.translate(canvas.width, 0);
              context.scale(-1, 1);
            }
          },
        });

        const blob = await new Promise((resolve, reject) => {
          canvas.toBlob(
            result => result
              ? resolve(result)
              : reject(new Error("Image conversion failed")),
            file.type || "image/jpeg",
            compressOptions.quality ?? 0.9
          );
        });

        const result = new File(
          [blob],
          `cropped-${file.name}`,
          {
            type: blob.type,
            lastModified: Date.now(),
          }
        );

        cleanup();
        onDone?.(result);
      } catch (error) {
        button.disabled = false;
        onError?.(error);
        console.error("Crop error:", error);
      } finally {
        saving?.(false);
      }
    };

    return cropper;
  } catch (error) {
    cleanup();
    onError?.(error);
    throw error;
  }
}

// Modern API and legacy API use the same implementation.
export function installFileCrop() {
  if (typeof File === "undefined") return;

  if (typeof File.prototype.crop !== "function") {
    Object.defineProperty(File.prototype, "crop", {
      configurable: true,
      writable: true,
      enumerable: false,

      value: function (options) {
        return cropFile(this, options);
      },
    });
  }
}
