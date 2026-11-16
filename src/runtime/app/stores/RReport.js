import {
  defineStore,
  acceptHMRUpdate,
  useLocalePath,
  useToast,
} from "#imports";

export const useMyOCReportStore = defineStore("myOCReportStore", {
  state: () => ({
    helper: helper(),
    localePath: useLocalePath(),
    toast: useToast(),
    title: "Print Report",
    description: "Select the report type to print",
    report: [],
    reportList: [],
    showReport: false,
    beforePrintOrPreview: "",
    option: "print",
    callBack: "",
    onLoading: "",
    dataSend: {
      Id: "",
      ReportCode: "",
      url: "",
      data: "",
    },
  }),
  actions: {
    findReportType(type) {
      return this.report.filter((v) => v.ReportType == type);
    },
    findReportID(Id) {
      return this.report.find((v) => v.Id == Id);
    },

    findReportCode(Code) {
      return this.report.find((v) => v.ReportCode == Code);
    },

    async printOrPreview(data) {
      const defaultFilter = isNotEmpty(data.DefaultFilterJson)
        ? JSON.parse(data.DefaultFilterJson)
        : {};
      if (this.onLoading) this.onLoading(true);
      const sendData = {
        ReportId: data.Id ?? "",
        ReportCode: data.ReportCode ?? "",
        RequestUrl: data.url ?? "",
        RequestData: isNotEmpty(data.data)
          ? JSON.stringify({ ...defaultFilter, ...data.data })
          : "",
      };
      if (this.beforePrintOrPreview) this.beforePrintOrPreview(sendData);
      if (this.callBack) this.callBack(sendData);

      const base64Data = btoa(JSON.stringify(sendData));

      if (this.option == "preview") {
        const path = this.localePath(
          `/report/preview?data=${base64Data}&fullPath=${getUrl(
            "/report/preview",
            true
          )}`
        );
        if (path) navigateTo(path, { open: { target: "_blank" } });
        this.checkSelected(true);
      } else {
        const url = getUrl(`/report/previewprint?data=${base64Data}`, true);
        const iframe = document.getElementById("OCREPORTPRINT");
        iframe.src = url;
        iframe.onload = () => {
          this.reportList = this.reportList.map((v) => {
            return { ...v, ...{ loading: false } };
          });
          if (this.onLoading) this.onLoading(false);
        };
      }
    },

    checkSelected(preview = false) {
      let checkSelected = this.reportList.filter((v) => v.selected == true);
      if (checkSelected.length == this.reportList.length || preview) {
        this.showReport = false;
        this.reportList = this.reportList.map((v) => {
          return { ...v, ...{ loading: false, selected: false } };
        });
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMyOCReportStore, import.meta.hot));
}
