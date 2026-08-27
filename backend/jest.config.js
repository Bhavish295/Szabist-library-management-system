module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/env.js'],
  globalSetup: '<rootDir>/tests/globalSetup.js',
  testTimeout: 20000,
  testPathIgnorePatterns: ['/node_modules/'],
};
