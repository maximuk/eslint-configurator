const ANSWER_NO = 'No';

const BASE_CONFIG_NAME = 'base';

const INDENT = '  ';

const PLUGINS_LINKS = {
  [BASE_CONFIG_NAME]: name => `https://eslint.org/docs/rules/${name}`,
  import: name => `https://github.com/benmosher/eslint-plugin-import/blob/HEAD/docs/rules/${name}.md`,
  'jsx-a11y': name => `https://github.com/evcohen/eslint-plugin-jsx-a11y/blob/master/docs/rules/${name}.md`,
  react: name => `https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/${name}.md`,
  'react-hooks': () => 'https://reactjs.org/docs/hooks-rules.html#eslint-plugin',
};

const PLUGINS_LIST = ['import', 'react', 'jsx-a11y', 'react-hooks'];

const RULE_VALUES_MAP = { 0: 'off', 1: 'warn', 2: 'error' };

const RULES_SECTION_OTHER = 'other';

module.exports = {
  ANSWER_NO,
  BASE_CONFIG_NAME,
  INDENT,
  PLUGINS_LINKS,
  PLUGINS_LIST,
  RULE_VALUES_MAP,
  RULES_SECTION_OTHER,
};
