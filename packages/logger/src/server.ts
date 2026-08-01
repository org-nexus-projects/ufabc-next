import { pino, stdSerializers, type Logger } from 'pino'

export type Env = 'dev' | 'production'

const DEFAULT_LEVEL: Record<Env, string> = { dev: 'debug', production: 'info' }

export function createServerLogger(env: Env, level?: string) {
  const devTarget = env === 'dev'
    ? {
        target: 'pino-pretty',
        options: {
          destination: 1,
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
          messageKey: 'message',
        },
        level: 'info' as const,
      }
    : null

  const axiomTarget = process.env.AXIOM_TOKEN && process.env.AXIOM_DATASET
    ? {
        target: '@axiomhq/pino',
        options: {
          dataset: process.env.AXIOM_DATASET,
          token: process.env.AXIOM_TOKEN,
        },
      }
    : null

  const levelOption = level ?? DEFAULT_LEVEL[env]
  const targets = [devTarget, axiomTarget].filter(
    (t): t is NonNullable<typeof t> => t != null
  )

  const pinoOptions: Record<string, unknown> = {
    level: levelOption,
    timestamp: pino.stdTimeFunctions.isoTime,
    messageKey: 'message',
    serializers: {
      error: stdSerializers.err,
      err: stdSerializers.err,
    },
  }

  if (targets.length > 0) {
    pinoOptions.transport = { targets }
  }

  return pino(pinoOptions) as Logger
}
