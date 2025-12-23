import { defineJob } from '@next/queues/client';
import { JOB_NAMES } from '@/constants.js';
import z from 'zod';
import { MoodleConnector } from '@/connectors/moodle.js';
import { load } from 'cheerio';

const componentSchema = z.object({
  viewurl: z.string().url(),
  fullname: z.string(),
  id: z.number(),
});

export type ComponentArchiveJobData = {
  component: z.infer<typeof componentSchema>;
  globalTraceId?: string;
  session: {
    sessionId: string;
    sessKey: string;
  };
};

const connector = new MoodleConnector();

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
    if (isPdf && finalUrl) {
      return { pdfLink: finalUrl, pdfName: name };
    }
    return null;
  });

  const validatedLinks = await Promise.all(validationPromises);
  return validatedLinks.filter((link) => link !== null);
}

export const componentsArchivesProcessingJob = defineJob<
  typeof JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING,
  ComponentArchiveJobData,
  { success: boolean; message: string; globalTraceId?: string }
>(JOB_NAMES.COMPONENTS_ARCHIVES_PROCESSING)
  .input(
    z.object({
      component: componentSchema,
      globalTraceId: z.string().optional(),
      session: z.object({
        sessionId: z.string(),
        sessKey: z.string(),
      }),
    }),
  )
  .concurrency(3)
  .handler(async ({ job, app }) => {
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

    app.log.info(
      { globalTraceId, total: pdfs.length, component: component.fullname },
      'PDFs found in component',
    );

    return {
      success: true,
      message: 'PDFs found in component',
      data: pdfs,
    };
  });
