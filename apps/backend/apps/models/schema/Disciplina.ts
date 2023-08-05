import { Schema, model } from 'mongoose';
import { findQuarter } from '@ufabcnext/common';

const disciplinaSchema = new Schema(
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

disciplinaSchema.virtual('requisicoes').get(function () {
  return (this.alunos_matriculados || []).length;
});

disciplinaSchema.index({ identifier: 1 });

disciplinaSchema.pre(
  'findOneAndUpdate',
  // eslint-disable-next-line
  function (this) {
    const disciplina = this.getUpdate();
    // eslint-disable-next-line
    // @ts-ignore The season, come from the referenced tables
    if (!disciplina?.season) {
      const { year, quad } = findQuarter();
      this.year = year;
      this.quad = quad;
    }
  },
);

// eslint-disable-next-line
export const DisciplinaModel = model('disciplinas', disciplinaSchema);
