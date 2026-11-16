import { defineStore, acceptHMRUpdate } from "pinia";
// import { defineStore, acceptHMRUpdate, useToast, useHttp } from "#imports";
import api from '~/helpers/apis'
const toast = useToast();
export const useUserDetailStore = defineStore("UserDetailStore", {
  state: () => ({
    dataUser: [],
    loading: false,
  }),
  actions: {
    async getUserDetail(username) {
      if (isEmpty(username)) return null;
      const checkExist = this.dataUser?.find(
        (v) => v.LoginName.toLowerCase() == username.toLowerCase()
      );
      if (isNotEmpty(checkExist)) return checkExist;

      try {
        this.loading = true;
        const { data, error } = await useHttp(api.user.getUser.List, {
          method: "POST",
          data: {
            Email: "",
            LoginName: username,
            Phone: "",
            Search: "",
            Status: [],
            UserId: "",
            UserType: [],
          },
        });
        if (error.value) throw error.value;

        if (data.value) {
          if (isNotEmpty(data.value)) this.dataUser.push(data.value[0]);
          this.loading = false;
          return data.value[0];
        }
      } catch (e) {
        this.loading = false;
        toast.add({
          color: "red",
          title: `${e.Message}`,
        });
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserDetailStore, import.meta.hot));
}
