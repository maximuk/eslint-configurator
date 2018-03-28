const Config = require('../../../lib/config.js');

const pluginName = 'pluginName';
const mockLoadPluginResult = 'loadPluginResult';

jest.mock(
  'eslint-plugin-pluginName',
  () => mockLoadPluginResult,
  { virtual: true }
);

describe('./lib/config.js :: loadPlugin', () => {
  it('should load plugin rules', () => {
    const self = { name: pluginName };
    const result = Config.prototype.loadPlugin.call(self);

    expect(result).toEqual(mockLoadPluginResult);
  });
});
