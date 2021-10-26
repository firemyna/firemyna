/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  testRegex: ["tests\\.ts$", "tests/.+\\.ts$"],
  testPathIgnorePatterns: ["tests/fixtures"],
  transform: {
    "\\.ts$": "ts-jest",
  },
  restoreMocks: true,
  resetMocks: true,
};
module.exports = config;
