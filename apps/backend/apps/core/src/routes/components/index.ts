import { z } from 'zod';
import type { FastifyPluginAsyncZodOpenApi } from 'fastify-zod-openapi';
import fetch from 'node-fetch';
import fetchCookie from 'fetch-cookie';
import tough from 'tough-cookie';
import { JSDOM } from 'jsdom';
import { setTimeout as sleep } from 'timers/promises';

// Validação do body
const pdfSchema = z.array(
  z.object({
    link_pdf: z.string().url(),
    nome_pdf: z.string(),
  }),
);

export const gradeSchema = {
  body: pdfSchema,
};

export type PdfItem = {
  link_pdf: string;
  nome_pdf: string;
};

// Função com timeout integrado
async function fetchWithTimeout(
  url: string,
  fetchFn: typeof fetch,
  options: any = {},
  timeoutMs = 15000
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchFn(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

async function acessarMeusCursos(fetchWithCookies: typeof fetch) {
  const urlMeusCursos = 'https://moodle.ufabc.edu.br/my/courses.php';
  
  try {
    const response = await fetchWithTimeout(
      urlMeusCursos,
      fetchWithCookies,
      {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      },
      20000 // 20 segundos timeout
    );

    if (!response.ok) {
      throw new Error(`Erro ao acessar Meus Cursos: ${response.status}`);
    }

    const html = await response.text();
    await sleep(1000); // Espera adicional de 1s
    return new JSDOM(html);
  } catch (error) {
    console.error('Erro ao acessar Meus Cursos:', error);
    throw error;
  }
}

async function processarCurso(link: string, fetchWithCookies: typeof fetch): Promise<PdfItem[]> {
  try {
    const response = await fetchWithTimeout(
      link,
      fetchWithCookies,
      {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      },
      20000 // 20 segundos timeout
    );

    const html = await response.text();
    await sleep(1000); // Espera adicional de 1s
    
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const pdfs: PdfItem[] = [];

    const activityElements = document.querySelectorAll('div.activityname');
    
    activityElements.forEach((el: Element) => {
      const linkElement = el.querySelector('a');
      const spanElement = el.querySelector('span.instancename');

      const link_pdf = linkElement?.getAttribute('href') || '';
      let nome_pdf = spanElement?.textContent?.trim() || '';

      nome_pdf = nome_pdf.replace(/Arquivo/i, '').trim();

      if (link_pdf && nome_pdf) {
        pdfs.push({ link_pdf, nome_pdf });
      }
    });

    return pdfs;
  } catch (err) {
    console.error(`[Scraper] Erro ao processar curso: ${link}`, err);
    return [];
  }
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
        `MoodleSession=${MoodleSession}; Domain=moodle.ufabc.edu.br; Path=/; Secure`,
        'https://moodle.ufabc.edu.br'
      );

      try {
        // Primeira requisição com timeout
        const response = await fetchWithTimeout(
          'https://moodle.ufabc.edu.br',
          fetchWithCookies,
          {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            },
            redirect: 'follow'
          },
          20000 // 20 segundos timeout
        );

        const html = await response.text();
        
        // Verificação de autenticação
        if (html.includes('Você não está logado') || html.includes('form id="login"')) {
          reply.status(401);
          return { error: 'Sessão MoodleSession inválida ou expirada' };
        }

        await sleep(1500); // Espera adicional de 1.5s
        
        const dom = new JSDOM(html);
        const document = dom.window.document;
        const courses: { link: string; title: string }[] = [];

        const courseElements = document.querySelectorAll('a.coursename');
        courseElements.forEach((element: Element) => {
          const link = element.getAttribute('href');
          const title = element.textContent?.trim() || '';
          if (link) courses.push({ link, title });
        });

        if (courses.length === 0) {
          return { error: 'Nenhum curso encontrado.' };
        }

        // Processamento paralelo com tratamento individual de erros
        const resultados = await Promise.all(
          courses.map(async (curso) => {
            try {
              console.log(`Processando curso: ${curso.title}`);
              const payload = await processarCurso(curso.link, fetchWithCookies);
              return { 
                curso: curso.title, 
                url: curso.link, 
                pdfs: payload 
              };
            } catch (error) {
              console.error(`Erro no curso ${curso.title}:`, error);
              return { 
                curso: curso.title, 
                url: curso.link, 
                pdfs: [], 
                error: 'Erro ao processar' 
              };
            }
          })
        );

        return { data: resultados };

      } catch (error) {
        console.error('Erro completo:', error);
        reply.status(500);
        return {
          error: 'Erro ao fazer scraping',
          details: error instanceof Error ? error.message : String(error),
        };
      }
    }
  );
};

export default plugin;