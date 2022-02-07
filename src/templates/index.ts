import { format as formatSource } from "prettier";
import { FiremynaConfig, FiremynaFormat } from "../config";

/**
 * Generates HTTP function source code.
 * @param format - the source code format
 * @returns HTTP function source code
 */
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

/**
 * Generates Firemyna config file source code.
 * @param format - the source code format
 * @param config - the Firemyna config
 * @returns Firemyna config source code
 */
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

/**
 * Generates import Functions line source code.
 * @param format - the source code format
 * @returns import Functions line source code
 */
function importFunctions(format: FiremynaFormat): string {
  switch (format) {
    case "js":
      return 'import functions from "firebase-functions";';

    case "ts":
      return 'import * as functions from "firebase-functions";';
  }
}
