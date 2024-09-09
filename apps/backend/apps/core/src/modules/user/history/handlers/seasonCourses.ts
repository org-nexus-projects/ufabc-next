import { StudentModel, type Student } from '@/models/Student.js';
import { currentQuad, findIds } from '@next/common';
import { z } from 'zod';
import type { FastifyRequest } from 'fastify';

const validatedQueryParam = z.object({
  season: z.string().default(currentQuad()),
});

export async function seasonCourses(request: FastifyRequest) {
  const { season } = validatedQueryParam.parse(request.query);
  const seasonCourses = await findIds<Student>(
    StudentModel,
    season as ReturnType<typeof currentQuad>,
  );
  return seasonCourses;
}
