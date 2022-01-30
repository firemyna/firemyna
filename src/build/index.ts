import { copyFile, mkdir, readFile, rm, writeFile } from "fs/promises";
import { resolve } from "path";
import { FiremynaAppEnv, FiremynaMode, FiremynaNode } from "../config";
import { FiremynaPackageJSON } from "../functions";
import {
  FiremynaBasePaths,
  FiremynaBuildPaths,
  getBuildPaths,
  getFunctionsBuildPath,
} from "../paths";

/**
 * The Firemyna build config.
 */
export interface FiremynaBuildConfig {
  /** The app environment */
  appEnv: FiremynaAppEnv;
  /** The current working directory */
  cwd: string;
  /** The Node.js version */
  node: FiremynaNode;
  /** The build paths */
  paths: FiremynaBuildPaths;
}

export interface GetBuildConfigProps {
  /** The app environment */
  appEnv: FiremynaAppEnv;
  /** The current working directory */
  cwd: string;
  /** The base paths */
  basePaths: FiremynaBasePaths;
  /** The Node.js version */
  node: FiremynaNode;
}

export function getBuildConfig({
  appEnv,
  cwd,
  node,
  basePaths,
}: GetBuildConfigProps): FiremynaBuildConfig {
  return {
    appEnv,
    cwd,
    node,
    paths: getBuildPaths({ appEnv, cwd, basePaths }),
  };
}
