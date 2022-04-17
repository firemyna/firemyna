import { Command, Flags } from "@oclif/core";
import { rtdbFunctionTemplate } from "../../../../templates";
import { commandEnv, commandFlags } from "../../../shared/base";
import {
  generateCommandArgs,
  generateCommandFlags,
  generateFunction,
} from "../../../shared/generate";

export default class GenerateRtdb extends Command {
  static aliases = ["g:rtdb"];

  static description = "Generates a Realtime Database trigger function";

  static args = [
    ...generateCommandArgs,
    {
      name: "event",
      description:
        'The Realtime Database trigger event ("create", "update", "delete" or "write")',
      required: true,
      options: ["create", "update", "delete", "write"],
    },
    {
      name: "path",
      description: 'The path (i.e. "/orders/{orderId}")',
      required: true,
    },
  ];

  static flags = {
    ...commandFlags,
    ...generateCommandFlags,
    instance: Flags.string({
      description: "The Realtime Database instance name",
    }),
  };

  async run() {
    const { args, flags } = await this.parse(GenerateRtdb);
    const { cwd, config: configPath } = flags;
    const name = args.functionName;

    const {
      config: { format },
    } = await commandEnv(cwd, configPath);

    await generateFunction({
      cwd,
      configPath,
      name,
      source: rtdbFunctionTemplate({
        name,
        format,
        memory: flags.memory,
        region: flags.region,
        event: args.event,
        path: args.path,
        instance: flags.instance,
      }),
      title: "a Realtime Database trigger function",
    });
  }
}
