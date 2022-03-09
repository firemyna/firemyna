import { FiremynaPresetCommands } from "..";

export const remixPresetCommands: FiremynaPresetCommands = {
  "prepare-package-json": (pkg) => {
    pkg.scripts?.postinstall && delete pkg.scripts.postinstall;
  },
};
