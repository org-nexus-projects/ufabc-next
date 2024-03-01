import { GraduationHistoryModel } from '@/models/GraduationHistory.js';
import type { RouteHandler } from 'fastify';

type HistoriesRouteHandler = RouteHandler<{
  Querystring: { ra: number };
}>;
export const historiesGraduation: HistoriesRouteHandler = async (
  request,
  reply,
) => {
  try {
    const user = request.user;
    const histories = await GraduationHistoryModel.find({
      ra: user?.ra ?? request.query.ra,
    })
      .select({
        coefficients: 1,
      })
      .lean({
        virtuals: true,
      });

    request.log.info(histories);
    return reply.status(200).send({ docs: histories });
  } catch (error) {
    await reply.send({ error, msg: 'could not get histories graduations' });
    throw error;
  }
};
