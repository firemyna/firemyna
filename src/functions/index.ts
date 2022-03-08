import NodeResolve from "@esbuild-plugins/node-resolve";
import { parse as parseSource } from "acorn";
import chokidar from "chokidar";
import { build, BuildIncremental, BuildResult, OutputFile } from "esbuild";
import { walk } from "estree-walker";
import { readdir, readFile, stat } from "fs/promises";
import { sweep, uniq } from "js-fns";
import { parse as parsePath, relative, resolve } from "path";
import { FiremynaBuildConfig } from "../build";
import { FiremynaConfig } from "../config";

/**
 * Firebase Function defenition.
 */
export interface FiremynaFunction {
  /** The path relative to the workspace root */
  path: string;
  /** The function name */
  name: string;
}

export type FiremynaFunctionsBuild = Record<string, BuildResult>;

/**
 * Builds Firebase functions.
 * @param buildConfig - the Firemyna build config
 * @returns promise to the build result
 */
export async function buildFunctions(
  buildConfig: FiremynaBuildConfig
): Promise<FiremynaFunctionsBuild> {
  const fns = await listFunctions(buildConfig);
  const indexContents = stringifyFunctionsIndex(fns, buildConfig);
  const build: FiremynaFunctionsBuild = {};

  await Promise.all(
    fns
      .map(async (fn) => {
        const file = `${fn.name}.js`;
        const resolvePath = parsePath(
          relative(buildConfig.cwd, resolve(buildConfig.cwd, fn.path))
        ).dir;
        build[file] = await buildFile({
          file,
          input: {
            type: "contents",
            contents: await readFile(resolve(buildConfig.cwd, fn.path), "utf8"),
          },
          resolvePath,
          bundle: true,
          buildConfig,
        });
      })
      .concat([
        buildFile({
          file: "index.js",
          input: {
            type: "contents",
            contents: indexContents,
          },
          resolvePath: buildConfig.paths.functions.src,
          buildConfig,
        }).then((result) => {
          build["index.js"] = result;
        }),

        buildConfig.config.functionsInitPath &&
          readFile(buildConfig.config.functionsInitPath, "utf8").then(
            (contents) =>
              buildFile({
                file: "init.js",
                input: {
                  type: "contents",
                  contents,
                },
                resolvePath: parsePath(buildConfig.config.functionsInitPath!)
                  .dir,
                buildConfig: buildConfig,
              }).then((result) => {
                build["init.js"] = result;
              })
          ),
      ] as Promise<void>[])
  );

  return build;
}

/**
 * Generates functions index file string.
 *
 * @param list - the functions list
 * @param buildConfig - the Firemyna build config
 * @returns stringified index file
 */
export function stringifyFunctionsIndex(
  list: FiremynaFunction[],
  buildConfig: FiremynaBuildConfig
) {
  return (buildConfig.config.functionsInitPath ? [`import "./init.js";`] : [])
    .concat(
      list.map(
        (fn) => `export { default as ${fn.name} } from "./${fn.name}.js";`
      )
    )
    .concat(
      buildConfig.renderer
        ? [`export { default as renderer } from "./renderer";`]
        : []
    )
    .join("\n");
}

/**
 * The index file regexp.
 */
const indexRegExp = /^index\.[tj]sx?$/;

/**
 * The function name regexp
 */
const fnRegExp = /^.+\.[tj]sx?$/;

/**
 * Lists all functions in the functions directory.
 *
 * @param - the Firemyna config
 * @returns the list of functions
 */
export async function listFunctions(
  buildConfig: FiremynaBuildConfig
): Promise<FiremynaFunction[]> {
  const dir = await readdir(
    resolve(buildConfig.cwd, buildConfig.paths.functions.src)
  );

  return sweep(
    await Promise.all<FiremynaFunction | undefined>(
      dir.map(async (itemPath) => {
        const fullPath = resolve(
          buildConfig.cwd,
          buildConfig.paths.functions.src,
          itemPath
        );
        const path = await findFunctionPath(buildConfig.cwd, fullPath);
        if (!path) return;

        const { name } = parsePath(itemPath);
        const fn = { name, path };

        if (includedFunction(buildConfig, fn)) return fn;
      })
    )
  );
}

export type FiremynaWatchCallback = (event: FiremynaWatchEvent) => void;

export type FiremynaWatchEvent =
  | FiremynaWatchEventInitial
  | FiremynaWatchEventAdd
  | FiremynaWatchEventUnlink
  | FiremynaWatchEventChange;

export interface FiremynaWatchEventInitial {
  type: "initial";
  functions: FiremynaFunction[];
}

export interface FiremynaWatchEventAdd {
  type: "add";
  function: FiremynaFunction;
}

export interface FiremynaWatchEventUnlink {
  type: "unlink";
  function: FiremynaFunction;
}

export interface FiremynaWatchEventChange {
  type: "change";
  function: FiremynaFunction;
}

export async function watchListFunction(
  buildConfig: FiremynaBuildConfig,
  callback: FiremynaWatchCallback
) {
  const functions = await listFunctions(buildConfig);
  callback({ type: "initial", functions });

  const watcher = chokidar.watch(buildConfig.paths.functions.src, {
    persistent: true,
    depth: 1,
    ignoreInitial: true,
  });

  watcher.on("all", (event, path) => {
    switch (event) {
      case "add":
      case "change":
      case "unlink": {
        const fn = parseFunction(buildConfig, path);
        if (!fn || !includedFunction(buildConfig, fn)) return;

        callback({ type: event, function: fn });
      }
    }
  });
}

