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
    const buildConfig = await Build.prototype.run.call(this);

    CliUx.ux.log("Deploying the app...");

    const p = cp.spawn(
      "npx",
      ["firebase", "deploy"].concat(
        buildConfig.project ? ["--project", buildConfig.project] : []
      ),
      {
        cwd: resolve(buildConfig.cwd, buildConfig.paths.appEnvBuild),
        shell: true,
        stdio: "inherit",
        env: process.env,
      }
    );

    await new Promise((resolve) => p.on("close", resolve));

    return buildConfig;
  }
}
