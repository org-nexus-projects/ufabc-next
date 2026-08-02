import { z } from 'zod';

export const errorJsonSchema = z.object({
  additionalData: z.record(z.string(), z.unknown()).nullable().optional(),
  code: z.string(),
  description: z.string(),
  httpStatus: z.number(),
  title: z.string(),
});

export const errorHttpSchema = z.object({
  additionalData: z.record(z.string(), z.unknown()).nullable().optional(),
  code: z.string(),
  description: z.string(),
  statusCode: z.number(),
  title: z.string(),
});

export type ErrorJson = z.infer<typeof errorJsonSchema>;
export type ErrorHttp = z.infer<typeof errorHttpSchema>;

export class NextError extends Error {
  readonly title: string;
  readonly code: string;
  readonly httpStatus: number;
  description: string;
  additionalData: Record<string, unknown> | null | undefined;

  get status(): number {
    return this.httpStatus;
  }

  get statusCode(): number {
    return this.httpStatus;
  }

  constructor(
    title: string,
    code: string,
    httpStatus: number,
    description: string,
    additionalData?: Record<string, unknown> | null
  ) {
    super(title);
    this.name = 'NextError';
    this.title = title;
    this.description = description;
    this.code = code;
    this.httpStatus = httpStatus;
    this.additionalData = additionalData ?? null;
  }

  toJson(): ErrorJson {
    const json: ErrorJson = {
      additionalData: this.additionalData ?? null,
      code: this.code,
      description: this.description,
      httpStatus: this.httpStatus,
      title: this.title,
    };

    return errorJsonSchema.parse(json);
  }

  toHttp(): ErrorHttp {
    const http: ErrorHttp = {
      additionalData: this.additionalData ?? null,
      code: this.code,
      description: this.description,
      statusCode: this.httpStatus,
      title: this.title,
    };

    return errorHttpSchema.parse(http);
  }
}
