import type { Query } from 'mongoose';

export type Courses = {
  id_curso: number;
  nome_curso: string;
  cp: number;
  cr: number;
  ind_afinidade: number;
  turno: string;
};

export type Student = {
  ra: number;
  login: string;
  aluno_id: number;
  cursos: Courses;
  year: number;
  quad: number;
  quads: number;
};

// Since the query can return nothing it's need to be undefined or null too
export type StudentQuery = Query<Student, Student> | null | undefined;
