jest.mock('../../lib/undefined.js', () => {}, { virtual: true });

jest.mock('../../lib/init.js', () => {
  global.requireLibInitJs();
}, { virtual: true });

jest.mock('../../lib/check.js', () => {}, { virtual: true });
jest.mock('../../lib/update.js', () => {}, { virtual: true });

describe('./bin/index.js', () => {
  let processOn;
  let processExit;
  let processArgv;
  let consoleLog;

  beforeEach(() => {
    processOn = process.on;
    process.on = jest.fn();

    processExit = process.exit;
    process.exit = jest.fn();

    processArgv = process.argv;
    process.argv = [];

    consoleLog = console.log;
    console.log = jest.fn();

    global.requireLibInitJs = jest.fn();
  });

  afterEach(() => {
    process.on = processOn;
    process.exit = processExit;
    process.argv = processArgv;
    console.log = consoleLog;

    jest.resetModules();
  });

  it('should listen unhandledRejection event', () => {
    require('../../bin/index.js');

    expect(process.on).toHaveBeenCalledTimes(1);
    expect(process.on.mock.calls[0][0]).toEqual('unhandledRejection');

    expect(process.exit).toHaveBeenCalledTimes(1);
    expect(process.exit).toBeCalledWith(1);
    expect(console.log).toHaveBeenCalledTimes(1);

    process.on.mock.calls[0][1]();

    expect(process.exit).toHaveBeenCalledTimes(2);
    expect(console.log).toHaveBeenCalledTimes(2);
  });

  it('should exit with code 1 if command not provided', () => {
    require('../../bin/index.js');

    expect(process.exit).toHaveBeenCalledTimes(1);
    expect(process.exit).toBeCalledWith(1);
  });

  it('should require proper module', () => {
    process.argv = ['init'];

    expect(global.requireLibInitJs).toHaveBeenCalledTimes(0);

    require('../../bin/index.js');

    expect(process.exit).toHaveBeenCalledTimes(0);
    expect(global.requireLibInitJs).toHaveBeenCalledTimes(1);
  });
});
