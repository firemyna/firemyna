import { resolve, relative } from "path";
import {
  buildFunctions,
  includedFunction,
  listFunctions,
  parseFunction,
  stringifyFunctionsIndex,
} from "..";
import { FiremynaBuildConfig } from "../../build";
import { FiremynaConfigResolved } from "../../config";
import { FiremynaPaths } from "../../paths";

describe("functions", () => {
  const buildPath = resolve(__dirname, "fixtures/build");

  const config: FiremynaConfigResolved = { node: "18", format: "ts" };

  const cwd = resolve(__dirname, "fixtures");

  const paths: FiremynaPaths = {
    cwd,
    appEnvBuild: "build",
    functions: {
      src: "basic",
      build: "build/functions",
    },
    hosting: {
      build: "build/hosting",
    },
  };

  const buildConfig: FiremynaBuildConfig = {
    cwd,
    appEnv: "development",
    mode: "dev",
    paths,
    config,
    renderer: false,
  };

  const mixedBuildConfig: FiremynaBuildConfig = {
    ...buildConfig,
    paths: {
      ...paths,
      functions: {
        src: "mixed",
        build: "build/functions",
      },
    },
  };

  const randomBuildConfig: FiremynaBuildConfig = {
    ...buildConfig,
    paths: {
      ...paths,
      functions: {
        src: "random",
        build: "build/functions",
      },
    },
  };

  describe("buildFunctions", () => {
    it("builds function", async () => {
      const result = await buildFunctions(buildConfig);

      expect(Object.keys(result).sort()).toEqual([
        "a.js",
        "b.js",
        "c.js",
        "d.js",
        "index.js",
      ]);

      expect(
        result["a.js"]?.outputFiles?.map((file) => file.path).sort()
      ).toEqual([
        resolve(buildPath, "functions/a.js"),
        resolve(buildPath, "functions/a.js.map"),
      ]);

      expect(typeof result["a.js"]?.outputFiles?.[0]?.text).toBe("string");
    });
  });

  describe("stringifyFunctionsIndex", () => {
    it("stringifies the list of functions", () => {
      const list = [
        {
          name: "a",
          path: "fixtures/mixed/a.js",
        },
        {
          name: "b",
          path: "fixtures/mixed/b/index.js",
        },
        {
          name: "c",
          path: "fixtures/mixed/c.jsx",
        },
        {
          name: "d",
          path: "fixtures/mixed/d/index.jsx",
        },
      ];
      const result = stringifyFunctionsIndex(list, mixedBuildConfig);
      expect(result).toBe(
        `export { default as a } from "./a.js";
export { default as b } from "./b.js";
export { default as c } from "./c.js";
export { default as d } from "./d.js";`
      );
    });

    it("prepends init function", () => {
      const list = [
        {
          name: "a",
          path: "./fixtures/mixed/a.js",
        },
        {
          name: "b",
          path: "./fixtures/mixed/b/index.js",
        },
      ];
      const result = stringifyFunctionsIndex(list, {
        ...mixedBuildConfig,
        config: {
          ...config,
          functionsInitPath: resolve(process.cwd(), "fixtures/init.ts"),
        },
      });
      expect(result).toBe(
        `import "./init.js";
export { default as a } from "./a.js";
export { default as b } from "./b.js";`
      );
    });
  });

  describe("listFunctions", () => {
    it("lists functions in the given directory", async () => {
      const list = await listFunctions(buildConfig);
      expect(list).toEqual([
        {
          name: "a",
          path: "basic/a.js",
        },
        {
          name: "b",
          path: "basic/b.jsx",
        },
        {
          name: "c",
          path: "basic/c.ts",
        },
        {
          name: "d",
          path: "basic/d.tsx",
        },
      ]);
    });

    it("lists functions in the nested directories", async () => {
      const list = await listFunctions(mixedBuildConfig);
      expect(list).toEqual([
        {
          name: "a",
          path: "mixed/a.js",
        },
        {
          name: "b",
          path: "mixed/b/index.js",
        },
        {
          name: "c",
          path: "mixed/c.jsx",
        },
        {
          name: "d",
          path: "mixed/d/index.jsx",
        },
        {
          name: "e",
          path: "mixed/e.ts",
        },
        {
          name: "f",
          path: "mixed/f/index.ts",
        },
        {
          name: "g",
          path: "mixed/g.tsx",
        },
        {
          name: "h",
          path: "mixed/h/index.tsx",
        },
      ]);
    });

    it("ignores non-js/ts and non-index files", async () => {
      const list = await listFunctions(randomBuildConfig);
      expect(list).toEqual([
        {
          name: "c",
          path: "random/c.ts",
        },
        {
          name: "d",
          path: "random/d.ts",
        },
      ]);
    });

    it("allows to specify functions ignore regexps", async () => {
      const list = await listFunctions({
        ...mixedBuildConfig,
        config: {
          ...config,
          functionsIgnorePaths: [/index\.ts/, /(a|e)\.[jt]s/],
        },
      });
      expect(list).toEqual([
        {
          name: "b",
          path: "mixed/b/index.js",
        },
        {
          name: "c",
          path: "mixed/c.jsx",
        },
        {
          name: "d",
          path: "mixed/d/index.jsx",
        },
        {
          name: "g",
          path: "mixed/g.tsx",
        },
      ]);
    });

    it("allows to specify the functions to build", async () => {
      const list = await listFunctions({
        ...buildConfig,
        config: {
          ...config,
          onlyFunctions: ["a", "c"],
        },
      });
      expect(list).toEqual([
        {
          name: "a",
          path: "basic/a.js",
        },
        {
          name: "c",
          path: "basic/c.ts",
        },
      ]);
    });
  });

  describe("parseFunction", () => {
    it("returns the function definition if the path is a function", () => {
      const path = resolve(cwd, "basic/hello.ts");
      expect(parseFunction(buildConfig, path)).toEqual({
        name: "hello",
        path: relative(process.cwd(), path),
      });
    });

    it("returns the function definition if the path is a function directory", () => {
      const path = resolve(cwd, "basic/hello/index.js");
      expect(parseFunction(buildConfig, path)).toEqual({
        name: "hello",
        path: relative(process.cwd(), path),
      });
    });

    it("ignores nesting more than one", () => {
      expect(
        parseFunction(buildConfig, resolve(cwd, "basic/hello/world/index.js"))
      ).not.toBeDefined();

      expect(
        parseFunction(
          buildConfig,
          resolve(cwd, "basic/hello/index/world/index.js")
        )
      ).not.toBeDefined();
    });

    it("detects js/jsx/ts/tsx files", () => {
      expect(
        parseFunction(buildConfig, resolve(cwd, "basic/hello.js"))
      ).toBeDefined();

      expect(
        parseFunction(buildConfig, resolve(cwd, "basic/hello/index.js"))
      ).toBeDefined();

      expect(
        parseFunction(buildConfig, resolve(cwd, "basic/hello.jsx"))
      ).toBeDefined();

      expect(
        parseFunction(buildConfig, resolve(cwd, "basic/hello/index.jsx"))
      ).toBeDefined();

      expect(
        parseFunction(buildConfig, resolve(cwd, "basic/hello.ts"))
      ).toBeDefined();

      expect(
        parseFunction(buildConfig, resolve(cwd, "basic/hello/index.ts"))
      ).toBeDefined();

      expect(
        parseFunction(buildConfig, resolve(cwd, "basic/hello.tsx"))
      ).toBeDefined();

      expect(
        parseFunction(buildConfig, resolve(cwd, "basic/hello/index.tsx"))
      ).toBeDefined();

      expect(
        parseFunction(buildConfig, resolve(cwd, "basic/hello.rb"))
      ).not.toBeDefined();

      expect(
        parseFunction(buildConfig, resolve(cwd, "basic/hello.t"))
      ).not.toBeDefined();
    });
  });

  describe("includedFunction", () => {
    it("returns true unless the function is ignored", () => {
      const testBuildConfig = {
        ...buildConfig,
        config: {
          ...config,
          functionsIgnorePaths: [/world/],
        },
      };

      const pathA = resolve(cwd, "basic/hello/index.js");
      expect(
        includedFunction(testBuildConfig, {
          name: "hello",
          path: relative(process.cwd(), pathA),
        })
      ).toBe(true);

      const pathB = resolve(cwd, "basic/world/index.js");
      expect(
        includedFunction(testBuildConfig, {
          name: "world",
          path: relative(process.cwd(), pathB),
        })
      ).toBe(false);
    });

    it("returns false when only list is present and the function is not listed", () => {
      const testBuildConfig = {
        ...buildConfig,
        config: {
          ...config,
          functionsIgnorePaths: [/world/],
          onlyFunctions: ["cruel"],
        },
      };

      const pathA = resolve(cwd, "basic/hello/index.js");
      expect(
        includedFunction(testBuildConfig, {
          name: "hello",
          path: relative(process.cwd(), pathA),
        })
      ).toBe(false);

      const pathB = resolve(cwd, "basic/cruel/index.js");
      expect(
        includedFunction(testBuildConfig, {
          name: "cruel",
          path: relative(process.cwd(), pathB),
        })
      ).toBe(true);

      const pathC = resolve(cwd, "basic/world/index.js");
      expect(
        includedFunction(testBuildConfig, {
          name: "world",
          path: relative(process.cwd(), pathC),
        })
      ).toBe(false);
    });
  });
});
