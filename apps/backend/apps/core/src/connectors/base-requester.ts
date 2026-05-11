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

const SENSITIVE_HEADER_NAMES = new Set([
  'cookie',
  'authorization',
  'sesskey',
  'set-cookie',
]);

function redactHeaders(
  headers: Headers | Record<string, string>
): Record<string, string> {
  const entries =
    headers instanceof Headers
      ? [...headers.entries()]
      : Object.entries(headers);

  const redacted: Record<string, string> = {};
  for (const [key, value] of entries) {
    redacted[key] = SENSITIVE_HEADER_NAMES.has(key.toLowerCase())
      ? '[REDACTED]'
      : value;
  }
  return redacted;
}

interface RequestConfig {
  headers: Record<string, string>;
  fullUrl: string;
}

function configRequest(
  request: FetchRequest,
  options: FetchOptions | undefined,
  baseURL: string | undefined,
  logger: ReturnType<typeof defaultLogger.child>,
  traceId: string,
  additionalData?: Record<string, unknown>
): RequestConfig {
  // Merge headers with global trace ID
  const existingHeaders =
    options?.headers instanceof Headers
      ? Object.fromEntries(options.headers.entries())
      : options?.headers || {};

  const headers = {
    ...existingHeaders,
    'global-trace-id': traceId,
  } as Record<string, string>;

  // Build full URL
  const requestPath =
    typeof request === 'string'
      ? request
      : request instanceof Request
        ? request.url
        : '';

  const fullUrl =
    baseURL && requestPath
      ? `${baseURL}${requestPath.startsWith('/') ? '' : '/'}${requestPath}`
      : baseURL || requestPath || '';

  // Log outgoing request
  logger.info(
    {
      globalTraceId: traceId,
      direction: TRACING_DIRECTION.OUTGOING,
      method: options?.method || 'GET',
      url: fullUrl,
      baseURL,
      path: requestPath,
      headers: redactHeaders(headers),
      ...additionalData,
    },
    TRACING_MESSAGES.OUTGOING_REQUEST
  );

  return { headers, fullUrl };
}

export class BaseRequester {
  protected readonly requester: ReturnType<typeof ofetch.create>;
  protected readonly baseURL?: string;

  constructor(baseURL?: string, globalTraceId?: string) {
    this.baseURL = baseURL;
    this.requester = this.createRequester(baseURL, globalTraceId);
  }

  private createRequester(baseURL?: string, globalTraceId?: string) {
    return ofetch.create({
      baseURL,
      onRequest: ({ request, options }) => {
        const logger =
          this.getLogger() ?? defaultLogger.child({ connector: true });
        const traceId = globalTraceId || this.getTraceId();

        configRequest(request, options, this.baseURL, logger, traceId, {
          responseType: options?.responseType,
          body: options?.body,
        });

        // Update options with merged headers
        const existingHeaders =
          options.headers instanceof Headers
            ? Object.fromEntries(options.headers.entries())
            : options.headers || {};

        options.headers = {
          ...existingHeaders,
          'global-trace-id': traceId,
        };
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
          headers: redactHeaders(response.headers),
          responseType: options.responseType || 'json',
          body: this.truncateForLogging(response._data),
        };

        if (response.status >= 500) {
          logger.error(
            logData,
            TRACING_MESSAGES.INCOMING_RESPONSE_WITH_5XX_STATUS
          );
        } else if (response.status >= 400) {
          logger.warn(
            logData,
            TRACING_MESSAGES.INCOMING_RESPONSE_WITH_4XX_STATUS
          );
        } else {
          logger.info(logData, TRACING_MESSAGES.INCOMING_RESPONSE);
        }
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

  protected async requestRaw(
    url: FetchRequest,
    options?: FetchOptions
  ): Promise<Response> {
    const traceId = this.getTraceId();
    const existingHeaders: Record<string, string> =
      options?.headers instanceof Headers
        ? Object.fromEntries(options.headers.entries())
        : Array.isArray(options?.headers)
          ? Object.fromEntries(options.headers as [string, string][])
          : (options?.headers ?? {}) as Record<string, string>;

    return ofetch.raw(url, {
      ...options,
      baseURL: this.baseURL,
      headers: {
        ...existingHeaders,
        'global-trace-id': traceId,
      },
    });
  }

  protected getLogger() {
    return requestContext.get('log');
  }

  protected getTraceId() {
    return requestContext.get('traceId') ?? randomUUID();
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
