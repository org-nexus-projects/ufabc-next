import { type LoggerOptions, pino } from 'pino';
import type { PrettyOptions } from 'pino-pretty';
import type { Options as AxiomOptions } from '@axiomhq/pino';
import { mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const logDirectory = join(process.cwd(), 'logs');

if (!existsSync(logDirectory)) {
  mkdirSync(logDirectory, { recursive: true });
}

const getLogFilePath = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return join(logDirectory, `app-${year}-${month}-${day}.log`);
};

const pinoPrettyOptions = {
  colorize: true,
  translateTime: 'SYS:standard', // Uses system's local time
  ignore: 'pid,hostname',
  messageKey: 'message',
} satisfies PrettyOptions;

const axiomOptions = {
  dataset: process.env.AXIOM_DATASET as string,
  token: process.env.AXIOM_TOKEN as string,
} satisfies AxiomOptions;

const loggerSetup = {
  dev: {
    timestamp: pino.stdTimeFunctions.isoTime,
    messageKey: 'message',
    serializers: {
      error: pino.stdSerializers.err,
    },
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

  prod: {
    timestamp: pino.stdTimeFunctions.isoTime,
    serializers: {
      error: pino.stdSerializers.err,
    },
    transport: {
      targets: [
        {
          target: 'pino/file',
          options: {
            destination: getLogFilePath(),
            mkdir: true,
          },
        },
        {
          target: '@axiomhq/pino',
          options: axiomOptions,
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
