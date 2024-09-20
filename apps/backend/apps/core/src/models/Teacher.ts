import { type InferSchemaType, Schema, model } from 'mongoose';
import { mongooseLeanVirtuals } from 'mongoose-lean-virtuals';
import stringSimilarity from 'string-similarity';

const teacherSchema = new Schema(
  {
    name: { type: String, required: true },
    alias: { type: [String], default: [] },
  },
  {
    timestamps: true,
    statics: {
      findByFuzzName: async function (name: string) {
        const exactMatch = await this.findOne({
          $or: [
            {
              name,
            },
            { alias: name },
          ],
        });

        if (exactMatch) {
          return exactMatch;
        }

        const teachers = await this.find({});
        const bestMatch = teachers.reduce<any>(
          (best, teacher) => {
            const similarity = Math.max(
              stringSimilarity.compareTwoStrings(name, teacher.name),
              ...teacher.alias.map((alias) =>
                stringSimilarity.compareTwoStrings(
                  name,
                  alias.toLowerCase().replace(/[^a-z]/g, ''),
                ),
              ),
            );
            return similarity > best.similarity
              ? { teacher, similarity }
              : best;
          },
          { teacher: null, similarity: 0 },
        );

        if (bestMatch.similarity > 0.8) {
          return bestMatch.teacher;
        }

        return null;
      },
    },
  },
);

teacherSchema.plugin(mongooseLeanVirtuals);

teacherSchema.pre('save', function (next) {
  if (this.isNew) {
    this.name = this.name.toLowerCase();
  }
  next();
});

export type Teacher = InferSchemaType<typeof teacherSchema>;
export type TeacherDocument = ReturnType<(typeof TeacherModel)['hydrate']>;
export const TeacherModel = model('teachers', teacherSchema);
