import { Schema, model } from 'mongoose';

const graduationSubjectSchema = new Schema(
  {
    /** One of: mandatory, limited, free */
    category: String,
    /** How much confidence we have this is the right category */
    confidence: String,
    /** One of: firstLevelMandatory, secondLevelMandatory, thirdLevelMandatory */
    subcategory: String,

    creditos: Number,
    codigo: String,

    year: Number,
    quad: Number,

    /** Array of codes for equivalents */
    equivalents: [
      {
        type: String,
      },
    ],

    subject: {
      type: Schema.Types.ObjectId,
      ref: 'subjects',
    },

    graduation: {
      type: Schema.Types.ObjectId,
      ref: 'graduation',
    },
  },
  { timestamps: true },
);

graduationSubjectSchema.index({ graduation: 1 });

export const GraduationSubjectModel =
  // models['subjectgraduations'] ||
  model('subjectgraduations', graduationSubjectSchema);
