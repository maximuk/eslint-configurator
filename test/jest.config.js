'use strict';

module.exports = {
  collectCoverage: true,
  collectCoverageFrom: [
    'bin/**/*.js',
    'lib/**/*.js',
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  rootDir: process.cwd(),
  testEnvironment: 'node',
  testRegex: '/test/.+/.+js$',
};
