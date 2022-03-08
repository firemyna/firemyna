import { CliUx, Command } from "@oclif/core";
import cp from "child_process";
import { difference, flatten, remove, uniq } from "js-fns";
import { parse as parsePath, resolve } from "path";
import { promisify } from "util";
import { getBuildConfig } from "../../../build";
import { prepareBuildStruct } from "../../../build/prepare";
import { loadConfig, resolveConfig } from "../../../config";
import { writeEsbuildFile } from "../../../esbuild";
import {
  buildFile,
  buildFunctions,
  listDependencies,
  parseDependencies,
} from "../../../functions";
import { presetCommand } from "../../../presets";
import { presetProjectPaths } from "../../../presets/paths";
import { remixRenderer } from "../../../presets/renderer";
import { configFlag, cwdFlag } from "../../flags";

const exec = promisify(cp.exec);

export default class Build extends Command {
  static description = "Build the Firemyna project";

  static flags = {
    cwd: cwdFlag,
    config: configFlag,
  };

  async run() {
    const { flags } = await this.parse(Build);
    const cwd = resolve(flags.cwd);

    const config = await loadConfig(cwd, flags.config);
    if (!config) throw new Error("Can not find the Firemyna config file");
    const resolvedConfig = resolveConfig(config);

    const projectPaths = presetProjectPaths(config.preset);
    const buildConfig = getBuildConfig({
      mode: "build",
      appEnv: "production",
      cwd,
      config: resolvedConfig,
      projectPaths,
      renderer: config.preset === "remix",
    });

    CliUx.ux.action.start("Building the app");

    const [functions, { pkg }, rendererResult] = await Promise.all([
      buildFunctions(buildConfig).then(async (functions) => {
        await Promise.all(Object.values(functions).map(writeEsbuildFile));
        return functions;
      }),

      prepareBuildStruct(buildConfig),

      config.preset === "remix" &&
        (await exec("npx remix build", {
          cwd: buildConfig.cwd,
          env: { ...process.env, NODE_ENV: "production" },
        }).then(async () => {
          const build = await buildFile({
            file: "renderer.js",
            input: {
              type: "contents",
              contents: remixRenderer(),
            },
            resolvePath: resolve(
              buildConfig.cwd,
              buildConfig.paths.functions.build
            ),
            buildConfig,
          });

          await writeEsbuildFile(build);

          await exec(
            `rsync --recursive --prune-empty-dirs --exclude=build/* public/* ${buildConfig.paths.hosting.build}`,
            { cwd: resolve(buildConfig.cwd) }
          );

          return build;
        })),
    ]);

    CliUx.ux.action.stop();

    CliUx.ux.action.start("Cleaning npm dependencies");

    const sourceDeps = uniq(
      flatten(
        Object.values(functions)
          .concat(rendererResult || [])
          .map((f) =>
            parseDependencies(
              f.outputFiles?.find(
                (output) => parsePath(output.path).ext === ".js"
              )?.text || ""
            )
          )
      )
    ).concat(
      (config.preset &&
        (await presetCommand(
          config.preset,
          "list-source-dependencies"
        )?.(buildConfig))) ||
        []
    );
    const deps = listDependencies(pkg);
    const unusedDeps = remove(difference(deps, sourceDeps), "firebase-admin");

    await exec(`npm uninstall --package-lock-only ${unusedDeps.join(" ")}`, {
      cwd: resolve(buildConfig.cwd, buildConfig.paths.appEnvBuild),
    });

    CliUx.ux.action.stop();

    switch (config.preset) {
      case "astro": {
        cp.spawn("npx", ["astro", "build"], {
          cwd: buildConfig.cwd,
          shell: true,
          stdio: "inherit",
        });
        break;
      }

      case "cra": {
        cp.spawn("npx", ["react-scripts", "build"], {
          cwd: buildConfig.cwd,
          shell: true,
          stdio: "inherit",
          env: {
            ...process.env,
            BUILD_PATH: buildConfig.paths.hosting.build,
          },
        });
        break;
      }

      case "vite": {
        cp.spawn("npx", ["vite", "build"], {
          cwd: buildConfig.cwd,
          shell: true,
          stdio: "inherit",
        });
        break;
      }
    }
  }
}