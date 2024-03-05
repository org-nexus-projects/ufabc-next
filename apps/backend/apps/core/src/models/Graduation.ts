import { type InferSchemaType, Schema, model } from 'mongoose';
import { mongooseLeanVirtuals } from 'mongoose-lean-virtuals';

const graduationSchema = new Schema(
  {
    locked: {
      type: Boolean,
      default: false,
    },

    curso: { type: String, required: true },
    grade: { type: String, required: true },

    mandatory_credits_number: { type: Number, required: true },
    limited_credits_number: { type: Number, required: true },
    free_credits_number: { type: Number, required: true },
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

graduationSchema.plugin(mongooseLeanVirtuals);

export type Graduation = InferSchemaType<typeof graduationSchema>;
export type GraduationDocument = ReturnType<
  (typeof GraduationModel)['hydrate']
>;
export const GraduationModel = model('graduations', graduationSchema);
