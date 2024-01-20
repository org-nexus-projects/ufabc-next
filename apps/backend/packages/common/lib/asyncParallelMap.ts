import { logger } from './logger';

/**
 * Executes an asynchronous function on each element of an array in parallel with a concurrency limit.
 * @param arr - The array to process.
 * @param func - The async function to apply to each element.
 * @param limit - The concurrency limit (default: 2).
 * @param args - Additional arguments to pass to the async function.
 * @returns A Promise that resolves to an array of results.
 */
export async function asyncParallelMap<TArray, PromiseReturn = void>(
  arr: TArray[],
  func: (element: TArray, ...args: unknown[]) => Promise<PromiseReturn>,
  limit = 2,
  ...args: unknown[]
): Promise<PromiseReturn[]> {
  const results: PromiseReturn[] = [];
  const inProgress: Promise<void>[] = [];

  async function processElement(element: TArray) {
    try {
      const result = await func(element, ...args);
      results.push(result);
    } catch (error) {
      // If an error occurs, immediately reject all other promises
      for (const promise of inProgress) {
        logger.error({ msg: '[ERROR] processing data', error });
        // why is it empty? cc @santana
        promise.catch((error) => {
          logger.error({ msg: 'Promise errpr', error });
        });
      }
      throw error;
    }
  }

  for (const element of arr) {
    // Check if the concurrency limit has been reached
    while (inProgress.length >= limit) {
      await Promise.race(inProgress);
    }

    const promise = processElement(element);
    inProgress.push(promise);
  }

  // Wait for all promises to settle
  await Promise.all(inProgress);

  return results;
}
