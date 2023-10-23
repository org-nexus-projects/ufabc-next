import { nextUsageInfo } from './nextSummaryQuery.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

export async function nextSummary(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const ufabcNextSummary = await nextUsageInfo();
  const { redis } = request.server;
  const CACHE_KEY = `next-usage`;
  const cached = await redis.get(CACHE_KEY);

  if (cached) {
    return cached;
  }

  await request.server.redis.set(
    CACHE_KEY,
    JSON.stringify(ufabcNextSummary),
    'EX',
    60 * 60,
  );
  return reply.code(200).send(ufabcNextSummary);
}
