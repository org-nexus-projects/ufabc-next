import fp from 'fastify-plugin';
import fastifyCookie from '@fastify/cookie';
import type { Auth } from '@/schemas/auth.js';

declare module 'fastify' {
  interface Session {
    user: Auth;
  }
}

/**
 * This plugins enables the use of cookies.
 *
 * @see {@link https://github.com/fastify/fastify-cookie}
 */
export default fp(
  async (app) => {
    app.register(fastifyCookie);
  },
  {
    name: 'cookie',
  }
);
