import { randomUUID } from 'node:crypto';

import { defineJob } from '@next/queues/client';
import z from 'zod';

import { JOB_NAMES } from '@/constants.js';
import { CmccPlansService } from '@/services/cmcc-plans-service.js';

export const cmccPlansScheduleJob = defineJob(JOB_NAMES.CMCC_PLANS_SCHEDULE)
  .input(z.object({}))
  .every('1 day')
  .handler(async ({ app }) => {
    const service = new CmccPlansService({ config: app.config });
    const targets = await service.findPlansToProcess();

    for (const target of targets) {
      await app.manager.dispatch(JOB_NAMES.CMCC_PLAN, target);
    }

    return { dispatched: targets.length };
  });

export const cmccPlanJob = defineJob(JOB_NAMES.CMCC_PLAN)
  .input(
    z.object({
      componentId: z.string(),
      globalTraceId: z.string().optional(),
      url: z.string().url(),
    })
  )
  .concurrency(3)
  .handler(async ({ job, app }) => {
    const { componentId, url, globalTraceId } = job.data;
    const traceId = globalTraceId ?? randomUUID();

    const service = new CmccPlansService({
      config: app.config,
      globalTraceId: traceId,
      storageConnector: app.aws.s3,
    });
    const result = await service.processPlan({ componentId, url });

    if (result.changed) {
      await app.manager.dispatch(JOB_NAMES.ARCHIVE_EXTRACTION, {
        archiveId: result.archiveId.toString(),
        globalTraceId: traceId,
      });
    }

    return result;
  });
