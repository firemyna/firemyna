#!/usr/bin/env node

import cp, { ExecOptions } from "child_process";
import { Option, program } from "commander";
import { BuildIncremental, BuildResult } from "esbuild";
import { copyFile, mkdir, readFile, rm, writeFile } from "fs/promises";
import { difference, flatten, remove, uniq } from "js-fns";
import { parse as parsePath, resolve } from "path";
import {
  FiremynaAppEnv,
  FiremynaConfigResolved,
  FiremynaMode,
  FiremynaPreset,
  tryLoadConfig as loadConfig,
} from "../config";
import {
  buildFile,
  buildFunctions,
  FiremynaFunction,
  FiremynaPackageJSON,
  listDependencies,
  parseDependencies,
  stringifyFunctionsIndex,
  watchListFunction,
} from "../functions";
import {
  getBuildEnvPath,
  getFunctionsBuildPath,
  getHostingBuildPath,
} from "../paths";

program.option("--functions [path/to/functions]", "Specify the functions path");

program.option("--build [path/to/build]", "Specify the build path");

program.option("--config [path/to/config.ts]", "Specify the config path");

const presetOption = new Option(
  "--preset <preset>",
  "The preset to use"
).choices(["astro", "cra", "vite", "next"]);

program.addOption(presetOption);

async function getConfig(appEnv: FiremynaAppEnv, commandOptions: any) {
  const cliOptions = {
    ...program.opts(),
    ...commandOptions,
  };

  const loadedConfig = await loadConfig(cliOptions.config);

  const preset =
    (cliOptions.preset as FiremynaPreset | undefined) || loadedConfig?.preset;

  const config: FiremynaConfigResolved = preset
    ? presetConfig(appEnv, preset)
    : defaultConfig(appEnv);

  if (preset) config.preset = preset;

  if (cliOptions.build)
    config.buildPath = resolve(process.cwd(), cliOptions.build);

  if (cliOptions.functions)
    config.functionsPath = resolve(process.cwd(), cliOptions.functions);

  if (cliOptions.config)
    config.functionsRuntimeConfigPath = commandOptions.config;

  return { config: config as FiremynaConfigResolved, cliOptions };
}

program
  .command("build")
  .description("build the Firebase project")
  .action(async (commandOptions) => {
    const { config } = await getConfig("build", commandOptions);

    const [functions, { pkg }] = await Promise.all([
      buildFunctions(config),
      prepareBuild("build", config),
    ]);

    await Promise.all(Object.values(functions).map(writeBuild));

    const sourceDeps = uniq(
      flatten(
        Object.values(functions).map((f) =>
          parseDependencies(
            f.outputFiles?.find(
              (output) => parsePath(output.path).ext === ".js"
            )?.text || ""
          )
        )
      )
    );
    const deps = listDependencies(pkg);
    const unusedDeps = remove(difference(deps, sourceDeps), "firebase-admin");

    await exec(`npm uninstall --package-lock-only ${unusedDeps.join(" ")}`, {
      cwd: config.buildPath,
    });

    switch (config.preset) {
      case "astro": {
        cp.spawn("npx", ["astro", "build"], {
          shell: true,
          stdio: "inherit",
        });
        break;
      }

      case "cra": {
        cp.spawn("npx", ["react-scripts", "build"], {
          shell: true,
          stdio: "inherit",
          env: {
            ...process.env,
            BUILD_PATH: getHostingBuildPath(config.buildPath),
          },
        });
        break;
      }

      case "vite": {
        cp.spawn("npx", ["vite", "build"], {
          shell: true,
          stdio: "inherit",
        });
        break;
      }
    }
  });

