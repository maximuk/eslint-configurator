'use strict';

const inquirer = require('inquirer');
const env = Object.keys(require('eslint/conf/environments.js'));

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

function saveESLintConfig(answers) {
  const eslintConfigRules = answers.base === ANSWER_NO
    ? {}
    : require(`eslint/conf/${answers.base.replace(':', '-')}.js`).rules;

  saveConfig(
    {
      env: answers.env.reduce((result, env) => {
        result[env] = true;
        return result;
      }, {}),
      parser: answers.parser,
      parserOptions: {
        ecmaFeatures: answers.ecmaFeatures.reduce((result, ecmaFeature) => {
          result[ecmaFeature] = true;
          return result;
        }, {}),
        ecmaVersion: parseInt(answers.ecmaVersion, 10),
        sourceType: answers.sourceType ? 'module' : 'script',
      },
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
    choices: ['3', '5', '6', '7', '8', '9'],
    default: '7',
    message: 'Specify the version of ECMAScript syntax you want to use:',
    name: 'ecmaVersion',
    type: 'list',
  }, {
    default: true,
    message: 'Are you using ES6 modules?',
    name: 'sourceType',
    type: 'confirm',
  }, {
    choices: ['globalReturn', 'impliedStrict', 'jsx', 'experimentalObjectRestSpread'],
    default: ['jsx', 'experimentalObjectRestSpread'],
    message: 'Which additional language features you’d like to use?',
    name: 'ecmaFeatures',
    type: 'checkbox',
  }, {
    choices: ['espree', 'esprima', 'babel-eslint'],
    default: 'babel-eslint',
    message: 'Which parser are you going to use?',
    name: 'parser',
    type: 'list',
  }, {
    choices: env,
    default: [],
    message: 'Which env(s) are you going to use?',
    name: 'env',
    pageSize: 10,
    type: 'checkbox',
  }, {
    choices: PLUGINS_LIST,
    default: [],
    message: 'Which plugins are you going to use?',
    name: 'plugins',
    type: 'checkbox',
  }, {
    choices: [ANSWER_NO, 'eslint:recommended', 'eslint:all'],
    default: ANSWER_NO,
    message: 'Do you want to use eslint config?',
    name: 'base',
    type: 'list',
  },
].concat(PLUGINS_LIST.map(plugin => ({
  choices: [ANSWER_NO].concat(
    Object.keys(resolvedPlugins[plugin].configs)
      .map(config => `${plugin}/${config}`)
  ),
  default: ANSWER_NO,
  message: `Do you want to use ${plugin} config(s)?`,
  name: plugin,
  type: 'list',
  when: ({ plugins }) => plugins.includes(plugin),
})));

inquirer
  .prompt(questions)
  .then((answers) => {
    saveESLintConfig(answers);
    savePluginsConfig(answers);
    formatFiles();
  });
