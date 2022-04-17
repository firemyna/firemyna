import { Command } from "@oclif/core";
import { expressFunctionTemplate } from "../../../../templates";
import { cookieFlag, corsFlag } from "../../../flags";
import { commandEnv, commandFlags } from "../../../shared/base";
import {
  generateCommandArgs,
  generateCommandFlags,
  generateFunction,
} from "../../../shared/generate";

export default class GenerateExpress extends Command {
  static aliases = ["g:express"];

  static description = "Generates an Express function";

  static args = generateCommandArgs;

  static flags = {
    ...commandFlags,
    ...generateCommandFlags,
    cookie: cookieFlag,
    cors: corsFlag,
  };

  async run() {
    const { args, flags } = await this.parse(GenerateExpress);
    const { cwd, config: configPath } = flags;
    const name = args.functionName;

    const {
      config: { format },
    } = await commandEnv(cwd, configPath);

    await generateFunction({
      cwd,
      configPath,
      name,
      source: expressFunctionTemplate({
        name,
        format,
        memory: flags.memory,
        region: flags.region,
        cookie: flags.cookie,
        cors: flags.cors,
      }),
      title: "an Express function",
    });
  }
}
