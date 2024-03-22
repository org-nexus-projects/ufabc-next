import { currentQuad } from '@next/common';
import { StudentModel } from '@/models/Student.js';
import type { onRequestAsyncHookHandler } from 'fastify';

export const setStudentId: onRequestAsyncHookHandler = async (
  request,
  reply,
) => {
  const { aluno_id } = request.query as { aluno_id: number };
  const season = currentQuad();

  const student = await StudentModel.findOne({
    season,
    aluno_id,
  });

  // if not found block route
  if (!student) {
    return reply.forbidden('Student_id');
  }

  // if not, pass
  return;
};
