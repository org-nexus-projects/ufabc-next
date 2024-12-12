import {
  HistoryModel,
  type Categories,
  type HistoryDocument,
} from '@/models/History.js';
import { StudentModel } from '@/models/Student.js';
import { sigHistorySchema, studentHistorySchema } from '@/schemas/history.js';
import { currentQuad } from '@next/common';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  const historyCache = app.cache<{}>();
  app.post('/', { schema: sigHistorySchema }, async (request, reply) => {
    const sigHistory = request.body;
    if (!sigHistory.ra) {
      return reply.badRequest('Missing RA');
    }

    const cacheKey = `history:${sigHistory.ra}`;
    const cached = historyCache.get(cacheKey);
    if (cached) {
      return {
        msg: 'Cached history!',
      };
    }

    let history = await HistoryModel.findOne({
      ra: sigHistory.ra,
    });

    app.log.info({
      msg: 'starting student sync',
      student: sigHistory.ra,
    });

    const mapComponentsToInsert = sigHistory.components.map((c) => ({
      periodo: c.period,
      codigo: c.UFCode,
      disciplina: c.name,
      ano: c.year,
      creditos: c.credits,
      categoria: tranformCategory(c.category),
      situacao: c.status,
      conceito: c.grade,
    }));

    if (!history && mapComponentsToInsert.length > 0) {
      history = await HistoryModel.create({
        ra: sigHistory.ra,
        curso: sigHistory.course,
        disciplinas: mapComponentsToInsert,
        grade: sigHistory.grade,
      });
    } else if (history) {
      history = await HistoryModel.findOneAndUpdate(
        { ra: sigHistory.ra, curso: sigHistory.course },
        {
          $set: { disciplinas: mapComponentsToInsert, grade: sigHistory.grade },
        },
        { new: true },
      );
    }

    app.log.info({
      student: sigHistory.ra,
      dbGrade: history?.grade,
      rawGrade: sigHistory.grade,
      sigHistory,
      msg: 'Synced Successfully',
    });

    historyCache.set(cacheKey, history?.toJSON() as NonNullable<History>);

    // dispatch coefficients job.
    await app.job.dispatch(
      'UserEnrollmentsUpdate',
      history as NonNullable<HistoryDocument>,
    );
    return {
      msg: history
        ? `Updated history for ${sigHistory.ra}`
        : `Created history for ${sigHistory.ra}`,
    };
  });

  app.get('/me', { schema: studentHistorySchema }, async (request, reply) => {
    const { ra } = request.query;

    const userHistory = await HistoryModel.findOne(
      {
        ra,
      },
      {
        _id: 0,
        grade: 1,
        curso: 1,
        ra: 1,
      },
    ).lean();

    if (!userHistory) {
      return null;
    }

    return {
      curso: userHistory?.curso,
      grade: userHistory?.grade,
      ra: userHistory?.ra,
    };
  });

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

const tranformCategory = (
  category: 'free' | 'mandatory' | 'limited',
): Categories => {
  if (category === 'free') {
    return 'Livre Escolha';
  }

  if (category === 'limited') {
    return 'Opção Limitada';
  }

  return 'Obrigatória';
};

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
