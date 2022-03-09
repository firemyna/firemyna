import { parse as parseSource } from "acorn";
import { walk } from "estree-walker";
import { flatten, uniq } from "js-fns";
import glob from "glob";
import fs from "fs/promises";
import { FiremynaBuildConfig } from "../build";
import { resolve as resolvePath } from "path";

export function parseBuildDependencies(
  buildConfig: FiremynaBuildConfig
): Promise<string[]> {
  const buildPath = resolvePath(
    buildConfig.cwd,
    buildConfig.paths.functions.build
  );

  return new Promise((resolve, reject) => {
    glob("**/*.js", { cwd: buildPath, dot: true }, async (error, files) => {
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
      // @ts-ignore
      if (node.type === "CallExpression" && node.callee.name === "require") {
        // @ts-ignore
        const depPath = node.arguments[0].value;
        if (!depPath) return;

        const isLocal = /\.\/.+/.test(depPath);
        const captures = depPath.match(/^((?:@[^\/]+\/)?([^\/]+))/);
        if (!isLocal) deps.push(captures[1]);
      }
    },
  });

  return uniq(deps);
}
