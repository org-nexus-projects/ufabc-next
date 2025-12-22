import type { FastifyInstance } from 'fastify';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import {
  serializerCompiler as zodSerializerCompiler,
  validatorCompiler as zodValidatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import {
  validatorCompiler as openApiValidatorCompiler,
  serializerCompiler as openApiSerializerCompiler,
} from 'fastify-zod-openapi';

type V2Routes = Array<FastifyPluginAsyncZod>;

/**
 * Hybrid validator compiler that routes to the appropriate compiler
 * based on whether the route is a v2 route (using fastify-type-provider-zod)
 * or an old route (using fastify-zod-openapi)
 */
function createHybridValidatorCompiler() {
  const zodValidator = zodValidatorCompiler;
  const openApiValidator = openApiValidatorCompiler;

  return (schema: unknown, uri?: string) => {
    // Check if this is a v2 route
    // uri might be undefined for some routes, so default to openapi validator
    if (uri && typeof uri === 'string' && uri.startsWith('/v2')) {
      // fastify-type-provider-zod compilers only take schema (not uri)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return zodValidator(schema as any);
    }
    // Otherwise use the openapi validator (default for old routes and undefined uri)
    // Both compilers only take schema, not uri
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return openApiValidator(schema as any);
  };
}

/**
 * Hybrid serializer compiler that routes to the appropriate compiler
 * Tries to detect if schema is a Zod schema (for v2 routes) or OpenAPI schema (for old routes)
 */
function createHybridSerializerCompiler() {
  const zodSerializer = zodSerializerCompiler;
  const openApiSerializer = openApiSerializerCompiler;

  return (schema: unknown, uri?: string) => {
    const isZodSchema =
      schema &&
      typeof schema === 'object' &&
      ('_def' in schema || '_type' in schema || 'parse' in schema);

    const isV2Route =
      (uri && typeof uri === 'string' && uri.startsWith('/v2')) || isZodSchema;

    if (isV2Route) {
      // fastify-type-provider-zod compilers only take schema (not uri)
      return zodSerializer(schema);
    }
    // Otherwise use the openapi serializer (default for old routes)
    return openApiSerializer(schema);
  };
}

/**
 * Sets up v2 routes with fastify-type-provider-zod
 * Uses hybrid compilers that route to the appropriate validator/serializer
 * based on the route path, allowing both systems to coexist
 */
export async function setupV2Routes(
  app: FastifyInstance,
  controllers: V2Routes,
) {
  // Set up hybrid compilers FIRST (before any routes are registered)
  // This ensures all routes use the hybrid compiler that routes based on path
  app.setValidatorCompiler(createHybridValidatorCompiler());
  app.setSerializerCompiler(createHybridSerializerCompiler());

  // Register v2 routes in an encapsulated scope
  await app.register(
    async (v2App) => {
      for (const controller of controllers) {
        await controller(v2App, {});
      }
    },
    { prefix: '/v2' },
  );
}
