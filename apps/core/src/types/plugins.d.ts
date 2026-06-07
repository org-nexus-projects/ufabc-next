import type { Redis } from 'ioredis';

declare module 'fastify' {
  interface FastifySchema {
    tags?: readonly string[];
    hide?: boolean;
    deprecated?: boolean;
    description?: string;
    summary?: string;
  }

  interface FastifyInstance {
    jwt: {
      sign(payload: object, options?: object): string;
      verify(token: string, options?: object): object;
      decode(token: string, options?: object): object;
    };
    redis: Redis;
  }

  interface FastifyRequest {
    jwtVerify<T = object>(options?: object): Promise<T>;
    user: {
      _id: string;
      ra: number;
      permissions: string[];
      email?: string;
      oauth?: object;
      confirmed?: boolean;
      createdAt?: string;
      devices?: object[];
      iat?: number;
      isSynced?: boolean;
    };
    cookies: Record<string, string>;
    parts(): AsyncIterableIterator<{
      type: 'file' | 'field';
      fieldname: string;
      filename?: string;
      encoding?: string;
      mimetype?: string;
      fields?:
        | {
            [key: string]: {
              type: 'field';
              fieldname: string;
              value: string;
            };
          }
        | undefined;
      file?: {
        file: NodeJS.ReadableStream;
      };
      value?: string;
      toBuffer(): Promise<Buffer>;
    }>;
    requestContext: {
      get<T = unknown>(key: string): T | undefined;
      set<T = unknown>(key: string, value: T): void;
    };
  }

  interface FastifyReply {
    badRequest(message?: string): FastifyReply;
    unauthorized(message?: string): FastifyReply;
    forbidden(message?: string): FastifyReply;
    notFound(message?: string): FastifyReply;
    internalServerError(message?: string): FastifyReply;
    getHttpError(code: number, message?: string): FastifyReply;
    setCookie(name: string, value: string, options?: object): FastifyReply;
    clearCookie(name: string, options?: object): FastifyReply;
  }
}
