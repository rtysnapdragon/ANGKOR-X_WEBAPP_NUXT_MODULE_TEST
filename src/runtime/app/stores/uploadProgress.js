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

    registerExternalFiles(files) {
      const list = (Array.isArray(files) ? files : [files]).filter(Boolean);
      if (!list.length) return [];
      const entries = list.map(file => ({ file, progress: 0, status: 'pending' }));
      this.allFileMoreUpload.unshift(...entries);
      return entries;
    },
    beginExternalUpload(entry) {
      if (!entry) return;
      entry.status = 'uploading';
      entry.progress = 0;
      this.isUploading = true;
    },
    setExternalProgress(entry, progress) {
      if (!entry) return;
      const value = Number(progress);
      if (!Number.isFinite(value)) return;
      const index = this.allFileMoreUpload.indexOf(entry);
      if (index >= 0) this.updateProgress(index, Math.max(0, Math.min(100, Math.round(value))));
    },
    completeExternalUpload(entry, response, size) {
      if (!entry) return;
      entry.status = 'completed';
      entry.progress = 100;
      entry.error = null;
      const name = entry.file?.name || entry.file?.Name;
      if (name) {
        this.fileCompleted[name] = { ...(response || {}), Size: size ?? entry.file?.size ?? 0 };
        const failedIndex = this.fileError.indexOf(name);
        if (failedIndex >= 0) this.fileError.splice(failedIndex, 1);
      }
    },
    failExternalUpload(entry, error) {
      if (!entry) return;
      entry.status = 'error';
      entry.error = error?.message || String(error || '');
      const name = entry.file?.name || entry.file?.Name;
      if (name && !this.fileError.includes(name)) this.fileError.push(name);
    },
    removeExternalUpload(entry) {
      if (!entry) return;
      const index = this.allFileMoreUpload.indexOf(entry);
      if (index >= 0) this.allFileMoreUpload.splice(index, 1);
    },
    syncExternalUploading(active) {
      this.isUploading = !!active;
    },
    setBeforeUnloadListener() {
      if (!this.isUploading || typeof window === 'undefined') return;
      window.addEventListener('beforeunload', this.handleBeforeUnload);
    },
    clearBeforeUnloadListener() {
      if (typeof window === 'undefined') return;
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
