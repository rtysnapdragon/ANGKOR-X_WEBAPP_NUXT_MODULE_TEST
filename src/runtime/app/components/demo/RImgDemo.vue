<script setup>
// import { UseDefaultImageStore } from "~/stores/defaultImage"

useHead({ title: "RImg demo" })

const store = UseDefaultImageStore()

/* ---------- helpers ---------- */

const api = (params = {}) =>
  `/api/demo/image?${new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)]),
  )}`
const ok = (label, hue = 24, extra = {}) => api({ label, hue, w: 640, h: 480, ...extra })

const BROKEN = api({ status: 404 })

// Case 5: global runtime fallback key
store.registerFallback("brand", api({ label: "Brand", hue: 280, w: 320, h: 320 }))

const toggleDark = () => document.documentElement.classList.toggle("dark")

/* ---------- static data ---------- */

const fitModes = ["cover", "contain", "fill", "scale-down", "none"]
const radii = ["none", "sm", "md", "lg", "xl", "2xl", "full"]
const ratios = ["16/9", "4/3", "1/1", "3/4"]
const fallbackTypes = ["img", "banner", "product", "trBg", "user", "female", "male"]
const people = ["Sophea Chan", "សុភា ចាន់", "Dara Kim", "Vanna"]
const avatarSizes = [24, 32, 48, 72, 96]

const files = [
  { cap: "report.pdf", props: { src: "/files/report.pdf" } },
  { cap: "contract.docx", props: { src: "/files/contract.docx" } },
  { cap: "budget.xlsx", props: { src: "/files/budget.xlsx" } },
  { cap: "deck.pptx", props: { src: "/files/deck.pptx" } },
  { cap: "archive.zip", props: { src: "/files/archive.zip" } },
  { cap: "clip.mp4", props: { src: "/files/clip.mp4" } },
  { cap: "song.mp3", props: { src: "/files/song.mp3" } },
  { cap: "data.json", props: { src: "/files/data.json" } },
  { cap: "notes.txt", props: { src: "/files/notes.txt" } },
  { cap: "photo.jpg (404 → fallback)", props: { src: "/files/photo.jpg" } },
  { cap: "fileName hint", props: { src: "/download?token=abc123", fileName: "invoice.pdf" } },
  {
    cap: "mime hint",
    props: {
      src: "/download/42",
      mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  },
  { cap: "data: URI mime", props: { src: "data:application/pdf;base64,JVBERi0=" } },
]

/* ---------- case 5: custom fallbacks ---------- */

const customFallback = api({ label: "Custom", hue: 200, w: 320, h: 320 })

/* ---------- case 8: skeleton ---------- */

const slowKey = ref(0)
const slowSrc = computed(() =>
  api({ label: "slow 2.5s", hue: 200, delay: 2500, k: slowKey.value }),
)

/* ---------- case 9: retry ---------- */

const flaky = reactive({ failures: 2, retry: 3, key: "" })
const flakySrc = computed(() =>
  flaky.key
    ? api({ label: `fails ${flaky.failures}x`, hue: 140, delay: 300, failures: flaky.failures, key: flaky.key })
    : undefined,
)
const runFlaky = () => {
  flaky.key = `flaky-${Date.now()}`
}

/* ---------- case 10/11: lazy + srcset ---------- */

const lazyItems = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  src: ok(`#${i + 1}`, (i * 30) % 360, { delay: 400, w: 400, h: 400 }),
}))

const responsiveSet = [320, 640, 1280]
  .map((w) => `${api({ label: `${w}w`, hue: 330, w, h: Math.round((w * 3) / 4) })} ${w}w`)
  .join(", ")

/* ---------- case 13: events + exposed API ---------- */

const log = ref([])
const push = (name, detail = "") => {
  log.value = [`${new Date().toLocaleTimeString()}  ${name}  ${detail}`, ...log.value].slice(0, 20)
}
const events = {
  onLoad: () => push("load"),
  onError: () => push("error"),
  onFallback: (p) => push("fallback", `${p.reason} → ${p.stage}`),
  onRetry: (n) => push("retry", `#${n}`),
}

