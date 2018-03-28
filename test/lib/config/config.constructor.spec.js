const { BASE_CONFIG_NAME } = require('../../../lib/const.js');
const Config = require('../../../lib/config.js');

describe('./lib/config.js :: constructor', () => {
  const plugin = 'plugin';
  const rules = 'rules';
  const configs = 'configs';

  beforeEach(() => {
    Config.prototype.load = jest.fn().mockReturnValue(plugin);
    Config.prototype.mapRules = jest.fn().mockReturnValue(rules);
    Config.prototype.mapConfigs = jest.fn().mockReturnValue(configs);
  });

  it('should fill correct data', () => {
    const instance = new Config(BASE_CONFIG_NAME);

    expect(Config.prototype.load).toHaveBeenCalledTimes(1);
    expect(Config.prototype.mapRules).toHaveBeenCalledTimes(1);
    expect(Config.prototype.mapRules).toHaveBeenLastCalledWith(plugin);
    expect(Config.prototype.mapConfigs).toHaveBeenCalledTimes(1);
    expect(Config.prototype.mapConfigs).toHaveBeenLastCalledWith(plugin);

    expect(instance.name).toEqual(BASE_CONFIG_NAME);
    expect(instance.prefix).toEqual('');
    expect(instance.rules).toEqual(rules);
    expect(instance.configs).toEqual(configs);
  });

  it('should set correct prefix', () => {
    const instance = new Config(plugin);

    expect(instance.prefix).toEqual(`${plugin}/`);
  });
});
