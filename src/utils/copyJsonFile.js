
const fs = require("fs");
const path = require("path");

// Deep merge nested objects
function deepMerge(target = {}, source = {}) {
  for (const key of Object.keys(source)) {
    const value = source[key];

    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      if (
        !target[key] ||
        typeof target[key] !== "object" ||
        Array.isArray(target[key])
      ) {
        target[key] = {};
      }

      deepMerge(target[key], value);
    } else {
      target[key] = value;
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

    if (!fs.existsSync(absPath)) {
      console.warn(`[mergeJsonFiles] File not found: ${absPath}`);
      continue;
    }

    let content;

    try {
      const raw = fs.readFileSync(absPath, "utf-8");
      content = JSON.parse(raw);
    } catch (error) {
      console.error("\n❌ Invalid JSON file==================:");
      console.error(`File-------------: ${absPath}`);

      // Show JSON parsing location when available
      const match = error.message.match(
        /(?:position|line)\s+(\d+)(?:\s+column\s+(\d+))?/i
      );

      if (match) {
        console.error(
          `Position: ${match[1]}` +
            (match[2] ? `, Column: ${match[2]}` : "")
        );
      }

      console.error(`Reason: ${error.message}`);
      throw new Error(
        `Failed to parse JSON: ${absPath}`,
        { cause: error }
      );
    }

    if (
      content === null ||
      typeof content !== "object" ||
      Array.isArray(content)
    ) {
      throw new Error(
        `Expected a JSON object at the root of: ${absPath}`
      );
    }

    merged = deep
      ? deepMerge(merged, content)
      : { ...merged, ...content };
  }

  const absOutputPath = path.resolve(outputPath);
  const outDir = path.dirname(absOutputPath);

  fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(
    absOutputPath,
    JSON.stringify(merged, null, 2) + "\n",
    "utf-8"
  );

  console.log(`[mergeJsonFiles] Merged successfully: ${absOutputPath}`);

  return merged;
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
