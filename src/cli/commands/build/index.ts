import { Command } from "@oclif/core";
import cp from "child_process";
import { difference, flatten, remove, uniq } from "js-fns";
import { parse as parsePath } from "path";
import { promisify } from "util";
import { getBuildConfig } from "../../../build";
import { prepareBuildStruct } from "../../../build/prepare";
import { loadConfig, resolveConfig } from "../../../config";
import { writeEsbuildFile } from "../../../esbuild";
import {
  buildFunctions,
  listDependencies,
  parseDependencies,
} from "../../../functions";
import { presetProjectPaths } from "../../../presets/paths";
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
    const cwd = flags.cwd;

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
    });

    const [functions, { pkg }] = await Promise.all([
      buildFunctions(buildConfig),
      prepareBuildStruct(buildConfig),
    ]);

    await Promise.all(Object.values(functions).map(writeEsbuildFile));

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
            BUILD_PATH: buildConfig.paths.hosting.build,
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
  }
}
