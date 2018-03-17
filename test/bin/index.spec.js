jest.mock('colors/safe', () => ({
  red: str => str,
}));

const mockInit = jest.fn();

jest.mock('../../lib/init.js', () => mockInit);

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

    mockInit.mockReset();
  });

  afterEach(() => {
    process.on = processOn;
    process.exit = processExit;
    process.argv = processArgv;
    console.log = consoleLog;

    jest.resetModules();
  });

  it('should listen unhandledRejection event', () => {
    const reason = 'reason';
    const promise = 'promise';

    require('../../bin/index.js');

    expect(process.on).toHaveBeenCalledTimes(1);
    expect(process.on.mock.calls[0][0]).toEqual('unhandledRejection');

    expect(process.exit).toHaveBeenCalledTimes(1);
    expect(process.exit).toBeCalledWith(1);
    expect(console.log).toHaveBeenCalledTimes(1);

    process.exit.mockReset();
    console.log.mockReset();
    process.on.mock.calls[0][1](reason, promise);

    expect(process.exit).toHaveBeenCalledTimes(1);
    expect(process.exit).toBeCalledWith(1);
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toBeCalledWith(
      'Unhandled Rejection at: Promise',
      promise,
      'reason:',
      reason
    );
  });

  it('should exit with code 1 if command not provided', () => {
    require('../../bin/index.js');

    expect(process.exit).toHaveBeenCalledTimes(1);
    expect(process.exit).toBeCalledWith(1);
    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toBeCalledWith('No command to run\n');
  });

  it('should require proper module', () => {
    process.argv = ['init'];

    expect(mockInit).toHaveBeenCalledTimes(0);

    require('../../bin/index.js');

    expect(process.exit).toHaveBeenCalledTimes(0);
    expect(console.log).toHaveBeenCalledTimes(0);
    expect(mockInit).toHaveBeenCalledTimes(1);
  });
});
