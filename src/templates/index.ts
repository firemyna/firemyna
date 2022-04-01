import type { RuntimeOptions } from "firebase-functions";
import { format as formatSource } from "prettier";
import { FiremynaConfigResolved, FiremynaFormat } from "../config";
import { FirebaseRegion } from "../firebase/exports";

/**
 * The {@link httpFunctionTemplate} function props.
 */
export interface HTTPFunctionTemplateProps extends RuntimeOptions {
  /** The function name */
  name: string;
  /** The source code format */
  format: FiremynaFormat;
  /** The Function region */
  region?: FirebaseRegion | FirebaseRegion[];
}

/**
 * Generates HTTP function source code.
 * @param format - the source code format
 * @returns HTTP function source code
 */
export function httpFunctionTemplate({
  name,
  format,
  region,
  ...runtime
}: HTTPFunctionTemplateProps): string {
  const regionCode = region
    ? `.region(${
        Array.isArray(region)
          ? region.map((r) => JSON.stringify(r)).join(", ")
          : JSON.stringify(region)
      })`
    : "";

  const runtimeJSON = JSON.stringify(runtime);
  const runtimeCode = runtimeJSON !== "{}" ? `.runWith(${runtimeJSON})` : "";

  return formatSource(
    `${importFunctions(format)}

export default functions${regionCode}${runtimeCode}.https.onRequest((request, response) => {
  response.send("Hi from ${name}!");
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
export function firemynaConfigTemplate(config: FiremynaConfigResolved): string {
  const prefix =
    config.format === "ts"
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
