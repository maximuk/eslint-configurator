const { BASE_CONFIG_NAME, PLUGINS_LINKS } = require('../../lib/const.js');

describe('./lib/const.js', () => {
  it('should return correct links', () => {
    const ruleName = 'ruleName';

    expect(PLUGINS_LINKS[BASE_CONFIG_NAME](ruleName))
      .toBe(`https://eslint.org/docs/rules/${ruleName}`);
    expect(PLUGINS_LINKS.import(ruleName))
      .toBe(`https://github.com/benmosher/eslint-plugin-import/blob/HEAD/docs/rules/${ruleName}.md`);
    expect(PLUGINS_LINKS['jsx-a11y'](ruleName))
      .toBe(`https://github.com/evcohen/eslint-plugin-jsx-a11y/blob/master/docs/rules/${ruleName}.md`);
    expect(PLUGINS_LINKS.react(ruleName))
      .toBe(`https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/${ruleName}.md`);
  });
});
