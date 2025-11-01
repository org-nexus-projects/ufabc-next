import { ofetch } from 'ofetch';
import * as cheerio from 'cheerio';
import {
  PdfItem,
  apiResponseSchema,
  SubjectMoodleLink,
} from '@/schemas/subjectLinks.js';
import fs from 'fs/promises';
import path from 'path';

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

export const normalizeUrl = (raw: string): string => {
  if (!raw) return '';
  const trimmed = raw.trim();
  try {
    const u = new URL(trimmed);
    const protocol = u.protocol.toLowerCase();
    const host = u.host.toLowerCase();
    const pathname = u.pathname.replace(/\/$/, '');

    return `${protocol}//${host}${pathname}`;
  } catch {

    return trimmed.replace(/\/$/, '').toLowerCase();
  }
};

function configFileName(input: string, fallback = 'arquivo.pdf'): string {
  const normalized = (input ?? '').normalize('NFKC').trim();

  let base = path.basename(normalized);

  const qpos = base.indexOf('?');
  if (qpos >= 0) base = base.slice(0, qpos);

  base = base.replace(
    /(^|[^0-9])(\d{1,2})\/(\d{1,2})\/(\d{4})([^0-9]|$)/g,
    (_m, pre, d, m, y, pos) => `${pre}${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}${pos}`
  );

  base = base
    .replace(/[\/\\:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .replace(/\.+$/g, '');

  if (base.length === 0) base = fallback;
  if (base.length > 120) {
    const ext = path.extname(base) || '';
    const stem = path.basename(base, ext).slice(0, 120 - ext.length);
    base = stem + ext;
  }

  if (!/\.(pdf)$/i.test(base)) base += '.pdf';
  return base;
}

export async function savePDF(pdfLink: string, pdfName: string, sessionId: string): Promise<void> {
  const folderPath = path.resolve('test_pdfs'); // pasta onde salvar os PDFs
  await fs.mkdir(folderPath, { recursive: true });

  const res = await fetch(pdfLink, {
    method: 'GET',
    headers: { Cookie: `MoodleSession=${sessionId}` },
    // fetch segue redirects por padrão; se precisar: redirect: 'follow'
  });

  if (!res.ok) {
    throw new Error(`Erro ao baixar PDF: ${res.status} ${res.statusText}`);
  }

  // Buffer do PDF
  const arrayBuffer = await res.arrayBuffer();
  const pdfData = Buffer.from(arrayBuffer);

  const preferred = pdfName && pdfName.trim().length > 0 ? pdfName : path.basename(new URL(pdfLink).pathname);
  const safeName = configFileName(preferred || 'arquivo.pdf');

  const filePath = path.join(folderPath, safeName);

  await fs.writeFile(filePath, pdfData);
}
