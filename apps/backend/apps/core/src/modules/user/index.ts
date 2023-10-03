import type { FastifyInstance } from 'fastify';
import { fastifyAutoload } from '@fastify/autoload';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Config } from '@/config/config.js';
import { completeUser } from './handlers/completeUser.js';
import { confirmUser } from './handlers/confirmUser.js';
import { resendUserEmail } from './handlers/resendUserEmail.js';
import { loggedUser } from './handlers/loggedUser.js';
import { authenticate } from './hooks/authenticate.js';

export default async function (app: FastifyInstance) {
  const dirEsm = dirname(fileURLToPath(import.meta.url));

  // avoid the plugin of receiving an auth hook
  await app.register(fastifyAutoload, {
    dir: join(dirEsm, './plugins'),
    encapsulate: false,
    maxDepth: 1,
    options: Config,
  });

  app.put('/users/complete', { onRequest: [authenticate] }, completeUser);
  app.post<{ Body: { token: string } }>(
    '/users/confirm',
    { onRequest: [authenticate] },
    confirmUser,
  );
  app.post('/users/resend', { onRequest: [authenticate] }, resendUserEmail);
  app.get('/users/info', { onRequest: [authenticate] }, loggedUser);
}
