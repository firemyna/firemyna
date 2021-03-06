import { FiremynaPkg } from "../pkg";
import { remixPresetCommands } from "./remix";

/**
 * The config preset.
 */
export type FiremynaPreset = "astro" | "cra" | "vite" | "remix" | "next";

export type FiremynaPresetCommands = {
  "prepare-package-json"?: (pkg: FiremynaPkg) => void;
};

export type FiremynaPresetCommand = keyof FiremynaPresetCommands;

export function presetCommand<Command extends FiremynaPresetCommand>(
  preset: FiremynaPreset,
  command: Command
): FiremynaPresetCommands[Command] {
  return presetCommands(preset)?.[command];
}

export function presetCommands(
  preset: FiremynaPreset
): FiremynaPresetCommands | undefined {
  switch (preset) {
    case "remix":
      return remixPresetCommands;
  }
}
