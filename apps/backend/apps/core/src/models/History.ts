import { type InferSchemaType, type Model, Schema, model } from 'mongoose';
import { mongooseLeanVirtuals } from 'mongoose-lean-virtuals';
import { updateUserEnrollments } from '@/queue/jobs/userEnrollmentsUpdate.js';
import { nextJobs } from '@/queue/NextJobs.js';

const CONCEITOS = ['A', 'B', 'C', 'D', 'O', 'F', '-'] as const;
const POSSIBLE_SITUATIONS = [
  'Repr.Freq',
  'Aprovado',
  'Reprovado',
  'Trt. Total',
  'Apr.S.Nota',
  'Aproveitamento',
] as const;

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

export type CoefficientsMap = Record<1 | 2 | 3, Coefficient>;

type HistoryCoefficients = Record<number, CoefficientsMap>;

const historiesDisciplinasSchema = new Schema(
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

export type History = {
  ra: number;
  disciplinas: InferSchemaType<typeof historiesDisciplinasSchema>[];
  coefficients: HistoryCoefficients;
  curso: string | undefined;
  grade: string | undefined;
};

type THistoryModel = Model<History, {}>;

const historySchema = new Schema<History, THistoryModel>(
  {
    ra: { type: Number, required: true },
    disciplinas: [historiesDisciplinasSchema],
    coefficients: Object,
    curso: String,
    grade: String,
  },
  {
    methods: {
      async updateEnrollments() {
        await updateUserEnrollments(this.toObject({ virtuals: true }));
      },
    },
    timestamps: true,
  },
);

historySchema.plugin(mongooseLeanVirtuals);

historySchema.index({ curso: 'asc', grade: 'asc' });

historySchema.pre('findOneAndUpdate', async function () {
  const update = this.getUpdate() as History;
  await nextJobs.dispatch('NextUserEnrollmentsUpdate', update);
});

historySchema.post('save', async function () {
  await nextJobs.dispatch(
    'NextUserEnrollmentsUpdate',
    this.toObject({ virtuals: true }),
  );
});

export const HistoryModel = model<History, THistoryModel>(
  'histories',
  historySchema,
);
