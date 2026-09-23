import type { preHandlerAsyncHookHandler } from 'fastify';

import { httpErrors } from '@fastify/sensible';

import { StudentModel } from '@/models/Student.js';

export const validateStudent: preHandlerAsyncHookHandler = async (request) => {
  const { studentId, season } = request.query as {
    studentId: number;
    season: string;
  };
  const student = await StudentModel.findOne({
    season,
    aluno_id: studentId,
  });

  if (!student) {
    throw httpErrors.forbidden('StudentId');
  }
};
