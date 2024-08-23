import { currentQuad } from '@next/common';
import { StudentModel } from '@/models/Student.js';
import type { onRequestAsyncHookHandler } from 'fastify';

export const setStudentId: onRequestAsyncHookHandler = async (
  request,
  reply,
) => {
  const { aluno_id, studentId } = request.query as {
    aluno_id: number;
    studentId: number;
  };
  const season = currentQuad();

  const student = await StudentModel.findOne({
    season,
    aluno_id: aluno_id ?? studentId,
  });

  // if not found block route
  if (!student) {
    return reply.forbidden('Student_id');
  }

  // if not, pass
  return;
};
