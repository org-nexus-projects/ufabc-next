import type { Component, DisciplinaModel } from '@/models/Disciplina.js';
import type { Student, StudentModel } from '@/models/Student.js';
import type { FilterQuery, PipelineStage, ProjectionType } from 'mongoose';

type StudentAggregate = Student & {
  cursos: Student['cursos'][number];
};

interface EntitiesDisciplinaRepository {
  findMany(
    filter: FilterQuery<Component>,
    mapping?: ProjectionType<Component>,
    populateFields?: string[],
  ): Promise<Component[] | null>;
  findOne(filter: FilterQuery<Component>): Promise<Component | null>;
  findCursos(filter: FilterQuery<Student>): Promise<StudentAggregate[]>;
}

export class DisciplinaRepository implements EntitiesDisciplinaRepository {
  constructor(
    private readonly disciplinaService: typeof DisciplinaModel,
    private readonly studentService: typeof StudentModel,
  ) {}

  async findMany(
    filter: FilterQuery<Component>,
    mapping?: ProjectionType<Component>,
    populateFields?: string[],
  ) {
    if (populateFields) {
      const disciplinas = await this.disciplinaService
        .find(filter, mapping)
        .populate(populateFields)
        .lean<Component[]>({ virtuals: true });
      return disciplinas;
    }
    const disciplinas = await this.disciplinaService

      .find(filter, mapping)
      .lean<Component[]>({ virtuals: true });
    return disciplinas;
  }

  async findOne(filter: FilterQuery<Component>) {
    const disciplina = await this.disciplinaService.findOne(filter);

    return disciplina;
  }

  async findCursos(pipeline: PipelineStage[]) {
    const students =
      await this.studentService.aggregate<StudentAggregate>(pipeline);

    return students;
  }
}
