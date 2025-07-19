import { z } from 'zod';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import fetch from 'node-fetch';
import fetchCookie from 'fetch-cookie';
import tough from 'tough-cookie';
import * as cheerio from 'cheerio';

const pdfSchema = z.array(
  z.object({
    linkPdf: z.string().url(),
    nomePdf: z.string(),
  }),
);

export const gradeSchema = {
  body: pdfSchema,
};

export type PdfItem = {
  linkPdf: string;
  nomePdf: string;
};

async function processarCurso(link: string, fetchWithCookies: typeof fetch): Promise<PdfItem[]> {
  try {
    const response = await fetchWithCookies(link, {
      method: 'GET',
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    const pdfs: PdfItem[] = [];

    $('div.activityname').each((_, el) => {
      const linkElement = $(el).find('a');
      const spanElement = $(el).find('span.instancename');

      const linkPdf = linkElement.attr('href') || '';
      let nomePdf = spanElement.text() || '';

      nomePdf = nomePdf.replace(/Arquivo/i, '').trim();

      if (linkPdf && nomePdf) {
        pdfs.push({ linkPdf, nomePdf });
      }
    });

    return pdfs;
  } catch (err) {
    return [];
  }
}

async function obterSesskey(fetchWithCookies: typeof fetch): Promise<string | null> {
  try {
    const response = await fetchWithCookies('https://moodle.ufabc.edu.br/my/courses.php', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
      },
    });

    const html = await response.text();
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

async function obterCursosViaAPI(fetchWithCookies: typeof fetch, sesskey: string) {
  const apiUrl = `https://moodle.ufabc.edu.br/lib/ajax/service.php?sesskey=${sesskey}&info=core_course_get_enrolled_courses_by_timeline_classification`;
  
  const body = [{
    index: 0,
    methodname: "core_course_get_enrolled_courses_by_timeline_classification",
    args: {
      offset: 0,
      limit: 0,
      classification: "all",
      sort: "fullname",
      customfieldname: "",
      customfieldvalue: ""
    }
  }];

  const response = await fetchWithCookies(apiUrl, {
    method: 'POST',
    headers: {
      'accept': 'application/json, text/javascript, */*; q=0.01',
      'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'content-type': 'application/json',
      'sec-ch-ua': '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'x-requested-with': 'XMLHttpRequest',
      'Referer': 'https://moodle.ufabc.edu.br/my/courses.php',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as any[];

  if (data[0]?.error) {
    throw new Error(`Moodle API error: ${data[0].error.message}`);
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

      const cookieJar = new tough.CookieJar();
      const fetchWithCookies = fetchCookie(fetch, cookieJar);

      cookieJar.setCookieSync(
        `MoodleSession=${MoodleSession}`,
        'https://moodle.ufabc.edu.br'
      );

      try {
        const sesskey = await obterSesskey(fetchWithCookies);
        
        if (!sesskey) {
          reply.status(401);
          return { error: 'Não foi possível obter sesskey - sessão pode estar inválida' };
        }

        let courses: { link: string; title: string; id: number }[] = [];
        
        try {
          const cursosAPI = await obterCursosViaAPI(fetchWithCookies, sesskey);
          
          courses = cursosAPI.map((curso: any) => ({
            id: curso.id,
            title: curso.fullname || curso.shortname || curso.displayname,
            link: `https://moodle.ufabc.edu.br/course/view.php?id=${curso.id}`
          }));
          
        } catch (apiError) {
          const response = await fetchWithCookies('https://moodle.ufabc.edu.br/my/courses.php', {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
            },
            redirect: 'manual'
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

        const resultados = await Promise.all(
          courses.map(async (curso) => {
            const payload = await processarCurso(curso.link, fetchWithCookies);
            return { 
              curso: curso.title, 
              pdfs: payload 
            };
          }),
        );

        return { data: resultados };

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
