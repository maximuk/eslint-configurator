const { BASE_CONFIG_NAME } = require('../../../lib/const.js');
const Config = require('../../../lib/config.js');

describe('./lib/config.js :: mapConfigs', () => {
  it('should return configs for eslint', () => {
    const self = { name: BASE_CONFIG_NAME };

    const result = Config.prototype.mapConfigs.call(self);

    expect(Object.keys(result)).toEqual([
      'eslint:recommended',
      'eslint:all',
    ]);
  });

  it('should return configs for plugin', () => {
    const self = { name: 'pluginName', prefix: 'prefix/' };
    const plugin = { configs: {
      config1: 'config1',
      config2: 'config2',
    } };

    const result = Config.prototype.mapConfigs.call(self, plugin);

    expect(Object.keys(result)).toEqual([
      'prefix/config1',
      'prefix/config2',
    ]);
  });
});
