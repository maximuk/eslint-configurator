const { BASE_CONFIG_NAME, PLUGINS_LIST } = require('../../lib/const.js');

const mockConfig = class {
  constructor(name) {
    this.name = name;

    this.fakeConstructor(name);
  }
};

jest.mock('colors/safe', () => ({
  bold: { red: str => str },
  green: str => str,
  red: str => str,
}));
jest.mock('../../lib/utils.js', () => ({}), { virtual: true });
jest.mock('../../lib/config.js', () => mockConfig, { virtual: true });

describe('./lib/check.js', () => {
  let processExit;
  let consoleLog;

  const usedPlugins = [BASE_CONFIG_NAME, PLUGINS_LIST[0]];

  beforeEach(() => {
    processExit = process.exit;
    process.exit = jest.fn();

    consoleLog = console.log;
    console.log = jest.fn();
  });

  afterEach(() => {
    process.exit = processExit;
    console.log = consoleLog;

    jest.resetModules();
  });

  it('should check all available configs', () => {
    const utils = require('../../lib/utils.js');

    utils.createCLIEngine = jest.fn((name) => {
      if (name !== BASE_CONFIG_NAME)
        throw new Error('createCLIEngine error');
    });
    mockConfig.prototype.fakeConstructor = function (name) {
      if (usedPlugins.includes(name)) {
        this.userConfig = {
          rules: {
            correctRule: 0,
            deprecatedRule1: 1,
            deprecatedRule2: 1,
            deprecatedRule3: 1,
            redundantRule: 2,
          },
        };
        this.rules = {
          correctRule: {},
          deprecatedRule1: { deprecated: true },
          deprecatedRule2: { deprecated: true, replacedBy: 'replacedByRule' },
          deprecatedRule3: { deprecated: true, replacedBy: 'replacedByRule', rule: 'rule' },
          deprecatedRule4: { deprecated: true },
          missingRule: {},
        };
      }
    };

    require('../../lib/check.js')();

    expect(utils.createCLIEngine).toHaveBeenCalledTimes(2);
    expect(utils.createCLIEngine.mock.calls).toEqual(
      usedPlugins.map(v => [v]),
    );

    expect(process.exit).toHaveBeenCalledTimes(2);
    expect(process.exit).toHaveBeenCalledWith(1);

    expect(console.log.mock.calls).toMatchSnapshot();
  });

  it('should not log any messages for correct config', () => {
    const utils = require('../../lib/utils.js');

    utils.createCLIEngine = jest.fn();
    mockConfig.prototype.fakeConstructor = function (name) {
      if (usedPlugins.includes(name)) {
        this.userConfig = {
          rules: {
            correctRule1: 0,
            correctRule2: 1,
            correctRule3: 2,
          },
        };
        this.rules = {
          correctRule1: {},
          correctRule2: {},
          correctRule3: {},
          deprecatedRule: { deprecated: true },
        };
      }
    };

    require('../../lib/check.js')();

    expect(utils.createCLIEngine).toHaveBeenCalledTimes(2);
    expect(utils.createCLIEngine.mock.calls).toEqual(
      usedPlugins.map(v => [v]),
    );

    expect(process.exit).toHaveBeenCalledTimes(0);

    expect(console.log).toHaveBeenCalledTimes(0);
  });
});
