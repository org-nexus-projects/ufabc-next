import { type InferSchemaType, Schema, model } from 'mongoose';
import { camelCase, startCase } from 'lodash-es';

const teacherSchema = new Schema(
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

export type Teacher = InferSchemaType<typeof teacherSchema>;
export const TeacherModel = model<Teacher>('teachers', teacherSchema);
