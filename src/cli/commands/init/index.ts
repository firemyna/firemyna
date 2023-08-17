import { CliUx, Command } from "@oclif/core";
import { writeFile } from "fs/promises";
import { resolve } from "path";
import { FiremynaConfigResolved } from "../../../config";
import { getConfigFileName } from "../../../config/paths";
import { ensurePath, getFunctionSourcePath, getPaths } from "../../../paths";
import { presetProjectPaths } from "../../../presets/paths";
import {
  firemynaConfigTemplate,
  httpFunctionTemplate,
} from "../../../templates";
import {
  configFlag,
  cwdFlag,
  formatFlag,
  functionsFlag,
  nodeFlag,
  presetFlag,
} from "../../flags";
import { promptFormat, promptFunctions } from "../../prompts";

export default class Init extends Command {
  static description = "Init the Firemyna project";

  static flags = {
    cwd: cwdFlag,
    preset: presetFlag,
    node: nodeFlag,
    format: formatFlag,
    config: configFlag,
    functions: functionsFlag,
  };

  async run() {
    const { flags } = await this.parse(Init);
    const cwd = flags.cwd;
    const node = flags.node;
    const preset = flags.preset;
    const format = flags.format ?? (await promptFormat());
    const functionsPath = flags.functions ?? (await promptFunctions());
    const configPath = flags.config || getConfigFileName(format);

    const projectPaths = presetProjectPaths(preset, functionsPath);
    const paths = getPaths({ appEnv: "development", cwd, projectPaths });

    CliUx.ux.action.start(
      `Initializing Firemyna` +
        (preset ? ` with ${preset} preset` : "") +
        ` at ${cwd}`
    );

    // Ensure the functions source code directory as well as cwd exist.
    await ensurePath(cwd, paths.functions.src);

    const config: FiremynaConfigResolved = { format, node };
    if (preset) config.preset = preset;
    else config.functionsPath = functionsPath;

    await Promise.all([
      // Generate demo function
      writeFile(
        getFunctionSourcePath({ name: "hello", format, paths }),
        await httpFunctionTemplate({ name: "hello", format })
      ),

      // Generate the Firemyna config
      writeFile(resolve(cwd, configPath), await firemynaConfigTemplate(config)),
    ]);

    CliUx.ux.action.stop();
  }
}
