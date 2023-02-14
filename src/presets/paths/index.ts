/**
 * @module presets/paths
 *
 * The Firemyna presets paths module - everything related to locating stuff on
 * the disk.
 */

import { FiremynaPreset } from "..";
import { defaultProjectPaths, FiremynaProjectPaths } from "../../paths";

/**
 * Generate the preset project paths object.
 * @param preset the preset to get paths for
 * @param functionsPath the functions path
 * @returns the preset project paths
 */
export function presetProjectPaths(
  preset: FiremynaPreset | undefined,
  functionsPath: string | undefined
): FiremynaProjectPaths {
  switch (preset) {
    case "astro":
    case "vite":
      return {
        functions: "src/functions",
        build: "dist",
      };

    case "cra":
      return {
        functions: "src/functions",
        build: "build",
      };

    case "remix":
      return {
        functions: "app/functions",
        build: "build",
      };

    case "next":
      return {
        functions: "functions",
        build: "build",
      };

    case undefined:
      return defaultProjectPaths(functionsPath);
  }
}
