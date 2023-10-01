import type { FastifyInstance } from 'fastify';
import { Config } from '@/config/config.js';
import { authenticate } from '../hooks/authenticate.js';
import oauth2 from '../plugins/oauth2/oauth2.js';
import { completeUser } from './handlers/completeUser.js';
import { confirmUser } from './handlers/confirmUser.js';
import { resendUserEmail } from './handlers/resendUserEmail.js';

export default async function (app: FastifyInstance) {
  await app.register(oauth2, Config);

  app.addHook('onRequest', authenticate);

  app.post('/v2/users/complete', completeUser);
  app.post('/v2/users/confirm', confirmUser);
  app.post('/v2/users/resend', resendUserEmail);

  // await app.register(fastifyAutoload, {
  //   dir: join(dirEsm, 'routes'),
  //   dirNameRoutePrefix: false,
  //   options: {
  //     prefix: opts.prefix,
  //   },
  // });
}
