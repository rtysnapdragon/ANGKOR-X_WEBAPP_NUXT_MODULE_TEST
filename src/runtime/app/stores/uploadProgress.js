export const useUploadProgress = defineStore('UploadProgressStore', {
  state: () => ({
    allFileMoreUpload: [],
    uploads: {}, 
    fileCompleted: {},
    fileError: [], 
    isUploading: false,
    currentUploadIndex: 0,
  }),
  actions: {
    checkFileUpload(files) {
      const newFiles = files.map(file => ({
        file,
        progress: 0,
        status: 'pending',
      }));
      this.allFileMoreUpload.unshift(...newFiles); 
      this.setBeforeUnloadListener(); 
    },
    startNextUpload() {
      if (this.currentUploadIndex < this.allFileMoreUpload.length) {
        const fileData = this.allFileMoreUpload[this.currentUploadIndex];
        if (fileData.status === 'pending') {
          fileData.status = 'uploading';
          this.isUploading = true;
        } else {
          this.currentUploadIndex++;
          this.startNextUpload();
        }
      } else {
        this.isUploading = false;
        this.clearBeforeUnloadListener();
      }
    },
    updateProgress(index, progress) {
      if (this.allFileMoreUpload[index]) {
        this.allFileMoreUpload[index].progress = progress;
      }
    },
    finishUpload(index, res, size) {
      const fileData = this.allFileMoreUpload[index];
      if (fileData) {
        fileData.status = 'completed';
        this.fileCompleted[fileData.file?.name || fileData.file?.Name] = { ...res, Size: size };
        this.currentUploadIndex++;
        this.startNextUpload();
      }
    },
    failUpload(index) {
      const fileData = this.allFileMoreUpload[index];
      if (fileData) {
        fileData.status = 'error';
        this.fileError.push(fileData.file?.name || fileData.file?.Name); 
        this.currentUploadIndex++;
        this.startNextUpload(); 
      }
    },
    setBeforeUnloadListener() {
      if (!this.isUploading) return;
      window.addEventListener('beforeunload', this.handleBeforeUnload);
    },
    clearBeforeUnloadListener() {
      window.removeEventListener('beforeunload', this.handleBeforeUnload);
    },
    handleBeforeUnload(event) {
      event.preventDefault();
      event.returnValue = 'Uploads are in progress. Do you want to leave this page?';
    },
  },
  watch: {
    isUploading(value) {
      if (value) {
        this.setBeforeUnloadListener();
      } else {
        this.clearBeforeUnloadListener();
      }
    },
  },
});

if (import.meta.hot) {
    import.meta.hot.accept(acceptHMRUpdate(useUploadProgress, import.meta.hot));
}
