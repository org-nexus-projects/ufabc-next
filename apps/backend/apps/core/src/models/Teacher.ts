import { type InferSchemaType, Schema, model } from 'mongoose';
import stringSimilarity from 'string-similarity';

const normalizeName = (str: string) => {
  return (
    str
      .toLowerCase()
      .normalize('NFD')
      -ignore lint/suspicious/noMisleadingCharacterClass: not needed
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/\s+/g, ' ') // normalize spaces
      .trim()
  );
};

const teacherSchema = new Schema(
  {
    name: { type: String, required: true },
    alias: { type: [String], default: [] },
  },
  {
    timestamps: true,
    statics: {
      findByFuzzName: async function (name: string) {
        const normalizedName = normalizeName(name);

        // First try exact match
        const exactMatch = await this.findOne({
          $or: [{ name: normalizedName }, { alias: normalizedName }],
        });

        if (exactMatch) {
          return exactMatch;
        }

        // Then try text search with normalized name parts
        const nameParts = normalizedName.split(' ').filter(Boolean);
        const textSearchResults = await this.find(
          { $text: { $search: nameParts.join(' ') } },
          { score: { $meta: 'textScore' } },
        )
          .sort({ score: { $meta: 'textScore' } })
          .limit(5); // Get top 5 matches

        if (textSearchResults.length === 0) {
          return null;
        }

        // Compare normalized forms for best match
        const bestMatch = textSearchResults.reduce<any>(
          (best, teacher) => {
            const teacherNormalizedName = normalizeName(teacher.name);
            const similarity = stringSimilarity.compareTwoStrings(
              normalizedName,
              teacherNormalizedName,
            );

            // Also check aliases
            const aliasSimilarity = teacher.alias.reduce((max, alias) => {
              const aliasSim = stringSimilarity.compareTwoStrings(
                normalizedName,
                normalizeName(alias),
              );
              return Math.max(max, aliasSim);
            }, 0);

            const maxSimilarity = Math.max(similarity, aliasSimilarity);
            return maxSimilarity > best.similarity ? { teacher, similarity: maxSimilarity } : best;
          },
          { teacher: null, similarity: 0 },
        );

        // Lower threshold since we're already filtering via text search
        if (bestMatch.similarity > 0.6) {
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
