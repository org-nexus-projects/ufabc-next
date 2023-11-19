import { addUserRa } from './hooks/addUser.js';
import { isAdminHook } from './hooks/isAdmin.js';
import { graduation } from './handlers/graduation.js';
import {
  type SubjectQueryString,
  subjectGraduation,
} from './handlers/subjects.js';
import { histories } from './handlers/histories.js';
import type { ObjectId } from 'mongoose';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function graduationsRoute(app: FastifyInstance) {
  app.get('/', graduation);
  app.get<{ Querystring: SubjectQueryString }>(
    '/subject',
    { preHandler: [isAdminHook] },
    subjectGraduation,
  );
  app.get<{ Querystring: { graduation: ObjectId } }>(
    '/histories',
    { onSend: addUserRa },
    histories,
  );
}
