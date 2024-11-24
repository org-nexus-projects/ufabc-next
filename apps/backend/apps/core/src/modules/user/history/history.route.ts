import { authenticate } from '@/hooks/authenticate.js';
import { historiesCoursesSchema } from './history.schema.js';
import { createHistory } from './handlers/createHistory.js';
import { seasonCourses } from './handlers/seasonCourses.js';
import type { FastifyInstance, preHandlerAsyncHookHandler } from 'fastify';
import { HistoryModel } from '@/models/History.js';

const sigHistoryPreHandler: preHandlerAsyncHookHandler = async (request, reply) => {
  // content-script request assumes the page as hostname
  if (request.hostname !== 'sig.ufabc.edu.br') {
    return reply.badRequest()
  }

  request.log.warn({
    ip: request.ip,
    userAgent: request.headers['user-agent']
  }, 'requestedBy')
  return;
}

export async function historyRoutes(app: FastifyInstance) {
  app.get(
    '/courses',
    { schema: historiesCoursesSchema, onRequest: [authenticate] },
    seasonCourses,
  );

  app.post('/sigaa', createHistory);
  app.get('/me', { preHandler: sigHistoryPreHandler }, async (request, reply) => {
    const { ra } = request.query as { ra: number }
    const history = await HistoryModel.findOne({ ra }, { curso: 1, grade: 1, ra: 1, _id: 0 }).lean<{ curso: string; grade: string; ra: number }>();
    if (!history) {
      return reply.badRequest('User History not found')
    }
    return history;
  })
}
