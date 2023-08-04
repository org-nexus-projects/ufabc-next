import { Schema, model } from 'mongoose';
import { startCase, camelCase } from 'lodash';

const subjectSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  search: String,
  creditos: Number
}, { timestamps: true })

subjectSchema.pre('save', function () {
  this.search = startCase(camelCase(this.name));
});

export const SubjectModel = model('subjects', subjectSchema)
