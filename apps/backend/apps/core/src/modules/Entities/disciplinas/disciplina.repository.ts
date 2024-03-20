import type { Disciplina, DisciplinaModel } from '@/models/Disciplina.js';
import type { FilterQuery, ProjectionType } from 'mongoose';

interface EntitiesDisciplinaRepository {
  findMany(
    filter: FilterQuery<Disciplina>,
    mapping?: ProjectionType<Disciplina>,
    populateFields?: string[],
  ): Promise<Disciplina[] | null>;
}

export class DisciplinaRepository implements EntitiesDisciplinaRepository {
  constructor(private readonly disciplinaService: typeof DisciplinaModel) {}

  async findMany(
    filter: FilterQuery<Disciplina>,
    mapping?: ProjectionType<Disciplina>,
    populateFields?: string[],
  ) {
    if (populateFields) {
      const disciplinas = await this.disciplinaService
        // eslint-disable-next-line unicorn/no-array-callback-reference, unicorn/no-array-method-this-argument
        .find(filter, mapping)
        .populate(populateFields)
        .lean<Disciplina[]>({ virtuals: true });
      return disciplinas;
    }
    const disciplinas = await this.disciplinaService
      // eslint-disable-next-line unicorn/no-array-callback-reference, unicorn/no-array-method-this-argument
      .find(filter, mapping)
      .lean<Disciplina[]>({ virtuals: true });
    return disciplinas;
  }
}
