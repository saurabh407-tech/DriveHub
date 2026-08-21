/* Minimal dependency-free structured logger.
 * Swap for winston/pino in Phase 15 (Deployment) if centralized log
 * shipping is needed; the call sites below won't need to change. */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function timestamp(): string {
  return new Date().toISOString();
}

function write(level: LogLevel, message: string, meta?: unknown): void {
  const line = `[${timestamp()}] [${level.toUpperCase()}] ${message}`;
  if (meta !== undefined) {
    // eslint-disable-next-line no-console
    console[level === 'debug' ? 'log' : level](line, meta);
  } else {
    // eslint-disable-next-line no-console
    console[level === 'debug' ? 'log' : level](line);
  }
}

export const logger = {
  info: (message: string, meta?: unknown) => write('info', message, meta),
  warn: (message: string, meta?: unknown) => write('warn', message, meta),
  error: (message: string, meta?: unknown) => write('error', message, meta),
  debug: (message: string, meta?: unknown) => {
    if (process.env.NODE_ENV !== 'production') write('debug', message, meta);
  },
};
