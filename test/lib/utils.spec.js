const path = require('path');

const { BASE_CONFIG_NAME, RULE_VALUES_MAP } = require('../../lib/const.js');

jest.mock('temp-write');
jest.mock('eslint');

const mockConfig = {
  extends: ['./rules/base/category.js'],
  test: 'test',
};

jest.mock(require('path').resolve('./base.js'), () => mockConfig, { virtual: true });

describe('./lib/utils.js', () => {
  const report = 'report';
  const tempWriteSyncResult = 'tempWriteSyncResult';

  let executeOnFiles;
  let CLIEngine;
  let utils;
  let tempWrite;
  let eslint;

  beforeEach(() => {
    tempWrite = require('temp-write');
    eslint = require('eslint');

    tempWrite.sync = jest.fn().mockReturnValue(tempWriteSyncResult);

    executeOnFiles = jest.fn().mockReturnValue(report);
    CLIEngine = jest.fn().mockImplementation(function () {
      this.executeOnFiles = executeOnFiles;
    });
    CLIEngine.outputFixes = jest.fn();
    eslint.CLIEngine = CLIEngine;

    utils = require('../../lib/utils.js');
  });

  afterEach(() => {
    jest.resetModules();
  });

  describe('normalizeRuleValue', () => {
    it('should return correct value', () => {
      const test = { test: 'test' };

      expect(utils.normalizeRuleValue()).toBe(RULE_VALUES_MAP[0]);
      expect(utils.normalizeRuleValue(1)).toBe(RULE_VALUES_MAP[1]);
      expect(utils.normalizeRuleValue(3)).toBe(RULE_VALUES_MAP[0]);
      expect(utils.normalizeRuleValue(['1', 2])).toEqual(['1', 2]);
      expect(utils.normalizeRuleValue([1, 2])).toEqual([RULE_VALUES_MAP[1], 2]);
      expect(utils.normalizeRuleValue([3, 2])).toEqual([RULE_VALUES_MAP[0], 2]);
      expect(utils.normalizeRuleValue(test)).toBe(test);
    });
  });

  describe('createCLIEngine', () => {
    it('should create CLIEngine with correct config', () => {
      expect(utils.createCLIEngine()).toBe(CLIEngine.mock.instances[0]);
      expect(CLIEngine).toHaveBeenCalledTimes(1);
      expect(CLIEngine).toHaveBeenCalledWith({
        configFile: tempWriteSyncResult,
        cwd: path.resolve('./'),
        fix: true,
        useEslintrc: false,
      });
      expect(tempWrite.sync.mock.calls[0]).toEqual([
        JSON.stringify({
          ...mockConfig,
          extends: mockConfig.extends.map(file => path.resolve(file)),
        }),
        `${BASE_CONFIG_NAME}.json`,
      ]);
    });
  });

  describe('formatFiles', () => {
    it('should fix lint issues in js files', () => {
      utils.formatFiles();

      expect(executeOnFiles).toHaveBeenCalledTimes(1);
      expect(executeOnFiles).toHaveBeenCalledWith(['**/*.js']);
      expect(CLIEngine.outputFixes).toHaveBeenCalledTimes(1);
      expect(CLIEngine.outputFixes).toHaveBeenCalledWith(report);
    });
  });
});
