const Config = require('../../../lib/config.js');

describe('./lib/config.js :: loadESlint', () => {
  it('should load eslint rules', () => {
    const result = Config.prototype.loadESlint();

    expect(Object.keys(result)).toEqual(['rules']);
    expect(result.rules.indent).toBeDefined();
  });
});
