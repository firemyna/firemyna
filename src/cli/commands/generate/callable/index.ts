import { CliUx, Command } from "@oclif/core";
import { writeFile } from "fs/promises";
import { relative } from "path";
import { cyan, underline } from "picocolors";
import { loadConfig, resolveConfig } from "../../../../config";
import { getFunctionSourcePath, getPaths } from "../../../../paths";
import { presetProjectPaths } from "../../../../presets/paths";
import {
  callableFunctionTemplate,
  httpFunctionTemplate,
} from "../../../../templates";
import {
  configFlag,
  cookieFlag,
  corsFlag,
  cwdFlag,
  memoryFlag,
  regionFlag,
} from "../../../flags";

export default class GenerateCallable extends Command {
  static aliases = ["g:callable"];

  static description = "Generates a callable function";

  static args = [
    {
      name: "functionName",
      description: "Name of the function",
      required: true,
    },
  ];

  static flags = {
    cwd: cwdFlag,
    config: configFlag,
    memory: memoryFlag,
    region: regionFlag,
  };

  async run() {
    const { args, flags } = await this.parse(GenerateCallable);

    const name = args.functionName;
    const cwd = flags.cwd;

    const config = await loadConfig(cwd, flags.config);
    if (!config) throw new Error("Can not find the Firemyna config file");
    const resolvedConfig = resolveConfig(config);
    const { format } = resolvedConfig;

    const projectPaths = presetProjectPaths(config.preset);
    const paths = getPaths({ appEnv: "development", cwd, projectPaths });

    CliUx.ux.action.start("Generating a callable function");

    const functionPath = getFunctionSourcePath({
      name,
      format,
      paths,
    });

    const relativePath = relative(process.cwd(), functionPath);

    await writeFile(
      functionPath,
      callableFunctionTemplate({
        name,
        format,
        memory: flags.memory,
        region: flags.region,
      })
    );

    CliUx.ux.action.stop();

    CliUx.ux.info(
      `Generated ${name} function at ${cyan(underline(relativePath))}`
    );
  }
}
