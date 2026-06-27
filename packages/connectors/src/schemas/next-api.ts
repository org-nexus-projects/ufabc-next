import { z } from 'zod';

export const conceptSchema = z.enum(['A', 'B', 'C', 'D', 'F', 'O', 'I', 'E']);
export type Concept = z.infer<typeof conceptSchema>;

export const oauthSchema = z.object({
  email: z.string(),
  facebook: z.string().optional(),
  picture: z.string().optional(),
  emailFacebook: z.string().optional(),
  google: z.string().optional(),
  emailGoogle: z.string().optional(),
});
export type OAuth = z.infer<typeof oauthSchema>;

export const deviceSchema = z.object({
  _id: z.string(),
  deviceId: z.string(),
  token: z.string(),
  phone: z.string(),
});
export type Device = z.infer<typeof deviceSchema>;

export const userSchema = z.object({
  _id: z.string(),
  oauth: oauthSchema,
  confirmed: z.boolean(),
  email: z.string().optional(),
  ra: z.number(),
  createdAt: z.string(),
  devices: z.array(deviceSchema),
  permissions: z.array(z.string()),
  iat: z.number(),
  isSynced: z.boolean(),
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

export const enrollmentTeacherCommentSchema = z.object({
  _id: z.string(),
  comment: z.string(),
  viewers: z.number(),
  enrollment: z.string(),
  type: z.string(),
  ra: z.string(),
  active: z.boolean(),
  teacher: z.string(),
  subject: z.string(),
  updatedAt: z.string(),
  createdAt: z.string(),
  __v: z.number(),
  reactionsCount: z.object({
    like: z.number().optional(),
    recommendation: z.number().optional(),
  }).optional(),
});
export type EnrollmentTeacherComment = z.infer<typeof enrollmentTeacherCommentSchema>;

export const enrollmentTeacherSchema = z.object({
  _id: z.string(),
  name: z.string(),
  updatedAt: z.string(),
  createdAt: z.string(),
  __v: z.number(),
  comment: enrollmentTeacherCommentSchema.optional(),
  alias: z.array(z.string()).optional(),
});
export type EnrollmentTeacher = z.infer<typeof enrollmentTeacherSchema>;

export const subjectSchema = z.object({
  _id: z.string(),
  name: z.string(),
  search: z.string(),
  updatedAt: z.string(),
  createdAt: z.string(),
  __v: z.number(),
  creditos: z.number().optional(),
});
export type Subject = z.infer<typeof subjectSchema>;

export const enrollmentSchema = z.object({
  _id: z.string(),
  pratica: enrollmentTeacherSchema.nullable().optional(),
  teoria: enrollmentTeacherSchema.nullable().optional(),
  updatedAt: z.string(),
  conceito: conceptSchema,
  creditos: z.number(),
  disciplina: z.string(),
  quad: z.number(),
  subject: subjectSchema,
  year: z.number(),
  comments: z.array(z.string()).optional(),
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
    year: z.number(),
    season: z.string().optional(),
  }),
  myReactions: z.object({
    like: z.boolean(),
    recommendation: z.boolean(),
    star: z.boolean(),
  }),
  subject: subjectSchema,
  reactionsCount: z.object({
    like: z.number().optional(),
    recommendation: z.number().optional(),
  }).optional(),
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
  id: z.string(),
  comment: z.string(),
});
export type UpdateCommentRequest = z.infer<typeof updateCommentRequestSchema>;

export const reactionKindSchema = z.enum(['like', 'recommendation', 'star']);
export type ReactionKind = z.infer<typeof reactionKindSchema>;

export const searchTeacherItemSchema = z.object({
  _id: z.string(),
  name: z.string(),
  updatedAt: z.string(),
  createdAt: z.string(),
  __v: z.number(),
  alias: z.array(z.string()).optional(),
});
export type SearchTeacherItem = z.infer<typeof searchTeacherItemSchema>;

export const searchSubjectItemSchema = z.object({
  _id: z.string(),
  name: z.string(),
  search: z.string(),
  updatedAt: z.string(),
  createdAt: z.string(),
  __v: z.number(),
  creditos: z.number(),
});
export type SearchSubjectItem = z.infer<typeof searchSubjectItemSchema>;

export const searchComponentItemSchema = z.object({
  season: z.string(),
  groupURL: z.string().nullable(),
  codigo: z.string(),
  campus: z.enum(['sa', 'sbc']).optional(),
  turma: z.string().optional(),
  turno: z.string().optional(),
  subject: z.string(),
  teoria: z.string().nullable(),
  pratica: z.string().nullable(),
  uf_cod_turma: z.string(),
});
export type SearchComponentItem = z.infer<typeof searchComponentItemSchema>;

