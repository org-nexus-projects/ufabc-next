import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import {
  getCoursesFromAPI,
  extractPDFs,
  savePDF
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
      const courses: SubjectMoodleLink[] = await getCoursesFromAPI(sessionToken as string, sessKey as string);

      if (courses.length === 0) {
        reply.status(404);
        return { error: 'Nenhum curso encontrado.' };
      }

      // pegar PDFs de todos os cursos
      const results = (
        await Promise.all(
          courses.map(async (course) => {
            if (!course.link) return undefined;
            return {
              course: course.fullname,
              promptData: await extractPDFs(sessionToken as string, course.link)
            };
          })
        )
      ).filter(Boolean) as Array<{ course: string; promptData: Array<{ pdfLink: string; pdfName: string }> }>;

      app.log.debug({
        results
      }, 'PDFs extraídos');
      

      const resp = await fetch(app.config.AWS_LAMBDA_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-service-id': 'core'
        },
        body: JSON.stringify(results[0])
      });

      const pdfsFilteredRaw = await resp.json();
      const pdfsFiltered = Array.isArray(pdfsFilteredRaw) ? pdfsFilteredRaw : [];
      console.log(pdfsFiltered);
      for (const pdf of pdfsFiltered) {
        if (typeof pdf === 'object' && pdf !== null && 'pdfLink' in pdf && 'pdfName' in pdf) {
          app.log.info(pdf, 'PDF mock a ser baixado');
          await savePDF(
            typeof pdf.pdfLink === 'string' ? pdf.pdfLink : String(pdf.pdfLink),
            typeof pdf.pdfName === 'string' ? pdf.pdfName : String(pdf.pdfName),
            sessionToken as string
          );
        } else {
          app.log.error(pdf, 'PDF inválido encontrado');
        }
      }

      return { success: true, processed: pdfsFiltered.length, mock: true, data: pdfsFiltered };
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
