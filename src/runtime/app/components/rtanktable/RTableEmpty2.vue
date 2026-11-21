<template>
  <div class="rt-empty-state" role="status">
    <svg viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <ellipse class="shadow" cx="60" cy="112" rx="34" ry="5" />
      <g class="db">
        <path class="body" d="M26 30v60c0 6.6 15.2 12 34 12s34-5.4 34-12V30" />
        <path class="ring" d="M26 50c0 6.6 15.2 12 34 12s34-5.4 34-12" />
        <path class="ring" d="M26 70c0 6.6 15.2 12 34 12s34-5.4 34-12" />
        <ellipse class="top" cx="60" cy="30" rx="34" ry="12" />
      </g>
      <g class="badge-wrap">
        <circle class="badge" cx="94" cy="92" r="14" />
        <template v-if="searching">
          <circle class="badge-icon" cx="92" cy="90" r="4.5" />
          <path class="badge-icon" d="M95.5 93.5l4.5 4.5" />
        </template>
        <path v-else class="badge-icon" d="M88 92h12" />
      </g>
    </svg>
    <p class="title">{{ title }}</p>
    <p class="desc">{{ desc }}</p>
  </div>
</template>

<script setup>
const props = defineProps({
  searching: { type: String, default: "" }, // committed search text
  selected: Boolean,                        // "show selected" mode
});

const title = computed(() => {
  if (props.searching) return tBy({
    km: `រកមិនឃើញលទ្ធផលសម្រាប់ "${props.searching}"`,
    en: `No results for "${props.searching}"`,
    zh: `未找到 "${props.searching}" 的结果`,
  });
  if (props.selected) return tBy({
    km: "មិនមានជួរដេកដែលបានជ្រើសរើស",
    en: "No selected rows",
    zh: "没有已选行",
  });
  return tBy({ km: "រកមិនឃើញទិន្នន័យ", en: "No data found", zh: "暂无数据" });
});

const desc = computed(() => {
  if (props.searching) return tBy({
    km: "សូមសាកល្បងពាក្យគន្លឹះផ្សេង ឬសម្អាតការស្វែងរក។",
    en: "Try a different keyword or clear the search.",
    zh: "请尝试其他关键词或清除搜索。",
  });
  if (props.selected) return tBy({
    km: "ជ្រើសរើសជួរដេក ដើម្បីមើលវានៅទីនេះ។",
    en: "Select some rows to see them here.",
    zh: "选择一些行后会显示在这里。",
  });
  return tBy({
    km: "មិនទាន់មានអ្វីត្រូវបង្ហាញនៅទីនេះទេ។",
    en: "There is nothing to show here yet.",
    zh: "这里还没有可显示的内容。",
  });
});
</script>

<style scoped lang="scss">
.rt-empty-state {
  --es-ink: #1f2937;
  --es-ease: cubic-bezier(0.2, 0, 0, 1);

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 32px 16px;
  text-align: center;
  color: var(--es-ink);
  cursor: default;

  svg { width: 120px; height: auto; margin-bottom: 8px; overflow: visible; }

  // everything that moves scales/translates around its own center
  .db, .badge-wrap, .shadow { transform-box: fill-box; transform-origin: center; }

  .shadow { fill: currentColor; opacity: 0.08; transition: transform .35s var(--es-ease), opacity .35s var(--es-ease); }
  .db { transition: transform .35s var(--es-ease); }
  .badge-wrap { transition: transform .35s var(--es-ease); }

  .body { fill: color-mix(in srgb, currentColor 6%, transparent); stroke: currentColor; stroke-opacity: .35; stroke-width: 2; transition: all .3s ease; }
  .ring { stroke: currentColor; stroke-opacity: .35; stroke-width: 2; transition: all .3s ease; }
  .top  { fill: color-mix(in srgb, var(--color-primary) 22%, var(--bg-wrapper)); stroke: currentColor; stroke-opacity: .45; stroke-width: 2; transition: all .3s ease; }
  .badge { fill: var(--color-primary); stroke: var(--bg-wrapper); stroke-width: 3; transition: fill .3s ease; }
  .badge-icon { fill: none; stroke: #fff; stroke-width: 2.5; stroke-linecap: round; }

  .title { margin: 0; font-size: 14px; font-weight: 600; transition: color .25s ease, transform .35s var(--es-ease); }
  .desc  { margin: 0; font-size: 12px; color: var(--color-w-b-2); transition: color .25s ease, opacity .25s ease; }

  // ── hover ──
  &:hover {
    .db { transform: translateY(-5px); }
    .shadow { transform: scaleX(.8); opacity: .04; }
    .badge-wrap { transform: scale(1.12) rotate(-6deg); }

    .body { fill: color-mix(in srgb, var(--color-primary) 10%, transparent); stroke: var(--color-primary); stroke-opacity: .7; }
    .ring { stroke: var(--color-primary); stroke-opacity: .7; }
    .top  { fill: color-mix(in srgb, var(--color-primary) 35%, var(--bg-wrapper)); stroke: var(--color-primary); stroke-opacity: .9; }

    .title { color: var(--color-primary); transform: translateY(-2px); }
    .desc  { color: var(--color-w-b-1); }
  }

  @media (prefers-reduced-motion: reduce) {
    * { transition: none !important; }
    &:hover .db, &:hover .badge-wrap, &:hover .title, &:hover .shadow { transform: none; }
  }
}

:global(.dark) .rt-empty-state { --es-ink: #e5e7eb; }
</style>