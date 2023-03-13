import { CliUx } from "@oclif/core";
import cp from "child_process";
import { resolve } from "path";
import Build from "../build";
import { tokenFlag } from "../../flags";

export default class Deploy extends Build {
  static description = "Deploy the Firemyna project";

  static flags = {
    ...Build.flags,
    token: tokenFlag,
  };

  async run() {
    const buildConfig = await Build.prototype.run.call(this);

    const { flags } = await this.parse(Deploy);
    const token = flags.token;

    CliUx.ux.log("Deploying the app...");

    const p = cp.spawn(
      "npx",
      ["firebase", "deploy"]
        // Assign Firebase project
        .concat(buildConfig.project ? ["--project", buildConfig.project] : [])
        // Assign Firebase token for CI
        // TODO: Remove with the next Firebase Tools
        .concat(token ? ["--token", token] : [])
        // Force deploy (removal of functions)
        .concat(buildConfig.config.deploy?.forced ? ["--force"] : []),
      {
        cwd: resolve(buildConfig.cwd, buildConfig.paths.appEnvBuild),
        shell: true,
        stdio: "inherit",
        env: process.env,
      }
    );

    p.on("exit", (exit) => exit && process.exit(exit));

    await new Promise((resolve) => p.on("close", resolve));

    return buildConfig;
  }
}
