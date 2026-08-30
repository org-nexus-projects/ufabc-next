import type { JobManager } from '@next/queues/manager';
import { Types } from 'mongoose';

import type { S3Connector } from '@/connectors/s3-connector.js';
import { JOB_NAMES } from '@/constants.js';
import {
  ArchiveFileEmpty,
  ArchiveNotFound,
  EmailVerificationFailed,
  UserWithoutRA,
} from '@/errors/custom-errors.js';
import type { JobRegistry } from '@/jobs/registry.js';
import { ComponentArchiveMapper } from '@/mappers/component-archive-mapper.js';
import { ComponentMapper } from '@/mappers/component-mapper.js';
import { ComponentModel } from '@/models/Component.js';
import { ComponentMetadataModel } from '@/models/ComponentMetadata.js';
import { UserModel } from '@/models/User.js';
import { ComponentArchivesRepository } from '@/repositories/component-archives-repository.js';
import { logger as defaultLogger } from '@/utils/logger.js';

import { ArchiveEngine } from './archive-engine.js';
import type { MoodleSession } from './archive-engine.js';

export class ComponentsService {
  private readonly mapper = new ComponentMapper();
  private readonly archiveMapper = new ComponentArchiveMapper();
  private readonly archivesRepository: ComponentArchivesRepository;
  private readonly logger: ReturnType<typeof defaultLogger.child>;
  private readonly engine: ArchiveEngine;
  private readonly manager?: JobManager<JobRegistry>;

  constructor({
    manager,
    globalTraceId,
  }: {
    requestId?: string;
    manager?: JobManager<JobRegistry>;
    globalTraceId?: string;
  }) {
    this.logger = defaultLogger.child({ globalTraceId });
    this.engine = new ArchiveEngine({ globalTraceId });
    this.archivesRepository = new ComponentArchivesRepository({
      globalTraceId,
    });
    this.manager = manager;
  }

  async verifyUserForArchives(session: MoodleSession) {
    const email = await this.engine.getUserEmail(session.sessionId);

    if (email === null) {
      throw new EmailVerificationFailed();
    }

    const user = await UserModel.findOne({ email });

    if (user?.ra === undefined || user.ra === null || user.ra === 0) {
      this.logger.warn(
        { email },
        'User does not have RA, skipping enrollment check'
      );
      throw new UserWithoutRA();
    }

    return user;
  }

  async processComponentArchives(
    session: MoodleSession,
    globalTraceId?: string,
    enrolledCodigos?: string[]
  ) {
    const data = await this.engine.fetchAndValidateCourses(session);

    await this.manager?.dispatch(JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING, {
      component: data,
      enrolledCodigos,
      globalTraceId,
      session,
    });
  }

  async listComponentArchives(componentId: string) {
    const archives =
      await this.archivesRepository.findByComponentId(componentId);

    return archives.map((archive) => this.archiveMapper.toResponse(archive));
  }

  async getArchiveDownload(
    archiveId: string,
    s3Connector: S3Connector,
    bucket: string
  ) {
    const archive = await this.archivesRepository.findById(archiveId);

    if (!archive || typeof archive.s3_key !== 'string') {
      throw new ArchiveNotFound();
    }

    const s3Object = await s3Connector.getObject(bucket, archive.s3_key);

    if (!s3Object.Body) {
      throw new ArchiveFileEmpty();
    }

    return {
      body: s3Object.Body,
      contentType: s3Object.ContentType ?? 'application/octet-stream',
      filename: archive.file_name ?? 'document.pdf',
    };
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
    if (withMetadata && component?.origin_key != null) {
      metadata = await ComponentMetadataModel.findOne({
        'metadata.component_data.componentKey': component.origin_key,
      }).lean();
    }

    return this.mapper.toResponse(component, metadata);
  }
}
