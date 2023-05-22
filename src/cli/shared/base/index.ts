import {
  FiremynaConfigResolved,
  loadConfig,
  configWithDefaults,
} from "../../../config";
import { FiremynaPaths, getPaths } from "../../../paths";
import { presetProjectPaths } from "../../../presets/paths";
import { configFlag, cwdFlag } from "../../flags";

/**
 * Base command flags.
 */
export const commandFlags = {
  cwd: cwdFlag,
  config: configFlag,
};

/**
 * Firemyna command env.
 */
export interface FiremynaCommandEnv {
  /** The build paths */
  paths: FiremynaPaths;
  /** The resolved Firemyna config */
  config: FiremynaConfigResolved;
}

/**
 * Generates command env or returns cached value.
 *
 * @param cwd - the current working directory
 * @param configPath - the config path
 * @returns command env
 */
export async function commandEnv(
  cwd: string,
  configPath: string | undefined
): Promise<FiremynaCommandEnv> {
  if (_commandEnv) return _commandEnv;

  const config = await loadConfig(cwd, configPath);
  if (!config) throw new Error("Can not find the Firemyna config file");
  const resolvedConfig = configWithDefaults(config);

  const projectPaths = presetProjectPaths(
    resolvedConfig.preset,
    resolvedConfig.functionsPath
  );
  const paths = getPaths({ appEnv: "development", cwd, projectPaths });

  _commandEnv = { config: resolvedConfig, paths };
  return _commandEnv;
}

/**
 * The command config cache.
 * @private
 */
var _commandEnv: FiremynaCommandEnv | undefined;
