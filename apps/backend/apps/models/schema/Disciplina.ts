import { Schema, model } from 'mongoose';
import { findQuarter } from '@ufabcnext/common';

const disciplinaSchema = new Schema(
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
  },
  { timestamps: true },
);

disciplinaSchema.virtual('requisicoes').get(function () {
  return (this.alunos_matriculados || []).length;
});

disciplinaSchema.index({ identifier: 1 });

disciplinaSchema.pre(
  'findOneAndUpdate',
  // eslint-disable-next-line
  function (this) {
    const disciplina = this.getUpdate();
    // @ts-ignore The season, come from the referenced tables
    if (!disciplina?.season) {
      const { year, quad } = findQuarter();
      this.year = year;
      this.quad = quad;
    }
  },
);

// eslint-disable-next-line
export const DisciplinaModel = model('Disciplinas', disciplinaSchema);
