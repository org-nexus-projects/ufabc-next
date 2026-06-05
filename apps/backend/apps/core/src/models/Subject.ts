import { camelCase, startCase } from 'lodash-es';
import { type InferSchemaType, Schema, model } from 'mongoose';

const subjectSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    search: {
      type: String,
      index: 'text',
      required: true,
    },
    uf_subject_code: {
      type: [String],
      required: true,
    },
    creditos: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

subjectSchema.pre('save', function () {
  this.search = startCase(camelCase(this.name));
});

subjectSchema.index({ uf_subject_code: 1 }, { unique: true, sparse: true });

export type Subject = InferSchemaType<typeof subjectSchema>;
export type SubjectDocument = ReturnType<(typeof SubjectModel)['hydrate']>;
export const SubjectModel = model('subjects', subjectSchema);
