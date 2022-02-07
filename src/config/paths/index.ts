/**
 * @module config/paths
 *
 * The Firemyna config paths module - everything related to locating stuff on
 * the disk.
 */

import { FiremynaFormat } from "../../config";

/**
 * Generate the config file name from the format.
 * @param format - the config format
 * @returns the config path
 */
export function getConfigFileName(format: FiremynaFormat) {
  return `firemyna.config.${format}`;
}
