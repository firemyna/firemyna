import { resolve, parse } from "path";
import { FiremynaFormat, FiremynaMode } from "../config";
import { mkdir } from "fs/promises";

export async function ensurePath(path: string): Promise<string> {
  await mkdir(parse(path).dir, { recursive: true });
  return path;
}

export function getFunctionsSrcPath(srcPath: string): string {
  return resolve(srcPath, "functions");
}

export function getFunctionsBuildPath(buildEnvPath: string): string {
  return resolve(buildEnvPath, "functions");
}

export function getHostingBuildPath(buildEnvPath: string): string {
  return resolve(buildEnvPath, "hosting");
}

export function getBuildEnvPath(mode: FiremynaMode, buildPath: string): string {
  return resolve(buildPath, mode === "watch" ? "development" : "production");
}

export function getConfigPath(format: FiremynaFormat) {
  return `firemyna.config.${format}`;
}
