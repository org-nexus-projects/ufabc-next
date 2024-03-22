import type { FilterQuery } from 'mongoose';
import type { TeacherRepository } from './teacher.repository.js';
import type { Teacher } from '@/models/Teacher.js';

export class TeacherService {
  constructor(private readonly teacherRepository: TeacherRepository) {}

  async listTeachers(options: FilterQuery<Teacher>) {
    const teachers = await this.teacherRepository.findTeacher(options);
    return teachers;
  }

  async insertTeacher(data: Teacher) {
    const newTeacher = await this.teacherRepository.insertTeacher(data);
    return newTeacher;
  }

  async setTeacherAlias(teacherId: string, alias: string[]) {
    const teacherWithAlias = await this.teacherRepository.findAndUpdateTeacher(
      {
        _id: teacherId,
      },
      { alias },
    );

    return teacherWithAlias;
  }

  async findTeacher(search: RegExp) {
    const [searchResults] = await this.teacherRepository.searchTeacher([
      {
        $match: { name: search },
      },
      {
        $facet: {
          total: [{ $count: 'total' }],
          data: [{ $limit: 10 }],
        },
      },
      {
        $addFields: {
          total: { $ifNull: [{ $arrayElemAt: ['$total.total', 0] }, 0] },
        },
      },
      {
        $project: {
          total: 1,
          data: 1,
        },
      },
    ]);
    return searchResults;
  }
}
