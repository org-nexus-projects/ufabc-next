import type { preHandlerAsyncHookHandler } from 'fastify';

export const jwtVerifyHook: preHandlerAsyncHookHandler = async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch {
    return reply.status(401).send({ message: 'You must be authenticated to access this route' });
  }
};
