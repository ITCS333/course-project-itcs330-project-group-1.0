module.exports = {
  // Each test folder declares its own environment via docblock,
  // so we set the default here and override per file.
  testEnvironment: "node",
  testMatch: [
    "**/tests/html/**/*.test.js",
    "**/tests/js/**/*.test.js"
  ],
  // Collect coverage only from student files
  collectCoverageFrom: [
    "src/auth/login.js"
  ]
};
