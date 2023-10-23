import { pino } from 'pino';
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
      target: 'pino-pretty',
      options: pinoPrettyOptions,
    },
  },
  prod: true,
  test: false,
};

function buildLogger(nodeEnv: string = 'dev') {
  if (nodeEnv === 'dev') {
    const logger = pino(loggerSetup.dev);
    return logger;
  } else {
    // prod
    return pino();
  }
}

export const logger = buildLogger(process.env.NODE_ENV);
