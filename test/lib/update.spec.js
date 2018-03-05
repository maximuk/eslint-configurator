const mockBaseConfig = { extends: ['BASE_CONFIG_NAME_extends'] };
const mockPluginConfig = { extends: ['plugin_extends'] };

jest.mock('../../BASE_CONFIG_NAME.js', () => mockBaseConfig, { virtual: true });
jest.mock('../../plugin.js', () => mockPluginConfig, { virtual: true });
jest.mock('../../lib/utils.js', () => ({}), { virtual: true });
jest.mock('fs');

describe('./lib/update.js', () => {
  const BASE_CONFIG_NAME = 'BASE_CONFIG_NAME';
  const plugin = 'plugin';
  const usedPlugins = [plugin];
  const categorizedEsLintRules = 'categorizedEsLintRules';
  const categorizedPluginRules = 'categorizedPluginRules';

  const utils = require('../../lib/utils.js');
  const fs = require('fs');

  beforeEach(() => {
    utils.BASE_CONFIG_NAME = BASE_CONFIG_NAME;
    utils.formatFiles = jest.fn();
    utils.getCategorizedESLintRules =
      jest.fn().mockReturnValue(categorizedEsLintRules);
    utils.getPlugins = jest.fn().mockReturnValue({
      [plugin]: { categorizedRules: categorizedPluginRules },
    });
    utils.getUsedPlugins = jest.fn().mockReturnValue(usedPlugins);
    utils.loadPluginRules = jest.fn(a => a);
    utils.saveConfig = jest.fn();

    fs.unlinkSync = jest.fn();
  });

  afterEach(() => {});

  it('should perform proper steps', () => {
    require('../../lib/update.js');

    expect(utils.getPlugins).toHaveBeenCalledTimes(1);
    expect(utils.loadPluginRules).toHaveBeenCalledTimes(2);
    expect(utils.loadPluginRules.mock.calls).toEqual([
      [plugin],
      [BASE_CONFIG_NAME],
    ]);
    expect(fs.unlinkSync).toHaveBeenCalledTimes(2);
    expect(fs.unlinkSync.mock.calls[0][0])
      .toMatch(new RegExp('/plugin_extends$'));
    expect(fs.unlinkSync.mock.calls[1][0])
      .toMatch(new RegExp('/BASE_CONFIG_NAME_extends$'));
    expect(utils.saveConfig).toHaveBeenCalledTimes(2);
    expect(utils.saveConfig.mock.calls).toEqual([
      [
        mockPluginConfig,
        plugin,
        categorizedPluginRules,
        plugin,
      ],
      [
        mockBaseConfig,
        BASE_CONFIG_NAME,
        categorizedEsLintRules,
        BASE_CONFIG_NAME,
      ],
    ]);
    expect(utils.getCategorizedESLintRules).toHaveBeenCalledTimes(1);
    expect(utils.formatFiles).toHaveBeenCalledTimes(1);
  });
});
