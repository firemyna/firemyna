import { FiremynaPreset } from "../config";

export interface FiremynaPresetPaths {
  src: string;
  build: string;
}

export function presetPaths(preset: FiremynaPreset): FiremynaPresetPaths {
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
