import type { FastifyReply, FastifyRequest } from 'fastify';
import { nextUsageInfo } from './nextSummary.service';

export async function nextSummaryHandler(
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
