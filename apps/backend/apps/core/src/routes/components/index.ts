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

      // chamar a lambda passando os resultados
      const pdfsFiltered = await app.lambda.invoke('your-lambda-function-name', {
        payload: results
      });

      app.log.info(pdfsFiltered, 'Resposta da Lambda');

      // processar a resposta da lambda
      if (!Array.isArray(pdfsFiltered)) {
        app.log.error(pdfsFiltered, 'Erro ao filtrar PDFs');
        reply.status(500);
        return {
          error: 'Erro ao processar resposta da Lambda',
          details: pdfsFiltered instanceof Error ? pdfsFiltered.message : String(pdfsFiltered),
        };
      }

      // download PDFs
      pdfsFiltered.forEach(pdf => {
        app.log.info(pdf, 'PDF a ser baixado');
        // salvar o PDF
        await savePDF(pdf.pdfLink, pdf.pdfName, sessionToken as string);
      });

      // subir os PDFs para s3
      await Promise.all(pdfsFiltered.map(async (pdf) => {
        await app.s3.upload({
          Bucket: 'your-s3-bucket',
          Key: `pdfs/${pdf.pdfName}`,
          Body: pdf.pdfContent
        });
      }));
    } catch (error) {
      reply.status(500);
      return {
        error: 'Erro ao processar requisição',
        details: error instanceof Error ? error.message : String(error),
      };
    }
  });
}

export default plugin;