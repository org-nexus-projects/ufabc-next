import { type InferSchemaType, Schema, model } from 'mongoose';
import { GroupModel } from './Group.js';

const COMMENT_TYPE = ['teoria', 'pratica'] as const;
const enrollmentSchema = new Schema(
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
    ra: {
      type: Number,
      required: true,
    },
    disciplina: {
      type: String,
      required: true,
    },
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
      required: false,
    },
    pratica: {
      type: Schema.Types.ObjectId,
      ref: 'teachers',
      required: false,
    },
    mainTeacher: {
      type: Schema.Types.ObjectId,
      ref: 'teachers',
      required: false,
    },
    comments: [
      {
        type: String,
        enum: COMMENT_TYPE,
      },
    ],
    syncedBy: {
      type: String,
      enum: ['extension', 'matricula', 'ufabc-parser'],
    },
    kind: {
      type: String,
      enum: ['ajuste', 'reajuste', 'auto'],
    },
    uf_cod_turma: {
      type: String,
      required: false,
      default: null,
    },
    // vem do portal
    conceito: String,
    creditos: Number,

    ca_acumulado: Number,
    cr_acumulado: Number,
    cp_acumulado: Number,
    season: {
      type: String,
      required: false,
    },
    disciplina_id: Number,
  },
  { timestamps: true }
);

function setTheoryAndPractice(update: { $set: Partial<Enrollment> }) {
  const enrollment = update.$set;

  if ('teoria' in enrollment || 'pratica' in enrollment) {
    const theoryTeacher = enrollment.teoria?._id ?? enrollment.teoria;
    const practiceTeacher = enrollment.pratica?._id ?? enrollment.pratica;
    enrollment.mainTeacher = theoryTeacher || practiceTeacher;
  }
}

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
      }
    );
  }
}

enrollmentSchema.index({ identifier: 'asc', ra: 'asc' });
enrollmentSchema.index({ ra: 'asc' });
enrollmentSchema.index({ conceito: 'asc' });
enrollmentSchema.index({
  mainTeacher: 'asc',
  subject: 'asc',
  cr_acumulado: 'asc',
  conceito: 'asc',
});

enrollmentSchema.pre('findOneAndUpdate', function () {
  const update = this.getUpdate();

  // @ts-ignore
  if (!update.$set) {
    // @ts-ignore
    update.$set = {};
  }

  // Your existing pre update logic
  // @ts-ignore
  setTheoryAndPractice(update);
});

enrollmentSchema.post('findOneAndUpdate', async function (doc) {
  if (doc) {
    await addEnrollmentToGroup(doc);
  }
});

export type Enrollment = InferSchemaType<typeof enrollmentSchema>;
export type EnrollmentDocument = ReturnType<
  (typeof EnrollmentModel)['hydrate']
>;
export const EnrollmentModel = model('enrollments', enrollmentSchema);
