import { Schema, model } from 'mongoose';

const graduationSchema = new Schema(
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

export const GraduationHistoryModel = model(
  'historiesgraduations',
  graduationSchema,
);
