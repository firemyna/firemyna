#!/usr/bin/env node

import { program } from "commander";
// import libraryPackageJSON from "../../package.json";
import {
  buildFunctions,
  FMPackageJSON,
  listDependencies,
  parseDependencies,
  watchListFunction,
} from "../functions";
import { readFile, writeFile, mkdir, rm, copyFile } from "fs/promises";
import { difference, flatten, remove, uniq } from "js-fns";
import { resolve, parse as parsePath, relative } from "path";
import cp, { ExecOptions } from "child_process";

// program.version(libraryPackageJSON.version);

program.option("--functions [functionsPath]", "Specify the functions path");

program.option("--out [buildPath]", "Specify the build path");

program
  .command("build")
  .description("build the Firebase project")
  .action(async () => {
    const options = program.opts();

    const buildPath = resolve(process.cwd(), options.out);
    const functionsBuildPath = resolve(buildPath, "functions");

    const functions = await buildFunctions({
      functionsPath: options.functions,
      functionsBuildPath,
    });

    await rm(buildPath, { recursive: true, force: true });
    await mkdir(functionsBuildPath, { recursive: true });

    await Promise.all(
      Object.values(functions).map((f) =>
        Promise.all(
          f.outputFiles?.map((file) => writeFile(file.path, file.text)) || []
        )
      )
    );

    function copyToBuild(name: string) {
      return copyFile(name, resolve(functionsBuildPath, name));
    }

    await Promise.all([
      copyToBuild("package.json"),

      copyToBuild("package-lock.json"),

      copyToBuild(".firebaserc"),

      writeFile(
        resolve(functionsBuildPath, "firebase.json"),
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
    ]);

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
  .action(async () => {
    const options = program.opts();

    const buildPath = resolve(process.cwd(), options.out);
    const functionsBuildPath = resolve(buildPath, "functions");

    watchListFunction({
      functionsPath: options.functions,
      functionsBuildPath,
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
