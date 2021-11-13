import { relative, resolve } from "path";
import {
  buildFunctions,
  includedFunction,
  listDependencies,
  listFunctions,
  parseDependencies,
  parseFunction,
  stringifyFunctionsIndex,
} from "..";
import { FiremynaConfigResolved } from "../../config";

describe("Firemyna", () => {
  const buildPath = resolve(__dirname, "fixtures/build");
  const defaultFunctionsPath = resolve(__dirname, "fixtures/basic");
  const options: FiremynaConfigResolved = {
    functionsPath: defaultFunctionsPath,
    buildPath,
  };

  let cwd: string;
  beforeEach(() => {
    cwd = process.cwd();
    process.chdir(__dirname);
  });

  afterEach(() => {
    process.chdir(cwd);
  });

  describe("buildFunctions", () => {
    it("builds function", async () => {
      const functionsPath = resolve(process.cwd(), "fixtures/basic");
      const result = await buildFunctions({
        ...options,
        functionsPath,
        buildPath,
      });

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
    const functionsPath = resolve(process.cwd(), "fixtures/mixed");

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
      const result = stringifyFunctionsIndex(list, {
        ...options,
        functionsPath,
        buildPath,
      });
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
        ...options,
        functionsPath,
        buildPath,
        functionsInitPath: resolve(process.cwd(), "fixtures/init.ts"),
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
      const functionsPath = resolve(process.cwd(), "fixtures/basic");
      const list = await listFunctions({
        ...options,
        functionsPath,
        buildPath,
      });
      expect(list).toEqual([
        {
          name: "a",
          path: "fixtures/basic/a.js",
        },
        {
          name: "b",
          path: "fixtures/basic/b.jsx",
        },
        {
          name: "c",
          path: "fixtures/basic/c.ts",
        },
        {
          name: "d",
          path: "fixtures/basic/d.tsx",
        },
      ]);
    });

    it("allows to pass relative path", async () => {
      const functionsPath = "fixtures/basic";
      const list = await listFunctions({
        ...options,
        functionsPath,
        buildPath,
      });
      expect(list).toEqual([
        {
          name: "a",
          path: "fixtures/basic/a.js",
        },
        {
          name: "b",
          path: "fixtures/basic/b.jsx",
        },
        {
          name: "c",
          path: "fixtures/basic/c.ts",
        },
        {
          name: "d",
          path: "fixtures/basic/d.tsx",
        },
      ]);
    });

    it("lists functions in the nested directories", async () => {
      const functionsPath = resolve(process.cwd(), "fixtures/mixed");
      const list = await listFunctions({
        ...options,
        functionsPath,
        buildPath,
      });
      expect(list).toEqual([
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
        {
          name: "e",
          path: "fixtures/mixed/e.ts",
        },
        {
          name: "f",
          path: "fixtures/mixed/f/index.ts",
        },
        {
          name: "g",
          path: "fixtures/mixed/g.tsx",
        },
        {
          name: "h",
          path: "fixtures/mixed/h/index.tsx",
        },
      ]);
    });

    it("ignores non-js/ts and non-index files", async () => {
      const functionsPath = resolve(process.cwd(), "fixtures/random");
      const list = await listFunctions({
        ...options,
        functionsPath,
        buildPath,
      });
      expect(list).toEqual([
        {
          name: "c",
          path: "fixtures/random/c.ts",
        },
        {
          name: "d",
          path: "fixtures/random/d.ts",
        },
      ]);
    });

    it("allows to specify functions ignore regexps", async () => {
      const functionsPath = resolve(process.cwd(), "fixtures/mixed");
      const list = await listFunctions({
        ...options,
        functionsPath,
        functionsIgnorePaths: [/index\.ts/, /(a|e)\.[jt]s/],
        buildPath,
      });
      expect(list).toEqual([
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
        {
          name: "g",
          path: "fixtures/mixed/g.tsx",
        },
      ]);
    });

    it("allows to specify the functions to build", async () => {
      const functionsPath = resolve(process.cwd(), "fixtures/basic");
      const list = await listFunctions({
        ...options,
        functionsPath,
        onlyFunctions: ["a", "c"],
        buildPath,
      });
      expect(list).toEqual([
        {
          name: "a",
          path: "fixtures/basic/a.js",
        },
        {
          name: "c",
          path: "fixtures/basic/c.ts",
        },
      ]);
    });
  });

  describe("parseFunction", () => {
    it("returns the function definition if the path is a function", () => {
      const path = resolve(defaultFunctionsPath, "hello.ts");
      expect(parseFunction(options, path)).toEqual({
        name: "hello",
        path: relative(process.cwd(), path),
      });
    });

    it("returns the function definition if the path is a function directory", () => {
      const path = resolve(defaultFunctionsPath, "hello/index.js");
      expect(parseFunction(options, path)).toEqual({
        name: "hello",
        path: relative(process.cwd(), path),
      });
    });

    it("ignores nesting more than one", () => {
      expect(
        parseFunction(
          options,
          resolve(defaultFunctionsPath, "hello/world/index.js")
        )
      ).not.toBeDefined();

      expect(
        parseFunction(
          options,
          resolve(defaultFunctionsPath, "hello/index/world/index.js")
        )
      ).not.toBeDefined();
    });

    it("detects js/jsx/ts/tsx files", () => {
      expect(
        parseFunction(options, resolve(defaultFunctionsPath, "hello.js"))
      ).toBeDefined();

      expect(
        parseFunction(options, resolve(defaultFunctionsPath, "hello/index.js"))
      ).toBeDefined();

      expect(
        parseFunction(options, resolve(defaultFunctionsPath, "hello.jsx"))
      ).toBeDefined();

      expect(
        parseFunction(options, resolve(defaultFunctionsPath, "hello/index.jsx"))
      ).toBeDefined();

      expect(
        parseFunction(options, resolve(defaultFunctionsPath, "hello.ts"))
      ).toBeDefined();

      expect(
        parseFunction(options, resolve(defaultFunctionsPath, "hello/index.ts"))
      ).toBeDefined();

      expect(
        parseFunction(options, resolve(defaultFunctionsPath, "hello.tsx"))
      ).toBeDefined();

      expect(
        parseFunction(options, resolve(defaultFunctionsPath, "hello/index.tsx"))
      ).toBeDefined();

      expect(
        parseFunction(options, resolve(defaultFunctionsPath, "hello.rb"))
      ).not.toBeDefined();

      expect(
        parseFunction(options, resolve(defaultFunctionsPath, "hello.t"))
      ).not.toBeDefined();
    });
  });

  describe("includedFunction", () => {
    it("returns true unless the function is ignored", () => {
      const testOptions = { ...options, functionsIgnorePaths: [/world/] };

      const pathA = resolve(defaultFunctionsPath, "hello/index.js");
      expect(
        includedFunction(testOptions, {
          name: "hello",
          path: relative(process.cwd(), pathA),
        })
      ).toBe(true);

      const pathB = resolve(defaultFunctionsPath, "world/index.js");
      expect(
        includedFunction(testOptions, {
          name: "world",
          path: relative(process.cwd(), pathB),
        })
      ).toBe(false);
    });

    it("returns false when only list is present and the function is not listed", () => {
      const testOptions = {
        ...options,
        functionsIgnorePaths: [/world/],
        onlyFunctions: ["cruel"],
      };

      const pathA = resolve(defaultFunctionsPath, "hello/index.js");
      expect(
        includedFunction(testOptions, {
          name: "hello",
          path: relative(process.cwd(), pathA),
        })
      ).toBe(false);

      const pathB = resolve(defaultFunctionsPath, "cruel/index.js");
      expect(
        includedFunction(testOptions, {
          name: "cruel",
          path: relative(process.cwd(), pathB),
        })
      ).toBe(true);

      const pathC = resolve(defaultFunctionsPath, "world/index.js");
      expect(
        includedFunction(testOptions, {
          name: "world",
          path: relative(process.cwd(), pathC),
        })
      ).toBe(false);
    });
  });

  describe("listDependencies", () => {
    it("extracts dependencies from the package.json object", () => {
      const result = listDependencies({
        dependencies: {
          firemyna: "1.0.0",
          "firebase-functions": "2.0.0",
          "firebase-admin": "3.0.0",
        },
        devDependencies: {
          "firebase-tools": "4.0.0",
        },
      });
      expect(result).toEqual([
        "firemyna",
        "firebase-functions",
        "firebase-admin",
        "firebase-tools",
      ]);
    });

    it("works when dependencies are not specified", () => {
      const result = listDependencies({});
      expect(result).toEqual([]);
    });
  });

  describe("parseDependencies", () => {
    it("parses used dependencies from the source code", () => {
      const result = parseDependencies(`console.log("Hello, world!");
require("./a.js");
require("@typesaurus/react");
require("date-fns/fp/addDays");
require("js-fns/sweep");
require("js-fns");
      `);
      expect(result).toEqual(["@typesaurus/react", "date-fns", "js-fns"]);
    });
  });
});
