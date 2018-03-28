const { BASE_CONFIG_NAME } = require('../../../lib/const.js');
const Config = require('../../../lib/config.js');

describe('./lib/config.js :: load', () => {
  const loadESlintResult = 'loadESlintResult';
  const loadPluginResult = 'loadPluginResult';
  const self = {};

  beforeEach(() => {
    self.loadESlint = jest.fn().mockReturnValue(loadESlintResult);
    self.loadPlugin = jest.fn().mockReturnValue(loadPluginResult);
  });

  it('should load eslint data', () => {
    self.name = BASE_CONFIG_NAME;
    expect(Config.prototype.load.call(self))
      .toBe(loadESlintResult);
    expect(self.loadESlint).toHaveBeenCalledTimes(1);
    expect(self.loadPlugin).toHaveBeenCalledTimes(0);
  });

  it('should load plugin data', () => {
    self.name = 'other';
    expect(Config.prototype.load.call(self))
      .toBe(loadPluginResult);
    expect(self.loadESlint).toHaveBeenCalledTimes(0);
    expect(self.loadPlugin).toHaveBeenCalledTimes(1);
  });
});
