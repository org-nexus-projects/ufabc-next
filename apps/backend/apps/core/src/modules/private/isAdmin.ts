import { z } from 'zod';
import { Config } from '@/config/config.js';
import type { preValidationHookHandler } from 'fastify';

const paramsSchema = z.object({
  access_key: z.string().min(6).max(16),
  operation: z.string().optional().default('alunos_matriculados'),
});

export const isAdminValidator: preValidationHookHandler = (
  request,
  _reply,
  done,
) => {
  const { access_key } = paramsSchema.parse(request.query);
  if (access_key !== Config.ACCESS_KEY) {
    request.log.info({
      msg: 'Who was here',
      ip: request.ip,
      remoteIp: request.raw.socket.remoteAddress,
    });
    throw new Error('You should not be here');
  }
  done();
};
