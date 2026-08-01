import { setTimeout as sleep } from 'node:timers/promises';

export async function waitForJobCompletion(queue: any, timeout = 15_000) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const counts = await queue.getJobCounts();
    if (counts.completed > 0) {
      return true;
    }
    if (counts.failed > 0) {
      throw new Error('Job failed during integration test');
    }

    await sleep(1000);
  }

  throw new Error(`Timeout waiting for queue ${queue.name} to complete`);
}
