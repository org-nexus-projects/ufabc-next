import { GraduationModel } from '@next/models';
import type { RouteHandler } from 'fastify';

type GraduationRouteHandler = RouteHandler<{ Querystring: { limit: number } }>;
export const graduation: GraduationRouteHandler = async (request, reply) => {
  try {
    const { limit } = request.query;
    const graduations = await GraduationModel.find()
      .lean(true)
      .limit(limit ?? 200);
    return reply.status(200).send(graduations);
  } catch (error) {
    return reply.send({ error, msg: 'could not get graduations' });
  }
};
