import { CliUx } from "@oclif/core";
import { writeFile } from "fs/promises";
import { relative } from "path";
import { cyan, green, underline } from "picocolors";
import { getFunctionSourcePath } from "../../../paths";
import { memoryFlag, regionFlag } from "../../flags";
import { commandEnv } from "../base";

/**
 * Common generate command args.
 */
export const generateCommandArgs = [
  {
    name: "functionName",
    description: "Name of the function",
    required: true,
  },
];

/**
 * Common generate command flags.
 */
export const generateCommandFlags = {
  memory: memoryFlag,
  region: regionFlag,
};

/**
 * The {@link BaseGenerateCommand.prototype.generate} function props.
 */
export interface GenerateFunctionProps {
  /** The working directory */
  cwd: string;
  /** The config path */
  configPath: string | undefined;
  /** The function name */
  name: string;
  /** The function source code */
  source: string;
  /** Funtion type title */
  title: string;
}

/**
 * Generates a function with given props.
 */
export async function generateFunction({
  cwd,
  configPath,
  name,
  source,
  title,
}: GenerateFunctionProps) {
  const {
    config: { format },
    paths,
  } = await commandEnv(cwd, configPath);

  CliUx.ux.action.start(`Generating ${title} ${green(name)}`);

  const functionPath = getFunctionSourcePath({ name, format, paths });
  await writeFile(functionPath, source);

  CliUx.ux.action.stop();

  const relativePath = relative(process.cwd(), functionPath);
  CliUx.ux.info(
    `Generated ${name} function at ${cyan(underline(relativePath))}`
  );
}
