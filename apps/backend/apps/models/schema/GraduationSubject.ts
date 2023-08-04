import type { GraduationSubject } from './zod/GraduationSubjectSchema';
import { Schema, model } from 'mongoose';

const graduationSubjectSchema = new Schema<GraduationSubject>(
  {
    subject: {
      type: Schema.Types.ObjectId,
      ref: 'Subjects',
    },
    graduation: {
      type: Schema.Types.ObjectId,
      ref: 'Graduations',
    },
  },
  { timestamps: true },
);

graduationSubjectSchema.index({ graduation: 1 });

export const GraduationSubjectModel = model(
  'SubjectGraduations',
  graduationSubjectSchema,
);
