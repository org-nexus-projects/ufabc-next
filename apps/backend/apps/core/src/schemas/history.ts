import type { FastifyZodOpenApiSchema } from 'fastify-zod-openapi';
import { z } from 'zod';
import 'zod-openapi/extend';

const SIG_RESULTS = ['A', 'B', 'C', 'D', 'E', 'F', 'O', '-', '', '0'] as const;
const SIG_CATEGORIES = ['mandatory', 'limited', 'free'] as const;
const SIG_COMPONENTS_STATUS = [
  'APR', // Aprovado por média
  'APRN', // Aprovado por nota mínima
  'CANC', // Cancelado
  'DISP', // Dispensado
  'MATR', // Matriculado
  'REC', // Em recuperação
  'REP', // Reprovado por média
  'REPF', // Reprovado por falta
  'REPMF', // Reprovado por média e falta
  'REPN', // Reprovado por nota mínimad
  'REPNF', // Reprovado por nota e falta
  'TRANC', // Trancado
  'TRANS', // Transferido
  'INCORP', // Incorporado
  'CUMP', // Cumpriu
  '', // Sem situação
] as const;

export type SigStatus = (typeof SIG_COMPONENTS_STATUS)[number];

const sigComponents = z.object({
  UFCode: z.string(),
  category: z.enum(SIG_CATEGORIES),
  class: z.string(),
  credits: z.number().int(),
  grade: z.enum(SIG_RESULTS),
  name: z.string().toLowerCase(),
  status: z.enum(SIG_COMPONENTS_STATUS),
  year: z.string(),
  period: z.string(),
  teachers: z
    .string()
    .array()
    .min(1)
    .openapi({
      description: 'Professores responsáveis pela componente curricular',
      example: ['João Silva', 'Maria Santos'],
    }),
});

const CAMPUS_ENUM = z.enum(['sa', 'sbc']);

const sigStudent = z.object({
  campus: CAMPUS_ENUM,
  shift: z
    .enum(['n', 'm'])
    .transform((val) => (val === 'n' ? 'noturno' : 'matutino')),
  course: z
    .string()
    .toLowerCase()
    .transform((course) => {
      // write a to title case function
      return course
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    })
    .openapi({
      description: 'Curso do aluno',
      example: 'Bacharelado em Ciência e Tecnologia',
    }),
  ra: z.coerce.number().openapi({
    description: 'RA do aluno na UFABC',
  }),
  startedAt: z.string().openapi({
    description: 'Quadrimestre de início do curso',
  }),
  name: z.string(),
});

const sigCoefficients = z.object({
  ca: z.number(),
  cr: z.number(),
  cp: z.number(),
  caece: z.number(),
  caik: z.number(),
  cpece: z.number(),
  crece: z.number(),
  ik: z.number(),
  ikece: z.number(),
});

const sigGraduations = z.object({
  campus: CAMPUS_ENUM,
  course: z.string().toLowerCase().openapi({
    description: 'Curso do aluno',
    example: 'bacharelado em ciencia e tecnologia',
  }),
  grade: z.string(),
  shift: z.enum(['n', 'm']),
  extensionCredits: z.number().int(),
  totalCredits: z.number().int(),
  freeCredits: z.number().int(),
  mandatoryCredits: z.number().int(),
  limitedCredits: z.number().int(),
});

export const sigHistory = z.object({
  student: sigStudent,
  graduations: sigGraduations,
  coefficients: sigCoefficients,
  components: sigComponents.array(),
});

export type SigHistory = z.infer<typeof sigHistory>;

export const sigHistorySchema = {
  tags: ['Sigaa'],
  body: z.object({
    login: z.string(),
    ra: z.coerce.number(),
  }),
} satisfies FastifyZodOpenApiSchema;
