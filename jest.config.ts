export default {
  transform: { "^.+\\.(t|j)sx?$": ["@swc/jest"] },
  testMatch: ["**/*.spec.ts"],
  clearMocks: true,
  coverageProvider: "v8",
};
