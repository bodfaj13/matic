type LogLevel = 'log' | 'info' | 'debug' | 'warn' | 'error';

function isVerboseLoggingEnabled(): boolean {
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV;
  return appEnv === 'local' || appEnv === 'test';
}

function formatArgs(level: LogLevel, args: unknown[]): unknown[] {
  const timestamp = new Date().toISOString();
  const prefix = `[${level.toUpperCase()}] [${timestamp}]`;

  if (args.length > 0 && typeof args[0] === 'string') {
    return [`${prefix} ${args[0]}`, ...args.slice(1)];
  }
  return [prefix, ...args];
}

export function log(...args: unknown[]): void {
  if (isVerboseLoggingEnabled()) {
    console.log(...formatArgs('log', args));
  }
}

export function logInfo(...args: unknown[]): void {
  if (isVerboseLoggingEnabled()) {
    console.info(...formatArgs('info', args));
  }
}

export function logDebug(...args: unknown[]): void {
  if (isVerboseLoggingEnabled()) {
    console.debug(...formatArgs('debug', args));
  }
}

export function logWarn(...args: unknown[]): void {
  if (isVerboseLoggingEnabled()) {
    console.warn(...formatArgs('warn', args));
  }
}

export function logError(...args: unknown[]): void {
  console.error(...formatArgs('error', args));
}

export function logGroup(label: string): void {
  if (isVerboseLoggingEnabled()) {
    console.group(label);
  }
}

export function logGroupEnd(): void {
  if (isVerboseLoggingEnabled()) {
    console.groupEnd();
  }
}
