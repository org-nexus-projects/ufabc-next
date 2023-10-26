import {
  type InferSchemaType,
  Schema,
  type UpdateQuery,
  model,
} from 'mongoose';
import { findQuarter } from '@next/common';

const studentSchema = new Schema(
  {
    ra: Number,
    login: String,
    aluno_id: Number,
    cursos: [
      {
        id_curso: Number,
        nome_curso: String,
        cp: Number,
        cr: Number,
        ind_afinidade: Number,
        turno: String,
      },
    ],
    year: Number,
    quad: Number,
    quads: Number,
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
export const StudentModel = model<Student>('alunos', studentSchema);
