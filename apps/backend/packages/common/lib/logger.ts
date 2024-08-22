import { type LoggerOptions, pino } from 'pino';
import type { PrettyOptions } from 'pino-pretty';

const pinoPrettyOptions = {
  destination: 1,
  colorize: true,
  translateTime: 'HH:MM:ss.l',
  ignore: 'SYS:pid,hostname',
} satisfies PrettyOptions;

const loggerSetup = {
  dev: {
    transport: {
      targets: [
        {
          target: 'pino-pretty',
          options: pinoPrettyOptions,
        },
        {
          target: 'pino/file',
          options: {
            destination: './tmp/logs',
          },
        },
      ],
    },
  } satisfies LoggerOptions,
  prod: true,
  test: false,
};

export function buildLogger(nodeEnv = 'dev') {
  if (nodeEnv === 'dev') {
    const logger = pino(loggerSetup.dev);
    return logger;
  }
  // prod
  return pino();
}

export const logger = buildLogger(process.env.NODE_ENV);
