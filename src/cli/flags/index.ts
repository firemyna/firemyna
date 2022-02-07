import { Flags } from "@oclif/core";
import { defaultNode, FiremynaFormat, FiremynaNode } from "../../config";
import { FiremynaPreset } from "../../presets";

export const nodeFlag = Flags.enum<FiremynaNode>({
  description: "The Node.js version to use",
  char: "n",
  options: ["10", "14", "16"],
  default: defaultNode,
});

export const presetFlag = Flags.enum<FiremynaPreset | undefined>({
  description: "Preset to use",
  char: "p",
  options: ["astro", "cra", "vite"],
});

export const formatFlag = Flags.enum<FiremynaFormat | undefined>({
  description: "Source format to generate code",
  char: "f",
  options: ["ts", "js"],
});

export const cwdFlag = Flags.string({
  description: "Current working directory",
  default: process.cwd(),
});

export const configFlag = Flags.string({
  description: "Path to the Firemyna config",
});
