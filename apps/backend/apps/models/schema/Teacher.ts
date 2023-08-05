import { Schema, model } from 'mongoose';
import { startCase, camelCase } from 'lodash';

const teacherSchema = new Schema(
  {
    name: { type: String, required: true },
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
