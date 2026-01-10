import type { Client } from '@aws-sdk/types';

import { requestContext } from '@fastify/request-context';
import { randomUUID } from 'node:crypto';

import { logger as defaultLogger } from '@/utils/logger.js';

export abstract class BaseAWSConnector<TClient extends Client<any, any, any>> {
  protected readonly client: TClient;

  constructor(client: TClient) {
    this.client = client;
    this.setupMiddleware();
  }

  private setupMiddleware() {
    this.client.middlewareStack.add(
      (next) => async (args) => {
        const logger = this.getLogger();
        const traceId = this.getTraceId();
        // @ts-expect-error - schema is not typed
        const commandName = args.schema?.[2];

        logger.info(
          {
            globalTraceId: traceId,
            service: this.client.constructor.name,
            command: commandName,
          },
          'AWS Request'
        );

        try {
          const result = await next(args);

          logger.info(
            {
              globalTraceId: traceId,
              command: commandName,
              // @ts-expect-error - $metadata is not typed
              metadata: result.response?.$metadata,
            },
            'AWS Response Success'
          );

          return result;
        } catch (error) {
          logger.error(
            {
              globalTraceId: traceId,
              command: commandName,
              error,
            },
            'AWS Request Failed'
          );
          throw error;
        }
      },
      { step: 'initialize', name: 'NodeStackLoggingMiddleware' }
    );
  }

  protected getLogger() {
    return requestContext.get('log') ?? defaultLogger.child({ aws: true });
  }

  protected getTraceId() {
    return requestContext.get('traceId') ?? randomUUID();
  }
}
