import { DisciplinaModel } from '@next/models';
import { syncMatriculas } from '@next/queue';
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
