'use strict';

const inquirer = require('inquirer');
const env = [...require('eslint/conf/environments.js').keys()];

const { formatFiles } = require('./utils.js');
const {
  ANSWER_NO,
  BASE_CONFIG_NAME,
  PLUGINS_LIST,
} = require('./const.js');
const Config = require('./config.js');

function getConfig(answers, plugin) {
  if (plugin !== BASE_CONFIG_NAME)
    return {};

  return {
    env: answers.env.reduce((result, env) => {
      result[env] = true;

      return result;
    }, {}),
    parserOptions: {
      ecmaFeatures: answers.ecmaFeatures.reduce((result, ecmaFeature) => {
        result[ecmaFeature] = true;

        return result;
      }, {}),
      ecmaVersion: parseInt(answers.ecmaVersion, 10),
      sourceType: answers.sourceType ? 'module' : 'script',
    },
  };
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
  },
];

module.exports = function run() {
  inquirer
    .prompt(questions)
    .then((answers) => {
      const plugins = [BASE_CONFIG_NAME]
        .concat(answers.plugins)
        .map(pluginName => new Config(pluginName));

      inquirer
        .prompt(plugins.map(plugin => ({
          choices: [ANSWER_NO].concat(Object.keys(plugin.configs)),
          default: ANSWER_NO,
          message: `Do you want to use any ${plugin.name} config?`,
          name: plugin.name,
          type: 'list',
        })))
        .then((selectedConfigs) => {
          plugins.forEach((plugin) => {
            plugin.save(
              selectedConfigs[plugin.name],
              getConfig(answers, plugin.name)
            );
          });

          formatFiles();
        });
    });
};
