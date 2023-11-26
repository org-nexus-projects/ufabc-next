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

export type PageableReturn<T> = {
  data: T[];
  page: number;
  total: number;
};

export type CourseName = {
  curso_id: number;
  name: string;
};

export type StatsOverview = PageableReturn<{
  _id: number;
  vagas: number;
  requisicoes: number;
  deficit: number;
}>;

export type StatsUsage = {
  teachers: number;
  totalAlunos: number;
  subjects: number;
  users: number;
  currentAlunos: number;
  comments: number;
  enrollments: number;
};
