import { z } from 'zod';

import { pageableReturnSchema } from './utils.js';

export const conceptSchema = z.enum(['A', 'B', 'C', 'D', 'F', 'O', 'I', 'E']);
export type Concept = z.infer<typeof conceptSchema>;

export const oauthSchema = z.object({
  email: z.string(),
  emailFacebook: z.string().optional(),
  emailGoogle: z.string().optional(),
  facebook: z.string().optional(),
  google: z.string().optional(),
  picture: z.string().optional(),
});
export type OAuth = z.infer<typeof oauthSchema>;

export const deviceSchema = z.object({
  _id: z.string(),
  deviceId: z.string(),
  phone: z.string(),
  token: z.string(),
});
export type Device = z.infer<typeof deviceSchema>;

export const userSchema = z.object({
  _id: z.string(),
  confirmed: z.boolean(),
  createdAt: z.string(),
  devices: z.array(deviceSchema),
  email: z.string().optional(),
  iat: z.number(),
  isSynced: z.boolean(),
  oauth: oauthSchema,
  permissions: z.array(z.string()),
  ra: z.number(),
});
export type User = z.infer<typeof userSchema>;

export const userConfirmResponseSchema = z.object({
  token: z.string(),
});
export type UserConfirmResponse = z.infer<typeof userConfirmResponseSchema>;

export const emailResponseSchema = z.object({
  email: z.string(),
});
export type EmailResponse = z.infer<typeof emailResponseSchema>;

export const facebookAuthSchema = z.object({
  email: z.string(),
  ra: z.string(),
});
export type FacebookAuth = z.infer<typeof facebookAuthSchema>;

export const whatsappTokenResponseSchema = z.object({
  token: z.string(),
});
export type WhatsappTokenResponse = z.infer<typeof whatsappTokenResponseSchema>;

export const matriculaTokenResponseSchema = whatsappTokenResponseSchema;
export type MatriculaTokenResponse = z.infer<typeof matriculaTokenResponseSchema>;

// Route-level request/response schemas shared between backend and clients
export const updateMatriculaStudentBodySchema = z.object({
  graduationId: z.number(),
  login: z.string(),
  studentId: z.number(),
});
export type UpdateMatriculaStudentBody = z.infer<
  typeof updateMatriculaStudentBodySchema
>;

export const syncSigaaStudentBodySchema = z.object({
  login: z.string(),
  ra: z.number(),
});
export type SyncSigaaStudentBody = z.infer<typeof syncSigaaStudentBodySchema>;

export const whatsappTokenBodySchema = z.object({
  component: z.string().min(1),
  token: z.string().min(1),
});
export type WhatsappTokenBody = z.infer<typeof whatsappTokenBodySchema>;

export const matriculaTokenBodySchema = z.object({
  login: z.string().min(1),
});
export type MatriculaTokenBody = z.infer<typeof matriculaTokenBodySchema>;

export const messageResponseSchema = z.object({
  message: z.string(),
});
export type MessageResponse = z.infer<typeof messageResponseSchema>;

export const statusResponseSchema = z.object({
  status: z.string(),
});
export type StatusResponse = z.infer<typeof statusResponseSchema>;

export const enrollmentTeacherCommentSchema = z.object({
  __v: z.number(),
  _id: z.string(),
  active: z.boolean(),
  comment: z.string(),
  createdAt: z.string(),
  enrollment: z.string(),
  ra: z.string(),
  reactionsCount: z
    .object({
      like: z.number().optional(),
      recommendation: z.number().optional(),
    })
    .optional(),
  subject: z.string(),
  teacher: z.string(),
  type: z.string(),
  updatedAt: z.string(),
  viewers: z.number(),
});
export type EnrollmentTeacherComment = z.infer<
  typeof enrollmentTeacherCommentSchema
>;

export const enrollmentTeacherSchema = z.object({
  __v: z.number(),
  _id: z.string(),
  alias: z.array(z.string()).optional(),
  comment: enrollmentTeacherCommentSchema.optional(),
  createdAt: z.string(),
  name: z.string(),
  updatedAt: z.string(),
});
export type EnrollmentTeacher = z.infer<typeof enrollmentTeacherSchema>;

