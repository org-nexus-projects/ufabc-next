import type { Document, Types } from 'mongoose';

export type Enrollment = {
  year: number;
  quad: number;
  identifier: string;
  ra: string;
  disciplina: string;
  subject: Types.ObjectId;
  campus: string;
  turno: string;
  turma: string;
  teoria: Types.ObjectId;
  pratica: Types.ObjectId;
  mainTeacher: Types.ObjectId;
  comments: 'teoria' | 'pratica';
  conceito: string;
  creditos: number;
  ca_acumulado: number;
  cr_acumulado: number;
  cp_acumulado: number;
  // Ainda preciso saber melhor sobre isso
  season: string;
};

export type EnrollmentDocument = Document<Types.ObjectId, unknown, Enrollment>;
