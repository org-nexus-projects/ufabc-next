import { SearchTeacherItem } from '.';
import { Concept } from './concepts';

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
