import { BuildIncremental, BuildResult } from "esbuild";
import { writeFile } from "fs/promises";

/**
 * Writes all build files to disk.
 *
 * @param build - the build result
 * @returns promise to all build files to be written
 */
export function writeEsbuildFile(
  build: BuildIncremental | BuildResult | undefined
) {
  return Promise.all(
    build?.outputFiles?.map((file) => writeFile(file.path, file.text)) || []
  );
}
