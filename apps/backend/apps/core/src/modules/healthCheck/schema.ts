import { z } from 'zod';

const healthCheckSuccessResponse = z.object({
  msg: z.string().describe('Server state'),
  databaseStatus: z.string().describe('Is server connected'),
  redisStatus: z.string().describe('Is Redis connected'),
});

export const healthCheckSchema = {
  $id: 'healthCheckSchema',
  tags: ['healthcheck', 'public'],
  description:
    'Rota para validar que o app e a conexão com terceiros esta de pé',
  response: {
    200: healthCheckSuccessResponse,
  },
};
