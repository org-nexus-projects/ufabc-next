import { type InferSchemaType, Schema, model } from 'mongoose';

// TODO: refactor the shit out of this models

const graduationHistorySchema = new Schema(
  {
    ra: Number,
    coefficients: Object,

    disciplinas: Object,

    curso: String,
    grade: String,
    graduation: {
      type: Schema.Types.ObjectId,
      ref: 'graduation',
    },
  },
  { timestamps: true },
);

export type GraduationHistory = InferSchemaType<typeof graduationHistorySchema>;
export const GraduationHistoryModel = model(
  'historiesgraduations',
  graduationHistorySchema,
);
