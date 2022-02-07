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
 * @returns the preset project paths
 */
export function presetProjectPaths(
  preset: FiremynaPreset | undefined
): FiremynaProjectPaths {
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

    case undefined:
      return defaultProjectPaths();
  }
}
