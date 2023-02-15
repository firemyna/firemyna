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
  /** The Firebase project alias */
  project: string | undefined;
  /** The app environment */
  appEnv: FiremynaAppEnv;
  /** The current working directory */
  cwd: string;
  /** The build paths */
  paths: FiremynaPaths;
  /** The resolved Firemyna config */
  config: FiremynaConfigResolved;
  /** Should Firemyna generate renderer function? */
  renderer: boolean;
}

/**
 * The {@link getBuildConfig} function props.
 */
export interface GetBuildConfigProps {
  /** Firemyna build mode */
  mode: FiremynaBuildMode;
  /** The Firebase project alias */
  project: string | undefined;
  /** The app environment */
  appEnv: FiremynaAppEnv;
  /** The current working directory */
  cwd: string;
  /** The project paths */
  projectPaths: FiremynaProjectPaths;
  /** The resolved Firemyna config */
  config: FiremynaConfigResolved;
  /** Should Firemyna generate renderer function? */
  renderer: boolean;
}

/**
 * Generates the Firemyna build config.
 * @returns Firemyna build config
 */
export function getBuildConfig({
  mode,
  project,
  appEnv,
  cwd,
  projectPaths,
  config,
  renderer,
}: GetBuildConfigProps): FiremynaBuildConfig {
  return {
    mode,
    project,
    appEnv,
    cwd,
    config,
    paths: getPaths({ appEnv, cwd, projectPaths }),
    renderer,
  };
}
