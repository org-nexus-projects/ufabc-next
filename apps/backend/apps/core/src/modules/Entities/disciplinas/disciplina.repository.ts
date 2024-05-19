import type { Disciplina, DisciplinaModel } from '@/models/Disciplina.js';
import type { Student, StudentModel } from '@/models/Student.js';
import type { FilterQuery, PipelineStage, ProjectionType } from 'mongoose';

type StudentAggregate = Student & {
  cursos: Student['cursos'][number];
};

interface EntitiesDisciplinaRepository {
  findMany(
    filter: FilterQuery<Disciplina>,
    mapping?: ProjectionType<Disciplina>,
    populateFields?: string[],
  ): Promise<Disciplina[] | null>;
  findOne(filter: FilterQuery<Disciplina>): Promise<Disciplina | null>;
  findCursos(filter: FilterQuery<Student>): Promise<StudentAggregate[]>;
}

export class DisciplinaRepository implements EntitiesDisciplinaRepository {
  constructor(
    private readonly disciplinaService: typeof DisciplinaModel,
    private readonly studentService: typeof StudentModel,
  ) {}

  async findMany(
    filter: FilterQuery<Disciplina>,
    mapping?: ProjectionType<Disciplina>,
    populateFields?: string[],
  ) {
    if (populateFields) {
      const disciplinas = await this.disciplinaService
        // eslint-disable-next-line unicorn/no-array-method-this-argument
        .find(filter, mapping)
        .populate(populateFields)
        .lean<Disciplina[]>({ virtuals: true });
      return disciplinas;
    }
    const disciplinas = await this.disciplinaService
      // eslint-disable-next-line unicorn/no-array-method-this-argument
      .find(filter, mapping)
      .lean<Disciplina[]>({ virtuals: true });
    return disciplinas;
  }

  async findOne(filter: FilterQuery<Disciplina>) {
    const disciplina = await this.disciplinaService.findOne(filter);

    return disciplina;
  }

  async findCursos(pipeline: PipelineStage[]) {
    const students =
      await this.studentService.aggregate<StudentAggregate>(pipeline);

    return students;
  }
}