export const subjectSchema = z.object({
  __v: z.number(),
  _id: z.string(),
  createdAt: z.string(),
  creditos: z.number().optional(),
  name: z.string(),
  search: z.string(),
  updatedAt: z.string(),
});
export type Subject = z.infer<typeof subjectSchema>;

export const enrollmentSchema = z.object({
  _id: z.string(),
  comments: z.array(z.string()).optional(),
  conceito: conceptSchema,
  creditos: z.number(),
  disciplina: z.string(),
  pratica: enrollmentTeacherSchema.nullable().optional(),
  quad: z.number(),
  subject: subjectSchema,
  teoria: enrollmentTeacherSchema.nullable().optional(),
  updatedAt: z.string(),
  year: z.number(),
});
export type Enrollment = z.infer<typeof enrollmentSchema>;

export const commentSchema = z.object({
  _id: z.string(),
  comment: z.string(),
  createdAt: z.string(),
  enrollment: z.object({
    _id: z.string(),
    conceito: conceptSchema,
    creditos: z.number(),
    quad: z.number(),
    season: z.string().optional(),
    year: z.number(),
  }),
  myReactions: z.object({
    like: z.boolean(),
    recommendation: z.boolean(),
    star: z.boolean(),
  }),
  reactionsCount: z
    .object({
      like: z.number().optional(),
      recommendation: z.number().optional(),
    })
    .optional(),
  subject: subjectSchema,
  teacher: z.string(),
  updatedAt: z.string(),
});
export type Comment = z.infer<typeof commentSchema>;

export const getCommentResponseSchema = z.object({
  data: z.array(commentSchema),
  total: z.number(),
});
export type GetCommentResponse = z.infer<typeof getCommentResponseSchema>;

export const createCommentRequestSchema = z.object({
  comment: z.string(),
  enrollment: z.string(),
  type: z.string(),
});
export type CreateCommentRequest = z.infer<typeof createCommentRequestSchema>;

export const updateCommentRequestSchema = z.object({
  comment: z.string(),
  id: z.string(),
});
export type UpdateCommentRequest = z.infer<typeof updateCommentRequestSchema>;

export const reactionKindSchema = z.enum(['like', 'recommendation', 'star']);
export type ReactionKind = z.infer<typeof reactionKindSchema>;

export const searchTeacherItemSchema = z.object({
  __v: z.number(),
  _id: z.string(),
  alias: z.array(z.string()).optional(),
  createdAt: z.string(),
  name: z.string(),
  updatedAt: z.string(),
});
export type SearchTeacherItem = z.infer<typeof searchTeacherItemSchema>;

export const searchSubjectItemSchema = z.object({
  __v: z.number(),
  _id: z.string(),
  createdAt: z.string(),
  creditos: z.number(),
  name: z.string(),
  search: z.string(),
  updatedAt: z.string(),
});
export type SearchSubjectItem = z.infer<typeof searchSubjectItemSchema>;

export const searchComponentItemSchema = z.object({
  campus: z.enum(['sa', 'sbc']).optional(),
  codigo: z.string(),
  groupURL: z.string().nullable(),
  pratica: z.string().nullable(),
  season: z.string(),
  subject: z.string(),
  teoria: z.string().nullable(),
  turma: z.string().optional(),
  turno: z.string().optional(),
  uf_cod_turma: z.string(),
});
export type SearchComponentItem = z.infer<typeof searchComponentItemSchema>;

export const searchCourseItemSchema = z.object({
  componentKeys: z.array(z.string()),
  id: z.number(),
  name: z.string(),
  ufComponentCodes: z.array(z.string()),
  ufabcCourseIdentifier: z.number(),
});
export type SearchCourseItem = z.infer<typeof searchCourseItemSchema>;

export const conceptDataSchema = z.object({
  amount: z.number(),
  conceito: conceptSchema,
  count: z.number(),
  cr_medio: z.number(),
  cr_professor: z.number().optional(),
  eadCount: z.number(),
  numeric: z.number(),
  numericWeight: z.number(),
  weight: z.number().optional(),
});
export type ConceptData = z.infer<typeof conceptDataSchema>;

