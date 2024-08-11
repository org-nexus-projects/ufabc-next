import { StudentModel, type Student } from '@/models/Student.js';
import { findIds, type currentQuad } from '@next/common';
import { z } from 'zod';
import type { FastifyRequest } from 'fastify';

const validatedQueryParam = z.object({
  season: z.string(),
});

export async function historiesCourses(request: FastifyRequest) {
  const { season } = validatedQueryParam.parse(request.query);
  const seasonCourses = await findIds<Student>(
    StudentModel,
    season as ReturnType<typeof currentQuad>,
  );
  return seasonCourses;
}
