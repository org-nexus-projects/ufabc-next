import { z } from 'zod';

const ComponentSchema = z.object({
  UFCode: z.string().describe('Component code'),
  name: z.string().describe('Component name'),
  grade: z
    .enum(['A', 'B', 'C', 'D', 'O', 'F', 'E', '-', '--', ''])
    .nullable()
    .describe('Subject grade'),
  status: z.string().describe('Course status'),
  year: z.string().describe('Year taken'),
  period: z.enum(['1', '2', '3']).describe('Academic period'),
  credits: z.number().describe('Number of credits'),
  category: z
    .enum(['free', 'mandatory', 'limited'])
    .describe('Subject category'),
  class: z.string().optional().describe('Class code'),
  teachers: z.array(z.string()).optional().describe('List of teacher names'),
});

const StudentSchema = z.object({
  ra: z.string().describe('Student registration RA'),
  name: z.string().describe('Student full name'),
  course: z.string().describe('Course name'),
  campus: z
    .enum(['sa', 'sbc'])
    .optional()
    .describe('Santo André or São Bernardo'),
  shift: z.enum(['m', 'n', 'd']).describe('Morning, Night, or Day'),
  startedAt: z.string().describe('Start year/quarter (e.g., 2022.3)'),
});

const GraduationsSchema = z.object({
  course: z.string(),
  campus: z.enum(['sa', 'sbc']).optional(),
  shift: z.string(),
  grade: z.string().optional().describe('Graduation year'),
  freeCredits: z.number().describe('Total free credits required'),
  mandatoryCredits: z.number().describe('Total mandatory credits required'),
  limitedCredits: z.number().describe('Total limited credits required'),
  extensionCredits: z.number().describe('Total extension credits required'),
  totalCredits: z.number().describe('Total required credits'),
  completedFreeCredits: z.number().describe('Completed free credits'),
  completedMandatoryCredits: z.number().describe('Completed mandatory credits'),
  completedLimitedCredits: z.number().describe('Completed limited credits'),
  completedExtensionCredits: z.number().describe('Completed extension credits'),
  completedTotalCredits: z.number().describe('Total completed credits'),
});

const CoefficientsSchema = z.object({
  cr: z.number().describe('Coeficiente de Rendimento'),
  ca: z.number().describe('Coeficiente de Aproveitamento'),
  cp: z.number().describe('Coeficiente de Progressão'),
  ik: z.number().describe('Coeficiente de Afinidade'),
  crece: z.number().describe('CR ECE/QS'),
  caece: z.number().describe('CA ECE/QS'),
  cpece: z.number().describe('CP ECE/QS'),
  ikece: z.number().describe('IK ECE/QS'),
  caik: z.number().describe('Coeficiente de Aproveitamento de Integralização'),
});

const ErrorSchema = z.object({
  title: z.string(),
  code: z.string().describe('Error code (e.g., UFP0000, UFP0001, etc.)'),
  httpStatus: z.number(),
  description: z.string(),
  additionalData: z
    .record(z.unknown())
    .optional()
    .describe('Additional context'),
});

export const StudentSyncedEventSchema = z.object({
  event: z.literal('student.synced'),
  timestamp: z.string().datetime(),
  deliveryId: z.string().uuid(),
  data: z.object({
    ra: z.string().describe('Student ID'),
    timestamp: z.string().describe('When processing completed'),
    student: StudentSchema,
    components: z.array(ComponentSchema),
    graduations: GraduationsSchema,
    coefficients: CoefficientsSchema,
  }),
});

export const StudentFailedEventSchema = z.object({
  event: z.literal('student.failed'),
  timestamp: z.string().datetime(),
  deliveryId: z.string().uuid(),
  data: z.object({
    ra: z.string().describe('Student ID'),
    timestamp: z.string().describe('When processing failed'),
    error: ErrorSchema,
    partialData: z
      .object({
        student: StudentSchema,
        components: z.array(ComponentSchema).optional(),
        graduations: GraduationsSchema.optional(),
        coefficients: CoefficientsSchema.optional(),
      })
      .optional()
      .describe('Available if processing failed partially'),
  }),
});

export const ComponentSateSchema = z.object({
  event: z.union([
    z.literal('component.created'),
    z.literal('component.updated'),
  ]),
  timestamp: z.string().datetime(),
  deliveryId: z.string().uuid(),
  data: z.object({
    componentKey: z.string().uuid(),
  }),
});

export const UfabcParserWebhookSchema = z.union([
  StudentSyncedEventSchema,
  StudentFailedEventSchema,
  ComponentSateSchema,
]);

export type StudentSyncedEvent = z.infer<typeof StudentSyncedEventSchema>;
export type StudentFailedEvent = z.infer<typeof StudentFailedEventSchema>;
export type ComponentStateEvent = z.infer<typeof ComponentSateSchema>;
export type UfabcParserWebhook = z.infer<typeof UfabcParserWebhookSchema>;

export type ComponentData = z.infer<typeof ComponentSchema>;
export type StudentData = z.infer<typeof StudentSchema>;
export type GraduationsData = z.infer<typeof GraduationsSchema>;
export type CoefficientsData = z.infer<typeof CoefficientsSchema>;
export type ErrorData = z.infer<typeof ErrorSchema>;
