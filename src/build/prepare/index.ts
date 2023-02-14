import { copyFile, mkdir, readFile, rm, writeFile } from "fs/promises";
import { resolve } from "path";
import { FiremynaBuildConfig } from "..";
import { getFunctionsBuildPath } from "../../paths";
import { FiremynaPkg } from "../../pkg";
import { presetCommand } from "../../presets";
import { FiremynaConfigResolved } from "../../config";

/**
 * Generates Firebase build structure.
 */
export interface FiremynaBuildStruct {
  /** The parsed package.json */
  pkg: FiremynaPkg;
}

/**
 * Prepares the build structure.
 * @returns promise to the operation complete
 */
export async function prepareBuild(buildConfig: FiremynaBuildConfig) {
  const { mode, cwd, config, paths } = buildConfig;

  // Recreate the build directory
  await rm(resolve(cwd, paths.appEnvBuild), {
    recursive: true,
    force: true,
  });

  await mkdir(resolve(cwd, getFunctionsBuildPath(paths.appEnvBuild)), {
    recursive: true,
  });

  interface CopyToBuildOptions {
    /** The filename to write to */
    out?: string;
    /** Ignore if the file does not exist or fails for any other reason */
    ignore?: boolean;
  }

  function copyToBuild(name: string, { out, ignore }: CopyToBuildOptions = {}) {
    return copyFile(
      resolve(cwd, name),
      resolve(cwd, paths.appEnvBuild, out || name)
    ).catch((error) => {
      if (!ignore) throw error;
    });
  }

  const pkg: FiremynaPkg = JSON.parse(
    await readFile(resolve(cwd, "package.json"), "utf8")
  );

  Object.assign(pkg, {
    // TODO: Get from paths
    main: "functions/index.js",
    engines: { node: config.node },
  });

  config.preset && presetCommand(config.preset, "prepare-package-json")?.(pkg);

  await Promise.all<any>([
    writeFile(
      resolve(cwd, paths.appEnvBuild, "package.json"),
      JSON.stringify(pkg, null, 2)
    ),

    // Copy the Storage security rules
    ((mode === "dev" && config.emulators?.storage) || config.storage) &&
      copyToBuild(storageRulesPath(config)),

    // Copy the Firestore security rules
    ((mode === "dev" && config.emulators?.firestore) || config.firestore) &&
      copyToBuild(
        firestoreRulesPath(config),
        { ignore: mode === "dev" } // Firestore emulator works without rules
      ),

    // TODO: Add support for Yarn and pnpm
    copyToBuild("package-lock.json", { ignore: true }),

    // TODO: Generate from the config
    copyToBuild(".firebaserc"),

    writeFile(
      resolve(cwd, paths.appEnvBuild, "firebase.json"),
      JSON.stringify(firebaseJSON(buildConfig), null, 2)
    ),

    mode === "dev" &&
      config.functionsRuntimeConfigPath &&
      copyToBuild(config.functionsRuntimeConfigPath, {
        out: ".runtimeconfig.json",
      }),
  ]);

  return { pkg };
}

export interface FiremynaFirebaseJSON {
  hosting?: {
    public: string;
    rewrites?: Array<{ source: string; function: string }>;
  };
  functions: {
    source: string;
  };

  storage?: {
    rules: string;
  };

  firestore?: {
    rules: string;
  };

