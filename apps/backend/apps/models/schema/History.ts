import { Schema, model, models } from 'mongoose';

const historySchema = new Schema(
  {
    ra: Number,
    disciplinas: Object,
    coefficients: Object,
    curso: String,
    grade: String,
  },
  { timestamps: true },
);

historySchema.index({ curso: 1, grade: 1 });

historySchema.method('updateEnrollments', async function () {
  // Call cron job here
  // app.agenda.now('updateUserEnrollments', this.toObject({ virtuals: true }))
});

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

export const HistoryModel =
  models['histories'] || model('histories', historySchema);
