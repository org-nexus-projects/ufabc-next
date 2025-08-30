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
              pdfs: await extractPDFs(sessionToken as string, course.link)
            };
          })
        )
      ).filter(Boolean) as Array<{ course: string; pdfs: Array<{ pdfLink: string; pdfName: string }> }>;

      app.log.info(results, 'PDFs extraídos');

      /*
      const lambdaResp = await app.lambda.invoke('your-lambda-function-name', {
        payload: JSON.stringify(results)
      });

      const rawPayload =
        (lambdaResp as any)?.payload ??
        (lambdaResp as any)?.Payload ??
        null;

      const pdfsFiltered = rawPayload ? JSON.parse(rawPayload) : [];
      */

      const pdfsFiltered = [
        { pdfLink: 'https://moodle.ufabc.edu.br/mod/resource/view.php?id=49857', pdfName: 'file1.pdf', pdfContent: 'Plano de Ensino Atualizado' }
      ];

      // baixar e salvar PDFs
      for (const pdf of pdfsFiltered) {
        if (typeof pdf === 'object' && pdf !== null && 'pdfLink' in pdf && 'pdfName' in pdf) {
          app.log.info(pdf, 'PDF mock a ser baixado');
          await savePDF(pdf.pdfLink, pdf.pdfName, sessionToken as string);
        } else {
          app.log.error(pdf, 'PDF inválido encontrado');
        }
      }

      /*
      await Promise.all(
        pdfsFiltered.map(async (pdf: any) => {
          return app.s3.upload({
            Bucket: 'your-s3-bucket',
            Key: `pdfs/${pdf.pdfName}`,
            Body: pdf.pdfContent
          }).promise?.() ?? null;
        })
      );
      */

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
