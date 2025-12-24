import { defineJob } from '@next/queues/client';
import { JOB_NAMES } from '@/constants.js';
import z from 'zod';
import { MoodleConnector } from '@/connectors/moodle.js';
import { load } from 'cheerio';

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
      component: componentSchema,
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
        data: { ...pdf, globalTraceId },
        opts: { removeOnComplete: true },
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
      pdfLink: z.string().url(),
      pdfName: z.string(),
      globalTraceId: z.string().optional(),
    }),
  )
  .concurrency(10)
  .handler(async ({ job, app }) => {
    const { pdfLink, pdfName } = job.data;
    return {
      success: true,
      message: 'PDF downloaded',
      data: {
        pdfLink,
        pdfName,
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
    if (isPdf && finalUrl) {
      return { pdfLink: finalUrl, pdfName: name };
    }
    return null;
  });

  const validatedLinks = await Promise.all(validationPromises);
  return validatedLinks.filter((link) => link !== null);
}
