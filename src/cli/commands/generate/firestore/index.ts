import { Command } from "@oclif/core";
import { firestoreFunctionTemplate } from "../../../../templates";
import { commandEnv, commandFlags } from "../../../shared/base";
import {
  generateCommandArgs,
  generateCommandFlags,
  generateFunction,
} from "../../../shared/generate";

export default class GenerateFirestore extends Command {
  static aliases = ["g:firestore"];

  static description = "Generates a Firestore trigger function";

  static args = [
    ...generateCommandArgs,
    {
      name: "event",
      description:
        'The Firestore trigger event ("create", "update", "delete" or "write")',
      required: true,
      options: ["create", "update", "delete", "write"],
    },
    {
      name: "path",
      description: 'The document path (i.e. "/users/{userId}")',
      required: true,
    },
  ];

  static flags = {
    ...commandFlags,
    ...generateCommandFlags,
  };

  async run() {
    const { args, flags } = await this.parse(GenerateFirestore);
    const { cwd, config: configPath } = flags;
    const name = args.functionName;

    const {
      config: { format },
    } = await commandEnv(cwd, configPath);

    await generateFunction({
      cwd,
      configPath,
      name,
      source: firestoreFunctionTemplate({
        name,
        format,
        memory: flags.memory,
        region: flags.region,
        event: args.event,
        path: args.path,
      }),
      title: "a Firestore trigger function",
    });
  }
}
