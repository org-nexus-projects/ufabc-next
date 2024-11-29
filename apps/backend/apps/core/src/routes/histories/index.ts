import {
  HistoryModel,
  type Categories,
  type History,
} from '@/models/History.js';
import { sigHistorySchema, studentHistorySchema } from '@/schemas/history.js';
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
        coefficients: null,
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

    // dispatch coefficients job.
    await app.job.dispatch(
      'UserEnrollmentsUpdate',
      history?.toJSON() as NonNullable<History>,
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
      return reply.badRequest('History not found');
    }

    return {
      curso: userHistory.curso,
      grade: userHistory.grade,
      ra: userHistory.ra,
    };
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
