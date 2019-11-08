const { BASE_CONFIG_NAME, PLUGINS_LIST } = require('../../lib/const.js');

const baseUserConfig = { extends: ['extend1', 'extend2'] };
const mockConfig = class {
  constructor(name) {
    this.fakeConstructor(name);

    if (name === BASE_CONFIG_NAME)
      this.userConfig = baseUserConfig;
  }
};

jest.mock('fs');
jest.mock('path', () => ({
  resolve: path => `/${path}/`,
}));
jest.mock('../../lib/utils.js', () => ({}), { virtual: true });
jest.mock('../../lib/config.js', () => mockConfig, { virtual: true });

describe('./lib/update.js', () => {
  let update;

  const fs = require('fs');
  const utils = require('../../lib/utils.js');

  beforeEach(() => {
    fs.unlinkSync = jest.fn();

    utils.formatFiles = jest.fn();

    mockConfig.prototype.fakeConstructor = jest.fn();
    mockConfig.prototype.save = jest.fn();

    update = require('../../lib/update.js');
  });

  it('should update all configs and format files', () => {
    update();

    expect(mockConfig.prototype.fakeConstructor).toHaveBeenCalledTimes(5);
    expect(mockConfig.prototype.fakeConstructor.mock.calls).toEqual([
      [BASE_CONFIG_NAME],
      ...PLUGINS_LIST.map(plugin => [plugin]),
    ]);

    expect(fs.unlinkSync).toHaveBeenCalledTimes(2);
    expect(fs.unlinkSync.mock.calls).toEqual([
      ['/extend1/'],
      ['/extend2/'],
    ]);

    expect(mockConfig.prototype.save).toHaveBeenCalledTimes(1);
    expect(mockConfig.prototype.save).toBeCalledWith(undefined, baseUserConfig);

    expect(utils.formatFiles).toHaveBeenCalledTimes(1);
  });
});