export const teacherReviewSubjectSchema = z.object({
  _id: z.object({
    __v: z.number(),
    _id: z.string(),
    createdAt: z.string(),
    creditos: z.number(),
    name: z.string(),
    search: z.string(),
    updatedAt: z.string(),
  }),
  amount: z.number(),
  count: z.number(),
  cr_medio: z.number(),
  cr_professor: z.number(),
  distribution: z.array(conceptDataSchema),
  eadCount: z.number(),
  numeric: z.number(),
  numericWeight: z.number(),
});
export type TeacherReviewSubject = z.infer<typeof teacherReviewSubjectSchema>;

export const teacherReviewSchema = z.object({
  general: z.object({
    amount: z.number(),
    count: z.number(),
    cr_medio: z.number(),
    cr_professor: z.number(),
    distribution: z.array(conceptDataSchema),
    eadCount: z.number(),
    numeric: z.number(),
    numericWeight: z.number(),
    weight: z.number(),
  }),
  specific: z.array(teacherReviewSubjectSchema),
  teacher: z.object({
    __v: z.number(),
    _id: z.string(),
    alias: z.array(z.string()).optional(),
    createdAt: z.string(),
    name: z.string(),
    updatedAt: z.string(),
  }),
});
export type TeacherReview = z.infer<typeof teacherReviewSchema>;

export const searchTeacherSchema = z.object({
  data: z.array(searchTeacherItemSchema),
  total: z.number(),
});
export type SearchTeacher = z.infer<typeof searchTeacherSchema>;

export const subjectSpecificSchema = z.object({
  _id: z.object({ mainTeacher: z.string().nullable() }),
  amount: z.number(),
  count: z.number(),
  cr_medio: z.number(),
  cr_professor: z.number(),
  distribution: z.array(conceptDataSchema),
  eadCount: z.number(),
  numeric: z.number(),
  numericWeight: z.number(),
  teacher: z
    .object({
      __v: z.number(),
      _id: z.string(),
      alias: z.array(z.string()),
      createdAt: z.string(),
      name: z.string(),
      updatedAt: z.string(),
    })
    .nullable(),
});
export type SubjectSpecific = z.infer<typeof subjectSpecificSchema>;

export const subjectInfoSchema = z.object({
  general: z.object({
    amount: z.number(),
    count: z.number(),
    cr_medio: z.number(),
    cr_professor: z.number(),
    distribution: z.array(conceptDataSchema),
    eadCount: z.number(),
    numeric: z.number(),
    numericWeight: z.number(),
  }),
  specific: z.array(subjectSpecificSchema),
  subject: subjectSchema,
});
export type SubjectInfo = z.infer<typeof subjectInfoSchema>;

export const searchSubjectSchema = z.object({
  data: z.array(searchSubjectItemSchema),
  total: z.number(),
});
export type SearchSubject = z.infer<typeof searchSubjectSchema>;

export const statsClassSchema = z.object({
  _id: z.string(),
  codigo: z.string(),
  deficit: z.number(),
  disciplina: z.string(),
  ratio: z.number(),
  requisicoes: z.number(),
  turma: z.string(),
  turno: z.enum(['diurno', 'noturno']),
  vagas: z.number(),
});
export type StatsClass = z.infer<typeof statsClassSchema>;

export const statsCourseSchema = z.object({
  _id: z.number(),
  deficit: z.number(),
  ratio: z.number(),
  requisicoes: z.number(),
  vagas: z.number(),
});
export type StatsCourse = z.infer<typeof statsCourseSchema>;

export const statsSubjectSchema = z.object({
  _id: z.string(),
  deficit: z.number(),
  disciplina: z.string(),
  ratio: z.number(),
  requisicoes: z.number(),
  vagas: z.number(),
});
export type StatsSubject = z.infer<typeof statsSubjectSchema>;

export const courseNameSchema = z.object({
  curso_id: z.number(),
  name: z.string(),
});
export type CourseName = z.infer<typeof courseNameSchema>;

export const statsUsageSchema = z.object({
  comments: z.number(),
  currentAlunos: z.number(),
  enrollments: z.number(),
  subjects: z.number(),
  teachers: z.number(),
  totalAlunos: z.number(),
  users: z.number(),
});
export type StatsUsage = z.infer<typeof statsUsageSchema>;

export const statsOverviewSchema = pageableReturnSchema(
  z.object({
    _id: z.number(),
    deficit: z.number(),
    requisicoes: z.number(),
    vagas: z.number(),
  })
);
export type StatsOverview = z.infer<typeof statsOverviewSchema>;

