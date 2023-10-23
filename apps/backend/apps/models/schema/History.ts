import { type InferSchemaType, Schema, model } from 'mongoose';

const historySchema = new Schema(
  {
    ra: Number,
    disciplinas: Object,
    coefficients: Object,
    curso: String,
    grade: String,
    createdAt: NativeDate,
    updatedAt: NativeDate,
  },
  {
    methods: {
      async updateEnrollments() {
        // app.agenda.now('updateUserEnrollments', this.toObject({ virtuals: true }))
      },
    },
  },
);

historySchema.index({ curso: 'asc', grade: 'asc' });

historySchema.pre('findOneAndUpdate', async function () {
  // calls cron job here
  // const {
  //   ra,
  //   disciplinas,
  //   curso,
  //   grade,
  //   mandatory_credits_number,
  //   limited_credits_number,
  //   free_credits_number,
  //   credits_total,
  // } = this.getUpdate();
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
  // config.NODE_ENV === 'prod' &&
  //   app.agenda.now('updateUserEnrollments', this.toObject({ virtuals: true }));
});

export type History = InferSchemaType<typeof historySchema>;
export const HistoryModel = model('histories', historySchema);
