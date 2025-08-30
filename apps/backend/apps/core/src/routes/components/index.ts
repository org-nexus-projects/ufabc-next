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

      // chamar a lambda passando os resultados
      const lambdaResp = await app.lambda.invoke('your-lambda-function-name', {
        payload: JSON.stringify(results)
      });

      // normalizar payload e tentar parsear JSON
      const rawPayload =
        (lambdaResp as any)?.payload ??
        (lambdaResp as any)?.Payload ??
        null;

      const pdfsFiltered = rawPayload ? JSON.parse(rawPayload) : [];

      // validar resposta da Lambda
      if (!Array.isArray(pdfsFiltered)) {
        app.log.error(pdfsFiltered, 'Erro ao filtrar PDFs');
        reply.status(500);
        return {
          error: 'Erro ao processar resposta da Lambda',
          details: pdfsFiltered instanceof Error ? pdfsFiltered.message : String(pdfsFiltered),
        };
      }

      // baixar e salvar PDFs
      for (const pdf of pdfsFiltered) {
        app.log.info(pdf, 'PDF a ser baixado');
        await savePDF(pdf.pdfLink, pdf.pdfName, sessionToken as string);
      }

      // subir os PDFs para o S3
      await Promise.all(
        pdfsFiltered.map(async (pdf: any) => {
          return app.s3.upload({
            Bucket: 'your-s3-bucket',
            Key: `pdfs/${pdf.pdfName}`,
            Body: pdf.pdfContent
          }).promise?.() ?? null;
        })
      );

      return { success: true, processed: pdfsFiltered.length };
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
