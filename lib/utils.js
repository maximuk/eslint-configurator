'use strict';

const path = require('path');
const tempWrite = require('temp-write');
const { CLIEngine } = require('eslint');

const {
  BASE_CONFIG_NAME,
  RULE_VALUES_MAP,
} = require('./const.js');

function normalizeRuleValue(value) {
  if (typeof value === 'undefined')
    return RULE_VALUES_MAP[0];

  if (Number.isInteger(value)) {
    return RULE_VALUES_MAP[value] || RULE_VALUES_MAP[0];
  } else if (value instanceof Array) {
    if (!Number.isInteger(value[0]))
      return value;

    value.splice(0, 1, RULE_VALUES_MAP[value[0]] || RULE_VALUES_MAP[0]);

    return value;
  }

  return value;
}

function createCLIEngine(plugin = BASE_CONFIG_NAME) {
  const config = require(path.resolve(`./${plugin}.js`));

  return new CLIEngine({
    configFile: tempWrite.sync(JSON.stringify({
      ...config,
      extends: config.extends.map(file => path.resolve(file)),
    }), `${plugin}.json`),
    cwd: path.resolve('./'),
    fix: true,
    useEslintrc: false,
  });
}

function formatFiles() {
  const cli = createCLIEngine();
  const report = cli.executeOnFiles(['**/*.js']);

  CLIEngine.outputFixes(report);
}

module.exports = {
  createCLIEngine,
  formatFiles,
  normalizeRuleValue,
};
