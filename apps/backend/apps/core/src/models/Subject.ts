import { type InferSchemaType, Schema, model } from 'mongoose';
import { camelCase, startCase } from 'lodash-es';

const subjectSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    search: String,
    creditos: { type: Number },
  },
  { timestamps: true },
);

subjectSchema.pre('save', function () {
  this.search = startCase(camelCase(this.name));
});

export type Subject = InferSchemaType<typeof subjectSchema>;
export type SubjectDocument = ReturnType<(typeof SubjectModel)['hydrate']>;
export const SubjectModel = model('subjects', subjectSchema);
