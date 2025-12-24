import type { Client } from '@aws-sdk/types';
import { requestContext } from '@fastify/request-context';
import { logger as defaultLogger } from '@/utils/logger.js';
import { randomUUID } from 'node:crypto';

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
        const commandName = args.input?.constructor?.name || 'UnknownCommand';

        logger.info(
          {
            globalTraceId: traceId,
            service: this.client.constructor.name,
            command: commandName,
          },
          `AWS Request: ${commandName}`,
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
            `AWS Response Success: ${commandName}`,
          );

          return result;
        } catch (error) {
          logger.error(
            {
              globalTraceId: traceId,
              command: commandName,
              error,
            },
            `AWS Request Failed: ${commandName}`,
          );
          throw error;
        }
      },
      { step: 'initialize', name: 'NodeStackLoggingMiddleware' },
    );
  }

  protected getLogger() {
    return requestContext.get('log') ?? defaultLogger.child({ aws: true });
  }

  protected getTraceId() {
    return requestContext.get('traceId') ?? randomUUID();
  }
}
