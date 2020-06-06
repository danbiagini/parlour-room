module.exports = {
  verbose: true,
  preset: "ts-jest",
  testEnvironment: "jsdom",
  globals: {
    "ts-jest": {
      tsconfig: "tools/tsconfig.test.json",
    },
  },
  setupFiles: ["<rootDir>/tools/setup-tests.ts"],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "<rootDir>/tools/__mocks__/fileMock.js",
  },
};
