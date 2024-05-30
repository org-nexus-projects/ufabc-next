import { z } from 'zod';

const statusSuccessResponse = z.object({
  msg: z.string().describe('Server state'),
  databaseStatus: z.string().describe('Is server connected'),
  redisStatus: z.string().describe('Is Redis connected'),
});

export const statusCheckSchema = {
  $id: 'healthCheckSchema',
  tags: ['Public'],
  description:
    'Rota para validar que o app e a conexão com terceiros esta de pé',
  response: {
    200: statusSuccessResponse,
  },
};
