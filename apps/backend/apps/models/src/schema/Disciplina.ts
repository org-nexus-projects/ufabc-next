import {
  type InferSchemaType,
  Schema,
  Types,
  type UpdateQuery,
  model,
} from 'mongoose';
import { findQuarter } from '@next/common';

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
      type: Types.ObjectId,
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
    season: String,
    teoria: {
      type: Types.ObjectId,
      ref: 'teachers',
    },
    pratica: {
      type: Types.ObjectId,
      ref: 'teachers',
    },
  },
  {
    virtuals: {
      requisicoes: {
        get() {
          const students: number[] = this.alunos_matriculados ?? [];
          return students.length;
        },
      },
    },
    timestamps: true,
  },
);

function setQuarter(disciplina: UpdateQuery<Disciplina> | null) {
  const { year, quad } = findQuarter();
  if (!disciplina) {
    return;
  }
  disciplina.year = year;
  disciplina.quad = quad;
}

disciplinaSchema.index({ identifier: 'asc' });

disciplinaSchema.pre('findOneAndUpdate', function () {
  const updatedDisciplina: UpdateQuery<Disciplina> | null = this.getUpdate();
  if (!updatedDisciplina?.season) {
    setQuarter(updatedDisciplina);
  }
});

export type Disciplina = InferSchemaType<typeof disciplinaSchema>;
export type DisciplinaDocument = ReturnType<
  (typeof DisciplinaModel)['hydrate']
>;

export const DisciplinaModel = model('disciplinas', disciplinaSchema);
