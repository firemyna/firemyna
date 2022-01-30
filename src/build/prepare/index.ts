import { copyFile, mkdir, readFile, rm, writeFile } from "fs/promises";
import { resolve } from "path";
import { FiremynaBuildConfig } from "..";
import { FiremynaPackageJSON } from "../../functions";
import { getFunctionsBuildPath } from "../../paths";

export async function prepareBuildStruct({
  mode,
  cwd,
  node,
  buildEnvPath,
  runtimeConfigPath,
}: FiremynaBuildConfig) {
  await rm(resolve(cwd, buildEnvPath.toString()), {
    recursive: true,
    force: true,
  });
  await mkdir(resolve(cwd, getFunctionsBuildPath(buildEnvPath)), {
    recursive: true,
  });

  function copyToBuild(name: string, out?: string) {
    return copyFile(
      resolve(cwd, name),
      resolve(cwd, buildEnvPath, out || name)
    );
  }

  const pkg: FiremynaPackageJSON = JSON.parse(
    await readFile(resolve(cwd, "package.json"), "utf8")
  );

  Object.assign(pkg, {
    // TODO: Get from paths
    main: "functions/index.js",
    engines: { node },
  });

  await Promise.all<any>([
    writeFile(resolve(cwd, buildEnvPath, "package.json"), JSON.stringify(pkg)),

    copyToBuild("package-lock.json"),

    // TODO: Generate from the config
    copyToBuild(".firebaserc"),

    writeFile(
      resolve(cwd, buildEnvPath, "firebase.json"),
      JSON.stringify(firebaseJSON(), null, 2)
    ),

    mode === "watch" &&
      runtimeConfigPath &&
      copyToBuild(runtimeConfigPath, ".runtimeconfig.json"),
  ]);

  return { pkg };
}

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
