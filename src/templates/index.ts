import type { RuntimeOptions } from "firebase-functions";
import { format as formatSource } from "prettier";
import { FiremynaConfigResolved, FiremynaFormat } from "../config";
import { FirebaseRegion } from "../firebase/exports";

/**
 * The functions init data.
 */
export interface FunctionsInitData extends RuntimeOptions {
  /** The Function region */
  region?: FirebaseRegion | FirebaseRegion[];
}

/**
 * Base function template props.
 */
export interface BaseFunctionTemplateProps extends FunctionsInitData {
  /** The function name */
  name: string;
  /** The source code format */
  format: FiremynaFormat;
}

/**
 * The {@link httpFunctionTemplate} function props.
 */
export interface HTTPFunctionTemplateProps extends BaseFunctionTemplateProps {
  /** Enable cookie middleware */
  cookie?: boolean;
  /** Enable CORS middleware */
  cors?: boolean;
}

/**
 * Generates an HTTP function source code.
 * @returns HTTP function source code
 */
export function httpFunctionTemplate({
  name,
  format,
  cookie,
  cors,
  ...initData
}: HTTPFunctionTemplateProps): string {
  const middlewares: FunctionMiddleware[] = [];

  if (cookie) middlewares.push(cookieMiddleware);
  if (cors) middlewares.push(corsMiddleware);

  const imports = [importFunctions(format)]
    .concat(middlewares.map((middleware) => middleware.import))
    .join("\n");

  const inits = middlewares
    .map((middleware) => `const ${middleware.name} = ${middleware.init};`)
    .join("\n");

  const body = middlewares.reverse().reduce(
    (acc, middleware) => `${middleware.name}(request, response, () => ${acc})`,
    `{
  response.send("Hi from ${name}!");
}`
  );

  return formatSource(
    `${imports}

${inits}

export default ${functionsInit(
      initData
    )}.https.onRequest((request, response) => ${body});
`,
    { parser: "babel" }
  );
}

/**
 * The {@link expressFunctionTemplate} function props.
 */
export interface ExpressFunctionTemplateProps
  extends HTTPFunctionTemplateProps {}

/**
 * Generates an Express function source code.
 * @returns Express function source code
 */
export function expressFunctionTemplate({
  name,
  format,
  cookie,
  cors,
  ...initData
}: ExpressFunctionTemplateProps): string {
  const middlewares: FunctionMiddleware[] = [];

  if (cookie) middlewares.push(cookieMiddleware);
  if (cors) middlewares.push(corsMiddleware);

  const imports = [importFunctions(format), 'import express from "express";']
    .concat(middlewares.map((middleware) => middleware.import))
    .join("\n");

  const inits = middlewares
    .map((middleware) => `app.use(${middleware.init});`)
    .join("\n");

  return formatSource(
    `${imports}

const app = express();
${inits}

app.get("/", (request, response) => {
  response.send("Hi from ${name}!");
});

export default ${functionsInit(initData)}.https.onRequest(app);
`,
    { parser: "babel" }
  );
}

/**
 * The {@link callableFunctionTemplate} function props.
 */
export interface CallableFunctionTemplateProps
  extends BaseFunctionTemplateProps {}

/**
 * Generates a callable function source code.
 * @returns callable function source code
 */
export function callableFunctionTemplate({
  name,
  format,
  ...initData
}: CallableFunctionTemplateProps): string {
  return formatSource(
    `${importFunctions(format)}

export default ${functionsInit(initData)}.https.onCall((data, context) => {
  return "Hi from ${name}!";
});
`,
    { parser: "babel" }
  );
}

/**
 * The {@link scheduleFunctionTemplate} function props.
 */
export interface ScheduleFunctionTemplateProps
  extends BaseFunctionTemplateProps {
  /** The schedule expression */
  schedule: string;
  /** The time zone to use */
  tz?: string;
}

/**
 * Generates a schedule function source code.
 * @returns schedule function source code
 */
