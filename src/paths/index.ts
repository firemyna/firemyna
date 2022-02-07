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
 * - Keep all paths relative. Resolve to absolute only when necessary i.e.
 *   writing or reading from file system, passing to 3rd-party functions, etc.
 *   This allows keeping the paths as simple as possible and compatible across
 *   different environments.
 *
 * - All paths must be resolved via the module functionality. The Node.js' path
 *   module must not be used.
 */

import { mkdir } from "fs/promises";
import { relative, join, resolve } from "path";
import { FiremynaAppEnv } from "../app";
import { FiremynaFormat } from "../config";

/**
 * The project paths containing the location of the source code and the build.
 * This is one of the base paths object that is defined in the config.
 */
export interface FiremynaProjectPaths {
  /** The source code path */
  src: string;
  /** The build path */
  build: string;
}

/**
 * Generate the default project paths object.
 * @returns the default project paths
 */
export function defaultProjectPaths(): FiremynaProjectPaths {
  return {
    src: "app",
    build: "build",
  };
}

/**
 * The Firemyna paths containing the paths needed to run any command.
 */
export interface FiremynaPaths extends FiremynaProjectPaths {
  /** The current working directory relative to process.cwd() */
  cwd: string;
  /** The app environment build path (i.e. build/production) */
  appEnvBuild: string;
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

/**
 * The {@link getPaths} function props.
 */
export interface GetBuildPathsProps {
  /** The app environment */
  appEnv: FiremynaAppEnv;
  /** The current working directory; absolute or relative to process.cwd() */
  cwd: string;
  /** The project paths */
  projectPaths: FiremynaProjectPaths;
}

/**
 * Generates paths needed to run any command.
 * @returns the paths needed to run any command.
 */
export function getPaths({
  appEnv,
  projectPaths,
  ...props
}: GetBuildPathsProps): FiremynaPaths {
  const cwd = relative(process.cwd(), props.cwd);

  const appEnvBuild = getAppEnvBuild(appEnv, projectPaths.build);

  return {
    ...projectPaths,
    cwd,
    appEnvBuild,
    functions: {
      src: getFunctionsSrcPath(projectPaths.src),
      build: getFunctionsBuildPath(appEnvBuild),
    },
    hosting: {
      build: getHostingBuildPath(appEnvBuild),
    },
  };
}

/**
 * Generates app environment build path (i.e. build/production).
 * @param appEnv - the app environemnt
 * @param buildPath - the build path
 * @returns the app environment build path
 */
export function getAppEnvBuild(
  appEnv: FiremynaAppEnv,
  buildPath: string
): string {
  return join(buildPath, appEnv);
}

/**
 * Generates functions source code path.
 * @param srcPath - the app source path
 * @returns the functions source code path
 */
export function getFunctionsSrcPath(srcPath: string): string {
  return join(srcPath, "functions");
}

/**
 * Generates functions build path.
 * @param buildEnvPath - the app environment build path
 * @returns the functions build path
 */
export function getFunctionsBuildPath(buildEnvPath: string): string {
  return join(buildEnvPath, "functions");
}

/**
 * The function path type, file (hello.ts) or module (hello/index.ts).
 */
export type FiremynaFunctionPathType = "file" | "module";

/**
 * The {@link getFunctionSourcePath} function props.
 */
export interface GetFunctionSourcePathProps {
  /** The paths */
  paths: FiremynaPaths;
  /** The function name */
  name: string;
  /** The source code format */
  format: FiremynaFormat;
  /** The function path type */
  pathType?: FiremynaFunctionPathType;
}

/**
 * Generates a function source path.
 * @returns the function source path
 */
export function getFunctionSourcePath({
  paths,
  name,
  format,
  pathType = "file",
}: GetFunctionSourcePathProps): string {
  return resolve(
    paths.cwd,
    paths.functions.src,
    pathType === "file" ? `${name}.${format}` : `${name}/index.${format}`
  );
}

export interface GetFunctionBuildPathProps {
  /** The paths */
  paths: FiremynaPaths;
  /** The function name */
  name: string;
}

/**
 * Generates a function build path.
 * @returns the function build path
 */
export function getFunctionBuildPath({
  paths,
  name,
}: GetFunctionBuildPathProps): string {
  return join(paths.functions.build, `${name}.js`);
}

/**
 * Generates hosting build path.
 * @param buildEnvPath - the app environment build path
 * @returns the hosting build path
 */
export function getHostingBuildPath(buildEnvPath: string): string {
  return join(buildEnvPath, "hosting");
}

/**
 * Creates the given path.
 * @param path - the path to ensure
 * @returns promise to operation completion
 */
export async function ensurePath(cwd: string, path: string) {
  return mkdir(resolve(cwd, path), { recursive: true });
}
