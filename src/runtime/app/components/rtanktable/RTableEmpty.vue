<template>
  <div class="rt-empty-state" role="status">
    <!-- <svg viewBox="0 0 160 120" fill="none" aria-hidden="true"> // Menu list content
      <ellipse class="shadow" cx="80" cy="110" rx="50" ry="6" />
      <rect class="card-back" x="32" y="20" width="100" height="76" rx="12" />
      <rect class="card" x="22" y="30" width="116" height="76" rx="12" />
      <rect class="accent" x="34" y="43" width="26" height="8" rx="4" />
      <rect class="line" x="34" y="61" width="92" height="6" rx="3" />
      <rect class="line" x="34" y="75" width="70" height="6" rx="3" />
      <rect class="line" x="34" y="89" width="48" height="6" rx="3" />
      <circle class="badge" cx="124" cy="34" r="16" />
      <template v-if="searching">
        <circle class="badge-icon" cx="122" cy="32" r="5.5" />
        <path class="badge-icon" d="M126.5 36.5l5 5" />
      </template>
      <path v-else class="badge-icon" d="M117 34h14" />
    </svg> -->
    <svg viewBox="0 0 120 120" fill="none" aria-hidden="true">
        <ellipse class="shadow" cx="60" cy="112" rx="34" ry="5" />
        <path class="body" d="M26 30v60c0 6.6 15.2 12 34 12s34-5.4 34-12V30" />
        <path class="ring" d="M26 50c0 6.6 15.2 12 34 12s34-5.4 34-12" />
        <path class="ring" d="M26 70c0 6.6 15.2 12 34 12s34-5.4 34-12" />
        <ellipse class="top" cx="60" cy="30" rx="34" ry="12" />
        <circle class="badge" cx="94" cy="92" r="14" />
        <template v-if="searching">
            <circle class="badge-icon" cx="92" cy="90" r="4.5" />
            <path class="badge-icon" d="M95.5 93.5l4.5 4.5" />
        </template>
        <path v-else class="badge-icon" d="M88 92h12" />
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
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 32px 16px;
    text-align: center;
    color: var(--color-w-b-1);

//   svg { width: 140px; height: auto; margin-bottom: 8px; }

//   .shadow { fill: currentColor; opacity: 0.06; }
//   .card-back { fill: currentColor; opacity: 0.05; }
//   .card { fill: var(--bg-wrapper); stroke: currentColor; stroke-opacity: 0.14; stroke-width: 1.5; }
//   .line { fill: currentColor; opacity: 0.1; }
//   .accent { fill: var(--color-primary); opacity: 0.7; }
//   .badge { fill: var(--color-primary); }
//   .badge-icon { fill: none; stroke: #fff; stroke-width: 2.5; stroke-linecap: round; }

    svg { width: 120px; height: auto; margin-bottom: 8px; color: #1f2937; }
    .dark & svg { color: #e5e7eb; }

    .shadow { fill: currentColor; opacity: 0.08; }
    .body { fill: color-mix(in srgb, currentColor 6%, transparent); stroke: currentColor; stroke-opacity: 0.35; stroke-width: 2; }
    .ring { stroke: currentColor; stroke-opacity: 0.35; stroke-width: 2; }
    .top  { fill: color-mix(in srgb, var(--color-primary) 22%, var(--bg-wrapper)); stroke: currentColor; stroke-opacity: 0.45; stroke-width: 2; }
    .badge { fill: var(--color-primary); stroke: var(--bg-wrapper); stroke-width: 3; }
    .badge-icon { fill: none; stroke: #fff; stroke-width: 2.5; stroke-linecap: round; }
  .title { margin: 0; font-size: 14px; font-weight: 600; }
  .desc { margin: 0; font-size: 12px; color: var(--color-w-b-2); }
}
</style>