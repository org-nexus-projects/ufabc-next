import { SubjectModel } from '@/models/Subject.js';
import type { RouteHandler } from 'fastify';

export type CreateSubjectRequest = {
  Body: { name: string };
};

export const createSubjectHandler: RouteHandler<CreateSubjectRequest> = async (
  request,
  reply,
) => {
  const createdSubject = await SubjectModel.create(request.body);
  return reply.status(200).send(createdSubject);
};
