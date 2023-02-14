import { Command } from "@oclif/core";
import cp from "child_process";
import { BuildIncremental } from "esbuild";
import { parse as parsePath, resolve } from "path";
import { FiremynaBuildConfig, getBuildConfig } from "../../../build";
import { prepareBuild } from "../../../build/prepare";
import { loadConfig, resolveConfig } from "../../../config";
import { writeEsbuildFile } from "../../../esbuild";
import {
  buildFile,
  FiremynaFunction,
  stringifyFunctionsIndex,
  watchListFunction,
} from "../../../functions";
import { presetProjectPaths } from "../../../presets/paths";
import { configFlag, cwdFlag, projectFlag } from "../../flags";
import pc from "picocolors";
import { Formatter } from "picocolors/types";

export default class Dev extends Command {
  static description = "Starts the Firemyna development server";

  static flags = {
    cwd: cwdFlag,
    config: configFlag,
    project: projectFlag,
  };

  async run() {
    const { flags } = await this.parse(Dev);
    const { project } = flags;
    const cwd = resolve(flags.cwd);

    const config = await loadConfig(cwd, flags.config);
    if (!config) throw new Error("Can not find the Firemyna config file");
    const resolvedConfig = resolveConfig(config);

    const projectPaths = presetProjectPaths(
      config.preset,
      config.functionsPath
    );
    const buildConfig = getBuildConfig({
      mode: "dev",
      appEnv: "development",
      cwd,
      config: resolvedConfig,
      projectPaths,
      renderer: false,
    });

    await prepareBuild(buildConfig);

    const builds: Record<string, BuildIncremental> = {};
    let functions: FiremynaFunction[] = [];

    async function startBuilding(fn: FiremynaFunction) {
      const build = await incrementalBuild(buildConfig, fn);
      builds[fn.name] = build;
      await writeEsbuildFile(build);
    }

    async function buildIndex() {
      const indexContents = stringifyFunctionsIndex(functions, buildConfig);
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

          const firebaseChild = cp.spawn(
            "npx",
            (buildConfig.config.emulators
              ? ["firebase", "emulators:start"]
              : ["firebase", "serve", "--only", "functions"].concat(
                  config.hosting ? ["--only", "hosting"] : []
                )
            ).concat(project ? ["--project", project] : []),
            {
              cwd: resolve(buildConfig.cwd, buildConfig.paths.appEnvBuild),
              shell: true,
            }
          );

          logChild({
            child: firebaseChild,
            formatter: pc.yellow,
            label: "Firebase",
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
        const astroChild = cp.spawn("npx", ["astro", "dev"], {
          cwd: buildConfig.cwd,
          shell: true,
        });

        logChild({
          child: astroChild,
          formatter: pc.green,
          label: "Astro",
        });

        break;
      }

      case "cra": {
        const craChild = cp.spawn("npx", ["react-scripts", "start"], {
          cwd: buildConfig.cwd,
          shell: true,
        });

        logChild({
          child: craChild,
          formatter: pc.green,
          label: "Astro",
        });

        break;
      }

      case "vite": {
        const viteChild = cp.spawn("npx", ["vite"], {
          cwd: buildConfig.cwd,
          shell: true,
        });

        logChild({
          child: viteChild,
          formatter: pc.green,
          label: "Vite",
        });

        break;
      }

      case "remix": {
        const remixChild = cp.spawn("npx", ["remix", "dev"], {
          cwd: buildConfig.cwd,
          shell: true,
          env: { ...process.env, NODE_ENV: "development" },
        });

        logChild({ child: remixChild, formatter: pc.green, label: "Remix" });

        break;
      }

      case "next": {
        const remixChild = cp.spawn("npx", ["next", "dev"], {
          cwd: buildConfig.cwd,
          shell: true,
          env: { ...process.env, NODE_ENV: "development" },
        });

        logChild({ child: remixChild, formatter: pc.green, label: "Next.js" });

        break;
      }
    }
  }
}

interface LogChildProps {
  label: string;
  child: cp.ChildProcessWithoutNullStreams;
  formatter: Formatter;
}

function logChild({ label, child, formatter }: LogChildProps) {
  const paddedLabel = label.padStart(8, " ");
  const formattedLabel = paddedLabel + " | ";

  child.stdout.on("data", (data) => {
    console.log(pc.dim(formatter(formattedLabel)) + data.toString().trim());
  });

  child.stderr.on("data", (data) => {
    console.log(pc.red(formattedLabel) + data.toString().trim());
  });
}

async function incrementalBuild(
  buildConfig: FiremynaBuildConfig,
  fn: FiremynaFunction
) {
  const file = `${fn.name}.js`;
  return buildFile({
    file,
    input: {
      type: "entry",
      path: resolve(buildConfig.cwd, fn.path),
    },
    resolvePath: resolve(buildConfig.cwd, parsePath(fn.path).dir),
    bundle: true,
    buildConfig,
    incremental: true,
  });
}
