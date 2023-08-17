import { describe, expect, it } from "vitest";
import { extractWatchFiles, startWatchingFiles, stopWatchingFiles } from "..";
import { readFile } from "fs/promises";

describe("extractWatchFiles", () => {
  it("extracts external dependencies from the metafile", async () => {
    const metafile = JSON.parse(
      await readFile(__dirname + "/fixtures/metafileA.json", "utf8")
    );
    const result = extractWatchFiles(metafile);
    expect(result).toEqual(new Set(["firebase-admin", "src/init.ts"]));
  });

  it("extracts local dependencies from the metafile", async () => {
    const metafile = JSON.parse(
      await readFile(__dirname + "/fixtures/metafileB.json", "utf8")
    );
    const result = extractWatchFiles(metafile);
    expect(result).toEqual(
      new Set([
        "date-fns",
        "firebase-functions",
        "crypto",
        "request-ip",
        "js-fns",
        "php-serialize",
        "typesaurus",
        "../../../charge/charge-paddle/lib/paddle/parse/index.js",
        "../../../charge/charge-paddle/lib/plans/index.js",
        "../../../charge/charge-paddle/lib/transitions/activateSubscription/index.js",
        "../../../charge/charge-paddle/lib/transitions/activateTrial/index.js",
        "../../../charge/charge-paddle/lib/transitions/expireTrial/index.js",
        "../../../charge/charge-paddle/lib/transitions/index.js",
        "../../../charge/charge-paddle/lib/functions/activateTrial/index.js",
        "../../../charge/charge-paddle/lib/functions/changePlan/index.js",
        "../../../charge/charge-paddle/lib/passthrough/index.js",
        "../../../charge/charge-paddle/lib/functions/passthrough/index.js",
        "../../../charge/charge-paddle/lib/paddle/api/index.js",
        "../../../charge/charge-paddle/lib/functions/prices/index.js",
        "../../../charge/charge-paddle/lib/paddle/process/subscriptionCreated/index.js",
        "../../../charge/charge-paddle/lib/paddle/process/index.js",
        "../../../charge/charge-paddle/lib/paddle/validate/index.js",
        "../../../charge/charge-paddle/lib/functions/updateBilling/index.js",
        "../../../charge/charge-paddle/lib/functions/updateTrial/index.js",
        "../../../charge/charge-paddle/lib/adapter/server/index.js",
        "src/prices/index.ts",
        "../../packages/db/index.ts",
        "../../packages/billing/index.ts",
        "../../packages/authorize/index.ts",
        "../../packages/billing-functions/index.ts",
      ])
    );
  });
});

describe("startWatchingFiles", () => {
  it("returns list of files to start watching", () => {
    const result = startWatchingFiles(
      new Set(["a", "b", "c"]),
      new Set(["b", "d"])
    );
    expect(result).toEqual(new Set(["d"]));
  });
});

describe("stopWatchingFiles", () => {
  it("returns list of unwatched files", () => {
    const result = stopWatchingFiles(
      new Set(["a", "b", "c"]),
      new Set(["b", "d"])
    );
    expect(result).toEqual(new Set(["a", "c"]));
  });
});

describe("resolveWatchList");
