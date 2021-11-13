import { Command, flags } from "@oclif/command";
import { FiremynaFormat, FiremynaModule, FiremynaPreset } from "../../config";

export const presetFlag = flags.enum<FiremynaPreset>({
  description: "Preset to use",
  char: "p",
  options: ["astro", "cra", "vite"],
});

export const formatFlag = flags.enum<FiremynaFormat>({
  description: "Source format to generate code",
  char: "f",
  options: ["ts", "js"],
});

export const moduleFlag = flags.enum<FiremynaModule>({
  description: "Module format to use when generating code",
  char: "m",
  options: ["esm", "cjs"],
  default: "esm",
});

export const cwdFlag = flags.string({
  description: "Current working directory",
  default: process.cwd(),
});
