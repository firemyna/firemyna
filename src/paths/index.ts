/**
 * @module paths
 *
 * The Firemyna paths module - everything related to locating stuff on the disk.
 *
 * Core principles:
 *
 * - Resolve all relevant to the operation paths in single place and use objects
 *   to store those.
 *
 * - Resolve everything to absolute paths, convert to relative only when
 *   printing for the user.
 *
 * - All paths must be resolved via the module functionality. The Node.js' path
 *   must not be used.
 */

import { resolve, parse } from "path";
import { FiremynaAppEnv, FiremynaFormat, FiremynaMode } from "../config";
import { mkdir } from "fs/promises";

/**
 * The base application paths.
 */
export interface FiremynaBasePaths {
  /** The source code path */
  src: string;
  /** The build path */
  build: string;
}

export interface FiremynaBuildPaths extends FiremynaBasePaths {
  /** The current working directory */
  cwd: string;
  /** The build environment path (i.e. /path/to/build/production) */
  env: string;
  /** The functions paths */
  functions: {
    /** The functions source code path */
    src: string;
    /** The functions build path */
    build: string;
  };
  /** The hosting paths */
  hosting: {
    /** The hosting build path */
    build: string;
  };
}

// export function getBuildEnvFilePath(paths: FiremynaBuildPaths, file: string) {
//   return resolve(paths.env, file);
// }

export function defaultBasePaths(): FiremynaBasePaths {
  return {
    src: "app",
    build: "build",
  };
}

export function getBuildFunctionsFilePath(
  paths: FiremynaBuildPaths,
  file: string
) {
  return resolve(paths.functions.build, file);
}

export async function ensurePath(path: string) {
  return mkdir(path, { recursive: true });
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

export function getBuildEnvPath(
  appEnv: FiremynaAppEnv,
  buildPath: string
): string {
  return resolve(buildPath, appEnv);
}

export function getConfigPath(format: FiremynaFormat) {
  return `firemyna.config.${format}`;
}

export interface GetBuildPathsProps {
  /** The app environment */
  appEnv: FiremynaAppEnv;
  /** The current working directory */
  cwd: string;
  /** The base paths */
  basePaths: FiremynaBasePaths;
}

export function getBuildPaths({
  appEnv,
  cwd,
  basePaths,
}: GetBuildPathsProps): FiremynaBuildPaths {
  const buildEnvPath = getBuildEnvPath(appEnv, basePaths.build);
  return {
    ...basePaths,
    cwd,
    env: getBuildEnvPath(appEnv, basePaths.build),
    functions: {
      src: getFunctionsSrcPath(basePaths.src),
      build: getFunctionsBuildPath(buildEnvPath),
    },
    hosting: {
      build: getHostingBuildPath(buildEnvPath),
    },
  };
}
