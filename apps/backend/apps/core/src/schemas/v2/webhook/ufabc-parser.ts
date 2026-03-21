import { z } from 'zod';

export const StudentSyncedEventSchema = z.object({
  event: z.literal('student.synced'),
  timestamp: z.string().datetime(),
  deliveryId: z.string().uuid(),
  data: z.object({
    studentKey: z.string(),
    ra: z.string(),
    login: z.string(),
    historyKey: z.string(),
    season: z.string(),
  }),
});

export const StudentFailedEventSchema = z.object({
  event: z.literal('student.failed'),
  timestamp: z.string().datetime(),
  deliveryId: z.string().uuid(),
  data: z.object({
    studentKey: z.string(),
    ra: z.string(),
    login: z.string(),
    errorCode: z.string(),
    errorMessage: z.string(),
    partialData: z.record(z.unknown()).optional(),
  }),
});

export const UfabcParserWebhookSchema = z.discriminatedUnion('event', [
  StudentSyncedEventSchema,
  StudentFailedEventSchema,
]);

export type StudentSyncedEvent = z.infer<typeof StudentSyncedEventSchema>;
export type StudentFailedEvent = z.infer<typeof StudentFailedEventSchema>;
export type UfabcParserWebhook = z.infer<typeof UfabcParserWebhookSchema>;
