"use strict";

const fs = require('fs');
const path = require('path');
const tempWrite = require('temp-write');
const { CLIEngine } = require('eslint');

const BASE_CONFIG_NAME = 'base';

const PLUGINS_LIST = ['import', 'react', 'jsx-a11y'];

const pluginsLinks = {
  'import': name => `https://github.com/benmosher/eslint-plugin-import/blob/HEAD/docs/rules/${name}.md`,
  'react': name => `https://github.com/yannickcr/eslint-plugin-react/blob/HEAD/docs/rules/${name}.md`,
  'jsx-a11y': name => `https://github.com/evcohen/eslint-plugin-jsx-a11y/blob/master/docs/rules/${name}.md`,
};

const RULE_VALUES_MAP = {
  0: 'off',
  1: 'warn',
  2: 'error',
};

const RULES_SECTION_OTHER = 'other';
const EOL = require('os').EOL;

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
    if (isDeprecated(rules[rule])) {
      return result;
    }

    const docs = (rules[rule].meta && rules[rule].meta.docs) || {};
    const schema = (rules[rule].meta && rules[rule].meta.schema);
    const hasSettings = (
      (Array.isArray(schema) && schema.length > 0)
      ||
      (schema && Object.keys(schema).length > 0)
    );
    let category = docs.category || RULES_SECTION_OTHER;
    category = category.toLowerCase().replace(/\W/g, '-');

    if (!result[category]) {
      result[category] = {};
    }

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
  const linter = new Linter;
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
      result[plugin] = require(`eslint-plugin-${plugin}`);
      result[plugin].categorizedRules = categorizeRules(result[plugin].rules, pluginsLinks[plugin]);
      return result;
    }, {});
}

function saveRules(allRules, rulesFromConfig, plugin) {
  if (!fs.existsSync('./rules')) {
    fs.mkdirSync('./rules');
  }
  if (!fs.existsSync(`./rules/${plugin}`)) {
    fs.mkdirSync(`./rules/${plugin}`);
  }

  const prefix = getRulePrefix(plugin);

  return Object.keys(allRules).map((category) => {
    const rules = Object.keys(allRules[category]).reduce((result, rule) => {
      result[`${prefix}${rule}`] = normalizeRuleValue(rulesFromConfig[rule]);
      return result;
    }, {});

    let config = `module.exports = ${JSON.stringify({ rules }, null, '  ')};${EOL}`;

    Object.keys(rules).forEach(rule => {
      const ruleObj = allRules[category][rule.replace(prefix, '')];

      config = config.replace(
        `"${rule}"`,
        (result) => {
          result = `// ${ruleObj.link}${EOL}${result}`;
          if (ruleObj.description) {
            result = `// ${ruleObj.hasSettings ? '🔧 ' : ''}${ruleObj.description}${EOL}${result}`;
          }
          return `${EOL}${result}`;
        }
      )
    });

    const fileName = `./rules/${plugin}/${category}.js`;

    fs.writeFileSync(fileName, config);

    return fileName;
  }, {});
}

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

    value[0] = RULE_VALUES_MAP[value[0]];
    return value;
  }

  return RULE_VALUES_MAP[value];
}

function loadPluginRules(plugin) {
  const config = require(path.resolve(`./${plugin}.js`));
  const prefix = getRulePrefix(plugin);

  return config.extends.reduce((result, section) => {
    const { rules } = require(path.resolve(section));
    Object.keys(rules).forEach(rule => {
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
    useEslintrc: false,
    fix: true,
    cwd: path.resolve('./'),
  });
}

function formatFiles(fileName) {
  const cli = createCLIEngine();
  const report = cli.executeOnFiles(['**/*.js']);
  CLIEngine.outputFixes(report);
}

function prepareConfig(config, configRules = {}, allRules, plugin) {
  return {
    ...config,
    extends: saveRules(allRules, configRules, plugin),
    rules: undefined,
    plugins: plugin !== BASE_CONFIG_NAME ? [plugin] : undefined,
  };
}

function saveConfig(config, configRules, allRules, plugin) {
  config = prepareConfig(config, configRules, allRules, plugin);
  const configJS = `module.exports = ${JSON.stringify(config, null, '  ')};`;

  fs.writeFileSync(
    `./${plugin}.js`,
    configJS
  );
}

module.exports = {
  PLUGINS_LIST,
  BASE_CONFIG_NAME,
  getUsedPlugins,
  getPlugins,
  isDeprecated,
  getESLintRules,
  getCategorizedESLintRules,
  saveRules,
  createCLIEngine,
  formatFiles,
  loadPluginRules,
  saveConfig,
};
