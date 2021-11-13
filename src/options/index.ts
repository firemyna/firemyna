import { resolve } from "path";
import { FiremynaMode } from "../config";

export function getFunctionBuildPath(buildPath: string): string {
  return resolve(buildPath, "functions");
}

export function getHostingBuildPath(buildPath: string): string {
  return resolve(buildPath, "hosting");
}

export function getModeBuildPath(
  mode: FiremynaMode,
  baseBuildPath: string
): string {
  return resolve(
    baseBuildPath,
    mode === "watch" ? "development" : "production"
  );
}
