import { type InferSchemaType, Schema, model } from 'mongoose';
// let userEnrollmentsJob: any;

const historyDisciplinaSchema = new Schema(
  {
    periodo: String,
    codigo: String,
    disciplina: String,
    ano: Number,
    situacao: String,
    creditos: Number,
    categoria: String,
    conceito: String,
  },
  { _id: false },
);

const historySchema = new Schema(
  {
    ra: Number,
    disciplinas: [historyDisciplinaSchema],
    coefficients: Object,
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
