import type { Types } from 'mongoose';

import { ComponentArchiveModel } from '@/models/ComponentArchive.js';
import type { ComponentArchive } from '@/models/ComponentArchive.js';

import { BaseRepository } from './base-repository.js';
import type { BaseRepositoryOptions } from './base-repository.js';

export type LeanComponentArchive = ComponentArchive & {
  _id: Types.ObjectId;
  createdAt?: Date;
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
}
