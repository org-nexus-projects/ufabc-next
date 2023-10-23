import { type Model, Schema, model } from 'mongoose';
import { get } from 'lodash-es';
import { GroupModel } from './Group.js';
import type { Enrollment, EnrollmentDocument } from '@ufabcnext/types';

const enrollmentSchema = new Schema<Enrollment>(
  {
    year: {
      type: Number,
      required: true,
    },
    quad: {
      type: Number,
      required: true,
    },
    identifier: String,
    ra: Number,
    disciplina: String,
    subject: {
      type: Schema.Types.ObjectId,
      ref: 'subjects',
    },
    campus: String,
    turno: String,
    turma: String,
    teoria: {
      type: Schema.Types.ObjectId,
      ref: 'teachers',
    },
    pratica: {
      type: Schema.Types.ObjectId,
      ref: 'teachers',
    },
    mainTeacher: {
      type: Schema.Types.ObjectId,
      ref: 'teachers',
    },
    comments: [
      {
        type: String,
        enum: ['teoria', 'pratica'],
      },
    ],
    // vem do portal
    conceito: String,
    creditos: Number,
    ca_acumulado: Number,
    cr_acumulado: Number,
    cp_acumulado: Number,
  },
  { timestamps: true },
);

function setTheoryAndPractice(enrollment: Enrollment) {
  if ('teoria' in enrollment || 'teoria' in enrollment) {
    // the morning never happened lol.
    // TODO: refactor this in the morning
    enrollment.mainTeacher =
      get(enrollment, 'teoria._id', enrollment.teoria) ||
      get(enrollment, 'pratica._id', enrollment.teoria);
  }
}

async function addEnrollmentToGroup(
  enrollment: EnrollmentDocument & Enrollment,
) {
  /*
   * If is a new enrollment, must create a new
   * group or insert doc.ra in group.users
   */

  if (enrollment.mainTeacher && enrollment.isNew) {
    await GroupModel.updateOne(
      {
        disciplina: enrollment.disciplina,
        season: enrollment.season,
        mainTeacher: enrollment.mainTeacher,
      },
      {
        $push: { users: enrollment.ra },
      },
      {
        // TODO: THIS IS TEMPORARY, MUST BE CHANGED
        // TO TRUE AFTER FINDING OUT WHAT THE SEASON FIELD IS
        strict: false,
        upsert: false,
      },
    );
  }
}

enrollmentSchema.index({ identifier: 1, ra: 1 });
enrollmentSchema.index({ ra: 1 });
enrollmentSchema.index({ conceito: 1 });
enrollmentSchema.index({
  mainTeacher: 1,
  subject: 1,
  cr_acumulado: 1,
  conceito: 1,
});

enrollmentSchema.pre('save', async function (this) {
  setTheoryAndPractice(this);

  await addEnrollmentToGroup(this as any);
});
export const EnrollmentModel: Model<Enrollment> = model<Enrollment>(
  'enrollments',
  enrollmentSchema,
);
