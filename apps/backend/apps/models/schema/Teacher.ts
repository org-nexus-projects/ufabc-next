import { Schema, model } from 'mongoose';
import { camelCase, startCase } from 'lodash-es';

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

teacherSchema.pre('save', function () {
  this.name = startCase(camelCase(this.name));
});

// models['teachers'] ||
export const TeacherModel = model<Teacher>('teachers', teacherSchema);
