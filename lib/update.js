'use strict';

const fs = require('fs');
const path = require('path');

const {
  BASE_CONFIG_NAME,
  formatFiles,
  getCategorizedESLintRules,
  getPlugins,
  getUsedPlugins,
  loadPluginRules,
  saveConfig,
} = require('./utils.js');

const plugins = getPlugins();

getUsedPlugins().concat(BASE_CONFIG_NAME)
  .forEach((plugin) => {
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
