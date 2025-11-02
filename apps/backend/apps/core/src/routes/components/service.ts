import { ofetch } from 'ofetch';
import * as cheerio from 'cheerio';
import type { PdfItem, SubjectMoodleLink } from '@/schemas/subjectLinks.js';
import { apiResponseSchema } from '@/schemas/subjectLinks.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { logger } from '@/utils/logger.js';

export async function getCoursesFromAPI(
  sessionId: string,
  sesskey: string,
): Promise<SubjectMoodleLink[]> {
  const urlMoodle = 'https://moodle.ufabc.edu.br';

  const [rawResponse] = await ofetch<unknown[]>(
    `${urlMoodle}/lib/ajax/service.php`,
    {
      method: 'POST',
      params: { sesskey },
      headers: { Cookie: `MoodleSession=${sessionId}` },
      credentials: 'include',
      body: [
        {
          index: 0,
          methodname:
            'core_course_get_enrolled_courses_by_timeline_classification',
          args: { offset: 0, limit: 0, classification: 'all' },
        },
      ],
    },
  );

  const result = apiResponseSchema.safeParse(rawResponse);

  if (!result.success) {
    throw new Error('Resposta da API não corresponde ao schema esperado.');
  }

  const response = result.data;

  if (!response.data) {
    throw new Error(
      `Moodle API error: ${response.error ?? 'Resposta inesperada'}`,
    );
  }

  return response.data.courses.map((course) => ({
    ...course,
    link: `${urlMoodle}/course/view.php?id=${course.id}`,
  }));
}

export async function extractPDFs(
  sessionId: string,
  courseLink: string,
): Promise<PdfItem[]> {
  const html = await ofetch<string>(courseLink, {
    headers: { Cookie: `MoodleSession=${sessionId}` },
    credentials: 'include',
  });

  const $ = cheerio.load(html);
  const pdfs: PdfItem[] = [];

  $('div.activityname').each((_index: number, el: cheerio.Element) => {
    const link = $(el).find('a').attr('href');
    const name = $(el)
      .find('span.instancename')
      .text()
      .replace(/Arquivo/i, '')
      .trim();

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
    (_m, pre, d, m, y, pos) =>
      `${pre}${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}${pos}`,
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

export async function savePDF(
  pdfLink: string,
  pdfName: string,
  sessionId: string,
): Promise<void> {
  const folderPath = path.resolve('test_pdfs'); // pasta onde salvar os PDFs
  await fs.mkdir(folderPath, { recursive: true });

  const res = await fetch(pdfLink, {
    method: 'GET',
    headers: { Cookie: `MoodleSession=${sessionId}` },
  });

  if (!res.ok) {
    throw new Error(`Erro ao baixar PDF: ${res.status} ${res.statusText}`);
  }

  // Buffer do PDF
  const arrayBuffer = await res.arrayBuffer();
  const pdfData = Buffer.from(arrayBuffer);

  const preferred =
    pdfName && pdfName.trim().length > 0
      ? pdfName
      : path.basename(new URL(pdfLink).pathname);
  const safeName = configFileName(preferred || 'arquivo.pdf');

  const filePath = path.join(folderPath, safeName);

  await fs.writeFile(filePath, pdfData);
}

interface CourseWithPDFs {
  course: string;
  promptData: PdfItem[];
}

interface ProcessedCourseResult {
  course: string;
  processed: number;
  data: unknown[];
}

/**
 * Validates and processes PDFs returned from Lambda against original list
 */
function validateAndProcessPDFs(
  lambdaPdfs: unknown[],
  originalPdfs: PdfItem[],
  courseName: string,
  sessionToken: string,
): Promise<number> {
  const originalLinksMap = new Map<
    string,
    { pdfLink: string; pdfName: string }
  >(
    originalPdfs.map((p) => [
      normalizeUrl(p.pdfLink),
      { pdfLink: p.pdfLink, pdfName: p.pdfName },
    ]),
  );

  return Promise.all(
    lambdaPdfs.map(async (pdf) => {
      if (typeof pdf !== 'object' || pdf === null) {
        logger.error(pdf, 'PDF inválido encontrado');
        return false;
      }

      const rawLink = (pdf as Record<string, unknown>).pdfLink;
      const rawName = (pdf as Record<string, unknown>).pdfName;

      const normalizedReturned = normalizeUrl(
        typeof rawLink === 'string' ? rawLink : String(rawLink),
      );

      const original = originalLinksMap.get(normalizedReturned);
      if (!original) {
        logger.warn(
          { returned: rawLink, course: courseName },
          'Lambda retornou link que não estava na lista enviada (possível alucinação)',
        );
        return false;
      }

      const finalName =
        typeof rawName === 'string' && rawName.trim().length > 0
          ? rawName
          : original.pdfName;

      logger.info(
        { pdfLink: original.pdfLink, pdfName: finalName },
        'PDF a ser baixado (validado contra lista original)',
      );

      await savePDF(original.pdfLink, finalName, sessionToken);
      return true;
    }),
  ).then((results) => results.filter(Boolean).length);
}

/**
 * Calls Lambda and processes the response for a single course
 */
export async function processCourseWithLambda(
  payload: CourseWithPDFs,
  lambdaUrl: string,
  sessionToken: string,
): Promise<ProcessedCourseResult> {
  const resp = await fetch(lambdaUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-service-id': 'core',
    },
    body: JSON.stringify(payload),
  });

  let json: unknown;
  try {
    json = await resp.json();
  } catch (e) {
    logger.error({ e }, 'Falha ao fazer parse do JSON da Lambda');
    json = [];
  }

  const pdfsFiltered = Array.isArray(json) ? json : [];
  logger.info(
    { course: payload.course, count: pdfsFiltered.length },
    'Resposta da Lambda',
  );

  const processedCount = await validateAndProcessPDFs(
    pdfsFiltered,
    payload.promptData,
    payload.course,
    sessionToken,
  );

  return {
    course: payload.course,
    processed: processedCount,
    data: pdfsFiltered,
  };
}
