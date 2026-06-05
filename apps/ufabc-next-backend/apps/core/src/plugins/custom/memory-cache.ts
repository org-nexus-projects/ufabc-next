import { fastifyPlugin as fp } from 'fastify-plugin';
import LRUWeakCache from 'lru-weak-cache';

declare module 'fastify' {
  export interface FastifyInstance {
    cache: <T extends object>() => LRUWeakCache<T>;
  }
}

type CacheOptions = {
  /**
   * @param options.minAge The minimum time in milliseconds an item can exist before being allowed to be garbage collected
   */
  minAge?: number;
  /**
   * @param options.maxAge The maximum time in milliseconds an object can exist before being erased, this should be higher than minAge or minAge will have no affect
   *
   */
  maxAge?: number;
  /**
   * @param options.capacity The maximum number of items this cache can contain before it starts erasing old ones
   */
  capacity?: number;
  /**
   * @param options.resetTimersOnAccess Whether or not to reset the minAge and maxAge timers when an item is accessed
   */
  resetTimersOnAccess?: boolean;
};

export default fp(
  (app, opts) => {
    const defaultOpts = {
      capacity: 200,
      maxAge: 1000 * 60 * 5,
      resetTimersOnAccess: true,
    } satisfies CacheOptions;

    const cacheFactory = <T extends object>() => {
      return new LRUWeakCache<T>({ ...defaultOpts, ...opts });
    };

    app.decorate('cache', cacheFactory);
  },
  { name: 'cache' }
);
