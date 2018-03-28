jest.mock('../../../lib/utils.js');

describe('./lib/config.js :: prepareRules', () => {
  const utils = require('../../../lib/utils.js');
  const defaultValue = 'defaultValue';

  beforeEach(() => {
    utils.normalizeRuleValue = jest.fn(value => value || defaultValue);
  });

  it('should return rules sorted by categories', () => {
    const Config = require('../../../lib/config.js');
    const self = {
      rules: {
        rule1: {
          category: 'category',
          name: 'rule1.name',
        },
        rule2: {
          category: 'category',
          name: 'rule2.name',
        },
        rule3: {
          deprecated: true,
        },
      },
    };

    const result = Config.prototype.prepareRules.call(self);

    expect(result).toEqual({
      [self.rules.rule1.category]: {
        [self.rules.rule1.name]: defaultValue,
        [self.rules.rule2.name]: defaultValue,
      },
    });
  });

  it('should return rules sorted by categories', () => {
    const Config = require('../../../lib/config.js');
    const self = {
      rules: {
        rule1: {
          category: 'category',
          name: 'rule1.name',
        },
        rule2: {
          category: 'category',
          name: 'rule2.name',
        },
        rule3: {
          deprecated: true,
        },
      },
    };
    const rules = {
      [self.rules.rule1.name]: 'rule1Value',
    };

    const result = Config.prototype.prepareRules.call(self, rules);

    expect(result).toEqual({
      [self.rules.rule1.category]: {
        [self.rules.rule1.name]: rules[self.rules.rule1.name],
        [self.rules.rule2.name]: defaultValue,
      },
    });
  });
});
