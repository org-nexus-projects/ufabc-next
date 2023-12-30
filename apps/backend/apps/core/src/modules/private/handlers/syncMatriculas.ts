import { syncMatriculas } from '@/queue/jobs/syncMatriculas.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

export async function syncMatriculasHandler(
  request: FastifyRequest<{
    Querystring: 'alunos_matriculados' | 'after_kick' | 'before_kick';
  }>,
  reply: FastifyReply,
) {
  const operation = request.query;
  const result = await syncMatriculas(operation, request.server.redis);

  reply.send(result);
}
