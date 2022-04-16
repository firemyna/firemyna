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
  /** Enable cookie middleware */
  cookie?: boolean;
  /** Enable CORS middleware */
  cors?: boolean;
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
  cookie,
  cors,
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

  const middlewares: HTTPFunctionMiddleware[] = [];

  if (cookie) middlewares.push(httpCookieMiddleware);
  if (cors) middlewares.push(httpCORSMiddleware);

  const imports = [importFunctions(format)]
    .concat(middlewares.map((middleware) => middleware.import))
    .join("\n");

  const inits = middlewares.map((middleware) => middleware.init).join("\n");

  const body = middlewares.reverse().reduce(
    (acc, middleware) => `${middleware.name}(request, response, () => ${acc})`,
    `{
  response.send("Hi from ${name}!");
}`
  );

  return formatSource(
    `${imports}

${inits}

export default functions${regionCode}${runtimeCode}.https.onRequest((request, response) => ${body});
`,
    { parser: "babel" }
  );
}

/**
 * HTTP function middleware defition.
 */
interface HTTPFunctionMiddleware {
  /** The middleware import */
  import: string;
  /** The middleware init */
  init: string;
  /** The middleware name */
  name: string;
}

/**
 * The CORS middleware.
 */
var httpCORSMiddleware: HTTPFunctionMiddleware = {
  import: 'import cors from "cors";',
  init: "const corsMiddleware = cors({ origin: true });",
  name: "corsMiddleware",
};

/**
 * The cookie middleware.
 */
var httpCookieMiddleware: HTTPFunctionMiddleware = {
  import: 'import cookieParser from "cookie-parser";',
  init: "const cookieMiddleware = cookieParser();",
  name: "cookieMiddleware",
};

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
