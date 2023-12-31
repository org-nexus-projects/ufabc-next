import { type InferSchemaType, Schema, model } from 'mongoose';
// let userEnrollmentsJob: any;

const CONCEITOS = ['A', 'B', 'C', 'D', 'O', 'F', '-'] as const;
const POSSIBLE_SITUATIONS = [
  'Repr.Freq',
  'Aprovado',
  'Reprovado',
  'Trt. Total',
  'Apr.S.Nota',
  'Aproveitamento',
] as const;

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

type Coefficients = {
  ca_quad: number;
  ca_acumulado: number;
  cr_quad: number;
  cr_acumulado: number;
  cp_acumulado: number;
  percentage_approved: number;
  accumulated_credits: number;
  period_credits: number;
};

export type CoefficientsMap = Record<1 | 2 | 3, Coefficients>;

type HistoryCoefficients = Record<number, CoefficientsMap>;

const historySchema = new Schema(
  {
    ra: Number,
    disciplinas: [historiesDisciplinasSchema],
    coefficients: Object as unknown as HistoryCoefficients,
    curso: String,
    grade: String,
  },
  {
    methods: {
      async updateEnrollments() {
        // userEnrollmentsJob = {
        //   doc: this.toObject<History>({ virtuals: true }),
        //   enrollmentModel: EnrollmentModel,
        //   graduationModel: GraduationModel,
        //   graduationHistoryModel: GraduationHistoryModel,
        //   subjectModel: SubjectModel,
        // };
        // await addUserEnrollmentsToQueue(userEnrollmentsJob);
      },
    },
    timestamps: true,
  },
);

historySchema.index({ curso: 'asc', grade: 'asc' });

historySchema.pre('findOneAndUpdate', async function () {
  //why does the legacy code pass things that aren't in the schema?
  //also, the updateUserEnrollments cron job in the legacy code doesn't use the mandatory_credits_number, limited_credits_number, free_credits_number, credits_total properties
  // calls cron job here
  // const update: UpdateQuery<History> | null = this.getUpdate();
  // if (!update) {
  //   // if theres nothing to update, do nothing
  //   return;
  // }
  // const updateJob = {
  //   ra: update.ra,
  //   disciplinas: update.disciplinas,
  //   curso: update.curso,
  //   grade: update.grade,
  //   mandatory_credits_number: update.mandatory_credits_number,
  //   limited_credits_number: update.limited_credits_number,
  //   free_credits_number: update.free_credits_number,
  //   credits_total: update.credits_total,
  // };
  // userEnrollmentsJob.doc = updateJob;
  // await addUserEnrollmentsToQueue(userEnrollmentsJob);
  // app.agenda.now('updateUserEnrollments', [
  //   ra,
  //   disciplinas,
  //   curso,
  //   grade,
  //   mandatory_credits_number,
  //   limited_credits_number,
  //   free_credits_number,
  //   credits_total,
  // ]);
});

historySchema.post('save', async function () {
  // userEnrollmentsJob.doc = this.toObject({ virtuals: true });
  // await addUserEnrollmentsToQueue(userEnrollmentsJob);
});

export type History = InferSchemaType<typeof historySchema>;
export const HistoryModel = model('histories', historySchema);
