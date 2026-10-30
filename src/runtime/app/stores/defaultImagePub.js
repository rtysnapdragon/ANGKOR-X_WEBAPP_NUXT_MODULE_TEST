
import { defineStore, acceptHMRUpdate } from "pinia"

export const UseDefaultImagePubStore = defineStore("defaultImagePubStore", {
  actions: {
    get(event, type = "img") {
      const target = event?.target

      if (!target || target.tagName !== "IMG") return

      const fallbackMap = {
        img: "/img/placeholder.png",
        user: "/img/profile_female.png",
        avatar: "/img/profile_female.png",
        female: "/img/profile_female.png",
        f: "/img/profile_female.png",
        male: "/img/profile_male.png",
        m: "/img/profile_male.png",
        banner: "/img/default-banner.png",
        product: "/img/default-product.png",
      }

      const fallback =
        fallbackMap[String(type || "img").toLowerCase()] ||
        fallbackMap.img

      // Prevent infinite error loops if the fallback image is missing.
      if (target.dataset.fallbackApplied === "true") return

      target.dataset.fallbackApplied = "true"
      target.src = fallback
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(
    acceptHMRUpdate(UseDefaultImagePubStore, import.meta.hot),
  )
}



// import { defineStore, acceptHMRUpdate } from "pinia"

// export const UseDefaultImageStore = defineStore("defaultImageStore", {
//   actions: {
//     get(event, type = "img") {
//       const target = event?.target

//       if (!target || target.tagName !== "IMG") return

//       const fallbackMap = {
//         img: "/_rty_cms/imgs/placeholder.png",
//         user: "/_rty_cms/imgs/profile_female.png",
//         avatar: "/_rty_cms/imgs/profile_female.png",
//         female: "/_rty_cms/imgs/profile_female.png",
//         f: "/_rty_cms/imgs/profile_female.png",
//         male: "/_rty_cms/imgs/profile_male.png",
//         m: "/_rty_cms/imgs/profile_male.png",
//         banner: "/_rty_cms/imgs/default-banner.png",
//         product: "/_rty_cms/imgs/default-product.png",
//       }

//       if (target.dataset.fallbackApplied === "true") return

//       target.dataset.fallbackApplied = "true"
//       target.src =
//         fallbackMap[String(type || "img").toLowerCase()] ||
//         fallbackMap.img
//     },
//   },
// })

// if (import.meta.hot) {
//   import.meta.hot.accept(
//     acceptHMRUpdate(UseDefaultImageStore, import.meta.hot),
//   )
// }
