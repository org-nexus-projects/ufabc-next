import type { Logger } from 'pino';

import { getClassLogger, getGlobalTraceId } from '@/utils/logger.js';

export type BaseServiceOptions = {
  globalTraceId?: string;
};

export abstract class BaseService {
  protected readonly globalTraceId: string;
  protected readonly logger: Logger;

  constructor({ globalTraceId }: BaseServiceOptions = {}) {
    this.globalTraceId = globalTraceId ?? getGlobalTraceId();
    this.logger = getClassLogger(this, { globalTraceId: this.globalTraceId });
  }
}
