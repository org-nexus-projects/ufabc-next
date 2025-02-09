import { type InferSchemaType, Schema, model } from 'mongoose';

const COURSE_SHIFTS = ['Noturno', 'Matutino', 'noturno', 'matutino'] as const;

const coursesSchema = new Schema(
  {
    id_curso: { type: Number, required: true },
    nome_curso: { type: String, required: true },
    cp: { type: Number, required: false },
    cr: { type: Number, required: false },
    ca: { type: Number, required: false },
    ind_afinidade: { type: Number, required: true },
    turno: { type: String, required: true, enum: COURSE_SHIFTS },
  },
  { _id: false },
);

const studentSchema = new Schema(
  {
    ra: { type: Number },
    login: { type: String, required: true },
    aluno_id: { type: Number, required: false },
    cursos: [coursesSchema],
    year: { type: Number, required: false },
    quad: {
      type: Number,
      min: 1,
      max: 3,
      required: false,
    },
    quads: { type: Number, required: false },
    season: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

export type Student = InferSchemaType<typeof studentSchema>;
export type StudentDocument = ReturnType<(typeof StudentModel)['hydrate']>;
export const StudentModel = model('alunos', studentSchema);
