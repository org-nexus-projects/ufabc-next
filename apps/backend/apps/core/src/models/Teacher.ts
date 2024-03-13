import { type InferSchemaType, Schema, model } from 'mongoose';
import { camelCase, startCase } from 'lodash-es';
import { mongooseLeanVirtuals } from 'mongoose-lean-virtuals';

const teacherSchema = new Schema(
  {
    name: { type: String, required: true },
    alias: [String],
  },
  {
    timestamps: true,
  },
);

teacherSchema.plugin(mongooseLeanVirtuals);

teacherSchema.pre('save', function () {
  this.name = startCase(camelCase(this.name));
});

export type Teacher = InferSchemaType<typeof teacherSchema>;
export type TeacherDocument = ReturnType<(typeof TeacherModel)['hydrate']>;
export const TeacherModel = model('teachers', teacherSchema);
