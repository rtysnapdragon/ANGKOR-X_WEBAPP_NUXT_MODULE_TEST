import api from '~/helpers/apis'
import { useToast } from '#imports'

function profileError(e) {
  return (
    e?.detail?.Message ??
    e?.detail?.detail ??
    e?.Message ??
    e?.message ??
    e?.detail ??
    (typeof e === "string" ? e : "Something went wrong")
  );
}

// ── Avatar helpers ───────────────────────────────────────────────────────────
const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const AVATAR_EXT = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

// The backend spells the key differently per endpoint.
const pickAvatarUrl = (d) =>
  d?.AvatarUrl ?? d?.Avatarurl ?? d?.avatarUrl ?? d?.Url ?? d?.url ?? "";

// The same URL is reused after every upload, so bust the browser cache.
const withCacheBust = (url) => `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`;

export const useUserProfileStore = defineStore("UserProfileStore", {
  state: () => ({
    toast: useToast(),
    loading: true,
    dataUser: {},
    isSuccess: false,
    isSend: false,
    isChange: false,
    isChangeImage: false,

    isLoadingApiProcess: false, // use all request with api
    isNextToPageConfirm: false,
    isRequestSuccess: false, // use all respond from api

    // dataSignature: []
  }),
  getters: {
    getLoading: (state) => state.loading,
    getData: (state) => state.dataUser,
    // getDataSignature: (state) => state.dataSignature,
  },
  actions: {
    resetSuccess() {
      this.isSuccess = false;
      this.isSend = false;
    },

    async get(isSignature) {
      const toast = useToast();
      try {
        this.loading = true;
        const { data, error } = await useHttp(api.userInfo, {
          method: "post",
          data: {
            Pages: 1,
            Records: 0,
            Status: [1, 3, 4],
          },
        });

        if (error.value) throw error.value;

        if (data.value) {
          this.dataUser = { ...data.value };
          if (data.value.ReferenceId) {
            await this.getEmployeeDetail(data.value.ReferenceId);
            if (isSignature && data.value.ReferenceId > 0)
              await this.getSignature();
          }
        }
        this.loading = false;
      } catch (e) {
        this.loading = false;
        this.toast.add({
          color: "red",
          title: profileError(e),
        });
      }
    },

    // get employee data by user
    async getEmployeeDetail(id) {
      const toast = useToast();
      if (!id) return;
      try {
        const { data, error } = await useHttp(
          `${api.employee.detail}?EmployeeId=${id}`
        );
        if (error.value) throw error.value;
        if (data.value) {
          this.dataUser.EmpDetail = isNotEmpty(data.value) ? data.value : {};
        }
      } catch (error) {
        toast.add({
          color: "red",
          title: profileError(error),
        });
      }
    },

    // Update Profile
    async updatedProfile(dataSend) {
      const toast = useToast();
      try {
        const { data, error } = await useHttp(api.userUpdate, {
          method: "post",
          data: dataSend,
        });

        if (error.value) throw error.value;

        if (data.value) {
          this.dataUser = { ...this.dataUser, ...data.value };
          toast.add({
            color: "green",
            title: "Success update profile",
          });
          return data.value;
        }
      } catch (e) {
        toast.add({
          color: "red",
          title: profileError(e),
        });
      }
    },

    // ── Addresses (1:N) ──────────────────────────────────────────────────
    async getAddresses() {
  const toast = useToast();
      try {
        const { data, error } = await useHttp(api.userAddress, {
          method: "get",
        });

        if (error.value) throw error.value;

        if (data.value) this.dataUser.Addresses = data.value;

        return this.dataUser.Addresses;
      } catch (e) {
        toast.add({
          color: "red",
          title: profileError(e),
        });
      }
    },

    // Create or update one address; `Id` present means update.
    async savedAddress(obj) {
  const toast = useToast();
      try {
        const { data, error } = await useHttp(api.userAddressSave, {
          method: "post",
          data: obj,
        });

        if (error.value) throw error.value;

        if (data.value) {
          await this.getAddresses();
          toast.add({
            color: "green",
            title: "Success save address",
          });
          return data.value;
        }
      } catch (e) {
        toast.add({
          color: "red",
          title: profileError(e),
        });
      }
    },

    async deletedAddress(id) {
  const toast = useToast();
      try {
        const { data, error } = await useHttp(api.userAddressDelete, {
          method: "post",
          data: { Id: id },
        });

        if (error.value) throw error.value;

        if (data.value) {
          await this.getAddresses();
          toast.add({
            color: "green",
            title: "Success delete address",
          });
          return true;
        }
      } catch (e) {
        toast.add({
          color: "red",
          title: profileError(e),
        });
      }
    },

    async setDefaultAddress(id) {
  const toast = useToast();
      try {
        const { data, error } = await useHttp(api.userAddressSetDefault, {
          method: "post",
          data: { Id: id },
        });

        if (error.value) throw error.value;

        if (data.value) {
          await this.getAddresses();
          return data.value;
        }
      } catch (e) {
        toast.add({
          color: "red",
          title: profileError(e),
        });
      }
    },

    // Upload the cropped avatar for the LOGGED-IN user.
    // Accepts what RUploadManager emits ({ file, byteArray, ... }) or a plain Blob/File.
    // Returns the new avatar URL, or "" when it failed (a toast is already shown).
    async updatedAvatar(input) {
      const toast = useToast();
      const blob = input?.file ?? input;

      if (!(blob instanceof Blob) || !blob.type.startsWith("image/")) {
        toast.add({ color: "red", title: "Please choose an image file" });
        return "";
      }
      if (blob.size > AVATAR_MAX_BYTES) {
        toast.add({ color: "red", title: "Image is too large (max 5 MB)" });
        return "";
      }

      try {
        this.isChangeImage = true;

        const formData = new FormData();
        formData.append("file", blob, blob.name || `avatar.${AVATAR_EXT[blob.type] ?? "png"}`);

        const { data, error } = await useHttp(api.userAvatar, {
          method: "post",
          body: formData,
        });
        if (error.value) throw error.value;

        let url = pickAvatarUrl(data.value);
        if (url) {
          url = withCacheBust(url);
          this.dataUser = { ...this.dataUser, ...data.value, AvatarUrl: url };
        } else {
          await this.get(); // endpoint returned no body: reload the profile instead
          url = pickAvatarUrl(this.dataUser);
        }
        if (!url) throw new Error("The server did not return the new avatar");

        toast.add({ color: "green", title: "Success update photo" });
        return url;
      } catch (e) {
        toast.add({ color: "red", title: profileError(e) });
        return "";
      } finally {
        this.isChangeImage = false;
      }
    },

    // Update Phone
    async updatedPhone(obj) {
  const toast = useToast();
      try {
        const { data, error } = await useHttp(api.userInfoChangePhone, {
          method: "post",
          data: obj,
        });
        if (error.value) throw error.value;
        if (data.value) {
          this.dataUser.Phone = obj.Phone;
          toast.add({
            color: "green",
            title: `Success update phone`,
          });
          return true;
        }
      } catch (e) {
        toast.add({
          color: "red",
          title: profileError(e),
        });
      }
    },

    // Update Email
    async updatedEmail(obj) {
  const toast = useToast();
      try {
        const { data, error } = await useHttp(api.userChangeEmail, {
          method: "post",
          data: obj,
        });

        if (error.value) throw error.value;

        if (data.value) {
          this.dataUser.Email = data.value.Status == "Success" ? obj.Email : ""; // assign email that edit

          toast.add({
            color: "green",
            title: `Success update Email`,
          });
          return data.value;
        }
      } catch (e) {
        toast.add({
          color: "red",
          title: profileError(e),
        });
      }
    },

    // Update Password
    async updatedPassword(obj) {
  const toast = useToast();
      try {
        const { data, error } = await useHttp(api.userChangePassword, {
          method: "post",
          data: obj,
        });

        if (error.value) throw error.value;

        if (data.value) {
          toast.add({
            color: "green",
            title: `Success update Password`,
          });
          return data.value;
        }
      } catch (e) {
        toast.add({
          color: "red",
          title: profileError(e),
        });
      }
    },

    async getSignature() {
    const toast = useToast();
      try {
        const _dataSignature = await useHttp(api.profile.signature.list);

        if (_dataSignature.error.value) throw _dataSignature.error.value;

        this.dataUser.Signature = isNotEmpty(_dataSignature.data.value)
          ? { ..._dataSignature.data.value[0] }
          : {};
      } catch (error) {
        toast.add({
          color: "red",
          title: profileError(error),
        });
      }
    },

    // Upload a signature image and register it for the employee
    async addSignature(file) {
  const toast = useToast();
      try {
        const formData = new FormData();
        formData.append("file", file, file?.name || "signature.png");
        if (this.dataUser?.ReferenceId)
          formData.append("EmployeeId", String(this.dataUser.ReferenceId));

        const { data, error } = await useHttp(api.profile.signature.upload, {
          method: "post",
          body: formData,
        });

        if (error.value) throw error.value;

        if (data.value) {
          this.dataUser.Signature = { ...data.value };
          toast.add({
            color: "green",
            title: "Success add signature",
          });
          return data.value;
        }
      } catch (e) {
        toast.add({
          color: "red",
          title: profileError(e),
        });
      }
    },

    async deleteSignature(fn) {
  const toast = useToast();
      try {
        const { data, error } = await useHttp(
          `${api.profile.signature.delete}?EmployeeId=${this.dataUser?.ReferenceId}`
        );

        if (error.value) throw error.value;

        if (data.value) {
          this.dataUser.Signature = {};

          if (fn) fn();
        }
      } catch (error) {
        toast.add({
          color: "red",
          title: profileError(error),
        });
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserProfileStore, import.meta.hot));
}
