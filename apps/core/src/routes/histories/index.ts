import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';

import { listCurrentSeasonCourses } from './service.js';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.get('/courses', async () => listCurrentSeasonCourses());
};

export default plugin;
