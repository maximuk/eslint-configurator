"use strict";

const fs = require('fs');
const inquirer = require('inquirer');
const {
  PLUGINS_LIST,
  BASE_CONFIG_NAME,
  getPlugins,
  getCategorizedESLintRules,
  formatFiles,
  saveConfig,
} = require('./utils.js');

const ANSWER_NO = 'No';

const resolvedPlugins = getPlugins();

const env = Object.keys(require('eslint/conf/environments.js'));

function saveESLintConfig(answers) {
  const eslintConfigRules = answers.base !== ANSWER_NO
    ? require(`eslint/conf/${answers.base.replace(':', '-')}.js`).rules
    : {};

  saveConfig(
    {
      parserOptions: {
        ecmaVersion: parseInt(answers.ecmaVersion, 10),
        sourceType: answers.sourceType ? 'module': 'script',
        ecmaFeatures: answers.ecmaFeatures.reduce((result, ecmaFeature) => {
          result[ecmaFeature] = true;
          return result;
        }, {}),
      },
      env: answers.env.reduce((result, env) => {
        result[env] = true;
        return result;
      }, {}),
      parser: answers.parser,
    },
    eslintConfigRules,
    getCategorizedESLintRules(),
    BASE_CONFIG_NAME
  );
}

function savePluginsConfig(answers) {
  answers.plugins.forEach((plugin) => {
    const configName = answers[plugin].replace(`${plugin}/`, '');
    const selectedConfig = resolvedPlugins[plugin].configs[configName] || {};

    saveConfig(
      selectedConfig,
      selectedConfig.rules,
      resolvedPlugins[plugin].categorizedRules,
      plugin
    );
  });
}

const questions = [
  {
    type: 'list',
    name: 'ecmaVersion',
    message: 'Specify the version of ECMAScript syntax you want to use:',
    default: '7',
    choices: ['3', '5', '6', '7', '8', '9'],
  }, {
    type: 'confirm',
    name: 'sourceType',
    message: 'Are you using ES6 modules?',
    default: true,
  }, {
    type: 'checkbox',
    name: 'ecmaFeatures',
    message: 'Which additional language features you’d like to use?',
    default: ['jsx', 'experimentalObjectRestSpread'],
    choices: ['globalReturn', 'impliedStrict', 'jsx', 'experimentalObjectRestSpread'],
  }, {
    type: 'list',
    name: 'parser',
    message: 'Which parser are you going to use?',
    default: 'babel-eslint',
    choices: ['espree', 'esprima', 'babel-eslint'],
  }, {
    type: 'checkbox',
    name: 'env',
    message: 'Which env(s) are you going to use?',
    default: [],
    choices: env,
    pageSize: 10,
  }, {
    type: 'checkbox',
    name: 'plugins',
    message: 'Which plugins are you going to use?',
    default: [],
    choices: PLUGINS_LIST,
  }, {
    type: 'list',
    name: 'base',
    message: 'Do you want to use eslint config?',
    default: ANSWER_NO,
    choices: [ANSWER_NO, 'eslint:recommended', 'eslint:all'],
  }
].concat(PLUGINS_LIST.map((plugin) => ({
  type: 'list',
  name: plugin,
  message: `Do you want to use ${plugin} config(s)?`,
  default: ANSWER_NO,
  choices: [ANSWER_NO].concat(
    Object.keys(resolvedPlugins[plugin].configs)
      .map(config => `${plugin}/${config}`)
  ),
  when: ({ plugins }) => plugins.includes(plugin),
})));

inquirer
  .prompt(questions)
  .then((answers) => {
    saveESLintConfig(answers);
    savePluginsConfig(answers);
    formatFiles();
  });
