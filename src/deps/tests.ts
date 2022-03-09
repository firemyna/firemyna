import { listPkgDependencies, parseSourceDependencies } from ".";

describe("deps", () => {
  describe("parseDependencies", () => {
    it("parses used dependencies from the source code", () => {
      const result = parseSourceDependencies(`console.log("Hello, world!");
require("./a.js");
require("@typesaurus/react");
require("date-fns/fp/addDays");
require("js-fns/sweep");
require("js-fns");
      `);
      expect(result).toEqual(["@typesaurus/react", "date-fns", "js-fns"]);
    });
  });

  describe("listPkgDependencies", () => {
    it("extracts dependencies from the package.json object", () => {
      const result = listPkgDependencies({
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
      const result = listPkgDependencies({});
      expect(result).toEqual([]);
    });
  });
});
