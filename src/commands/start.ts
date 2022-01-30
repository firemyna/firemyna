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

export default class Start extends Command {
  static description = "describe the command here";

  static flags = {
    cwd: cwdFlag,
    node: nodeFlag,
    preset: presetFlag,
    format: formatFlag,
    config: configFlag,
  };

  async run() {
    const { flags } = this.parse(Start);
    const buildConfig = getBuildConfig("watch", flags);

    await prepareBuildStruct(buildConfig);
  }
}
