import {
  type InferSchemaType,
  Schema,
  type UpdateQuery,
  model,
} from 'mongoose';
import { findQuarter } from '@next/common';
import { mongooseLeanVirtuals } from 'mongoose-lean-virtuals';

const COURSE_SHIFTS = ['Noturno', 'Matutino'] as const;

const studentSchema = new Schema(
  {
    ra: { type: Number, default: '-' },
    login: { type: String, required: true },
    aluno_id: { type: Number, required: true },
    cursos: [
      {
        id_curso: { type: Number, required: true },
        nome_curso: { type: String, required: true },
        cp: { type: Number, required: true },
        cr: { type: Number, required: true },
        ind_afinidade: { type: Number, required: true },
        turno: { type: String, required: true, enum: COURSE_SHIFTS },
      },
    ],
    year: Number,
    quad: {
      type: Number,
      min: 1,
      max: 3,
      default: null,
    },
    quads: { type: Number, required: false },
    season: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

function setQuarter(student: UpdateQuery<Student> | null) {
  const { year, quad } = findQuarter();
  if (!student) {
    return;
  }
  student.year = year;
  student.quad = quad;
}
studentSchema.plugin(mongooseLeanVirtuals);

studentSchema.pre('save', function () {
  if (!this.year || !this.quad) {
    setQuarter(this);
  }
});

studentSchema.pre('findOneAndUpdate', function () {
  // it's equivalent to this._update, but without type errors
  const updatedStudent: UpdateQuery<Student> | null = this.getUpdate();
  if (!updatedStudent?.quads) {
    setQuarter(updatedStudent);
  }
});

export type Student = InferSchemaType<typeof studentSchema>;
export type StudentDocument = ReturnType<(typeof StudentModel)['hydrate']>;
export const StudentModel = model('alunos', studentSchema);
