import { format as formatSource } from "prettier";
import { FiremynaConfig, FiremynaFormat, FiremynaPreset } from "../config";

export function httpFunctionTemplate(format: FiremynaFormat): string {
  return formatSource(
    `${importFunctions(format)}

export default functions.https.onRequest((_request, response) => {
  response.send("Hello, cruel world!");
});
`,
    { parser: "babel" }
  );
}

export function firemynaConfigTemplate(
  format: FiremynaFormat,
  config: FiremynaConfig
): string {
  const prefix =
    format === "ts"
      ? `import type { FiremynaConfig } from "firemyna";
  
export const config : FiremynaConfig =`
      : `/** @type {import("firemyna").FiremynaConfig } */
export const config =`;

  return formatSource(`${prefix} ${JSON.stringify(config, null, 2)};`, {
    parser: "babel",
  });
}

function importFunctions(format: FiremynaFormat): string {
  switch (format) {
    case "js":
      return 'import functions from "firebase-functions";';

    case "ts":
      return 'import * as functions from "firebase-functions";';
  }
}
