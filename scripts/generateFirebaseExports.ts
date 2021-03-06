import { SUPPORTED_REGIONS, VALID_MEMORY_OPTIONS } from "firebase-functions";
import { writeFile } from "fs/promises";
import { format } from "prettier";

writeFile(
  "src/firebase/exports.ts",
  formatSource(`
/**
 * @module firebase/exports
 * 
 * This file is automatically generated by scripts/generateFirebaseExports.ts.
 * It contains the Firebase Functions constants used in the generators. We don't
 * want to import them directly from firebase-functions package because when we
 * do, it prints annoying warning:
 * 
 * > {"severity":"WARNING","message":"Warning, FIREBASE_CONFIG and GCLOUD_PROJECT environment variables are missing. Initializing firebase-admin will fail"}
 */

/**
 * The available Firebase Functions regions.
 */
export const firebaseRegions : FirebaseRegion[] = ${stringifyArray(
    SUPPORTED_REGIONS
  )};

/**
 * The Firebase Functions region.
 */
export type FirebaseRegion = ${stringifyType(SUPPORTED_REGIONS)}

/**
 * The available Firebase Functions memory options.
 */
export const firebaseMemoryOptions : FirebaseMemoryOption[] = ${stringifyArray(
    VALID_MEMORY_OPTIONS
  )};

/**
 * The Firebase Functions memory option.
 */
export type FirebaseMemoryOption = ${stringifyType(VALID_MEMORY_OPTIONS)}
`)
);

function stringifyArray(array: readonly string[]) {
  return JSON.stringify(array);
}

function stringifyType(array: readonly string[]) {
  return array.map((item) => `"${item}"`).join(" | ");
}

function formatSource(source: string) {
  return format(source, { parser: "babel" });
}
