#!/usr/bin/env node

import { program } from "commander";
// import libraryPackageJSON from "../../package.json";
import {
  buildFile,
  buildFunctions,
  FMFunction,
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

// program.version(libraryPackageJSON.version);

program.option("--functions [functionsPath]", "Specify the functions path");

program.option("--out [buildPath]", "Specify the build path");

program
  .command("build")
  .description("build the Firebase project")
  .action(async () => {
    const cliOptions = program.opts();

    const buildPath = resolve(process.cwd(), cliOptions.out);
    const functionsBuildPath = resolve(buildPath, "functions");

    const options: FMOptions = {
      mode: "build",
      functionsPath: cliOptions.functions,
      functionsBuildPath,
    };

    const [functions] = await Promise.all([
      buildFunctions(options),
      prepareFunctionsBuild(options),
    ]);

    await Promise.all(Object.values(functions).map(writeBuild));

    // TODO: Set the main field in package.json

    const packageJSON: FMPackageJSON = JSON.parse(
      await readFile(resolve(functionsBuildPath, "package.json"), "utf8")
    );

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
    const deps = listDependencies(packageJSON);
    const unusedDeps = remove(difference(deps, sourceDeps), "firebase-admin");

    await exec(`npm uninstall --package-lock-only ${unusedDeps.join(" ")}`, {
      cwd: functionsBuildPath,
    });
  });

program
  .command("watch")
  .description("watch the Firebase project")
  .option("--config [runtimeConfig]", "Specify the path to runtime config")
  .action(async (commandOptions) => {
    const cliOptions = program.opts();
    const buildPath = resolve(process.cwd(), cliOptions.out);
    const functionsBuildPath = resolve(buildPath, "functions");

    const options: FMOptions = {
      mode: "watch",
      functionsPath: cliOptions.functions,
      functionsBuildPath,
      functionsRuntimeConfigPath: commandOptions.config,
    };

    await prepareFunctionsBuild(options);

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
        buildPath: options.functionsBuildPath,
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
          return Promise.all([
            Promise.all(event.functions.map(startBuilding)),
            buildIndex(),
          ]);
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
  });

program.parse();

function exec(cmd: string, args: ExecOptions) {
  return new Promise((resolve, reject) => {
    cp.exec(cmd, args, (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve(stdout || stderr);
    });
  });
}

async function prepareFunctionsBuild(options: FMOptions) {
  await rm(options.functionsBuildPath, { recursive: true, force: true });
  await mkdir(options.functionsBuildPath, { recursive: true });

  function copyToBuild(name: string, out?: string) {
    return copyFile(name, resolve(options.functionsBuildPath, out || name));
  }

  return Promise.all<any>([
    copyToBuild("package.json"),

    copyToBuild("package-lock.json"),

    copyToBuild(".firebaserc"),

    writeFile(
      resolve(options.functionsBuildPath, "firebase.json"),
      JSON.stringify(
        {
          functions: {
            source: ".",
            // TODO: Derive from the options?
            runtime: "nodejs14",
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
    buildPath: options.functionsBuildPath,
    input: { type: "entry", path: fn.path },
    resolvePath: parsePath(fn.path).dir,
    bundle: true,
    options,
    incremental: true,
  });
}
