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

      app.log.debug({ results }, 'PDFs extraídos');

      const lambdaResponses = await Promise.allSettled(
        results.map(async (payload) => {
          const resp = await fetch(app.config.AWS_LAMBDA_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-service-id': 'core'
            },
            body: JSON.stringify(payload)
          });

          let json: unknown;
          try {
            json = await resp.json();
          } catch (e) {
            app.log.error({ e }, 'Falha ao fazer parse do JSON da Lambda');
            json = [];
          }

          const pdfsFiltered = Array.isArray(json) ? json : [];
          app.log.info({ course: payload.course, count: pdfsFiltered.length }, 'Resposta da Lambda');

          for (const pdf of pdfsFiltered) {
            if (typeof pdf === 'object' && pdf !== null && 'pdfLink' in pdf && 'pdfName' in pdf) {
              app.log.info(pdf, 'PDF a ser baixado');
              await savePDF(
                typeof (pdf as any).pdfLink === 'string' ? (pdf as any).pdfLink : String((pdf as any).pdfLink),
                typeof (pdf as any).pdfName === 'string' ? (pdf as any).pdfName : String((pdf as any).pdfName),
                sessionToken as string
              );
            } else {
              app.log.error(pdf, 'PDF inválido encontrado');
            }
          }

          return {
            course: payload.course,
            processed: pdfsFiltered.length,
            data: pdfsFiltered
          };
        })
      );

      const aggregated = lambdaResponses.map((r, i) => {
        const courseName = results[i]?.course ?? `curso_${i}`;
        if (r.status === 'fulfilled') {
          const { course, ...rest } = r.value ?? {};
          return { course: courseName, ...rest, status: 'ok' as const };
        }
        app.log.error({ err: r.reason, course: courseName }, 'Falha na chamada da Lambda');
        return { course: courseName, processed: 0, data: [], status: 'error' as const, error: String(r.reason) };
        });

      const totalProcessed = aggregated.reduce((acc, cur) => acc + (cur.processed ?? 0), 0);

      return {
        success: true,
        mock: true,
        totalProcessed,
        results: aggregated
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
