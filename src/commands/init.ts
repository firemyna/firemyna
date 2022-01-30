import { Command } from "@oclif/command";
import cli from "cli-ux";
import { writeFile } from "fs/promises";
import { resolve } from "path";
import { cwdFlag, formatFlag, nodeFlag, presetFlag } from "../cli/flags";
import { promptFormat } from "../cli/prompts";
import {
  defaultBasePaths,
  ensurePath,
  getConfigPath,
  getFunctionsSrcPath,
} from "../paths";
import { presetBasePaths } from "../presets/paths";
import { firemynaConfigTemplate, httpFunctionTemplate } from "../templates";

export default class Init extends Command {
  static description = "Init the Firemyna project";

  static flags = {
    cwd: cwdFlag,
    preset: presetFlag,
    node: nodeFlag,
    format: formatFlag,
  };

  async run() {
    const { flags } = this.parse(Init);
    // TODO: Fix the optional types in oclif
    const cwd: string | undefined = flags.cwd;
    const preset = flags.preset;
    const node = flags.node;
    const format = flags.format ?? (await promptFormat());
    const basePaths = preset ? presetBasePaths(preset) : defaultBasePaths();
    // TODO: Move resolve to the paths module
    const functionsSrcPath = resolve(cwd, getFunctionsSrcPath(basePaths.src));
    const configPath = resolve(cwd, getConfigPath(format));

    cli.action.start(`Initializing Firemyna with ${preset} preset`);

    // Also ensures cwd
    await ensurePath(functionsSrcPath);

    await Promise.all([
      writeFile(
        resolve(functionsSrcPath, `hello.${format}`),
        httpFunctionTemplate(format)
      ),

      writeFile(configPath, firemynaConfigTemplate(format, { preset, node })),
    ]);

    cli.action.stop();
  }
}
