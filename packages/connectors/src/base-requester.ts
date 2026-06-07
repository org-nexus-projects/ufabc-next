import { randomUUID } from 'node:crypto';
import { type FetchOptions, type FetchRequest, ofetch } from 'ofetch';

import { MAX_LOG_SIZE, TRACING_DIRECTION, TRACING_MESSAGES } from './constants.js';

type LogFn = (obj: unknown, msg?: string) => void;

export interface Logger {
  info: LogFn;
  warn: LogFn;
  error: LogFn;
  child: (bindings: Record<string, unknown>) => Logger;
}

export interface TraceProvider {
  getTraceId: () => string;
  getLogger: () => Logger | undefined;
}

const noopLogger: Logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  child: () => noopLogger,
};

export class BaseRequester {
  protected readonly requester: ReturnType<typeof ofetch.create>;
  protected readonly baseURL?: string;
  protected readonly traceProvider?: TraceProvider;

  constructor(baseURL?: string, traceProvider?: TraceProvider) {
    this.baseURL = baseURL;
    this.traceProvider = traceProvider;
    this.requester = ofetch.create({
      baseURL,
      onRequest: ({ request, options }) => {
        const logger = this.getLogger() ?? noopLogger;
        const traceId = this.getTraceId();

        const existingHeaders =
          options.headers instanceof Headers
            ? Object.fromEntries(options.headers.entries())
            : options.headers || {};

        // @ts-ignore - ofetch allows custom headers
        options.headers = { ...existingHeaders, 'global-trace-id': traceId } as any;

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
        const logger = this.getLogger() ?? noopLogger;
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
        const logger = this.getLogger() ?? noopLogger;

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
        const logger = this.getLogger() ?? noopLogger;

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

  protected getLogger(): Logger | undefined {
    return this.traceProvider?.getLogger();
  }

  protected getTraceId(): string {
    return this.traceProvider?.getTraceId() ?? randomUUID();
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
    const logger = this.getLogger() ?? noopLogger;
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
