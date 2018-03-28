const { BASE_CONFIG_NAME } = require('../../../lib/const.js');
const Config = require('../../../lib/config.js');

describe('./lib/config.js :: prepareConfig', () => {
  it('should fill `plugin` field', () => {
    const saveRulesResult = 'saveRulesResult';
    const config = {
      field: 'field',
      rules: 'rules',
    };
    const self = {
      name: 'pluginName',
      saveRules: jest.fn().mockReturnValue(saveRulesResult),
    };

    const result = Config.prototype.prepareConfig.call(self, config);

    expect(result).toEqual({
      extends: saveRulesResult,
      field: config.field,
      plugins: [self.name],
    });
  });

  it('should not fill `plugin` field', () => {
    const saveRulesResult = 'saveRulesResult';
    const config = {
      field: 'field',
      rules: 'rules',
    };
    const self = {
      name: BASE_CONFIG_NAME,
      saveRules: jest.fn().mockReturnValue(saveRulesResult),
    };

    const result = Config.prototype.prepareConfig.call(self, config);

    expect(result).toEqual({
      extends: saveRulesResult,
      field: config.field,
    });
  });
});
