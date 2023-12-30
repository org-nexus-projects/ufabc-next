import { syncMatriculas } from '@next/queue';
import { DisciplinaModel } from '@/models/index.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

export async function sync(
  request: FastifyRequest<{
    Querystring: 'alunos_matriculados' | 'after_kick' | 'before_kick';
  }>,
  reply: FastifyReply,
) {
  const operation = request.query;

  // @ts-expect-error Mongoose Types
  const result = await syncMatriculas(operation, DisciplinaModel);

  reply.send(result);
}
