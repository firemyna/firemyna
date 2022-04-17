import { Command, Flags } from "@oclif/core";
import { scheduleFunctionTemplate } from "../../../../templates";
import { commandEnv, commandFlags } from "../../../shared/base";
import {
  generateCommandArgs,
  generateCommandFlags,
  generateFunction,
} from "../../../shared/generate";

export default class GenerateSchedule extends Command {
  static aliases = ["g:schedule"];

  static description = "Generates a schedule function";

  static args = [
    ...generateCommandArgs,
    {
      name: "schedule",
      description:
        'The schedule expression (i.e. "every 5 minutes" or "5 11 * * *")',
      required: true,
    },
  ];

  static flags = {
    ...commandFlags,
    ...generateCommandFlags,
    tz: Flags.string({
      description: 'The time zone to use (i.e. "America/New_York" or "UTC")',
    }),
  };

  async run() {
    const { args, flags } = await this.parse(GenerateSchedule);
    const { cwd, config: configPath } = flags;
    const name = args.functionName;

    const {
      config: { format },
    } = await commandEnv(cwd, configPath);

    await generateFunction({
      cwd,
      configPath,
      name,
      source: scheduleFunctionTemplate({
        name,
        format,
        memory: flags.memory,
        region: flags.region,
        schedule: args.schedule,
        tz: flags.tz,
      }),
      title: "a callable function",
    });
  }
}
