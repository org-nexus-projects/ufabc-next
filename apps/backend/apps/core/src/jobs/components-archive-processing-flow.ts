import { defineJob } from '@next/queues/client';
import { JOB_NAMES } from '@/constants.js';
import { MoodleConnector } from '@/connectors/moodle.js';
import { load } from 'cheerio';
import { ofetch } from 'ofetch';
import z from 'zod';

const connector = new MoodleConnector();

const componentSchema = z.object({
  viewurl: z.string().url(),
  fullname: z.string(),
  id: z.number(),
});

export const componentsArchivesProcessingJob = defineJob(
  JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING,
)
  .input(
    z.object({
      component: componentSchema.array(),
      globalTraceId: z.string().optional(),
      session: z.object({
        sessionId: z.string(),
        sessKey: z.string(),
      }),
    }),
  )
  .iterator('component')
  .concurrency(3)
  .handler(async ({ job, app, manager }) => {
    const { component, session } = job.data;
    const globalTraceId = job.data.globalTraceId;

    const pdfs = await extractPDFsFromComponent(
      component.viewurl,
      session.sessionId,
      component.id,
    );

    if (pdfs.length === 0) {
      app.log.info(
        { globalTraceId, component: component.fullname },
        'No PDFs found in component',
      );
      return {
        success: true,
        message: 'No PDFs found in component',
        data: [],
      };
    }

    await manager.dispatchFlow({
      name: `summary-${component.fullname}`,
      queueName: JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING_SUMMARY,
      data: { name: component.fullname, total: pdfs.length, globalTraceId },
      children: pdfs.map((pdf) => ({
        name: JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING_PDF,
        queueName: JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING_PDF,
        data: {
          component: component.fullname,
          rawUrl: pdf.pdfLink,
          moodleComponentId: component.id,
          globalTraceId,
        },
      })),
    });

    return {
      success: true,
      flowStarted: true,
    };
  });

export const pdfDownloadJob = defineJob(
  JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING_PDF,
)
  .input(
    z.object({
      component: z.string(),
      rawUrl: z.string().url(),
      moodleComponentId: z.number(),
      globalTraceId: z.string().optional(),
    }),
  )
  .concurrency(10)
  .handler(async ({ job, app }) => {
    const { rawUrl, moodleComponentId } = job.data;
    // Represents nothing currently.
    // const filteredFiles = await aiProxyConnector.filterFiles(component, [
    //   { url, name: `${component}.pdf` },
    // ]);

    const url = new URL(rawUrl);
    const buffer = await ofetch(url.href, { responseType: 'arrayBuffer' });

    // Extract filename from URL pathname and decode it
    const filenameFromUrl = extractFilenameFromUrl(url);
    const sanitizedFilename = sanitizeFilename(filenameFromUrl);
    const s3Key = `/archives/${moodleComponentId}/${sanitizedFilename}`;

    await app.aws.s3.upload(
      app.config.AWS_BUCKET ?? '',
      s3Key,
      Buffer.from(buffer),
    );

    return {
      success: true,
      message: 'PDF uploaded',
      data: {
        pdfLink: url.href,
        pdfName: sanitizedFilename,
        s3Key,
      },
    };
  });

export const archivesSummaryJob = defineJob(
  JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING_SUMMARY,
)
  .input(
    z.object({
      name: z.string(),
      total: z.number(),
      globalTraceId: z.string().optional(),
    }),
  )
  .handler(async ({ job, app }) => {
    const { name, total, globalTraceId } = job.data;
    return {
      success: true,
      message: 'Archives summary',
      data: { name, total, globalTraceId },
    };
  });

async function extractPDFsFromComponent(
  viewurl: string,
  sessionId: string,
  componentId: number,
) {
  const url = new URL(viewurl);
  const page = await connector.getComponentContentsPage(
    sessionId,
    url.pathname,
    componentId.toString(),
  );
  const $ = load(page);
  const potentialLinks: { href: string; name: string }[] = [];

  $('div.activityname').each((_index, el) => {
    const href = $(el).find('a').attr('href');
    const name = $(el).find('span.instancename').text();
    if (href && name) {
      potentialLinks.push({ href, name });
    }
  });

  $('a[href*="/mod/resource/"]').each((_index, el) => {
    const link = $(el).attr('href');
    const name = $(el).text().trim();
    if (link && name && !potentialLinks.some((p) => p.href === link)) {
      potentialLinks.push({ href: link, name });
    }
  });

  $('a[href*="/pluginfile.php/"]').each((_index, el) => {
    const link = $(el).attr('href');
    const name = $(el).text().trim() || $(el).attr('title') || 'documento';
    if (link?.toLowerCase()?.endsWith('.pdf')) {
      if (!potentialLinks.some((p) => p.href === link)) {
        potentialLinks.push({ href: link, name });
      }
    }
  });

  const validationPromises = potentialLinks.map(async ({ href, name }) => {
    const { isPdf, finalUrl } = await connector.validatePdfLink(
      href,
      sessionId,
    );

    if (!isPdf) {
      return null;
    }

    if (finalUrl) {
      return { pdfLink: finalUrl, pdfName: name };
    }
    return null;
  });

  const validatedLinks = await Promise.all(validationPromises);
  return validatedLinks.filter((link) => link !== null);
}

function extractFilenameFromUrl(url: URL): string {
  const pathname = url.pathname;
  const segments = pathname.split('/').filter((segment) => segment.length > 0);
  const lastSegment = segments[segments.length - 1] || 'document.pdf';

  try {
    return decodeURIComponent(lastSegment);
  } catch {
    return lastSegment;
  }
}

/**
 * Sanitizes a filename for S3 upload by:
 * - Removing invalid characters
 * - Ensuring it ends with .pdf
 * - Replacing spaces and special chars with underscores
 */
function sanitizeFilename(filename: string): string {
  // Remove invalid S3 characters: < > : " | ? * and control characters
  const invalidChars = /[<>:"|?*\s]/g;

  let sanitized = filename
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      // Check for invalid S3 chars or control characters (0-31)
      if (invalidChars.test(char) || (code >= 0 && code <= 31)) {
        return '_';
      }
      return char;
    })
    .join('')
    .replace(/_{2,}/g, '_')
    .trim();

  // Ensure it ends with .pdf
  if (!sanitized.toLowerCase().endsWith('.pdf')) {
    sanitized = `${sanitized}.pdf`;
  }

  // Limit length (S3 key limit is 1024 chars, but keep reasonable)
  if (sanitized.length > 255) {
    const ext = '.pdf';
    const nameWithoutExt = sanitized.slice(0, 255 - ext.length);
    sanitized = `${nameWithoutExt}${ext}`;
  }

  return sanitized || 'document.pdf';
}
