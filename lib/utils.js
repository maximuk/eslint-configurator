'use strict';

const fs = require('fs');
const path = require('path');
const { EOL } = require('os');

const tempWrite = require('temp-write');
const { CLIEngine } = require('eslint');

const BASE_CONFIG_NAME = 'base';

const PLUGINS_LIST = ['import', 'react', 'jsx-a11y'];

const pluginsLinks = {
  import: name => `https://github.com/benmosher/eslint-plugin-import/blob/HEAD/docs/rules/${name}.md`,
  'jsx-a11y': name => `https://github.com/evcohen/eslint-plugin-jsx-a11y/blob/master/docs/rules/${name}.md`,
  react: name => `https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/${name}.md`,
};

const RULE_VALUES_MAP = {
  0: 'off',
  1: 'warn',
  2: 'error',
};

const RULES_SECTION_OTHER = 'other';

function getUsedPlugins() {
  return PLUGINS_LIST.filter(plugin => fs.existsSync(path.resolve(`./${plugin}.js`)));
}

function getRulePrefix(plugin) {
  return plugin === BASE_CONFIG_NAME ? '' : `${plugin}/`;
}

function isDeprecated(rule) {
  return rule.meta && rule.meta.deprecated;
}

function categorizeRules(rules, getLink, plugin) {
  return Object.keys(rules).reduce((result, rule) => {
    if (isDeprecated(rules[rule]))
      return result;

    const docs = rules[rule].meta && rules[rule].meta.docs
      ? rules[rule].meta.docs
      : {};
    const schema = rules[rule].meta && rules[rule].meta.schema;
    const hasSettings =
      (Array.isArray(schema) && schema.length > 0) ||
      (schema && Object.keys(schema).length > 0);

    let category = docs.category || RULES_SECTION_OTHER;
    category = category.toLowerCase().replace(/\W/g, '-');

    if (!result[category])
      result[category] = {};

    result[category][plugin ? `${plugin}/${rule}` : rule] = {
      description: docs.description,
      hasSettings,
      link: getLink(rule),
    };

    return result;
  }, {});
}

function getESLintRules() {
  const Linter = require('eslint/lib/linter.js');
  const linter = new Linter();
  const rulesMap = linter.getRules();

  return Array.from(rulesMap.keys()).reduce((result, rule) => {
    result[rule] = rulesMap.get(rule);
    return result;
  }, {});
}

function getCategorizedESLintRules() {
  return categorizeRules(
    getESLintRules(),
    name => `https://eslint.org/docs/rules/${name}`
  );
}

function getPlugins() {
  return PLUGINS_LIST
    .reduce((result, plugin) => {
      const prefix = getRulePrefix(plugin);

      result[plugin] = require(`eslint-plugin-${plugin}`);
      result[plugin].categorizedRules =
        categorizeRules(result[plugin].rules, pluginsLinks[plugin]);
      if (result[plugin].configs) {
        Object.keys(result[plugin].configs).forEach((key) => {
          const config = result[plugin].configs[key];
          if (!config.rules)
            return;

          Object.keys(config.rules).forEach((rule) => {
            config.rules[rule.replace(prefix, '')] = config.rules[rule]; // eslint-disable-line no-param-reassign
            delete config.rules[rule]; // eslint-disable-line no-param-reassign
          });
        });
      }
      return result;
    }, {});
}

function normalizeRuleValue(value) {
  if (typeof value === 'undefined')
    return 'off';

  if (Number.isInteger(value)) {
    return RULE_VALUES_MAP[value] || RULE_VALUES_MAP[0];
  } else if (value instanceof Array) {
    if (!Number.isInteger(value[0]))
      return value;

    value.splice(0, 1, RULE_VALUES_MAP[value[0]] || RULE_VALUES_MAP[0]);
    return value;
  }

  return value;
}

function saveRules(allRules, rulesFromConfig, plugin) {
  if (!fs.existsSync('./rules'))
    fs.mkdirSync('./rules');

  if (!fs.existsSync(`./rules/${plugin}`))
    fs.mkdirSync(`./rules/${plugin}`);

  const prefix = getRulePrefix(plugin);

  const SPACE_4 = ' '.repeat(4); // eslint-disable-line no-magic-numbers

  return Object.keys(allRules).map((category) => {
    const rules = Object.keys(allRules[category]).reduce((result, rule) => {
      result[`${prefix}${rule}`] = normalizeRuleValue(rulesFromConfig[rule]);
      return result;
    }, {});

    let config = `module.exports = ${JSON.stringify({ rules }, null, '  ')};${EOL}`;

    Object.keys(rules).forEach((rule) => {
      const ruleObj = allRules[category][rule.replace(prefix, '')];

      config = config.replace(
        `${SPACE_4}"${rule}"`,
        (match) => {
          let result = `${SPACE_4}// ${ruleObj.link}${EOL}${match}`;
          if (ruleObj.description)
            result = `${SPACE_4}// ${ruleObj.hasSettings ? '🔧 ' : ''}${ruleObj.description}${EOL}${result}`;

          return `${EOL}${result}`;
        }
      );
    });

    const fileName = `./rules/${plugin}/${category}.js`;

    fs.writeFileSync(fileName, config);

    return fileName;
  }, {});
}

function loadPluginRules(plugin) {
  const config = require(path.resolve(`./${plugin}.js`));
  const prefix = getRulePrefix(plugin);

  return config.extends.reduce((result, section) => {
    const { rules } = require(path.resolve(section));
    Object.keys(rules).forEach((rule) => {
      result[rule.replace(prefix, '')] = rules[rule];
    });
    return result;
  }, {});
}

function createCLIEngine(plugin = BASE_CONFIG_NAME) {
  const config = require(path.resolve(`./${plugin}.js`));

  return new CLIEngine({
    configFile: tempWrite.sync(JSON.stringify({
      ...config,
      extends: config.extends.map(file => path.resolve(file)),
      parser: 'espree',
    }), `${plugin}.json`),
    cwd: path.resolve('./'),
    fix: true,
    useEslintrc: false,
  });
}

function formatFiles() {
  const cli = createCLIEngine();
  const report = cli.executeOnFiles(['**/*.js']);
  CLIEngine.outputFixes(report);
}

function prepareConfig(config, configRules = {}, allRules, plugin) {
  return {
    ...config,
    extends: saveRules(allRules, configRules, plugin),
    plugins: plugin === BASE_CONFIG_NAME ? undefined : [plugin],
    rules: undefined,
  };
}

function saveConfig(config, configRules, allRules, plugin) {
  const preparedConfig = prepareConfig(config, configRules, allRules, plugin);
  const configJS = `module.exports = ${JSON.stringify(preparedConfig, null, '  ')};`;

  fs.writeFileSync(
    `./${plugin}.js`,
    configJS
  );
}

module.exports = {
  BASE_CONFIG_NAME,
  createCLIEngine,
  formatFiles,
  getCategorizedESLintRules,
  getESLintRules,
  getPlugins,
  getUsedPlugins,
  isDeprecated,
  loadPluginRules,
  PLUGINS_LIST,
  saveConfig,
  saveRules,
};
