import {
  type InferSchemaType,
  Schema,
  type UpdateQuery,
  model,
} from 'mongoose';
import { findQuarter } from '@next/common';
import { mongooseLeanVirtuals } from 'mongoose-lean-virtuals';

const CAMPUS = ['sao bernardo', 'santo andre', 'sbc', 'sa'] as const;

const componentSchema = new Schema(
  {
    disciplina_id: { type: Number, required: true },
    disciplina: { type: String, required: true },
    turno: { type: String, required: true },
    turma: { type: String, required: true },
    vagas: { type: Number, required: true },
    obrigatorias: { type: [Number], default: [] },
    codigo: { type: String, required: true },
    campus: { type: String, enum: CAMPUS, required: true },
    ideal_quad: { type: { type: Boolean, default: false, required: true },
    identifier: {
      type: String,
      required: true,
    },
    // lista de alunos matriculados no momento
    alunos_matriculados: {
      type: [Number],
      default: [],
      required: true,
    },
    // como estava o estado da matrícula antes do chute
    before_kick: {
      type: [Number],
      default: [],
      required: true,
    },
    // como estava o estado da matrícula após o chute
    after_kick: {
      type: [Number],
      default: [],
      required: true,
    },
    year: { type: Number, required: true },
    quad: { type: Number, required: true },
    season: { type: String, required: true },
    subject: {
      type: Schema.Types.ObjectId,
      ref: 'subjects',
      required: true,
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

componentSchema.plugin(mongooseLeanVirtuals);

function setQuarter(component: UpdateQuery<Component> | null) {
  const { year, quad } = findQuarter();
  if (!component) {
    return;
  }
  component.year = year;
  component.quad = quad;
}

componentSchema.index({ identifier: 'asc' });

componentSchema.pre('findOneAndUpdate', function () {
  const updatedComponent: UpdateQuery<Component> | null = this.getUpdate();
  if (!updatedComponent?.season) {
    setQuarter(updatedComponent);
  }
});

export type Component = InferSchemaType<typeof componentSchema>;
export type ComponentDocument = ReturnType<(typeof DisciplinaModel)['hydrate']>;

export const DisciplinaModel = model('disciplinas', componentSchema);
