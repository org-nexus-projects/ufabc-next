import { ofetch } from 'ofetch';
import * as cheerio from 'cheerio';
import {
  PdfItem,
  apiResponseSchema,
  SubjectMoodleLink,
} from '@/schemas/subjectLinks.js';

export async function getCoursesFromAPI(sessionId: string, sesskey: string): Promise<SubjectMoodleLink[]> {
  const urlMoodle = 'https://moodle.ufabc.edu.br';

  const [rawResponse] = await ofetch<unknown[]>(`${urlMoodle}/lib/ajax/service.php`, {
    method: 'POST',
    params: { sesskey },
    headers: { Cookie: `MoodleSession=${sessionId}` },
    credentials: 'include',
    body: [
      {
        index: 0,
        methodname: 'core_course_get_enrolled_courses_by_timeline_classification',
        args: { offset: 0, limit: 0, classification: 'all' },
      },
    ],
  });

  const result = apiResponseSchema.safeParse(rawResponse);

  if (!result.success) {
  throw new Error("Resposta da API não corresponde ao schema esperado.");
  }

  const response = result.data;

  if (!response.data) {
    throw new Error(`Moodle API error: ${response.error ?? 'Resposta inesperada'}`);
  }

  return response.data.courses.map((course) => ({
    ...course,
    link: `${urlMoodle}/course/view.php?id=${course.id}`,
  }));
}

export async function extractPDFs(sessionId: string, courseLink: string): Promise<PdfItem[]> {
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