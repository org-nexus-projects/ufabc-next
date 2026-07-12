import { type InferSchemaType, Schema, model } from 'mongoose';

export const COURSE_SHIFTS = [
  'Noturno',
  'Matutino',
  'noturno',
  'matutino',
  'n',
  'm',
] as const;

const coursesSchema = new Schema(
  {
    ca: { required: false, type: Number },
    cp: { required: false, type: Number },
    cr: { required: false, type: Number },
    creditos_livres: { required: false, type: Number },
    creditos_obrigatorios: { required: false, type: Number },
    creditos_obtidos: { required: false, type: Number },
    creditos_optativos: { required: false, type: Number },
    id_curso: { required: false, type: Number },
    ind_afinidade: { required: true, type: Number },
    nome_curso: { required: true, type: String },
    turno: { enum: COURSE_SHIFTS, required: true, type: String },
  },
  { _id: false }
);

const studentSchema = new Schema(
  {
    aluno_id: { required: false, type: Number },
    cursos: [coursesSchema],
    login: { required: true, type: String },
    quad: {
      max: 3,
      min: 1,
      required: false,
      type: Number,
    },
    quads: { required: false, type: Number },
    ra: { required: true, type: Number },
    season: {
      required: true,
      type: String,
    },
    year: { required: false, type: Number },
  },
  { timestamps: true }
);

export type Student = InferSchemaType<typeof studentSchema>;
export type StudentDocument = ReturnType<(typeof StudentModel)['hydrate']>;
export type StudentCourse = InferSchemaType<typeof coursesSchema>;
export const StudentModel = model('alunos', studentSchema);
