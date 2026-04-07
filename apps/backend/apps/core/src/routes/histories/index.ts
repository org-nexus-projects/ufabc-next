import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';

import { currentQuad } from '@next/common';

import { StudentModel } from '@/models/Student.js';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.get('/courses', async (request, reply) => {
    const season = currentQuad();
    const coursesAggregate = await StudentModel.aggregate<{
      _id: string;
      ids: string[];
    }>([
      { $match: { season } },
      { $unwind: '$cursos' },
      { $match: { 'cursos.id_curso': { $ne: null } } },
      {
        $project: {
          'cursos.id_curso': 1,
          'cursos.nome_curso': { $trim: { input: '$cursos.nome_curso' } },
        },
      },
      {
        $group: {
          _id: '$cursos.nome_curso',
          ids: { $push: '$cursos.id_curso' },
        },
      },
    ]);

    const courses = coursesAggregate.map((course) => {
      const validIds = course.ids.filter((id) => id != null && id !== '');

      // Find the most frequent ID
      const courseModeId = validIds.length > 0 ? findMode(validIds) : undefined;

      return {
        name: course._id,
        curso_id: courseModeId,
      };
    });

    return courses;
  });
};

export default plugin;

function findMode(arr: any[]) {
  const frequencyMap = arr.reduce((acc, val) => {
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});

  let maxFrequency = 0;
  let modes: number[] = [];

  for (const [value, frequency] of Object.entries(frequencyMap)) {
    if (Number(frequency) > maxFrequency) {
      modes = [Number(value)];
      maxFrequency = frequency as number;
    } else if (frequency === maxFrequency) {
      modes.push(Number(value));
    }
  }

  return modes[0]; // Return first mode if multiple exist
}
