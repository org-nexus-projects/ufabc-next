import { nextUsageInfo } from './nextSummaryQuery.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

export async function nextSummary(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { redis } = request.server;
  const nextSummary = await nextUsageInfo();
  const CACHE_KEY = `next-usage`;
  const cached = await redis.get(CACHE_KEY);

  if (cached) {
    return cached;
  }

  await redis.set(CACHE_KEY, JSON.stringify(nextSummary), 'EX', 60 * 60);
  return reply.code(200).send(nextSummary);
}
