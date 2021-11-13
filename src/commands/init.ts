import { Command } from "@oclif/command";
import cli from "cli-ux";
import { writeFile } from "fs/promises";
import { resolve } from "path";
import { cwdFlag, formatFlag, moduleFlag, presetFlag } from "../cli/flags";
import { promptFormat } from "../cli/prompts";
import { ensurePath, getConfigPath, getFunctionsSrcPath } from "../paths";
import { presetPaths } from "../presets";
import { firemynaConfigTemplate, httpFunctionTemplate } from "../templates";

export default class Init extends Command {
  static description = "Init Firemyna project";

  static flags = {
    cwd: cwdFlag,
    preset: { ...presetFlag, required: true },
    format: formatFlag,
    module: moduleFlag,
  };

  async run() {
    const { flags } = this.parse(Init);
    const cwd = flags.cwd;
    const preset = flags.preset;
    const module = flags.module;
    const format = flags.format ?? (await promptFormat());
    const paths = presetPaths(flags.preset);

    cli.action.start(`Initializing Firemyna with ${preset} preset`);

    await Promise.all([
      writeFile(
        await ensurePath(
          resolve(cwd, getFunctionsSrcPath(paths.src), `hello.${format}`)
        ),
        httpFunctionTemplate({ format, module })
      ),

      writeFile(
        await ensurePath(resolve(cwd, getConfigPath(format))),
        firemynaConfigTemplate(format, preset)
      ),
    ]);

    cli.action.stop();
  }
}