program
  .command("start")
  .description("start the Firebase project")
  .option("--config [runtimeConfig]", "Specify the path to runtime config")
  .action(async (commandOptions) => {
    const { config } = await getConfig("watch", commandOptions);

    await prepareBuild("watch", config);

    const builds: Record<string, BuildIncremental> = {};
    let functions: FiremynaFunction[] = [];

    async function startBuilding(fn: FiremynaFunction) {
      const build = await incrementalBuild(config, fn);
      builds[fn.name] = build;
      await writeBuild(build);
    }

    async function buildIndex() {
      const indexContents = stringifyFunctionsIndex(functions, config);
      const build = await buildFile({
        file: "index.js",
        buildPath: getFunctionsBuildPath(config.buildPath),
        input: {
          type: "contents",
          contents: indexContents,
        },
        resolvePath: config.functionsPath,
        buildConfig: config,
      });
      return writeBuild(build);
    }

    watchListFunction(config, async (event) => {
      switch (event.type) {
        case "initial": {
          functions = event.functions;

          await Promise.all([
            Promise.all(event.functions.map(startBuilding)),
            buildIndex(),
          ]);

          cp.spawn("npx", ["firebase", "serve", "--only", "functions"], {
            cwd: config.buildPath,
            shell: true,
            stdio: "inherit",
          });

          return;
        }

        case "add": {
          functions.push(event.function);
          await startBuilding(event.function);
          return buildIndex();
        }

        case "change": {
          const build = await builds[event.function.name]?.rebuild();
          return writeBuild(build);
        }

        case "unlink": {
          functions = functions.filter((fn) => fn.name !== event.function.name);
          builds[event.function.name]?.rebuild.dispose();
          delete builds[event.function.name];
          return buildIndex();
        }
      }
    });

    switch (config.preset) {
      case "astro": {
        cp.spawn("npx", ["astro", "dev"], {
          shell: true,
          stdio: "inherit",
        });
        break;
      }

      case "cra": {
        cp.spawn("npx", ["react-scripts", "start"], {
          shell: true,
          stdio: "inherit",
        });
        break;
      }

      case "vite": {
        cp.spawn("npx", ["vite"], {
          shell: true,
          stdio: "inherit",
        });
        break;
      }
    }
  });

program.parse();

function presetConfig(
  appEnv: FiremynaAppEnv,
  preset: FiremynaPreset
): FiremynaConfigResolved {
  switch (preset) {
    case "astro":
      return {
        functionsPath: "src/functions",
        buildPath: getBuildEnvPath(appEnv, "dist"),
      };

    case "cra":
      return {
        functionsPath: "src/functions",
        buildPath: getBuildEnvPath(appEnv, "build"),
      };

    case "vite":
      return {
        functionsPath: "src/functions",
        buildPath: getBuildEnvPath(appEnv, "dist"),
      };
  }
}

function defaultConfig(appEnv: FiremynaAppEnv) {
  return {
    functionsPath: "app/functions",
    buildPath: getBuildEnvPath(appEnv, "build"),
  };
}

function exec(cmd: string, args: ExecOptions) {
  return new Promise((resolve, reject) => {
    cp.exec(cmd, args, (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve(stdout || stderr);
    });
  });
}

async function prepareBuild(
  mode: FiremynaMode,
  config: FiremynaConfigResolved
) {
  await rm(config.buildPath, { recursive: true, force: true });
  await mkdir(getFunctionsBuildPath(config.buildPath), { recursive: true });

  function copyToBuild(name: string, out?: string) {
    return copyFile(name, resolve(config.buildPath, out || name));
  }

  const pkg: FiremynaPackageJSON = JSON.parse(
    await readFile("package.json", "utf8")
  );

  Object.assign(pkg, {
    main: "functions/index.js",
    engines: {
      // TODO: Derive from the config
      node: "14",
    },
  });

  await Promise.all<any>([
    writeFile(resolve(config.buildPath, "package.json"), JSON.stringify(pkg)),

    copyToBuild("package-lock.json"),

    copyToBuild(".firebaserc"),

    writeFile(
      resolve(config.buildPath, "firebase.json"),
      JSON.stringify(
        {
          hosting: {
            public: "hosting",
          },

          functions: {
            source: ".",
          },
        },
        null,
        2
      )
    ),

    mode === "watch" &&
      config.functionsRuntimeConfigPath &&
      copyToBuild(config.functionsRuntimeConfigPath, ".runtimeconfig.json"),
  ]);

  return { pkg };
}

function writeBuild(build: BuildIncremental | BuildResult | undefined) {
  return Promise.all(
    build?.outputFiles?.map((file) => writeFile(file.path, file.text)) || []
  );
}

async function incrementalBuild(
  config: FiremynaConfigResolved,
  fn: FiremynaFunction
) {
  const file = `${fn.name}.js`;
  return buildFile({
    file,
    buildPath: getFunctionsBuildPath(config.buildPath),
    input: { type: "entry", path: fn.path },
    resolvePath: parsePath(fn.path).dir,
    bundle: true,
    buildConfig: config,
    incremental: true,
  });
}
