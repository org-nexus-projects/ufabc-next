import { pino, type Logger } from 'pino'
import { Axiom } from '@axiomhq/js'

export type Env = 'dev' | 'production'

const DEFAULT_LEVEL: Record<Env, string> = { dev: 'debug', production: 'info' }
const TRANSMIT_LEVEL: Record<Env, string> = { dev: 'debug', production: 'warn' }

const LEVEL_MAP: Record<string, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
}

const CONSOLE_METHOD: Record<string, 'debug' | 'info' | 'warn' | 'error'> = {
  trace: 'debug',
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
  fatal: 'error',
}

export type BrowserLoggerOptions = {
  level?: string
  axiomDataset?: string
  axiomToken?: string
}

export function createBrowserLogger(env: Env, opts?: BrowserLoggerOptions): Logger {
  const dataset = opts?.axiomDataset
  const token = opts?.axiomToken
  const axiom = token && dataset ? new Axiom({ token }) : null

  function noop(): void {}

  return pino({
    level: opts?.level ?? DEFAULT_LEVEL[env],
    browser: {
      write: noop,
      transmit: {
        level: TRANSMIT_LEVEL[env],
        send: (levelName, logEvent) => {
          const mergedBindings = Object.assign({}, ...logEvent.bindings)

          let bindingsObj: Record<string, unknown> = {}
          const textParts: string[] = []

          for (const arg of logEvent.messages ?? []) {
            if (typeof arg === 'object' && arg !== null) {
              Object.assign(bindingsObj, arg)
            } else if (arg !== undefined) {
              textParts.push(String(arg))
            }
          }

          const event: Record<string, unknown> = {
            level: LEVEL_MAP[levelName] ?? 30,
            time: new Date(logEvent.ts).toISOString(),
          }

          if (textParts.length > 0) {
            event.message = textParts.join(' ')
          }

          Object.assign(event, mergedBindings, bindingsObj)

          if (env === 'dev') {
            console[CONSOLE_METHOD[levelName] ?? 'log'](event)
          }

          if (axiom && dataset) {
            axiom.ingest(dataset, [event])
            axiom.flush()
          }
        },
      },
    },
  })
}
