import type { Teacher } from '@/models/Teacher.js';
import type { TeacherService } from './teacher.service.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

export class TeacherHandler {
  constructor(private readonly teacherService: TeacherService) {}

  async listAllTeachers() {
    const teachers = await this.teacherService.listTeachers({});
    return teachers;
  }

  async createTeacher(
    request: FastifyRequest<{ Body: Teacher }>,
    reply: FastifyReply,
  ) {
    const teacher = request.body;
    if (!teacher.name) {
      return reply.badRequest('Missing Teacher name');
    }
    const createdTeacher = await this.teacherService.insertTeacher(teacher);
    return createdTeacher;
  }
}
