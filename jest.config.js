module.exports = {
  testRegex: ["tests\\.ts$", "tests/.+\\.ts$"],
  transform: {
    "\\.ts$": "ts-jest",
  },
  restoreMocks: true,
  resetMocks: true,
};