export const quadInformationSchema = z.object({
  accumulated_credits: z.number(),
  ca_acumulado: z.number(),
  ca_quad: z.number(),
  cp_acumulado: z.number(),
  cr_acumulado: z.number(),
  cr_quad: z.number(),
  percentage_approved: z.number(),
  period_credits: z.number(),
  quad: z.number(),
  season: z.string(),
  year: z.number(),
});
export type QuadInformation = z.infer<typeof quadInformationSchema>;

export const crDistributionDataSchema = z.object({
  _id: z.string(),
  point: z.string(),
  total: z.number(),
});
export type CrDistributionData = z.infer<typeof crDistributionDataSchema>;

export const disciplineSchema = z.object({
  ano: z.number(),
  categoria: z.string(),
  codigo: z.string(),
  conceito: z.string(),
  creditos: z.number(),
  disciplina: z.string(),
  periodo: z.string(),
  situacao: z.string(),
});
export type Discipline = z.infer<typeof disciplineSchema>;

export const courseInformationSchema = z.object({
  __v: z.number(),
  _id: z.string(),
  coefficients: z.record(z.record(z.string(), quadInformationSchema)),
  createdAt: z.string(),
  curso: z.string(),
  disciplinas: z.array(disciplineSchema),
  grade: z.string(),
  graduation: z.string(),
  id: z.string(),
  ra: z.number(),
  updatedAt: z.string(),
});
export type CourseInformation = z.infer<typeof courseInformationSchema>;

export const historiesGraduationsSchema = z.object({
  docs: z.array(courseInformationSchema),
  limit: z.number(),
  page: z.number(),
  pages: z.number(),
  total: z.number(),
});
export type HistoriesGraduations = z.infer<typeof historiesGraduationsSchema>;

export const matriculaStudentSchema = z.object({
  graduations: z.array(
    z.object({
      affinity: z.number(),
      ca: z.number(),
      courseId: z.number(),
      cp: z.number(),
      cr: z.number(),
      name: z.string(),
      shift: z.enum(['Noturno', 'Matutino']),
    })
  ),
  login: z.string(),
  ra: z.number(),
  studentId: z.number(),
  updatedAt: z.string(),
});
export type MatriculaStudent = z.infer<typeof matriculaStudentSchema>;

export const updatedStudentSchema = z.object({
  graduations: z.array(
    z.object({
      components: z.array(
        z.object({
          ano: z.number(),
          categoria: z.enum([
            'Livre Escolha',
            'Obrigatória',
            'Opção Limitada',
            '-',
          ]),
          codigo: z.string(),
          conceitos: z.enum(['A', 'B', 'C', 'D', 'O', 'F', '-']),
          creditos: z.number(),
          disciplina: z.string(),
          identifier: z.string(),
          periodo: z.enum(['1', '2', '3']),
          situacao: z.string(),
          teachers: z.array(z.string()),
          turma: z.string(),
        })
      ),
    })
  ),
  ra: z.number(),
  studentId: z.number(),
});
export type UpdatedStudent = z.infer<typeof updatedStudentSchema>;

export const sigStudentSchema = z.object({
  curso: z.string(),
  email: z.string(),
  entrada: z.string(),
  matricula: z.string(),
  nivel: z.enum(['graduacao', 'licenciatura']),
  status: z.string(),
});
export type SigStudent = z.infer<typeof sigStudentSchema>;

export const componentSchema = z.object({
  campus: z.enum(['sbc', 'sa']),
  disciplina_id: z.number(),
  identifier: z.string(),
  pratica: z.string().optional(),
  praticaId: z.string().optional(),
  requisicoes: z.number(),
  subject: z.string(),
  subjectId: z.string(),
  teoria: z.string().optional(),
  teoriaId: z.string().optional(),
  turma: z.string(),
  turno: z.enum(['diurno', 'noturno']),
  vagas: z.number(),
});
export type Component = z.infer<typeof componentSchema>;

export const helpFormResultSchema = z.object({
  id: z.string().optional(),
  success: z.boolean(),
  url: z.string().optional(),
});
export type HelpFormResult = z.infer<typeof helpFormResultSchema>;

export const requestErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  name: z.string(),
  status: z.number(),
  type: z.string(),
});
export type RequestError = z.infer<typeof requestErrorSchema>;
