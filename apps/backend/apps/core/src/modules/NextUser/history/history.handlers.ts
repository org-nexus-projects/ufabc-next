import { type currentQuad, findIds } from '@next/common';
import { type Student, StudentModel } from '@/models/Student.js';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { HistoryService } from './history.service.js';
import { SubjectModel } from '@/models/Subject.js';

// type UserHistoryRequest = {
//   Body: {
//     ra: number;
//     grade: string;
//     mandatory_credits_number: number;
//     limited_credits_number: number;
//     free_credits_number: number;
//     credits_total: number;
//     curso: string;
//   };
// };

type UserHistoryRequest = {
  Body: {
    updateTime: Date;
    curso: string; //"CIÊNCIA E TECNOLOGIA/PROGRAD/BI - SANTO ANDRÉ - BACHARELADO - N";
    ra: string;
    disciplinas: Array<{
      ano: string;
      periodo: string;
      codigo: string;
      situacao: string | '--';
      resultado: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'O';
      disciplina: string
    }>;
  };
};

export class HistoryHandler {
  constructor(private readonly historyService: HistoryService) { }

  async userHistory(
    request: FastifyRequest<UserHistoryRequest>,
    reply: FastifyReply,
  ) {
    const extensionHistory = request.body;

    let aggregateHistories = {
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

  async sigaaHistory(request: FastifyRequest<UserHistoryRequest>, reply: FastifyReply) {
    const { body } = request
    request.log.warn(body.disciplinas)
    const components = body.disciplinas.map(disciplina => hydrateComponents(disciplina));
    const fixedComponents = body.disciplinas.map(({ ano, codigo, periodo, resultado, situacao }) => {
      return {
        conceito: resultado,
        periodo,
        ano,
        codigo,
        situacao
      }
    })
    body.disciplinas = fixedComponents
  

    // await this.historyService.createUserHistory(body)
    return body
  }
}


async function hydrateComponents(component: UserHistoryRequest['Body']['disciplinas'][number]) {
  const subject = await SubjectModel.find({
    name: component.disciplina
  },{ creditos: 1, name: 1, _id: 0 }).lean()

  console.log(subject)
  return {
    conceito: component.resultado,
    periodo: component.periodo,
    situacao: component.situacao,
    ano: component.ano,
    codigo: component.codigo,
    credito: component.credito,
  }
}
