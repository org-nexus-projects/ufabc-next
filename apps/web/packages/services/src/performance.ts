import { api } from './api';

type QuadInformation = {
  accumulated_credits: number;
  ca_acumulado: number;
  ca_quad: number;
  cp_acumulado: number;
  cr_acumulado: number;
  cr_quad: number;
  percentage_approved: number;
  period_credits: number;
  quad: number;
  season: string;
  year: number;
};

type CrDistributionData = {
  point: string;
  total: number;
  _id: string;
};

type Disciplina = {
  codigo: string;
  categoria: string;
  conceito: string;
  creditos: number;
  periodo: string;
  ano: number;
  situacao: string;
  disciplina: string;
};

type Quads = 1 | 2 | 3;

type CoefficientsByYear = {
  [year: string]: Record<Quads, QuadInformation>;
};

export type CourseInformation = {
  _id: string;
  curso: string;
  grade: string;
  ra: number;
  __v: number;
  coefficients: CoefficientsByYear;
  createdAt: string;
  disciplinas: Disciplina[];
  graduation: string;
  updatedAt: string;
  id: string;
};

type HistoriesGraduations = {
  docs: CourseInformation[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export const Performance = {
  getCrHistory: () => api.get<QuadInformation[]>('courseStats/history'),
  getCrDistribution: () => api.get<CrDistributionData[]>('courseStats/grades'),
  getHistoriesGraduations: () =>
    api.get<HistoriesGraduations>('/courseStats/user/grades'),
};
