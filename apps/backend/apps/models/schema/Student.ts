import { findQuarter } from '@ufabcnext/common';
import { Schema, model } from 'mongoose';

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

function setQuarter(doc: unknown) {
  const { year, quad } = findQuarter();
  doc.year = year;
  doc.quad = quad;
}

studentSchema.pre('save', function () {
  if (!this.year || !this.quad) {
    setQuarter(this);
  }
});

studentSchema.pre('findOneAndUpdate', function () {
  // it's equivalent to this._update, but without type errors
  const updatedStudent = this.getUpdate();
  if (!updatedStudent?.quads) {
    setQuarter(updatedStudent);
  }
});

export const StudentModel = model('alunos', studentSchema);
