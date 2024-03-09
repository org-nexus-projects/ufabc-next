import { gradesUser } from './handlers/gradesUser.js';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function userRoute(app: FastifyInstance) {
  // TODO: deprecate
  app.get('/grades', gradesUser);
}
