import { GraduationSubjectModel } from '@/models/index.js';
import type { ObjectId } from 'mongoose';
import type { RouteHandler } from 'fastify';

export type SubjectQueryString = {
  limit: number;
  populate: string | string[];
  selectedGraduation: ObjectId;
};

type SubjectRouteHandler = RouteHandler<{
  Querystring: SubjectQueryString;
}>;
export const subjectGraduation: SubjectRouteHandler = async (
  request,
  reply,
) => {
  try {
    const { limit, populate, selectedGraduation } = request.query;
    const subjectsGraduation = await GraduationSubjectModel.find({
      graduation: selectedGraduation,
    })
      .lean(true)
      .limit(limit)
      .populate(populate);
    return reply.status(200).send(subjectsGraduation);
  } catch (error) {
    return reply.send({ error, msg: 'could not get subjects' });
  }
};
