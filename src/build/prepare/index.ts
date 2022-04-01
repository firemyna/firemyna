import { copyFile, mkdir, readFile, rm, writeFile } from "fs/promises";
import { resolve } from "path";
import { FiremynaBuildConfig } from "..";
import { getFunctionsBuildPath } from "../../paths";
import { FiremynaPkg } from "../../pkg";
import { presetCommand } from "../../presets";

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
export async function prepareBuildStruct(buildConfig: FiremynaBuildConfig) {
  const { mode, cwd, config, paths } = buildConfig;

  // Recreate the build directory
  await rm(resolve(cwd, paths.appEnvBuild), {
    recursive: true,
    force: true,
  });

  await mkdir(resolve(cwd, getFunctionsBuildPath(paths.appEnvBuild)), {
    recursive: true,
  });

  function copyToBuild(name: string, out?: string) {
    return copyFile(
      resolve(cwd, name),
      resolve(cwd, paths.appEnvBuild, out || name)
    );
  }

  const pkg: FiremynaPkg = JSON.parse(
    await readFile(resolve(cwd, "package.json"), "utf8")
  );

  Object.assign(pkg, {
    // TODO: Get from paths
    main: "functions/index.js",
    engines: { node: config.node },
  });

  buildConfig.config.preset &&
    presetCommand(buildConfig.config.preset, "prepare-package-json")?.(pkg);

  await Promise.all<any>([
    writeFile(
      resolve(cwd, paths.appEnvBuild, "package.json"),
      JSON.stringify(pkg)
    ),

    copyToBuild("package-lock.json"),

    // TODO: Generate from the config
    copyToBuild(".firebaserc"),

    writeFile(
      resolve(cwd, paths.appEnvBuild, "firebase.json"),
      JSON.stringify(firebaseJSON(buildConfig), null, 2)
    ),

    mode === "dev" &&
      config.functionsRuntimeConfigPath &&
      copyToBuild(config.functionsRuntimeConfigPath, ".runtimeconfig.json"),
  ]);

  return { pkg };
}

export interface FiremynaFirebaseJSON {
  hosting: {
    public: string;
    rewrites?: Array<{ source: string; function: string }>;
  };
  functions: {
    source: string;
  };
}

/**
 * Generates Firebase JSON for functions.
 *
 * @param buildConfig - the Firemyna build config
 * @returns Firebase JSON file
 */
function firebaseJSON(buildConfig: FiremynaBuildConfig): FiremynaFirebaseJSON {
  const json: FiremynaFirebaseJSON = {
    hosting: {
      public: "hosting",
    },

    functions: {
      source: ".",
    },
  };

  if (buildConfig.renderer) {
    json.hosting.rewrites = [
      {
        source: "/**",
        function: "renderer",
      },
    ];
  }

  return json;
}
