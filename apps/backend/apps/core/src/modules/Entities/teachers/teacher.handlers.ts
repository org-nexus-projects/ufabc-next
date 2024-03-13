import type { Teacher } from '@/models/Teacher.js';
import type { TeacherService } from './teacher.service.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

export type UpdateTeacherRequest = {
  Body: {
    alias: string[];
  };
  Params: {
    teacherId: string;
  };
};

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

  async updateTeacher(
    request: FastifyRequest<UpdateTeacherRequest>,
    reply: FastifyReply,
  ) {
    const { teacherId } = request.params;
    const { alias } = request.body;

    if (!teacherId) {
      return reply.badRequest('Missing teacherId');
    }

    const teacherWithAlias = await this.teacherService.setTeacherAlias(
      teacherId,
      alias,
    );

    return teacherWithAlias;
  }
}
