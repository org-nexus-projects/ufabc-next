import { Schema, model } from 'mongoose';
import type { InferSchemaType } from 'mongoose';

const disciplinasMetadataSchema = new Schema(
  {
    cronograma: [
      {
        _id: false,
        aula: { required: true, type: String },
        data: { required: true, type: String },
      },
    ],
    metadata: {
      _id: false,
      component_code: { required: true, type: String },
      component_data: {
        _id: false,
        alternateUfabcComponentId: { required: false, type: String },
        campus: { required: true, type: String },
        componentClass: { required: true, type: String },
        componentKey: { required: true, type: String },
        courses: [
          {
            UFCourseId: { required: true, type: Number },
            _id: false,
            category: { required: true, type: String },
          },
        ],
        credits: { required: true, type: Number },
        name: { required: true, type: String },
        season: { required: true, type: String },
        shift: { required: true, type: String },
        subjectKey: { required: true, type: String },
        teachers: [
          {
            _id: false,
            isSecondary: { required: true, type: Boolean },
            name: { required: true, type: String },
            role: { required: true, type: String },
          },
        ],
        timetable: [
          {
            _id: false,
            classroomCode: { required: true, type: String },
            dayOfTheWeek: { required: true, type: String },
            endTime: { required: true, type: String },
            frequency: { required: true, type: String },
            periodicity: { required: false, type: String },
            scheduleType: { required: true, type: String },
            startTime: { required: true, type: String },
            unparsed: { required: true, type: String },
          },
        ],
        tpi: {
          _id: false,
          individual: { required: true, type: Number },
          practice: { required: true, type: Number },
          theory: { required: true, type: Number },
        },
        ufClassroomCode: { required: true, type: String },
        ufComponentCode: { required: true, type: String },
        ufComponentId: { required: true, type: Number },
        vacancies: { required: true, type: Number },
      },
      disciplina_id: { required: true, type: Number },
      processed_at: { required: true, type: String },
      source_file: { required: true, type: String },
    },
    planejamento: {
      avaliacao: { required: true, type: String },
      ementa: { required: true, type: String },
      metodologia: { required: true, type: String },
      objetivos: { required: true, type: String },
    },
  },
  {
    timestamps: true,
  }
);

disciplinasMetadataSchema.index({ 'metadata.component_code': 'asc' });

export type ComponentMetadata = InferSchemaType<
  typeof disciplinasMetadataSchema
>;
export type ComponentMetadataDocument = ReturnType<
  (typeof ComponentMetadataModel)['hydrate']
>;

export const ComponentMetadataModel = model(
  'disciplinas_metadata',
  disciplinasMetadataSchema,
  'disciplinas_metadata'
);
