import { Command } from "@oclif/core";
import { callableFunctionTemplate } from "../../../../templates";
import { commandEnv, commandFlags } from "../../../shared/base";
import {
  generateCommandArgs,
  generateCommandFlags,
  generateFunction,
} from "../../../shared/generate";

export default class GenerateCallable extends Command {
  static aliases = ["g:callable"];

  static description = "Generates a callable function";

  static args = generateCommandArgs;

  static flags = {
    ...commandFlags,
    ...generateCommandFlags,
  };

  async run() {
    const { args, flags } = await this.parse(GenerateCallable);
    const { cwd, config: configPath } = flags;
    const name = args.functionName;

    const {
      config: { format },
    } = await commandEnv(cwd, configPath);

    await generateFunction({
      cwd,
      configPath,
      name,
      source: await callableFunctionTemplate({
        name,
        format,
        memory: flags.memory,
        region: flags.region,
      }),
      title: "a callable function",
    });
  }
}
