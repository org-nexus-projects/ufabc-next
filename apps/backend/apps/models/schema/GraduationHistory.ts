import { type InferSchemaType, Schema, Types, model } from 'mongoose';

const graduationHistorySchema = new Schema(
  {
    ra: Number,
    coefficients: Object,

    disciplinas: Object,

    curso: String,
    grade: String,
    graduation: {
      type: Types.ObjectId,
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
