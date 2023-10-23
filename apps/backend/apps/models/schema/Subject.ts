import { Schema, model } from 'mongoose';
import { camelCase, startCase } from 'lodash-es';

type Subject = {
  name: string;
  search: string;
  creditos: number;
};

const subjectSchema = new Schema<Subject>(
  {
    name: {
      type: String,
      required: true,
    },
    search: String,
    creditos: Number,
  },
  { timestamps: true },
);

subjectSchema.pre('save', function () {
  this.search = startCase(camelCase(this.name));
});
// models['subjects'] ||
export const SubjectModel = model<Subject>('subjects', subjectSchema);
