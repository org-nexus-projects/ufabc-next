import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import {
  getCoursesFromAPI,
  extractPDFs
} from './service.js';
import { SubjectMoodleLink } from '@/schemas/subjectLinks.js';

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.post('/', async (request, reply) => {
    const sessionToken = request.headers['session-id'];
    const sessKey = request.headers['sess-key'];
    if (!sessionToken || !sessKey) {
      reply.status(400);
      return { error: 'Headers session-id e sess-key são obrigatórios' };
    }

    try {
      if (!sessKey) {
        reply.status(401);
        return { error: 'Não foi possível obter sesskey - sessão pode estar inválida' };
      }

      const courses: SubjectMoodleLink[] = await getCoursesFromAPI(sessionToken as string, sessKey as string);

      if (courses.length === 0) {
        return { error: 'Nenhum curso encontrado.' };
      }

      const [results] = await Promise.all(
        courses.map(async (course) => {
          if (!course.link) {
            return;
          } 
          return {
            course: course.fullname,
            pdfs: await extractPDFs(sessionToken as string, course.link)
          }
        }
      ));
      app.log.info(results, 'PDFs extraídos');

      return { data: results, sessionToken };

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