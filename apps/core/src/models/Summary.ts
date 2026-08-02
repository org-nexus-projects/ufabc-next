import { type InferSchemaType, Schema, model } from 'mongoose';

const summarySchema = new Schema(
  {
    teacher: {
      type: Schema.Types.ObjectId,
      ref: 'teachers',
      required: true,
    },
    subject: {
      type: Schema.Types.ObjectId,
      ref: 'subjects',
      default: null,
      // null = resumo agregado do professor (único caso hoje).
      // reservado pra resumo por disciplina no futuro.
    },
    summary: { type: String, required: true },
    didacticQuality: { type: Boolean, default: null },
    takesAttendance: { type: Boolean, default: null },
    usesSigaa: { type: Boolean, default: null },
    usesMoodle: { type: Boolean, default: null },
    commentsCount: { type: Number, required: true },
    oldestComment: { type: Date, required: true },
    newestComment: { type: Date, required: true },
    model: { type: String, required: true },
    promptVersion: { type: String, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

// Mesmo índice já documentado em ufabc-next-ai/docs/sdd-comment-summary.md §8
summarySchema.index(
  { teacher: 1, subject: 1, status: 1, createdAt: -1 },
  { name: 'SummaryTeacherLookupIndex' }
);

export type Summary = InferSchemaType<typeof summarySchema>;
export type SummaryDocument = ReturnType<(typeof SummaryModel)['hydrate']>;
export const SummaryModel = model('summaries', summarySchema);
