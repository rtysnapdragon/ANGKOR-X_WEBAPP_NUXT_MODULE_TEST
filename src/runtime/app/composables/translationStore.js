// stores/translationStore.js
// GET  /api/v1/translations?lang=km  → { key: value }  (called on language switch)
// GET  /api/v1/translations/all       → full list for admin table
// POST /api/v1/translations           → upsert single
// POST /api/v1/translations/ai-translate → AI translate + persist
// DELETE /api/v1/translations/{id}
// DELETE /api/v1/translations/key/{key}
import { defineStore, acceptHMRUpdate } from 'pinia'

export const useTranslationStore = defineStore('translation', {
  state: () => ({
    // key→value map for the current active language (used by $tr() helper)
    map: {},
    currentLang: 'en',
    loading: false,

    // admin table — all entries
    all: [],
    allLoading: false,
  }),

  getters: {
    // Get translated value by key, fallback to key itself
    tr: (state) => (key) => state.map[key] ?? key,

    // Group all entries by key for the admin table
    grouped: (state) => {
      const groups = {}
      for (const entry of state.all) {
        if (!groups[entry.translationKey]) {
          groups[entry.translationKey] = {
            key: entry.translationKey,
            feature: entry.feature,
            referenceId: entry.referenceId,
            field: entry.field,
            langs: {},
            ids: {},
          }
        }
        groups[entry.translationKey].langs[entry.languageCode] = entry.value
        groups[entry.translationKey].ids[entry.languageCode] = entry.id
      }
      return Object.values(groups)
    },
  },

  actions: {
    // localStorage cache helpers
    _cacheKey: (lang) => `tr_map_${lang}`,
    _writeCache(lang, map) {
      if (!process.client) return
      try {
        localStorage.setItem(this._cacheKey(lang), JSON.stringify({ map, ts: Date.now() }))
      } catch {}
    },
    _readCache(lang) {
      if (!process.client) return null
      try {
        const raw = localStorage.getItem(this._cacheKey(lang))
        return raw ? JSON.parse(raw) : null
      } catch { return null }
    },

    // Fetch from API and update store + cache
    async _fetchFromApi(langCode) {
      const { data, error, status } = await useHttp(`/api/v1/translations?lang=${langCode}`, {
        method: 'GET', isGlobal: true,
      })
      if (!error?.value && status !== 401) {
        const map = { ...(data.value?.data ?? data.value ?? {}) }
        if (Object.keys(map).length > 0) {
          this.map = map
          this.currentLang = langCode
          this._writeCache(langCode, map)
        }
      }
    },

    // Load translation map for a language.
    // Strategy: serve from localStorage cache instantly, refresh in background when stale.
    // TTL: 1 hour fresh, background refresh after 5 minutes.
    async loadLanguage(langCode) {
      if (!langCode) return

      // Already in memory and matches — nothing to do
      if (this.currentLang === langCode && Object.keys(this.map).length > 0) return

      const FRESH_TTL = 60 * 60 * 1000       // 1 hour — serve cache, skip API
      const STALE_TTL = 5 * 60 * 1000        // 5 min — serve cache, refresh in background

      const cached = this._readCache(langCode)
      if (cached?.map && Object.keys(cached.map).length > 0) {
        const age = Date.now() - (cached.ts ?? 0)

        // Serve from cache immediately — no loading state, no API wait
        this.map = { ...cached.map }
        this.currentLang = langCode

        if (age < FRESH_TTL) {
          // Fresh enough — skip API entirely
          if (age > STALE_TTL) {
            // Getting old — refresh quietly in background (no await)
            this._fetchFromApi(langCode)
          }
          return
        }
        // Cache too old — still showed it instantly, now force-refresh
        this._fetchFromApi(langCode)
        return
      }

      // No cache — must wait for API (first load for this language)
      this.loading = true
      try {
        await this._fetchFromApi(langCode)
      } finally {
        this.loading = false
      }
    },

    // Call this after saving translations in admin to bust the cache for that language
    invalidateCache(lang) {
      if (!process.client) return
      try { localStorage.removeItem(this._cacheKey(lang)) } catch {}
    },

    // Admin — load full list
    async fetchAll() {
      this.allLoading = true
      try {
        const { data, error, status } = await useHttp('/api/v1/translations/all', {
          method: 'GET', isGlobal: true,
        })
        if (!error?.value && status !== 401) {
          this.all = data.value?.data ?? data.value ?? []
        }
      } finally {
        this.allLoading = false
      }
    },

    // Upsert single entry
    async upsert(translationKey, languageCode, value, meta = {}) {
      const { data, error, status } = await useHttp('/api/v1/translations', {
        method: 'POST',
        body: { translationKey, languageCode, value, ...meta },
        isGlobal: true,
      })
      if (error?.value) {
        if (handleAuthError(status)) return
        return { success: false }
      }
      const entry = data.value?.data ?? data.value
      // update local all list
      const idx = this.all.findIndex(
        (e) => e.translationKey === translationKey && e.languageCode === languageCode
      )
      if (idx !== -1) this.all[idx] = entry
      else this.all.push(entry)
      // update map if same lang and bust localStorage cache so next reload sees fresh data
      if (languageCode === this.currentLang) this.map[translationKey] = value
      this.invalidateCache(languageCode)
      return { success: true }
    },

    // AI translate + persist.
    // input   — { fieldName: "text" }  (simple keys, no dots — AI sees these)
    // meta    — { keyPrefix, feature, referenceId }
    //   keyPrefix: stored TMS key = keyPrefix + "." + fieldName  (e.g. "task.abc.title")
    //   If no keyPrefix, TMS key = fieldName directly
    async aiTranslate(input, languages, meta = {}) {
      const { data, error, status } = await useHttp('/api/v1/translations/ai-translate', {
        method: 'POST',
        body: { input, languages, ...meta },
        isGlobal: true,
      })
      if (error?.value) {
          if (handleAuthError(status)) return
          return
        }
      const result = data.value?.data ?? data.value
      // refresh local map for current lang
      if (result) {
        for (const [key, langMap] of Object.entries(result)) {
          if (langMap[this.currentLang]) this.map[key] = langMap[this.currentLang]
        }
        await this.fetchAll()
      }
      return result
    },

    // Import seed entries — skips key+lang pairs that already exist.
    // Returns { seeded, skipped } counts.
    // Seed format: [{ translationKey, languageCode, value }]
    // Batch endpoint expects: { translations: { "key": { "en": "val", "km": "val" } } }
    async importSeed(entries) {
      // Build a Set of existing "key::lang" combos from local cache
      const existing = new Set(this.all.map((e) => `${e.translationKey}::${e.languageCode}`))
      const toPost = entries.filter((e) => !existing.has(`${e.translationKey}::${e.languageCode}`))
      const skipped = entries.length - toPost.length
      if (!toPost.length) return { seeded: 0, skipped }

      // Convert flat array → { key: { lang: value } } map required by batch endpoint
      const toMap = (arr) => {
        const map = {}
        for (const { translationKey, languageCode, value } of arr) {
          if (!map[translationKey]) map[translationKey] = {}
          map[translationKey][languageCode] = value
        }
        return map
      }

      // Post in chunks of 100 entries (each entry = one key+lang pair)
      const CHUNK = 100
      let seeded = 0
      for (let i = 0; i < toPost.length; i += CHUNK) {
        const chunk = toPost.slice(i, i + CHUNK)
        const { error } = await useHttp('/api/v1/translations/batch', {
          method: 'POST',
          body: { translations: toMap(chunk) },
          isGlobal: true,
        })
        if (!error?.value) seeded += chunk.length
      }
      if (seeded) await this.fetchAll()
      return { seeded, skipped }
    },

    // Delete single row
    async deleteEntry(id) {
      const { error, status } = await useHttp(`/api/v1/translations/${id}`, {
        method: 'DELETE', isGlobal: true,
      })
      if (!error?.value && status !== 401) {
        const idx = this.all.findIndex((e) => e.id === id)
        if (idx !== -1) this.all.splice(idx, 1)
      }
      return !error?.value && status !== 401
    },

    // Delete all rows for a key
    async deleteByKey(key) {
      const { error, status } = await useHttp(`/api/v1/translations/key/${encodeURIComponent(key)}`, {
        method: 'DELETE', isGlobal: true,
      })
      if (!error?.value && status !== 401) {
        const toRemove = this.all.reduce((acc, e, i) => { if (e.translationKey === key) acc.unshift(i); return acc }, [])
        toRemove.forEach((i) => this.all.splice(i, 1))
        delete this.map[key]
      }
      return !error?.value && status !== 401
    },
  },
})


// make sure to pass the right store definition, `useAuth` in this case.
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTranslationStore, import.meta.hot))
}