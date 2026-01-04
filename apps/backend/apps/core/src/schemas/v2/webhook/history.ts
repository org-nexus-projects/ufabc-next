import { z } from 'zod';

const ComponentSchema = z.object({
  UFCode: z.string().describe('UFABC subject code'),
  name: z.string().describe('Subject name'),
  grade: z.enum(['A', 'B', 'C', 'D', 'O', 'F', 'E']).nullable().describe('Subject grade'),
  status: z.string().describe('Subject status'),
  year: z.string().describe('Year when the subject was taken'),
  period: z.enum(['1', '2', '3']).describe('Academic period'),
  credits: z.number().describe('Number of credits'),
  category: z.enum(['mandatory', 'free', 'limited']).describe('Subject category'),
  class: z.string().optional().describe('Class name'),
  teachers: z.array(z.string()).optional().describe('Teacher names'),
});

const StudentSchema = z.object({
  ra: z.string().describe('Student registration RA'),
  name: z.string().describe('Student full name'),
  course: z.string().describe('Student course name'),
  campus: z.string().optional().describe('Student campus'),
  shift: z.string().describe('Student shift (morning/evening)'),
  startedAt: z.string().describe('When student started the course'),
});

const GraduationSchema = z.object({
  course: z.string().describe('Graduation course name'),
  campus: z.string().optional().describe('Graduation campus'),
  shift: z.string().describe('Graduation shift'),
  grade: z.string().optional().describe('Graduation grade'),
  freeCredits: z.number().describe('Total free credits required'),
  mandatoryCredits: z.number().describe('Total mandatory credits required'),
  limitedCredits: z.number().describe('Total limited credits required'),
  extensionCredits: z.number().describe('Total extension credits required'),
  completedFreeCredits: z.number().describe('Completed free credits'),
  completedMandatoryCredits: z.number().describe('Completed mandatory credits'),
  completedLimitedCredits: z.number().describe('Completed limited credits'),
  completedExtensionCredits: z.number().describe('Completed extension credits'),
  completedTotalCredits: z.number().describe('Total completed credits'),
  totalCredits: z.number().describe('Total required credits'),
});

const CoefficientsSchema = z.object({
  cr: z.number().describe('Coefficient of Rendimento'),
  ca: z.number().describe('Coefficient of Average'),
  cp: z.number().describe('Coefficient of Performance'),
  ik: z.number().describe('Index of Knowledge'),
  crece: z.number().describe('CRECE coefficient'),
  caece: z.number().describe('CAECE coefficient'),
  cpece: z.number().describe('CPECE coefficient'),
  ikece: z.number().describe('IKECE coefficient'),
  caik: z.number().describe('CAIK coefficient'),
});

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
  components: z.array(ComponentSchema).describe('Array of academic components'),
  student: StudentSchema.describe('Student information'),
  graduations: GraduationSchema.describe('Graduation information'),
  coefficients: CoefficientsSchema.describe('Academic coefficients'),
});

export type HistoryWebhookPayload = z.infer<typeof HistoryWebhookPayloadSchema>;

export const HistoryErrorWebhookPayloadSchema = z.object({
  ra: z.string().describe('Student RA that failed processing'),
  timestamp: z.string().datetime().describe('Error timestamp'),
  error: z.object({
    title: z.string().describe('Error title from UfabcParserError'),
    code: z.string().describe('Error code from UfabcParserError'),
    httpStatus: z.number().describe('HTTP status code from UfabcParserError'),
    description: z.string().describe('Error description from UfabcParserError'),
    additionalData: z.record(z.unknown()).nullable().optional().describe('Additional error data'),
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
      student: StudentSchema.optional(),
      components: z.array(ComponentSchema).optional(),
      graduations: GraduationSchema.optional(),
      coefficients: CoefficientsSchema.optional(),
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
