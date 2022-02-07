import { copyFile, mkdir, readFile, rm, writeFile } from "fs/promises";
import { resolve } from "path";
import { FiremynaBuildConfig } from "..";
import { FiremynaPackageJSON } from "../../functions";
import { getFunctionsBuildPath } from "../../paths";

/**
 * Generates Firebase build structure.
 */
export interface FiremynaBuildStruct {
  /** The parsed package.json */
  pkg: FiremynaPackageJSON;
}

/**
 * Prepares the build structure.
 * @returns promise to the operation complete
 */
export async function prepareBuildStruct({
  mode,
  cwd,
  config,
  paths,
}: FiremynaBuildConfig) {
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

  const pkg: FiremynaPackageJSON = JSON.parse(
    await readFile(resolve(cwd, "package.json"), "utf8")
  );

  Object.assign(pkg, {
    // TODO: Get from paths
    main: "functions/index.js",
    engines: { node: config.node },
  });

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
      JSON.stringify(firebaseJSON(), null, 2)
    ),

    mode === "dev" &&
      config.functionsRuntimeConfigPath &&
      copyToBuild(config.functionsRuntimeConfigPath, ".runtimeconfig.json"),
  ]);

  return { pkg };
}

/**
 * Generates Firebase JSON for functions.
 * @returns Firebase JSON file
 */
function firebaseJSON() {
  return {
    hosting: {
      public: "hosting",
    },

    functions: {
      source: ".",
    },
  };
}
