import { createHash } from 'node:crypto';

import { currentQuad } from '@next/utils';
import type { FastifyInstance } from 'fastify';

import { CmccConnector } from '@/connectors/cmcc.js';
import type { S3Connector } from '@/connectors/s3-connector.js';
import { ComponentArchivesRepository } from '@/repositories/component-archives-repository.js';
import { ComponentsRepository } from '@/repositories/components-repository.js';

import { BaseService } from './base-service.js';

type CmccPlansDependencies = {
  config: FastifyInstance['config'];
  globalTraceId?: string;
  storageConnector?: S3Connector;
};

export type CmccPlanTarget = {
  componentId: string;
  url: string;
};

export class CmccPlansService extends BaseService {
  private readonly cmccConnector: CmccConnector;
  private readonly storageConnector?: S3Connector;
  private readonly archiveRepository: ComponentArchivesRepository;
  private readonly componentRepository: ComponentsRepository;
  private readonly season: string;
  private readonly bucket: string;

  constructor({
    config,
    globalTraceId,
    storageConnector,
  }: CmccPlansDependencies) {
    super({ globalTraceId });
    this.cmccConnector = new CmccConnector(config.CMCC_URL, globalTraceId);
    this.storageConnector = storageConnector;
    this.archiveRepository = new ComponentArchivesRepository({ globalTraceId });
    this.componentRepository = new ComponentsRepository({ globalTraceId });
    this.season = currentQuad();
    this.bucket = config.AWS_BUCKET;
  }

  async findPlansToProcess() {
    const plans = await this.cmccConnector.listPlans(this.season);

    const targets: CmccPlanTarget[] = [];
    let unmatched = 0;
    for (const plan of plans) {
      const component = await this.componentRepository.findLeanByClassroomCode(
        this.season,
        plan.classroomCode
      );
      if (!component) {
        unmatched += 1;
        continue;
      }
      targets.push({ componentId: component._id.toString(), url: plan.url });
    }

    this.logger.info(
      { matched: targets.length, season: this.season, unmatched },
      'cmcc plans matched to components'
    );

    return targets;
  }

  async processPlan({ componentId, url }: CmccPlanTarget) {
    const archive = await this.archiveRepository.findOrCreateForProcessing(
      componentId,
      url,
      'cmcc'
    );
    const alreadyStored = archive.status === 'stored';

    try {
      const fileBuffer = await this.cmccConnector.downloadPlan(url);
      const buffer = Buffer.from(fileBuffer);
      const checksum = createHash('sha256').update(buffer).digest('hex');

      if (archive.checksum === checksum) {
        return { archiveId: archive._id, changed: false };
      }

      const fileName = decodeURIComponent(url.split('/').at(-1) ?? 'plan.pdf');
      const storageKey = `/archives/${componentId}/${fileName}`;

      await this.storageConnector?.upload(this.bucket, storageKey, buffer);
      await this.archiveRepository.markStored(archive._id, {
        checksum,
        fileName,
        s3Key: storageKey,
      });

      return { archiveId: archive._id, changed: true };
    } catch (error) {
      if (!alreadyStored) {
        await this.archiveRepository.markFailed(archive._id, {
          error: String(error),
        });
      }
      throw error;
    }
  }
}
