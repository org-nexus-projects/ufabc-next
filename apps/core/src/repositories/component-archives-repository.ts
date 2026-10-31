import type { Types } from 'mongoose';

import { ARCHIVE_MAX_FAILURE_EVENTS } from '@/constants.js';
import { ComponentArchiveModel } from '@/models/ComponentArchive.js';
import type { ComponentArchive } from '@/models/ComponentArchive.js';

import { BaseRepository } from './base-repository.js';
import type { BaseRepositoryOptions } from './base-repository.js';

export type LeanComponentArchive = ComponentArchive & {
  _id: Types.ObjectId;
  createdAt?: Date;
};

type FailureCountRow = {
  failureCount: number;
};

export type ComponentArchivesRepositoryOptions = BaseRepositoryOptions & {
  model?: typeof ComponentArchiveModel;
};

export class ComponentArchivesRepository extends BaseRepository {
  private readonly model: typeof ComponentArchiveModel;

  constructor({ model, ...options }: ComponentArchivesRepositoryOptions = {}) {
    super(options);
    this.model = model ?? ComponentArchiveModel;
  }

  async findByComponentId(
    componentId: string
  ): Promise<LeanComponentArchive[]> {
    this.logger.debug({ componentId }, 'Listing archives by component');

    return await this.model
      .find({ component: componentId })
      .populate('component', 'disciplina codigo turma turno season')
      .sort({ createdAt: -1 })
      .lean();
  }

  async findById(archiveId: string) {
    this.logger.debug({ archiveId }, 'Finding archive by id');

    return await this.model.findById(archiveId);
  }

  async findOrCreateForProcessing(
    componentId: string,
    originalUrl: string,
    source: 'moodle' | 'cmcc' = 'moodle'
  ) {
    this.logger.debug(
      { componentId, originalUrl },
      'Finding or creating archive'
    );

    return await this.model.findOneAndUpdate(
      { component: componentId, original_url: originalUrl },
      {
        $setOnInsert: {
          component: componentId,
          original_url: originalUrl,
          source,
          status: 'created',
          timeline: [{ status: 'created' }],
        },
      },
      { new: true, upsert: true }
    );
  }

  async countFailureEvents(archiveId: Types.ObjectId): Promise<number> {
    this.logger.debug({ archiveId }, 'Counting archive failure events');

    const rows = await this.model.aggregate<FailureCountRow>([
      { $match: { _id: archiveId } },
      {
        $project: {
          failureCount: {
            $size: {
              $filter: {
                as: 'event',
                cond: { $eq: ['$$event.status', 'failed'] },
                input: '$timeline',
              },
            },
          },
        },
      },
    ]);

    if (rows.length === 0) {
      return 0;
    }

    return rows[0].failureCount;
  }

  async markStored(
    archiveId: Types.ObjectId,
    stored: {
      checksum: string;
      fileName: string;
      s3Key: string;
    }
  ): Promise<void> {
    this.logger.debug(
      { archiveId, s3Key: stored.s3Key },
      'Marking archive stored'
    );

    await this.model.findByIdAndUpdate(archiveId, {
      $push: {
        timeline: { status: 'stored' },
      },
      $set: {
        checksum: stored.checksum,
        file_name: stored.fileName,
        s3_key: stored.s3Key,
        status: 'stored',
      },
    });
  }

  async markFailed(
    archiveId: Types.ObjectId,
    metadata: Record<string, unknown>
  ): Promise<boolean> {
    this.logger.debug({ archiveId, metadata }, 'Marking archive failed');

    const failureCount = await this.countFailureEvents(archiveId);

    if (failureCount >= ARCHIVE_MAX_FAILURE_EVENTS) {
      this.logger.warn(
        { archiveId, failureCount },
        'Archive reached the failure event cap, skipping record'
      );
      return false;
    }

    await this.model.findByIdAndUpdate(archiveId, {
      $push: {
        timeline: { metadata, status: 'failed' },
      },
      $set: { status: 'failed' },
    });

    return true;
  }
}