export const searchCourseItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  ufComponentCodes: z.array(z.string()),
  ufabcCourseIdentifier: z.number(),
  componentKeys: z.array(z.string()),
});
export type SearchCourseItem = z.infer<typeof searchCourseItemSchema>;

export const conceptDataSchema = z.object({
  conceito: conceptSchema,
  weight: z.number().optional(),
  cr_medio: z.number(),
  cr_professor: z.number().optional(),
  count: z.number(),
  eadCount: z.number(),
  amount: z.number(),
  numeric: z.number(),
  numericWeight: z.number(),
});
export type ConceptData = z.infer<typeof conceptDataSchema>;

export const teacherReviewSubjectSchema = z.object({
  _id: z.object({
    _id: z.string(),
    name: z.string(),
    search: z.string(),
    updatedAt: z.string(),
    createdAt: z.string(),
    __v: z.number(),
    creditos: z.number(),
  }),
  distribution: z.array(conceptDataSchema),
  numericWeight: z.number(),
  numeric: z.number(),
  amount: z.number(),
  count: z.number(),
  eadCount: z.number(),
  cr_professor: z.number(),
  cr_medio: z.number(),
});
export type TeacherReviewSubject = z.infer<typeof teacherReviewSubjectSchema>;

export const teacherReviewSchema = z.object({
  teacher: z.object({
    _id: z.string(),
    name: z.string(),
    updatedAt: z.string(),
    createdAt: z.string(),
    __v: z.number(),
    alias: z.array(z.string()).optional(),
  }),
  general: z.object({
    cr_medio: z.number(),
    cr_professor: z.number(),
    count: z.number(),
    eadCount: z.number(),
    amount: z.number(),
    numeric: z.number(),
    numericWeight: z.number(),
    weight: z.number(),
    distribution: z.array(conceptDataSchema),
  }),
  specific: z.array(teacherReviewSubjectSchema),
});
export type TeacherReview = z.infer<typeof teacherReviewSchema>;

export const searchTeacherSchema = z.object({
  data: z.array(searchTeacherItemSchema),
  total: z.number(),
});
export type SearchTeacher = z.infer<typeof searchTeacherSchema>;

export const subjectSpecificSchema = z.object({
  _id: z.object({ mainTeacher: z.string().nullable() }),
  distribution: z.array(conceptDataSchema),
  numericWeight: z.number(),
  numeric: z.number(),
  amount: z.number(),
  count: z.number(),
  eadCount: z.number(),
  cr_professor: z.number(),
  teacher: z.object({
    alias: z.array(z.string()),
    _id: z.string(),
    name: z.string(),
    updatedAt: z.string(),
    createdAt: z.string(),
    __v: z.number(),
  }).nullable(),
  cr_medio: z.number(),
});
export type SubjectSpecific = z.infer<typeof subjectSpecificSchema>;

export const subjectInfoSchema = z.object({
  subject: subjectSchema,
  general: z.object({
    cr_medio: z.number(),
    cr_professor: z.number(),
    count: z.number(),
    eadCount: z.number(),
    amount: z.number(),
    numeric: z.number(),
    numericWeight: z.number(),
    distribution: z.array(conceptDataSchema),
  }),
  specific: z.array(subjectSpecificSchema),
});
export type SubjectInfo = z.infer<typeof subjectInfoSchema>;

export const searchSubjectSchema = z.object({
  data: z.array(searchSubjectItemSchema),
  total: z.number(),
});
export type SearchSubject = z.infer<typeof searchSubjectSchema>;

export const statsClassSchema = z.object({
  codigo: z.string(),
  deficit: z.number(),
  disciplina: z.string(),
  ratio: z.number(),
  requisicoes: z.number(),
  turma: z.string(),
  turno: z.enum(['diurno', 'noturno']),
  vagas: z.number(),
  _id: z.string(),
});
export type StatsClass = z.infer<typeof statsClassSchema>;

export const statsCourseSchema = z.object({
  deficit: z.number(),
  ratio: z.number(),
  requisicoes: z.number(),
  vagas: z.number(),
  _id: z.number(),
});
export type StatsCourse = z.infer<typeof statsCourseSchema>;

export const statsSubjectSchema = z.object({
  deficit: z.number(),
  disciplina: z.string(),
  ratio: z.number(),
  requisicoes: z.number(),
  vagas: z.number(),
  _id: z.string(),
});
export type StatsSubject = z.infer<typeof statsSubjectSchema>;

