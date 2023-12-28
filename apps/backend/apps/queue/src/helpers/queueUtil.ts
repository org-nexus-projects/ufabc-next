import {
  type Processor,
  Queue,
  type RedisOptions,
  Worker,
  type WorkerOptions,
} from 'bullmq';
import { Config } from '@/config/config.js';

const DEFAULT_REDIS_PORT = 6379;
const connection = {
  username: Config.REDIS_USER,
  password: Config.REDIS_PASSWORD,
  host: Config.REDIS_HOST,
  port: DEFAULT_REDIS_PORT ?? Config.REDIS_PORT,
} satisfies RedisOptions;

/**
 * Creates a queue with the given name
 * creates a connection in every instance(aka if you have 3 instances, it will create 3 connections)
 * */
export const createQueue = (name: string) => new Queue(name, { connection });

/**
 * Creates a worker attached to a given queue
 * */
export function createWorker<TJobData>(
  queueName: string,
  processor?: Processor<TJobData>,
  opts?: WorkerOptions,
) {
  return new Worker(queueName, processor, { connection, ...opts });
}
