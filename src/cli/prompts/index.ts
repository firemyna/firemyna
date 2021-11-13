import inquirer from "inquirer";
import { FiremynaFormat } from "../../config";

export async function promptFormat(): Promise<FiremynaFormat> {
  const { format } = await inquirer.prompt({
    name: "format",
    message: "Select the source code format",
    type: "list",
    choices: [
      { name: "TypeScript", value: "ts" },
      { name: "JavaScript", value: "js" },
    ],
  });
  return format;
}
