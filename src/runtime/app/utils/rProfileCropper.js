export default function rProfileCropper(file, { width = 480, height = 640, emit, uploadProfile }) {
  const option = {
    width,
    height,
    cropWidth: 3,
    cropHeight: 4,
    showCircle: true,
    compressOptions: {
      quality: 0.9,
      width: 480,
      scaleX: -1,
    },
    title: 'Crop Image',
    subTitle: 'Zoom in or out using the scroll wheel, and simply drag to reposition.',
    btnCancelText: 'Cancel',
    btnDoneText: function (data) {
      emit("getFile", data);
    },
    onClose: function () {
      uploadProfile.value = true;
    },
    onError: function (e) {
      console.log('Error', e);
    },
    saving: function (b) {
      console.log('Saving', b);
    },
  };

  if (file && typeof file.crop === 'function') {
    return file.crop(option);
  } else {
    console.warn("Invalid file or missing crop method");
  }
}