const inspectRef = ref(null)
const inspectMode = ref("ok")
const inspectSrc = computed(
  () =>
    ({
      ok: ok("inspect", 90, { delay: 800 }),
      fail: BROKEN,
      empty: null,
      file: "/files/report.pdf",
    })[inspectMode.value],
)

/* ---------- case 14: playground ---------- */

const pg = reactive({
  src: ok("Playground", 24),
  type: "img",
  name: "",
  fileName: "",
  mime: "",
  fit: "cover",
  rounded: "md",
  skeleton: true,
  retry: 0,
})
const presets = {
  Valid: () => ok("Valid", 24),
  "404": () => BROKEN,
  Empty: () => "",
  PDF: () => "/files/report.pdf",
  "Slow 2.5s": () => api({ label: "slow", hue: 200, delay: 2500, k: Date.now() }),
}

/* ---------- case 16: compositions ---------- */

const profiles = [
  { name: "Sophea Chan", role: "Photographer", banner: ok("Banner", 24, { w: 900, h: 300 }), avatar: ok("SC", 200, { w: 200, h: 200 }) },
  { name: "សុភា ចាន់", role: "Broken URLs → initials", banner: BROKEN, avatar: BROKEN },
  { name: "Dara Kim", role: "No images at all", banner: null, avatar: null },
]

const products = [
  { title: "Lotus Print", price: "$24", img: ok("Lotus", 20, { w: 400, h: 400 }) },
  { title: "Broken URL", price: "$18", img: BROKEN },
  { title: "No image", price: "$30", img: null },
  { title: "Slow image", price: "$12", img: api({ label: "Slow", hue: 160, w: 400, h: 400, delay: 2000 }) },
]

const attachments = [
  { name: "report.pdf", src: "/files/report.pdf" },
  { name: "budget.xlsx", src: "/files/budget.xlsx" },
  { name: "deck.pptx", src: "/files/deck.pptx" },
  { name: "photo.svg", src: ok("Photo", 300, { w: 200, h: 200 }) },
  { name: "archive.zip", src: "/files/archive.zip" },
]

const gallery = [
  { ratio: "1/1", src: ok("1:1", 10, { w: 400, h: 400 }) },
  { ratio: "4/3", src: ok("4:3", 60, { w: 400, h: 300 }) },
  { ratio: "3/4", src: ok("3:4", 120, { w: 300, h: 400 }) },
  { ratio: "16/9", src: ok("16:9", 180, { w: 640, h: 360 }) },
  { ratio: "1/1", src: BROKEN },
  { ratio: "4/3", src: ok("4:3", 240, { w: 400, h: 300 }) },
]
</script>

