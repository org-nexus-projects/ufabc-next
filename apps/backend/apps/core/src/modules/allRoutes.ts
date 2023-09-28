import type { FastifyInstance } from 'fastify';

import comments from './comments/index.js';
import enrollments from './enrollments/index.js';
import healthcheck from './healthCheck/index.js';
import nextSummary from './nextSummary/index.js';
import userSignUp from './user/signUp/index.js';
import userInfo from './user/info/index.js';

export async function allRoutes(app: FastifyInstance) {
  app.register(comments);
  app.register(enrollments);
  app.register(healthcheck);
  app.register(nextSummary);
  app.register(userInfo);
  app.register(userSignUp);
}