  emulators?: {
    /** The Authentication emulator. */
    auth?: {
      /** The Authentication emulator port. Default - 9099 */
      port?: number;
    };
    /** The Functions emulator. */
    functions?: {
      /** The Functions emulator port. Default - 5001 */
      port?: number;
    };
    /** The Firestore emulator. */
    firestore?: {
      /** The Firestore emulator port. Default - 8080 */
      port?: number;
    };
    /** The Realtime Database emulator. */
    database?: {
      /** The Realtime Database emulator port. Default - 9000 */
      port?: number;
    };
    /** The Hosting emulator. */
    hosting?: {
      /** The Hosting emulator port. Default - 5000 */
      port?: number;
    };
    /** The Pub/Sub emulator. */
    pubsub?: {
      /** The Pub/Sub emulator port. Default - 8085 */
      port?: number;
    };
    /** The Storage emulator. */
    storage?: {
      /** The Storage emulator port. Default - 9199 */
      port?: number;
    };
    /** The Eventarc emulator. */
    eventarc?: {
      /** The Eventarc emulator port. Default - 9299 */
      port?: number;
    };
    /** The Emulator UI. */
    ui?: {
      /** If the Emulator UI is enabled. Default - true */
      enabled: true;
      /** The Emulator UI port. Default - 4000 */
      port: number;
    };
    /** If to use the same project for all emulator instances. */
    singleProjectMode?: boolean;
  };
}

/**
 * Generates Firebase JSON for functions.
 *
 * @param buildConfig - the Firemyna build config
 * @returns Firebase JSON file
 */
function firebaseJSON(buildConfig: FiremynaBuildConfig): FiremynaFirebaseJSON {
  const { mode, config, renderer } = buildConfig;

  const json: FiremynaFirebaseJSON = {
    functions: {
      source: ".",
    },
  };

  if (renderer || config.hosting) {
    json.hosting = {
      // TODO: Get this from paths
      public: "hosting",
    };

    if (renderer) {
      json.hosting.rewrites = [
        {
          source: "/**",
          function: "renderer",
        },
      ];
    }
  }

  if (config.emulators) {
    json.emulators = {
      singleProjectMode: true,
    };

    if (config.emulators.auth)
      json.emulators.auth = {
        port:
          (typeof config.emulators.auth === "object" &&
            config.emulators.auth.port) ||
          9099,
      };

    if (config.emulators.functions)
      json.emulators.functions = {
        port:
          (typeof config.emulators.functions === "object" &&
            config.emulators.functions.port) ||
          5001,
      };

    if (config.emulators.firestore)
      json.emulators.firestore = {
        port:
          (typeof config.emulators.firestore === "object" &&
            config.emulators.firestore.port) ||
          8080,
      };

    if (config.emulators.database)
      json.emulators.database = {
        port:
          (typeof config.emulators.database === "object" &&
            config.emulators.database.port) ||
          9000,
      };

    if (config.emulators.hosting)
      json.emulators.hosting = {
        port:
          (typeof config.emulators.hosting === "object" &&
            config.emulators.hosting.port) ||
          5000,
      };

    if (config.emulators.pubsub)
      json.emulators.pubsub = {
        port:
          (typeof config.emulators.pubsub === "object" &&
            config.emulators.pubsub.port) ||
          8085,
      };

    if (config.emulators.storage)
      json.emulators.storage = {
        port:
          (typeof config.emulators.storage === "object" &&
            config.emulators.storage.port) ||
          9199,
      };

    if (config.emulators.eventarc)
      json.emulators.eventarc = {
        port:
          (typeof config.emulators.eventarc === "object" &&
            config.emulators.eventarc.port) ||
          9299,
      };

    if (config.emulators.ui !== false)
      json.emulators.ui = {
        enabled: true,
        port:
          (typeof config.emulators.ui === "object" &&
            config.emulators.ui.port) ||
          4000,
      };
  }

  if ((mode === "dev" && config.emulators?.storage) || config.storage) {
    json.storage = {
      rules: storageRulesPath(config),
    };
  }

  if ((mode === "dev" && config.emulators?.firestore) || config.firestore) {
    json.firestore = {
      rules: firestoreRulesPath(config),
    };
  }

  return json;
}

function firestoreRulesPath(config: FiremynaConfigResolved) {
  return (
    (typeof config.firestore === "object" && config.firestore.rulesPath) ||
    "firestore.rules"
  );
}

function storageRulesPath(config: FiremynaConfigResolved) {
  return (
    (typeof config.storage === "object" && config.storage.rulesPath) ||
    "storage.rules"
  );
}
