import type { BackoffOptions, Job, JobsOptions, WorkerOptions } from 'bullmq';
import type { FastifyInstance } from 'fastify';
import type { z } from 'zod';
import ms from 'ms';

export type JobData<TData = unknown> = TData & {
  globalTraceId?: string;
};

export interface JobContext<
  TData = unknown,
  TResult = unknown,
  TName extends string = string,
> {
  job: Job<JobData<TData>, TResult, TName>;
  app: FastifyInstance;
}

export type JobHandler<
  TData = unknown,
  TResult = unknown,
  TName extends string = string,
> = (ctx: JobContext<TData, TResult, TName>) => Promise<TResult>;

export class JobBuilder<TName extends string, TData, TResult> {
  private readonly _name: TName;
  private _inputSchema?: z.ZodType<TData>;
  private _outputSchema?: z.ZodType<TResult>;
  private _jobOptions: JobsOptions = {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { age: 24 * 60 * 60, count: 1000 },
    removeOnFail: { age: 24 * 60 * 60, count: 500 },
  };
  private _workerOptions: Partial<WorkerOptions> = {};
  private _handler?: JobHandler<TData, TResult>;
  private _schedule?: number;
  private _scheduleTimezone?: string;

  constructor(name: TName) {
    this._name = name;
  }

  input<T extends TData>(schema: z.ZodType<T>): this {
    this._inputSchema = schema;
    return this;
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
    this._schedule = ms(pattern);
    this._scheduleTimezone = tz;
    return this;
  }

  handler(handler: JobHandler<TData, TResult, string>): this {
    this._handler = handler;
    return this;
  }

  get config() {
    return {
      name: this._name,
      inputSchema: this._inputSchema,
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

export const defineJob = <T extends string, TData, TResult>(name: T) => {
  return new JobBuilder<T, TData, TResult>(name);
};
