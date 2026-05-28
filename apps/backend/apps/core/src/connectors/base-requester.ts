// @ts-nocheck only for the logger
import { requestContext } from '@fastify/request-context';
import { randomUUID } from 'node:crypto';
import { type FetchOptions, type FetchRequest, ofetch } from 'ofetch';

import {
  MAX_LOG_SIZE,
  TRACING_DIRECTION,
  TRACING_MESSAGES,
} from '@/constants.js';
import { logger as defaultLogger } from '@/utils/logger.js';

export class BaseRequester {
  protected readonly requester: ReturnType<typeof ofetch.create>;
  protected readonly baseURL?: string;

  constructor(baseURL?: string, globalTraceId?: string) {
    this.baseURL = baseURL;
    this.requester = ofetch.create({
      baseURL,
      onRequest: ({ request, options }) => {
        const logger =
          this.getLogger() ?? defaultLogger.child({ connector: true });
        const traceId = globalTraceId || this.getTraceId();

        const existingHeaders =
          options.headers instanceof Headers
            ? Object.fromEntries(options.headers.entries())
            : options.headers || {};

        options.headers = {
          ...existingHeaders,
          'global-trace-id': traceId,
        };

        const requestPath = this.getRequestPath(request);
        const fullUrl = this.buildFullUrl(requestPath);

        logger.info(
          {
            globalTraceId: traceId,
            direction: TRACING_DIRECTION.OUTGOING,
            method: options.method || 'GET',
            url: fullUrl,
            baseURL: this.baseURL,
            path: requestPath,
            headers: options.headers,
            responseType: options.responseType,
            body: options.body,
          },
          TRACING_MESSAGES.OUTGOING_REQUEST
        );
      },
      onResponse: ({ response, options }) => {
        const logger =
          this.getLogger() ?? defaultLogger.child({ connector: true });
        const traceId = this.getTraceId();

        const logData = {
          globalTraceId: traceId,
          direction: TRACING_DIRECTION.INCOMING,
          method: options.method || 'GET',
          url: response.url,
          status: response.status,
          headers: response.headers,
          responseType: options.responseType || 'json',
          body: this.truncateForLogging(response._data),
        };

        if (response.status >= 500) {
          logger.error(
            logData,
            TRACING_MESSAGES.INCOMING_RESPONSE_WITH_5XX_STATUS
          );
          return;
        }

        if (response.status >= 400) {
          logger.warn(
            logData,
            TRACING_MESSAGES.INCOMING_RESPONSE_WITH_4XX_STATUS
          );
          return;
        }

        logger.info(logData, TRACING_MESSAGES.INCOMING_RESPONSE);
      },
      onResponseError: ({ response }) => {
        const logger =
          this.getLogger() ?? defaultLogger.child({ connector: true });

        logger.error(
          {
            direction: TRACING_DIRECTION.INCOMING,
            status: response.status,
            url: response.url,
            data: this.truncateForLogging(response._data),
          },
          TRACING_MESSAGES.INCOMING_REQUEST_FAILED
        );
      },
      onRequestError: ({ error }) => {
        const logger =
          this.getLogger() ?? defaultLogger.child({ connector: true });

        logger.error(
          {
            direction: TRACING_DIRECTION.OUTGOING,
            error,
          },
          TRACING_MESSAGES.OUTGOING_REQUEST_FAILED
        );
      },
    });
  }

  protected async request<T = unknown>(
    url: FetchRequest,
    options?: FetchOptions
  ): Promise<T> {
    return this.requester(url, options) as Promise<T>;
  }

  protected getLogger() {
    return requestContext.get('log');
  }

  protected getTraceId() {
    return requestContext.get('traceId') ?? randomUUID();
  }

  private getRequestPath(request: FetchRequest): string {
    if (typeof request === 'string') {
      return request;
    }

    if (request instanceof Request) {
      return request.url;
    }

    return '';
  }

  private buildFullUrl(requestPath: string): string {
    if (
      requestPath.startsWith('http://') ||
      requestPath.startsWith('https://')
    ) {
      return requestPath;
    }

    if (!this.baseURL) {
      return requestPath;
    }

    if (!requestPath) {
      return this.baseURL;
    }

    if (requestPath.startsWith('/')) {
      return `${this.baseURL}${requestPath}`;
    }

    return `${this.baseURL}/${requestPath}`;
  }

  private buildRequestHeaders(
    headers: FetchOptions['headers'],
    traceId: string
  ) {
    const existingHeaders =
      headers instanceof Headers
        ? Object.fromEntries(headers.entries())
        : headers || {};

    return {
      ...existingHeaders,
      'global-trace-id': traceId,
    };
  }

  protected async requestRaw(
    url: FetchRequest,
    options?: FetchOptions
  ): Promise<Response> {
    const traceId = this.getTraceId();
    const logger = this.getLogger() ?? defaultLogger.child({ connector: true });
    const requestPath = this.getRequestPath(url);
    const fullUrl = this.buildFullUrl(requestPath);
    const headers = this.buildRequestHeaders(options?.headers, traceId);

    logger.info(
      {
        globalTraceId: traceId,
        direction: TRACING_DIRECTION.OUTGOING,
        method: options?.method || 'GET',
        url: fullUrl,
        baseURL: this.baseURL,
        path: requestPath,
        headers,
        responseType: options?.responseType,
        body: options?.body,
      },
      TRACING_MESSAGES.OUTGOING_REQUEST
    );

    try {
      const response = await ofetch.raw(url, {
        ...options,
        headers,
      });

      logger.info(
        {
          globalTraceId: traceId,
          direction: TRACING_DIRECTION.INCOMING,
          method: options?.method || 'GET',
          url: response.url,
          status: response.status,
          headers: response.headers,
        },
        TRACING_MESSAGES.INCOMING_RESPONSE
      );

      return response;
    } catch (error) {
      logger.error(
        {
          direction: TRACING_DIRECTION.OUTGOING,
          error,
        },
        TRACING_MESSAGES.OUTGOING_REQUEST_FAILED
      );
      throw error;
    }
  }

  protected truncateForLogging(data: unknown): unknown {
    if (data === null || data === undefined) {
      return data;
    }

    const stringified = typeof data === 'string' ? data : JSON.stringify(data);
    const sizeInBytes = Buffer.byteLength(stringified, 'utf8');

    if (sizeInBytes > MAX_LOG_SIZE) {
      return `[Data truncated: ${(sizeInBytes / 1024).toFixed(2)}KB exceeds 600KB limit]`;
    }

    return data;
  }
}
