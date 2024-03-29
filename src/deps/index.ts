import { parse as parseSource } from "acorn";
import { walk } from "estree-walker";
import { flatten, uniq } from "js-fns";
import glob from "glob";
import fs from "fs/promises";
import { FiremynaBuildConfig } from "../build";
import { resolve as resolvePath } from "path";
import { FiremynaPkg } from "../pkg";

export function parseBuildDependencies(
  buildConfig: FiremynaBuildConfig
): Promise<string[]> {
  const buildPath = resolvePath(
    buildConfig.cwd,
    buildConfig.paths.functions.build
  );

  return new Promise((resolve, reject) => {
    glob("**/*.cjs", { cwd: buildPath, dot: true }, async (error, files) => {
      if (error) {
        reject(error);
        return;
      }

      const fileDeps = await Promise.all(
        files.map(async (file) => {
          const filePath = resolvePath(buildPath, file);
          const source = await fs.readFile(filePath, "utf8");
          return parseSourceDependencies(source);
        })
      );

      return resolve(uniq(flatten(fileDeps)));
    });
  });
}

export function parseSourceDependencies(source: string): string[] {
  const ast = parseSource(source, { ecmaVersion: "latest" });
  const deps: string[] = [];

  walk(ast, {
    enter(node) {
      let depPath: string | undefined;
      // @ts-ignore
      if (node.type === "CallExpression" && node.callee.name === "require") {
        // @ts-ignore
        depPath = node.arguments[0].value;
      } else if (node.type === "ImportExpression") {
        // @ts-ignore
        depPath = node.source.value;
      }

      const depName = matchDep(depPath);
      if (depName) deps.push(depName);
    },
  });

  return uniq(deps);
}

const depRe = /^((?:@[^\/]+\/)?([^\/]+))/;

function matchDep(depPath: string | undefined) {
  if (!depPath) return;

  const isLocal = /\.\/.+/.test(depPath);
  const captures = depPath.match(depRe);
  if (captures && !isLocal) return captures[1];
}

export function listPkgDependencies(packageJSON: FiremynaPkg): string[] {
  return Object.keys(packageJSON.dependencies || {}).concat(
    Object.keys(packageJSON.devDependencies || {})
  );
}
