import { ofetch } from 'ofetch';
import type {
  FetchOptions,
  FetchRequest,
  MappedResponseType,
  ResponseType,
} from 'ofetch';

import {
  MAX_LOG_SIZE,
  TRACING_DIRECTION,
  TRACING_MESSAGES,
} from './constants.ts';

type LogFn = (obj: unknown, msg?: string) => void;

type Logger = {
  info: LogFn;
  warn: LogFn;
  error: LogFn;
  child: (bindings: Record<string, unknown>) => Logger;
};

export type TraceContext = {
  globalTraceId: string;
  component?: string;
  module?: string;
};

export type RequesterOptions = {
  baseURL?: string;
  globalTraceId?: string;
  component?: string;
  module?: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
};

export class BaseRequester {
  private static _rootLogger: Logger | undefined;

  protected readonly requester: ReturnType<typeof ofetch.create>;
  protected readonly traceContext: TraceContext;
  protected readonly baseURL?: string;
  protected readonly defaultHeaders?: Record<string, string>;
  private logger: Logger | undefined;
  private readonly loggerPromise: Promise<Logger>;

  constructor(options?: RequesterOptions) {
    const {
      baseURL,
      globalTraceId,
      component,
      module,
      timeout,
      defaultHeaders,
    } = options ?? {};
    this.baseURL = baseURL;
    this.defaultHeaders = defaultHeaders;

    this.traceContext = {
      component,
      globalTraceId: globalTraceId ?? globalThis.crypto.randomUUID(),
      module,
    };

    this.loggerPromise = this.resolveLogger();
    this.requester = ofetch.create({
      baseURL,
      onRequest: async ({ request, options: requestOptions }) => {
        const logger = await this.loggerPromise;

        const headers: Record<string, string> = {
          ...this.defaultHeaders,
          ...Object.fromEntries(requestOptions.headers.entries()),
          'global-trace-id': this.traceContext.globalTraceId,
        };
        requestOptions.headers = new Headers(headers);

        const requestPath = this.getRequestPath(request);
        const fullUrl = this.buildFullUrl(requestPath);

        logger.info(
          {
            baseURL,
            body: requestOptions.body,
            direction: TRACING_DIRECTION.OUTGOING,
            globalTraceId: this.traceContext.globalTraceId,
            headers,
            method: requestOptions.method ?? 'GET',
            path: requestPath,
            responseType: requestOptions.responseType,
            url: fullUrl,
          },
          TRACING_MESSAGES.OUTGOING_REQUEST
        );
      },
      onRequestError: async ({ error }) => {
        const logger = await this.loggerPromise;

        logger.error(
          {
            direction: TRACING_DIRECTION.OUTGOING,
            error,
          },
          TRACING_MESSAGES.OUTGOING_REQUEST_FAILED
        );
      },
      onResponse: async ({ response, options: requestOptions }) => {
        const logger = await this.loggerPromise;

        const logData = {
          body: this.truncateForLogging(response._data),
          direction: TRACING_DIRECTION.INCOMING,
          globalTraceId: this.traceContext.globalTraceId,
          headers: response.headers,
          method: requestOptions.method ?? 'GET',
          responseType: requestOptions.responseType ?? 'json',
          status: response.status,
          url: response.url,
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
      onResponseError: async ({ response }) => {
        const logger = await this.loggerPromise;

        logger.error(
          {
            data: this.truncateForLogging(response._data),
            direction: TRACING_DIRECTION.INCOMING,
            status: response.status,
            url: response.url,
          },
          TRACING_MESSAGES.INCOMING_REQUEST_FAILED
        );
      },
      timeout,
    });
  }

  private async getRootLogger(): Promise<Logger> {
    if (BaseRequester._rootLogger) {
      return BaseRequester._rootLogger;
    }

    if (this.isBrowser()) {
      const { createBrowserLogger } = await import('@next/logger/browser');
      const viteEnv = readImportMetaEnv();
      const env = viteEnv.PROD === true ? 'production' : 'dev';
      BaseRequester._rootLogger = createBrowserLogger(env, {
        axiomDataset: readString(viteEnv.VITE_AXIOM_DATASET),
        axiomToken: readString(viteEnv.VITE_AXIOM_TOKEN),
        level: readString(viteEnv.VITE_LOG_LEVEL),
      });
    } else {
      const env =
        readProcessEnv('NODE_ENV') === 'production' ? 'production' : 'dev';
      const { createServerLogger } = await import('@next/logger/server');
      BaseRequester._rootLogger = createServerLogger(
        env,
        readProcessEnv('LOG_LEVEL')
      );
    }

    return BaseRequester._rootLogger;
  }

  private async resolveLogger(): Promise<Logger> {
    if (this.logger) {
      return this.logger;
    }

    const root = await this.getRootLogger();

    const bindings: Record<string, unknown> = {
      globalTraceId: this.traceContext.globalTraceId,
    };
    if (this.traceContext.component !== undefined) {
      bindings.component = this.traceContext.component;
    }
    if (this.traceContext.module !== undefined) {
      bindings.module = this.traceContext.module;
    }

    this.logger = root.child(bindings);
    return this.logger;
  }

  protected async request<T = unknown, R extends ResponseType = 'json'>(
    url: FetchRequest,
    options?: FetchOptions<R>
  ): Promise<MappedResponseType<R, T>> {
    return await this.requester<T, R>(url, options);
  }

  protected async requestRaw(
    url: FetchRequest,
    options?: FetchOptions
  ): Promise<Response> {
    const logger = await this.loggerPromise;
    const requestPath = this.getRequestPath(url);
    const fullUrl = this.buildFullUrl(requestPath);
    const headers = this.buildRequestHeaders(options?.headers);

    logger.info(
      {
        baseURL: this.baseURL,
        body: options?.body,
        direction: TRACING_DIRECTION.OUTGOING,
        globalTraceId: this.traceContext.globalTraceId,
        headers,
        method: options?.method ?? 'GET',
        path: requestPath,
        responseType: options?.responseType,
        url: fullUrl,
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
          direction: TRACING_DIRECTION.INCOMING,
          globalTraceId: this.traceContext.globalTraceId,
          headers: response.headers,
          method: options?.method ?? 'GET',
          status: response.status,
          url: response.url,
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

  private isBrowser(): boolean {
    return 'window' in globalThis && 'document' in globalThis;
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

    const baseURL = this.baseURL;

    if (baseURL === undefined || baseURL === '') {
      return requestPath;
    }
    if (requestPath === '') {
      return baseURL;
    }

    if (requestPath.startsWith('/')) {
      return `${baseURL}${requestPath}`;
    }

    return `${baseURL}/${requestPath}`;
  }

  private buildRequestHeaders(
    headers: FetchOptions['headers']
  ): Record<string, string> {
    return {
      ...Object.fromEntries(new Headers(headers).entries()),
      'global-trace-id': this.traceContext.globalTraceId,
    };
  }

  private truncateForLogging(data: unknown): unknown {
    if (data === null || data === undefined) {
      return data;
    }

    const stringified = typeof data === 'string' ? data : JSON.stringify(data);
    const sizeInBytes = new TextEncoder().encode(stringified).length;

    if (sizeInBytes > MAX_LOG_SIZE) {
      return `[Data truncated: ${(sizeInBytes / 1024).toFixed(2)}KB exceeds 600KB limit]`;
    }

    return data;
  }
}

function readImportMetaEnv(): Record<string, unknown> {
  const meta: object = import.meta;
  if (!('env' in meta) || typeof meta.env !== 'object' || meta.env === null) {
    return {};
  }
  return { ...meta.env };
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function readProcessEnv(name: string): string | undefined {
  if (typeof process === 'undefined') {
    return undefined;
  }
  return process.env[name];
}
