import { type InferSchemaType, type Model, Schema, model } from 'mongoose';

const CONCEITOS = ['A', 'B', 'C', 'D', 'O', 'F', '-'] as const;
export const POSSIBLE_SITUATIONS = [
  'Repr.Freq',
  'Aprovado',
  'Reprovado',
  'Trt. Total',
  'trt. total',
  'Apr.S.Nota',
  'Aproveitamento',
  'reprovado',
  'reprovado por faltas',
  'reprovado por média e por faltas',
  'aprovado',
  null,
] as const;
// can be '-' if the component was dropped (trancamento)
export const CATEGORIES = [
  'Livre Escolha',
  'Obrigatória',
  'Opção Limitada',
  '-',
] as const;
export type Categories = (typeof CATEGORIES)[number];
export type Concept = (typeof CONCEITOS)[number];
export type Situations = (typeof POSSIBLE_SITUATIONS)[number];

export type Coefficient = {
  ca_quad: number;
  ca_acumulado: number;
  cr_quad: number;
  cr_acumulado: number;
  cp_acumulado: number;
  percentage_approved: number;
  accumulated_credits: number;
  period_credits: number;
};

export type CoefficientsMap = Record<'1' | '2' | '3', Coefficient>;

export type HistoryCoefficients = Record<number, CoefficientsMap>;

const historiesDisciplinasSchema = new Schema(
  {
    periodo: {
      type: String,
      required: true,
      enum: ['1', '2', '3'],
    },
    codigo: { type: String, required: true },
    disciplina: { type: String, required: true },
    ano: { type: Number, required: true },
    situacao: {
      type: String,
      enum: POSSIBLE_SITUATIONS,
      default: null,
    },
    creditos: { type: Number, required: true },
    categoria: { type: String, required: true, enum: CATEGORIES },
    conceito: {
      type: String,
      enum: CONCEITOS,
      default: null,
    },
    turma: {
      type: String,
      required: true,
    },
    teachers: {
      type: [String],
      required: false,
    },
    disciplina_id: {
      type: Number,
      required: false,
    },
    // this is the compositeKey for the component
    identifier: String,
  },
  { _id: false }
);

export type History = {
  ra: number;
  disciplinas: InferSchemaType<typeof historiesDisciplinasSchema>[];
  coefficients: HistoryCoefficients;
  curso: string;
  grade: string | undefined;
};

export type THistoryModel = Model<History, {}>;
export type HistoryDocument = ReturnType<(typeof HistoryModel)['hydrate']>;
const historySchema = new Schema<History, THistoryModel>(
  {
    ra: { type: Number, required: true },
    disciplinas: [historiesDisciplinasSchema],
    coefficients: Object,
    curso: { type: String, required: true },
    grade: String,
  },
  {
    timestamps: true,
  }
);

historySchema.index({ curso: 'asc', grade: 'asc' });

export const HistoryModel = model<History, THistoryModel>(
  'histories',
  historySchema
);
