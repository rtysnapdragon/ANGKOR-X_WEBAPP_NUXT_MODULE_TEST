import { defineStore, acceptHMRUpdate } from "pinia"

import placeholderImg from "../assets/imgs/placeholder.png"
import femaleImg from "../assets/imgs/profile_female.png"
import maleImg from "../assets/imgs/profile_male.png"
import defaultBanner from "../assets/imgs/default-no-img.png"
import imageBgTransparent from "../assets/imgs/img_bg_transparent.png"

/** Keys are lowercase: lookups are normalised via `normalize()`. */
const FALLBACKS = Object.freeze({
  img: placeholderImg,
  user: femaleImg,
  avatar: femaleImg,
  female: femaleImg,
  f: femaleImg,
  male: maleImg,
  m: maleImg,
  banner: defaultBanner,
  product: placeholderImg,
  trbg: imageBgTransparent,
  transparent: imageBgTransparent,
})

const AVATAR_TYPES = new Set(["user", "avatar", "female", "f", "male", "m"])

const GENERIC_ICON = "i-lucide-file"

const FILE_KINDS = {
  image: { icon: "i-lucide-image", exts: ["jpg", "jpeg", "jfif", "png", "apng", "gif", "webp", "avif", "svg", "bmp", "ico", "heic", "heif", "tif", "tiff"] },
  pdf: { icon: "i-lucide-file-text", exts: ["pdf"] },
  doc: { icon: "i-lucide-file-text", exts: ["doc", "docx", "odt", "rtf", "pages"] },
  sheet: { icon: "i-lucide-file-spreadsheet", exts: ["xls", "xlsx", "ods", "csv", "tsv", "numbers"] },
  slide: { icon: "i-lucide-presentation", exts: ["ppt", "pptx", "odp", "key"] },
  archive: { icon: "i-lucide-file-archive", exts: ["zip", "rar", "7z", "tar", "gz", "tgz", "bz2"] },
  video: { icon: "i-lucide-file-video", exts: ["mp4", "mov", "avi", "mkv", "webm", "m4v", "wmv"] },
  audio: { icon: "i-lucide-file-audio", exts: ["mp3", "wav", "ogg", "m4a", "flac", "aac"] },
  code: { icon: "i-lucide-file-code", exts: ["js", "ts", "json", "html", "css", "scss", "vue", "py", "xml", "yml", "yaml", "sh"] },
  text: { icon: "i-lucide-file-text", exts: ["txt", "md", "log"] },
}

const EXT_TO_KIND = new Map(
  Object.entries(FILE_KINDS).flatMap(([kind, { exts }]) => exts.map((ext) => [ext, kind])),
)

const normalize = (type) => String(type || "img").toLowerCase()

function extOf(value) {
  if (typeof value !== "string" || !value) return ""
  const clean = value.split(/[?#]/)[0]
  const name = clean.slice(clean.lastIndexOf("/") + 1)
  const dot = name.lastIndexOf(".")
  if (dot < 0) return ""
  const ext = name.slice(dot + 1).toLowerCase()
  return /^[a-z0-9]{1,8}$/.test(ext) ? ext : ""
}

function kindFromMime(mime) {
  const m = String(mime || "").toLowerCase().split(";")[0].trim()
  if (!m) return ""
  if (m.startsWith("image/")) return "image"
  if (m.startsWith("video/")) return "video"
  if (m.startsWith("audio/")) return "audio"
  if (m === "application/pdf") return "pdf"
  if (m.includes("wordprocessingml") || m === "application/msword" || m.includes("opendocument.text") || m === "application/rtf") return "doc"
  if (m.includes("spreadsheetml") || m.includes("ms-excel") || m.includes("opendocument.spreadsheet") || m === "text/csv") return "sheet"
  if (m.includes("presentationml") || m.includes("ms-powerpoint") || m.includes("opendocument.presentation")) return "slide"
  if (/zip|rar|7z|tar|gzip/.test(m)) return "archive"
  if (m === "application/json" || m.includes("javascript") || m.endsWith("xml") || m === "text/html" || m === "text/css") return "code"
  if (m.startsWith("text/")) return "text"
  return ""
}

// Grapheme-aware so Khmer clusters (base + vowel/subscript) are not split.
const segmenter =
  typeof Intl !== "undefined" && Intl.Segmenter
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null

function firstGrapheme(word) {
  if (!word) return ""
  if (segmenter) return segmenter.segment(word)[Symbol.iterator]().next().value?.segment ?? ""
  return Array.from(word)[0] ?? ""
}

export const UseDefaultImageStore = defineStore("defaultImageStore", {
  state: () => ({
    /** Runtime overrides registered via registerFallback(). */
    custom: {},
  }),

  actions: {
    /** Resolve a fallback image URL for a type. Custom overrides win. */
    resolve(type = "img") {
      const key = normalize(type)
      return this.custom[key] || FALLBACKS[key] || placeholderImg
    },

    /** Register or override a fallback at runtime, e.g. registerFallback("artwork", url). */
    registerFallback(type, src) {
      if (!type || !src) return
      this.custom[normalize(type)] = src
    },

    isAvatar(type) {
      return AVATAR_TYPES.has(normalize(type))
    },

    /**
     * Classify a source by MIME, then fileName extension, then URL extension.
     * @returns {{ kind: string, ext: string, label: string, icon: string, isFile: boolean }}
     */
    getFileInfo(source, { fileName, mime } = {}) {
      const urlLike = typeof source === "string" && !/^(data|blob):/i.test(source)
      const dataMime = typeof source === "string" && source.startsWith("data:")
        ? source.slice(5).split(/[;,]/)[0]
        : ""

      const ext = extOf(fileName) || (urlLike ? extOf(source) : "")
      const kind = kindFromMime(mime) || kindFromMime(dataMime) || EXT_TO_KIND.get(ext) || "unknown"

      return {
        kind,
        ext,
        label: ext ? ext.toUpperCase() : kind === "unknown" ? "" : kind.toUpperCase(),
        icon: FILE_KINDS[kind]?.icon ?? GENERIC_ICON,
        // Anything that is neither an image nor unknown cannot render in <img>.
        isFile: kind !== "image" && kind !== "unknown",
      }
    },

    /** "នី រិទ្ធី" -> "នរ", "Ny Rithy" -> "NR". */
    getInitials(name, max = 2) {
      const words = String(name ?? "").trim().split(/\s+/).filter(Boolean)
      return words
        .slice(0, max)
        .map((w) => firstGrapheme(w).toLocaleUpperCase())
        .join("")
    },

    /** Original @error handler, kept backward compatible. */
    get(event, type = "img") {
      const target = event?.target
      if (!target || target.tagName !== "IMG") return

      // Prevent infinite fallback loops if the fallback itself fails.
      if (target.dataset.fallbackApplied === "true") return

      target.dataset.fallbackApplied = "true"
      // srcset takes precedence over src, so it must go or the fallback never shows.
      target.removeAttribute("srcset")
      target.src = this.resolve(type)
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(UseDefaultImageStore, import.meta.hot))
}