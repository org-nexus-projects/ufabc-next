import { Redis, type RedisOptions } from 'ioredis';

export type RedisConnectorOptions = {
  prefix?: string;
};

export class RedisConnector {
  readonly client: Redis;
  readonly prefix: string;
  private readonly connectionOptions: RedisOptions;

  constructor(connectionURL: string, options: RedisConnectorOptions = {}) {
    this.prefix = options.prefix ?? 'http';
    const url = new URL(connectionURL);

    this.connectionOptions = {
      host: url.hostname,
      port: Number(url.port) || 6379,
      username: url.username || undefined,
      password: url.password || undefined,
      lazyConnect: true,
    };

    this.client = new Redis(this.connectionOptions);
  }

  async connect() {
    await this.client.ping();
  }

  async close() {
    await this.client.quit();
  }

  async getJSON<T>(key: string) {
    const cache = await this.client.get(this.buildKey(key));
    if (!cache) {
      return null;
    }

    return JSON.parse(cache) as T;
  }

  async setJSON(key: string, value: unknown, ttlInSeconds: number) {
    await this.client.setex(
      this.buildKey(key),
      ttlInSeconds,
      JSON.stringify(value)
    );
  }

  async acquireLock(key: string, ttlInSeconds: number) {
    const result = await this.client.set(
      this.buildKey(`lock:${key}`),
      'locked',
      'EX',
      ttlInSeconds,
      'NX'
    );

    return result === 'OK';
  }

  async releaseLock(key: string) {
    const result = await this.client.del(this.buildKey(`lock:${key}`));
    return result === 1;
  }

  getConnectionOptions(): RedisOptions {
    return { ...this.connectionOptions };
  }

  private buildKey(key: string) {
    return `${this.prefix}:${key}`;
  }
}
