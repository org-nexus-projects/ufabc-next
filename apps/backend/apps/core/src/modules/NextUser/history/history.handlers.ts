import { type currentQuad, findIds } from '@next/common';
import { type Student, StudentModel } from '@/models/Student.js';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { HistoryService } from './history.service.js';
import { SubjectModel } from '@/models/Subject.js';
import { z } from 'zod';
import { HistoryModel } from '@/models/History.js';

const validateSigaaComponents = z.object({
  ano: z.coerce.number(),
  periodo: z.string(),
  codigo: z.string(),
  situacao: z
    .enum(['APROVADO', 'REPROVADO', 'REPROVADO POR FALTAS', '--'])
    .transform((situation) => situation.toLocaleLowerCase()),
  disciplina: z.string().transform((name) => name.toLocaleLowerCase()),
  resultado: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'O', '--']),
});

const validateSigaaHistory = z.object({
  updateTime: z.date().optional(),
  curso: z.string(),
  ra: z.number(),
  components: validateSigaaComponents.array(),
});

type StudentComponent = z.infer<typeof validateSigaaComponents>;

export class HistoryHandler {
  constructor(private readonly historyService: HistoryService) {}

  async userHistory(
    request: FastifyRequest<UserHistoryRequest>,
    reply: FastifyReply,
  ) {
    const extensionHistory = request.body;

    const aggregateHistories = {
      extension: extensionHistory,
      grade: '2017',
    };

    if (!extensionHistory.ra) {
      reply.badRequest('An user RA must be passed');
    }

    // @ts-expect-error fix later
    const cleanedCourseName = this.normalizeCourseName(extensionHistory.curso);
    extensionHistory.curso = cleanedCourseName;
    const shouldUpdateGraduation =
      !!aggregateHistories.extension.curso && !!aggregateHistories.grade;

    if (shouldUpdateGraduation) {
      // @ts-expect-error fix later
      await this.updateUserGraduation(extensionHistory, this.historyService);
    }

    await this.historyService.createUserHistory(aggregateHistories);

    return {
      msg: 'UserHistory Synced',
    };
  }

  async historiesCourses(
    request: FastifyRequest<{
      Querystring: { season: ReturnType<typeof currentQuad> };
    }>,
  ) {
    const { season } = request.query;
    const seasonCourses = await findIds<Student>(StudentModel, season);
    return seasonCourses;
  }

  async sigaaHistory(request: FastifyRequest, reply: FastifyReply) {
    const studentHistory = validateSigaaHistory.parse(request.body);

    if (!studentHistory.ra) {
      return reply.badRequest('Missing user RA');
    }

    const hydratedComponentsPromises = studentHistory.components.map(
      (component) => hydrateComponents(component),
    );
    const hydratedComponents = await Promise.all(hydratedComponentsPromises);

    await HistoryModel.findOneAndUpdate(
      {
        ra: studentHistory.ra,
      },
      {
        $set: {
          ra: studentHistory.ra,
          disciplinas: hydratedComponents,
          // curso: translateCourse(studentHistory.curso)
        },
      },
      { new: true },
    );

    return {
      msg: `updated for ${studentHistory.ra}`,
    };
  }
}

async function hydrateComponents(component: StudentComponent) {
  const subjects = await SubjectModel.find({
    creditos: {
      $exists: true,
    },
  });
  const normalizedSubjects = subjects.map((subject) => ({
    name: subject.name.toLocaleLowerCase(),
    credits: subject.creditos,
  }));
  const validComponents = normalizedSubjects.find((subject) =>
    subject.name.includes(component.disciplina),
  );

  if (!validComponents) {
    return;
  }

  return {
    conceito: component.resultado === '--' ? null : component.resultado,
    periodo: component.periodo,
    situacao: component.situacao === '--' ? null : component.situacao,
    ano: component.ano,
    codigo: component.codigo,
    credito: validComponents.credits,
    disciplina: validComponents.name,
  };
}
