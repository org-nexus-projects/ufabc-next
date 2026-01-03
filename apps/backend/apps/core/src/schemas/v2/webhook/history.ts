import { z } from 'zod';

export const HistoryWebhookPayloadSchema = z.object({
  ra: z.string().describe('Student RA for identification'),
  timestamp: z.string().datetime().describe('Processing timestamp from parser'),
  processing: z
    .object({
      duration: z.number().describe('Processing duration in milliseconds'),
      version: z.string().optional().describe('Parser version'),
      environment: z.string().optional().describe('Parser environment'),
    })
    .optional(),
  student: z.object({
    ra: z.string().describe('Student registration RA'),
    name: z.string().describe('Student full name'),
    course: z.string().optional().describe('Student course name'),
    currentQuad: z.string().optional().describe('Current quad information'),
    breakdown: z.string().optional().describe('Academic breakdown info'),
  }),
  histories: z
    .array(
      z.object({
        name: z.string(),
        status: z.string(),
        code: z.string(),
        credits: z.number(),
        grade: z.string(),
        hours: z.string().nullable(),
        year: z.string(),
        quad: z.string(),
        type: z.string(),
        situation: z.string(),
        className: z.string().nullable(),
      })
    )
    .describe('Array of academic history records'),
  stats: z
    .object({
      totalCredits: z.number().optional(),
      completedSubjects: z.number().optional(),
      gpa: z.number().optional(),
      currentGPA: z.number().optional(),
    })
    .optional(),
});

export type HistoryWebhookPayload = z.infer<typeof HistoryWebhookPayloadSchema>;

export const HistoryErrorWebhookPayloadSchema = z.object({
  ra: z.string().describe('Student RA that failed processing'),
  timestamp: z.string().datetime().describe('Error timestamp'),
  error: z.object({
    code: z.string().describe('Error code from parser'),
    message: z.string().describe('Error message'),
    type: z
      .enum(['STUDENT_NOT_FOUND', 'INVALID_DATA', 'TIMEOUT', 'SYSTEM_ERROR'])
      .describe('Error type'),
    details: z.record(z.any()).optional().describe('Additional error details'),
  }),
  processing: z
    .object({
      duration: z
        .number()
        .optional()
        .describe('Processing duration before error'),
      version: z.string().optional().describe('Parser version'),
      environment: z.string().optional().describe('Parser environment'),
    })
    .optional(),
  partialData: z
    .object({
      student: z
        .object({
          ra: z.string(),
          name: z.string(),
          course: z.string().optional(),
        })
        .optional(),
      histories: z.array(z.object({})).optional(),
    })
    .optional()
    .describe('Any partial data that was processed before error'),
});

export type HistoryErrorWebhookPayload = z.infer<
  typeof HistoryErrorWebhookPayloadSchema
>;

export const HistoryWebhookResponseSchema = z.object({
  status: z.enum(['accepted', 'rejected', 'processing']),
  jobId: z.string().optional().describe('Background job ID for tracking'),
  message: z.string().describe('Response message'),
  timestamp: z.string().datetime().describe('Response timestamp'),
});

export type HistoryWebhookResponse = z.infer<
  typeof HistoryWebhookResponseSchema
>;

export const HistoryWebhookRequestSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('history.success'),
    payload: HistoryWebhookPayloadSchema,
  }),
  z.object({
    type: z.literal('history.error'),
    payload: HistoryErrorWebhookPayloadSchema,
  }),
]);

export type HistoryWebhookRequest = z.infer<typeof HistoryWebhookRequestSchema>;
