import { Command, flags } from "@oclif/command";
import { FiremynaFormat, FiremynaNode, FiremynaPreset } from "../../config";

export const nodeFlag = flags.enum<FiremynaNode>({
  description: "The Node.js version to use",
  char: "n",
  options: ["10", "14", "16"],
  default: "14",
});

export const presetFlag = flags.enum<FiremynaPreset | undefined>({
  description: "Preset to use",
  char: "p",
  options: ["astro", "cra", "vite"],
});

export const formatFlag = flags.enum<FiremynaFormat | undefined>({
  description: "Source format to generate code",
  char: "f",
  options: ["ts", "js"],
});

export const cwdFlag = flags.string({
  description: "Current working directory",
  default: process.cwd(),
});

export const configFlag = flags.string({
  description: "Path to the Firemyna config",
});
