import { FiremynaPreset } from "../../config";
import { FiremynaBasePaths } from "../../paths";

export function presetBasePaths(preset: FiremynaPreset): FiremynaBasePaths {
  switch (preset) {
    case "astro":
    case "vite":
      return {
        src: "src",
        build: "dist",
      };

    case "cra":
      return {
        src: "src",
        build: "build",
      };
  }
}
