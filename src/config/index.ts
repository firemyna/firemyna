import { transform } from "esbuild";
import { readFile, rm, writeFile } from "fs/promises";
import { resolve, parse } from "path";
import { getConfigPath } from "../paths";

/**
 * The source code format.
 */
export type FiremynaFormat = "ts" | "js";

/**
 * The export module type.
 */
export type FiremynaModule = "cjs" | "esm";

/**
 * The config preset.
 */
export type FiremynaPreset = "astro" | "cra" | "vite";

/**
 * The work mode:
 * - build: when the application is being build for deployment.
 * - start: when the application is started in the development mode.
 */
export type FiremynaMode = "build" | "watch";

/**
 * The Firebase Functions runtime version.
 */
export type FiremynaFunctionsRuntime =
  | "node10"
  | "node14"
  | "node14"
  | "node14"
  | "node16";

export type FiremynaConfig = Partial<FiremynaConfigResolved>;

/**
 * Firemyna config.
 */
export interface FiremynaConfigResolved {
  /**
   * The config preset.
   */
  preset?: FiremynaPreset;
  /**
   * The source code format.
   */
  format?: FiremynaFormat;
  /**
   * The path (relative to cwd or absolute) to the functions root directory.
   */
  functionsPath: string;
  /**
   * The functions build path.
   */
  buildPath: string;
  /**
   * The functions to build.
   */
  onlyFunctions?: string[];
  /**
   * Specify functions ignore patterns.
   */
  functionsIgnorePaths?: RegExp[];
  /**
   * The init module path (relative to cwd or absolute).
   */
  functionsInitPath?: string;
  /**
   * The Functions runtime version.
   */
  functionsRuntime?: FiremynaFunctionsRuntime;
  /**
   * The Functions runtime config path.
   */
  functionsRuntimeConfigPath?: string;
}

export async function tryLoadConfig(
  configPath?: string
): Promise<FiremynaConfig | undefined> {
  const configInfo = configPath
    ? await readConfigFromPath(configPath)
    : await tryReadAnyConfig();

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

interface TryReadConfigResult {
  format: FiremynaFormat;
  source: string;
  path: string;
}

export async function tryReadAnyConfig() {
  return tryReadConfig("ts")
    .catch(() => tryReadConfig("js"))
    .catch(() => undefined); // Ignore it
}

export async function tryReadConfig(
  format: FiremynaFormat
): Promise<TryReadConfigResult> {
  const path = getConfigPath(format);
  const source = await readFile(path, "utf-8");
  return { format, path, source };
}

export async function readConfigFromPath(
  path: string
): Promise<TryReadConfigResult> {
  const format = parse(path).ext === ".ts" ? "ts" : "js";
  try {
    const source = await readFile(path, "utf-8");
    return { format, path, source };
  } catch (error) {
    throw new Error(`Failed to read the config file located at ${path}`);
  }
}
