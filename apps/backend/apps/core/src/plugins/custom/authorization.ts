import fp from 'fastify-plugin';
import type { FastifyReply, FastifyRequest } from 'fastify';

declare module 'fastify' {
  export interface FastifyRequest {
    verifyAccess: typeof verifyAccess;
    isAdmin: typeof isAdmin;
  }
}

function verifyAccess(this: FastifyRequest, reply: FastifyReply, role: string) {
  if (!this.user?.permissions.includes(role)) {
    reply.status(403).send('You are not authorized to access this resource.');
  }
}

async function isAdmin(this: FastifyRequest, reply: FastifyReply) {
  this.verifyAccess(reply, 'admin');
}

/**
 * The use of fastify-plugin is required to be able
 * to export the decorators to the outer scope
 *
 * @see {@link https://github.com/fastify/fastify-plugin}
 */
export default fp(
  async (app) => {
    app.decorateRequest('verifyAccess', verifyAccess);
    app.decorateRequest('isAdmin', isAdmin);
  },
  // You should name your plugins if you want to avoid name collisions
  // and/or to perform dependency checks.
  { name: 'authorization' },
);
