import { syncMatriculas } from '@/queue/jobs/syncMatriculas.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

export type SyncMatriculasRequest = {
  Querystring: 'alunos_matriculados' | 'after_kick' | 'before_kick';
};

export async function syncMatriculasHandler(
  request: FastifyRequest<SyncMatriculasRequest>,
  reply: FastifyReply,
) {
  const operation = request.query;
  const result = await syncMatriculas(operation, request.server.redis);

  reply.send(result);
}
