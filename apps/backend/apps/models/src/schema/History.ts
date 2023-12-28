import { addUserEnrollmentsToQueue } from '@next/queue';
import {
  type InferSchemaType,
  Schema,
  type UpdateQuery,
  model,
} from 'mongoose';
import { EnrollmentModel } from './Enrollment.js';
import { GraduationModel } from './Graduation.js';
import { GraduationHistoryModel } from './GraduationHistory.js';
import { SubjectModel } from './Subject.js';

let userEnrollmentsJob: any;

const historySchema = new Schema(
  {
    ra: Number,
    disciplinas: Object,
    coefficients: Object,
    curso: String,
    grade: String,
  },
  {
    methods: {
      async updateEnrollments() {
        userEnrollmentsJob = {
          doc: this.toObject<History>({ virtuals: true }),
          enrollmentModel: EnrollmentModel,
          graduationModel: GraduationModel,
          graduationHistoryModel: GraduationHistoryModel,
          subjectModel: SubjectModel,
        };
        await addUserEnrollmentsToQueue(userEnrollmentsJob);
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
  const update: UpdateQuery<History> | null = this.getUpdate();
  if (!update) {
    // if theres nothing to update, do nothing
    return;
  }
  const updateJob = {
    ra: update.ra,
    disciplinas: update.disciplinas,
    curso: update.curso,
    grade: update.grade,
    mandatory_credits_number: update.mandatory_credits_number,
    limited_credits_number: update.limited_credits_number,
    free_credits_number: update.free_credits_number,
    credits_total: update.credits_total,
  };
  userEnrollmentsJob.doc = updateJob;

  await addUserEnrollmentsToQueue(userEnrollmentsJob);
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
  userEnrollmentsJob.doc = this.toObject({ virtuals: true });
  await addUserEnrollmentsToQueue(userEnrollmentsJob);
});

export type History = InferSchemaType<typeof historySchema>;
export const HistoryModel = model('histories', historySchema);
