import { type InferSchemaType, Schema, model } from 'mongoose';

const CAMPUS = ['sao bernardo', 'santo andre', 'sbc', 'sa'] as const;

const componentSchema = new Schema(
  {
    disciplina_id: { type: Number, required: false, default: null },
    disciplina: { type: String, required: true },
    turno: { type: String, required: true, enum: ['diurno', 'noturno'] },
    turma: { type: String, required: true },
    vagas: { type: Number, required: true },
    obrigatorias: { type: [Number], default: [] },
    codigo: { type: String, required: true },
    campus: { type: String, enum: CAMPUS, required: true },
    ideal_quad: { type: Boolean, default: false, required: true },
    uf_cod_turma: { type: String, required: true },
    tpi: {
      type: [Number],
      required: true,
      default: [0, 0, 0], // tpi[0] = teoria, tpi[1] = pratica, tpi[2] = individual
      validate: {
        validator: (v: number[]) => v.length === 3,
        message: 'TPI must be an array of 3 numbers',
      },
    },
    identifier: {
      type: String,
      required: false,
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
    groupURL: {
      type: String,
      required: false,
      default: null,
    },
    kind: {
      type: String,
      enum: ['api', 'file'],
      default: 'api',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

componentSchema.index({ identifier: 'asc' });

export type Component = InferSchemaType<typeof componentSchema>;
export type ComponentDocument = ReturnType<(typeof ComponentModel)['hydrate']>;

export const ComponentModel = model('disciplinas', componentSchema);
