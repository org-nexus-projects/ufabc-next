import { syncMatriculas } from '@/queue/jobs/syncMatriculas.js';
import { DisciplinaModel } from '@/models/index.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

export async function sync(
  request: FastifyRequest<{
    Querystring: 'alunos_matriculados' | 'after_kick' | 'before_kick';
  }>,
  reply: FastifyReply,
) {
  const operation = request.query;

  const result = await syncMatriculas(operation, DisciplinaModel);

  reply.send(result);
}
