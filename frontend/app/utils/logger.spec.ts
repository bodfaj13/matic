describe('logger', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAppEnv = process.env.NEXT_PUBLIC_APP_ENV;

  let logSpy: jest.SpyInstance;
  let infoSpy: jest.SpyInstance;
  let debugSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;
  let groupSpy: jest.SpyInstance;
  let groupEndSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    groupSpy = jest.spyOn(console, 'group').mockImplementation(() => {});
    groupEndSpy = jest.spyOn(console, 'groupEnd').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalNodeEnv,
      configurable: true,
    });
    process.env.NEXT_PUBLIC_APP_ENV = originalAppEnv;
  });

  function setEnv({
    NODE_ENV,
    APP_ENV,
  }: {
    NODE_ENV?: string;
    APP_ENV?: string;
  }) {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: NODE_ENV,
      configurable: true,
    });
    if (APP_ENV === undefined) {
      delete process.env.NEXT_PUBLIC_APP_ENV;
    } else {
      process.env.NEXT_PUBLIC_APP_ENV = APP_ENV;
    }
  }

  it('logs at info/debug/warn/log/group when NODE_ENV=development', async () => {
    setEnv({ NODE_ENV: 'development' });
    const logger = await import('./logger');

    logger.log('hello');
    logger.logInfo('hi');
    logger.logDebug('dbg');
    logger.logWarn('w');
    logger.logGroup('g');
    logger.logGroupEnd();

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(debugSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(groupSpy).toHaveBeenCalledTimes(1);
    expect(groupEndSpy).toHaveBeenCalledTimes(1);
  });

  it('logs verbose when NEXT_PUBLIC_APP_ENV=local', async () => {
    setEnv({ NODE_ENV: 'production', APP_ENV: 'local' });
    const logger = await import('./logger');

    logger.logInfo('hi');
    expect(infoSpy).toHaveBeenCalled();
  });

  it('logs verbose when NEXT_PUBLIC_APP_ENV=test', async () => {
    setEnv({ NODE_ENV: 'production', APP_ENV: 'test' });
    const logger = await import('./logger');

    logger.logInfo('hi');
    expect(infoSpy).toHaveBeenCalled();
  });

  it('suppresses verbose logs in production with no APP_ENV override', async () => {
    setEnv({ NODE_ENV: 'production', APP_ENV: undefined });
    const logger = await import('./logger');

    logger.log('nope');
    logger.logInfo('nope');
    logger.logDebug('nope');
    logger.logWarn('nope');
    logger.logGroup('nope');
    logger.logGroupEnd();

    expect(logSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
    expect(debugSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(groupSpy).not.toHaveBeenCalled();
    expect(groupEndSpy).not.toHaveBeenCalled();
  });

  it('logError always emits regardless of env', async () => {
    setEnv({ NODE_ENV: 'production', APP_ENV: undefined });
    const logger = await import('./logger');

    logger.logError('boom');
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it('prefixes string messages with [LEVEL] [timestamp]', async () => {
    setEnv({ NODE_ENV: 'development' });
    const logger = await import('./logger');

    logger.logInfo('hello', { extra: 1 });
    const call = infoSpy.mock.calls[0];
    expect(typeof call[0]).toBe('string');
    expect(call[0]).toMatch(/^\[INFO\] \[\d{4}-\d{2}-\d{2}T/);
    expect(call[0]).toContain('hello');
    expect(call[1]).toEqual({ extra: 1 });
  });

  it('emits prefix as a separate first arg when first message is non-string', async () => {
    setEnv({ NODE_ENV: 'development' });
    const logger = await import('./logger');

    logger.logInfo({ a: 1 });
    const call = infoSpy.mock.calls[0];
    expect(typeof call[0]).toBe('string');
    expect(call[0]).toMatch(/^\[INFO\]/);
    expect(call[1]).toEqual({ a: 1 });
  });

  it('logError prefixes properly even in production', async () => {
    setEnv({ NODE_ENV: 'production' });
    const logger = await import('./logger');

    logger.logError('kaboom');
    const call = errorSpy.mock.calls[0];
    expect(call[0]).toMatch(/^\[ERROR\] /);
    expect(call[0]).toContain('kaboom');
  });
});
