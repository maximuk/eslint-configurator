"use strict";

const fs = require('fs');
const path = require('path');
const {
  BASE_CONFIG_NAME,
  getUsedPlugins,
  loadPluginRules,
  getCategorizedESLintRules,
  getPlugins,
  saveConfig,
  formatFiles,
} = require('./utils.js');

const usedPlugins = getUsedPlugins();
const plugins = getPlugins();

getUsedPlugins().concat(BASE_CONFIG_NAME).forEach(plugin => {
  const config = require(path.resolve(`./${plugin}.js`));
  const rules = loadPluginRules(plugin);

  config.extends.forEach(section => fs.unlinkSync(path.resolve(section)));

  saveConfig(
    config,
    rules,
    plugin === BASE_CONFIG_NAME
      ? getCategorizedESLintRules()
      : plugins[plugin].categorizedRules,
    plugin
  );
});

formatFiles();