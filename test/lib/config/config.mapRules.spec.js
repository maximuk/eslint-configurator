const { BASE_CONFIG_NAME } = require('../../../lib/const.js');
const Config = require('../../../lib/config.js');

describe('./lib/config.js :: mapRules', () => {
  it('should return modified rules', () => {
    const self = { name: BASE_CONFIG_NAME, prefix: 'prefix/' };
    const plugin = { rules: {
      testRule1: {
        meta: {
          deprecated: true,
          docs: {
            category: 'category',
            replacedBy: ['replacedBy'],
          },
          schema: ['schema'],
        },
      },
      testRule2: {
        meta: {
          schema: { key: 'value' },
        },
      },
      testRule3: {},
    } };
    const result = Config.prototype.mapRules.call(self, plugin);

    expect(result).toMatchSnapshot();
  });
});
