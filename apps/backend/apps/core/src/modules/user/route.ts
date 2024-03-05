import { completeUser } from './handlers/completeUser.js';
import { confirmUser } from './handlers/confirmUser.js';
import { resendUserEmail } from './handlers/resendUserEmail.js';
import { loggedUser } from './handlers/loggedUser.js';
import {
  completeUserSchema,
  confirmUserSchema,
  resendEmailSchema,
  usersInfoSchema,
} from './schema.js';
import { gradesUser } from './handlers/gradesUser.js';
import type { FastifyInstance } from 'fastify';

// eslint-disable-next-line require-await
export async function userRoute(app: FastifyInstance) {
  app.put('/complete', { schema: completeUserSchema }, completeUser);
  app.post('/confirm', { schema: confirmUserSchema }, confirmUser);
  app.post('/resend', { schema: resendEmailSchema }, resendUserEmail);
  app.get('/info', { schema: usersInfoSchema }, loggedUser);
  app.get('/grades', gradesUser);
}
