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
}
