import { requestContext } from '@fastify/request-context';
import { type FetchOptions, type FetchRequest, ofetch } from 'ofetch';
import { randomUUID } from 'node:crypto';
import { TRACING_DIRECTION, TRACING_MESSAGES } from '@/constants.js';
import type { FastifyBaseLogger } from 'fastify';

export class BaseRequester {
  protected readonly requester: ReturnType<typeof ofetch.create>;

  constructor(baseURL?: string) {
    const logger = this.getLogger() as FastifyBaseLogger;
    const traceId = this.getTraceId();
    this.requester = ofetch.create({
      baseURL,
      onRequest: ({ options }) => {
        if (!logger) {
          return;
        }

        options.headers = {
          ...options.headers,
          'global-trace-id': traceId,
        } as Headers;

        logger.info(
          {
            globalTraceId: traceId,
            direction: TRACING_DIRECTION.OUTGOING,
            method: options.method || 'GET',
            url: options.baseURL,
            headers: options.headers,
            responseType: options.responseType,
            body: options.body,
          },
          TRACING_MESSAGES.INCOMING_REQUEST,
        );
      },
      onResponse: ({ response, options }) => {
        const logData = {
          globalTraceId: traceId,
          direction: TRACING_DIRECTION.INCOMING,
          method: options.method || 'GET',
          url: response.url,
          status: response.status,
          headers: response.headers,
          responseType: options.responseType || 'json',
        };

        if (response.status >= 500) {
          logger.error(
            logData,
            TRACING_MESSAGES.INCOMING_RESPONSE_WITH_5XX_STATUS,
          );
        } else if (response.status >= 400) {
          logger.warn(
            logData,
            TRACING_MESSAGES.INCOMING_RESPONSE_WITH_4XX_STATUS,
          );
        } else {
          logger.info(logData, TRACING_MESSAGES.INCOMING_REQUEST);
        }
      },
      onResponseError: ({ response }) => {
        logger.error(
          {
            direction: TRACING_DIRECTION.INCOMING,
            status: response.status,
            url: response.url,
            data: response._data,
          },
          TRACING_MESSAGES.INCOMING_REQUEST_FAILED,
        );
      },
      onRequestError: ({ error }) => {
        logger.error(
          {
            direction: TRACING_DIRECTION.OUTGOING,
            error,
          },
          TRACING_MESSAGES.OUTGOING_REQUEST_FAILED,
        );
      },
    });
  }

  protected async request<T = unknown>(
    url: FetchRequest,
    options?: FetchOptions,
  ): Promise<T> {
    return this.requester(url, options) as Promise<T>;
  }

  protected getLogger() {
    return requestContext.get('log');
  }

  protected getTraceId() {
    return requestContext.get('traceId') ?? randomUUID();
  }
}
