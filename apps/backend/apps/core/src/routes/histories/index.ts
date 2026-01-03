import {
  HistoryModel,
  type Categories,
  type HistoryDocument,
  type History,
  type Situations,
} from '@/models/History.js';
import { GraduationModel } from '@/models/Graduation.js';
import { StudentModel } from '@/models/Student.js';
import { sigHistorySchema, type SigStatus } from '@/schemas/history.js';
import { UfabcParserConnector } from '@/connectors/ufabc-parser.js';
import { currentQuad } from '@next/common';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  const historyCache = app.cache<History>();
  const connector = new UfabcParserConnector();
  app.post(
    '/',
    { schema: sigHistorySchema },
    async ({ sessionId, headers, body }, reply) => {
      const viewState = headers['view-state'] ?? headers['View-State'];
      const { login, ra } = body;

      if (!sessionId || !viewState) {
        return reply.badRequest('Missing sessionId');
      }

      const cacheKey = `history:${ra}`;
      const cached = historyCache.get(cacheKey);
      if (cached) {
        return {
          msg: 'Cached history!',
        };
      }
      const parsedHistory = await connector.getHistory(
        sessionId,
        viewState as string
      );
      if (parsedHistory.error) {
        app.log.error(
          {
            ra,
            error: parsedHistory.error.issues.map((issue) => ({
              reason: issue.message,
              path: issue.path,
              code: issue.code,
            })),
            cause: parsedHistory.error.cause,
          },
          'error parsing history from parser'
        );
        return reply.internalServerError('Failed to fetch history from UFABC');
      }

      const { student, components, graduations, coefficients } =
        parsedHistory.data;

      if (!parsedHistory.data?.graduations.grade) {
        app.log.warn(
          {
            ra: student.ra,
            course: graduations.course,
          },
          'graduation.grade is invalid'
        );
      }

      let history: HistoryDocument | null = await HistoryModel.findOne({
        ra: student.ra,
      });

      app.log.info({
        msg: 'starting student sync',
        student: ra,
      });

      if (student.course && graduations.grade) {
        const doc = await GraduationModel.findOne({
          curso: student.course,
          grade: graduations.grade,
        }).lean();

        if (!doc?.locked) {
          await GraduationModel.findOneAndUpdate(
            {
              curso: student.course,
              grade: graduations.grade,
            },
            {
              mandatory_credits_number: graduations.mandatoryCredits,
              free_credits_number: graduations.freeCredits,
              credits_total: graduations.totalCredits,
              limited_credits_number: graduations.limitedCredits,
            },
            {
              upsert: true,
              new: true,
            }
          );
        }
      }

      const componentsToInsert = components.map((c) => ({
        periodo: c.period,
        codigo: c.UFCode,
        disciplina: c.name,
        ano: c.year,
        creditos: c.credits,
        categoria: transformCategory(c.category),
        situacao: transformStatus(c.status),
        conceito: c.grade,
        turma: c.class,
        teachers: c.teachers,
      }));

      if (!history && componentsToInsert.length > 0) {
        history = await HistoryModel.create({
          ra: student.ra,
          curso: student.course,
          disciplinas: componentsToInsert,
          grade: graduations.grade,
        });
      } else if (history) {
        history = await HistoryModel.findOneAndUpdate(
          {
            $or: [
              // Busca exata pelo curso normalizado
              { curso: student.course },
              // Busca parcial pelo curso (case insensitive)
              { curso: { $regex: student.course, $options: 'i' } },
              // Busca por palavras individuais do curso
              {
                curso: {
                  $regex: student.course
                    .split(/\s+/)
                    .map((word) => `(?=.*${word})`)
                    .join(''),
                  $options: 'i',
                },
              },
            ],
            ra: student.ra,
          },
          {
            $set: {
              disciplinas: componentsToInsert,
              grade: graduations.grade,
            },
          },
          { new: true }
        );
      }

      app.log.debug({
        student: student.ra,
        dbGrade: history?.grade,
        rawGrade: graduations.grade,
        msg: 'Synced Successfully',
      });

      const dbStudent = await StudentModel.findOne({
        ra: student.ra,
        season: currentQuad(),
      });

      const graduationsToInsert = {
        cp: coefficients.cp,
        cr: coefficients.cr,
        ca: coefficients.ca,
        nome_curso: student.course,
        ind_afinidade: coefficients.ik,
        turno: student.shift,
      };

      if (!dbStudent) {
        await StudentModel.create({
          ra: student.ra,
          login,
          season: currentQuad(),
          cursos: [graduationsToInsert],
        });
      }

      const hasGraduationChanged =
        student.course !== dbStudent?.cursos[0].nome_curso;

      if (hasGraduationChanged) {
        // update student with the new graduation, dont overwriting others
        await StudentModel.findOneAndUpdate(
          { ra: student.ra, season: currentQuad() },
          {
            $set: {
              cursos: [graduationsToInsert],
            },
          },
          { new: true }
        );
      }

      if (history) {
        historyCache.set(cacheKey, history);
        await app.job.dispatch('UserEnrollmentsUpdate', history);
      }

      return {
        msg: 'Sync sucessfully',
      };
    }
  );

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

const transformCategory = (
  category: 'free' | 'mandatory' | 'limited'
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

const transformStatus = (status: SigStatus): Situations => {
  const statusMap: Record<SigStatus, Situations> = {
    APR: 'Aprovado',
    APRN: 'Aprovado',
    REPN: 'Reprovado',
    REP: 'Reprovado',
    REPF: 'Reprovado',
    REPMF: 'Reprovado',
    REPNF: 'Reprovado',
    CANC: 'Trt. Total',
    MATR: null,
    CUMP: 'Aprovado',
    DISP: 'Aprovado',
    INCORP: null,
    REC: 'Aprovado',
    TRANC: null,
    '': null,
    TRANS: 'Aprovado',
  };

  return statusMap[status];
};
