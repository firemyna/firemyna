import inquirer from "inquirer";
import { FiremynaFormat } from "../../config";
import { FiremynaPreset } from "../../presets";

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

export async function promptPreset(): Promise<FiremynaPreset> {
  const { preset } = await inquirer.prompt({
    name: "preset",
    message: "Select the preset",
    type: "list",
    choices: [
      { name: "Astro", value: "astro" },
      { name: "Vite", value: "vite" },
      { name: "Remix", value: "remix" },
      { name: "Next.js", value: "next" },
      { name: "Create React App", value: "cra" },
    ],
  });
  return preset;
}

export async function promptFunctions(): Promise<FiremynaFormat> {
  const { functionsPath } = await inquirer.prompt({
    name: "functionsPath",
    message: "Enter the path to the Functions source code",
    type: "input",
    default: "functions",
  });
  return functionsPath;
}
