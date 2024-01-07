import { type InferSchemaType, Schema, model } from 'mongoose';
import type { CoefficientsMap } from './History.js';

type GraduationHistoryCoefficients = Record<number, CoefficientsMap>;

const CONCEITOS = ['A', 'B', 'C', 'D', 'O', 'F', '-'] as const;
const POSSIBLE_SITUATIONS = [
  'Repr.Freq',
  'Aprovado',
  'Reprovado',
  'Trt. Total',
  'Apr.S.Nota',
  'Aproveitamento',
] as const;

const GraduationHistoryDisciplinasSchema = new Schema(
  {
    periodo: String,
    codigo: String,
    disciplina: String,
    ano: Number,
    situacao: {
      type: String,
      enum: POSSIBLE_SITUATIONS,
    },
    creditos: Number,
    categoria: String,
    conceito: {
      type: String,
      enum: CONCEITOS,
    },
    identifier: String,
  },
  { _id: false },
);
const graduationHistorySchema = new Schema(
  {
    ra: Number,
    coefficients: Object as unknown as GraduationHistoryCoefficients,

    disciplinas: [GraduationHistoryDisciplinasSchema],

    curso: { type: String, required: true },
    grade: String,
    graduation: {
      type: Schema.Types.ObjectId,
      ref: 'graduation',
    },
  },
  { timestamps: true },
);

export type GraduationHistory = InferSchemaType<typeof graduationHistorySchema>;
export const GraduationHistoryModel = model(
  'historiesgraduations',
  graduationHistorySchema,
);
