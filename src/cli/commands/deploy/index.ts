import { CliUx } from "@oclif/core";
import cp from "child_process";
import { resolve } from "path";
import { getBuildConfig } from "../../../build";
import { loadConfig, resolveConfig } from "../../../config";
import { presetProjectPaths } from "../../../presets/paths";
import Build from "../build";

export default class Deploy extends Build {
  static description = "Deploy the Firemyna project";

  async run() {
    await Build.prototype.run.call(this);

    // TODO: Reuse the config from the build command?

    const { flags } = await this.parse(Deploy);
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
      renderer: config.preset === "remix" || config.preset === "next",
    });

    CliUx.ux.log("Deploying the app...");

    const p = cp.spawn("npx", ["firebase", "deploy"], {
      cwd: resolve(buildConfig.cwd, buildConfig.paths.appEnvBuild),
      shell: true,
      stdio: "inherit",
      env: process.env,
    });

    await new Promise((resolve) => p.on("close", resolve));
  }
}
