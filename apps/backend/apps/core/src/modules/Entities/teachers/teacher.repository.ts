import type {
  Teacher,
  TeacherDocument,
  TeacherModel,
} from '@/models/Teacher.js';
import type { FilterQuery, PipelineStage } from 'mongoose';

type SearchAggregate = {
  total: number;
  data: Teacher[];
};

interface EntitityTeacherRepository {
  findTeacher(options: FilterQuery<Teacher>): Promise<Teacher[] | null>;
  insertTeacher(data: Teacher): Promise<TeacherDocument>;
  findAndUpdateTeacher(
    filter: FilterQuery<Teacher>,
    data: Teacher,
  ): Promise<Teacher | null>;
  searchTeacher(pipeline: PipelineStage[]): Promise<SearchAggregate[]>;
}

export class TeacherRepository implements EntitityTeacherRepository {
  constructor(private readonly teacherService: typeof TeacherModel) {}

  async findTeacher(options: FilterQuery<Teacher>) {
    const teachers = await this.teacherService
      // eslint-disable-next-line unicorn/no-array-callback-reference
      .find(options)
      .lean<Teacher[]>(true);
    return teachers;
  }

  async insertTeacher(data: Teacher) {
    const newTeacher = await this.teacherService.create(data);
    return newTeacher;
  }

  async findAndUpdateTeacher(
    filter: FilterQuery<Teacher>,
    data: Partial<Teacher>,
  ) {
    const updatedTeacher = await this.teacherService.findOneAndUpdate(
      filter,
      data,
      { returnOriginal: false },
    );

    return updatedTeacher;
  }

  async searchTeacher(pipeline: PipelineStage[]) {
    const searchResults =
      await this.teacherService.aggregate<SearchAggregate>(pipeline);
    return searchResults;
  }
}
