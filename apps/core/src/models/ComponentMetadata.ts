import { type InferSchemaType, Schema, model } from 'mongoose';

const disciplinasMetadataSchema = new Schema(
  {
    planejamento: {
      ementa: { type: String, required: true },
      objetivos: { type: String, required: true },
      metodologia: { type: String, required: true },
      avaliacao: { type: String, required: true },
    },
    cronograma: [
      {
        aula: { type: String, required: true },
        data: { type: String, required: true },
        _id: false,
      },
    ],
    metadata: {
      source_file: { type: String, required: true },
      processed_at: { type: String, required: true },
      disciplina_id: { type: Number, required: true },
      component_code: { type: String, required: true },
      component_data: {
        componentKey: { type: String, required: true },
        subjectKey: { type: String, required: true },
        name: { type: String, required: true },
        credits: { type: Number, required: true },
        ufComponentId: { type: Number, required: true },
        alternateUfabcComponentId: { type: String, required: false },
        ufComponentCode: { type: String, required: true },
        campus: { type: String, required: true },
        shift: { type: String, required: true },
        vacancies: { type: Number, required: true },
        componentClass: { type: String, required: true },
        season: { type: String, required: true },
        ufClassroomCode: { type: String, required: true },
        tpi: {
          theory: { type: Number, required: true },
          practice: { type: Number, required: true },
          individual: { type: Number, required: true },
          _id: false,
        },
        timetable: [
          {
            dayOfTheWeek: { type: String, required: true },
            startTime: { type: String, required: true },
            endTime: { type: String, required: true },
            periodicity: { type: String, required: false },
            classroomCode: { type: String, required: true },
            scheduleType: { type: String, required: true },
            frequency: { type: String, required: true },
            unparsed: { type: String, required: true },
            _id: false,
          },
        ],
        courses: [
          {
            category: { type: String, required: true },
            UFCourseId: { type: Number, required: true },
            _id: false,
          },
        ],
        teachers: [
          {
            name: { type: String, required: true },
            role: { type: String, required: true },
            isSecondary: { type: Boolean, required: true },
            _id: false,
          },
        ],
        _id: false,
      },
      _id: false,
    },
  },
  {
    timestamps: true,
  },
);


disciplinasMetadataSchema.index({ 'metadata.component_code': 'asc' });

export type ComponentMetadata = InferSchemaType<typeof disciplinasMetadataSchema>;
export type ComponentMetadataDocument = ReturnType<(typeof ComponentMetadataModel)['hydrate']>;

export const ComponentMetadataModel = model('disciplinas_metadata', disciplinasMetadataSchema, 'disciplinas_metadata');
