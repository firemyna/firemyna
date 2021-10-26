import { stat, readdir, readFile } from "fs/promises";
import { sweep, uniq } from "js-fns";
import { resolve, parse as parsePath, relative } from "path";
import { build, BuildResult } from "esbuild";
import NodeResolve from "@esbuild-plugins/node-resolve";
import { parse as parseSource } from "acorn";
import { walk } from "estree-walker";
import chokidar from "chokidar";

/**
 * The Firemyna mode.
 */
export type FMMode = "development" | "production";

/**
 * The Firebase Functions runtime version.
 */
export type FMFunctionsRuntime =
  | "node10"
  | "node14"
  | "node14"
  | "node14"
  | "node16";

/**
 * Firemyna options.
 */
export interface FMOptions {
  /**
   * The build mode.
   */
  // mode: FMMode;
  /**
   * The path (relative to cwd or absolute) to the functions root directory.
   */
  functionsPath: string;
  /**
   * The functions build path.
   */
  functionsBuildPath: string;
  /**
   * The functions to build.
   */
  onlyFunctions?: string[];
  /**
   * Specify functions ignore patterns.
   */
  functionsIgnorePaths?: RegExp[];
  /**
   * The init module path (relative to cwd or absolute).
   */
  functionsInitPath?: string;
  /**
   * The Functions runtime version.
   */
  functionsRuntime?: FMFunctionsRuntime;
}

/**
 * Firebase Function defenition.
 */
export interface FMFunction {
  /**
   * The path relative to the workspace root.
   */
  path: string;
  /**
   * The function name.
   */
  name: string;
}

export type FMFunctionsBuild = Record<string, BuildResult>;

export async function buildFunctions(
  options: FMOptions
): Promise<FMFunctionsBuild> {
  const fns = await listFunctions(options);
  const indexContents = stringifyFunctionsIndex(fns, options);
  const build: FMFunctionsBuild = {};

  await Promise.all(
    fns
      .map(async (fn) => {
        const file = `${fn.name}.js`;
        build[file] = await buildFile({
          file,
          buildPath: options.functionsBuildPath,
          contents: await readFile(fn.path, "utf8"),
          resolvePath: parsePath(fn.path).dir,
          bundle: true,
          options,
        });
      })
      .concat([
        buildFile({
          file: "index.js",
          buildPath: options.functionsBuildPath,
          contents: indexContents,
          resolvePath: options.functionsPath,
          options,
        }).then((result) => {
          build["index.js"] = result;
        }),

        options.functionsInitPath &&
          readFile(options.functionsInitPath, "utf8").then((contents) =>
            buildFile({
              file: "init.js",
              buildPath: options.functionsBuildPath,
              contents,
              resolvePath: parsePath(options.functionsInitPath!).dir,
              options,
            }).then((result) => {
              build["init.js"] = result;
            })
          ),
      ] as Promise<void>[])
  );

  return build;
}

export function watchFunctions(options: FMOptions) {}

/**
 * Generates functions index file string.
 *
 * @param list - the functions list
 * @param options - the Firemyna options
 * @returns stringified index file
 */
export function stringifyFunctionsIndex(
  list: FMFunction[],
  { functionsInitPath }: FMOptions
) {
  return (functionsInitPath ? [`import "./init.js";`] : [])
    .concat(
      list.map(
        (fn) => `export { default as ${fn.name} } from "./${fn.name}.js";`
      )
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
 * @param - the Firemyna options
 * @returns the list of functions
 */
export async function listFunctions(options: FMOptions): Promise<FMFunction[]> {
  const { functionsPath } = options;
  const dir = await readdir(functionsPath);

  return sweep(
    await Promise.all<FMFunction | undefined>(
      dir.map(async (itemPath) => {
        const fullPath = resolve(functionsPath, itemPath);
        const path = await findFunctionPath(fullPath);
        if (!path) return;

        const { name } = parsePath(itemPath);
        const fn = { name, path };

        if (includedFunction(options, fn)) return fn;
      })
    )
  );
}

export async function watchListFunction(options: FMOptions) {
  const watcher = chokidar.watch(options.functionsPath, {
    persistent: true,
    depth: 1,
    ignoreInitial: true,
  });

  let functions = await listFunctions(options);

  watcher.on("all", (event, path) => {
    switch (event) {
      case "add":
      case "change":
      case "unlink": {
        const fn = parseFunction(options, path);
        if (!fn || !includedFunction(options, fn)) return;

        console.log("watch trigger", { event, fn });
      }
    }
  });
}

/**
 * Checks if the specified path is a function and if true, returns its
 * definition object.
 *
 * @param options - the Firemyna options
 * @param functionPath - the path to function to find function in
 * @returns the function object
 */
export function parseFunction(
  options: FMOptions,
  functionPath: string
): FMFunction | undefined {
  const path = relative(process.cwd(), functionPath);
  const relativePath = relative(options.functionsPath, functionPath);
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
 * @param options - the Firemyna options
 * @param fn - the function to test
 * @returns true if the function is included in build
 */
export function includedFunction(
  { functionsIgnorePaths, onlyFunctions }: FMOptions,
  fn: FMFunction
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
 * @param path - the full path to the possible function file or dir
 * @returns the relative path to the function file if found, otherwise undefined
 * @private
 */
async function findFunctionPath(path: string): Promise<string | undefined> {
  const stats = await stat(path);

  if (stats.isDirectory()) {
    const files = await readdir(path);
    const indexFile = files.find((file) => indexRegExp.test(file));
    if (!indexFile) return;
    return relative(process.cwd(), resolve(path, indexFile));
  } else if (fnRegExp.test(path)) {
    return relative(process.cwd(), path);
  }
}

interface BuildFileProps {
  file: string;
  buildPath: string;
  contents: string;
  resolvePath: string;
  bundle?: boolean;
  options: FMOptions;
}

function buildFile({
  file,
  buildPath,
  contents,
  resolvePath,
  bundle,
  options,
}: BuildFileProps) {
  return build({
    bundle,
    platform: "node",
    target: options.functionsRuntime || "node14",
    sourcemap: "external",
    format: "cjs",
    outfile: resolve(buildPath, file),
    stdin: {
      contents,
      sourcefile: file,
      resolveDir: resolvePath,
    },
    plugins: [
      NodeResolve({
        extensions: [".ts", ".tsx", ".js", ".jsx"],
        onResolved: (resolved) =>
          resolved.includes("node_modules") ? { external: true } : resolved,
      }),
    ],
    write: false,
  });
}

export interface FMPackageJSON {
  runtime?: string;
  dependencies?: { [dependency: string]: string };
  devDependencies?: { [dependency: string]: string };
}

export function listDependencies(packageJSON: FMPackageJSON): string[] {
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

// export function filterUnusedDependecies() {}
