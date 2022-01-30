import { Command, flags } from "@oclif/command";
import { getBuildConfig } from "../build";
import { prepareBuildStruct } from "../build/prepare";
import {
  configFlag,
  cwdFlag,
  formatFlag,
  nodeFlag,
  presetFlag,
} from "../cli/flags";
import { FiremynaPreset, loadConfig } from "../config";
import { buildFunctions } from "../functions";
import { defaultBasePaths } from "../paths";
import { presetBasePaths } from "../presets/paths";

export default class Build extends Command {
  static description = "Build the Firemyna project";

  static flags = {
    cwd: cwdFlag,
    preset: presetFlag,
    node: nodeFlag,
    format: formatFlag,
    config: configFlag,
  };

  async run() {
    const { flags } = this.parse(Build);
    // TODO: Fix the optional types in oclif
    const cwd: string | undefined = flags.cwd;
    const node = flags.node;
    const format = flags.format ?? (await promptFormat());
    // const paths = presetBasePaths(flags.preset);

    // TODO: Use cwd to resolve the config
    const config = await loadConfig(flags.config);
    const preset = flags.preset || config?.preset;

    const basePaths = preset ? presetBasePaths(preset) : defaultBasePaths();

    const buildConfig = getBuildConfig({
      appEnv: "production",
      cwd: flags.cwd,
      basePaths,
      node: config.node,
    });

    const [functions, { pkg }] = await Promise.all([
      buildFunctions(buildConfig),

      prepareBuildStruct(buildConfig),
    ]);

    await Promise.all(Object.values(functions).map(writeBuild));
  }
}
