import { FiremynaPresetCommand, FiremynaPresetCommands } from "..";
import fs from "fs/promises";
import { resolve } from "path";
import { parseDependencies } from "../../functions";

export const remixPresetCommands: FiremynaPresetCommands = {
  "prepare-package-json": (pkg) => {
    pkg.scripts?.postinstall && delete pkg.scripts.postinstall;
  },

  "list-source-dependencies": async (buildConfig) => {
    const path = resolve(
      buildConfig.cwd,
      buildConfig.paths.functions.build,
      "_renderer.js"
    );
    const source = await fs.readFile(path, "utf8");
    return parseDependencies(source);
  },
};
