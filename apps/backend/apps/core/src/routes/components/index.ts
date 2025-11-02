import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import {
  getCoursesFromAPI,
  extractPDFs,
  processCourseWithLambda,
} from './service.js';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.post('/', async (request, reply) => {
    const sessionToken = request.headers['session-id'];
    const sessKey = request.headers['sess-key'];

    if (!sessionToken || !sessKey) {
      reply.status(400);
      return { error: 'Headers session-id e sess-key são obrigatórios' };
    }

    try {
      const courses = await getCoursesFromAPI(
        sessionToken as string,
        sessKey as string,
      );

      if (courses.length === 0) {
        reply.status(404);
        return { error: 'Nenhum curso encontrado.' };
      }

      const coursesWithPDFs = await Promise.all(
        courses
          .filter((course): course is typeof course & { link: string } =>
            Boolean(course.link),
          )
          .map(async (course) => ({
            course: course.fullname,
            promptData: await extractPDFs(sessionToken as string, course.link),
          })),
      );

      app.log.debug({ coursesWithPDFs }, 'PDFs extraídos');

      const lambdaResponses = await Promise.allSettled(
        coursesWithPDFs.map((payload) =>
          processCourseWithLambda(
            payload,
            app.config.AWS_LAMBDA_URL,
            sessionToken as string,
          ),
        ),
      );

      const results = lambdaResponses.map((response, index) => {
        const courseName = coursesWithPDFs[index]?.course ?? `curso_${index}`;

        if (response.status === 'fulfilled') {
          return { ...response.value, status: 'ok' as const };
        }

        app.log.error(
          { err: response.reason, course: courseName },
          'Falha na chamada da Lambda',
        );

        return {
          course: courseName,
          processed: 0,
          data: [],
          status: 'error' as const,
          error: String(response.reason),
        };
      });

      const totalProcessed = results.reduce(
        (acc, cur) => acc + (cur.processed ?? 0),
        0,
      );

      return {
        success: true,
        mock: true,
        totalProcessed,
        results,
      };
    } catch (error) {
      reply.status(500);
      return {
        error: 'Erro ao processar requisição',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  });
};

export default plugin;
