jest.mock('../../../lib/utils.js', () => ({}), { virtual: true });

describe('./lib/config.js :: save', () => {
  let writeFileSync;

  beforeEach(() => {
    writeFileSync = jest.fn();

    jest.doMock('fs', () => ({
      writeFileSync,
    }));
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('should use pre-defined config', () => {
    const configName = 'configName';
    const self = {
      configs: {
        [configName]: { defined: 'defined' },
      },
      name: 'pluginName',
      prepareConfig: jest.fn(config => config),
    };

    require('../../../lib/config.js').prototype.save.call(self, configName);

    expect(writeFileSync.mock.calls).toMatchSnapshot();
  });

  it('should save correct config', () => {
    const self = {
      name: 'pluginName',
      prepareConfig: jest.fn(config => config),
    };

    require('../../../lib/config.js').prototype.save.call(self, undefined, {
      userConfig: 'userConfig',
    });

    expect(writeFileSync.mock.calls).toMatchSnapshot();
  });
});
