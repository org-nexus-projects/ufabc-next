import { type InferSchemaType, Schema, model } from 'mongoose';

const graduationSchema = new Schema(
  {
    locked: {
      type: Boolean,
      default: false,
    },

    curso: String,
    grade: String,

    mandatory_credits_number: Number,
    limited_credits_number: Number,
    free_credits_number: Number,
    credits_total: Number,

    creditsBreakdown: [
      {
        year: Number,
        quad: Number,
        choosableCredits: Number,
      },
    ],
  },
  { timestamps: true },
);

graduationSchema.index({ curso: 'asc', grade: 'asc' });

export type Graduation = InferSchemaType<typeof graduationSchema>;
export type GraduationDocument = ReturnType<
  (typeof GraduationModel)['hydrate']
>;
export const GraduationModel = model('graduations', graduationSchema);
