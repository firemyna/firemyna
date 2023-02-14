import { Flags } from "@oclif/core";
import {
  defaultNode,
  FiremynaFormat,
  FiremynaFunctionsNode,
} from "../../config";
import {
  FirebaseMemoryOption,
  firebaseMemoryOptions,
  FirebaseRegion,
  firebaseRegions,
} from "../../firebase/exports";
import { FiremynaPreset } from "../../presets";

export const nodeFlag = Flags.enum<FiremynaFunctionsNode>({
  description: "The Node.js version to use",
  char: "n",
  options: ["14", "16", "18"],
  default: defaultNode,
});

export const presetFlag = Flags.enum<FiremynaPreset | undefined>({
  description: "Preset to use",
  char: "p",
  options: ["astro", "cra", "vite", "remix", "next"],
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

export const functionsFlag = Flags.string({
  description: "Path to the Functions source code",
});

export const memoryFlag = Flags.enum<FirebaseMemoryOption>({
  description: "The Firebase Functions memory",
  options: firebaseMemoryOptions,
});

export const regionFlag = Flags.enum<FirebaseRegion | FirebaseRegion[]>({
  description: "The Firebase Functions region or regions",
  multiple: true,
  options: firebaseRegions,
});

export const cookieFlag = Flags.boolean({
  description: "Enable cookie parsing middleware",
});

export const corsFlag = Flags.boolean({
  description: "Enable CORS middleware",
});
