import { Schema, model, models } from 'mongoose';

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

export const GraduationHistoryModel =
  models['historiesgraduations'] ||
  model('historiesgraduations', graduationSchema);
