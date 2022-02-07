import { FiremynaAppEnv } from "../app";
import { FiremynaConfigResolved } from "../config";
import { FiremynaPaths, FiremynaProjectPaths, getPaths } from "../paths";

/**
 * The build mode:
 * - build: when the application is being build for deployment.
 * - dev: when the application is started in the development mode.
 */
export type FiremynaBuildMode = "build" | "dev";

/**
 * The Firemyna build config.
 */
export interface FiremynaBuildConfig {
  /** Firemyna build mode */
  mode: FiremynaBuildMode;
  /** The app environment */
  appEnv: FiremynaAppEnv;
  /** The current working directory */
  cwd: string;
  /** The build paths */
  paths: FiremynaPaths;
  /** The resolved Firemyna config */
  config: FiremynaConfigResolved;
}

/**
 * The {@link getBuildConfig} function props.
 */
export interface GetBuildConfigProps {
  /** Firemyna build mode */
  mode: FiremynaBuildMode;
  /** The app environment */
  appEnv: FiremynaAppEnv;
  /** The current working directory */
  cwd: string;
  /** The project paths */
  projectPaths: FiremynaProjectPaths;
  /** The resolved Firemyna config */
  config: FiremynaConfigResolved;
}

/**
 * Generates the Firemyna build config.
 * @returns Firemyna build config
 */
export function getBuildConfig({
  mode,
  appEnv,
  cwd,
  projectPaths,
  config,
}: GetBuildConfigProps): FiremynaBuildConfig {
  return {
    mode,
    appEnv,
    cwd,
    config,
    paths: getPaths({ appEnv, cwd, projectPaths: projectPaths }),
  };
}
