import { type InferSchemaType, Schema, model } from 'mongoose';
import { mongooseLeanVirtuals } from 'mongoose-lean-virtuals';

const teacherSchema = new Schema(
  {
    name: { type: String, required: true },
    alias: { type: [String], default: [] },
  },
  {
    timestamps: true,
  },
);

teacherSchema.plugin(mongooseLeanVirtuals);

export type Teacher = InferSchemaType<typeof teacherSchema>;
export type TeacherDocument = ReturnType<(typeof TeacherModel)['hydrate']>;
export const TeacherModel = model('teachers', teacherSchema);
