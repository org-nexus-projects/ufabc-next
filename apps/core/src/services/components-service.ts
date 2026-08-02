import type { JobManager } from '@next/queues/manager';
import { Types } from 'mongoose';

import { JOB_NAMES } from '@/constants.js';
import type { JobRegistry } from '@/jobs/registry.js';
import { ComponentMapper } from '@/mappers/component-mapper.js';
import { ComponentModel } from '@/models/Component.js';
import { ComponentMetadataModel } from '@/models/ComponentMetadata.js';
import { logger as defaultLogger } from '@/utils/logger.js';

import { ArchiveEngine, type MoodleSession } from './archive-engine.js';

export class ComponentsService {
  private readonly mapper = new ComponentMapper();
  private readonly logger: ReturnType<typeof defaultLogger.child>;
  private readonly engine: ArchiveEngine;
  private readonly manager?: JobManager<JobRegistry>;

  constructor({
    requestId,
    manager,
    globalTraceId,
  }: {
    requestId?: string;
    manager?: JobManager<JobRegistry>;
    globalTraceId?: string;
  }) {
    this.logger = defaultLogger.child({ requestId, globalTraceId });
    this.engine = new ArchiveEngine({ globalTraceId });
    this.manager = manager;
  }

  async processComponentArchives(
    session: MoodleSession,
    globalTraceId?: string,
    enrolledCodigos?: string[]
  ) {
    const data = await this.engine.fetchAndValidateCourses(session);

    await this.manager?.dispatch(JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING, {
      component: data,
      globalTraceId,
      session,
      enrolledCodigos,
    });
  }

  async findComponentByIdOrOriginKey(id: string, withMetadata: boolean) {
    this.logger.debug({ id, withMetadata }, 'Looking up component');

    const searchConditions: Array<Record<string, unknown>> = [
      { origin_key: id },
    ];
    if (Types.ObjectId.isValid(id)) {
      searchConditions.push({ _id: id });
    }

    const component = await ComponentModel.findOne({
      $or: searchConditions,
    }).lean();

    if (!component) {
      return null;
    }

    let metadata = null;
    if (withMetadata && component.origin_key) {
      metadata = await ComponentMetadataModel.findOne({
        'metadata.component_data.componentKey': component.origin_key,
      }).lean();
    }

    return this.mapper.toResponse(component, metadata);
  }
}
