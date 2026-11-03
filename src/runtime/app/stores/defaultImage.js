
import { defineStore, acceptHMRUpdate } from "pinia"

import placeholderImg from "../assets/imgs/placeholder.png"
import femaleImg from "../assets/imgs/profile_female.png"
import maleImg from "../assets/imgs/profile_male.png"
import defaultBanner from "../assets/imgs/default-no-img.png"
import defaultProduct from "../assets/imgs/placeholder.png"
import imageBgTransparent from"../assets/imgs/img_bg_transparent.png"

export const UseDefaultImageStore = defineStore("defaultImageStore", {
  actions: {
    get(event, type = "img") {
      const target = event?.target

      if (!target || target.tagName !== "IMG") return

      const fallbackMap = {
        img: placeholderImg,
        user: femaleImg,
        avatar: femaleImg,
        female: femaleImg,
        f: femaleImg,
        male: maleImg,
        m: maleImg,
        banner: defaultBanner,
        product: defaultProduct,
        trBg:imageBgTransparent
      }

      const fallback = fallbackMap[
        String(type || "img").toLowerCase()
      ] || placeholderImg

      // Prevent infinite fallback loops if the fallback itself fails.
      if (target.dataset.fallbackApplied === "true") return

      target.dataset.fallbackApplied = "true"
      target.src = fallback
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(
    acceptHMRUpdate(UseDefaultImageStore, import.meta.hot),
  )
}
