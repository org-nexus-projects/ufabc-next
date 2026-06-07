export type Concept = 'A' | 'B' | 'C' | 'D' | 'F' | 'O' | 'I' | 'E';

export type ConceptData = {
  conceito: Concept;
  weight?: number;
  cr_medio: number;
  cr_professor?: number;
  count: number;
  eadCount: number;
  amount: number;
  numeric: number;
  numericWeight: number;
};

export type Comment = {
  _id: string;
  comment: string;
  createdAt: string;
  enrollment: {
    _id: string;
    conceito: Concept;
    creditos: number;
    quad: number;
    year: number;
    season?: string;
  };
  myReactions: {
    like: boolean;
    recommendation: boolean;
    star: boolean;
  };
  subject: {
    __v: number;
    _id: string;
    createdAt: string;
    creditos: number;
    name: string;
    search: string;
    updatedAt: string;
  };
  reactionsCount?: {
    like?: number;
    recommendation?: number;
  };
  teacher: string;
  updatedAt: string;
};

export type GetCommentResponse = {
  data: Comment[];
  total: number;
};

export type CreateCommentRequest = {
  comment: string;
  enrollment: string;
  type: string;
};

export type UpdateCommentRequest = {
  id: string;
  comment: string;
};

export type EnrollmentTeacherComment = {
  _id: string;
  comment: string;
  viewers: number;
  enrollment: string;
  type: string;
  ra: string;
  active: boolean;
  teacher: string;
  subject: string;
  updatedAt: string;
  createdAt: string;
  __v: number;
  reactionsCount?: {
    like?: number;
    recommendation?: number;
  };
};

export type EnrollmentTeacher = {
  _id: string;
  name: string;
  updatedAt: string;
  createdAt: string;
  __v: number;
  comment?: EnrollmentTeacherComment;
  alias?: string[];
};

export type Subject = {
  _id: string;
  name: string;
  search: string;
  updatedAt: string;
  createdAt: string;
  __v: number;
  creditos?: number;
};

export type Enrollment = {
  _id: string;
  pratica?: EnrollmentTeacher | null;
  teoria?: EnrollmentTeacher | null;
  updatedAt: string;
  conceito: Concept;
  creditos: number;
  disciplina: string;
  quad: number;
  subject: Subject;
  year: number;
  comments?: string[];
};

export type RequestError = {
  status: number;
  name: string;
  type: string;
  error: string;
  message: string;
};

export type SearchTeacherItem = {
  _id: string;
  name: string;
  updatedAt: string;
  createdAt: string;
  __v: number;
  alias?: string[];
};

export type SearchSubjectItem = {
  _id: string;
  name: string;
  search: string;
  updatedAt: string;
  createdAt: string;
  __v: number;
  creditos: number;
};

export type SearchComponentItem = {
  season: string;
  groupURL: string | null;
  codigo: string;
  campus?: 'sa' | 'sbc';
  turma?: string;
  turno?: string;
  subject: string;
  teoria: string | null;
  pratica: string | null;
  uf_cod_turma: string;
};

export type SearchCourseItem = {
  id: number;
  name: string;
  ufComponentCodes: string[];
  ufabcCourseIdentifier: number;
  componentKeys: string[];
};

export type StatsClass = {
  codigo: string;
  deficit: number;
  disciplina: string;
  ratio: number;
  requisicoes: number;
  turma: string;
  turno: 'diurno' | 'noturno';
  vagas: number;
  _id: string;
};

export type StatsCourse = {
  deficit: number;
  ratio: number;
  requisicoes: number;
  vagas: number;
  _id: number;
};

export type StatsSubject = {
  deficit: number;
  disciplina: string;
  ratio: number;
  requisicoes: number;
  vagas: number;
  _id: string;
};

export type CourseName = {
  curso_id: number;
  name: string;
};

export type StatsUsage = {
  teachers: number;
  totalAlunos: number;
  subjects: number;
  users: number;
  currentAlunos: number;
  comments: number;
  enrollments: number;
};

export type PageableReturn<T> = {
  data: T[];
  page: number;
  total: number;
};

export type StatsOverview = PageableReturn<{
  _id: number;
  vagas: number;
  requisicoes: number;
  deficit: number;
}>;

export type SubjectSpecific = {
  _id: { mainTeacher: string | null };
  distribution: ConceptData[];
  numericWeight: number;
  numeric: number;
  amount: number;
  count: number;
  eadCount: number;
  cr_professor: number;
  teacher: {
    alias: string[];
    _id: string;
    name: string;
    updatedAt: string;
    createdAt: string;
    __v: number;
  } | null;
  cr_medio: number;
};

export type SubjectInfo = {
  subject: {
    _id: string;
    name: string;
    search: string;
    updatedAt: string;
    createdAt: string;
    __v: number;
    creditos: number;
  };
  general: {
    cr_medio: number;
    cr_professor: number;
    count: number;
    eadCount: number;
    amount: number;
    numeric: number;
    numericWeight: number;
    distribution: ConceptData[];
  };
  specific: SubjectSpecific[];
};

export type SearchSubject = {
  data: SearchSubjectItem[];
  total: number;
};

export type TeacherReviewSubject = {
  _id: {
    _id: string;
    name: string;
    search: string;
    updatedAt: string;
    createdAt: string;
    __v: number;
    creditos: number;
  };
  distribution: ConceptData[];
  numericWeight: number;
  numeric: number;
  amount: number;
  count: number;
  eadCount: number;
  cr_professor: number;
  cr_medio: number;
};

export type TeacherReview = {
  teacher: {
    _id: string;
    name: string;
    updatedAt: string;
    createdAt: string;
    __v: number;
    alias?: string[];
  };
  general: {
    cr_medio: number;
    cr_professor: number;
    count: number;
    eadCount: number;
    amount: number;
    numeric: number;
    numericWeight: number;
    weight: number;
    distribution: ConceptData[];
  };
  specific: TeacherReviewSubject[];
};

export type SearchTeacher = {
  data: SearchTeacherItem[];
  total: number;
};

export type Device = {
  _id: string;
  deviceId: string;
  token: string;
  phone: string;
};

export type OAuth = {
  email: string;
  facebook?: string;
  picture?: string;
  emailFacebook?: string;
  google?: string;
  emailGoogle?: string;
};

export type User = {
  _id: string;
  oauth: OAuth;
  confirmed: boolean;
  email?: string;
  ra: number;
  createdAt: string;
  devices: Device[];
  permissions: string[];
  iat: number;
  isSynced: boolean;
};
