import { z } from 'zod';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import { ofetch } from 'ofetch';
import * as cheerio from 'cheerio';

export const pdfSchema = z.object({
  pdfLink: z.string(),
  pdfName: z.string(),
});

export type PdfItem = z.infer<typeof pdfSchema>;

type Course = {
  id: number;
  fullname: string;
  link?: string;
};

type ApiResponse = {
  error?: { message: string };
  data?: {
    courses: Course[];
  };
};

async function getCoursesFromAPI(sessionId: string, sesskey: string): Promise<Course[]> {
  
  const urlMoodle = 'https://moodle.ufabc.edu.br';
  const [response] = await ofetch<ApiResponse[]>(`${urlMoodle}/lib/ajax/service.php`, {
    method: 'POST',
    params: { sesskey },
    headers: { Cookie: `MoodleSession=${sessionId}` },
    credentials: 'include',
    body: [{
      index: 0,
      methodname: "core_course_get_enrolled_courses_by_timeline_classification",
      args: { offset: 0, limit: 0, classification: "all" }
    }]
  });

  if (response.error || !response.data) {
    throw new Error(`Moodle API error: ${response.error?.message}`);
  }

  return response.data.courses.map(course => ({
    ...course,
    link: `${urlMoodle}/course/view.php?id=${course.id}`
  })) || [];
}

async function extractPDFs(sessionId: string, courseLink: string): Promise<PdfItem[]> {
  if (!courseLink) {
    throw new Error('Link do curso não encontrado');
  }
  const html = await ofetch<string>(courseLink, {
    headers: { Cookie: `MoodleSession=${sessionId}` },
    credentials: 'include'
  });
  const $ = cheerio.load(html);
  const pdfs: PdfItem[] = [];

  $('div.activityname').each((_, el) => {
    const link = $(el).find('a').attr('href');
    const name = $(el).find('span.instancename').text().replace(/Arquivo/i, '').trim();
    
    if (link && name) {
      pdfs.push({ pdfLink: link, pdfName: name });
    }
  });

  return pdfs;
}

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

      const courses: Course[] = await getCoursesFromAPI(sessionToken as string, sessKey as string);

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

      return { data: results };

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