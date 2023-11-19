import { GraduationHistoryModel } from '@next/models';
import type { ObjectId } from 'mongoose';
import type { RouteHandler } from 'fastify';

type HistoriesRouteHandler = RouteHandler<{
  Querystring: { graduation: ObjectId };
}>;
export const histories: HistoriesRouteHandler = async (request, reply) => {
  try {
    const { graduation } = request.query;
    const histories = await GraduationHistoryModel.find({
      graduation,
    }).lean(true);
    return reply.status(200).send(histories);
  } catch (error) {
    return reply.send({ error, msg: 'could not get histories graduations' });
  }
};
