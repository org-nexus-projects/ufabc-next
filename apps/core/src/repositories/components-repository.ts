import type { Types } from 'mongoose';

import { ACCENT_MAP, REGEX_SPECIAL_CHARS } from '@/constants.js';
import { ComponentModel } from '@/models/Component.js';
import type { ComponentDocument } from '@/models/Component.js';

import { BaseRepository } from './base-repository.js';
import type { BaseRepositoryOptions } from './base-repository.js';

function escapeRegexChar(char: string): string {
  return REGEX_SPECIAL_CHARS.test(char) ? `\\${char}` : char;
}

function buildAccentInsensitiveRegex(word: string): string {
  let pattern = '';
  for (const char of word.toLowerCase()) {
    pattern += ACCENT_MAP[char] ?? escapeRegexChar(char);
  }
  return pattern;
}

// most recent season first, so archive matching prefers the latest offering
const MOST_RECENT_SEASON_FIRST = { quad: -1 as const, year: -1 as const };

export type ComponentsRepositoryOptions = BaseRepositoryOptions & {
  model?: typeof ComponentModel;
};

export class ComponentsRepository extends BaseRepository {
  private readonly model: typeof ComponentModel;

  constructor({ model, ...options }: ComponentsRepositoryOptions = {}) {
    super(options);
    this.model = model ?? ComponentModel;
  }

  async findByCodigo(
    codigo: string,
    filter: Record<string, unknown> = {}
  ): Promise<ComponentDocument | null> {
    this.logger.debug({ codigo, filter }, 'Finding component by codigo');

    return await this.model
      .findOne({
        codigo,
        ...filter,
      })
      .sort(MOST_RECENT_SEASON_FIRST);
  }

  async findByDisciplinaKeywords(
    keywords: string[],
    filter: Record<string, unknown> = {}
  ): Promise<ComponentDocument | null> {
    if (keywords.length === 0) {
      return null;
    }

    this.logger.debug(
      { filter, keywords },
      'Finding component by disciplina keywords'
    );

    const regexConditions = keywords.map((keyword) => ({
      disciplina: { $regex: buildAccentInsensitiveRegex(keyword) },
    }));

    return await this.model
      .findOne({
        $and: regexConditions,
        ...filter,
      })
      .sort(MOST_RECENT_SEASON_FIRST);
  }

  async setMoodleCourseId(
    componentId: Types.ObjectId,
    moodleCourseId: number
  ): Promise<void> {
    this.logger.debug(
      { componentId, moodleCourseId },
      'Setting moodleCourseId on component'
    );

    await this.model.findByIdAndUpdate(componentId, {
      $set: { moodleCourseId },
    });
  }

  async findById(componentId: Types.ObjectId) {
    this.logger.debug({ componentId }, 'Finding component by id');

    return await this.model.findById(componentId);
  }

  async findLeanByClassroomCode(season: string, classroomCode: string) {
    this.logger.debug({ classroomCode, season }, 'Finding component by code');

    return await this.model
      .findOne({ season, uf_cod_turma: classroomCode })
      .select('_id')
      .lean();
  }

  async findLeanById(componentId: Types.ObjectId) {
    this.logger.debug({ componentId }, 'Finding lean component by id');

    return await this.model.findById(componentId).lean();
  }
}
