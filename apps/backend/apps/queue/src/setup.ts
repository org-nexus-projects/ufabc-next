import { Queue, Worker, type RedisOptions, type Processor } from 'bullmq';

const connection = {
  username: 'default',
  password: 'veryRandomCrypticString',
  host: 'localhost',
  port: 6379,
} satisfies RedisOptions;

export const createQueue = (name: string) => new Queue(name, { connection });

export async function queueProcessor<TJobData>(
  name: string,
  processor: Processor<TJobData>,
) {
  new Worker(name, processor, { connection });
}
