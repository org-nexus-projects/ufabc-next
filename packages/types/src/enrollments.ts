import { Concept } from './concepts';

type EnrollmentTeacherComment = {
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
  reactionsCount?: { like?: number; recommendation?: number };
};

type EnrollmentTeacher = {
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