<template>
  <main class="demo">
    <header class="demo__head">
      <div>
        <h1>RImg</h1>
        <p class="hint">
          All use cases. Network cases run against <code>/api/demo/image</code> (dev only).
        </p>
      </div>
      <button class="btn" @click="toggleDark">Toggle dark</button>
    </header>

    <!-- 1 -->
    <section class="demo-section">
      <h2>1 · Fit modes</h2>
      <p class="hint">4:3 source inside a 140×140 box.</p>
      <div class="row">
        <div v-for="f in fitModes" :key="f" class="cell">
          <RImg :src="ok('4:3 source')" :width="140" :height="140" :fit="f" rounded="md" />
          <code class="cap">fit="{{ f }}"</code>
        </div>
      </div>
    </section>

    <!-- 2 -->
    <section class="demo-section">
      <h2>2 · Rounded &amp; aspect ratio</h2>
      <div class="row">
        <div v-for="r in radii" :key="r" class="cell">
          <RImg :src="ok(r, 40)" :width="88" ratio="1/1" :rounded="r" />
          <code class="cap">{{ r }}</code>
        </div>
      </div>
      <div class="row">
        <div v-for="r in ratios" :key="r" class="cell">
          <RImg :src="ok(r, 300)" :width="150" :ratio="r" rounded="md" />
          <code class="cap">ratio="{{ r }}"</code>
        </div>
      </div>
    </section>

    <!-- 3 -->
    <section class="demo-section">
      <h2>3 · Fallback by type (broken src)</h2>
      <div class="row">
        <div v-for="t in fallbackTypes" :key="t" class="cell">
          <RImg :src="BROKEN" :type="t" :width="120" :height="120" rounded="md" class="demo-checker" />
          <code class="cap">type="{{ t }}"</code>
        </div>
      </div>
    </section>

    <!-- 4 -->
    <section class="demo-section">
      <h2>4 · Empty source</h2>
      <p class="hint">Goes straight to fallback, no request is made.</p>
      <div class="row">
        <div class="cell"><RImg :src="undefined" :width="100" :height="100" rounded="md" /><code class="cap">undefined</code></div>
        <div class="cell"><RImg :src="null" :width="100" :height="100" rounded="md" /><code class="cap">null</code></div>
        <div class="cell"><RImg :src="''" :width="100" :height="100" rounded="md" /><code class="cap">""</code></div>
        <div class="cell"><RImg src="   " :width="100" :height="100" rounded="md" /><code class="cap">whitespace</code></div>
      </div>
    </section>

    <!-- 5 -->
    <section class="demo-section">
      <h2>5 · Custom fallbacks</h2>
      <div class="row">
        <div class="cell">
          <RImg :src="BROKEN" :fallback-src="customFallback" :width="120" :height="120" rounded="md" />
          <code class="cap">fallback-src (per instance)</code>
        </div>
        <div class="cell">
          <RImg :src="null" type="brand" :width="120" :height="120" rounded="md" />
          <code class="cap">registerFallback("brand")</code>
        </div>
        <div class="cell">
          <RImg :src="BROKEN" type="brand" :fallback-src="customFallback" :width="120" :height="120" rounded="md" />
          <code class="cap">prop beats store</code>
        </div>
      </div>
    </section>

    <!-- 6 -->
    <section class="demo-section">
      <h2>6 · Avatars</h2>
      <p class="hint">Initials are grapheme-aware, so Khmer clusters stay intact.</p>
      <div class="row">
        <div v-for="p in people" :key="p" class="cell">
          <RImg :src="null" :name="p" type="avatar" :width="64" :height="64" rounded="full" />
          <code class="cap">{{ p }}</code>
        </div>
        <div class="cell">
          <RImg :src="BROKEN" name="Sophea Chan" type="avatar" :width="64" :height="64" rounded="full" />
          <code class="cap">broken + name</code>
        </div>
        <div class="cell">
          <RImg :src="null" type="female" :width="64" :height="64" rounded="full" />
          <code class="cap">female (no name)</code>
        </div>
        <div class="cell">
          <RImg :src="null" type="male" :width="64" :height="64" rounded="full" />
          <code class="cap">male (no name)</code>
        </div>
      </div>
      <div class="row row--end">
        <RImg v-for="s in avatarSizes" :key="s" :src="null" name="Sophea Chan" type="avatar" :width="s" :height="s" rounded="full" />
      </div>
    </section>

    <!-- 7 -->
    <section class="demo-section">
      <h2>7 · File types</h2>
      <p class="hint">
        Detection order: <code>mime</code> → <code>fileName</code> → URL extension. Non-image kinds skip the <code>&lt;img&gt;</code> request.
      </p>
      <div class="row">
        <div v-for="f in files" :key="f.cap" class="cell">
          <RImg v-bind="f.props" :width="96" :height="96" rounded="md" />
          <code class="cap">{{ f.cap }}</code>
        </div>
      </div>
      <div class="row">
        <div class="cell">
          <RImg src="/files/report.pdf" :width="96" :height="96" rounded="md" :show-label="false" />
          <code class="cap">:show-label="false"</code>
        </div>
        <div class="cell">
          <RImg src="/files/report.pdf" :width="40" :height="40" rounded="sm" />
          <code class="cap">40px (label auto-hides)</code>
        </div>
      </div>
    </section>

    <!-- 8 -->
    <section class="demo-section">
      <h2>8 · Loading state</h2>
      <div class="row">
        <div class="cell">
          <RImg :src="slowSrc" :width="180" :height="135" rounded="md" />
          <code class="cap">skeleton (default)</code>
        </div>
        <div class="cell">
          <RImg :src="slowSrc" :width="180" :height="135" rounded="md" :skeleton="false" />
          <code class="cap">:skeleton="false"</code>
        </div>
      </div>
      <button class="btn" @click="slowKey++">Reload (2.5s delay)</button>
    </section>

    <!-- 9 -->
    <section class="demo-section">
      <h2>9 · Retry</h2>
      <p class="hint">
        Server fails <code>failures</code> times, then succeeds. If <code>retry &lt; failures</code> the fallback wins.
      </p>
      <div class="controls">
        <label>failures <input v-model.number="flaky.failures" type="number" min="0" max="6" /></label>
        <label>retry <input v-model.number="flaky.retry" type="number" min="0" max="6" /></label>
        <button class="btn" @click="runFlaky">Run</button>
      </div>
      <div class="row">
        <RImg
          v-if="flaky.key"
          :src="flakySrc"
          :retry="flaky.retry"
          :retry-delay="700"
          :width="200"
          :height="150"
          rounded="md"
          v-bind="events"
        />
        <span v-else class="hint">Press Run.</span>
        <pre class="log">{{ log.join("\n") || "No events yet" }}</pre>
      </div>
    </section>

    <!-- 10 -->
    <section class="demo-section">
      <h2>10 · Lazy loading</h2>
      <p class="hint">Items below the fold only request when scrolled near.</p>
      <div class="scroller">
        <div class="grid grid--sm">
          <RImg v-for="i in lazyItems" :key="i.id" :src="i.src" ratio="1/1" rounded="md" />
        </div>
      </div>
    </section>

    <!-- 11 -->
    <section class="demo-section">
      <h2>11 · Responsive srcset + priority</h2>
      <p class="hint">The label in the image shows which candidate the browser picked. Resize and reload.</p>
      <RImg
        :src="ok('fallback src')"
        :srcset="responsiveSet"
        sizes="(max-width: 600px) 100vw, 480px"
        :width="480"
        ratio="4/3"
        rounded="lg"
        priority
      />
      <code class="cap cap--wrap">{{ responsiveSet }}</code>
    </section>

    <!-- 12 -->
    <section class="demo-section">
      <h2>12 · Custom classes</h2>
      <p class="hint">
        <code>class</code> lands on the root. <code>ui</code> targets root, img, skeleton, tile and label.
      </p>
      <div class="row">
        <div class="cell">
          <RImg :src="ok('class', 330)" :width="140" :height="140" rounded="lg" class="demo-ring" />
          <code class="cap">class="demo-ring"</code>
        </div>
        <div class="cell">
          <RImg :src="ok('ui.img', 150)" :width="140" :height="140" rounded="lg" :ui="{ root: 'demo-glow', img: 'demo-gray' }" />
          <code class="cap">ui.img grayscale, hover</code>
        </div>
        <div class="cell">
          <RImg src="/files/report.pdf" :width="140" :height="140" rounded="lg" :ui="{ tile: 'demo-tile', label: 'demo-label' }" />
          <code class="cap">ui.tile / ui.label</code>
        </div>
      </div>
    </section>

    <!-- 13 -->
    <section class="demo-section">
      <h2>13 · Events &amp; exposed API</h2>
      <div class="row">
        <RImg
          ref="inspectRef"
          :src="inspectSrc"
          :retry="1"
          :retry-delay="600"
          :width="200"
          :height="150"
          rounded="md"
          v-bind="events"
        />
        <div class="stack">
          <p>
            status <code>{{ inspectRef?.status }}</code> · stage <code>{{ inspectRef?.stage }}</code>
          </p>
          <div class="controls">
            <button class="btn" @click="inspectMode = 'ok'">valid</button>
            <button class="btn" @click="inspectMode = 'fail'">fail</button>
            <button class="btn" @click="inspectMode = 'empty'">empty</button>
            <button class="btn" @click="inspectMode = 'file'">file</button>
            <button class="btn" @click="inspectRef?.reload()">reload()</button>
          </div>
          <pre class="log">{{ log.join("\n") || "No events yet" }}</pre>
        </div>
      </div>
    </section>

    <!-- 14 -->
    <section class="demo-section">
      <h2>14 · Playground</h2>
      <p class="hint">Changing <code>src</code> resets the state machine.</p>
      <div class="pg">
        <div class="pg__controls">
          <label>src <input v-model="pg.src" type="text" /></label>
          <label>type
            <select v-model="pg.type">
              <option v-for="t in [...fallbackTypes, 'brand']" :key="t" :value="t">{{ t }}</option>
            </select>
          </label>
          <label>name <input v-model="pg.name" type="text" /></label>
          <label>fileName <input v-model="pg.fileName" type="text" /></label>
          <label>mime <input v-model="pg.mime" type="text" /></label>
          <label>fit
            <select v-model="pg.fit">
              <option v-for="f in fitModes" :key="f" :value="f">{{ f }}</option>
            </select>
          </label>
          <label>rounded
            <select v-model="pg.rounded">
              <option v-for="r in radii" :key="r" :value="r">{{ r }}</option>
            </select>
          </label>
          <label>retry <input v-model.number="pg.retry" type="number" min="0" max="5" /></label>
          <label class="check"><input v-model="pg.skeleton" type="checkbox" /> skeleton</label>
          <div class="controls">
            <button v-for="(fn, label) in presets" :key="label" class="btn" @click="pg.src = fn()">{{ label }}</button>
          </div>
        </div>
        <RImg
          :src="pg.src"
          :type="pg.type"
          :name="pg.name || undefined"
          :file-name="pg.fileName || undefined"
          :mime="pg.mime || undefined"
          :fit="pg.fit"
          :rounded="pg.rounded"
          :skeleton="pg.skeleton"
          :retry="pg.retry"
          :width="240"
          :height="180"
        />
      </div>
    </section>

    <!-- 15 -->
    <section class="demo-section">
      <h2>15 · Legacy store handler vs RImg</h2>
      <div class="row">
        <div class="cell">
          <img class="legacy" :src="BROKEN" alt="" @error="store.get($event, 'banner')" />
          <code class="cap">&lt;img @error="store.get($event, 'banner')"&gt;</code>
        </div>
        <div class="cell">
          <RImg :src="BROKEN" type="banner" :width="160" :height="120" rounded="md" />
          <code class="cap">&lt;RImg type="banner"&gt;</code>
        </div>
      </div>
    </section>

    <!-- 16 -->
    <section class="demo-section">
      <h2>16 · Compositions</h2>

      <h3>Profile cards</h3>
      <div class="grid">
        <RCard v-for="u in profiles" :key="u.name" class="profile">
          <RImg :src="u.banner" type="banner" ratio="3/1" rounded="lg" />
          <div class="profile__row">
            <RImg :src="u.avatar" :name="u.name" type="avatar" :width="64" :height="64" rounded="full" />
            <div class="stack">
              <strong>{{ u.name }}</strong>
              <span class="hint">{{ u.role }}</span>
            </div>
          </div>
        </RCard>
      </div>

      <h3>Product grid</h3>
      <div class="grid grid--sm">
        <RCard v-for="p in products" :key="p.title" class="product">
          <RImg :src="p.img" type="product" ratio="1/1" rounded="md" />
          <div class="product__meta">
            <strong>{{ p.title }}</strong>
            <span class="hint">{{ p.price }}</span>
          </div>
        </RCard>
      </div>

      <h3>Attachments</h3>
      <RCard class="attachments">
        <div v-for="a in attachments" :key="a.name" class="attachments__row">
          <RImg :src="a.src" :file-name="a.name" :width="40" :height="40" rounded="sm" />
          <span>{{ a.name }}</span>
        </div>
      </RCard>

      <h3>Gallery</h3>
      <div class="gallery">
        <RImg v-for="(g, i) in gallery" :key="i" :src="g.src" :ratio="g.ratio" rounded="md" />
      </div>
    </section>
  </main>
