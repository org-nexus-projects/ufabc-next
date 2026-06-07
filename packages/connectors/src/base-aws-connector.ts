import type { Client } from '@aws-sdk/types';

import { randomUUID } from 'node:crypto';

import type { Logger, TraceProvider } from './base-requester.js';

const noopLogger: Logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  child: () => noopLogger,
};

export abstract class BaseAWSConnector<TClient extends Client<any, any, any>> {
  protected readonly client: TClient;
  protected readonly traceProvider?: TraceProvider;

  constructor(client: TClient, traceProvider?: TraceProvider) {
    this.client = client;
    this.traceProvider = traceProvider;
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

  protected getLogger(): Logger {
    return this.traceProvider?.getLogger() ?? noopLogger.child({ aws: true });
  }

  protected getTraceId(): string {
    return this.traceProvider?.getTraceId() ?? randomUUID();
  }
}
