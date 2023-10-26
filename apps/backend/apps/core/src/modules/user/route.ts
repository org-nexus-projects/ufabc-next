import { completeUser } from './handlers/completeUser.js';
import { confirmUser } from './handlers/confirmUser.js';
import { resendUserEmail } from './handlers/resendUserEmail.js';
import { loggedUser } from './handlers/loggedUser.js';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function userRoute(app: FastifyInstance) {
  app.put('/complete', completeUser);
  app.post('/confirm', confirmUser);
  app.post('/resend', resendUserEmail);
  app.get('/info', loggedUser);
}
