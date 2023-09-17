import { pino } from 'pino';
import { PrettyOptions } from 'pino-pretty';
import { Config } from '../config';

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

function buildLogger(nodeEnv: Config['NODE_ENV']) {
  if (nodeEnv === 'dev') {
    const logger = pino(loggerSetup.dev);
    return logger;
  } else {
    // prod
    return pino();
  }
}

export const logger = buildLogger(Config.NODE_ENV);
