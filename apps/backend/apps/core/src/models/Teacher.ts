import { type InferSchemaType, Schema, model } from 'mongoose';
import stringSimilarity from 'string-similarity';

const normalizeName = (str: string) => str.toLowerCase().replace(/[^a-z]/g, '');

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

        const normalizedSearchName = normalizeName(name);
        const teachers = await this.find({});

        const bestMatch = teachers.reduce<any>(
          (best, teacher) => {
            const nameMatch = stringSimilarity.compareTwoStrings(
              normalizedSearchName,
              normalizeName(teacher.name),
            );
            const aliasMatch = teacher.alias.reduce((maxSimilarity, alias) => {
              const similarity = stringSimilarity.compareTwoStrings(
                normalizedSearchName,
                normalizeName(alias),
              );
              return Math.max(maxSimilarity, similarity);
            }, 0);
            const similarity = Math.max(nameMatch, aliasMatch);
            return similarity > best.similarity
              ? { teacher, similarity }
              : best;
          },
          { teacher: null, similarity: 0 },
        );

        if (bestMatch.similarity > 0.8) {
          // You can adjust this threshold
          return bestMatch.teacher;
        }
        return null;
      },
    },
  },
);

teacherSchema.pre('save', function (next) {
  if (this.isNew) {
    this.name = this.name.toLowerCase();
  }
  next();
});

teacherSchema.index(
  {
    name: 'text',
    alias: 'text',
  },
  {
    weights: {
      name: 10, // Name matches are more important
      alias: 5, // Alias matches are less important
    },
    name: 'TeacherTextSearch',
  },
);

export type Teacher = InferSchemaType<typeof teacherSchema>;
export type TeacherDocument = ReturnType<(typeof TeacherModel)['hydrate']>;
export const TeacherModel = model('teachers', teacherSchema);
