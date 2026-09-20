import { requestContext } from '@fastify/request-context'
import { createServerLogger } from '@next/logger/server'
import { randomUUID } from 'node:crypto'

const env = process.env.NODE_ENV === 'production' ? 'production' : 'dev'

export const logger = createServerLogger(env, process.env.LOG_LEVEL)

export function getClassLogger(instance: object, bindings: Record<string, unknown> = {}) {
  return logger.child({ component: instance.constructor.name, ...bindings })
}

export function getGlobalTraceId() {
  return requestContext.get('traceId') ?? randomUUID()
}