export function scheduleFunctionTemplate({
  name,
  format,
  schedule,
  tz,
  ...initData
}: ScheduleFunctionTemplateProps): string {
  const tzCode = tz ? `.timeZone(${JSON.stringify(tz)})` : "";

  return formatSource(
    `${importFunctions(format)}

export default ${functionsInit(initData)}.pubsub.schedule(${JSON.stringify(
      schedule
    )})${tzCode}.onRun((context) => {
  console.log("Hi from ${name}!");
});
`,
    { parser: "babel" }
  );
}

/**
 * The Firebase DB (Firestore or RTDB) trigger event name.
 */
export type FirebaseDBEvent = "create" | "update" | "delete" | "write";

/**
 * The {@link firestoreFunctionTemplate} function props.
 */
export interface RTDBFunctionTemplateProps extends BaseFunctionTemplateProps {
  /** The Realtime Database trigger event */
  event: FirebaseDBEvent;
  /** The path */
  path: string;
  /** The Realtime Database instance name */
  instance?: string;
}

/**
 * Generates a Realtime Database trigger function source code.
 * @returns Realtime Database trigger function source code
 */
export function rtdbFunctionTemplate({
  name,
  format,
  event,
  path,
  instance,
  ...initData
}: RTDBFunctionTemplateProps): string {
  const instanceCode = instance ? `.instance(${JSON.stringify(instance)})` : "";

  return formatSource(
    `${importFunctions(format)}

export default ${functionsInit(
      initData
    )}.database${instanceCode}.ref(${JSON.stringify(path)})${dbEvent(event)} {
  console.log("Hi from ${name}!");
});
`,
    { parser: "babel" }
  );
}

/**
 * The {@link firestoreFunctionTemplate} function props.
 */
export interface FirestoreFunctionTemplateProps
  extends BaseFunctionTemplateProps {
  /** The Firestore trigger event */
  event: FirebaseDBEvent;
  /** The Firestore document path */
  path: string;
}

/**
 * Generates a Firestore trigger function source code.
 * @returns Firestore trigger function source code
 */
export function firestoreFunctionTemplate({
  name,
  format,
  event,
  path,
  ...initData
}: FirestoreFunctionTemplateProps): string {
  return formatSource(
    `${importFunctions(format)}

export default ${functionsInit(initData)}.firestore.document(${JSON.stringify(
      path
    )})${dbEvent(event)} {
 console.log("Hi from ${name}!");
});
`,
    { parser: "babel" }
  );
}

/**
 * HTTP function middleware defition.
 */
interface FunctionMiddleware {
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
var corsMiddleware: FunctionMiddleware = {
  import: 'import cors from "cors";',
  init: "cors({ origin: true })",
  name: "corsMiddleware",
};

/**
 * The cookie middleware.
 */
var cookieMiddleware: FunctionMiddleware = {
  import: 'import cookieParser from "cookie-parser";',
  init: "cookieParser()",
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

/**
 * Generates Functions init with the region and runtime settings.
 * @returns the Functions init code
 */
function functionsInit({ region, ...runtime }: FunctionsInitData) {
  const regionCode = region
    ? `.region(${
        Array.isArray(region)
          ? region.map((r) => JSON.stringify(r)).join(", ")
          : JSON.stringify(region)
      })`
    : "";

  const runtimeJSON = JSON.stringify(runtime);
  const runtimeCode = runtimeJSON !== "{}" ? `.runWith(${runtimeJSON})` : "";

  return `functions${regionCode}${runtimeCode}`;
}

/**
 * Generates the Firebase DB trigger event function code.
 *
 * @param event - the Firebase DB trigger event code
 */
function dbEvent(event: FirebaseDBEvent): string {
  switch (event) {
    case "create":
      return `.onCreate((snapshot, context) =>`;

    case "update":
      return `.onUpdate((change, context) =>`;

    case "delete":
      return `.onDelete((snapshot, context) =>`;

    case "write":
      return `.onWrite((change, context) =>`;
  }
}
