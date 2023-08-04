import { Schema, model } from 'mongoose';
import { startCase, camelCase } from 'lodash';

const teacherSchema = new Schema(
  {
    name: String,
    alias: [String],
  },
  {
    timestamps: true,
  },
);

teacherSchema.pre('save', async function () {
  this.name = startCase(camelCase(this.name));
});

export const TeacherModel = model('teachers', teacherSchema);
