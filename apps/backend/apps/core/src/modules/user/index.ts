import type { FastifyInstance } from 'fastify';
import { Config } from '@/config/config.js';
import { completeUser } from './handlers/completeUser.js';
import { confirmUser } from './handlers/confirmUser.js';
import { resendUserEmail } from './handlers/resendUserEmail.js';
import { loggedUser } from './handlers/loggedUser.js';
import { oauth2 } from './plugins/oauth2/oauth2.js';
import { authenticate } from './hooks/authenticate.js';

export const autoPrefix = '/users';
export default async function (app: FastifyInstance) {
  await app.register(oauth2, Config);

  app.addHook('onRequest', authenticate);

  app.post('/complete', completeUser);
  app.post('/confirm', confirmUser);
  app.post('/resend', resendUserEmail);
  app.get('/info', loggedUser);
}
