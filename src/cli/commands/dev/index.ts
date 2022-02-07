import { Command } from "@oclif/core";
import cp from "child_process";
import { BuildIncremental } from "esbuild";
import { parse as parsePath } from "path";
import { FiremynaBuildConfig, getBuildConfig } from "../../../build";
import { prepareBuildStruct } from "../../../build/prepare";
import { loadConfig, resolveConfig } from "../../../config";
import { writeEsbuildFile } from "../../../esbuild";
import {
  buildFile,
  FiremynaFunction,
  stringifyFunctionsIndex,
  watchListFunction,
} from "../../../functions";
import { presetProjectPaths } from "../../../presets/paths";
import { configFlag, cwdFlag } from "../../flags";

export default class Dev extends Command {
  static description = "Starts the Firemyna development server";

  static flags = {
    cwd: cwdFlag,
    config: configFlag,
  };

  async run() {
    const { flags } = await this.parse(Dev);
    const cwd = flags.cwd;

    const config = await loadConfig(cwd, flags.config);
    if (!config) throw new Error("Can not find the Firemyna config file");
    const resolvedConfig = resolveConfig(config);

    const projectPaths = presetProjectPaths(config.preset);
    const buildConfig = getBuildConfig({
      mode: "dev",
      appEnv: "development",
      cwd,
      config: resolvedConfig,
      projectPaths,
    });

    await prepareBuildStruct(buildConfig);

    const builds: Record<string, BuildIncremental> = {};
    let functions: FiremynaFunction[] = [];

    async function startBuilding(fn: FiremynaFunction) {
      const build = await incrementalBuild(buildConfig, fn);
      builds[fn.name] = build;
      await writeEsbuildFile(build);
    }

    async function buildIndex() {
      const indexContents = stringifyFunctionsIndex(functions, resolvedConfig);
      const build = await buildFile({
        file: "index.js",
        input: {
          type: "contents",
          contents: indexContents,
        },
        resolvePath: buildConfig.paths.functions.src,
        buildConfig,
      });
      return writeEsbuildFile(build);
    }

    watchListFunction(buildConfig, async (event) => {
      switch (event.type) {
        case "initial": {
          functions = event.functions;

          await Promise.all([
            Promise.all(event.functions.map(startBuilding)),
            buildIndex(),
          ]);

          cp.spawn("npx", ["firebase", "serve", "--only", "functions"], {
            cwd: buildConfig.paths.appEnvBuild,
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
          return writeEsbuildFile(build);
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
  }
}

async function incrementalBuild(
  config: FiremynaBuildConfig,
  fn: FiremynaFunction
) {
  const file = `${fn.name}.js`;
  return buildFile({
    file,
    input: { type: "entry", path: fn.path },
    resolvePath: parsePath(fn.path).dir,
    bundle: true,
    buildConfig: config,
    incremental: true,
  });
}
