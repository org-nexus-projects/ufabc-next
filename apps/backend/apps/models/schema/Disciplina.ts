import { Schema, UpdateQuery, model, models } from 'mongoose';
import { findQuarter } from '@ufabcnext/common';
import {
  Disciplina,
  DisciplinaModel as DisciplinaModelType,
  DisciplinaQuery,
  DisciplinaVirtuals,
} from '@ufabcnext/types';

const disciplinaSchema = new Schema<
  Disciplina,
  DisciplinaModelType,
  unknown,
  DisciplinaVirtuals
>(
  {
    disciplina_id: Number,
    disciplina: String,
    turno: String,
    turma: String,
    vagas: Number,
    obrigatorias: [Number],
    codigo: String,
    campus: String,
    ideal_quad: Boolean,

    subject: {
      type: Schema.Types.ObjectId,
      ref: 'subjects',
    },

    identifier: {
      type: String,
      required: true,
    },

    // lista de alunos matriculados no momento
    alunos_matriculados: {
      type: [Number],
      default: [],
    },

    // como estava o estado da matrícula antes do chute
    before_kick: {
      type: [Number],
      default: [],
    },

    // como estava o estado da matrícula após o chute
    after_kick: {
      type: [Number],
      default: [],
    },

    year: Number,
    quad: Number,

    teoria: {
      type: Schema.Types.ObjectId,
      ref: 'teachers',
    },
    pratica: {
      type: Schema.Types.ObjectId,
      ref: 'teachers',
    },
  },
  { timestamps: true },
);

function setQuarter(disciplina: UpdateQuery<Disciplina>) {
  const { year, quad } = findQuarter();
  disciplina.year = year;
  disciplina.quad = quad;
}

disciplinaSchema.virtual('requisicoes').get(function () {
  return (this.alunos_matriculados || []).length;
});

disciplinaSchema.index({ identifier: 1 });

disciplinaSchema.pre(
  'findOneAndUpdate',
  // eslint-disable-next-line
  function (this: DisciplinaQuery) {
    const updatedDisciplina = this.getUpdate() as UpdateQuery<Disciplina>;
    // eslint-disable-next-line
    // @ts-ignore The season, come from the referenced tables
    if (!updatedDisciplina?.season) {
      setQuarter(updatedDisciplina);
    }
  },
);

// eslint-disable-next-line
export const DisciplinaModel = models['disciplinas'] || model<Disciplina, DisciplinaModelType>(
  'disciplinas',
  disciplinaSchema,
);
