module.exports = {
  testEnvironment: "node",
  coveragePathIgnorePatterns: [
    "/node_modules/",           // Ignore node_modules directory
    "src/doc-db/index.js",
    "src/models/*"       // Ignore this specific file
  ],
  transform: {
    "^.+\\.js$": "babel-jest",
  },
};