</template>

<style lang="scss" scoped>
.demo {
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--sp-6);
  color: var(--c-text);
  font-family: "Inter", "Battambang", "NotoSansKhmer", system-ui, sans-serif;

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--sp-4);
    margin-bottom: var(--sp-6);

    h1 {
      margin: 0 0 var(--sp-1);
    }
  }
}

.demo-section {
  padding: var(--sp-6) 0;
  border-top: 1px solid var(--c-border);

  h2 {
    margin: 0 0 var(--sp-2);
    font-size: 18px;
  }

  h3 {
    margin: var(--sp-6) 0 var(--sp-3);
    font-size: 14px;
    color: var(--c-muted);
  }
}

.hint {
  margin: 0 0 var(--sp-3);
  font-size: 13px;
  color: var(--c-muted);
}

code {
  padding: 1px var(--sp-1);
  font-size: 12px;
  background: var(--bg-tertiary);
  border-radius: var(--r-sm);
}

.cap {
  display: block;
  margin-top: var(--sp-2);

  &--wrap {
    max-width: 100%;
    overflow-wrap: anywhere;
  }
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: var(--sp-4);
  margin-bottom: var(--sp-4);

  &--end {
    align-items: flex-end;
  }
}

.cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--sp-4);

  &--sm {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
}

