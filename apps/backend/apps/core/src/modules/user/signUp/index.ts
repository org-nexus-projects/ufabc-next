import type { FastifyInstance } from 'fastify';
import { fastifyAutoload } from '@fastify/autoload';
import { dirname, join } from 'node:path';
import { Config } from '@config';
import { fileURLToPath } from 'node:url';

type UserRouteOptions = {
  // In case the routes provide a custom path
  prefix: string;
};
const dirEsm = dirname(fileURLToPath(import.meta.url));

export default async function (app: FastifyInstance, opts: UserRouteOptions) {
  await app.register(fastifyAutoload, {
    dir: join(dirEsm, '../plugins'),
    options: Config,
    encapsulate: false,
  });
  // await app.register(fastifyAutoload, {
  //   dir: join(dirEsm, 'routes'),
  //   dirNameRoutePrefix: false,
  //   options: {
  //     prefix: opts.prefix,
  //   },
  // });
}
