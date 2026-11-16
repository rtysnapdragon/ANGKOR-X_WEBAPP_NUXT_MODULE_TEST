import { defineStore, acceptHMRUpdate, useToast  } from '#imports'
import api from '~/helpers/apis'
import str from '~/helpers/str'

export const useTokenNotification = defineStore('TokenNotification', {
  state: () => ({
    total: 0,
  }),
  getters: {
    data: (state) => state.total,
  },
  actions: {
    async create(tokenData) {
      const toast = useToast()
      try {
        const dataSend = {
          Token: tokenData.Token,
          Platform: tokenData.Platform ?? 'web',
          DeviceId: tokenData.DeviceId ?? null,
          Language: useCookie(str.langCode).value,
        };
        const { data, error } = await useHttp(api.notification.createToken, {
          method: "POST",
          data: dataSend,
        });
        if (error.value) throw error.value;
      } catch (e) {
        toast.add({
          color: 'red',
          title: `${e.Message}`,
        });
      }
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(
    acceptHMRUpdate(useTokenNotification, import.meta.hot)
  );
}