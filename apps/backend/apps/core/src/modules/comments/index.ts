import type { FastifyInstance } from 'fastify';

export const autoPrefix = '/v2';
export default async function (app: FastifyInstance) {
  app.get('/testemos', () => {});
}
