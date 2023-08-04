import { Document, Schema, model } from 'mongoose';
import { get } from 'lodash';
import { Enrollment } from './zod/EnrollmentSchema';
import { GroupModel } from './Group';

type EnrollmentDocument = Document & Enrollment;

const enrollmentSchema = new Schema<Enrollment>(
  {
    subject: {
      type: Schema.Types.ObjectId,
      ref: 'Subjects',
    },
    teoria: {
      type: Schema.Types.ObjectId,
      ref: 'Teachers',
    },
    pratica: {
      type: Schema.Types.ObjectId,
      ref: 'Teachers',
    },
    mainTeacher: {
      type: Schema.Types.ObjectId,
      ref: 'Teachers',
    },

    identifier: String,
    ra: Number,
    disciplina: String,
    campus: String,
    season: String,
    turno: String,
    turma: String,
    comments: [String],
    ca_acumulado: Number,
    conceito: String,
    creditos: Number,
    cp_acumulado: Number,
    cr_acumulado: Number,
    year: Number,
    quad: Number,
  },
  { timestamps: true },
);

enrollmentSchema.index({ identifier: 1, ra: 1 });
enrollmentSchema.index({ ra: 1 });
enrollmentSchema.index({ conceito: 1 });
enrollmentSchema.index({
  mainTeacher: 1,
  subject: 1,
  cr_acumulado: 1,
  conceito: 1,
});

function setTheoryAndPractice(enrollment: EnrollmentDocument) {
  if ('teoria' in enrollment || 'teoria' in enrollment) {
    // TODO: refactor this in the morning
    enrollment.mainTeacher =
      get(enrollment, 'teoria._id', enrollment.teoria) ||
      get(enrollment, 'pratica._id', enrollment.teoria);
  }
}

enrollmentSchema.pre('save', async function (this: EnrollmentDocument) {
  setTheoryAndPractice(this);

  await addEnrollmentToGroup(this);
});

async function addEnrollmentToGroup(enrollment: EnrollmentDocument) {
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

export const EnrollmentModel = model('Enrollments', enrollmentSchema);
