const fs = require("fs");
const path = require("path");

//Deep merge objects (nested keys)

function deepMerge(target = {}, source = {}) {
  for (const key in source) {
    if (
      typeof source[key] === "object" &&
      source[key] !== null &&
      !Array.isArray(source[key])
    ) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

export default function mergeJsonFiles({
  inputPaths,
  outputPath,
  deep = true,
}) {
  let merged = {};

  for (const filePath of inputPaths) {
    const absPath = path.resolve(filePath);
    if (fs.existsSync(absPath)) {
      const content = JSON.parse(fs.readFileSync(absPath, "utf-8"));
      merged = deep ? deepMerge(merged, content) : { ...merged, ...content };
    }
  }

  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(merged, null, 2), "utf-8");
  // console.log(`✅ Merged → ${outputPath}`);
}

// Example usage:
// import mergeJsonFiles from "../utils/mergeJsonFiles.js";

// const langs = ["en", "km"];
// const sources = [
//   "module/assets/locale",
//   "layer/assets/locale",
//   "app/assets/locale",
// ];

// langs.forEach((lang) => {
//   mergeJsonFiles({
//     inputPaths: sources.map((src) => `${src}/${lang}.json`),
//     outputPath: `app/locale/${lang}.json`,
//     deep: true, // optional, default true
//   });
// });
