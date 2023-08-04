import { Schema, model } from 'mongoose';
import type { GraduationHistory } from './zod/GraduationHistorySchema';

const graduationSchema = new Schema<GraduationHistory>(
  {
    graduation: {
      type: Schema.Types.ObjectId,
      ref: 'Graduations',
    },
  },
  { timestamps: true },
);

export const GraduationHistoryModel = model(
  'historiesgraduations',
  graduationSchema,
);
