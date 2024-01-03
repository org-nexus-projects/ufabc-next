import {
  type InferSchemaType,
  Schema,
  type UpdateQuery,
  model,
} from 'mongoose';
import { findQuarter } from '@next/common';

const CAMPUS = ['sao bernardo', 'santo andre'] as const;

const disciplinaSchema = new Schema(
  {
    disciplina_id: { type: Number, required: true },
    disciplina: { type: String, required: true },
    turno: { type: String, required: true },
    turma: { type: String, required: true },
    vagas: { type: Number, required: true },
    obrigatorias: { type: [Number], default: [] },
    codigo: { type: String, required: true },
    campus: { type: String, enum: CAMPUS },
    ideal_quad: Boolean,
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
    year: { type: Number, required: true },
    quad: { type: Number, required: true },
    season: { type: String, required: true },

    subject: {
      type: Schema.Types.ObjectId,
      ref: 'subjects',
    },
    teoria: {
      type: Schema.Types.ObjectId,
      ref: 'teachers',
    },
    pratica: {
      type: Schema.Types.ObjectId,
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
