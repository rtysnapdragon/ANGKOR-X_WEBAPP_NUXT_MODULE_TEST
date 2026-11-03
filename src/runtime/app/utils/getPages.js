import fs from "fs";
import path from "path";

export default (pageDirNames) => {
  pageDirNames ??= [];

  let result = [];

  for (const pageDir of pageDirNames) {
    const allRoutes = getAllFilePathsRelative(pageDir, "");

    for (const route of allRoutes) {
      if (!route.endsWith(".vue")) {
        continue;
      }

      let routePath = route
        .replace(/\.vue$/, "") // Remove .vue extension
        .replace(/\\/g, "/") // Normalize path separators to forward slashes
        .replace(/\/index$/, "") // Remove /index at the end
        .replace(/^index$/, ""); // Remove standalone index

      // Skip dynamic routes for static generation
      // Dynamic routes like [id].vue need actual values, not placeholders
      if (route.includes("[") && route.includes("]")) {
        continue;
      }

      if (routePath.length > 1 && routePath.endsWith("/")) {
        routePath = routePath.slice(0, -1);
      }

      if (routePath && !routePath.startsWith("/")) {
        routePath = "/" + routePath;
      }

      if (routePath === "") {
        routePath = "/";
      }

      if (!result.includes(routePath)) {
        result.push(routePath);
      }
    }
  }

  return result.sort();
};

function getAllFilePathsRelative(baseDir, dir = "") {
  const results = [];

  try {
    if (!fs.existsSync(baseDir)) {
      console.log(`Directory does not exist: ${baseDir}`);
      return results;
    }

    const fullPath = path.join(baseDir, dir);
    const filesAndFolders = fs.readdirSync(fullPath);

    for (const item of filesAndFolders) {
      if (item.startsWith(".") || item === "node_modules") {
        continue;
      }

      const itemPath = path.join(fullPath, item);
      const relativePath = path.join(dir, item);

      try {
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
          const subFilePaths = getAllFilePathsRelative(baseDir, relativePath);
          results.push(...subFilePaths);
        } else if (stat.isFile()) {
          if (path.extname(item) === ".vue") {
            results.push(relativePath.replace(/\\/g, "/"));
          }
        }
      } catch (statError) {
        console.log(`Error reading ${itemPath}:`, statError.message);
      }
    }
  } catch (e) {
    console.log(`Get files error in ${baseDir}${dir}:`, e.message);
  }

  return results;
}
