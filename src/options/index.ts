import { resolve } from "path";
import { FMMode } from "../functions";

export function getFunctionBuildPath(buildPath: string): string {
  return resolve(buildPath, "functions");
}

export function getModeBuildPath(mode: FMMode, baseBuildPath: string): string {
  return resolve(
    baseBuildPath,
    mode === "watch" ? "development" : "production"
  );
}
