const jestConfig = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  testMatch: [
    "**/tests/**/*.test.ts",
    "**/tests/**/*.spec.ts",
    "**/src/**/*.test.ts",
    "**/src/**/*.spec.ts",
  ],
  verbose: true,
  forceExit: true,

  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  transform: {
    "^.+\\.m?[tj]s$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "tsconfig.spec.json",
      },
    ],
  },
};

export default jestConfig;
