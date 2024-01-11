import { type InferSchemaType, type Model, Schema, model } from 'mongoose';
import { updateUserEnrollments } from '@/queue/jobs/userEnrollmentsUpdate.js';

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

historySchema.index({ curso: 'asc', grade: 'asc' });

historySchema.pre('findOneAndUpdate', async function () {
  //why does the legacy code pass things that aren't in the schema?
  //also, the updateUserEnrollments cron job in the legacy code doesn't use the mandatory_credits_number, limited_credits_number, free_credits_number, credits_total properties
  // it does check for everything that are in the schema, only as a nested property
  // and the cron job does check for those values to calculate the coefficients
  const update = this.getUpdate() as History;
  await updateUserEnrollments(update);
});

historySchema.post('save', async function () {
  // userEnrollmentsJob.doc = this.toObject({ virtuals: true });
  // await addUserEnrollmentsToQueue(userEnrollmentsJob);
  await updateUserEnrollments(this.toObject({ virtuals: true }));
});

export const HistoryModel = model<History, THistoryModel>(
  'histories',
  historySchema,
);
