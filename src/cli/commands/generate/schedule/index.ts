import { CliUx, Command, Flags } from "@oclif/core";
import { writeFile } from "fs/promises";
import { relative } from "path";
import { cyan, underline } from "picocolors";
import { loadConfig, resolveConfig } from "../../../../config";
import { getFunctionSourcePath, getPaths } from "../../../../paths";
import { presetProjectPaths } from "../../../../presets/paths";
import { scheduleFunctionTemplate } from "../../../../templates";
import { configFlag, cwdFlag, memoryFlag, regionFlag } from "../../../flags";

export default class GenerateSchedule extends Command {
  static aliases = ["g:schedule"];

  static description = "Generates a schedule function";

  static args = [
    {
      name: "functionName",
      description: "Name of the function",
      required: true,
    },
    {
      name: "schedule",
      description:
        'The schedule expression (i.e. "every 5 minutes" or "5 11 * * *")',
      required: true,
    },
  ];

  static flags = {
    tz: Flags.string({
      description: 'The time zone to use (i.e. "America/New_York" or "UTC")',
    }),
    cwd: cwdFlag,
    config: configFlag,
    memory: memoryFlag,
    region: regionFlag,
  };

  async run() {
    const { args, flags } = await this.parse(GenerateSchedule);

    const name = args.functionName;
    const cwd = flags.cwd;

    const config = await loadConfig(cwd, flags.config);
    if (!config) throw new Error("Can not find the Firemyna config file");
    const resolvedConfig = resolveConfig(config);
    const { format } = resolvedConfig;

    const projectPaths = presetProjectPaths(config.preset);
    const paths = getPaths({ appEnv: "development", cwd, projectPaths });

    CliUx.ux.action.start("Generating a schedule function");

    const functionPath = getFunctionSourcePath({
      name,
      format,
      paths,
    });

    const relativePath = relative(process.cwd(), functionPath);

    await writeFile(
      functionPath,
      scheduleFunctionTemplate({
        name,
        format,
        memory: flags.memory,
        region: flags.region,
        schedule: args.schedule,
        tz: flags.tz,
      })
    );

    CliUx.ux.action.stop();

    CliUx.ux.info(
      `Generated ${name} function at ${cyan(underline(relativePath))}`
    );
  }
}
