import { transform } from "esbuild";
import { readFile, rm, writeFile } from "fs/promises";
import { isAbsolute, parse, relative, resolve } from "path";
import { FiremynaPreset } from "../presets";
import { getConfigFileName } from "./paths";

/**
 * The Firebase Functions Node.js version.
 */
export type FiremynaFunctionsNode = "14" | "16" | "18";

/**
 * The default Node.js version.
 */
export const defaultNode = "18";

/**
 * The source code format.
 */
export type FiremynaFormat = "ts" | "js";

/**
 * The default code format
 */
export const defaultFormat = "js";

export type FiremynaConfig = Partial<FiremynaConfigResolved>;

/**
 * Firemyna app config.
 */
export interface FiremynaConfigResolved {
  /** The Functions Node.js version; default - {@link defaultNode} */
  node: FiremynaFunctionsNode;
  /** The source code format; the default format is js */
  format: FiremynaFormat;
  /** The config preset */
  preset?: FiremynaPreset;
  /** The path (relative to cwd or absolute) to the functions directory */
  functionsPath?: string;
  /** The functions build path */
  buildPath?: string;
  /** The functions to build */
  onlyFunctions?: string[];
  /** Specify functions ignore patterns */
  functionsIgnorePaths?: RegExp[];
  /** The init module path (relative to cwd or absolute) */
  functionsInitPath?: string;
  /** The Functions runtime version */
  functionsRuntime?: FiremynaFunctionsNode;
  /** The Functions runtime config path */
  functionsRuntimeConfigPath?: string;
}

/**
 * Loads the Firemyna config from the default location or the specified path.
 * @param cwd - the current working directory
 * @param configPath - the custom config path
 * @returns the Firemyna config if found
 */
export async function loadConfig(
  cwd: string,
  configPath: string | undefined
): Promise<FiremynaConfig | undefined> {
  const configInfo = configPath
    ? await readConfigFromPath(cwd, configPath)
    : await tryReadAnyConfig(cwd);

  if (!configInfo) return;

  const source = await transform(configInfo.source, {
    format: "cjs",
    loader: "ts",
  });
  const tmpPath = resolve(process.cwd(), `firemyna.config.${Date.now()}.js`);
  await writeFile(tmpPath, source.code);

  try {
    const { config } = await import(tmpPath);
    await rm(tmpPath);
    return config;
  } catch (error) {
    console.warn(
      `Failed to load the config file located at ${configInfo.path}`
    );
    console.warn(error);
    await rm(tmpPath, { force: true });
  }
}

/**
 * The config reading result.
 */
interface ConfigReadingResult {
  /** The config format */
  format: FiremynaFormat;
  /** The config source code */
  source: string;
  /** The config path */
  path: string;
}

/**
 * Reads the Firemyna config from the specified path.
 * @param cwd - the working directory
 * @param configPath - the config path
 * @returns the config reading result
 */
export async function readConfigFromPath(
  cwd: string,
  configPath: string
): Promise<ConfigReadingResult> {
  const format = parse(configPath).ext === ".ts" ? "ts" : "js";
  try {
    const normalizedPath = isAbsolute(configPath)
      ? relative(cwd, configPath)
      : configPath;
    const source = await readFile(resolve(cwd, normalizedPath), "utf-8");
    return { format, path: normalizedPath, source };
  } catch (error) {
    throw new Error(`Failed to read the config file located at ${configPath}`);
  }
}

/**
 * Tries to read the Firemyna config from the default location.
 * @param cwd - the working directory
 * @returns the config reading result if found
 */
export async function tryReadAnyConfig(
  cwd: string
): Promise<ConfigReadingResult | undefined> {
  return tryReadConfig(cwd, "ts")
    .catch(() => tryReadConfig(cwd, "js"))
    .catch(() => undefined); // Ignore it
}

/**
 * Tries to read the Firemyna config of the given format.
 * @param cwd - the working directory
 * @param format - the config format
 * @returns the config reading result
 */
export async function tryReadConfig(
  cwd: string,
  format: FiremynaFormat
): Promise<ConfigReadingResult> {
  const path = getConfigFileName(format);
  const source = await readFile(resolve(cwd, path), "utf-8");
  return { format, path, source };
}

/**
 * Resolves (expands default values) the config.
 * @param config - the Firemyna config
 * @returns resolved Firemyna config
 */
export function resolveConfig(config: FiremynaConfig): FiremynaConfigResolved {
  return {
    ...config,
    node: config.node || defaultNode,
    format: config.format || defaultFormat,
  };
}
