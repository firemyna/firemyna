import { parseSourceDependencies } from ".";

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
});
