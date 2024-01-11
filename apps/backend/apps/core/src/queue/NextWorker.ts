import { Config } from '@/config/config.js';
import type { Worker } from 'bullmq';

export class NextWorker {
  private static workers: Record<string, Worker> = {};

  constructor() {}

  public async setup() {
    const isTest = Config.NODE_ENV === 'test';
    if (isTest) {
      return;
    }

    for (const [] of Object.entries(JOB_QUEUES)) {
    }
  }

  private static async close() {
    const workersToClose = Object.values(this.workers);
    await Promise.all(workersToClose.map((worker) => worker.close()));
  }
}

export const nextWorker = new NextWorker();
