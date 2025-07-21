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

async function fetchWithSession(sessionId: string) {
  return ofetch.create({
    headers: { Cookie: `MoodleSession=${sessionId}` },
    credentials: 'include'
  });
}

async function getSessKey(fetchFn: typeof ofetch): Promise<string | null> {
  const html = await fetchFn<string>('https://moodle.ufabc.edu.br/my/courses.php');
  
  const sesskey =
    html.match(/"sesskey":"([^"]+)"/)?.[1];

  return typeof sesskey === 'undefined' ? null : sesskey;
}

async function getCoursesFromAPI(fetchFn: typeof ofetch, sesskey: string): Promise<Course[]> {
  const response = await fetchFn<ApiResponse[]>('https://moodle.ufabc.edu.br/lib/ajax/service.php', {
    method: 'POST',
    params: { sesskey },
    body: [{
      index: 0,
      methodname: "core_course_get_enrolled_courses_by_timeline_classification",
      args: { offset: 0, limit: 0, classification: "all" }
    }]
  });

  if (response[0]?.error) {
    throw new Error(`Moodle API error: ${response[0].error.message}`);
  }

  return response[0]?.data?.courses.map(course => ({
    ...course,
    link: `https://moodle.ufabc.edu.br/course/view.php?id=${course.id}`
  })) || [];
}

async function extractPDFs(fetchFn: typeof ofetch, courseLink: string): Promise<PdfItem[]> {
  const html = await fetchFn<string>(courseLink);
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
    const sessionId = request.headers['session-id'];
    if (!sessionId) {
      reply.status(400);
      return { error: 'Header session-id é obrigatório' };
    }

    try {
      const fetchWithCookies = await fetchWithSession(sessionId as string);
      const sesskey = await getSessKey(fetchWithCookies);

      if (!sesskey) {
        reply.status(401);
        return { error: 'Não foi possível obter sesskey - sessão pode estar inválida' };
      }

      let courses: Course[];
      courses = await getCoursesFromAPI(fetchWithCookies, sesskey);
      

      if (courses.length === 0) {
        return { error: 'Nenhum curso encontrado.' };
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      const results = await Promise.all(
        courses.map(async (course) => ({
          course: course.fullname,
          pdfs: await extractPDFs(fetchWithCookies, course.link || '')
        }))
      );
      console.log(`Results[0]: ${JSON.stringify(results[0], null, 2)}`);

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