import { type FetchOptions, type FetchRequest, ofetch } from 'ofetch';

import { MAX_LOG_SIZE, TRACING_DIRECTION, TRACING_MESSAGES } from './constants.ts';

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
  private loggerPromise: Promise<Logger>;

  constructor(options?: RequesterOptions) {
    const { baseURL, globalTraceId, component, module, timeout, defaultHeaders } = options ?? {};
    this.baseURL = baseURL;
    this.defaultHeaders = defaultHeaders;

    this.traceContext = {
      globalTraceId: globalTraceId ?? globalThis.crypto.randomUUID(),
      component,
      module,
    };

    this.loggerPromise = this.resolveLogger();
    this.requester = ofetch.create({
      baseURL,
      timeout,
      onRequest: async ({ request, options: requestOptions }) => {
        const logger = await this.loggerPromise;

        const existingHeaders =
          requestOptions.headers instanceof Headers
            ? Object.fromEntries(requestOptions.headers.entries())
            : (requestOptions.headers as Record<string, string>) || {};

        // @ts-ignore - ofetch allows custom headers
        requestOptions.headers = {
          ...this.defaultHeaders,
          ...existingHeaders,
          'global-trace-id': this.traceContext.globalTraceId,
        } as any;

        const requestPath = this.getRequestPath(request);
        const fullUrl = this.buildFullUrl(requestPath);

        logger.info(
          {
            globalTraceId: this.traceContext.globalTraceId,
            direction: TRACING_DIRECTION.OUTGOING,
            method: requestOptions.method || 'GET',
            url: fullUrl,
            baseURL,
            path: requestPath,
            headers: requestOptions.headers,
            responseType: requestOptions.responseType,
            body: requestOptions.body,
          },
          TRACING_MESSAGES.OUTGOING_REQUEST
        );
      },
      onResponse: async ({ response, options: requestOptions }) => {
        const logger = await this.loggerPromise;

        const logData = {
          globalTraceId: this.traceContext.globalTraceId,
          direction: TRACING_DIRECTION.INCOMING,
          method: requestOptions.method || 'GET',
          url: response.url,
          status: response.status,
          headers: response.headers,
          responseType: requestOptions.responseType || 'json',
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
      onResponseError: async ({ response }) => {
        const logger = await this.loggerPromise;

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
    });
  }

  private async getRootLogger(): Promise<Logger> {
    if (BaseRequester._rootLogger) return BaseRequester._rootLogger;

    if (this.isBrowser()) {
      const { createBrowserLogger } = await import('@next/logger/browser');
      const viteEnv = (import.meta as { env?: Record<string, string> }).env ?? {};
      const env = viteEnv.PROD ? 'production' : 'dev';
      BaseRequester._rootLogger = createBrowserLogger(env, {
        axiomDataset: viteEnv.VITE_AXIOM_DATASET,
        axiomToken: viteEnv.VITE_AXIOM_TOKEN,
        level: viteEnv.VITE_LOG_LEVEL,
      }) as unknown as Logger;
    } else {
      const nodeEnv = this.getNodeEnv();
      const env = nodeEnv === 'production' ? 'production' : 'dev';
      const { createServerLogger } = await import('@next/logger/server');
      BaseRequester._rootLogger = createServerLogger(
        env,
        this.getLogLevel()
      ) as unknown as Logger;
    }

    return BaseRequester._rootLogger;
  }

  private async resolveLogger(): Promise<Logger> {
    if (this.logger) return this.logger;

    const root = await this.getRootLogger();

    const bindings: Record<string, unknown> = {
      globalTraceId: this.traceContext.globalTraceId,
    };
    if (this.traceContext.component) bindings.component = this.traceContext.component;
    if (this.traceContext.module) bindings.module = this.traceContext.module;

    this.logger = root.child(bindings);
    return this.logger;
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
    const logger = await this.loggerPromise;
    const requestPath = this.getRequestPath(url);
    const fullUrl = this.buildFullUrl(requestPath);
    const headers = this.buildRequestHeaders(options?.headers);

    logger.info(
      {
        globalTraceId: this.traceContext.globalTraceId,
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
          globalTraceId: this.traceContext.globalTraceId,
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

  private isBrowser(): boolean {
    try {
      return (
        typeof (globalThis as any).window !== 'undefined' &&
        typeof (globalThis as any).document !== 'undefined'
      );
    } catch {
      return false;
    }
  }

  private getNodeEnv(): string {
    try {
      const nodeEnv = (globalThis as any).process?.env?.NODE_ENV as string | undefined;
      return nodeEnv || 'dev';
    } catch {
      return 'dev';
    }
  }

  private getLogLevel(): string | undefined {
    try {
      return (globalThis as any).process?.env?.LOG_LEVEL as string | undefined;
    } catch {
      return undefined;
    }
  }

  private getRequestPath(request: FetchRequest): string {
    if (typeof request === 'string') return request;
    if (request instanceof Request) return request.url;
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

    if (!baseURL) return requestPath;
    if (!requestPath) return baseURL;

    if (requestPath.startsWith('/')) return `${baseURL}${requestPath}`;

    return `${baseURL}/${requestPath}`;
  }

  private buildRequestHeaders(headers: FetchOptions['headers']) {
    const existingHeaders =
      headers instanceof Headers
        ? Object.fromEntries(headers.entries())
        : headers || {};

    return {
      ...existingHeaders,
      'global-trace-id': this.traceContext.globalTraceId,
    } as Record<string, string>;
  }

  private truncateForLogging(data: unknown): unknown {
    if (data === null || data === undefined) return data;

    const stringified = typeof data === 'string' ? data : JSON.stringify(data);
    const sizeInBytes = new TextEncoder().encode(stringified).length;

    if (sizeInBytes > MAX_LOG_SIZE) {
      return `[Data truncated: ${(sizeInBytes / 1024).toFixed(2)}KB exceeds 600KB limit]`;
    }

    return data;
  }
}
