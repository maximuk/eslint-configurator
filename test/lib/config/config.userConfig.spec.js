const Config = require('../../../lib/config.js');

jest.mock('../../../lib/utils.js');
jest.mock('../../../lib/pluginUserConfigName.js', () => ({
  extends: ['pluginUserConfigExtends.js'],
}), { virtual: true });
jest.mock('pluginUserConfigExtends.js', () => ({
  rules: { rule: true },
}), { virtual: true });

describe('./lib/config.js :: userConfig', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it('should return already loaded config', () => {
    const self = { pluginUserConfig: 'pluginUserConfig' };
    const getter = Object.getOwnPropertyDescriptor(Config.prototype, 'userConfig').get;

    const result = getter.call(self);

    expect(result).toBe(self.pluginUserConfig);
  });

  it('should return null if config does not exist', () => {
    const self = { name: 'pluginUserConfigName' };
    const getter = Object.getOwnPropertyDescriptor(Config.prototype, 'userConfig').get;

    const result = getter.call(self);

    expect(result).toBeNull();
  });

  it('should return null if config does not exist', () => {
    const self = { name: 'pluginUserConfigName' };
    const getter = Object.getOwnPropertyDescriptor(Config.prototype, 'userConfig').get;

    const result = getter.call(self);

    expect(result).toBeNull();
  });

  it('should return config with all rules', () => {
    jest.doMock('fs', () => ({
      existsSync: () => true,
    }));
    jest.doMock('path', () => ({
      resolve: path => path,
    }));

    const self = { name: 'pluginUserConfigName' };
    const getter = Object.getOwnPropertyDescriptor(
      require('../../../lib/config.js').prototype,
      'userConfig'
    ).get;

    const result = getter.call(self);

    expect(result).toEqual({
      extends: ['pluginUserConfigExtends.js'],
      rules: { rule: true },
    });
  });
});
