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

/**
 * Firemyna app config. The user version with all fields optional.
 */
export type FiremynaConfig = Partial<FiremynaConfigResolved>;

/**
 * Firemyna app config. Resolved version with all required fields present.
 */
export interface FiremynaConfigResolved {
  /** The Functions Node.js version; default - {@link defaultNode} */
  node: FiremynaFunctionsNode;
  /** The source code format; the default format is js */
  format: FiremynaFormat;
  /** The config preset */
  preset?: FiremynaPreset;
  /** The path (relative to the config) to the functions directory */
  functionsPath?: string;
  /** The functions build path */
  buildPath?: string;
  /** The functions to build */
  onlyFunctions?: string[];
  /** Specify functions ignore patterns */
  functionsIgnorePaths?: RegExp[];
  /** The init module path (relative to the config) */
  functionsInitPath?: string;
  /** The Functions runtime config path. [See Firebase docs](https://firebase.google.com/docs/functions/local-emulator#set_up_functions_configuration_optional).
   * @deprecated - this is an outdated approach, use env variables. [See Firebase docs](https://firebase.google.com/docs/functions/config-env#env-variables). */
  functionsRuntimeConfigPath?: string;
  /** Emulators config, if not defined, Functions will start in serve mode. */
  emulators?: FiremynaConfigEmulators;
  /** Enable hosting. TODO: Copy static files. */
  hosting?: boolean;
  /** The Storage config. */
  storage?: boolean | FiremynaConfigStorage;
  /** The Firestore config. */
  firestore?: boolean | FiremynaConfigFirestore;
}

/**
 * The Firemyna Storage config.
 */
export interface FiremynaConfigStorage {
  /** The path (relative to the config) to the Storage security rules. Defaults to `storage.rules`. */
  rulesPath?: string;
}

/**
 * The Firemyna Firestore config.
 */
export interface FiremynaConfigFirestore {
  /** The path (relative to the config) to the Firestore security rules. Defaults to `storage.rules`. */
  rulesPath?: string;
}

/**
 * The Firemyna emulators config.
 */
export interface FiremynaConfigEmulators {
  /** The directory to save the emulators' data. Set false to disable the persistence. Defaults to `.firebase/emulators`. */
  persistence?: boolean | string;
  /** The Authentication emulator. Set true or object to enable it. */
  auth?:
    | boolean
    | {
        /** The Authentication emulator port. Default - 9099 */
        port?: number;
      };
  /** The Functions emulator. Set true or object to enable it. */
  functions?:
    | boolean
    | {
        /** The Functions emulator port. Default - 5001 */
        port?: number;
      };
  /** The Firestore emulator. Set true or object to enable it. */
  firestore?:
    | boolean
    | {
        /** The Firestore emulator port. Default - 8080 */
        port?: number;
      };
  /** The Realtime Database emulator. Set true or object to enable it. */
  database?:
    | boolean
    | {
        /** The Realtime Database emulator port. Default - 9000 */
        port?: number;
      };
  /** The Hosting emulator. Set true or object to enable it. */
  hosting?:
    | boolean
    | {
        /** The Hosting emulator port. Default - 5000 */
        port?: number;
      };
  /** The Pub/Sub emulator. Set true or object to enable it. */
  pubsub?:
    | boolean
    | {
        /** The Pub/Sub emulator port. Default - 8085 */
        port?: number;
      };
  /** The Storage emulator. Set true or object to enable it. */
  storage?:
    | boolean
    | {
        /** The Storage emulator port. Default - 9199 */
        port?: number;
      };
  /** The Eventarc emulator. Set true or object to enable it. */
  eventarc?:
    | boolean
    | {
        /** The Eventarc emulator port. Default - 9299 */
        port?: number;
      };
  /** The Emulator UI. Defaults to true, set false to disable it. */
  ui?:
    | boolean
    | {
        /** The Emulator UI port. Default - 4000 */
        port?: number;
      };
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
