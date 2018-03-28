const Config = require('../../../lib/config.js');

jest.mock('../../../lib/utils.js', () => ({}), { virtual: true });
jest.mock('fs');

describe('./lib/config.js :: saveRules', () => {
  const fs = require('fs');

  beforeEach(() => {
    fs.existsSync = jest.fn().mockReturnValue(true);
    fs.mkdirSync = jest.fn();
    fs.writeFileSync = jest.fn();
  });

  it('should create folders', () => {
    fs.existsSync = jest.fn().mockReturnValue(false);

    const categories = {};
    const rules = {};
    const self = {
      name: 'pluginName',
      prepareRules: jest.fn().mockReturnValue(categories),
      rules: {},
    };

    const result = Config.prototype.saveRules.call(self, rules);

    expect(result).toEqual([]);
    expect(fs.existsSync).toHaveBeenCalledTimes(2);
    expect(fs.existsSync.mock.calls).toEqual([
      ['./rules'],
      [`./rules/${self.name}`],
    ]);
    expect(fs.mkdirSync).toHaveBeenCalledTimes(2);
    expect(fs.mkdirSync.mock.calls).toEqual([
      ['./rules'],
      [`./rules/${self.name}`],
    ]);
  });

  it('should save correct data', () => {
    const category = 'category';
    const categories = {
      [category]: {
        rule1: 'rule1',
        rule2: 'rule2',
      },
    };
    const rules = 'rules';
    const self = {
      name: 'pluginName',
      prepareRules: jest.fn().mockReturnValue(categories),
      rules: {
        rule1: {
          description: 'rule1.description',
          link: 'rule1.link',
        },
        rule2: {
          link: 'rule2.link',
        },
      },
    };

    const result = Config.prototype.saveRules.call(self, rules);

    expect(self.prepareRules).toHaveBeenCalledTimes(1);
    expect(self.prepareRules).toBeCalledWith(rules);
    expect(result).toEqual([`./rules/${self.name}/${category}.js`]);
    expect(fs.existsSync).toHaveBeenCalledTimes(2);
    expect(fs.mkdirSync).toHaveBeenCalledTimes(0);
    expect(fs.writeFileSync.mock.calls).toMatchSnapshot();
  });
});
