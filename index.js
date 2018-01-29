const fs = require('fs');
const inquirer = require('inquirer');

const EOL = require('os').EOL;
const SPACE4 = ' '.repeat(4);
const RULES_SECTION_OTHER = 'other';

const plugins = ['import', 'react', 'jsx-a11y'];
const pluginsLinks = {
  'import': name => `https://github.com/benmosher/eslint-plugin-import/blob/HEAD/docs/rules/${name}.md`,
  'react': name => `https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/${name}.md`,
  'jsx-a11y': name => `https://github.com/evcohen/eslint-plugin-jsx-a11y/blob/master/docs/rules/${name}.md`,
};
const resolvedPlugins = plugins
  .reduce((result, plugin) => {
    result[plugin] = require(`eslint-plugin-${plugin}`);
    result[plugin].rules = reduceRules(result[plugin].rules, pluginsLinks[plugin]);
    return result;
  }, {});

const env = Object.keys(require('eslint/conf/environments.js'));

function reduceRules(rules, getLink, plugin) {
  return Object.keys(rules).reduce((result, rule) => {
    if (rules[rule].meta && rules[rule].meta.deprecated) {
      return result;
    }
    const docs = (rules[rule].meta && rules[rule].meta.docs) || {};
    let category = docs.category || RULES_SECTION_OTHER;
    category = category.toLowerCase().replace(/\W/g, '-');

    if (!result[category]) {
      result[category] = {};
    }

    result[category][plugin ? `${plugin}/${rule}` : rule] = {
      description: docs.description,
      link: getLink(rule),
    };

    return result;
  }, {});
}

function getESLintRules() {
  const Linter = require('eslint/lib/linter.js');
  const linter = new Linter;
  const rulesMap = linter.getRules();

  const rules = Array.from(rulesMap.keys()).reduce((result, rule) => {
    result[rule] = rulesMap.get(rule);
    return result;
  }, {});

  return reduceRules(rules, name => `https://eslint.org/docs/rules/${name}`);
}

const ruleValuesMap = {
  0: 'off',
  1: 'warn',
  2: 'error',
};

function normalizeRuleValue(value) {
  if (typeof value === 'undefined') {
    return 'off';
  }

  if (!Number.isInteger(value)) {
    return value;
  } else if (value instanceof Array) {
    if (!Number.isInteger(value[0])) {
      return value;
    }

    value[0] = ruleValuesMap[value[0]];
    return value;
  }

  return ruleValuesMap[value];
}

function saveRules(allRules, rulesFromConfig, plugin) {
  if (!fs.existsSync('./rules')) {
    fs.mkdirSync('./rules');
  }
  if (!fs.existsSync(`./rules/${plugin}`)) {
    fs.mkdirSync(`./rules/${plugin}`);
  }

  return Object.keys(allRules).map((category) => {
    const rules = Object.keys(allRules[category]).reduce((result, rule) => {
      result[rule] = normalizeRuleValue(rulesFromConfig[rule]);
      return result;
    }, {});

    let config = `module.exports = ${JSON.stringify({ rules }, null, '  ')};${EOL}`;

    Object.keys(rules).forEach(rule => {
      config = config.replace(
        `${SPACE4}"${rule}"`,
        (result) => {
          result = `${SPACE4}// ${allRules[category][rule].link}${EOL}${result}`;
          if (allRules[category][rule].description) {
            result = `${SPACE4}// ${allRules[category][rule].description}${EOL}${result}`;
          }
          return `${EOL}${result}`;
        }
      )
    });
    config = config.replace(`${EOL}${EOL}`, `${EOL}`);

    fs.writeFileSync(`./rules/${plugin}/${category}.js`, config);

    return `./rules/${plugin}/${category}`;
  }, {});
}

function saveConfig(config, allRules, plugin) {
  config.extends = saveRules(allRules, config.rules, plugin);
  delete config.rules;

  config = `module.exports = ${JSON.stringify(config, null, '  ')};${EOL}`;
  fs.writeFileSync(`./${plugin}.js`, config);
}

function handleESLintConfig(answers) {
  const eslintConfigRules = answers.base !== 'No'
    ? require(`eslint/conf/${answers.base.replace(':', '-')}.js`).rules
    : {};

  const config = {
    parserOptions: {
      ecmaVersion: parseInt(answers.ecmaVersion, 10),
      sourceType: answers.sourceType,
      ecmaFeatures: answers.ecmaFeatures.reduce((result, ecmaFeature) => {
        result[ecmaFeature] = true;
        return result;
      }, {}),
    },
    env: answers.env.reduce((result, env) => {
      result[env] = true;
      return result;
    }, {}),
    parser: answers.parser,
    rules: eslintConfigRules,
  };

  saveConfig(config, getESLintRules(), 'base');
}

function handlePluginsConfig(answers) {
  answers.plugins.forEach((plugin) => {
    const configName = answers[plugin].replace(`${plugin}/`, '');
    const config = resolvedPlugins[plugin].configs[configName] || { rules: {} };

    saveConfig(config, resolvedPlugins[plugin].rules, plugin);
  });
}

const questions = [
  {
    type: 'list',
    name: 'ecmaVersion',
    message: 'Specify the version of ECMAScript syntax you want to use:',
    default: '7',
    choices: ['3', '5', '6', '7', '8', '9'],
  }, {
    type: 'confirm',
    name: 'sourceType',
    message: 'Are you using ES6 modules?',
    default: true,
  }, {
    type: 'checkbox',
    name: 'ecmaFeatures',
    message: 'Which additional language features you’d like to use?',
    default: ['jsx', 'experimentalObjectRestSpread'],
    choices: ['globalReturn', 'impliedStrict', 'jsx', 'experimentalObjectRestSpread'],
  }, {
    type: 'list',
    name: 'parser',
    message: 'Which parser are you going to use?',
    default: 'babel-eslint',
    choices: ['espree', 'esprima', 'babel-eslint'],
  }, {
    type: 'checkbox',
    name: 'env',
    message: 'Which env(s) are you going to use?',
    default: [],
    choices: env,
    pageSize: 10,
  }, {
    type: 'checkbox',
    name: 'plugins',
    message: 'Which plugins are you going to use?',
    default: [],
    choices: plugins,
  }, {
    type: 'list',
    name: 'base',
    message: 'Do you want to use eslint config?',
    default: 'No',
    choices: ['No', 'eslint:recommended', 'eslint:all'],
  }
].concat(plugins.map((plugin) => ({
  type: 'list',
  name: plugin,
  message: `Do you want to use ${plugin} config(s)?`,
  default: 'No',
  choices: ['No'].concat(
    Object.keys(resolvedPlugins[plugin].configs)
      .map(config => `${plugin}/${config}`)
  ),
  when: ({ plugins }) => plugins.includes(plugin),
})));

inquirer
  .prompt(questions)
  .then((answers) => {
    handleESLintConfig(answers);
    handlePluginsConfig(answers);
  });
