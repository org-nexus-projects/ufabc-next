import { type LoggerOptions, pino } from 'pino';
import type { PrettyOptions } from 'pino-pretty';
import { mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const logDirectory = join(process.cwd(), 'logs');

// Ensure logs directory exists
if (!existsSync(logDirectory)) {
  mkdirSync(logDirectory, { recursive: true });
}

const getLogFilePath = () => {
  const dateString = new Date().toISOString().split('T')[0];
  return join(logDirectory, `app-${dateString}.log`);
};

const timeFormatter = {
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
};

const pinoPrettyOptions = {
  colorize: true,
  translateTime: 'HH:MM:ss.l',
  ignore: 'pid,hostname',
} satisfies PrettyOptions;

// Logger configurations for different environments
const loggerSetup = {
  dev: {
    timestamp: timeFormatter.timestamp,
    transport: {
      targets: [
        {
          target: 'pino-pretty',
          options: {
            ...pinoPrettyOptions,
            destination: 1,
          },
          level: 'info',
        },
        {
          target: 'pino/file',
          options: {
            destination: getLogFilePath(),
            mkdir: true,
          },
        },
      ],
    },
  } satisfies LoggerOptions,

  // Minimal config for production
  prod: {
    timestamp: timeFormatter.timestamp,
    transport: {
      targets: [
        {
          target: 'pino/file',
          options: {
            destination: getLogFilePath(),
            mkdir: true,
            timestamp: timeFormatter.timestamp,
          },
        },
      ],
    },
  } satisfies LoggerOptions,
};

export function buildLogger(env: 'dev' | 'prod' = 'dev') {
  const baseConfig = {
    level: process.env.LOG_LEVEL ?? (env === 'dev' ? 'info' : 'info'),
  } satisfies LoggerOptions;

  const config =
    env !== 'dev'
      ? { ...baseConfig, ...loggerSetup.prod }
      : { ...loggerSetup.dev };

  return pino(config);
}

export const logger = buildLogger(
  (process.env.NODE_ENV as 'dev' | 'prod') ?? 'dev',
);
