import { logger as defaultLogger } from '@/utils/logger.js';

export type BaseRepositoryOptions = {
  globalTraceId?: string;
};

export abstract class BaseRepository {
  protected readonly logger: ReturnType<typeof defaultLogger.child>;

  constructor({ globalTraceId }: BaseRepositoryOptions = {}) {
    this.logger = defaultLogger.child({
      component: this.constructor.name,
      globalTraceId,
      module: 'repositories',
    });
  }
}
