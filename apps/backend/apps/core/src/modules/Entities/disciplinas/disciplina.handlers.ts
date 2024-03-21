import { currentQuad } from '@next/common';
import type { Disciplina } from '@/models/Disciplina.js';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { DisciplinaService } from './disciplina.service.js';

type DisciplinaKicksRequest = {
  Params: {
    disciplinaId: number;
  };
  Querystring: {
    aluno_id: number;
    sort?: string;
  };
};

export class DisciplinaHandler {
  constructor(private readonly disciplinaService: DisciplinaService) {}

  async listDisciplinas(request: FastifyRequest) {
    const season = currentQuad();
    const { redis } = request.server;
    const cacheKey = `all_disciplinas_${season}`;
    const cachedResponse = await redis.get(cacheKey);

    if (cachedResponse) {
      return cachedResponse;
    }

    const disciplinas = await this.disciplinaService.findDisciplinas(season);

    await redis.set(cacheKey, JSON.stringify(disciplinas), 'EX', 60 * 60 * 24);
    return disciplinas;
  }

  async listDisciplinasKicks(
    request: FastifyRequest<DisciplinaKicksRequest>,
    reply: FastifyReply,
  ) {
    const { disciplinaId } = request.params;
    const { sort } = request.query;

    if (!disciplinaId) {
      await reply.badRequest('Missing DisciplinaId');
    }

    const season = currentQuad();
    const disciplina = await this.disciplinaService.findDisciplina(
      season,
      disciplinaId,
    );

    if (!disciplina) {
      return reply.notFound('Disciplina not found');
    }

    // create sort mechanism
    const kicks = sort || kickRule(disciplina);
    // @ts-expect-error for now
    const order = [kicks.length || 0].fill('desc');

    // turno must have a special treatment
    const turnoIndex = kicks.indexOf('turno');
    if (turnoIndex !== -1) {
      // @ts-expect-error for now
      order[turnoIndex] = disciplina.turno === 'diurno' ? 'asc' : 'desc';
    }

    const isAfterKick = [disciplina.after_kick].filter(Boolean).length;
    const resolveKicked = resolveMatricula(disciplina, isAfterKick);

    const kickedsMap = new Map(
      resolveKicked.map((kicked) => [kicked.aluno_id, kicked]),
    );
    const students = await StudentModel.aggregate<StudentAggregate>([
      {
        $match: {
          season,
          aluno_id: { $in: resolveKicked.map((kicked) => kicked.aluno_id) },
        },
      },
      { $unwind: '$cursos' },
    ]);
  }
}

function kickRule(disciplina: Disciplina) {
  const season = currentQuad();
  let coeffRule = null;
  if (
    season === '2020:2' ||
    season === '2020:3' ||
    season === '2021:1' ||
    season === '2021:2' ||
    season === '2021:3' ||
    season === '2022:1' ||
    season === '2022:2' ||
    season === '2022:3' ||
    season === '2023:1' ||
    season === '2023:2' ||
    season === '2023:3' ||
    season === '2024:1' ||
    season === '2024:2' ||
    season === '2024:3' ||
    season === '2025:1'
  ) {
    coeffRule = ['cp', 'cr'];
  } else {
    coeffRule = disciplina.ideal_quad ? ['cr', 'cp'] : ['cp', 'cr'];
  }

  return ['reserva', 'turno', 'ik'].concat(coeffRule);
}

function resolveMatricula(disciplina: Disciplina, isAfterKick: number) {
  // if kick has not arrived, not one has been kicked
  if (!isAfterKick) {
    const registeredStudents = disciplina.alunos_matriculados || [];
    return registeredStudents.map((student) => ({
      aluno_id: student,
    }));
  }

  // check diff between before_kick and after_kick
  const kicked = differenceOnKicks(
    disciplina.before_kick ?? [],
    disciplina.after_kick ?? [],
  );
  // return who has been kicked
  return disciplina.before_kick.map((student) => ({
    aluno_id: student,
    kicked: kicked.includes(student),
  }));
}

const differenceOnKicks = (beforeKick: number[], afterKick: number[]) =>
  beforeKick.filter((kick) => !afterKick.includes(kick));
