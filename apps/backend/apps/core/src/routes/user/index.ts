import { userAuthSchema } from '@/schemas/auth.js';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  // app.addHook('preHandler', (req, rep) =>
  //   !req.session.user ? rep.unauthorized('should not be here') : rep.send(),
  // );
  app.get('/info', { schema: userAuthSchema }, ({ session }) => session.user);
};

export default plugin;
