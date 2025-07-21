import { z } from 'zod';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import { ofetch } from 'ofetch'
import * as cheerio from 'cheerio';

import type { $fetch } from 'ofetch';

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

async function getSessKey(fetchWithCookies: typeof $fetch): Promise<string | null> {
  try {
    const html = await fetchWithCookies<string>('https://moodle.ufabc.edu.br/my/courses.php', { method: 'GET' });
    const $ = cheerio.load(html);

    const sesskey = $('input[name="sesskey"]').attr('value') || 
                   $('[data-sesskey]').attr('data-sesskey') ||
                   html.match(/"sesskey":"([^"]+)"/)?.[1] ||
                   html.match(/sesskey=([^&"]+)/)?.[1];
    
    return sesskey || null;
  } catch (error) {
    return null;
  }
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

async function getCoursesFromHTML(fetchFn: typeof ofetch): Promise<Course[]> {
  const html = await fetchFn<string>('https://moodle.ufabc.edu.br/my/courses.php');
  const $ = cheerio.load(html);
  const courses: Course[] = [];

  $('a.coursename').each((_, element) => {
    const link = $(element).attr('href');
    const idMatch = link?.match(/id=(\d+)/);
    if (link && idMatch) {
      courses.push({
        id: parseInt(idMatch[1]),
        fullname: $(element).text().trim(),
        link
      });
    }
  });

  return courses;
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

  return data[0]?.data?.courses || [];
}

const plugin: FastifyPluginAsyncZodOpenApi = async (app) => {
  app.post(
    '/',
    async (request, reply) => {
      const MoodleSession = request.headers['session-id'];
      
      if (!MoodleSession) {
        reply.status(400);
        return { error: 'Header session-id é obrigatório' };
      }

      const fetchWithCookies = ofetch.create({
        headers: {
          Cookie: `MoodleSession=${MoodleSession}`,
        },
        credentials: 'include'
      });

      try {
        const sesskey = await getSessKey(fetchWithCookies);
        
        if (!sesskey) {
          reply.status(401);
          return { error: 'Não foi possível obter sesskey - sessão pode estar inválida' };
        }

        let courses: { link: string; title: string; id: number }[] = [];
        
        try {
          const coursesAPI = await getCourseThroughAPI(fetchWithCookies, sesskey);
          
          courses = coursesAPI.map((curso: any) => ({
            id: curso.id,
            title: curso.fullname || curso.shortname || curso.displayname,
            link: `https://moodle.ufabc.edu.br/course/view.php?id=${curso.id}`
          }));
          
        } catch (apiError) {
          const response = await fetchWithCookies('https://moodle.ufabc.edu.br/my/courses.php', {
            method: 'GET'
          });

          if (response.status === 302 || response.headers.get('location')?.includes('login')) {
            reply.status(401);
            return { error: 'Sessão MoodleSession inválida ou expirada' };
          }

          if (!response.ok) {
            reply.status(response.status);
            return { error: `Erro na requisição: ${response.statusText}` };
          }

          const html = await response.text();

          if (html.includes('Você não está logado') || html.includes('form id="login"')) {
            reply.status(401);
            return { error: 'Sessão MoodleSession inválida ou expirada' };
          }

          const $ = cheerio.load(html);
          courses = [];

          $('a.coursename').each((_, element) => {
            const link = $(element).attr('href');
            const title = $(element).text().trim();
            const idMatch = link?.match(/id=(\d+)/);
            const id = idMatch ? parseInt(idMatch[1]) : 0;

            if (link) {
              courses.push({ link, title, id });
            }
          });
        }

        if (courses.length === 0) {
          return { error: 'Nenhum curso encontrado.' };
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        const results = await Promise.all(
          courses.map(async (course) => {
            const payload = await processCourse(course.link, fetchWithCookies);
            return { 
              course: course.title, 
              pdfs: payload 
            };
          }),
        );
        console.log(`Results[0]: ${JSON.stringify(results[0], null, 2)}`);

        return { data: results };

      } catch (error) {
        reply.status(500);
        return {
          error: 'Erro ao fazer scraping',
          details: error instanceof Error ? error.message : String(error),
        };
      }
    },
  );
};

export default plugin;
