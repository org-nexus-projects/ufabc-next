import { pino, stdSerializers, type Logger } from 'pino';

export type Env = 'dev' | 'production';

const DEFAULT_LEVEL: Record<Env, string> = { dev: 'debug', production: 'info' };

export function createServerLogger(env: Env, level?: string) {
  const devTarget =
    env === 'dev'
      ? {
          level: 'info' as const,
          options: {
            colorize: true,
            destination: 1,
            ignore: 'pid,hostname',
            messageKey: 'message',
            translateTime: 'SYS:standard',
          },
          target: 'pino-pretty',
        }
      : null;

  const axiomTarget =
    process.env.AXIOM_TOKEN && process.env.AXIOM_DATASET
      ? {
          options: {
            dataset: process.env.AXIOM_DATASET,
            token: process.env.AXIOM_TOKEN,
          },
          target: '@axiomhq/pino',
        }
      : null;

  const levelOption = level ?? DEFAULT_LEVEL[env];
  const targets = [devTarget, axiomTarget].filter(
    (t): t is NonNullable<typeof t> => t != null
  );

  const pinoOptions: Record<string, unknown> = {
    level: levelOption,
    messageKey: 'message',
    serializers: {
      err: stdSerializers.err,
      error: stdSerializers.err,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  };

  if (targets.length > 0) {
    pinoOptions.transport = { targets };
  }

  return pino(pinoOptions) as Logger;
}

export type NextServerLogger = ReturnType<typeof createServerLogger>;
