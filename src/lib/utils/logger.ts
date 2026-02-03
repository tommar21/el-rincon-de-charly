/**
 * Conditional logger that only logs in development mode.
 * Provides structured logging with prefixes for easy filtering.
 */

const isDev = process.env.NODE_ENV === 'development';

type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

interface LoggerOptions {
  prefix?: string;
  enabled?: boolean;
}

function createLogFunction(level: LogLevel, prefix: string, enabled: boolean) {
  return (...args: unknown[]) => {
    if (!enabled) return;
    const prefixedArgs = prefix ? [`[${prefix}]`, ...args] : args;
    console[level](...prefixedArgs);
  };
}

export function createLogger(options: LoggerOptions = {}) {
  const { prefix = '', enabled = isDev } = options;

  return {
    log: createLogFunction('log', prefix, enabled),
    info: createLogFunction('info', prefix, enabled),
    warn: createLogFunction('warn', prefix, enabled),
    error: createLogFunction('error', prefix, enabled),
    debug: createLogFunction('debug', prefix, enabled),
  };
}

// Pre-configured loggers for common use cases
export const gameLogger = createLogger({ prefix: 'Game' });
export const realtimeLogger = createLogger({ prefix: 'Realtime' });
export const matchmakingLogger = createLogger({ prefix: 'Matchmaking' });
export const walletLogger = createLogger({ prefix: 'Wallet' });
export const authLogger = createLogger({ prefix: 'Auth' });

// Default logger without prefix
export const logger = createLogger();

export default logger;
