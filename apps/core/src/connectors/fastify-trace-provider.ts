import { requestContext } from '@fastify/request-context';
import { randomUUID } from 'node:crypto';
import type { Logger, TraceProvider } from '@next/connectors/base-requester';

export const fastifyTraceProvider: TraceProvider = {
  getTraceId: () => requestContext.get('traceId') ?? randomUUID(),
  getLogger: () => requestContext.get('log') as Logger | undefined,
};
