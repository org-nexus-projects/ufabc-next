import type { FastifyInstance } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import type { FastifyRouteSchemaDef } from 'fastify/types/schema.js';
import { ZodError, type ZodAny } from 'zod';

export async function httpErrorsValidator(app: FastifyInstance) {
  app.setValidatorCompiler((req: FastifyRouteSchemaDef<ZodAny>) => {
    return (data: ZodAny) => {
      const res = validatorCompiler(req)(data);
      // @ts-ignore
      if (res.error) {
        // @ts-ignore
        res.error.httpPart = req.httpPart;
      }
      return res;
    };
  });

  app.setSerializerCompiler(serializerCompiler);

  // The default zod error serialization is awful
  // See: https://github.com/turkerdev/fastify-type-provider-zod/issues/26#issuecomment-1322254607
  app.setErrorHandler((error, _, reply) => {
    if (error instanceof ZodError) {
      reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        // @ts-ignore -- This is set in the validator compiler above 👆
        httpPart: error.httpPart,
        issues: error.issues,
      });
      return;
    }
    reply.send(error);
  });
}
