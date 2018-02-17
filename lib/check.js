"use strict";

const fs = require('fs');
const path = require('path');
const {
  getUsedPlugins,
  isDeprecated,
  loadPluginRules,
  getESLintRules,
  getPlugins,
  createCLIEngine,
} = require('./utils.js');

const usedPlugins = getUsedPlugins();

// check configs itself
try {
  createCLIEngine();
  usedPlugins.forEach(plugin => {
    createCLIEngine(plugin);
  });
} catch (error) {
  console.log(error.message.red);
  process.exit(1);
}

function checkRules(rules, userRules) {
  const userRulesTemp = { ...userRules };

  const messages = {
    deprecated: [],
    missing: [],
  };

  Object.keys(rules).forEach((rule) => {
    if (isDeprecated(rules[rule])) {
      if (userRulesTemp[rule]) {
        const replacedBy = rules[rule].meta
          && rules[rule].meta.docs
          && rules[rule].meta.docs.replacedBy
          && rules[rule].meta.docs.replacedBy.join(', ');
        messages.deprecated.push({
          rule,
          replacedBy
        });
        delete userRulesTemp[rule];
      }
    } else if (userRulesTemp[rule]) {
      delete userRulesTemp[rule];
    } else {
      messages.missing.push(rule);
    }
  });

  messages.redundant = Object.keys(userRulesTemp);

  Object.keys(messages).forEach((section) => {
    if (messages[section].length === 0) {
      delete messages[section];
    }
  })

  return Object.keys(messages).length ? messages : null;
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

// check deprecated, redundant and missing rules
const messages = {};
messages['eslint rules'] = checkRules(getESLintRules(), loadPluginRules('base'));

const plugins = getPlugins();
usedPlugins.forEach(plugin => {
  messages[`eslint-plugin-${plugin}`] = checkRules(
    plugins[plugin].rules,
    loadPluginRules(plugin)
  );
});

if (printMessages(messages)) {
  process.exit(1);
}
