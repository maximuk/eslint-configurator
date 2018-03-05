const path = require('path');
const fs = require('fs');
const { EOL } = require('os');

const {
  normalizeRuleValue,
} = require('./utils.js');
const {
  BASE_CONFIG_NAME,
  INDENT,
  PLUGINS_LINKS,
  RULES_SECTION_OTHER,
} = require('./const.js');

class Config {
  constructor(name) {
    this.name = name;
    this.prefix = name === BASE_CONFIG_NAME ? '' : `${name}/`;

    const plugin = this.load();

    this.rules = this.mapRules(plugin);
    this.configs = this.mapConfigs(plugin);
  }

  load() {
    if (this.name === BASE_CONFIG_NAME)
      return this.loadESlint();

    return this.loadPlugin();
  }

  loadESlint() {
    const Linter = require('eslint/lib/linter.js');
    const linter = new Linter();
    const rulesMap = linter.getRules();

    const rules = Array.from(rulesMap.keys()).reduce((result, rule) => {
      result[rule] = rulesMap.get(rule);

      return result;
    }, {});

    return { rules };
  }

  loadPlugin() {
    const plugin = require(`eslint-plugin-${this.name}`);

    return plugin;
  }

  mapRules(plugin) {
    return Object.keys(plugin.rules).reduce((result, key) => {
      const meta = plugin.rules[key].meta || {};
      const docs = meta.docs || {};
      const category = (docs.category || RULES_SECTION_OTHER)
        .toLowerCase().replace(/\W/g, '-');
      const hasSettings =
        (Array.isArray(meta.schema) && meta.schema.length > 0) ||
        (meta.schema && Object.keys(meta.schema).length > 0);
      const replacedBy = meta.deprecated && docs.replacedBy && docs.replacedBy.join(', ');

      let link = PLUGINS_LINKS[this.name](key);

      if (hasSettings)
        link = `🔧 ${link}`;

      result[`${this.prefix}${key}`] = {
        category,
        deprecated: meta.deprecated,
        description: docs.description,
        link,
        name: `${this.prefix}${key}`,
        replacedBy,
      };

      return result;
    }, {});
  }

  mapConfigs(plugin) {
    if (this.name === BASE_CONFIG_NAME) {
      return {
        'eslint:recommended': require('eslint/conf/eslint-recommended.js'),
        'eslint:all': require('eslint/conf/eslint-all.js'), // eslint-disable-line sort-keys
      };
    }

    return Object.keys(plugin.configs).reduce((result, key) => {
      result[`${this.prefix}${key}`] = plugin.configs[key];

      return result;
    }, {});
  }

  get userConfig() {
    if (this.pluginUserConfig)
      return this.pluginUserConfig;

    const configPath = path.resolve(`./${this.name}.js`);

    if (!fs.existsSync(configPath))
      return null;

    const config = require(configPath);

    config.rules = config.extends.reduce((result, section) => {
      const { rules } = require(path.resolve(section));

      return { ...result, ...rules };
    }, {});

    this.pluginUserConfig = config;

    return this.pluginUserConfig;
  }

  save(configName, userConfig = {}) {
    let config = userConfig;

    if (configName && this.configs[configName]) {
      config = {
        ...this.configs[configName],
        ...config,
      };
    }

    config = this.prepareConfig(config);

    const configJS = `module.exports = ${JSON.stringify(config, null, INDENT)};`;

    fs.writeFileSync(
      `./${this.name}.js`,
      configJS
    );
  }

  prepareConfig(config) {
    return {
      ...config,
      extends: this.saveRules(config.rules),
      plugins: this.name === BASE_CONFIG_NAME
        ? undefined
        : [this.name],
      rules: undefined,
    };
  }

  saveRules(rules) {
    const categories = this.prepareRules(rules);

    if (!fs.existsSync('./rules'))
      fs.mkdirSync('./rules');

    if (!fs.existsSync(`./rules/${this.name}`))
      fs.mkdirSync(`./rules/${this.name}`);

    return Object.keys(categories).map((category) => {
      let config = JSON.stringify({
        rules: categories[category],
      }, null, INDENT);

      Object.keys(categories[category]).forEach((ruleName) => {
        const rule = this.rules[ruleName];

        config = config.replace(
          `${INDENT}${INDENT}"${ruleName}"`,
          (match) => {
            let result = `${INDENT}${INDENT}// ${rule.link}${EOL}${match}`;

            if (rule.description)
              result = `${INDENT}${INDENT}// ${rule.description}${EOL}${result}`;

            return `${EOL}${result}`;
          }
        );
      });
      config = `module.exports = ${config};${EOL}`;

      const fileName = `./rules/${this.name}/${category}.js`;

      fs.writeFileSync(fileName, config);

      return fileName;
    });
  }

  prepareRules(rules = {}) {
    return Object.keys(this.rules)
      .filter(key => !this.rules[key].deprecated)
      .map(key => this.rules[key])
      .reduce((result, rule) => {
        if (!result[rule.category])
          result[rule.category] = {};

        result[rule.category][rule.name] = normalizeRuleValue(rules[rule.name]);

        return result;
      }, {});
  }
}

module.exports = Config;
