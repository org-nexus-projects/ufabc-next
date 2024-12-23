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
    },
    creditos: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

subjectSchema.index({ name: 1 }, { unique: true });

subjectSchema.pre('save', function () {
  this.search = startCase(camelCase(this.name));
});

export type Subject = InferSchemaType<typeof subjectSchema>;
export type SubjectDocument = ReturnType<(typeof SubjectModel)['hydrate']>;
export const SubjectModel = model('subjects', subjectSchema);