.gallery {
  columns: 3 160px;
  column-gap: var(--sp-3);

  > * {
    margin-bottom: var(--sp-3);
    break-inside: avoid;
  }
}

.scroller {
  max-height: 240px;
  padding: var(--sp-3);
  overflow: auto;
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
}

.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-2);
  margin-bottom: var(--sp-3);

  label {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    font-size: 13px;
  }
}

.btn {
  padding: var(--sp-1) var(--sp-3);
  font: inherit;
  font-size: 13px;
  color: var(--c-text);
  background: var(--bg-secondary);
  border: 1px solid var(--c-border);
  border-radius: var(--r-sm);
  cursor: pointer;
  transition: border-color var(--t-fast) var(--ease-out);

  &:hover {
    border-color: var(--c-accent);
  }
}

input[type="text"],
input[type="number"],
select {
  padding: var(--sp-1) var(--sp-2);
  font: inherit;
  font-size: 13px;
  color: var(--c-text);
  background: var(--bg-secondary);
  border: 1px solid var(--c-border);
  border-radius: var(--r-sm);
}

.log {
  min-width: 260px;
  max-height: 160px;
  margin: 0;
  padding: var(--sp-2) var(--sp-3);
  overflow: auto;
  font-size: 12px;
  color: var(--c-muted);
  background: var(--bg-tertiary);
  border-radius: var(--r-md);
}

