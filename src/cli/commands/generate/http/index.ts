import { CliUx, Command } from "@oclif/core";
import { writeFile } from "fs/promises";
import { relative } from "path";
import { cyan, underline } from "picocolors";
import { loadConfig, resolveConfig } from "../../../../config";
import { getFunctionSourcePath, getPaths } from "../../../../paths";
import { presetProjectPaths } from "../../../../presets/paths";
import { httpFunctionTemplate } from "../../../../templates";
import {
  configFlag,
  cookieFlag,
  corsFlag,
  cwdFlag,
  memoryFlag,
  regionFlag,
} from "../../../flags";

export default class GenerateHTTP extends Command {
  static aliases = ["g:http"];

  static description = "Generates HTTP function";

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
    cookie: cookieFlag,
    cors: corsFlag,
  };

  async run() {
    const { args, flags } = await this.parse(GenerateHTTP);

    const name = args.functionName;
    const cwd = flags.cwd;

    const config = await loadConfig(cwd, flags.config);
    if (!config) throw new Error("Can not find the Firemyna config file");
    const resolvedConfig = resolveConfig(config);
    const { format } = resolvedConfig;

    const projectPaths = presetProjectPaths(config.preset);
    const paths = getPaths({ appEnv: "development", cwd, projectPaths });

    CliUx.ux.action.start("Generation HTTP function");

    const functionPath = getFunctionSourcePath({
      name,
      format,
      paths,
    });

    const relativePath = relative(process.cwd(), functionPath);

    await writeFile(
      functionPath,
      httpFunctionTemplate({
        name,
        format,
        memory: flags.memory,
        region: flags.region,
        cookie: flags.cookie,
        cors: flags.cors,
      })
    );

    CliUx.ux.action.stop();

    CliUx.ux.info(
      `Generated function at HTTP ${cyan(underline(relativePath))}`
    );
  }
}
