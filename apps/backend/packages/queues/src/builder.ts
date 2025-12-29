import type { BackoffOptions, Job, JobsOptions, WorkerOptions } from 'bullmq';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import ms from 'ms';
import type { JobManager } from './manager.js';

export type JobData<TData = unknown> = TData & {
  globalTraceId?: string;
};

export type InferJobData<T> = T extends { _data: infer TData } ? TData : never;

// TYPE MAGIC: This unwraps the array in the specific key for the handler
export type InferHandlerData<TBuilder> =
  TBuilder extends JobBuilder<any, infer TData, any, infer TKey>
    ? TKey extends keyof TData
      ? {
          [K in keyof TData]: K extends TKey
            ? TData[K] extends Array<infer U>
              ? U
              : TData[K]
            : TData[K];
        }
      : TData
    : never;

export interface JobContext<TData = unknown, TResult = unknown, TName extends string = string> {
  job: Job<JobData<TData>, TResult, TName>;
  app: FastifyInstance;
  manager: JobManager<any>; // prevent circular dependency
}

export type JobHandler<TData = unknown, TResult = unknown, TName extends string = string> = (
  ctx: JobContext<TData, TResult, TName>,
) => Promise<TResult>;

export class JobBuilder<
  TName extends string,
  TData,
  TResult,
  TIterator extends keyof TData | undefined = undefined,
> {
  declare _data: TData; // This is used to store the data for the job

  private readonly _name: TName;
  private _inputSchema?: z.ZodType<TData>;
  private _outputSchema?: z.ZodType<TResult>;
  private _iteratorKey?: TIterator;
  private _workerSchema?: z.ZodType<any>;
  private _jobOptions: JobsOptions = {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { age: 24 * 60 * 60, count: 1000 },
    removeOnFail: { age: 24 * 60 * 60, count: 500 },
  };
  private _workerOptions: Partial<WorkerOptions> = {};
  private _handler?: JobHandler<any, TResult, TName>;
  private _schedule?: number;
  private _scheduleTimezone?: string;

  constructor(name: TName) {
    this._name = name;
  }

  input<T extends z.ZodTypeAny>(schema: T): JobBuilder<TName, z.infer<T>, TResult, TIterator> {
    this._inputSchema = schema as any;
    this._workerSchema = schema as any;
    return this as any;
  }

  output<T extends TResult>(schema: z.ZodType<T>): this {
    this._outputSchema = schema;
    return this;
  }

  options(options: JobsOptions): this {
    this._jobOptions = options;
    return this;
  }

  worker(options: WorkerOptions): this {
    this._workerOptions = options;
    return this;
  }

  retry(attempts: number, delay: number, backoff: BackoffOptions): this {
    this._jobOptions.attempts = attempts;
    if (backoff) {
      this._jobOptions.backoff = backoff;
    } else if (delay) {
      this._jobOptions.backoff = { type: 'fixed', delay };
    }
    return this;
  }

  concurrency(concurrency: number): this {
    this._workerOptions.concurrency = concurrency;
    return this;
  }

  removeOnComplete(age: number, count: number): this {
    this._jobOptions.removeOnComplete = { age, count };
    return this;
  }

  removeOnFail(age: number, count: number): this {
    this._jobOptions.removeOnFail = { age, count };
    return this;
  }

  rateLimit(max: number, duration: number): this {
    this._workerOptions.limiter = { max, duration };
    return this;
  }

  every(pattern: string, tz = 'UTC'): this {
    const msPattern = ms(pattern) as unknown as number;
    this._schedule = Number(msPattern);
    this._scheduleTimezone = tz;
    return this;
  }

  /**
   * Defines which field in the input schema is an array that should be
   * split into individual jobs. The handler will receive a single item.
   */
  iterator<K extends keyof TData>(key: K): JobBuilder<TName, TData, TResult, K> {
    this._iteratorKey = key as any;

    // Internal Zod Transformation:
    // We unwrap the array in the schema so the worker validates a single item
    if (this._inputSchema instanceof z.ZodObject) {
      const shape = this._inputSchema.shape;
      const arraySchema = shape[key as string];

      if (arraySchema instanceof z.ZodArray) {
        this._workerSchema = this._inputSchema.extend({
          [key as string]: arraySchema.element,
        });
      }
    }
    return this as any;
  }

  handler(handler: JobHandler<InferHandlerData<this>, TResult, TName>): this {
    this._handler = handler as JobHandler<unknown, TResult, TName>;
    return this;
  }

  get config() {
    return {
      name: this._name,
      iteratorKey: this._iteratorKey,
      inputSchema: this._inputSchema,
      workerSchema: this._workerSchema,
      outputSchema: this._outputSchema,
      jobOptions: this._jobOptions,
      workerOptions: this._workerOptions,
      handler: this._handler,
      schedule: this._schedule,
      scheduleTimezone: this._scheduleTimezone,
    };
  }

  get name() {
    return this._name;
  }
}

export const defineJob = <T extends string, TData = any, TResult = any>(name: T) => {
  return new JobBuilder<T, TData, TResult, undefined>(name);
};