.pg {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-6);

  &__controls {
    display: grid;
    flex: 1 1 320px;
    gap: var(--sp-2);

    label {
      display: grid;
      grid-template-columns: 80px 1fr;
      align-items: center;
      font-size: 13px;
    }

    .check {
      grid-template-columns: auto 1fr;
      gap: var(--sp-2);
    }
  }
}

.legacy {
  display: block;
  width: 160px;
  height: 120px;
  object-fit: cover;
  border-radius: var(--r-md);
}

.profile {
  &__row {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    margin-top: var(--sp-3);
  }
}

.product {
  &__meta {
    display: flex;
    justify-content: space-between;
    margin-top: var(--sp-2);
    font-size: 13px;
  }
}

.attachments {
  &__row {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    padding: var(--sp-2) 0;

    & + & {
      border-top: 1px solid var(--c-border);
    }
  }
}

/* case 3: make the transparent fallback visible */
.demo-checker {
  background: var(--bg-tertiary);
}

/* case 12 */
.demo-ring {
  outline: 2px solid var(--c-accent);
  outline-offset: 3px;
}

.demo-glow {
  box-shadow: var(--glow-accent-sm);

  &:hover :deep(.demo-gray) {
    filter: none;
  }
}

:deep(.demo-gray) {
  filter: grayscale(1);
  transition: filter var(--t-base) var(--ease-out);
}

:deep(.demo-tile) {
  border-style: dashed;
  border-color: var(--c-accent);
}

:deep(.demo-label) {
  font-size: 14px;
  color: var(--c-accent);
}
</style>