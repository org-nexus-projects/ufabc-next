import { UnrecoverableError } from 'bullmq';
import type { FastifyInstance } from 'fastify';

import { ExtractorConnector } from '@/connectors/extractor.js';
import type { S3Connector } from '@/connectors/s3-connector.js';
import { UfabcParserConnector } from '@/connectors/ufabc-parser.js';
import { ARCHIVE_PRESIGNED_URL_TTL_SECONDS } from '@/constants.js';
import { ComponentPlanModel } from '@/models/ComponentPlan.js';
import { ComponentArchivesRepository } from '@/repositories/component-archives-repository.js';
import { ComponentsRepository } from '@/repositories/components-repository.js';
import { extractionSchema } from '@/schemas/v2/extractor.js';

import { BaseService } from './base-service.js';

type ArchiveExtractionDependencies = {
  globalTraceId: string;
  config: FastifyInstance['config'];
  storageConnector: S3Connector;
};

export class ArchiveExtractionService extends BaseService {
  private readonly extractorConnector: ExtractorConnector;
  private readonly ufabcParserConnector: UfabcParserConnector;
  private readonly storageConnector: S3Connector;
  private readonly componentArchiveRepository: ComponentArchivesRepository;
  private readonly componentRepository: ComponentsRepository;
  private readonly bucket: string;

  constructor({
    config,
    globalTraceId,
    storageConnector,
  }: ArchiveExtractionDependencies) {
    super({ globalTraceId });
    this.storageConnector = storageConnector;
    this.extractorConnector = new ExtractorConnector({
      baseUrl: config.EXTRACTOR_URL,
      globalTraceId,
      internalToken: config.INTERNAL_TOKEN,
      token: config.SERVICE_HEADER,
    });
    this.ufabcParserConnector = new UfabcParserConnector(config, globalTraceId);
    this.componentArchiveRepository = new ComponentArchivesRepository({
      globalTraceId: this.globalTraceId,
    });
    this.componentRepository = new ComponentsRepository({ globalTraceId });
    this.bucket = config.AWS_BUCKET;
  }

  async extractArchive(archiveId: string) {
    const archive = await this.componentArchiveRepository.findById(archiveId);

    if (
      !archive ||
      archive.source !== 'cmcc' ||
      archive.status !== 'stored' ||
      archive.s3_key == null
    ) {
      throw new UnrecoverableError(
        `Archive ${archiveId} is not a stored cmcc archive`
      );
    }

    const component = await this.componentRepository.findLeanById(
      archive.component
    );

    if (!component) {
      throw new UnrecoverableError(
        `Component ${archive.component.toString()} of archive ${archiveId} not found`
      );
    }

    const [parserComponent] =
      await this.ufabcParserConnector.getComponentByClassroomCode(
        component.season,
        component.uf_cod_turma
      );

    if (!parserComponent) {
      throw new UnrecoverableError(
        `ufabc-parser has no component ${component.uf_cod_turma} for season ${component.season}`
      );
    }

    const fileURL = await this.storageConnector.getPresignedUrl(
      this.bucket,
      archive.s3_key,
      ARCHIVE_PRESIGNED_URL_TTL_SECONDS
    );
    const extraction = await this.extractorConnector.extractArchive(fileURL);
    const validatedExtraction = extractionSchema.parse(extraction);

    const schedule = [];
    for (const item of validatedExtraction.schedule) {
      schedule.push({ date: item.date, lesson: item.lesson });
    }

    const timetable = [];
    for (const slot of parserComponent.timetable) {
      timetable.push(slot.unparsed);
    }

    await ComponentPlanModel.updateOne(
      { archive: archive._id },
      {
        $set: {
          component: component._id,
          extractedAt: new Date(),
          planning: validatedExtraction.planning,
          schedule,
          timetable,
        },
      },
      { upsert: true }
    );

    this.logger.info(
      { archiveId, scheduleItems: validatedExtraction.schedule.length },
      'archive extraction stored'
    );

    return { archiveId, scheduleItems: validatedExtraction.schedule.length };
  }
}
