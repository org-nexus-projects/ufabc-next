import type { S3Connector } from '@/connectors/s3-connector.js';
import { ComponentArchivesRepository } from '@/repositories/component-archives-repository.js';

import { ArchiveEngine } from './archive-engine.js';
import type { MoodleSession } from './archive-engine.js';
import { BaseService } from './base-service.js';

export type ProcessArchiveInput = {
  bucket: string;
  componentId: string;
  rawUrl: string;
  s3Connector?: S3Connector;
  session?: MoodleSession;
};

export class ComponentArchivesService extends BaseService {
  private readonly engine: ArchiveEngine;
  private readonly repository: ComponentArchivesRepository;

  constructor({
    globalTraceId,
    s3Connector,
    session,
  }: {
    globalTraceId?: string;
    s3Connector?: S3Connector;
    session?: MoodleSession;
  } = {}) {
    super({ globalTraceId });

    this.engine = new ArchiveEngine({ globalTraceId, s3Connector, session });
    this.repository = new ComponentArchivesRepository({ globalTraceId });
  }

  async processArchive(input: ProcessArchiveInput) {
    const { bucket, componentId, rawUrl } = input;

    const archive = await this.repository.findOrCreateForProcessing(
      componentId,
      rawUrl
    );

    const alreadyStored = archive.status === 'stored';

    try {
      const result = await this.engine.downloadAndUpload(
        rawUrl,
        componentId,
        bucket
      );

      if (!result) {
        if (!alreadyStored) {
          await this.repository.markFailed(archive._id, {
            reason: 'missing_session',
          });
        }

        return {
          archiveId: archive._id,
          message: 'No Moodle session available, skipped download',
          success: false,
        };
      }

      const { checksum, pdfName, s3Key } = result;

      if (archive.checksum === checksum) {
        return {
          archiveId: archive._id,
          data: {
            fileName: archive.file_name,
            s3Key: archive.s3_key,
          },
          message: 'PDF unchanged since last run, skipping stored event',
          success: true,
        };
      }

      await this.repository.markStored(archive._id, {
        checksum,
        fileName: pdfName,
        s3Key,
      });

      return {
        archiveId: archive._id,
        changed: true,
        data: { fileName: pdfName, s3Key },
        message: 'PDF uploaded',
        success: true,
      };
    } catch (error) {
      if (!alreadyStored) {
        await this.repository.markFailed(archive._id, { error: String(error) });
      }
      throw error;
    }
  }
}
