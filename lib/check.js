'use strict';

const colors = require('colors/safe');

const { createCLIEngine } = require('./utils.js');
const {
  BASE_CONFIG_NAME,
  INDENT,
  PLUGINS_LIST,
} = require('./const.js');
const Config = require('./config.js');

function getUsedPlugins() {
  return [BASE_CONFIG_NAME]
    .concat(PLUGINS_LIST)
    .map(pluginName => new Config(pluginName))
    .filter(plugin => plugin.userConfig);
}

function checkConfigs(plugins) {
  try {
    plugins.forEach(plugin => createCLIEngine(plugin.name));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(colors.red(error.message));
    process.exit(1);
  }
}

function getRulesMessages(plugins) {
  return plugins.reduce((result, plugin) => {
    const userRules = { ...plugin.userConfig.rules };
    const pluginMessages = {
      deprecated: [],
      missing: [],
    };

    Object.keys(plugin.rules).forEach((rule) => {
      const userRuleExists = userRules[rule] || userRules[rule] === 0;

      if (plugin.rules[rule].deprecated) {
        if (userRuleExists) {
          pluginMessages.deprecated.push({
            replacedBy: plugin.rules[rule].replacedBy,
            rule,
          });
          delete userRules[rule];
        }
      } else if (userRuleExists) {
        delete userRules[rule];
      } else {
        pluginMessages.missing.push(rule);
      }
    });

    pluginMessages.redundant = Object.keys(userRules);

    Object.keys(pluginMessages).forEach((section) => {
      if (pluginMessages[section].length === 0)
        delete pluginMessages[section];
    });

    if (Object.keys(pluginMessages).length) {
      const name = plugin.name === BASE_CONFIG_NAME
        ? 'eslint rules'
        : `eslint-plugin-${plugin.name}`;

      result[name] = pluginMessages;
    }

    return result;
  }, {});
}

function printMessages(messages) {
  let hasMessages = false;

  Object.keys(messages)
    .filter(pluginMessages => messages[pluginMessages])
    .forEach((pluginMessages) => {
      hasMessages = true;
      // eslint-disable-next-line no-console
      console.log(colors.bold.red(`\n${pluginMessages}:`));
      Object.keys(messages[pluginMessages]).forEach((section) => {
        // eslint-disable-next-line no-console
        console.log(colors.red(`${INDENT}${section} rules:`));
        messages[pluginMessages][section].forEach((rule) => {
          if (section === 'deprecated' && rule.replacedBy) {
            // eslint-disable-next-line no-console
            console.log(
              `${INDENT.repeat(2)}%s (use %s instead)`,
              colors.red(rule.rule),
              colors.green(rule.replacedBy),
            );
          } else {
            // eslint-disable-next-line no-console
            console.log(`${INDENT.repeat(2)}%s`, colors.red(rule.rule || rule));
          }
        });
      });
    });

  return hasMessages;
}

module.exports = function run() {
  const usedPlugins = getUsedPlugins();

  checkConfigs(usedPlugins);

  if (printMessages(getRulesMessages(usedPlugins)))
    process.exit(1);
};
