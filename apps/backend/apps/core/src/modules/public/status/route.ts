import { connections, STATES } from 'mongoose';
import { statusSchema } from './schema.js';
import type { FastifyInstance } from 'fastify';

export async function statusRoute(app: FastifyInstance) {
  app.get('/status', { schema: statusSchema }, (_, reply) => {
    const [connection] = connections;
    const isDatabaseUp = !!`${STATES[connection.readyState]}`;
    return reply.send({
      msg: 'listening...',
      databaseConnected: isDatabaseUp ?? false,
    });
  });
}
