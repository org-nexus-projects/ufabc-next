import type { FastifyInstance } from 'fastify';
import { fastifyAutoload } from '@fastify/autoload';
import { join } from 'node:path';
import { Config } from '@config';

type UserRouteOptions = {
  // In case the routes provide a custom path
  prefix: string;
};

export default async function users(
  app: FastifyInstance,
  opts: UserRouteOptions,
) {
  await app.register(fastifyAutoload, {
    dir: join(__dirname, '../plugins'),
    options: Config,
    encapsulate: false,
  });
  await app.register(fastifyAutoload, {
    dir: join(__dirname, 'routes'),
    dirNameRoutePrefix: false,
    options: {
      prefix: opts.prefix,
    },
  });
}
