import { format } from "prettier";

export type FMTemplateType = "ts" | "js";

export type FMTemplateModule = "cjs" | "esm";

export interface FMTemplateOptions {
  type: FMTemplateType;
  module: FMTemplateModule;
}

export function httpFunctionTemplate(options: FMTemplateOptions): string {
  return format(
    `${importFunctions(options)}

${exportDefault(options)} functions.https.onRequest((_request, response) => {
  response.send("Hello, cruel world!");
});
`,
    { parser: "babel" }
  );
}

function importFunctions(options: FMTemplateOptions): string {
  switch (options.module) {
    case "esm":
      switch (options.type) {
        case "js":
          return 'import functions from "firebase-functions";';

        case "ts":
          return 'import * as functions from "firebase-functions";';
      }

    case "cjs":
      return 'const functions = require("firebase-functions");';
  }
}

function exportDefault(options: FMTemplateOptions) {
  switch (options.module) {
    case "esm":
      return "export default";

    case "cjs":
      return "module.exports =";
  }
}
