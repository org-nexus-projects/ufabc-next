import { Queue, Worker, type RedisOptions, type Processor } from 'bullmq';
import { Config } from './config/config.js';

const connection = {
  username: Config.REDIS_USER,
  password: Config.REDIS_PASSWORD,
  host: Config.HOST,
  port: Config.REDIS_PORT,
} satisfies RedisOptions;

export const createQueue = (name: string) => new Queue(name, { connection });

export async function queueProcessor<TJobData>(
  name: string,
  processor?: Processor<TJobData>,
) {
  new Worker(name, processor, { connection });
}
