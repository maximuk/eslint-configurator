'use strict';

module.exports = {
  collectCoverage: true,
  collectCoverageFrom: [
    'bin/**/*.js',
    'lib/**/*.js',
  ],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  rootDir: process.cwd(),
  testRegex: '/test/.+/.+js$',
};
