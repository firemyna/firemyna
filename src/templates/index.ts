import { format as formatSource } from "prettier";
import {
  FiremynaConfig,
  FiremynaFormat,
  FiremynaPreset,
  FiremynaModule,
} from "../config";

export interface FiremynaTemplateOptions {
  format: FiremynaFormat;
  module: FiremynaModule;
}

export function httpFunctionTemplate(options: FiremynaTemplateOptions): string {
  return formatSource(
    `${importFunctions(options)}

${exportDefault(options)} functions.https.onRequest((_request, response) => {
  response.send("Hello, cruel world!");
});
`,
    { parser: "babel" }
  );
}

export function firemynaConfigTemplate(
  format: FiremynaFormat,
  preset: FiremynaPreset
): string {
  const prefix =
    format === "ts"
      ? `import type { FiremynaConfig } from "firemyna";
  
export const config : FiremynaConfig =`
      : `/** @type {import("firemyna").FiremynaConfig } */
export const config =`;

  return formatSource(
    `${prefix} {
  preset: "${preset}",
};`,
    { parser: "babel" }
  );
}

function importFunctions(options: FiremynaTemplateOptions): string {
  switch (options.module) {
    case "esm":
      switch (options.format) {
        case "js":
          return 'import functions from "firebase-functions";';

        case "ts":
          return 'import * as functions from "firebase-functions";';
      }

    case "cjs":
      return 'const functions = require("firebase-functions");';
  }
}

function exportDefault(options: FiremynaTemplateOptions) {
  switch (options.module) {
    case "esm":
      return "export default";

    case "cjs":
      return "module.exports =";
  }
}
