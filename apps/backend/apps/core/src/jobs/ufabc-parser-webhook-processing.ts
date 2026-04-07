import { defineJob } from '@next/queues/client';
import { z } from 'zod';

import { JOB_NAMES, PARSER_WEBHOOK_SUPPORTED_EVENTS } from '@/constants.js';

import {
  StudentFailedEventSchema,
  StudentSyncedEventSchema,
} from '../schemas/v2/webhook/ufabc-parser.js';

const studentSyncedDataSchema = StudentSyncedEventSchema.shape.data;
const studentFailedDataSchema = StudentFailedEventSchema.shape.data;

const webhookJobSchema = z.object({
  deliveryId: z.string().uuid().describe('Unique webhook delivery ID'),
  event: z.enum(PARSER_WEBHOOK_SUPPORTED_EVENTS).describe('Event type'),
  timestamp: z.string().describe('Event timestamp'),
  data: z.union([studentSyncedDataSchema, studentFailedDataSchema]),
});

export const ufabcParserWebhookProcessingJob = defineJob(
  JOB_NAMES.UFABC_PARSER_WEBHOOK_PROCESSING
)
  .input(webhookJobSchema)
  .handler(async ({ job, app }) => {
    const { deliveryId, event, timestamp, data } = job.data;

    app.log.info(
      {
        deliveryId,
        event,
      },
      'Routing UFABC Parser webhook'
    );

    if (event === 'student.synced' || event === 'student.failed') {
      await app.manager.dispatch(JOB_NAMES.STUDENT_SYNC_PROCESSING, {
        deliveryId,
        event,
        timestamp,
        data,
      });
      return {
        success: true,
        event,
        deliveryId,
      };
    }

    if (event === 'component.created' || event === 'component.updated') {
      await app.manager.dispatch(JOB_NAMES.COMPONENTS_PROCESSING, {
        deliveryId,
        event,
        timestamp,
        data,
      });
      return {
        success: true,
        event,
        deliveryId,
      };
    }

    throw new Error(`Unsupported event: ${event}`);
  });
