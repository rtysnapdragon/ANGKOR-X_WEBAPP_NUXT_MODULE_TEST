import path from "path";
import fs from "fs";
export default (layers = []) => {
  if (layers == [] || layers == "") return;
  // Process each layer path
  const projectRoot = process.cwd();
  const rootDir = path.dirname(projectRoot);
  const projectName = path.basename(projectRoot);

  for (const layer of layers) {
    const layerPath = path.join(rootDir, layer);

    try {
      if (fs.existsSync(layerPath)) {
        const tsconfigPath = path.join(layerPath, "tsconfig.json"); // Write to tsconfig.json
        const tsconfigContent = {
          extends: `../../${projectName}/.nuxt/tsconfig.json`,
        };
        fs.writeFileSync(
          tsconfigPath,
          JSON.stringify(tsconfigContent, null, 2),
          "utf-8"
        );
      } else {
        console.warn(`Layer path does not exist: ${layerPath}`);
      }
    } catch (error) {
      console.error(`Error processing layer ${layerPath}:`, error);
    }
  }
};
