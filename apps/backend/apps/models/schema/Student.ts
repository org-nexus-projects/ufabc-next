import { Student, StudentQuery } from '@ufabcnext/types';
import { findQuarter } from '@ufabcnext/common';
import { Schema, UpdateQuery, model } from 'mongoose';

const studentSchema = new Schema<Student>(
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

function setQuarter(student: UpdateQuery<Student>) {
  const { year, quad } = findQuarter();
  student.year = year;
  student.quad = quad;
}

studentSchema.pre('save', function () {
  if (!this.year || !this.quad) {
    setQuarter(this);
  }
});

studentSchema.pre('findOneAndUpdate', function (this: StudentQuery) {
  // it's equivalent to this._update, but without type errors
  const updatedStudent = this?.getUpdate() as UpdateQuery<Student>;
  if (!updatedStudent?.quads) {
    setQuarter(updatedStudent);
  }
});
// models['alunos'] ||
export const StudentModel = model<Student>('alunos', studentSchema);
