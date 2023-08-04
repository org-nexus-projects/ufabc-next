import { Schema, model } from 'mongoose';
import { Graduation } from './zod/GraduationSchema';

const graduationSchema = new Schema<Graduation>(
  {
    locked: Boolean,
    curso: String,
    grade: String,

    mandatory_credits_number: Number,
    limited_credits_number: Number,
    free_credits_number: Number,
    credits_total: Number,

    creditsBreakdown: {
      type: [{ year: Number, quad: Number, choosableCredits: Number }],
    },
  },
  { timestamps: true },
);

graduationSchema.index({ curso: 1, grade: 1 });

export const GraduationModel = model('Graduations', graduationSchema);