export const courseNameSchema = z.object({
  curso_id: z.number(),
  name: z.string(),
});
export type CourseName = z.infer<typeof courseNameSchema>;

export const statsUsageSchema = z.object({
  teachers: z.number(),
  totalAlunos: z.number(),
  subjects: z.number(),
  users: z.number(),
  currentAlunos: z.number(),
  comments: z.number(),
  enrollments: z.number(),
});
export type StatsUsage = z.infer<typeof statsUsageSchema>;

export const pageableReturnSchema = <T extends z.ZodTypeAny>(itemSchema: T) => z.object({
  data: z.array(itemSchema),
  page: z.number(),
  total: z.number(),
});

export const statsOverviewSchema = pageableReturnSchema(z.object({
  _id: z.number(),
  vagas: z.number(),
  requisicoes: z.number(),
  deficit: z.number(),
}));
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
  point: z.string(),
  total: z.number(),
  _id: z.string(),
});
export type CrDistributionData = z.infer<typeof crDistributionDataSchema>;

export const disciplineSchema = z.object({
  codigo: z.string(),
  categoria: z.string(),
  conceito: z.string(),
  creditos: z.number(),
  periodo: z.string(),
  ano: z.number(),
  situacao: z.string(),
  disciplina: z.string(),
});
export type Discipline = z.infer<typeof disciplineSchema>;

export const courseInformationSchema = z.object({
  _id: z.string(),
  curso: z.string(),
  grade: z.string(),
  ra: z.number(),
  __v: z.number(),
  coefficients: z.record(z.record(z.string(), quadInformationSchema)),
  createdAt: z.string(),
  disciplinas: z.array(disciplineSchema),
  graduation: z.string(),
  updatedAt: z.string(),
  id: z.string(),
});
export type CourseInformation = z.infer<typeof courseInformationSchema>;

export const historiesGraduationsSchema = z.object({
  docs: z.array(courseInformationSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  pages: z.number(),
});
export type HistoriesGraduations = z.infer<typeof historiesGraduationsSchema>;

export const matriculaStudentSchema = z.object({
  studentId: z.number(),
  ra: z.number(),
  login: z.string(),
  graduations: z.array(z.object({
    courseId: z.number(),
    name: z.string(),
    shift: z.enum(['Noturno', 'Matutino']),
    affinity: z.number(),
    cp: z.number(),
    cr: z.number(),
    ca: z.number(),
  })),
  updatedAt: z.string(),
});
export type MatriculaStudent = z.infer<typeof matriculaStudentSchema>;

export const updatedStudentSchema = z.object({
  studentId: z.number(),
  ra: z.number(),
  graduations: z.array(z.object({
    components: z.array(z.object({
      periodo: z.enum(['1', '2', '3']),
      codigo: z.string(),
      disciplina: z.string(),
      ano: z.number(),
      situacao: z.string(),
      creditos: z.number(),
      categoria: z.enum(['Livre Escolha', 'Obrigatória', 'Opção Limitada', '-']),
      conceitos: z.enum(['A', 'B', 'C', 'D', 'O', 'F', '-']),
      turma: z.string(),
      teachers: z.array(z.string()),
      identifier: z.string(),
    })),
  })),
});
export type UpdatedStudent = z.infer<typeof updatedStudentSchema>;

export const sigStudentSchema = z.object({
  matricula: z.string(),
  email: z.string(),
  entrada: z.string(),
  nivel: z.enum(['graduacao', 'licenciatura']),
  status: z.string(),
  curso: z.string(),
});
export type SigStudent = z.infer<typeof sigStudentSchema>;

export const componentSchema = z.object({
  identifier: z.string(),
  disciplina_id: z.number(),
  subject: z.string(),
  subjectId: z.string(),
  turma: z.string(),
  turno: z.enum(['diurno', 'noturno']),
  vagas: z.number(),
  requisicoes: z.number(),
  campus: z.enum(['sbc', 'sa']),
  teoria: z.string().optional(),
  teoriaId: z.string().optional(),
  pratica: z.string().optional(),
  praticaId: z.string().optional(),
});
export type Component = z.infer<typeof componentSchema>;

export const helpFormResultSchema = z.object({
  success: z.boolean(),
  id: z.string().optional(),
  url: z.string().optional(),
});
export type HelpFormResult = z.infer<typeof helpFormResultSchema>;

export const requestErrorSchema = z.object({
  status: z.number(),
  name: z.string(),
  type: z.string(),
  error: z.string(),
  message: z.string(),
});
export type RequestError = z.infer<typeof requestErrorSchema>;
