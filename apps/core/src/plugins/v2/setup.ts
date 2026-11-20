import type { FastifyInstance } from 'fastify';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

type V2Routes = Array<FastifyPluginAsyncZod>;

/**
 * Registers the v2 controllers under the `/v2` prefix. Validation and
 * serialization come from the Zod compilers set by `plugins/external/zod.ts`.
 */
export async function setupV2Routes(
  app: FastifyInstance,
  controllers: V2Routes
) {
  await app.register(
    async (v2App) => {
      for (const controller of controllers) {
        await controller(v2App, {});
      }
    },
    { prefix: '/v2' }
  );
}
