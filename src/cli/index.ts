#!/usr/bin/env node

import { Option, program } from "commander";
// import libraryPackageJSON from "../../package.json";
import {
  buildFile,
  buildFunctions,
  FMFunction,
  FMMode,
  FMOptions,
  FMPackageJSON,
  listDependencies,
  parseDependencies,
  stringifyFunctionsIndex,
  watchListFunction,
} from "../functions";
import { readFile, writeFile, mkdir, rm, copyFile } from "fs/promises";
import { difference, flatten, remove, uniq } from "js-fns";
import { resolve, parse as parsePath, relative } from "path";
import cp, { ExecOptions } from "child_process";
import { BuildIncremental, BuildResult } from "esbuild";
import {
  getFunctionBuildPath,
  getHostingBuildPath,
  getModeBuildPath,
} from "../options";
import { httpFunctionTemplate } from "../templates";

// program.version(libraryPackageJSON.version);

program.option("--functions [functionsPath]", "Specify the functions path");

program.option("--build [buildPath]", "Specify the build path");

program.addOption(
  new Option("--preset <preset>", "The preset to use").choices([
    "astro",
    "cra",
    "vite",
    "next",
  ])
);

function getOptions(mode: FMMode, commandOptions: any) {
  const cliOptions = {
    ...program.opts(),
    ...commandOptions,
  };

  const options = presetOptions(mode, cliOptions.preset);

  if (cliOptions.build)
    options.buildPath = resolve(process.cwd(), cliOptions.build);

  if (cliOptions.functions)
    options.functionsPath = resolve(process.cwd(), cliOptions.functions);

  if (cliOptions.config)
    options.functionsRuntimeConfigPath = commandOptions.config;

  return { options, cliOptions };
}

program
  .command("build")
  .description("build the Firebase project")
  .action(async (commandOptions) => {
    const { options, cliOptions } = getOptions("build", commandOptions);

    const [functions, { pkg }] = await Promise.all([
      buildFunctions(options),
      prepareBuild(options),
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
      cwd: options.buildPath,
    });

    switch (cliOptions.preset) {
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
            BUILD_PATH: getHostingBuildPath(options.buildPath),
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
    const { options, cliOptions } = getOptions("watch", commandOptions);

    await prepareBuild(options);

    const builds: Record<string, BuildIncremental> = {};
    let functions: FMFunction[] = [];

    async function startBuilding(fn: FMFunction) {
      const build = await incrementalBuild(options, fn);
      builds[fn.name] = build;
      await writeBuild(build);
    }

    async function buildIndex() {
      const indexContents = stringifyFunctionsIndex(functions, options);
      const build = await buildFile({
        file: "index.js",
        buildPath: getFunctionBuildPath(options.buildPath),
        input: {
          type: "contents",
          contents: indexContents,
        },
        resolvePath: options.functionsPath,
        options,
      });
      return writeBuild(build);
    }

    watchListFunction(options, async (event) => {
      switch (event.type) {
        case "initial": {
          functions = event.functions;

          await Promise.all([
            Promise.all(event.functions.map(startBuilding)),
            buildIndex(),
          ]);

          cp.spawn("npx", ["firebase", "serve", "--only", "functions"], {
            cwd: options.buildPath,
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

    switch (cliOptions.preset) {
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

program
  .command("init")
  .description("init a Firebase project")
  .action(async (commandOptions) => {
    const { options } = getOptions("build", commandOptions);

    await mkdir(options.functionsPath, { recursive: true });

    await writeFile(
      resolve(options.functionsPath, "hello.ts"),
      httpFunctionTemplate({
        // TODO: Get it from the options
        type: "ts",
        module: "esm",
      })
    );
  });

program.parse();

export type FMPreset = "astro" | "cra" | "vite" | "next";

function presetOptions(mode: FMMode, preset: FMPreset): FMOptions {
  switch (preset) {
    case "astro":
      return {
        mode,
        functionsPath: "src/functions",
        buildPath: getModeBuildPath(mode, "dist"),
      };

    case "cra":
      return {
        mode,
        functionsPath: "src/functions",
        buildPath: getModeBuildPath(mode, "build"),
      };

    case "vite":
      return {
        mode,
        functionsPath: "src/functions",
        buildPath: getModeBuildPath(mode, "dist"),
      };

    case "next":
      // @ts-ignore TODO
      return {};
  }
}

function exec(cmd: string, args: ExecOptions) {
  return new Promise((resolve, reject) => {
    cp.exec(cmd, args, (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve(stdout || stderr);
    });
  });
}

async function prepareBuild(options: FMOptions) {
  await rm(options.buildPath, { recursive: true, force: true });
  await mkdir(getFunctionBuildPath(options.buildPath), { recursive: true });

  function copyToBuild(name: string, out?: string) {
    return copyFile(name, resolve(options.buildPath, out || name));
  }

  const pkg: FMPackageJSON = JSON.parse(await readFile("package.json", "utf8"));

  Object.assign(pkg, {
    main: "functions/index.js",
    engines: {
      // TODO: Derive from the options
      node: "14",
    },
  });

  await Promise.all<any>([
    writeFile(resolve(options.buildPath, "package.json"), JSON.stringify(pkg)),

    copyToBuild("package-lock.json"),

    copyToBuild(".firebaserc"),

    writeFile(
      resolve(options.buildPath, "firebase.json"),
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

    options.mode === "watch" &&
      options.functionsRuntimeConfigPath &&
      copyToBuild(options.functionsRuntimeConfigPath, ".runtimeconfig.json"),
  ]);

  return { pkg };
}

function writeBuild(build: BuildIncremental | BuildResult | undefined) {
  return Promise.all(
    build?.outputFiles?.map((file) => writeFile(file.path, file.text)) || []
  );
}

async function incrementalBuild(options: FMOptions, fn: FMFunction) {
  const file = `${fn.name}.js`;
  return buildFile({
    file,
    buildPath: getFunctionBuildPath(options.buildPath),
    input: { type: "entry", path: fn.path },
    resolvePath: parsePath(fn.path).dir,
    bundle: true,
    options,
    incremental: true,
  });
}
