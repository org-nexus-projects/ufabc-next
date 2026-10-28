import type { Types } from 'mongoose';

import {
  ARCHIVE_MAX_FAILURE_EVENTS,
  REGEX_SPECIAL_CHARS,
} from '@/constants.js';
import { ComponentArchiveModel } from '@/models/ComponentArchive.js';
import type { ComponentArchive } from '@/models/ComponentArchive.js';

import { BaseRepository } from './base-repository.js';
import type { BaseRepositoryOptions } from './base-repository.js';

export type LeanComponentArchive = ComponentArchive & {
  _id: Types.ObjectId;
  createdAt: Date;
};

export type ArchiveComponentSummary = {
  _id: Types.ObjectId;
  codigo: string;
  disciplina: string;
  season: string;
  turma: string;
  turno: string;
};

export type LeanPopulatedArchive = Omit<LeanComponentArchive, 'component'> & {
  component: ArchiveComponentSummary | null;
};

type FailureCountRow = {
  failureCount: number;
};

export type ArchivePageFilter = {
  limit: number;
  page: number;
  q?: string;
  source?: ComponentArchive['source'];
  status?: ComponentArchive['status'];
};

function escapeRegex(text: string) {
  let escaped = '';
  for (const char of text) {
    if (REGEX_SPECIAL_CHARS.test(char)) {
      escaped += `\\${char}`;
    } else {
      escaped += char;
    }
  }
  return escaped;
}

export type ComponentArchivesRepositoryOptions = BaseRepositoryOptions & {
  model?: typeof ComponentArchiveModel;
};

export class ComponentArchivesRepository extends BaseRepository {
  private readonly model: typeof ComponentArchiveModel;

  constructor({ model, ...options }: ComponentArchivesRepositoryOptions = {}) {
    super(options);
    this.model = model ?? ComponentArchiveModel;
  }

  async findPage({ limit, page, q, source, status }: ArchivePageFilter) {
    this.logger.debug(
      { limit, page, q, source, status },
      'Listing archives page'
    );

    const filter: Record<string, unknown> = {};
    if (q) {
      filter.file_name = { $options: 'i', $regex: escapeRegex(q) };
    }
    if (source) {
      filter.source = source;
    }
    if (status) {
      filter.status = status;
    }

    const items = await this.model
      .find(filter)
      .populate<{ component: ArchiveComponentSummary | null }>(
        'component',
        'disciplina codigo turma turno season'
      )
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean<LeanPopulatedArchive[]>();
    const total = await this.model.countDocuments(filter);

    return { items, total };
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