/**
 * Checks if the specified path is a function and if true, returns its
 * definition object.
 *
 * @param buildConfig - the Firemyna build config
 * @param functionPath - the path to function to find function in
 * @returns the function object
 */
export function parseFunction(
  buildConfig: FiremynaBuildConfig,
  functionPath: string
): FiremynaFunction | undefined {
  const path = relative(process.cwd(), functionPath);
  const relativePath = relative(
    resolve(buildConfig.cwd, buildConfig.paths.functions.src),
    functionPath
  );
  const parsedPath = parsePath(relativePath);

  if (parsedPath.dir) {
    const nested = !!parsePath(parsedPath.dir).dir;
    if (!nested && indexRegExp.test(parsedPath.base)) {
      const name = parsedPath.dir;
      return { name, path };
    }
  } else if (fnRegExp.test(parsedPath.base)) {
    const name = parsedPath.name;
    return { name, path };
  }
}

/**
 * Tests if the function is not ignored and if only list if present that it's
 * in it
 *
 * @param config - the Firemyna config
 * @param fn - the function to test
 * @returns true if the function is included in build
 */
export function includedFunction(
  { config: { functionsIgnorePaths, onlyFunctions } }: FiremynaBuildConfig,
  fn: FiremynaFunction
): boolean {
  return (
    !functionsIgnorePaths?.find((regex) => regex.test(fn.path)) &&
    (!onlyFunctions || onlyFunctions.includes(fn.name))
  );
}

/**
 * Finds the function path, tests if the function is a TS/JS file or a directory
 * with TS/JS index file.
 *
 * @param cwd - the working directory
 * @param path - the full path to the possible function file or dir
 * @returns the relative path to the function file if found, otherwise undefined
 * @private
 */
async function findFunctionPath(
  cwd: string,
  path: string
): Promise<string | undefined> {
  const stats = await stat(path);

  if (stats.isDirectory()) {
    const files = await readdir(path);
    const indexFile = files.find((file) => indexRegExp.test(file));
    if (!indexFile) return;
    return relative(cwd, resolve(path, indexFile));
  } else if (fnRegExp.test(path)) {
    return relative(cwd, path);
  }
}

export interface BuildFileProps<Incremental extends boolean | undefined> {
  file: string;
  input: BuildFileInput;
  resolvePath: string;
  bundle?: boolean;
  buildConfig: FiremynaBuildConfig;
  incremental?: Incremental;
}

export type BuildFileInput = BuildFileInputEntry | BuildFileInputContents;

export interface BuildFileInputEntry {
  type: "entry";
  path: string;
}

export interface BuildFileInputContents {
  type: "contents";
  contents: string;
}

export function buildFile<Incremental extends boolean | undefined>(
  props: BuildFileProps<Incremental>
): Incremental extends true
  ? Promise<BuildIncremental & { outputFiles: OutputFile[] }>
  : Promise<BuildResult & { outputFiles: OutputFile[] }>;

export function buildFile<Incremental extends boolean | undefined>({
  file,
  input,
  resolvePath,
  bundle,
  buildConfig,
  incremental,
}: BuildFileProps<Incremental>) {
  return build({
    bundle,
    platform: "node",
    target: `node${buildConfig.config.node}`,
    sourcemap: "external",
    format: "cjs",
    outfile: getBuildFunctionsFilePath(buildConfig, file),
    entryPoints: input.type === "entry" ? [input.path] : undefined,
    stdin:
      input.type === "contents"
        ? {
            contents: input.contents,
            sourcefile: file,
            resolveDir: resolvePath,
          }
        : undefined,
    plugins: [
      NodeResolve({
        extensions: [".ts", ".tsx", ".js", ".jsx"],
        onResolved: (resolved) =>
          resolved.includes("node_modules") ? { external: true } : resolved,
      }),
    ],
    allowOverwrite: true,
    write: false,
    incremental,
  });
}

export interface FiremynaPackageJSON {
  main?: string;
  engines?: {
    node?: string;
    npm?: string;
  };
  dependencies?: { [dependency: string]: string };
  devDependencies?: { [dependency: string]: string };
  scripts?: Record<string, string>;
}

export function listDependencies(packageJSON: FiremynaPackageJSON): string[] {
  return Object.keys(packageJSON.dependencies || {}).concat(
    Object.keys(packageJSON.devDependencies || {})
  );
}

export function parseDependencies(source: string): string[] {
  const ast = parseSource(source, { ecmaVersion: "latest" });
  const deps: string[] = [];

  walk(ast, {
    enter(node) {
      // @ts-ignore
      if (node.type === "CallExpression" && node.callee.name === "require") {
        // @ts-ignore
        const depPath = node.arguments[0].value;
        const isLocal = /\.\/.+/.test(depPath);
        const captures = depPath.match(/^((?:@[^\/]+\/)?([^\/]+))/);
        if (!isLocal && depPath) deps.push(captures[1]);
      }
    },
  });

  return uniq(deps);
}

export function getBuildFunctionsFilePath(
  buildConfig: FiremynaBuildConfig,
  file: string
) {
  return resolve(buildConfig.cwd, buildConfig.paths.functions.build, file);
}
