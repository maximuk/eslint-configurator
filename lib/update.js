'use strict';

const fs = require('fs');
const path = require('path');

const { formatFiles } = require('./utils.js');
const {
  BASE_CONFIG_NAME,
  PLUGINS_LIST,
} = require('./const.js');
const Config = require('./config.js');

[BASE_CONFIG_NAME].concat(PLUGINS_LIST)
  .map(pluginName => new Config(pluginName))
  .filter(plugin => plugin.userConfig)
  .forEach((plugin) => {
    plugin.userConfig.extends.forEach(
      section => fs.unlinkSync(path.resolve(section))
    );
    plugin.save(undefined, plugin.userConfig);
  });

formatFiles();
