import type { Options as AxiomOptions } from '@axiomhq/pino';
import type { PrettyOptions } from 'pino-pretty';

import { mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { type LoggerOptions, pino, stdSerializers } from 'pino';

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
  translateTime: 'SYS:standard',
  ignore: 'pid,hostname',
  messageKey: 'message',
} satisfies PrettyOptions;

const axiomOptions = {
  dataset: process.env.AXIOM_DATASET as string,
  token: process.env.AXIOM_TOKEN as string,
} satisfies AxiomOptions;

const SENSITIVE_KEYS = [
  'authorization',
  'cookie',
  'x-api-key',
  'password',
  'token',
];

const commonConfig = {
  level: process.env.LOG_LEVEL ?? 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  messageKey: 'message',
  serializers: {
    error: stdSerializers.err,
    err: stdSerializers.err,
  },
  redact: {
    paths: [
      'headers.authorization',
      'headers.cookie',
      'headers["x-api-key"]',
      'body.password',
      'body.token',
    ],
    remove: true,
  },
} satisfies LoggerOptions;

const loggerSetup = {
  dev: {
    timestamp: pino.stdTimeFunctions.isoTime,
    messageKey: 'message',
    serializers: {
      error: stdSerializers.err,
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
      error: stdSerializers.err,
      err: stdSerializers.err,
      req: (req) => {
        const raw = stdSerializers.req(req);

        if (raw.headers) {
          const cleanHeaders = { ...raw.headers };
          for (const key of SENSITIVE_KEYS) {
            // @ts-expect-error - we want to remove the key
            cleanHeaders[key] = undefined;
          }

          // @ts-expect-error - we want to stringify the headers
          raw.headers = JSON.stringify(cleanHeaders);
        }
        if (raw.query) {
          // @ts-expect-error - we want to stringify the query
          raw.query = JSON.stringify(raw.query);
        }
        if (raw.params) {
          // @ts-expect-error - we want to stringify the params
          raw.params = JSON.stringify(raw.params);
        }

        return raw;
      },
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
  // Note: We use Object.assign logic or spread.
  // Pino does a shallow merge, so defining serializers in 'prod'
  // overrides the 'commonConfig' serializers completely for that keys.
  return pino({ ...commonConfig, ...loggerSetup[env] });
}

export const logger = buildLogger(
  (process.env.NODE_ENV as 'dev' | 'prod') ?? 'dev'
);
