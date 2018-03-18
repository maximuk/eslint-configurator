const { BASE_CONFIG_NAME, PLUGINS_LIST } = require('../../lib/const.js');

const mockConfig = class {
  constructor(name) {
    this.name = name;
    this.configs = { [name]: name };
  }
};

jest.mock('inquirer');
jest.mock('../../lib/config.js', () => mockConfig);
jest.mock('../../lib/utils.js');

const inquirer = require('inquirer');
const utils = require('../../lib/utils.js');
const init = require('../../lib/init.js');

describe('./lib/init.js', () => {
  let answers;
  let selectedConfigs;

  beforeEach(() => {
    mockConfig.prototype.save = jest.fn();

    inquirer.prompt = jest.fn().mockReturnValueOnce({
      then: (callback) => {
        inquirer.prompt = inquirer.prompt
          .mockReturnValue({
            then: callback => callback(selectedConfigs),
          });
        callback(answers);
      },
    });

    answers = {
      ecmaFeatures: ['ecmaFeatures'],
      ecmaVersion: '7',
      env: ['env'],
      parser: 'parser',
      plugins: PLUGINS_LIST,
      sourceType: true,
    };
    selectedConfigs = PLUGINS_LIST.reduce((result, plugin) => {
      result[plugin] = plugin;

      return result;
    }, { [BASE_CONFIG_NAME]: BASE_CONFIG_NAME });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should create configs and format files', () => {
    init();

    expect(inquirer.prompt.mock.calls).toMatchSnapshot();
    expect(mockConfig.prototype.save.mock.calls).toMatchSnapshot();

    expect(utils.formatFiles).toHaveBeenCalledTimes(1);
  });

  it('should save with sourceType = script', () => {
    answers.sourceType = false;
    answers.plugins = [];
    selectedConfigs = { [BASE_CONFIG_NAME]: BASE_CONFIG_NAME };

    init();

    expect(inquirer.prompt.mock.calls).toMatchSnapshot();
    expect(mockConfig.prototype.save.mock.calls).toMatchSnapshot();

    expect(utils.formatFiles).toHaveBeenCalledTimes(1);
  });
});
