import type { S3Connector } from '@/connectors/s3-connector.js';
import { ARCHIVE_DOWNLOAD_TTL_SECONDS } from '@/constants.js';
import {
  ArchiveNotFound,
  ComponentPlanNotFound,
} from '@/errors/custom-errors.js';
import { ComponentArchiveMapper } from '@/mappers/component-archive-mapper.js';
import { ComponentPlanMapper } from '@/mappers/component-plan-mapper.js';
import { ComponentArchivesRepository } from '@/repositories/component-archives-repository.js';
import type { ArchivePageFilter } from '@/repositories/component-archives-repository.js';
import { ComponentPlansRepository } from '@/repositories/component-plans-repository.js';

import type { BaseServiceOptions } from './base-service.js';
import { BaseService } from './base-service.js';

export type ArchiveMonitoringServiceOptions = BaseServiceOptions & {
  bucket: string;
  storageConnector: S3Connector;
};

export class ArchiveMonitoringService extends BaseService {
  private readonly archiveMapper = new ComponentArchiveMapper();
  private readonly planMapper = new ComponentPlanMapper();
  private readonly archivesRepository: ComponentArchivesRepository;
  private readonly plansRepository: ComponentPlansRepository;
  private readonly bucket: string;
  private readonly storageConnector: S3Connector;

  constructor(options: ArchiveMonitoringServiceOptions) {
    super({ globalTraceId: options.globalTraceId });
    this.bucket = options.bucket;
    this.storageConnector = options.storageConnector;
    this.archivesRepository = new ComponentArchivesRepository({
      globalTraceId: this.globalTraceId,
    });
    this.plansRepository = new ComponentPlansRepository({
      globalTraceId: this.globalTraceId,
    });
  }

  async listArchives(filter: ArchivePageFilter) {
    const { items, total } = await this.archivesRepository.findPage(filter);

    return this.archiveMapper.toPageResponse(items, {
      limit: filter.limit,
      page: filter.page,
      total,
    });
  }

  async createDownloadUrl(archiveId: string) {
    const archive = await this.archivesRepository.findById(archiveId);

    if (!archive || archive.status !== 'stored' || archive.s3_key == null) {
      throw new ArchiveNotFound();
    }

    const url = await this.storageConnector.getPresignedUrl(
      this.bucket,
      archive.s3_key,
      ARCHIVE_DOWNLOAD_TTL_SECONDS
    );

    return this.archiveMapper.toDownloadResponse(archive, {
      expiresInSeconds: ARCHIVE_DOWNLOAD_TTL_SECONDS,
      url,
    });
  }

  async findLatestPlan(componentId: string) {
    const plan = await this.plansRepository.findLatestByComponent(componentId);

    if (!plan) {
      throw new ComponentPlanNotFound(componentId);
    }

    return this.planMapper.toResponse(plan);
  }
}
