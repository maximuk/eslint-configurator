'use strict';

const { createCLIEngine } = require('./utils.js');
const {
  BASE_CONFIG_NAME,
  PLUGINS_LIST,
} = require('./const.js');
const Config = require('./config.js');

const usedPlugins = [BASE_CONFIG_NAME]
  .concat(PLUGINS_LIST)
  .map(pluginName => new Config(pluginName))
  .filter(plugin => plugin.userConfig);

function checkConfigs(plugins) {
  try {
    createCLIEngine();
    plugins.forEach(plugin => createCLIEngine(plugin.name));
  } catch (error) {
    console.log(error.message.red);
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
      console.log(`\n${pluginMessages}:`.red.bold);
      Object.keys(messages[pluginMessages]).forEach((section) => {
        console.log(`  ${section} rules:`.red);
        messages[pluginMessages][section].forEach((rule) => {
          let message = '    ';

          if (section === 'deprecated') {
            message += rule.rule.red;
            if (rule.replacedBy) {
              message += ' (use ';
              message += rule.replacedBy.green;
              message += ' instead)';
            }
          } else {
            message += rule.red;
          }
          console.log(message);
        });
      });
    });

  return hasMessages;
}

checkConfigs(usedPlugins);
if (printMessages(getRulesMessages(usedPlugins)))
  process.exit(1);
