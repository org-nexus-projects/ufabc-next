import { randomUUID } from 'node:crypto';

import { defineJob } from '@next/queues/client';
import z from 'zod';

import { JOB_NAMES } from '@/constants.js';
import { ArchiveExtractionService } from '@/services/archive-extraction-service.js';

export const archiveExtractionJob = defineJob(JOB_NAMES.ARCHIVE_EXTRACTION)
  .input(
    z.object({
      archiveId: z.string(),
      globalTraceId: z.string().optional(),
    })
  )
  .concurrency(2)
  .handler(async ({ job, app }) => {
    const { archiveId, globalTraceId } = job.data;

    const archiveExtractionService = new ArchiveExtractionService({
      config: app.config,
      globalTraceId: globalTraceId ?? randomUUID(),
      storageConnector: app.aws.s3,
    });
    const response = await archiveExtractionService.extractArchive(archiveId);
    return response;
  });
