import { Schema, model, models } from 'mongoose';
import { startCase, camelCase } from 'lodash';

type Teacher = {
  name: string;
  alias: string[];
};

const teacherSchema = new Schema<Teacher>(
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

export const TeacherModel =
  models['teachers'] || model<Teacher>('teachers', teacherSchema);
